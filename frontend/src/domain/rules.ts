/**
 * Regras de negócio do NEXO.
 *
 * Funções puras: recebem dados e devolvem valores derivados. Não acessam armazenamento,
 * portanto continuam válidas quando a camada de dados for substituída (SharePoint,
 * PostgreSQL, Dataverse ou outra). A documentação de cada regra está em docs/REGRAS_DE_NEGOCIO.md.
 */
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import type {
  AppSettings,
  Homologation,
  HomologationStatus,
  Priority,
  ProgressRule,
  Project,
  ProjectInsight,
  ProjectTestStatus,
  Risk,
  RiskLevel,
  Scale,
  Severity,
  Task,
  TestCase,
  TestCaseView,
  TestExecution,
  TestMetrics,
  TestStatus,
} from '@/types'
import { isPast, toDate } from '@/utils/dates'

const PRIORITY_WEIGHT: Record<Priority, number> = { baixa: 1, media: 2, alta: 3, critica: 4 }

// ---------------- Tarefas ----------------

export function isTaskClosed(task: Task): boolean {
  return task.status === 'concluida' || task.status === 'cancelada'
}

export function isTaskOverdue(task: Task): boolean {
  return !isTaskClosed(task) && isPast(task.dueDate)
}

/**
 * Progresso do projeto calculado a partir das tarefas, conforme a regra configurada.
 * Tarefas canceladas não entram no cálculo. Sem tarefas válidas: 100 se o projeto
 * estiver concluído, senão 0.
 */
export function computeProjectProgress(project: Project, tasks: Task[], rule: ProgressRule): number {
  const valid = tasks.filter((t) => t.status !== 'cancelada')
  if (valid.length === 0) return project.status === 'concluido' ? 100 : 0
  const progressOf = (t: Task) => (t.status === 'concluida' ? 100 : Math.max(0, Math.min(100, t.progress)))

  switch (rule) {
    case 'tarefas_concluidas':
      return Math.round((valid.filter((t) => t.status === 'concluida').length / valid.length) * 100)
    case 'ponderada_prioridade': {
      const totalWeight = valid.reduce((s, t) => s + PRIORITY_WEIGHT[t.priority], 0)
      return Math.round(valid.reduce((s, t) => s + progressOf(t) * PRIORITY_WEIGHT[t.priority], 0) / totalWeight)
    }
    case 'media_simples':
    default:
      return Math.round(valid.reduce((s, t) => s + progressOf(t), 0) / valid.length)
  }
}

/** Percentual do prazo já decorrido (0–100). */
export function computeExpectedProgress(project: Project): number {
  const start = toDate(project.startDate)
  const end = toDate(project.endDate)
  if (!start || !end) return 0
  const total = differenceInCalendarDays(end, start)
  if (total <= 0) return 100
  const elapsed = differenceInCalendarDays(startOfDay(new Date()), start)
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)))
}

// ---------------- Projetos ----------------

export function isProjectClosed(project: Project): boolean {
  return project.status === 'concluido' || project.status === 'cancelado'
}

/** Atrasado: prazo final vencido e projeto ainda não encerrado. */
export function isProjectDelayed(project: Project): boolean {
  return !isProjectClosed(project) && isPast(project.endDate)
}

// ---------------- Riscos ----------------

/** Severidade = probabilidade × impacto (escala 1–25). */
export function riskScore(probability: Scale, impact: Scale): number {
  return probability * impact
}

export function computeSeverity(probability: Scale, impact: Scale): Severity {
  const score = riskScore(probability, impact)
  if (score >= 15) return 'critica'
  if (score >= 10) return 'alta'
  if (score >= 5) return 'media'
  return 'baixa'
}

export function isRiskOpen(risk: Risk): boolean {
  return risk.status === 'aberto' || risk.status === 'em_tratamento'
}

export function isRiskCritical(risk: Risk): boolean {
  const sev = computeSeverity(risk.probability, risk.impact)
  return isRiskOpen(risk) && (sev === 'critica' || sev === 'alta')
}

// ---------------- Testes ----------------

export function sortExecutions(executions: TestExecution[]): TestExecution[] {
  return [...executions].sort((a, b) => a.attempt - b.attempt)
}

/** O status de um caso de teste é o status da execução mais recente (ou "não iniciado"). */
export function buildTestCaseView(testCase: TestCase, executions: TestExecution[]): TestCaseView {
  const list = sortExecutions(executions.filter((e) => e.testCaseId === testCase.id))
  const latest = list[list.length - 1]
  const status: TestStatus = latest?.status ?? 'nao_iniciado'
  return {
    testCase,
    executions: list,
    latest,
    status,
    retestPending: !!latest && (latest.status === 'reprovado' || latest.status === 'bloqueado') && latest.needsRetest,
  }
}

export function computeTestMetrics(views: TestCaseView[]): TestMetrics {
  const byStatus: Record<TestStatus, number> = {
    nao_iniciado: 0,
    em_andamento: 0,
    aprovado: 0,
    reprovado: 0,
    bloqueado: 0,
    cancelado: 0,
  }
  views.forEach((v) => byStatus[v.status]++)
  const considered = views.length - byStatus.cancelado
  const executed = byStatus.aprovado + byStatus.reprovado + byStatus.bloqueado
  return {
    total: views.length,
    byStatus,
    executionRate: considered ? Math.round((executed / considered) * 100) : 0,
    approvalRate: considered ? Math.round((byStatus.aprovado / considered) * 100) : 0,
    openFailures: byStatus.reprovado,
    pendingRetests: views.filter((v) => v.retestPending).length,
  }
}

export function computeProjectTestStatus(project: Project, views: TestCaseView[]): ProjectTestStatus {
  if (!project.requiresTests) return 'nao_aplicavel'
  const active = views.filter((v) => v.status !== 'cancelado')
  if (active.length === 0 || active.every((v) => v.status === 'nao_iniciado')) return 'nao_iniciado'
  if (active.some((v) => v.status === 'reprovado')) return 'com_falhas'
  if (active.every((v) => v.status === 'aprovado')) return 'testes_concluidos'
  return 'em_execucao'
}

/**
 * Homologação: a última homologação registrada prevalece. Sem registro, o projeto fica
 * "aguardando" quando todos os testes foram aprovados ou quando o status do projeto é
 * "aguardando homologação"; caso contrário, "pendente".
 * Testes aprovados NÃO equivalem a homologação aprovada.
 */
export function computeHomologationStatus(
  project: Project,
  testStatus: ProjectTestStatus,
  homologations: Homologation[],
): HomologationStatus {
  if (!project.requiresTests) return 'nao_aplicavel'
  const latest = [...homologations]
    .filter((h) => h.projectId === project.id)
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt))
    .pop()
  if (latest && latest.result !== 'reprovada') return latest.result
  if (testStatus === 'testes_concluidos' || project.status === 'aguardando_homologacao') return 'aguardando'
  if (latest) return 'reprovada'
  return 'pendente'
}

// ---------------- Visão consolidada do projeto ----------------

export interface InsightInput {
  tasks: Task[]
  risks: Risk[]
  testCases: TestCase[]
  executions: TestExecution[]
  homologations: Homologation[]
  settings: AppSettings
}

/**
 * Nível de risco do projeto:
 * - Alto: projeto atrasado, risco aberto de severidade crítica, ou atraso de cronograma
 *   (progresso esperado − real) acima do limite configurado.
 * - Atenção: risco aberto de severidade alta, tarefas atrasadas/bloqueadas, falhas de teste
 *   abertas ou atraso de cronograma acima de metade do limite.
 * - Baixo: demais casos. Projetos encerrados são sempre "baixo".
 */
export function buildProjectInsight(project: Project, input: InsightInput): ProjectInsight {
  const tasks = input.tasks.filter((t) => t.projectId === project.id)
  const risks = input.risks.filter((r) => r.projectId === project.id)
  const views = input.testCases.filter((c) => c.projectId === project.id).map((c) => buildTestCaseView(c, input.executions))

  const progress = computeProjectProgress(project, tasks, input.settings.progressRule)
  const expectedProgress = computeExpectedProgress(project)
  const delayed = isProjectDelayed(project)
  const overdueTasks = tasks.filter(isTaskOverdue).length
  const blockedTasks = tasks.filter((t) => t.status === 'bloqueada').length
  const openRisks = risks.filter(isRiskOpen)
  const severities = openRisks.map((r) => computeSeverity(r.probability, r.impact))
  const criticalRisks = severities.filter((s) => s === 'critica').length
  const highRisks = severities.filter((s) => s === 'alta').length
  const testStatus = computeProjectTestStatus(project, views)
  const homologationStatus = computeHomologationStatus(project, testStatus, input.homologations)
  const gap = project.status === 'planejamento' ? 0 : expectedProgress - progress
  const threshold = input.settings.scheduleGapThreshold

  const reasons: string[] = []
  let level: RiskLevel = 'baixo'
  if (!isProjectClosed(project)) {
    if (delayed) reasons.push('Prazo final vencido')
    if (criticalRisks) reasons.push(`${criticalRisks} risco(s) crítico(s) aberto(s)`)
    if (gap > threshold) reasons.push(`Progresso ${gap} p.p. abaixo do esperado`)
    if (reasons.length) level = 'alto'

    const attention: string[] = []
    if (highRisks) attention.push(`${highRisks} risco(s) de severidade alta`)
    if (overdueTasks) attention.push(`${overdueTasks} tarefa(s) atrasada(s)`)
    if (blockedTasks) attention.push(`${blockedTasks} tarefa(s) bloqueada(s)`)
    if (testStatus === 'com_falhas') attention.push('Falhas de teste abertas')
    if (gap > threshold / 2 && gap <= threshold) attention.push(`Progresso ${gap} p.p. abaixo do esperado`)
    if (attention.length && level === 'baixo') level = 'medio'
    reasons.push(...attention)
  }

  return {
    project,
    progress,
    expectedProgress,
    delayed,
    overdueTasks,
    openRisks: openRisks.length,
    criticalRisks,
    riskLevel: level,
    riskReasons: reasons,
    testStatus,
    homologationStatus,
  }
}

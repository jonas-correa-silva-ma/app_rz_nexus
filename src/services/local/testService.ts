import type { EvidenceInput, TestService } from '@/services/contracts'
import type { Database, Evidence, Homologation, ID, Task, TestCase, TestExecution } from '@/types'
import { buildTestCaseView, computeProjectTestStatus, computeTestMetrics } from '@/domain/rules'
import { HOMOLOGATION_RESULTS, labelOf, PROJECT_STATUSES, TEST_STATUSES } from '@/config/labels'
import { nowIso, today } from '@/utils/dates'
import { newId } from '@/utils/format'
import { findOrThrow, localDb, logHistory } from './localDatabase'

function nextCaseCode(db: Database): string {
  const max = db.testCases.reduce((m, c) => Math.max(m, Number(c.code.replace(/\D/g, '')) || 0), 0)
  return `CT-${String(max + 1).padStart(3, '0')}`
}

function addEvidences(db: Database, target: { executionId?: ID; homologationId?: ID }, list: EvidenceInput[]): void {
  list.forEach((e) => db.evidences.push({ ...e, ...target, id: newId('evd'), createdAt: nowIso() }))
}

/**
 * Transições automáticas de status do projeto a partir dos testes:
 * - todos os casos ativos aprovados e projeto "em andamento" → "aguardando homologação";
 * - nova falha com projeto "aguardando homologação" → volta para "em andamento".
 */
function syncProjectStatusWithTests(db: Database, projectId: ID): void {
  const project = db.projects.find((p) => p.id === projectId)
  if (!project?.requiresTests) return
  const views = db.testCases.filter((c) => c.projectId === projectId).map((c) => buildTestCaseView(c, db.executions))
  const testStatus = computeProjectTestStatus(project, views)
  const before = project.status
  if (testStatus === 'testes_concluidos' && project.status === 'em_andamento') project.status = 'aguardando_homologacao'
  if (testStatus === 'com_falhas' && project.status === 'aguardando_homologacao') project.status = 'em_andamento'
  if (before !== project.status) {
    project.updatedAt = nowIso()
    logHistory(
      db,
      projectId,
      'Status alterado automaticamente',
      `${labelOf(PROJECT_STATUSES, before)} → ${labelOf(PROJECT_STATUSES, project.status)} (resultado dos testes)`,
    )
  }
}

export const localTestService: TestService = {
  async listCases(filter) {
    return localDb.read((db) =>
      db.testCases
        .filter((c) => !filter?.projectId || c.projectId === filter.projectId)
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((c) => buildTestCaseView(c, db.executions)),
    )
  },

  async createCase(input) {
    return localDb.write((db) => {
      findOrThrow(db.projects, input.projectId, 'Projeto')
      const now = nowIso()
      const testCase: TestCase = {
        ...input,
        code: input.code?.trim() || nextCaseCode(db),
        id: newId('tc'),
        createdAt: now,
        updatedAt: now,
      }
      db.testCases.push(testCase)
      logHistory(db, testCase.projectId, 'Caso de teste cadastrado', `${testCase.code} — ${testCase.name}`)
      syncProjectStatusWithTests(db, testCase.projectId)
      return testCase
    })
  },

  async updateCase(id, patch) {
    return localDb.write((db) => {
      const testCase = findOrThrow(db.testCases, id, 'Caso de teste')
      Object.assign(testCase, patch, { updatedAt: nowIso() })
      return testCase
    })
  },

  async removeCase(id) {
    localDb.write((db) => {
      const testCase = findOrThrow(db.testCases, id, 'Caso de teste')
      const execIds = new Set(db.executions.filter((e) => e.testCaseId === id).map((e) => e.id))
      db.testCases = db.testCases.filter((c) => c.id !== id)
      db.executions = db.executions.filter((e) => e.testCaseId !== id)
      db.evidences = db.evidences.filter((e) => !(e.executionId && execIds.has(e.executionId)))
      logHistory(db, testCase.projectId, 'Caso de teste excluído', `${testCase.code} — ${testCase.name}`)
      syncProjectStatusWithTests(db, testCase.projectId)
    })
  },

  async recordExecution(input) {
    return localDb.write((db) => {
      const testCase = findOrThrow(db.testCases, input.testCaseId, 'Caso de teste')
      const attempt = db.executions.filter((e) => e.testCaseId === testCase.id).reduce((m, e) => Math.max(m, e.attempt), 0) + 1
      const execution: TestExecution = {
        id: newId('exe'),
        testCaseId: testCase.id,
        attempt,
        executorId: input.executorId,
        date: input.date,
        expectedResult: testCase.expectedResult,
        actualResult: input.actualResult,
        status: input.status,
        comments: input.comments,
        needsRetest: input.needsRetest,
        correctiveTaskId: input.relatedTaskId,
        createdAt: nowIso(),
      }

      const failed = input.status === 'reprovado' || input.status === 'bloqueado'
      if (failed && input.correctiveTask) {
        const now = nowIso()
        const task: Task = {
          id: newId('tsk'),
          projectId: testCase.projectId,
          name: input.correctiveTask.name,
          description: `Correção da falha no caso ${testCase.code} (tentativa ${attempt}).\nResultado obtido: ${input.actualResult}`,
          assigneeId: input.correctiveTask.assigneeId,
          priority: input.correctiveTask.priority,
          status: 'nao_iniciada',
          startDate: today(),
          dueDate: input.correctiveTask.dueDate,
          progress: 0,
          notes: '',
          sourceExecutionId: execution.id,
          createdAt: now,
          updatedAt: now,
        }
        db.tasks.push(task)
        execution.correctiveTaskId = task.id
        logHistory(db, testCase.projectId, 'Tarefa corretiva criada', `${task.name} (falha em ${testCase.code})`)
      }

      db.executions.push(execution)
      addEvidences(db, { executionId: execution.id }, input.evidences)
      logHistory(
        db,
        testCase.projectId,
        'Execução de teste registrada',
        `${testCase.code} — tentativa ${attempt}: ${labelOf(TEST_STATUSES, execution.status)}`,
      )
      syncProjectStatusWithTests(db, testCase.projectId)
      return execution
    })
  },

  async listEvidences(filter) {
    return localDb.read((db) =>
      db.evidences.filter(
        (e) =>
          (filter.executionId && e.executionId === filter.executionId) ||
          (filter.homologationId && e.homologationId === filter.homologationId),
      ),
    )
  },

  async addEvidence(target, input) {
    return localDb.write((db) => {
      const evidence: Evidence = { ...input, ...target, id: newId('evd'), createdAt: nowIso() }
      db.evidences.push(evidence)
      return evidence
    })
  },

  async removeEvidence(id) {
    localDb.write((db) => {
      db.evidences = db.evidences.filter((e) => e.id !== id)
    })
  },

  async listHomologations(filter) {
    return localDb.read((db) =>
      db.homologations
        .filter((h) => !filter?.projectId || h.projectId === filter.projectId)
        .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)),
    )
  },

  async registerHomologation(input) {
    return localDb.write((db) => {
      const project = findOrThrow(db.projects, input.projectId, 'Projeto')
      const { evidences, completeProject, ...data } = input
      const homologation: Homologation = { ...data, id: newId('hom'), createdAt: nowIso() }
      db.homologations.push(homologation)
      addEvidences(db, { homologationId: homologation.id }, evidences)
      logHistory(db, project.id, 'Homologação registrada', `Resultado: ${labelOf(HOMOLOGATION_RESULTS, homologation.result)}`)

      const before = project.status
      if (homologation.result !== 'reprovada' && completeProject) {
        project.status = 'concluido'
        project.completedAt = nowIso()
      } else if (homologation.result === 'reprovada' && project.status === 'aguardando_homologacao') {
        project.status = 'em_andamento'
      }
      if (before !== project.status) {
        project.updatedAt = nowIso()
        logHistory(
          db,
          project.id,
          'Status alterado',
          `${labelOf(PROJECT_STATUSES, before)} → ${labelOf(PROJECT_STATUSES, project.status)} (homologação)`,
        )
      }
      return homologation
    })
  },

  async metrics(filter) {
    return localDb.read((db) =>
      computeTestMetrics(
        db.testCases
          .filter((c) => !filter?.projectId || c.projectId === filter.projectId)
          .map((c) => buildTestCaseView(c, db.executions)),
      ),
    )
  },
}

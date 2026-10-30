import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DashboardData, DashboardFilter, DashboardService } from '@/services/contracts'
import type { Database, Project } from '@/types'
import { buildTestCaseView, computeSeverity, isRiskOpen, isTaskOverdue } from '@/domain/rules'
import { PRIORITIES, PROJECT_STATUSES, SEVERITIES, TASK_STATUSES, TEST_STATUSES } from '@/config/labels'
import { toDate } from '@/utils/dates'
import { localDb } from './localDatabase'
import { insightsOf } from './projectService'

function periodWindow(period: DashboardFilter['period']): [Date, Date] | undefined {
  const now = new Date()
  switch (period) {
    case '30d':
      return [subDays(now, 30), now]
    case '90d':
      return [subDays(now, 90), now]
    case '12m':
      return [subMonths(now, 12), now]
    case 'ano':
      return [startOfYear(now), endOfYear(now)]
    default:
      return undefined
  }
}

/** Um projeto entra no período quando sua vigência (início–término) se sobrepõe à janela. */
function filterProjects(db: Database, filter: DashboardFilter): Project[] {
  const window = periodWindow(filter.period)
  return db.projects.filter((p) => {
    if (filter.managerId && p.managerId !== filter.managerId) return false
    if (filter.status && p.status !== filter.status) return false
    if (window) {
      const start = toDate(p.startDate)
      const end = toDate(p.endDate)
      if (!start || !end || start > window[1] || end < window[0]) return false
    }
    return true
  })
}

export function computeDashboard(db: Database, filter: DashboardFilter): DashboardData {
  const projects = filterProjects(db, filter)
  const ids = new Set(projects.map((p) => p.id))
  const insights = insightsOf(db, projects)
  const tasks = db.tasks.filter((t) => ids.has(t.projectId))
  const risks = db.risks.filter((r) => ids.has(r.projectId) && isRiskOpen(r))
  const views = db.testCases.filter((c) => ids.has(c.projectId)).map((c) => buildTestCaseView(c, db.executions))

  const months = Array.from({ length: 12 }, (_, i) => subMonths(startOfMonth(new Date()), 11 - i))
  const evolution = months.map((m) => {
    const end = endOfMonth(m)
    const started = projects.filter((p) => (toDate(p.startDate) ?? end) <= end).length
    const done = projects.filter((p) => p.completedAt && (toDate(p.completedAt) ?? end) <= end).length
    return { month: format(m, 'MMM/yy', { locale: ptBR }), iniciados: started, concluidos: done, emAberto: started - done }
  })

  const rank = { alto: 0, medio: 1, baixo: 2 }

  return {
    insights,
    kpis: {
      totalProjects: projects.length,
      inProgress: projects.filter((p) => p.status === 'em_andamento').length,
      completed: projects.filter((p) => p.status === 'concluido').length,
      delayed: insights.filter((i) => i.delayed).length,
      atRisk: insights.filter((i) => i.riskLevel === 'alto').length,
      totalTasks: tasks.length,
      overdueTasks: tasks.filter(isTaskOverdue).length,
      completedTasks: tasks.filter((t) => t.status === 'concluida').length,
      pendingTests: views.filter((v) => ['nao_iniciado', 'em_andamento', 'bloqueado'].includes(v.status)).length,
      failedTests: views.filter((v) => v.status === 'reprovado').length,
      awaitingHomologation: insights.filter((i) => i.homologationStatus === 'aguardando').length,
    },
    projectsByStatus: PROJECT_STATUSES.map((s) => ({
      key: s.label,
      value: projects.filter((p) => p.status === s.value).length,
    })).filter((x) => x.value > 0),
    projectsByPriority: PRIORITIES.map((s) => ({ key: s.label, value: projects.filter((p) => p.priority === s.value).length })),
    evolution,
    tasksByStatus: TASK_STATUSES.map((s) => ({ key: s.label, value: tasks.filter((t) => t.status === s.value).length })),
    risksBySeverity: SEVERITIES.map((s) => {
      const list = risks.filter((r) => computeSeverity(r.probability, r.impact) === s.value)
      return {
        key: s.label,
        risco: list.filter((r) => r.type === 'risco').length,
        problema: list.filter((r) => r.type === 'problema').length,
        impedimento: list.filter((r) => r.type === 'impedimento').length,
        pendencia: list.filter((r) => r.type === 'pendencia').length,
      }
    }),
    testsByStatus: TEST_STATUSES.map((s) => ({ key: s.label, value: views.filter((v) => v.status === s.value).length })),
    attention: insights
      .filter((i) => i.riskLevel !== 'baixo')
      .sort((a, b) => rank[a.riskLevel] - rank[b.riskLevel] || a.project.endDate.localeCompare(b.project.endDate))
      .slice(0, 8),
  }
}

export const localDashboardService: DashboardService = {
  async get(filter) {
    return localDb.read((db) => computeDashboard(db, filter))
  },
}

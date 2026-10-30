import type { ProjectService, ProjectInput } from '@/services/contracts'
import type { Database, Project } from '@/types'
import { buildProjectInsight } from '@/domain/rules'
import { labelOf, PROJECT_STATUSES } from '@/config/labels'
import { nowIso } from '@/utils/dates'
import { newId } from '@/utils/format'
import { findOrThrow, localDb, logHistory } from './localDatabase'

function nextCode(db: Database): string {
  const year = new Date().getFullYear()
  const prefix = `PRJ-${year}-`
  const max = db.projects
    .filter((p) => p.code.startsWith(prefix))
    .reduce((m, p) => Math.max(m, Number(p.code.slice(prefix.length)) || 0), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export function insightsOf(db: Database, projects = db.projects) {
  return projects.map((p) =>
    buildProjectInsight(p, {
      tasks: db.tasks,
      risks: db.risks,
      testCases: db.testCases,
      executions: db.executions,
      homologations: db.homologations,
      settings: db.settings,
    }),
  )
}

const FIELD_LABELS: Partial<Record<keyof Project, string>> = {
  name: 'nome',
  priority: 'prioridade',
  endDate: 'prazo final',
  startDate: 'data de início',
  managerId: 'gerente',
  requiresTests: 'exigência de testes',
  testConfig: 'configuração de testes',
}

export const localProjectService: ProjectService = {
  async list() {
    return localDb.read((db) => db.projects)
  },

  async get(id) {
    return localDb.read((db) => db.projects.find((p) => p.id === id))
  },

  async create(input: ProjectInput) {
    return localDb.write((db) => {
      const now = nowIso()
      const project: Project = {
        ...input,
        code: input.code?.trim() || nextCode(db),
        id: newId('prj'),
        completedAt: input.status === 'concluido' ? now : undefined,
        createdAt: now,
        updatedAt: now,
      }
      db.projects.push(project)
      logHistory(db, project.id, 'Projeto criado', `Status inicial: ${labelOf(PROJECT_STATUSES, project.status)}`)
      return project
    })
  },

  async update(id, patch) {
    return localDb.write((db) => {
      const project = findOrThrow(db.projects, id, 'Projeto')
      const before = { ...project }
      Object.assign(project, patch, { updatedAt: nowIso() })

      if (patch.status && patch.status !== before.status) {
        project.completedAt = patch.status === 'concluido' ? nowIso() : undefined
        logHistory(
          db,
          id,
          'Status alterado',
          `${labelOf(PROJECT_STATUSES, before.status)} → ${labelOf(PROJECT_STATUSES, patch.status)}`,
        )
      }
      const changed = (Object.keys(FIELD_LABELS) as (keyof Project)[]).filter(
        (k) => k in patch && JSON.stringify(before[k]) !== JSON.stringify(project[k]),
      )
      if (changed.length) logHistory(db, id, 'Projeto editado', `Campos alterados: ${changed.map((k) => FIELD_LABELS[k]).join(', ')}`)
      return project
    })
  },

  async remove(id) {
    localDb.write((db) => {
      findOrThrow(db.projects, id, 'Projeto')
      const caseIds = new Set(db.testCases.filter((c) => c.projectId === id).map((c) => c.id))
      const execIds = new Set(db.executions.filter((e) => caseIds.has(e.testCaseId)).map((e) => e.id))
      const homIds = new Set(db.homologations.filter((h) => h.projectId === id).map((h) => h.id))
      db.projects = db.projects.filter((p) => p.id !== id)
      db.projects.forEach((p) => (p.dependencyIds = p.dependencyIds.filter((d) => d !== id)))
      db.tasks = db.tasks.filter((t) => t.projectId !== id)
      db.risks = db.risks.filter((r) => r.projectId !== id)
      db.testCases = db.testCases.filter((c) => c.projectId !== id)
      db.executions = db.executions.filter((e) => !execIds.has(e.id))
      db.evidences = db.evidences.filter(
        (e) => !(e.executionId && execIds.has(e.executionId)) && !(e.homologationId && homIds.has(e.homologationId)),
      )
      db.homologations = db.homologations.filter((h) => h.projectId !== id)
      db.documents = db.documents.filter((d) => d.projectId !== id)
      db.updates = db.updates.filter((u) => u.projectId !== id)
      db.history = db.history.filter((h) => h.projectId !== id)
    })
  },

  async insights() {
    return localDb.read((db) => insightsOf(db))
  },

  async insight(id) {
    return localDb.read((db) => {
      const p = db.projects.find((x) => x.id === id)
      return p ? insightsOf(db, [p])[0] : undefined
    })
  },

  async history(projectId) {
    return localDb.read((db) =>
      db.history.filter((h) => h.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date)),
    )
  },
}

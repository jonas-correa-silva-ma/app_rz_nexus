import type { TaskService } from '@/services/contracts'
import type { Task } from '@/types'
import { labelOf, TASK_STATUSES } from '@/config/labels'
import { nowIso } from '@/utils/dates'
import { newId } from '@/utils/format'
import { findOrThrow, localDb, logHistory } from './localDatabase'

/** Mantém status e percentual coerentes entre si. */
function normalizeTask(task: Task): void {
  task.progress = Math.max(0, Math.min(100, Math.round(task.progress)))
  if (task.status === 'concluida') task.progress = 100
}

export const localTaskService: TaskService = {
  async list(filter) {
    return localDb.read((db) => db.tasks.filter((t) => !filter?.projectId || t.projectId === filter.projectId))
  },

  async create(input) {
    return localDb.write((db) => {
      findOrThrow(db.projects, input.projectId, 'Projeto')
      const now = nowIso()
      const task: Task = { ...input, id: newId('tsk'), createdAt: now, updatedAt: now }
      normalizeTask(task)
      db.tasks.push(task)
      logHistory(db, task.projectId, 'Tarefa criada', task.name)
      return task
    })
  },

  async update(id, patch) {
    return localDb.write((db) => {
      const task = findOrThrow(db.tasks, id, 'Tarefa')
      const before = { ...task }
      Object.assign(task, patch, { updatedAt: nowIso() })
      normalizeTask(task)
      if (before.status !== task.status) {
        logHistory(
          db,
          task.projectId,
          'Status de tarefa alterado',
          `${task.name}: ${labelOf(TASK_STATUSES, before.status)} → ${labelOf(TASK_STATUSES, task.status)}`,
        )
      } else if (before.assigneeId !== task.assigneeId) {
        const name = db.people.find((p) => p.id === task.assigneeId)?.name ?? '—'
        logHistory(db, task.projectId, 'Responsável de tarefa alterado', `${task.name}: ${name}`)
      }
      return task
    })
  },

  async remove(id) {
    localDb.write((db) => {
      const task = findOrThrow(db.tasks, id, 'Tarefa')
      db.tasks = db.tasks.filter((t) => t.id !== id)
      db.executions.forEach((e) => {
        if (e.correctiveTaskId === id) e.correctiveTaskId = undefined
      })
      logHistory(db, task.projectId, 'Tarefa excluída', task.name)
    })
  },
}

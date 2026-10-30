import type { RiskService } from '@/services/contracts'
import type { Risk } from '@/types'
import { labelOf, RISK_STATUSES, RISK_TYPES } from '@/config/labels'
import { nowIso } from '@/utils/dates'
import { newId } from '@/utils/format'
import { findOrThrow, localDb, logHistory } from './localDatabase'

export const localRiskService: RiskService = {
  async list(filter) {
    return localDb.read((db) => db.risks.filter((r) => !filter?.projectId || r.projectId === filter.projectId))
  },

  async create(input) {
    return localDb.write((db) => {
      findOrThrow(db.projects, input.projectId, 'Projeto')
      const now = nowIso()
      const risk: Risk = { ...input, id: newId('rsk'), createdAt: now, updatedAt: now }
      db.risks.push(risk)
      logHistory(db, risk.projectId, `${labelOf(RISK_TYPES, risk.type)} registrado(a)`, risk.description)
      return risk
    })
  },

  async update(id, patch) {
    return localDb.write((db) => {
      const risk = findOrThrow(db.risks, id, 'Registro')
      const before = risk.status
      Object.assign(risk, patch, { updatedAt: nowIso() })
      if (before !== risk.status) {
        logHistory(
          db,
          risk.projectId,
          `${labelOf(RISK_TYPES, risk.type)}: status alterado`,
          `${risk.description} — ${labelOf(RISK_STATUSES, before)} → ${labelOf(RISK_STATUSES, risk.status)}`,
        )
      }
      return risk
    })
  },

  async remove(id) {
    localDb.write((db) => {
      const risk = findOrThrow(db.risks, id, 'Registro')
      db.risks = db.risks.filter((r) => r.id !== id)
      logHistory(db, risk.projectId, `${labelOf(RISK_TYPES, risk.type)} excluído(a)`, risk.description)
    })
  },
}

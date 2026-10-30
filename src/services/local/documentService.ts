import type { DocumentService, UpdateService } from '@/services/contracts'
import type { DocumentRecord, ProjectUpdate } from '@/types'
import { nowIso } from '@/utils/dates'
import { newId } from '@/utils/format'
import { findOrThrow, localDb, logHistory } from './localDatabase'

export const localDocumentService: DocumentService = {
  async list(filter) {
    return localDb.read((db) =>
      db.documents
        .filter((d) => !filter?.projectId || d.projectId === filter.projectId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  },

  async create(input) {
    return localDb.write((db) => {
      findOrThrow(db.projects, input.projectId, 'Projeto')
      const doc: DocumentRecord = { ...input, id: newId('doc'), createdAt: nowIso() }
      db.documents.push(doc)
      logHistory(db, doc.projectId, 'Documento incluído', `${doc.type}: ${doc.title}`)
      return doc
    })
  },

  async update(id, patch) {
    return localDb.write((db) => {
      const doc = findOrThrow(db.documents, id, 'Documento')
      Object.assign(doc, patch)
      return doc
    })
  },

  async remove(id) {
    localDb.write((db) => {
      const doc = findOrThrow(db.documents, id, 'Documento')
      db.documents = db.documents.filter((d) => d.id !== id)
      logHistory(db, doc.projectId, 'Documento excluído', doc.title)
    })
  },
}

export const localUpdateService: UpdateService = {
  async list(filter) {
    return localDb.read((db) =>
      db.updates
        .filter((u) => !filter?.projectId || u.projectId === filter.projectId)
        .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)),
    )
  },

  async create(input) {
    return localDb.write((db) => {
      findOrThrow(db.projects, input.projectId, 'Projeto')
      const update: ProjectUpdate = { ...input, id: newId('upd'), createdAt: nowIso() }
      db.updates.push(update)
      logHistory(db, update.projectId, 'Atualização de andamento registrada', update.summary)
      return update
    })
  },

  async remove(id) {
    localDb.write((db) => {
      findOrThrow(db.updates, id, 'Atualização')
      db.updates = db.updates.filter((u) => u.id !== id)
    })
  },
}

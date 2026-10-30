/**
 * Armazenamento PROVISÓRIO do protótipo, baseado em localStorage.
 *
 * Adequado apenas para demonstração em um único navegador: não há concorrência,
 * controle de acesso, backup nem compartilhamento entre usuários. Não deve ser usado
 * em produção. Será substituído pela fonte de dados definitiva.
 */
import type { Database, HistoryEntry, ID } from '@/types'
import { createSeedDatabase, SEED_VERSION } from '@/mocks/seed'
import { notifyDataChanged } from '@/services/events'
import { nowIso } from '@/utils/dates'
import { newId } from '@/utils/format'

const STORAGE_KEY = 'nexo:prototype:db'

function emptyDatabase(seed: Database): Database {
  return {
    ...seed,
    projects: [],
    tasks: [],
    risks: [],
    testCases: [],
    executions: [],
    evidences: [],
    homologations: [],
    documents: [],
    updates: [],
    history: [],
  }
}

class LocalDatabase {
  private db: Database

  constructor() {
    this.db = this.load()
  }

  private load(): Database {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Database
        if (parsed.version === SEED_VERSION) return parsed
      }
    } catch {
      // dados corrompidos ou indisponíveis: recomeça com a demonstração
    }
    const seed = createSeedDatabase()
    this.persist(seed)
    return seed
  }

  private persist(db: Database): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
        throw new Error(
          'O armazenamento local do navegador está cheio. Remova anexos grandes ou restaure os dados de demonstração.',
        )
      }
      throw err
    }
  }

  /** Leitura: devolve uma cópia para que a interface nunca altere o estado diretamente. */
  read<T>(fn: (db: Database) => T): T {
    return structuredClone(fn(this.db))
  }

  /** Gravação atômica: aplica a alteração em uma cópia, persiste e só então a adota. */
  write<T>(fn: (db: Database) => T): T {
    const draft = structuredClone(this.db)
    const result = fn(draft)
    this.persist(draft)
    this.db = draft
    notifyDataChanged()
    return structuredClone(result)
  }

  reset(): void {
    const seed = createSeedDatabase()
    this.persist(seed)
    this.db = seed
    notifyDataChanged()
  }

  clear(): void {
    const empty = emptyDatabase(createSeedDatabase())
    empty.settings = this.db.settings
    this.persist(empty)
    this.db = empty
    notifyDataChanged()
  }

  usedBytes(): number {
    return (localStorage.getItem(STORAGE_KEY)?.length ?? 0) * 2
  }
}

export const localDb = new LocalDatabase()

/** Registra um evento no histórico do projeto (auditoria simplificada). */
export function logHistory(db: Database, projectId: ID, action: string, detail = ''): void {
  const entry: HistoryEntry = {
    id: newId('his'),
    projectId,
    date: nowIso(),
    actorId: db.settings.currentUserId,
    action,
    detail,
  }
  db.history.push(entry)
}

export function findOrThrow<T extends { id: ID }>(list: T[], id: ID, entity: string): T {
  const item = list.find((x) => x.id === id)
  if (!item) throw new Error(`${entity} não encontrado(a).`)
  return item
}

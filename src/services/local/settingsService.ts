import type { FileService, PersonService, SettingsService } from '@/services/contracts'
import type { FileRef } from '@/types'
import { localDb } from './localDatabase'

/** Arquivos até este tamanho são guardados no navegador; acima disso a associação é simulada. */
export const MAX_INLINE_FILE_BYTES = 512 * 1024

export const localPersonService: PersonService = {
  async list() {
    return localDb.read((db) => [...db.people].sort((a, b) => a.name.localeCompare(b.name)))
  },
}

export const localSettingsService: SettingsService = {
  async get() {
    return localDb.read((db) => db.settings)
  },

  async update(patch) {
    return localDb.write((db) => {
      Object.assign(db.settings, patch)
      return db.settings
    })
  },

  async resetDemoData() {
    localDb.reset()
  },

  async clearAll() {
    localDb.clear()
  },

  async storageInfo() {
    return {
      usedBytes: localDb.usedBytes(),
      approxLimitBytes: 5 * 1024 * 1024,
      backend: 'localStorage do navegador (provisório)',
      maxInlineFileBytes: MAX_INLINE_FILE_BYTES,
    }
  },
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    reader.readAsDataURL(file)
  })
}

export const localFileService: FileService = {
  async prepare(file) {
    const ref: FileRef = {
      fileName: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      simulated: file.size > MAX_INLINE_FILE_BYTES,
    }
    if (!ref.simulated) ref.dataUrl = await readAsDataUrl(file)
    return ref
  },
}

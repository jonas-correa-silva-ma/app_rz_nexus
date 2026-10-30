import * as React from 'react'
import { ExternalLink, FileText, Image as ImageIcon, Paperclip, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { services } from '@/services'
import type { FileRef } from '@/types'
import { formatBytes } from '@/utils/format'
import { MAX_INLINE_FILE_BYTES } from '@/services/local/settingsService'

/** Abre um arquivo guardado localmente em nova aba. */
function openFile(file: FileRef) {
  if (!file.dataUrl) return
  const win = window.open()
  if (!win) {
    toast.error('O navegador bloqueou a abertura da nova aba.')
    return
  }
  win.document.title = file.fileName
  const el = win.document.createElement(file.mimeType.startsWith('image/') ? 'img' : 'iframe')
  el.src = file.dataUrl
  el.setAttribute('style', file.mimeType.startsWith('image/') ? 'max-width:100%' : 'border:0;width:100%;height:100vh')
  win.document.body.style.margin = '0'
  win.document.body.appendChild(el)
}

export function FileRefView({ file, compact }: { file: FileRef; compact?: boolean }) {
  const Icon = file.mimeType.startsWith('image/') ? ImageIcon : FileText
  return (
    <div className="flex min-w-0 items-center gap-2">
      {file.dataUrl && file.mimeType.startsWith('image/') && !compact ? (
        <img src={file.dataUrl} alt={file.fileName} className="size-10 shrink-0 rounded border border-border object-cover" />
      ) : (
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm">{file.fileName}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)}
          {file.simulated && ' · arquivo simulado'}
        </p>
      </div>
      {file.dataUrl ? (
        <Button variant="ghost" size="icon-sm" title="Abrir arquivo" onClick={() => openFile(file)}>
          <ExternalLink />
        </Button>
      ) : (
        <Badge tone="neutral" title="O conteúdo do arquivo não é armazenado no protótipo; apenas seus metadados.">
          Sem conteúdo
        </Badge>
      )}
    </div>
  )
}

/** Seletor de arquivo com regra do protótipo: arquivos pequenos são guardados, os demais simulados. */
export function FilePicker({ value, onChange }: { value?: FileRef; onChange: (file?: FileRef) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [loading, setLoading] = React.useState(false)

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLoading(true)
    try {
      onChange(await services.files.prepare(file))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao ler o arquivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handle} />
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 p-2">
          <FileRefView file={value} />
          <Button variant="ghost" size="icon-sm" title="Remover arquivo" onClick={() => onChange(undefined)}>
            <X />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-3 py-4 text-sm text-muted-foreground hover:border-blue-400 hover:text-foreground"
        >
          {loading ? <Paperclip className="size-4 animate-pulse" /> : <Upload className="size-4" />}
          {loading ? 'Lendo arquivo…' : 'Selecionar arquivo'}
        </button>
      )}
      <p className="text-xs text-muted-foreground">
        Protótipo: arquivos de até {formatBytes(MAX_INLINE_FILE_BYTES)} ficam guardados no navegador; arquivos maiores têm apenas a associação simulada
        (nome e tamanho).
      </p>
    </div>
  )
}

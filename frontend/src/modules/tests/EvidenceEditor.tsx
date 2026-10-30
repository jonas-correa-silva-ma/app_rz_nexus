import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Select, Textarea } from '@/components/ui/form-controls'
import { FilePicker, FileRefView } from '@/components/common/files'
import { OptionBadge } from '@/components/common'
import { EVIDENCE_KINDS } from '@/config/labels'
import type { EvidenceInput } from '@/services'
import type { Evidence, EvidenceKind, FileRef } from '@/types'
import { formatDateTime } from '@/utils/dates'

/** Inclusão de evidências (arquivo e/ou comentário) antes de salvar uma execução ou homologação. */
export function EvidenceEditor({ value, onChange }: { value: EvidenceInput[]; onChange: (v: EvidenceInput[]) => void }) {
  const [kind, setKind] = React.useState<EvidenceKind>('captura')
  const [note, setNote] = React.useState('')
  const [file, setFile] = React.useState<FileRef>()
  const [error, setError] = React.useState('')

  function add() {
    if (!file && !note.trim()) {
      setError('Selecione um arquivo ou escreva um comentário.')
      return
    }
    onChange([...value, { kind, note: note.trim(), file }])
    setNote('')
    setFile(undefined)
    setError('')
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((e, i) => (
            <li key={i} className="flex items-start justify-between gap-2 rounded-md border border-border p-2">
              <div className="min-w-0 flex-1">
                <OptionBadge options={EVIDENCE_KINDS} value={e.kind} dot={false} />
                {e.file && <div className="mt-1.5"><FileRefView file={e.file} compact /></div>}
                {e.note && <p className="mt-1 text-sm text-muted-foreground">{e.note}</p>}
              </div>
              <Button variant="ghost" size="icon-sm" title="Remover" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 gap-3 rounded-md border border-dashed border-border p-3 sm:grid-cols-2">
        <Field label="Tipo de evidência">
          <Select value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)}>
            {EVIDENCE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Comentário" error={error}>
          <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Descreva a evidência…" />
        </Field>
        <div className="sm:col-span-2">
          <FilePicker value={file} onChange={setFile} />
        </div>
        <div className="sm:col-span-2">
          <Button variant="outline" size="sm" onClick={add}>
            <Plus /> Adicionar evidência
          </Button>
        </div>
      </div>
    </div>
  )
}

export function EvidenceList({ evidences }: { evidences: Evidence[] }) {
  if (!evidences.length) return <p className="text-xs text-muted-foreground">Sem evidências.</p>
  return (
    <ul className="flex flex-col gap-2">
      {evidences.map((e) => (
        <li key={e.id} className="rounded-md border border-border bg-card p-2">
          <div className="flex items-center justify-between gap-2">
            <OptionBadge options={EVIDENCE_KINDS} value={e.kind} dot={false} />
            <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span>
          </div>
          {e.file && <div className="mt-1.5"><FileRefView file={e.file} /></div>}
          {e.note && <p className="mt-1 text-sm text-muted-foreground">{e.note}</p>}
        </li>
      ))}
    </ul>
  )
}

import * as React from 'react'
import { Link } from 'react-router'
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ConfirmDialog, EmptyState, FilterBar, PersonChip, runAction } from '@/components/common'
import { FilePicker, FileRefView } from '@/components/common/files'
import { DOCUMENT_TYPES } from '@/config/labels'
import { required, useForm } from '@/hooks/useForm'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type DocumentInput } from '@/services'
import type { DocumentRecord, ID } from '@/types'
import { formatDate } from '@/utils/dates'
import { matches } from '@/utils/format'

const empty = (projectId = '', ownerId = ''): DocumentInput => ({ projectId, type: DOCUMENT_TYPES[0], title: '', description: '', ownerId, file: undefined })

function DocumentFormDialog({ open, onOpenChange, doc, projectId }: { open: boolean; onOpenChange: (o: boolean) => void; doc?: DocumentRecord; projectId?: ID }) {
  const { people, projects } = useReferenceData()
  const [saving, setSaving] = React.useState(false)
  const form = useForm<DocumentInput>(empty(), (v) => ({
    title: required(v.title),
    projectId: required(v.projectId, 'Selecione o projeto.'),
    ownerId: required(v.ownerId, 'Selecione o responsável.'),
  }))
  const { values: v, set, errors } = form

  React.useEffect(() => {
    if (!open) return
    if (doc) {
      const { id: _i, createdAt: _c, ...rest } = doc
      form.reset(rest)
    } else {
      services.settings.get().then((s) => form.reset(empty(projectId, s.currentUserId)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc, projectId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.check()) return
    setSaving(true)
    const ok = doc ? await runAction(() => services.documents.update(doc.id, v), 'Documento atualizado.') : await runAction(() => services.documents.create(v), 'Documento incluído.')
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader title={doc ? 'Editar documento' : 'Incluir documento'} />
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Arquivo" className="sm:col-span-2">
              <FilePicker
                value={v.file}
                onChange={(file) => {
                  set('file', file)
                  if (file && !v.title) set('title', file.fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
                }}
              />
            </Field>
            <Field label="Título" required error={errors.title} className="sm:col-span-2">
              <Input value={v.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errors.title} />
            </Field>
            <Field label="Projeto" required error={errors.projectId}>
              <Select value={v.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!projectId && !doc} aria-invalid={!!errors.projectId}>
                <option value="">Selecione…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo de documento">
              <Select value={v.type} onChange={(e) => set('type', e.target.value)}>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Responsável" required error={errors.ownerId} className="sm:col-span-2">
              <Select value={v.ownerId} onChange={(e) => set('ownerId', e.target.value)} aria-invalid={!!errors.ownerId}>
                <option value="">Selecione…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Descrição" className="sm:col-span-2">
              <Textarea rows={2} value={v.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {doc ? 'Salvar alterações' : 'Incluir documento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DocumentBoard({ projectId }: { projectId?: ID }) {
  const ref = useReferenceData()
  const { data: docs = [], loading } = useQuery(() => services.documents.list({ projectId }), [projectId])
  const [query, setQuery] = React.useState('')
  const [type, setType] = React.useState('')
  const [project, setProject] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<DocumentRecord>()
  const [removing, setRemoving] = React.useState<DocumentRecord>()

  const filtered = docs.filter((d) => matches(query, d.title, d.description, d.file?.fileName) && (!type || d.type === type) && (!project || d.projectId === project))
  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div>
      <FilterBar>
        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Pesquisar documentos…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-48" aria-label="Tipo">
          <option value="">Todos os tipos</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        {!projectId && (
          <Select value={project} onChange={(e) => setProject(e.target.value)} className="sm:w-56" aria-label="Projeto">
            <option value="">Todos os projetos</option>
            {ref.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
        <Button className="sm:ml-auto" onClick={openNew}>
          <Plus /> Incluir documento
        </Button>
      </FilterBar>

      {!loading && docs.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum documento" description="Inclua termos, atas, especificações e outros arquivos do projeto." action={<Button onClick={openNew}><Plus /> Incluir documento</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Documento</TH>
                <TH>Tipo</TH>
                {!projectId && <TH>Projeto</TH>}
                <TH>Responsável</TH>
                <TH>Inclusão</TH>
                <TH>Arquivo</TH>
                <TH className="w-20" />
              </tr>
            </THead>
            <TBody>
              {filtered.map((d) => (
                <TR key={d.id}>
                  <TD className="min-w-56 max-w-80">
                    <p className="font-medium">{d.title}</p>
                    {d.description && <p className="line-clamp-1 text-xs text-muted-foreground">{d.description}</p>}
                  </TD>
                  <TD className="whitespace-nowrap">{d.type}</TD>
                  {!projectId && (
                    <TD className="max-w-48">
                      <Link to={`/projetos/${d.projectId}?aba=documentos`} className="text-sm text-primary hover:underline">
                        {ref.projectName(d.projectId)}
                      </Link>
                    </TD>
                  )}
                  <TD>
                    <PersonChip name={ref.personName(d.ownerId)} />
                  </TD>
                  <TD className="whitespace-nowrap">{formatDate(d.createdAt)}</TD>
                  <TD className="max-w-64">{d.file ? <FileRefView file={d.file} compact /> : <span className="text-xs text-muted-foreground">Sem arquivo</span>}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Editar"
                        onClick={() => {
                          setEditing(d)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Excluir" onClick={() => setRemoving(d)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum documento corresponde aos filtros.
                  </td>
                </tr>
              )}
            </TBody>
          </Table>
        </Card>
      )}
      <DocumentFormDialog open={formOpen} onOpenChange={setFormOpen} doc={editing} projectId={projectId} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(undefined)}
        title="Excluir documento"
        description={`O documento "${removing?.title}" será excluído.`}
        onConfirm={async () => {
          if (removing) await runAction(() => services.documents.remove(removing.id), 'Documento excluído.')
        }}
      />
    </div>
  )
}

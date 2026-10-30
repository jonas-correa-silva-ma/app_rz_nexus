import * as React from 'react'
import { Link } from 'react-router'
import { MessageSquareText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { Avatar, ConfirmDialog, EmptyState, FilterBar, InfoItem, OptionBadge, runAction } from '@/components/common'
import { HEALTH } from '@/config/labels'
import { required, useForm } from '@/hooks/useForm'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type UpdateInput } from '@/services'
import type { ID, ProjectUpdate } from '@/types'
import { formatDate, today } from '@/utils/dates'

const empty = (projectId = '', authorId = ''): UpdateInput => ({
  projectId,
  date: today(),
  authorId,
  health: 'verde',
  summary: '',
  deliveries: '',
  nextSteps: '',
  risks: '',
  impediments: '',
  supportNeeded: '',
})

function UpdateFormDialog({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (o: boolean) => void; projectId?: ID }) {
  const { people, projects } = useReferenceData()
  const [saving, setSaving] = React.useState(false)
  const form = useForm<UpdateInput>(empty(), (v) => ({
    summary: required(v.summary),
    projectId: required(v.projectId, 'Selecione o projeto.'),
    authorId: required(v.authorId, 'Selecione o responsável.'),
  }))
  const { values: v, set, errors } = form

  React.useEffect(() => {
    if (open) services.settings.get().then((s) => form.reset(empty(projectId, s.currentUserId)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.check()) return
    setSaving(true)
    const ok = await runAction(() => services.updates.create(v), 'Atualização registrada.')
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  const area = (key: keyof UpdateInput, label: string) => (
    <Field label={label}>
      <Textarea rows={2} value={String(v[key])} onChange={(e) => set(key, e.target.value)} />
    </Field>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader title="Nova atualização de andamento" />
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Projeto" required error={errors.projectId}>
              <Select value={v.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!projectId} aria-invalid={!!errors.projectId}>
                <option value="">Selecione…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Responsável" required error={errors.authorId}>
              <Select value={v.authorId} onChange={(e) => set('authorId', e.target.value)}>
                <option value="">Selecione…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data">
              <Input type="date" value={v.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label="Situação geral">
              <Select value={v.health} onChange={(e) => set('health', e.target.value as UpdateInput['health'])}>
                {HEALTH.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Resumo" required error={errors.summary} className="sm:col-span-2">
              <Textarea rows={2} value={v.summary} onChange={(e) => set('summary', e.target.value)} aria-invalid={!!errors.summary} />
            </Field>
            {area('deliveries', 'Entregas realizadas')}
            {area('nextSteps', 'Próximos passos')}
            {area('risks', 'Riscos')}
            {area('impediments', 'Impedimentos')}
            <div className="sm:col-span-2">{area('supportNeeded', 'Apoio necessário')}</div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Registrar atualização
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Histórico de atualizações em ordem cronológica (mais recentes primeiro). */
export function UpdateTimeline({ projectId }: { projectId?: ID }) {
  const ref = useReferenceData()
  const { data: updates = [], loading } = useQuery(() => services.updates.list({ projectId }), [projectId])
  const [project, setProject] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [removing, setRemoving] = React.useState<ProjectUpdate>()
  const filtered = updates.filter((u) => !project || u.projectId === project)

  return (
    <div>
      <FilterBar>
        {!projectId && (
          <Select value={project} onChange={(e) => setProject(e.target.value)} className="sm:w-64" aria-label="Projeto">
            <option value="">Todos os projetos</option>
            {ref.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
        <Button className="sm:ml-auto" onClick={() => setOpen(true)}>
          <Plus /> Nova atualização
        </Button>
      </FilterBar>
      {!loading && filtered.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="Nenhuma atualização registrada" />
      ) : (
        <ol className="relative flex flex-col gap-4 border-l border-border pl-6 sm:ml-2">
          {filtered.map((u) => (
            <li key={u.id} className="relative">
              <span className="absolute -left-[31px] top-4 size-3 rounded-full border-2 border-background bg-blue-500" />
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Avatar name={ref.personName(u.authorId)} />
                  <div className="min-w-0 leading-tight">
                    <p className="text-sm font-medium">{ref.personName(u.authorId)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(u.date)}</p>
                  </div>
                  {!projectId && (
                    <Link to={`/projetos/${u.projectId}?aba=atualizacoes`} className="text-sm text-primary hover:underline sm:ml-3">
                      {ref.projectName(u.projectId)}
                    </Link>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <OptionBadge options={HEALTH} value={u.health} />
                    <Button variant="ghost" size="icon-sm" title="Excluir" onClick={() => setRemoving(u)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium">{u.summary}</p>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Entregas realizadas">{u.deliveries}</InfoItem>
                  <InfoItem label="Próximos passos">{u.nextSteps}</InfoItem>
                  <InfoItem label="Riscos">{u.risks}</InfoItem>
                  <InfoItem label="Impedimentos">{u.impediments}</InfoItem>
                  <InfoItem label="Apoio necessário">{u.supportNeeded}</InfoItem>
                </dl>
              </Card>
            </li>
          ))}
        </ol>
      )}
      <UpdateFormDialog open={open} onOpenChange={setOpen} projectId={projectId} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(undefined)}
        title="Excluir atualização"
        description="A atualização será removida do histórico."
        onConfirm={async () => {
          if (removing) await runAction(() => services.updates.remove(removing.id), 'Atualização excluída.')
        }}
      />
    </div>
  )
}

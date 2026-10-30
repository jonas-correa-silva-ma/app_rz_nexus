import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { runAction } from '@/components/common'
import { PRIORITIES, TASK_STATUSES } from '@/config/labels'
import { required, useForm } from '@/hooks/useForm'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type TaskInput } from '@/services'
import type { ID, Task } from '@/types'
import { daysFromToday, today } from '@/utils/dates'

const empty = (projectId = '', assigneeId = ''): TaskInput => ({
  projectId,
  name: '',
  description: '',
  assigneeId,
  priority: 'media',
  status: 'nao_iniciada',
  startDate: today(),
  dueDate: daysFromToday(14),
  progress: 0,
  notes: '',
})

export function TaskFormDialog({ open, onOpenChange, task, projectId }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task; projectId?: ID }) {
  const { people, projects } = useReferenceData()
  const [saving, setSaving] = React.useState(false)
  const form = useForm<TaskInput>(empty(), (v) => ({
    name: required(v.name),
    projectId: required(v.projectId, 'Selecione o projeto.'),
    assigneeId: required(v.assigneeId, 'Selecione o responsável.'),
    dueDate: required(v.dueDate) ?? (v.startDate && v.dueDate < v.startDate ? 'O vencimento deve ser posterior ao início.' : undefined),
  }))
  const { values: v, set, errors } = form

  React.useEffect(() => {
    if (!open) return
    if (task) {
      const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = task
      form.reset(rest)
    } else {
      services.settings.get().then((s) => form.reset(empty(projectId, s.currentUserId)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, projectId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.check()) return
    setSaving(true)
    const ok = task
      ? await runAction(() => services.tasks.update(task.id, v), 'Tarefa atualizada.')
      : await runAction(() => services.tasks.create(v), 'Tarefa criada.')
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader title={task ? 'Editar tarefa' : 'Nova tarefa'} />
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome" required error={errors.name} className="sm:col-span-2">
              <Input value={v.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} autoFocus />
            </Field>
            <Field label="Projeto" required error={errors.projectId} className="sm:col-span-2">
              <Select value={v.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!projectId && !task} aria-invalid={!!errors.projectId}>
                <option value="">Selecione…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Descrição" className="sm:col-span-2">
              <Textarea rows={2} value={v.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <Field label="Responsável" required error={errors.assigneeId}>
              <Select value={v.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} aria-invalid={!!errors.assigneeId}>
                <option value="">Selecione…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={v.priority} onChange={(e) => set('priority', e.target.value as TaskInput['priority'])}>
                {PRIORITIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={v.status}
                onChange={(e) => {
                  const status = e.target.value as TaskInput['status']
                  set('status', status)
                  if (status === 'concluida') set('progress', 100)
                }}
              >
                {TASK_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Percentual de conclusão: ${v.progress}%`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={v.progress}
                disabled={v.status === 'concluida'}
                onChange={(e) => set('progress', Number(e.target.value))}
                className="mt-2 w-full cursor-pointer accent-primary"
              />
            </Field>
            <Field label="Data de início">
              <Input type="date" value={v.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </Field>
            <Field label="Data de vencimento" required error={errors.dueDate}>
              <Input type="date" value={v.dueDate} onChange={(e) => set('dueDate', e.target.value)} aria-invalid={!!errors.dueDate} />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <Textarea rows={2} value={v.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {task ? 'Salvar alterações' : 'Criar tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

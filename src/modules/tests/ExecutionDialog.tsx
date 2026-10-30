import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { runAction } from '@/components/common'
import { PRIORITIES, TEST_STATUSES } from '@/config/labels'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type EvidenceInput } from '@/services'
import type { Priority, TestCaseView, TestStatus } from '@/types'
import { daysFromToday, today } from '@/utils/dates'
import { EvidenceEditor } from './EvidenceEditor'

type CorrectiveMode = 'nova' | 'existente' | 'nenhuma'

/** Registro de uma nova tentativa de execução. As tentativas anteriores são preservadas. */
export function ExecutionDialog({ open, onOpenChange, view }: { open: boolean; onOpenChange: (o: boolean) => void; view?: TestCaseView }) {
  const { people } = useReferenceData()
  const projectId = view?.testCase.projectId
  const { data: projectTasks = [] } = useQuery(() => (projectId ? services.tasks.list({ projectId }) : Promise.resolve([])), [projectId])

  const [executorId, setExecutorId] = React.useState('')
  const [date, setDate] = React.useState(today())
  const [status, setStatus] = React.useState<TestStatus>('aprovado')
  const [actualResult, setActualResult] = React.useState('')
  const [comments, setComments] = React.useState('')
  const [needsRetest, setNeedsRetest] = React.useState(false)
  const [evidences, setEvidences] = React.useState<EvidenceInput[]>([])
  const [mode, setMode] = React.useState<CorrectiveMode>('nova')
  const [taskName, setTaskName] = React.useState('')
  const [taskAssignee, setTaskAssignee] = React.useState('')
  const [taskDue, setTaskDue] = React.useState(daysFromToday(7))
  const [taskPriority, setTaskPriority] = React.useState<Priority>('alta')
  const [relatedTaskId, setRelatedTaskId] = React.useState('')
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open || !view) return
    services.settings.get().then((s) => setExecutorId(s.currentUserId))
    setDate(today())
    setStatus('aprovado')
    setActualResult('')
    setComments('')
    setNeedsRetest(false)
    setEvidences([])
    setMode('nova')
    setTaskName(`Corrigir falha — ${view.testCase.code} ${view.testCase.name}`)
    setTaskAssignee(view.testCase.ownerId)
    setTaskDue(daysFromToday(7))
    setTaskPriority(view.testCase.priority === 'baixa' ? 'media' : view.testCase.priority)
    setRelatedTaskId('')
    setErrors({})
  }, [open, view])

  if (!view) return null
  const failed = status === 'reprovado' || status === 'bloqueado'
  const attempt = view.executions.length + 1

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!executorId) errs.executor = 'Selecione o executor.'
    if (status !== 'nao_iniciado' && status !== 'em_andamento' && status !== 'cancelado' && !actualResult.trim()) errs.actual = 'Informe o resultado obtido.'
    if (failed && mode === 'nova' && (!taskName.trim() || !taskAssignee || !taskDue)) errs.task = 'Informe nome, responsável e prazo da tarefa corretiva.'
    if (failed && mode === 'existente' && !relatedTaskId) errs.task = 'Selecione a tarefa relacionada.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    const ok = await runAction(
      () =>
        services.tests.recordExecution({
          testCaseId: view!.testCase.id,
          executorId,
          date,
          actualResult,
          status,
          comments,
          needsRetest: failed && needsRetest,
          evidences,
          correctiveTask: failed && mode === 'nova' ? { name: taskName, assigneeId: taskAssignee, dueDate: taskDue, priority: taskPriority } : undefined,
          relatedTaskId: failed && mode === 'existente' ? relatedTaskId : undefined,
        }),
      status === 'reprovado' ? 'Falha registrada. Indicadores atualizados.' : 'Execução registrada.',
    )
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader title={`Registrar execução — ${view.testCase.code}`} description={`${view.testCase.name} · tentativa nº ${attempt}${attempt > 1 ? ' (reteste)' : ''}`} />
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-3 text-sm sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Resultado esperado</p>
              <p className="mt-1">{view.testCase.expectedResult}</p>
            </div>
            <Field label="Executor" required error={errors.executor}>
              <Select value={executorId} onChange={(e) => setExecutorId(e.target.value)}>
                <option value="">Selecione…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Status da execução" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {TEST_STATUSES.map((s) => (
                  <label
                    key={s.value}
                    className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${status === s.value ? 'border-primary bg-accent font-medium text-accent-foreground' : 'border-border hover:bg-muted'}`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="status"
                      checked={status === s.value}
                      onChange={() => {
                        setStatus(s.value)
                        setNeedsRetest(s.value === 'reprovado' || s.value === 'bloqueado')
                      }}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Resultado obtido" required={!['nao_iniciado', 'em_andamento', 'cancelado'].includes(status)} error={errors.actual} className="sm:col-span-2">
              <Textarea rows={2} value={actualResult} onChange={(e) => setActualResult(e.target.value)} />
            </Field>
            <Field label="Comentários" className="sm:col-span-2">
              <Textarea rows={2} value={comments} onChange={(e) => setComments(e.target.value)} />
            </Field>

            {failed && (
              <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 sm:col-span-2">
                <p className="flex items-center gap-2 text-sm font-medium text-red-800">
                  <AlertTriangle className="size-4" /> Tratamento da falha
                </p>
                <Checkbox label="Necessita reteste" checked={needsRetest} onChange={(e) => setNeedsRetest(e.target.checked)} />
                <div className="flex flex-wrap gap-4 text-sm">
                  {(
                    [
                      ['nova', 'Criar tarefa corretiva'],
                      ['existente', 'Relacionar tarefa existente'],
                      ['nenhuma', 'Sem tarefa'],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="inline-flex cursor-pointer items-center gap-1.5">
                      <input type="radio" name="corrective" className="accent-primary" checked={mode === value} onChange={() => setMode(value)} />
                      {label}
                    </label>
                  ))}
                </div>
                {mode === 'nova' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Nome da tarefa" className="sm:col-span-2">
                      <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} />
                    </Field>
                    <Field label="Responsável">
                      <Select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                        <option value="">Selecione…</option>
                        {people.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Prazo">
                      <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                    </Field>
                    <Field label="Prioridade">
                      <Select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)}>
                        {PRIORITIES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                )}
                {mode === 'existente' && (
                  <Field label="Tarefa relacionada">
                    <Select value={relatedTaskId} onChange={(e) => setRelatedTaskId(e.target.value)}>
                      <option value="">Selecione…</option>
                      {projectTasks
                        .filter((t) => t.status !== 'concluida' && t.status !== 'cancelada')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </Select>
                  </Field>
                )}
                {errors.task && <p className="text-xs text-destructive">{errors.task}</p>}
              </div>
            )}

            <Field label="Evidências" className="sm:col-span-2">
              <EvidenceEditor value={evidences} onChange={setEvidences} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Registrar execução
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

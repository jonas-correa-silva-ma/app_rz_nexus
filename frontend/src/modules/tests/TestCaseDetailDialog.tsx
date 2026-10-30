import * as React from 'react'
import { Link } from 'react-router'
import { Paperclip, PlayCircle, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { InfoItem, OptionBadge, runAction } from '@/components/common'
import { PRIORITIES, TEST_STATUSES } from '@/config/labels'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type EvidenceInput } from '@/services'
import type { Evidence, ID, TestExecution } from '@/types'
import { formatDate } from '@/utils/dates'
import { EvidenceEditor, EvidenceList } from './EvidenceEditor'
import { ExecutionDialog } from './ExecutionDialog'

/** Detalhes do caso de teste com o histórico completo de execuções e evidências. */
export function TestCaseDetailDialog({ caseId, projectId, onOpenChange }: { caseId?: ID; projectId?: ID; onOpenChange: (o: boolean) => void }) {
  const ref = useReferenceData()
  const { data: views = [] } = useQuery(() => services.tests.listCases({ projectId }), [projectId])
  const view = views.find((v) => v.testCase.id === caseId)
  const execIds = view?.executions.map((e) => e.id).join(',') ?? ''
  const { data: evidences = {} } = useQuery(async () => {
    const map: Record<ID, Evidence[]> = {}
    for (const e of view?.executions ?? []) map[e.id] = await services.tests.listEvidences({ executionId: e.id })
    return map
  }, [execIds])
  const { data: tasks = [] } = useQuery(() => (view ? services.tasks.list({ projectId: view.testCase.projectId }) : Promise.resolve([])), [view?.testCase.projectId])
  const [executing, setExecuting] = React.useState(false)
  const [addingTo, setAddingTo] = React.useState<TestExecution>()

  if (!view) return null
  const tc = view.testCase

  return (
    <>
      <Dialog open={!!caseId} onOpenChange={onOpenChange}>
        <DialogContent size="xl">
          <DialogHeader title={`${tc.code} — ${tc.name}`} description={`${ref.projectName(tc.projectId)} · ${tc.system || 'Sistema não informado'}${tc.feature ? ` · ${tc.feature}` : ''}`} />
          <DialogBody className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <OptionBadge options={TEST_STATUSES} value={view.status} />
                <OptionBadge options={PRIORITIES} value={tc.priority} dot={false} />
                {view.retestPending && <Badge tone="amber">Aguardando reteste</Badge>}
              </div>
              <dl className="grid grid-cols-1 gap-4">
                <InfoItem label="Responsável">{ref.personName(tc.ownerId)}</InfoItem>
                <InfoItem label="Objetivo">{tc.objective}</InfoItem>
                <InfoItem label="Cenário">{tc.scenario}</InfoItem>
                <InfoItem label="Pré-condições">{tc.preconditions}</InfoItem>
                <InfoItem label="Passos">{tc.steps}</InfoItem>
                <InfoItem label="Resultado esperado">{tc.expectedResult}</InfoItem>
              </dl>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Histórico de execuções ({view.executions.length})</h3>
              </div>
              {view.executions.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma execução registrada.</p>
              ) : (
                <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
                  {[...view.executions].reverse().map((e) => {
                    const task = tasks.find((t) => t.id === e.correctiveTaskId)
                    return (
                      <li key={e.id} className="relative">
                        <span className="absolute -left-[26px] top-1.5 size-3 rounded-full border-2 border-card bg-slate-400" />
                        <div className="rounded-lg border border-border p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">Tentativa {e.attempt}</span>
                            <OptionBadge options={TEST_STATUSES} value={e.status} />
                            {e.needsRetest && <Badge tone="amber">Reteste necessário</Badge>}
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatDate(e.date)} · {ref.personName(e.executorId)}
                            </span>
                          </div>
                          {e.actualResult && (
                            <p className="mt-2 text-sm">
                              <span className="text-muted-foreground">Resultado obtido: </span>
                              {e.actualResult}
                            </p>
                          )}
                          {e.comments && <p className="mt-1 text-sm text-muted-foreground">{e.comments}</p>}
                          {task && (
                            <Link to={`/projetos/${task.projectId}?aba=tarefas`} className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline" onClick={() => onOpenChange(false)}>
                              <Wrench className="size-3" /> Tarefa corretiva: {task.name} ({ref.personName(task.assigneeId)}, prazo {formatDate(task.dueDate)})
                            </Link>
                          )}
                          <div className="mt-3">
                            <div className="mb-1.5 flex items-center justify-between">
                              <p className="text-xs font-medium text-muted-foreground">Evidências</p>
                              <Button variant="ghost" size="sm" onClick={() => setAddingTo(e)}>
                                <Paperclip /> Anexar
                              </Button>
                            </div>
                            <EvidenceList evidences={evidences[e.id] ?? []} />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={() => setExecuting(true)}>
              <PlayCircle /> {view.executions.length ? 'Registrar nova execução' : 'Registrar execução'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExecutionDialog open={executing} onOpenChange={setExecuting} view={view} />
      <AddEvidenceDialog execution={addingTo} onClose={() => setAddingTo(undefined)} />
    </>
  )
}

function AddEvidenceDialog({ execution, onClose }: { execution?: TestExecution; onClose: () => void }) {
  const [items, setItems] = React.useState<EvidenceInput[]>([])
  React.useEffect(() => {
    setItems([])
  }, [execution])
  return (
    <Dialog open={!!execution} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader title={`Anexar evidências — tentativa ${execution?.attempt ?? ''}`} />
        <DialogBody>
          <EvidenceEditor value={items} onChange={setItems} />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!items.length}
            onClick={async () => {
              if (!execution) return
              const ok = await runAction(async () => {
                for (const item of items) await services.tests.addEvidence({ executionId: execution.id }, item)
                return true
              }, 'Evidências anexadas.')
              if (ok) onClose()
            }}
          >
            Salvar evidências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

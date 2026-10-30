import * as React from 'react'
import { AlertTriangle, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { EmptyState, InfoItem, OptionBadge, runAction } from '@/components/common'
import { HOMOLOGATION_RESULTS, labelOf, PROJECT_TEST_STATUSES } from '@/config/labels'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type EvidenceInput } from '@/services'
import type { HomologationResult, ID, ProjectInsight } from '@/types'
import { formatDate, today } from '@/utils/dates'
import { EvidenceEditor, EvidenceList } from './EvidenceEditor'

/** Registro de homologação. Testes aprovados não equivalem a homologação aprovada. */
export function HomologationDialog({ open, onOpenChange, insight }: { open: boolean; onOpenChange: (o: boolean) => void; insight?: ProjectInsight }) {
  const { people } = useReferenceData()
  const project = insight?.project
  const [approverId, setApproverId] = React.useState('')
  const [date, setDate] = React.useState(today())
  const [result, setResult] = React.useState<HomologationResult>('aprovada')
  const [comments, setComments] = React.useState('')
  const [reservations, setReservations] = React.useState('')
  const [blockingIssues, setBlockingIssues] = React.useState('')
  const [evidences, setEvidences] = React.useState<EvidenceInput[]>([])
  const [completeProject, setCompleteProject] = React.useState(true)
  const [error, setError] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open || !project) return
    setApproverId(project.testConfig?.approverId ?? '')
    setDate(today())
    setResult('aprovada')
    setComments('')
    setReservations('')
    setBlockingIssues('')
    setEvidences([])
    setCompleteProject(true)
    setError('')
  }, [open, project])

  if (!project || !insight) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!approverId) return setError('Selecione o responsável pela homologação.')
    if (result === 'aprovada_com_ressalvas' && !reservations.trim()) return setError('Descreva as ressalvas.')
    if (result === 'reprovada' && !blockingIssues.trim()) return setError('Descreva as pendências impeditivas.')
    setSaving(true)
    const ok = await runAction(
      () =>
        services.tests.registerHomologation({
          projectId: project!.id,
          approverId,
          date,
          result,
          comments,
          reservations,
          blockingIssues,
          evidences,
          completeProject: result !== 'reprovada' && completeProject,
        }),
      'Homologação registrada.',
    )
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader title={`Registrar homologação — ${project.name}`} description={project.testConfig?.approvalCriteria ? `Critério: ${project.testConfig.approvalCriteria}` : undefined} />
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {insight.testStatus !== 'testes_concluidos' && (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Situação dos testes: <strong>{labelOf(PROJECT_TEST_STATUSES, insight.testStatus)}</strong>. A homologação pode ser registrada, mas recomenda-se concluir os testes
                  antes.
                </span>
              </div>
            )}
            <Field label="Responsável pela homologação" required>
              <Select value={approverId} onChange={(e) => setApproverId(e.target.value)}>
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
            <Field label="Resultado" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {HOMOLOGATION_RESULTS.map((r) => (
                  <label key={r.value} className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${result === r.value ? 'border-primary bg-accent font-medium text-accent-foreground' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" className="sr-only" name="result" checked={result === r.value} onChange={() => setResult(r.value)} />
                    {r.label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Comentários" className="sm:col-span-2">
              <Textarea rows={2} value={comments} onChange={(e) => setComments(e.target.value)} />
            </Field>
            <Field label="Ressalvas" required={result === 'aprovada_com_ressalvas'}>
              <Textarea rows={2} value={reservations} onChange={(e) => setReservations(e.target.value)} />
            </Field>
            <Field label="Pendências impeditivas" required={result === 'reprovada'}>
              <Textarea rows={2} value={blockingIssues} onChange={(e) => setBlockingIssues(e.target.value)} />
            </Field>
            {result !== 'reprovada' && (
              <Checkbox className="sm:col-span-2" label="Marcar o projeto como concluído" checked={completeProject} onChange={(e) => setCompleteProject(e.target.checked)} />
            )}
            <Field label="Evidências" className="sm:col-span-2">
              <EvidenceEditor value={evidences} onChange={setEvidences} />
            </Field>
            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Registrar homologação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Histórico de homologações com evidências. */
export function HomologationHistory({ projectId }: { projectId?: ID }) {
  const ref = useReferenceData()
  const { data: list = [] } = useQuery(() => services.tests.listHomologations({ projectId }), [projectId])
  const ids = list.map((h) => h.id).join(',')
  const { data: evidences = {} } = useQuery(async () => {
    const map: Record<string, Awaited<ReturnType<typeof services.tests.listEvidences>>> = {}
    for (const h of list) map[h.id] = await services.tests.listEvidences({ homologationId: h.id })
    return map
  }, [ids])

  if (!list.length) return <EmptyState icon={BadgeCheck} title="Nenhuma homologação registrada" />
  return (
    <div className="flex flex-col gap-3">
      {list.map((h) => (
        <Card key={h.id} className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <OptionBadge options={HOMOLOGATION_RESULTS} value={h.result} />
            {!projectId && <span className="text-sm font-medium">{ref.projectName(h.projectId)}</span>}
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(h.date)} · {ref.personName(h.approverId)}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoItem label="Comentários">{h.comments}</InfoItem>
            <InfoItem label="Ressalvas">{h.reservations}</InfoItem>
            <InfoItem label="Pendências impeditivas">{h.blockingIssues}</InfoItem>
          </dl>
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Evidências</p>
            <EvidenceList evidences={evidences[h.id] ?? []} />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function RegisterHomologationButton({ insight, size }: { insight: ProjectInsight; size?: 'sm' | 'default' }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button size={size} variant={insight.homologationStatus === 'aguardando' ? 'default' : 'outline'} onClick={() => setOpen(true)}>
        <BadgeCheck /> Registrar homologação
      </Button>
      <HomologationDialog open={open} onOpenChange={setOpen} insight={insight} />
    </>
  )
}


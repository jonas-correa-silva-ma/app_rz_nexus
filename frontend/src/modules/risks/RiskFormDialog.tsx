import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { OptionBadge, runAction } from '@/components/common'
import { PRIORITIES, RISK_CATEGORIES, RISK_STATUSES, RISK_TYPES, SEVERITIES } from '@/config/labels'
import { computeSeverity, riskScore } from '@/domain/rules'
import { required, useForm } from '@/hooks/useForm'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type RiskInput } from '@/services'
import type { ID, Risk, Scale } from '@/types'
import { daysFromToday } from '@/utils/dates'

const SCALE_LABELS = ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta']

const empty = (projectId = '', ownerId = ''): RiskInput => ({
  projectId,
  type: 'risco',
  description: '',
  category: RISK_CATEGORIES[0],
  ownerId,
  priority: 'media',
  probability: 3,
  impact: 3,
  dueDate: daysFromToday(15),
  status: 'aberto',
  actionPlan: '',
})

export function RiskFormDialog({ open, onOpenChange, risk, projectId }: { open: boolean; onOpenChange: (o: boolean) => void; risk?: Risk; projectId?: ID }) {
  const { people, projects } = useReferenceData()
  const [saving, setSaving] = React.useState(false)
  const form = useForm<RiskInput>(empty(), (v) => ({
    description: required(v.description),
    projectId: required(v.projectId, 'Selecione o projeto.'),
    ownerId: required(v.ownerId, 'Selecione o responsável.'),
  }))
  const { values: v, set, errors } = form

  React.useEffect(() => {
    if (!open) return
    if (risk) {
      const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = risk
      form.reset(rest)
    } else {
      services.settings.get().then((s) => form.reset(empty(projectId, s.currentUserId)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, risk, projectId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.check()) return
    setSaving(true)
    const ok = risk
      ? await runAction(() => services.risks.update(risk.id, v), 'Registro atualizado.')
      : await runAction(() => services.risks.create(v), 'Registro criado.')
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  const scaleSelect = (key: 'probability' | 'impact') => (
    <Select value={v[key]} onChange={(e) => set(key, Number(e.target.value) as Scale)}>
      {SCALE_LABELS.map((l, i) => (
        <option key={l} value={i + 1}>
          {i + 1} — {l}
        </option>
      ))}
    </Select>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader title={risk ? 'Editar registro' : 'Novo risco ou pendência'} />
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select value={v.type} onChange={(e) => set('type', e.target.value as RiskInput['type'])}>
                {RISK_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoria">
              <Select value={v.category} onChange={(e) => set('category', e.target.value)}>
                {RISK_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Descrição" required error={errors.description} className="sm:col-span-2">
              <Textarea rows={2} value={v.description} onChange={(e) => set('description', e.target.value)} aria-invalid={!!errors.description} autoFocus />
            </Field>
            <Field label="Projeto" required error={errors.projectId} className="sm:col-span-2">
              <Select value={v.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={!!projectId && !risk} aria-invalid={!!errors.projectId}>
                <option value="">Selecione…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Responsável" required error={errors.ownerId}>
              <Select value={v.ownerId} onChange={(e) => set('ownerId', e.target.value)} aria-invalid={!!errors.ownerId}>
                <option value="">Selecione…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={v.priority} onChange={(e) => set('priority', e.target.value as RiskInput['priority'])}>
                {PRIORITIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Probabilidade">{scaleSelect('probability')}</Field>
            <Field label="Impacto">{scaleSelect('impact')}</Field>
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Severidade calculada (probabilidade × impacto = {riskScore(v.probability, v.impact)}):</span>
              <OptionBadge options={SEVERITIES} value={computeSeverity(v.probability, v.impact)} />
            </div>
            <Field label="Prazo">
              <Input type="date" value={v.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={v.status} onChange={(e) => set('status', e.target.value as RiskInput['status'])}>
                {RISK_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Plano de ação" className="sm:col-span-2">
              <Textarea rows={3} value={v.actionPlan} onChange={(e) => set('actionPlan', e.target.value)} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {risk ? 'Salvar alterações' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

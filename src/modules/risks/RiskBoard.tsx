import * as React from 'react'
import { Link } from 'react-router'
import { Pencil, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/form-controls'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ConfirmDialog, Deadline, EmptyState, FilterBar, OptionBadge, PersonChip, runAction } from '@/components/common'
import { labelOf, RISK_STATUSES, RISK_TYPES, SEVERITIES } from '@/config/labels'
import { computeSeverity, isRiskOpen, riskScore } from '@/domain/rules'
import { useReferenceData } from '@/hooks/useReferenceData'
import type { ID, Risk, Severity } from '@/types'
import { services } from '@/services'
import { matches } from '@/utils/format'
import { RiskFormDialog } from './RiskFormDialog'

type GroupBy = 'criticidade' | 'projeto' | 'responsavel' | 'nenhum'
const SEVERITY_ORDER: Severity[] = ['critica', 'alta', 'media', 'baixa']


/** Registro de riscos, problemas, impedimentos e pendências com agrupamentos. */
export function RiskBoard({ risks, projectId, severityFilter, onSeverityFilter }: { risks: Risk[]; projectId?: ID; severityFilter?: string; onSeverityFilter?: (s: string) => void }) {
  const ref = useReferenceData()
  const [query, setQuery] = React.useState('')
  const [type, setType] = React.useState('')
  const [status, setStatus] = React.useState('abertos')
  const [project, setProject] = React.useState('')
  const [owner, setOwner] = React.useState('')
  const [localSeverity, setLocalSeverity] = React.useState('')
  const severity = severityFilter ?? localSeverity
  const setSeverity = onSeverityFilter ?? setLocalSeverity
  const [groupBy, setGroupBy] = React.useState<GroupBy>(projectId ? 'nenhum' : 'criticidade')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Risk>()
  const [removing, setRemoving] = React.useState<Risk>()

  const filtered = risks
    .filter(
      (r) =>
        matches(query, r.description, r.actionPlan, r.category) &&
        (!type || r.type === type) &&
        (status === 'todos' || (status === 'abertos' ? isRiskOpen(r) : r.status === status)) &&
        (!project || r.projectId === project) &&
        (!owner || r.ownerId === owner) &&
        (!severity || computeSeverity(r.probability, r.impact) === severity),
    )
    .sort((a, b) => riskScore(b.probability, b.impact) - riskScore(a.probability, a.impact))

  const groups: { key: string; title: React.ReactNode; items: Risk[] }[] = (() => {
    switch (groupBy) {
      case 'criticidade':
        return SEVERITY_ORDER.map((s) => ({
          key: s,
          title: <OptionBadge options={SEVERITIES} value={s} />,
          items: filtered.filter((r) => computeSeverity(r.probability, r.impact) === s),
        }))
      case 'projeto':
        return [...new Set(filtered.map((r) => r.projectId))].map((id) => ({ key: id, title: ref.projectName(id), items: filtered.filter((r) => r.projectId === id) }))
      case 'responsavel':
        return [...new Set(filtered.map((r) => r.ownerId))].map((id) => ({ key: id, title: ref.personName(id), items: filtered.filter((r) => r.ownerId === id) }))
      default:
        return [{ key: 'all', title: null, items: filtered }]
    }
  })().filter((g) => g.items.length > 0)

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div>
      <FilterBar>
        <div className="relative sm:w-60">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Pesquisar…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-36" aria-label="Tipo">
          <option value="">Todos os tipos</option>
          {RISK_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} className="sm:w-40" aria-label="Severidade">
          <option value="">Toda severidade</option>
          {SEVERITIES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40" aria-label="Status">
          <option value="abertos">Em aberto</option>
          <option value="todos">Todos os status</option>
          {RISK_STATUSES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {!projectId && (
          <Select value={project} onChange={(e) => setProject(e.target.value)} className="sm:w-52" aria-label="Projeto">
            <option value="">Todos os projetos</option>
            {ref.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="sm:w-44" aria-label="Responsável">
          <option value="">Todos os responsáveis</option>
          {ref.people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <div className="flex gap-2 sm:ml-auto">
          <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="sm:w-48" aria-label="Agrupar por">
            <option value="criticidade">Agrupar por criticidade</option>
            {!projectId && <option value="projeto">Agrupar por projeto</option>}
            <option value="responsavel">Agrupar por responsável</option>
            <option value="nenhum">Sem agrupamento</option>
          </Select>
          <Button onClick={openNew}>
            <Plus /> Registrar
          </Button>
        </div>
      </FilterBar>

      {risks.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Nenhum risco ou pendência registrado" action={<Button onClick={openNew}><Plus /> Registrar</Button>} />
      ) : groups.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">Nenhum registro corresponde aos filtros.</Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <Card key={g.key} className="overflow-hidden">
              {g.title && (
                <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-medium">
                  {g.title}
                  <span className="text-xs font-normal text-muted-foreground">{g.items.length} registro(s)</span>
                </div>
              )}
              <Table>
                <THead>
                  <tr>
                    <TH>Descrição</TH>
                    <TH>Tipo</TH>
                    {!projectId && <TH>Projeto</TH>}
                    <TH>Responsável</TH>
                    <TH>P × I</TH>
                    <TH>Severidade</TH>
                    <TH>Prazo</TH>
                    <TH>Status</TH>
                    <TH className="w-20" />
                  </tr>
                </THead>
                <TBody>
                  {g.items.map((r) => (
                    <TR key={r.id}>
                      <TD className="min-w-60 max-w-96">
                        <p className="font-medium">{r.description}</p>
                        {r.actionPlan && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">Plano: {r.actionPlan}</p>}
                      </TD>
                      <TD>
                        <span className="text-sm">{labelOf(RISK_TYPES, r.type)}</span>
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                      </TD>
                      {!projectId && (
                        <TD className="max-w-48">
                          <Link to={`/projetos/${r.projectId}`} className="text-sm text-primary hover:underline">
                            {ref.projectName(r.projectId)}
                          </Link>
                        </TD>
                      )}
                      <TD>
                        <PersonChip name={ref.personName(r.ownerId)} />
                      </TD>
                      <TD className="tabular-nums text-muted-foreground">
                        {r.probability} × {r.impact} = <span className="font-medium text-foreground">{riskScore(r.probability, r.impact)}</span>
                      </TD>
                      <TD>
                        <OptionBadge options={SEVERITIES} value={computeSeverity(r.probability, r.impact)} />
                      </TD>
                      <TD>
                        <Deadline date={r.dueDate} closed={!isRiskOpen(r)} />
                      </TD>
                      <TD>
                        <OptionBadge options={RISK_STATUSES} value={r.status} />
                      </TD>
                      <TD>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Editar"
                            onClick={() => {
                              setEditing(r)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Excluir" onClick={() => setRemoving(r)}>
                            <Trash2 />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          ))}
        </div>
      )}

      <RiskFormDialog open={formOpen} onOpenChange={setFormOpen} risk={editing} projectId={projectId} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(undefined)}
        title="Excluir registro"
        description={`"${removing?.description}" será excluído permanentemente.`}
        onConfirm={async () => {
          if (removing) await runAction(() => services.risks.remove(removing.id), 'Registro excluído.')
        }}
      />
    </div>
  )
}

/** Matriz probabilidade × impacto (5×5) com contagem de registros em aberto. */
export function RiskMatrix({ risks, selected, onSelect }: { risks: Risk[]; selected?: string; onSelect?: (severity: string) => void }) {
  const open = risks.filter(isRiskOpen)
  const cellColor = (p: number, i: number) => {
    const s = computeSeverity(p as Risk['probability'], i as Risk['impact'])
    return { critica: 'bg-red-100 text-red-900', alta: 'bg-orange-100 text-orange-900', media: 'bg-amber-50 text-amber-900', baixa: 'bg-emerald-50 text-emerald-900' }[s]
  }
  return (
    <div className="flex gap-2">
      <div className="flex items-center">
        <span className="-rotate-90 whitespace-nowrap text-xs text-muted-foreground">Probabilidade</span>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1">
          {[5, 4, 3, 2, 1].map((p) => (
            <React.Fragment key={p}>
              <span className="flex items-center pr-1 text-xs text-muted-foreground">{p}</span>
              {[1, 2, 3, 4, 5].map((i) => {
                const count = open.filter((r) => r.probability === p && r.impact === i).length
                const sev = computeSeverity(p as Risk['probability'], i as Risk['impact'])
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelect?.(selected === sev ? '' : sev)}
                    title={`Probabilidade ${p} × Impacto ${i} — ${labelOf(SEVERITIES, sev)}: ${count} registro(s)`}
                    className={`flex aspect-[1.6] cursor-pointer items-center justify-center rounded text-sm font-semibold tabular-nums ring-inset hover:ring-2 hover:ring-slate-400 ${cellColor(p, i)} ${selected === sev ? 'ring-2 ring-slate-700' : ''}`}
                  >
                    {count || ''}
                  </button>
                )
              })}
            </React.Fragment>
          ))}
          <span />
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="text-center text-xs text-muted-foreground">
              {i}
            </span>
          ))}
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">Impacto</p>
      </div>
    </div>
  )
}

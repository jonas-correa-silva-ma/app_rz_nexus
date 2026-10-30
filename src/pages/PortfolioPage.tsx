import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/form-controls'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Deadline, FilterBar, OptionBadge, PageHeader, PersonChip, RiskLevelBadge } from '@/components/common'
import { Gantt } from '@/components/common/Gantt'
import { AREAS, labelOf, PRIORITIES, PROJECT_STATUSES } from '@/config/labels'
import { isProjectClosed, isRiskOpen, isTaskOverdue } from '@/domain/rules'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services } from '@/services'
import type { ProjectInsight } from '@/types'
import { cn } from '@/lib/utils'

const RISK_ORDER = { alto: 0, medio: 1, baixo: 2 }

export function PortfolioPage() {
  const navigate = useNavigate()
  const ref = useReferenceData()
  const { data: insights = [] } = useQuery(() => services.projects.insights())
  const { data: tasks = [] } = useQuery(() => services.tasks.list())
  const { data: risks = [] } = useQuery(() => services.risks.list())
  const [area, setArea] = React.useState('')
  const [showClosed, setShowClosed] = React.useState('ativos')

  const list = insights
    .filter((i) => (!area || i.project.area === area) && (showClosed === 'todos' || !isProjectClosed(i.project)))
    .sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel] || a.project.endDate.localeCompare(b.project.endDate))
  const ids = new Set(list.map((i) => i.project.id))
  const byId = new Map(insights.map((i) => [i.project.id, i]))

  const workload = ref.people
    .map((person) => {
      const managed = list.filter((i) => i.project.managerId === person.id)
      const personTasks = tasks.filter((t) => ids.has(t.projectId) && t.assigneeId === person.id && t.status !== 'concluida' && t.status !== 'cancelada')
      return {
        person,
        managed: managed.length,
        atRisk: managed.filter((i) => i.riskLevel === 'alto').length,
        openTasks: personTasks.length,
        overdue: personTasks.filter(isTaskOverdue).length,
        openRisks: risks.filter((r) => ids.has(r.projectId) && r.ownerId === person.id && isRiskOpen(r)).length,
      }
    })
    .filter((w) => w.managed || w.openTasks || w.openRisks)
    .sort((a, b) => b.managed - a.managed || b.openTasks - a.openTasks)

  const dependencies = list.flatMap((i) =>
    i.project.dependencyIds.map((depId) => {
      const dep = byId.get(depId)
      const blocking = dep && dep.project.status !== 'concluido' && (dep.delayed || dep.riskLevel === 'alto')
      return { from: i, dep, blocking }
    }),
  )

  return (
    <div>
      <PageHeader title="Portfólio" description="Visão consolidada para gestores: situação geral sem precisar abrir cada projeto." />
      <FilterBar>
        <Select value={showClosed} onChange={(e) => setShowClosed(e.target.value)} className="sm:w-56" aria-label="Projetos exibidos">
          <option value="ativos">Somente projetos ativos</option>
          <option value="todos">Incluir concluídos e cancelados</option>
        </Select>
        <Select value={area} onChange={(e) => setArea(e.target.value)} className="sm:w-56" aria-label="Área">
          <option value="">Todas as áreas</option>
          {AREAS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
      </FilterBar>

      {/* Distribuição por status e prioridade */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {PROJECT_STATUSES.map((s) => {
              const n = list.filter((i) => i.project.status === s.value).length
              return (
                <div key={s.value} className="flex items-center gap-3">
                  <span className="w-48 shrink-0">
                    <OptionBadge options={PROJECT_STATUSES} value={s.value} />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${list.length ? (n / list.length) * 100 : 0}%` }} />
                  </div>
                  <span className="w-6 text-right text-sm font-medium tabular-nums">{n}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prioridade × nível de risco</CardTitle>
            <CardDescription>Quantidade de projetos em cada combinação.</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Prioridade</th>
                  <th className="pb-2 text-center font-medium">Baixo</th>
                  <th className="pb-2 text-center font-medium">Atenção</th>
                  <th className="pb-2 text-center font-medium">Alto</th>
                </tr>
              </thead>
              <tbody>
                {[...PRIORITIES].reverse().map((p) => (
                  <tr key={p.value} className="border-t border-border">
                    <td className="py-2">
                      <OptionBadge options={PRIORITIES} value={p.value} dot={false} />
                    </td>
                    {(['baixo', 'medio', 'alto'] as const).map((lvl) => {
                      const n = list.filter((i) => i.project.priority === p.value && i.riskLevel === lvl).length
                      const strong = n > 0 && lvl === 'alto' && (p.value === 'alta' || p.value === 'critica')
                      return (
                        <td key={lvl} className="py-2 text-center">
                          <span
                            className={cn(
                              'inline-flex size-8 items-center justify-center rounded-md tabular-nums',
                              n === 0 ? 'text-muted-foreground' : strong ? 'bg-red-100 font-semibold text-red-800' : lvl === 'alto' ? 'bg-red-50 text-red-700' : lvl === 'medio' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800',
                            )}
                          >
                            {n}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Visão consolidada */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Situação dos projetos</CardTitle>
          <CardDescription>Ordenados pelo nível de risco e pelo prazo.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <Table>
            <THead>
              <tr>
                <TH className="pl-5">Projeto</TH>
                <TH>Responsável</TH>
                <TH>Prioridade</TH>
                <TH>Status</TH>
                <TH>Progresso real × esperado</TH>
                <TH>Prazo</TH>
                <TH>Riscos abertos</TH>
                <TH>Dependências</TH>
                <TH>Risco</TH>
              </tr>
            </THead>
            <TBody>
              {list.map((i) => (
                <TR key={i.project.id} onClick={() => navigate(`/projetos/${i.project.id}`)}>
                  <TD className="min-w-52 pl-5 font-medium">{i.project.name}</TD>
                  <TD>
                    <PersonChip name={ref.personName(i.project.managerId)} />
                  </TD>
                  <TD>
                    <OptionBadge options={PRIORITIES} value={i.project.priority} dot={false} />
                  </TD>
                  <TD>
                    <OptionBadge options={PROJECT_STATUSES} value={i.project.status} />
                  </TD>
                  <TD className="w-48">
                    <ProgressVsExpected insight={i} />
                  </TD>
                  <TD>
                    <Deadline date={i.project.endDate} closed={isProjectClosed(i.project)} />
                  </TD>
                  <TD className="tabular-nums">
                    {i.openRisks}
                    {i.criticalRisks > 0 && (
                      <Badge tone="red" className="ml-2">
                        {i.criticalRisks} crítico(s)
                      </Badge>
                    )}
                  </TD>
                  <TD className="max-w-48 text-xs text-muted-foreground">{i.project.dependencyIds.map((d) => ref.projectName(d)).join(', ') || '—'}</TD>
                  <TD>
                    <RiskLevelBadge level={i.riskLevel} reasons={i.riskReasons} />
                  </TD>
                </TR>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum projeto para os filtros selecionados.
                  </td>
                </tr>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {/* Prazos */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Linha do tempo dos projetos</CardTitle>
          <CardDescription>Barras de vigência com o progresso preenchido. Clique em um projeto para abrir.</CardDescription>
        </CardHeader>
        <CardContent>
          <Gantt
            items={[...list]
              .sort((a, b) => a.project.startDate.localeCompare(b.project.startDate))
              .map((i) => ({
                id: i.project.id,
                label: i.project.name,
                sublabel: `${labelOf(PROJECT_STATUSES, i.project.status)} · ${i.progress}%`,
                start: i.project.startDate,
                end: i.project.endDate,
                progress: i.progress,
                tone: i.project.status === 'concluido' ? 'green' : i.riskLevel === 'alto' ? 'red' : i.riskLevel === 'medio' ? 'amber' : i.project.status === 'planejamento' ? 'slate' : 'blue',
                href: `/projetos/${i.project.id}`,
              }))}
            legend={[
              { label: 'Sem alertas', tone: 'blue' },
              { label: 'Atenção', tone: 'amber' },
              { label: 'Risco alto', tone: 'red' },
              { label: 'Planejamento', tone: 'slate' },
              { label: 'Concluído', tone: 'green' },
            ]}
          />
        </CardContent>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle>Carga por responsável</CardTitle>
            <CardDescription>Projetos geridos, tarefas e riscos em aberto por pessoa.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <THead>
                <tr>
                  <TH className="pl-5">Pessoa</TH>
                  <TH className="text-right">Projetos</TH>
                  <TH className="text-right">Em risco</TH>
                  <TH className="text-right">Tarefas abertas</TH>
                  <TH className="text-right">Atrasadas</TH>
                  <TH className="pr-5 text-right">Riscos</TH>
                </tr>
              </THead>
              <TBody>
                {workload.map((w) => (
                  <TR key={w.person.id}>
                    <TD className="pl-5">
                      <PersonChip name={w.person.name} />
                      <p className="ml-8 text-xs text-muted-foreground">{w.person.role}</p>
                    </TD>
                    <TD className="text-right tabular-nums">{w.managed}</TD>
                    <TD className={cn('text-right tabular-nums', w.atRisk && 'font-semibold text-red-700')}>{w.atRisk}</TD>
                    <TD className="text-right tabular-nums">{w.openTasks}</TD>
                    <TD className={cn('text-right tabular-nums', w.overdue && 'font-semibold text-red-700')}>{w.overdue}</TD>
                    <TD className="pr-5 text-right tabular-nums">{w.openRisks}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dependências */}
        <Card>
          <CardHeader>
            <CardTitle>Dependências entre projetos</CardTitle>
            <CardDescription>Predecessores atrasados ou com risco alto podem impactar os dependentes.</CardDescription>
          </CardHeader>
          <CardContent>
            {dependencies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma dependência cadastrada.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dependencies.map(({ from, dep, blocking }, idx) => (
                  <li key={idx} className={cn('flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm', blocking ? 'border-red-200 bg-red-50/50' : 'border-border')}>
                    <Link2 className="size-4 text-muted-foreground" />
                    <Link to={`/projetos/${dep?.project.id}`} className="font-medium hover:underline">
                      {dep?.project.name ?? 'Projeto removido'}
                    </Link>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <Link to={`/projetos/${from.project.id}`} className="font-medium hover:underline">
                      {from.project.name}
                    </Link>
                    <span className="ml-auto">{blocking ? <Badge tone="red">Pode impactar</Badge> : dep && <OptionBadge options={PROJECT_STATUSES} value={dep.project.status} />}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProgressVsExpected({ insight }: { insight: ProjectInsight }) {
  const behind = insight.expectedProgress - insight.progress
  return (
    <div>
      <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={cn('h-full rounded-full', insight.project.status === 'concluido' ? 'bg-emerald-600' : 'bg-blue-600')} style={{ width: `${insight.progress}%` }} />
        <span className="absolute inset-y-0 w-0.5 bg-slate-800" style={{ left: `${insight.expectedProgress}%` }} title={`Esperado: ${insight.expectedProgress}%`} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {insight.progress}% real · {insight.expectedProgress}% esperado
        {behind > 0 && insight.project.status !== 'planejamento' && !isProjectClosed(insight.project) && <span className="text-red-700"> (−{behind} p.p.)</span>}
      </p>
    </div>
  )
}


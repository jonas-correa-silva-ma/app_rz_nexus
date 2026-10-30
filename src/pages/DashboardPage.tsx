import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardX, FolderKanban, Hourglass, ListChecks, ListTodo, PlayCircle, TimerOff, FlaskConical } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/form-controls'
import { Progress } from '@/components/ui/progress'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { AXIS, ChartCard, ChartTooltip, ENTITY_COLORS, GRID, Legend, RISK_TYPE_COLORS, SERIES } from '@/components/charts'
import { Deadline, FilterBar, OptionBadge, PageHeader, PersonChip, RiskLevelBadge, StatCard } from '@/components/common'
import { PROJECT_STATUSES } from '@/config/labels'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services, type DashboardFilter } from '@/services'
import { APP_TAGLINE } from '@/config/app'

const PERIODS: { value: DashboardFilter['period']; label: string }[] = [
  { value: 'todos', label: 'Todo o período' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '12m', label: 'Últimos 12 meses' },
  { value: 'ano', label: 'Ano atual' },
]

function HBar({ data, height = 220 }: { data: { key: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={6}>
        <CartesianGrid {...GRID} horizontal={false} vertical />
        <XAxis type="number" allowDecimals={false} {...AXIS} axisLine={false} />
        <YAxis type="category" dataKey="key" width={150} {...AXIS} axisLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: 'right', fill: '#52514e', fontSize: 12 }}>
          {data.map((d) => (
            <Cell key={d.key} fill={ENTITY_COLORS[d.key] ?? SERIES[0]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const ref = useReferenceData()
  const [filter, setFilter] = React.useState<DashboardFilter>({ period: 'todos' })
  const { data } = useQuery(() => services.dashboard.get(filter), [filter.period, filter.managerId, filter.status])
  const managers = ref.people.filter((p) => ref.projects.some((pr) => pr.managerId === p.id))

  return (
    <div>
      <PageHeader title="Dashboard" description={`Visão executiva do portfólio · ${APP_TAGLINE}`} />
      <FilterBar>
        <Select value={filter.period} onChange={(e) => setFilter({ ...filter, period: e.target.value as DashboardFilter['period'] })} className="sm:w-48" aria-label="Período">
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select value={filter.managerId ?? ''} onChange={(e) => setFilter({ ...filter, managerId: e.target.value || undefined })} className="sm:w-56" aria-label="Responsável">
          <option value="">Todos os responsáveis</option>
          {managers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select value={filter.status ?? ''} onChange={(e) => setFilter({ ...filter, status: (e.target.value || undefined) as DashboardFilter['status'] })} className="sm:w-56" aria-label="Status">
          <option value="">Todos os status</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground sm:ml-auto">Período: projetos cuja vigência coincide com a janela selecionada.</p>
      </FilterBar>

      {data && (
        <>
          <section className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Total de projetos" value={data.kpis.totalProjects} icon={FolderKanban} tone="blue" onClick={() => navigate('/projetos')} />
              <StatCard label="Em andamento" value={data.kpis.inProgress} icon={PlayCircle} tone="blue" />
              <StatCard label="Concluídos" value={data.kpis.completed} icon={CheckCircle2} tone="green" />
              <StatCard label="Atrasados" value={data.kpis.delayed} icon={CalendarClock} tone="red" hint="prazo final vencido" />
              <StatCard label="Em risco" value={data.kpis.atRisk} icon={AlertTriangle} tone="red" hint="nível de risco alto" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <StatCard label="Total de tarefas" value={data.kpis.totalTasks} icon={ListTodo} tone="slate" onClick={() => navigate('/tarefas')} />
              <StatCard label="Tarefas atrasadas" value={data.kpis.overdueTasks} icon={TimerOff} tone="red" />
              <StatCard label="Tarefas concluídas" value={data.kpis.completedTasks} icon={ListChecks} tone="green" />
              <StatCard label="Testes pendentes" value={data.kpis.pendingTests} icon={FlaskConical} tone="amber" onClick={() => navigate('/testes')} />
              <StatCard label="Testes reprovados" value={data.kpis.failedTests} icon={ClipboardX} tone="red" />
              <StatCard label="Aguardando homologação" value={data.kpis.awaitingHomologation} icon={Hourglass} tone="violet" hint="projetos" />
            </div>
          </section>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Projetos que exigem atenção</CardTitle>
              <CardDescription>Projetos com nível de risco alto ou em atenção, calculado a partir de prazos, riscos, tarefas e testes.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              {data.attention.length === 0 ? (
                <p className="px-5 pb-4 text-sm text-muted-foreground">Nenhum projeto exige atenção com os filtros atuais.</p>
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <TH className="pl-5">Projeto</TH>
                      <TH>Responsável</TH>
                      <TH>Status</TH>
                      <TH>Progresso</TH>
                      <TH>Prazo</TH>
                      <TH>Risco</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {data.attention.map((i) => (
                      <TR key={i.project.id} onClick={() => navigate(`/projetos/${i.project.id}`)}>
                        <TD className="min-w-56 pl-5">
                          <p className="font-medium">{i.project.name}</p>
                          <p className="text-xs text-muted-foreground">{i.riskReasons.slice(0, 2).join(' · ')}</p>
                        </TD>
                        <TD>
                          <PersonChip name={ref.personName(i.project.managerId)} />
                        </TD>
                        <TD>
                          <OptionBadge options={PROJECT_STATUSES} value={i.project.status} />
                        </TD>
                        <TD className="w-40">
                          <Progress value={i.progress} showLabel />
                          <p className="mt-0.5 text-[11px] text-muted-foreground">esperado {i.expectedProgress}%</p>
                        </TD>
                        <TD>
                          <Deadline date={i.project.endDate} />
                        </TD>
                        <TD>
                          <RiskLevelBadge level={i.riskLevel} reasons={i.riskReasons} />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <ChartCard
              title="Projetos por status"
              table={{ columns: ['Status', 'Projetos'], rows: data.projectsByStatus.map((d) => [d.key, d.value]) }}
              empty={!data.projectsByStatus.length}
            >
              <HBar data={data.projectsByStatus} />
            </ChartCard>
            <ChartCard title="Projetos por prioridade" table={{ columns: ['Prioridade', 'Projetos'], rows: data.projectsByPriority.map((d) => [d.key, d.value]) }} empty={!data.kpis.totalProjects}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.projectsByPriority} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="key" {...AXIS} />
                  <YAxis allowDecimals={false} {...AXIS} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="value" name="Projetos" radius={[4, 4, 0, 0]} maxBarSize={44} label={{ position: 'top', fill: '#52514e', fontSize: 12 }}>
                    {data.projectsByPriority.map((d) => (
                      <Cell key={d.key} fill={ENTITY_COLORS[d.key]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Evolução dos projetos"
              description="Acumulado nos últimos 12 meses"
              table={{ columns: ['Mês', 'Iniciados', 'Concluídos', 'Em aberto'], rows: data.evolution.map((d) => [d.month, d.iniciados, d.concluidos, d.emAberto]) }}
              empty={!data.kpis.totalProjects}
            >
              <ResponsiveContainer width="100%" height={196}>
                <LineChart data={data.evolution} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="month" {...AXIS} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} {...AXIS} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="iniciados" name="Iniciados" stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="concluidos" name="Concluídos" stroke={SERIES[2]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="emAberto" name="Em aberto" stroke={SERIES[1]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <Legend
                items={[
                  { label: 'Iniciados', color: SERIES[0] },
                  { label: 'Concluídos', color: SERIES[2] },
                  { label: 'Em aberto', color: SERIES[1] },
                ]}
              />
            </ChartCard>
            <ChartCard title="Tarefas por status" table={{ columns: ['Status', 'Tarefas'], rows: data.tasksByStatus.map((d) => [d.key, d.value]) }} empty={!data.kpis.totalTasks}>
              <HBar data={data.tasksByStatus} />
            </ChartCard>
            <ChartCard
              title="Distribuição de riscos"
              description="Registros em aberto por severidade e tipo"
              table={{
                columns: ['Severidade', 'Risco', 'Problema', 'Impedimento', 'Pendência'],
                rows: data.risksBySeverity.map((d) => [d.key, d.risco, d.problema, d.impedimento, d.pendencia]),
              }}
              empty={data.risksBySeverity.every((d) => d.risco + d.problema + d.impedimento + d.pendencia === 0)}
            >
              <ResponsiveContainer width="100%" height={196}>
                <BarChart data={data.risksBySeverity} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="key" {...AXIS} />
                  <YAxis allowDecimals={false} {...AXIS} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="risco" name="Risco" stackId="a" fill={RISK_TYPE_COLORS.risco} stroke="#fff" strokeWidth={1} maxBarSize={44} />
                  <Bar dataKey="problema" name="Problema" stackId="a" fill={RISK_TYPE_COLORS.problema} stroke="#fff" strokeWidth={1} />
                  <Bar dataKey="impedimento" name="Impedimento" stackId="a" fill={RISK_TYPE_COLORS.impedimento} stroke="#fff" strokeWidth={1} />
                  <Bar dataKey="pendencia" name="Pendência" stackId="a" fill={RISK_TYPE_COLORS.pendencia} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <Legend
                items={[
                  { label: 'Risco', color: RISK_TYPE_COLORS.risco },
                  { label: 'Problema', color: RISK_TYPE_COLORS.problema },
                  { label: 'Impedimento', color: RISK_TYPE_COLORS.impedimento },
                  { label: 'Pendência', color: RISK_TYPE_COLORS.pendencia },
                ]}
              />
            </ChartCard>
            <ChartCard
              title="Situação dos testes"
              description={<Link to="/testes" className="text-primary hover:underline">Ver testes e homologação</Link>}
              table={{ columns: ['Status', 'Casos'], rows: data.testsByStatus.map((d) => [d.key, d.value]) }}
              empty={data.testsByStatus.every((d) => d.value === 0)}
            >
              <HBar data={data.testsByStatus} />
            </ChartCard>
          </section>
        </>
      )}
    </div>
  )
}

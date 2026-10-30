import * as React from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ArrowLeft,
  BarChart3,
  CalendarRange,
  ClipboardCheck,
  FileText,
  History,
  LayoutGrid,
  ListChecks,
  MessageSquareText,
  Pencil,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/form-controls'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AXIS, ChartCard, ChartTooltip, ENTITY_COLORS, GRID } from '@/components/charts'
import { ConfirmDialog, InfoItem, OptionBadge, PersonChip, RiskLevelBadge, runAction, StatCard } from '@/components/common'
import { Gantt, type GanttItem } from '@/components/common/Gantt'
import { HOMOLOGATION_STATUSES, labelOf, PRIORITIES, PROGRESS_RULES, PROJECT_STATUSES, PROJECT_TEST_STATUSES, SEVERITIES, TASK_STATUSES } from '@/config/labels'
import { computeSeverity, isRiskOpen, isTaskOverdue } from '@/domain/rules'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { ProjectFormDialog } from '@/modules/projects/ProjectFormDialog'
import { RiskBoard } from '@/modules/risks/RiskBoard'
import { TaskBoard } from '@/modules/tasks/TaskBoard'
import { ProjectTestPanel } from '@/modules/tests/ProjectTestPanel'
import { DocumentBoard } from '@/modules/documents/DocumentBoard'
import { UpdateTimeline } from '@/modules/updates/UpdateTimeline'
import { services } from '@/services'
import type { ProjectInsight, ProjectStatus, Task } from '@/types'
import { daysUntil, formatDate, formatDateTime } from '@/utils/dates'
import { AlertTriangle, CalendarClock, CheckCircle2, ListTodo, TimerOff } from 'lucide-react'

const TABS = [
  { value: 'visao', label: 'Visão geral', icon: LayoutGrid },
  { value: 'tarefas', label: 'Tarefas', icon: ListChecks },
  { value: 'cronograma', label: 'Cronograma', icon: CalendarRange },
  { value: 'riscos', label: 'Riscos', icon: ShieldAlert },
  { value: 'atualizacoes', label: 'Atualizações', icon: MessageSquareText },
  { value: 'documentos', label: 'Documentos', icon: FileText },
  { value: 'testes', label: 'Testes', icon: ClipboardCheck },
  { value: 'indicadores', label: 'Indicadores', icon: BarChart3 },
  { value: 'historico', label: 'Histórico', icon: History },
]

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('aba')) ? params.get('aba')! : 'visao'
  const ref = useReferenceData()
  const { data: insight, loading } = useQuery(() => services.projects.insight(id), [id])
  const { data: tasks = [] } = useQuery(() => services.tasks.list({ projectId: id }), [id])
  const { data: risks = [] } = useQuery(() => services.risks.list({ projectId: id }), [id])
  const { data: settings } = useQuery(() => services.settings.get())
  const [editing, setEditing] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)

  if (loading && !insight) return null
  if (!insight) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Projeto não encontrado</p>
        <Link to="/projetos" className="mt-2 inline-block text-sm text-primary hover:underline">
          Voltar para projetos
        </Link>
      </div>
    )
  }
  const p = insight.project
  const openRisks = risks.filter(isRiskOpen)

  return (
    <div>
      <Link to="/projetos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Projetos
      </Link>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
            <OptionBadge options={PRIORITIES} value={p.priority} dot={false} />
            <RiskLevelBadge level={insight.riskLevel} reasons={insight.riskReasons} />
            {p.requiresTests && <Badge tone="violet">Exige testes</Badge>}
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{p.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.area} · {p.category} · {formatDate(p.startDate)} a {formatDate(p.endDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={p.status}
            onChange={(e) => runAction(() => services.projects.update(p.id, { status: e.target.value as ProjectStatus }), 'Status do projeto atualizado.')}
            className="w-56"
            aria-label="Status do projeto"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil /> Editar
          </Button>
          <Button variant="ghost" size="icon" title="Excluir projeto" onClick={() => setRemoving(true)}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <Card className="mb-5 grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Progresso</p>
          <Progress value={insight.progress} showLabel className="mt-2" tone={p.status === 'concluido' ? 'green' : 'blue'} />
          <p className="mt-1 text-[11px] text-muted-foreground">Esperado pelo prazo: {insight.expectedProgress}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-1.5">
            <OptionBadge options={PROJECT_STATUSES} value={p.status} />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Gerente</p>
          <div className="mt-1.5 text-sm">
            <PersonChip name={ref.personName(p.managerId)} />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prazo final</p>
          <p className={`mt-1.5 text-sm font-medium ${insight.delayed ? 'text-red-700' : ''}`}>
            {formatDate(p.endDate)}
            {insight.delayed && ` · ${Math.abs(daysUntil(p.endDate) ?? 0)} dias de atraso`}
          </p>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setParams(v === 'visao' ? {} : { aba: v }, { replace: true })}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              <t.icon /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visao">
          <OverviewTab insight={insight} openRisks={openRisks.length} tasks={tasks} />
        </TabsContent>
        <TabsContent value="tarefas">
          <TaskBoard projectId={p.id} />
        </TabsContent>
        <TabsContent value="cronograma">
          <Card className="p-4">
            <Gantt
              items={[
                { id: p.id, label: 'Projeto completo', sublabel: `${formatDate(p.startDate)} a ${formatDate(p.endDate)}`, start: p.startDate, end: p.endDate, progress: insight.progress, tone: insight.delayed ? 'red' : 'violet' },
                ...[...tasks]
                  .filter((t) => t.status !== 'cancelada')
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map(
                    (t): GanttItem => ({
                      id: t.id,
                      label: t.name,
                      sublabel: `${ref.personName(t.assigneeId)} · ${labelOf(TASK_STATUSES, t.status)}`,
                      start: t.startDate,
                      end: t.dueDate,
                      progress: t.progress,
                      tone: t.status === 'concluida' ? 'green' : isTaskOverdue(t) || t.status === 'bloqueada' ? 'red' : t.status === 'nao_iniciada' ? 'slate' : 'blue',
                    }),
                  ),
              ]}
              legend={[
                { label: 'Concluída', tone: 'green' },
                { label: 'Em andamento', tone: 'blue' },
                { label: 'Não iniciada', tone: 'slate' },
                { label: 'Atrasada ou bloqueada', tone: 'red' },
              ]}
            />
          </Card>
        </TabsContent>
        <TabsContent value="riscos">
          <RiskBoard risks={risks} projectId={p.id} />
        </TabsContent>
        <TabsContent value="atualizacoes">
          <UpdateTimeline projectId={p.id} />
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentBoard projectId={p.id} />
        </TabsContent>
        <TabsContent value="testes">
          <ProjectTestPanel insight={insight} />
        </TabsContent>
        <TabsContent value="indicadores">
          <IndicatorsTab insight={insight} tasks={tasks} risks={risks} ruleLabel={PROGRESS_RULES.find((r) => r.value === settings?.progressRule)?.label} />
        </TabsContent>
        <TabsContent value="historico">
          <HistoryTab projectId={p.id} />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={p} />
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title="Excluir projeto"
        description={`O projeto "${p.name}" e todos os registros vinculados serão excluídos.`}
        onConfirm={async () => {
          const ok = await runAction(async () => {
            await services.projects.remove(p.id)
            return true
          }, 'Projeto excluído.')
          if (ok) navigate('/projetos')
        }}
      />
    </div>
  )
}

function OverviewTab({ insight, openRisks, tasks }: { insight: ProjectInsight; openRisks: number; tasks: Task[] }) {
  const ref = useReferenceData()
  const { data: allProjects = [] } = useQuery(() => services.projects.list())
  const p = insight.project
  const dependents = allProjects.filter((x) => x.dependencyIds.includes(p.id))
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Informações do projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoItem label="Descrição" className="sm:col-span-2">
              {p.description}
            </InfoItem>
            <InfoItem label="Objetivo" className="sm:col-span-2">
              {p.objective}
            </InfoItem>
            <InfoItem label="Categoria">{p.category}</InfoItem>
            <InfoItem label="Área">{p.area}</InfoItem>
            <InfoItem label="Patrocinador">{ref.personName(p.sponsorId)}</InfoItem>
            <InfoItem label="Gerente">{ref.personName(p.managerId)}</InfoItem>
            <InfoItem label="Responsáveis (equipe)" className="sm:col-span-2">
              {p.memberIds.length ? (
                <div className="flex flex-wrap gap-3">
                  {p.memberIds.map((id) => (
                    <PersonChip key={id} name={ref.personName(id)} />
                  ))}
                </div>
              ) : null}
            </InfoItem>
            <InfoItem label="Data de início">{formatDate(p.startDate)}</InfoItem>
            <InfoItem label="Data de término">{formatDate(p.endDate)}</InfoItem>
            <InfoItem label="Exige testes?">{p.requiresTests ? 'Sim' : 'Não'}</InfoItem>
            <InfoItem label="Concluído em">{p.completedAt ? formatDate(p.completedAt) : null}</InfoItem>
            <InfoItem label="Depende de">
              {p.dependencyIds.length ? (
                <div className="flex flex-col gap-1">
                  {p.dependencyIds.map((id) => (
                    <Link key={id} to={`/projetos/${id}`} className="text-primary hover:underline">
                      {ref.projectName(id)}
                    </Link>
                  ))}
                </div>
              ) : null}
            </InfoItem>
            <InfoItem label="Projetos dependentes">
              {dependents.length ? (
                <div className="flex flex-col gap-1">
                  {dependents.map((d) => (
                    <Link key={d.id} to={`/projetos/${d.id}`} className="text-primary hover:underline">
                      {d.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </InfoItem>
            <InfoItem label="Observações" className="sm:col-span-2">
              {p.notes}
            </InfoItem>
          </dl>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Situação</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row label="Nível de risco">
              <RiskLevelBadge level={insight.riskLevel} />
            </Row>
            <Row label="Tarefas abertas">{tasks.filter((t) => t.status !== 'concluida' && t.status !== 'cancelada').length}</Row>
            <Row label="Tarefas atrasadas">{insight.overdueTasks}</Row>
            <Row label="Riscos e pendências abertos">{openRisks}</Row>
            <Row label="Testes">
              <OptionBadge options={PROJECT_TEST_STATUSES} value={insight.testStatus} />
            </Row>
            <Row label="Homologação">
              <OptionBadge options={HOMOLOGATION_STATUSES} value={insight.homologationStatus} />
            </Row>
          </CardContent>
        </Card>
        {insight.riskReasons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pontos de atenção</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm">
                {insight.riskReasons.map((r) => (
                  <li key={r} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}

function IndicatorsTab({ insight, tasks, risks, ruleLabel }: { insight: ProjectInsight; tasks: Task[]; risks: Awaited<ReturnType<typeof services.risks.list>>; ruleLabel?: string }) {
  const { data: metrics } = useQuery(() => services.tests.metrics({ projectId: insight.project.id }), [insight.project.id])
  const remaining = daysUntil(insight.project.endDate) ?? 0
  const tasksByStatus = TASK_STATUSES.map((s) => ({ key: s.label, value: tasks.filter((t) => t.status === s.value).length }))
  const open = risks.filter(isRiskOpen)
  const risksBySeverity = SEVERITIES.map((s) => ({ key: s.label, value: open.filter((r) => computeSeverity(r.probability, r.impact) === s.value).length }))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Progresso real" value={`${insight.progress}%`} icon={CheckCircle2} tone="blue" hint={ruleLabel} />
        <StatCard label="Progresso esperado" value={`${insight.expectedProgress}%`} icon={CalendarClock} tone="slate" hint="pelo prazo decorrido" />
        <StatCard label={remaining >= 0 ? 'Dias restantes' : 'Dias de atraso'} value={Math.abs(remaining)} icon={CalendarClock} tone={remaining >= 0 ? 'slate' : 'red'} />
        <StatCard label="Tarefas" value={tasks.length} icon={ListTodo} tone="slate" />
        <StatCard label="Tarefas atrasadas" value={insight.overdueTasks} icon={TimerOff} tone="red" />
        <StatCard label="Riscos críticos abertos" value={insight.criticalRisks} icon={AlertTriangle} tone="red" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Tarefas por status" table={{ columns: ['Status', 'Tarefas'], rows: tasksByStatus.map((d) => [d.key, d.value]) }} empty={!tasks.length}>
          <MiniBars data={tasksByStatus} />
        </ChartCard>
        <ChartCard title="Riscos abertos por severidade" table={{ columns: ['Severidade', 'Registros'], rows: risksBySeverity.map((d) => [d.key, d.value]) }} empty={!open.length}>
          <MiniBars data={risksBySeverity} />
        </ChartCard>
        <ChartCard
          title="Testes"
          table={{ columns: ['Indicador', 'Valor'], rows: metrics ? [['Casos', metrics.total], ['Execução', `${metrics.executionRate}%`], ['Aprovação', `${metrics.approvalRate}%`], ['Falhas abertas', metrics.openFailures], ['Retestes pendentes', metrics.pendingRetests]] : [] }}
          empty={!insight.project.requiresTests || !metrics?.total}
        >
          {metrics && (
            <div className="flex flex-col gap-4 pt-2">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Percentual de execução</p>
                <Progress value={metrics.executionRate} showLabel />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Percentual de aprovação</p>
                <Progress value={metrics.approvalRate} showLabel tone="green" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Row label="Falhas abertas">{metrics.openFailures}</Row>
                <Row label="Retestes">{metrics.pendingRetests}</Row>
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

function MiniBars({ data }: { data: { key: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 16, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="key" {...AXIS} interval={0} fontSize={11} />
        <YAxis allowDecimals={false} {...AXIS} axisLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="value" name="Quantidade" radius={[4, 4, 0, 0]} maxBarSize={36} label={{ position: 'top', fill: '#52514e', fontSize: 12 }}>
          {data.map((d) => (
            <Cell key={d.key} fill={ENTITY_COLORS[d.key]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function HistoryTab({ projectId }: { projectId: string }) {
  const ref = useReferenceData()
  const { data: history = [] } = useQuery(() => services.projects.history(projectId), [projectId])
  if (!history.length) return <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
  return (
    <Card className="p-4">
      <ol className="flex flex-col">
        {history.map((h) => (
          <li key={h.id} className="flex flex-col gap-0.5 border-b border-border py-3 last:border-0 sm:flex-row sm:items-start sm:gap-4">
            <span className="w-44 shrink-0 text-xs text-muted-foreground">{formatDateTime(h.date)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{h.action}</p>
              {h.detail && <p className="text-sm text-muted-foreground">{h.detail}</p>}
            </div>
            <span className="text-xs text-muted-foreground">{ref.personName(h.actorId)}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

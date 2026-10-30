import * as React from 'react'
import { Link, useSearchParams } from 'react-router'
import { BadgeCheck, ClipboardList, History, Info, PlayCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox, Select } from '@/components/ui/form-controls'
import { Progress } from '@/components/ui/progress'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FilterBar, OptionBadge, PageHeader, PersonChip, SectionTitle } from '@/components/common'
import { HOMOLOGATION_STATUSES, PROJECT_TEST_STATUSES, TEST_STATUSES } from '@/config/labels'
import { computeTestMetrics } from '@/domain/rules'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { HomologationHistory, RegisterHomologationButton } from '@/modules/tests/Homologation'
import { NewTestCaseButton, TestCaseTable } from '@/modules/tests/TestCaseTable'
import { TestMetricsCards } from '@/modules/tests/TestMetricsCards'
import { services } from '@/services'
import { formatDate } from '@/utils/dates'

export function TestsPage() {
  const ref = useReferenceData()
  const [params, setParams] = useSearchParams()
  const tab = params.get('aba') ?? 'casos'
  const { data: views = [] } = useQuery(() => services.tests.listCases())
  const { data: insights = [] } = useQuery(() => services.projects.insights())
  const [project, setProject] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [onlyRetest, setOnlyRetest] = React.useState(false)

  const testProjects = insights.filter((i) => i.project.requiresTests)
  const awaiting = testProjects.filter((i) => i.homologationStatus === 'aguardando').length
  const filtered = views.filter((v) => (!project || v.testCase.projectId === project) && (!status || v.status === status) && (!onlyRetest || v.retestPending))
  const executions = views
    .flatMap((v) => v.executions.map((e) => ({ e, v })))
    .sort((a, b) => (b.e.date + b.e.createdAt).localeCompare(a.e.date + a.e.createdAt))

  return (
    <div>
      <PageHeader title="Testes e homologação" description="Validação pelos usuários nos projetos que exigem testes. O módulo é opcional por projeto." actions={<NewTestCaseButton />} />
      <TestMetricsCards metrics={computeTestMetrics(views)} awaitingHomologation={awaiting} />

      <Tabs className="mt-6" value={tab} onValueChange={(v) => setParams(v === 'casos' ? {} : { aba: v }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="casos">
            <ClipboardList /> Casos de teste
          </TabsTrigger>
          <TabsTrigger value="execucoes">
            <PlayCircle /> Execuções
          </TabsTrigger>
          <TabsTrigger value="homologacao">
            <BadgeCheck /> Homologação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="casos">
          <FilterBar>
            <Select value={project} onChange={(e) => setProject(e.target.value)} className="sm:w-64" aria-label="Projeto">
              <option value="">Todos os projetos com testes</option>
              {testProjects.map((i) => (
                <option key={i.project.id} value={i.project.id}>
                  {i.project.name}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44" aria-label="Status">
              <option value="">Todos os status</option>
              {TEST_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Checkbox label="Somente aguardando reteste" checked={onlyRetest} onChange={(e) => setOnlyRetest(e.target.checked)} />
            <p className="text-xs text-muted-foreground sm:ml-auto">Clique em um caso para ver o histórico de execuções e evidências.</p>
          </FilterBar>
          <TestCaseTable views={filtered} />
        </TabsContent>

        <TabsContent value="execucoes">
          <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <History className="size-4" /> Todas as tentativas são preservadas. Um caso pode ter várias execuções; o status do caso é o da mais recente.
          </p>
          <Card className="overflow-hidden">
            <Table>
              <THead>
                <tr>
                  <TH>Data</TH>
                  <TH>Caso</TH>
                  <TH>Projeto</TH>
                  <TH>Tentativa</TH>
                  <TH>Executor</TH>
                  <TH>Resultado obtido</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {executions.map(({ e, v }) => (
                  <TR key={e.id}>
                    <TD className="whitespace-nowrap">{formatDate(e.date)}</TD>
                    <TD className="min-w-48">
                      <span className="font-mono text-xs text-muted-foreground">{v.testCase.code}</span> {v.testCase.name}
                    </TD>
                    <TD className="max-w-48">
                      <Link to={`/projetos/${v.testCase.projectId}?aba=testes`} className="text-sm text-primary hover:underline">
                        {ref.projectName(v.testCase.projectId)}
                      </Link>
                    </TD>
                    <TD className="tabular-nums">
                      {e.attempt}
                      {e.id !== v.latest?.id && <span className="ml-1 text-xs text-muted-foreground">(anterior)</span>}
                    </TD>
                    <TD>
                      <PersonChip name={ref.personName(e.executorId)} />
                    </TD>
                    <TD className="min-w-56 max-w-80 text-sm text-muted-foreground">{e.actualResult || '—'}</TD>
                    <TD>
                      <div className="flex flex-col items-start gap-1">
                        <OptionBadge options={TEST_STATUSES} value={e.status} />
                        {e.needsRetest && e.id === v.latest?.id && <Badge tone="amber">Reteste pendente</Badge>}
                      </div>
                    </TD>
                  </TR>
                ))}
                {executions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhuma execução registrada.
                    </td>
                  </tr>
                )}
              </TBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="homologacao">
          <div className="mb-4 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>Testes executados e aprovados não equivalem a homologação aprovada. A homologação é o aceite formal do aprovador designado no projeto.</p>
          </div>
          <SectionTitle>Projetos que exigem testes</SectionTitle>
          <Card className="mb-6 overflow-hidden">
            <Table>
              <THead>
                <tr>
                  <TH>Projeto</TH>
                  <TH>Aprovador</TH>
                  <TH>Situação dos testes</TH>
                  <TH>Aprovação dos casos</TH>
                  <TH>Homologação</TH>
                  <TH />
                </tr>
              </THead>
              <TBody>
                {testProjects.map((i) => {
                  const m = computeTestMetrics(views.filter((v) => v.testCase.projectId === i.project.id))
                  return (
                    <TR key={i.project.id}>
                      <TD className="min-w-56">
                        <Link to={`/projetos/${i.project.id}?aba=testes`} className="font-medium hover:underline">
                          {i.project.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{i.project.testConfig?.testType}</p>
                      </TD>
                      <TD className="whitespace-nowrap">{ref.personName(i.project.testConfig?.approverId)}</TD>
                      <TD>
                        <OptionBadge options={PROJECT_TEST_STATUSES} value={i.testStatus} />
                      </TD>
                      <TD className="w-44">
                        <Progress value={m.approvalRate} showLabel tone="green" />
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {m.byStatus.aprovado} de {m.total} caso(s)
                        </p>
                      </TD>
                      <TD>
                        <OptionBadge options={HOMOLOGATION_STATUSES} value={i.homologationStatus} />
                      </TD>
                      <TD className="text-right">{i.project.status !== 'concluido' && i.project.status !== 'cancelado' && <RegisterHomologationButton insight={i} size="sm" />}</TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </Card>
          <SectionTitle>Histórico de homologações</SectionTitle>
          <HomologationHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import * as React from 'react'
import { FlaskConical, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, InfoItem, OptionBadge, runAction, SectionTitle } from '@/components/common'
import { HOMOLOGATION_STATUSES, PROJECT_TEST_STATUSES } from '@/config/labels'
import { useQuery } from '@/hooks/useQuery'
import { useReferenceData } from '@/hooks/useReferenceData'
import { ProjectFormDialog } from '@/modules/projects/ProjectFormDialog'
import { services } from '@/services'
import type { ProjectInsight } from '@/types'
import { formatDate } from '@/utils/dates'
import { HomologationHistory, RegisterHomologationButton } from './Homologation'
import { NewTestCaseButton, TestCaseTable } from './TestCaseTable'
import { TestMetricsCards } from './TestMetricsCards'

/** Aba de testes do projeto: configuração, indicadores, casos, execuções e homologação. */
export function ProjectTestPanel({ insight }: { insight: ProjectInsight }) {
  const project = insight.project
  const ref = useReferenceData()
  const { data: views = [] } = useQuery(() => services.tests.listCases({ projectId: project.id }), [project.id])
  const { data: metrics } = useQuery(() => services.tests.metrics({ projectId: project.id }), [project.id])
  const [editing, setEditing] = React.useState(false)

  if (!project.requiresTests) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="Este projeto não exige testes formais"
        description="O módulo de testes e homologação é opcional por projeto. Ative-o se houver validação pelos usuários."
        action={
          <Button
            onClick={() =>
              runAction(
                () => services.projects.update(project.id, { requiresTests: true, testConfig: project.testConfig ?? { testType: 'Teste de aceitação do usuário (UAT)', testerIds: [], approvalCriteria: '' } }),
                'Testes habilitados para o projeto.',
              )
            }
          >
            Habilitar testes neste projeto
          </Button>
        }
      />
    )
  }

  const tc = project.testConfig
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Configuração de testes</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Settings2 /> Editar configuração
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <InfoItem label="Tipo de teste">{tc?.testType}</InfoItem>
            <InfoItem label="Coordenador">{ref.personName(tc?.coordinatorId)}</InfoItem>
            <InfoItem label="Aprovador">{ref.personName(tc?.approverId)}</InfoItem>
            <InfoItem label="Data planejada">{formatDate(tc?.plannedDate)}</InfoItem>
            <InfoItem label="Responsáveis" className="col-span-2">
              {tc?.testerIds.map((id) => ref.personName(id)).join(', ')}
            </InfoItem>
            <InfoItem label="Critérios de aprovação" className="col-span-2">
              {tc?.approvalCriteria}
            </InfoItem>
            <InfoItem label="Status geral dos testes">
              <OptionBadge options={PROJECT_TEST_STATUSES} value={insight.testStatus} />
            </InfoItem>
            <InfoItem label="Homologação">
              <OptionBadge options={HOMOLOGATION_STATUSES} value={insight.homologationStatus} />
            </InfoItem>
          </dl>
        </CardContent>
      </Card>

      {metrics && <TestMetricsCards metrics={metrics} />}

      <div>
        <SectionTitle action={<NewTestCaseButton projectId={project.id} />}>Casos de teste</SectionTitle>
        <TestCaseTable views={views} projectId={project.id} showProject={false} emptyAction={false} />
      </div>

      <div>
        <SectionTitle action={<RegisterHomologationButton insight={insight} size="sm" />}>Homologação</SectionTitle>
        <HomologationHistory projectId={project.id} />
      </div>

      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={project} />
    </div>
  )
}

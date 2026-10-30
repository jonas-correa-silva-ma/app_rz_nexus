import * as React from 'react'
import { Link } from 'react-router'
import { ClipboardCheck, Pencil, PlayCircle, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ConfirmDialog, EmptyState, OptionBadge, runAction } from '@/components/common'
import { PRIORITIES, TEST_STATUSES } from '@/config/labels'
import { useReferenceData } from '@/hooks/useReferenceData'
import { services } from '@/services'
import type { ID, TestCase, TestCaseView } from '@/types'
import { formatDate } from '@/utils/dates'
import { ExecutionDialog } from './ExecutionDialog'
import { TestCaseDetailDialog } from './TestCaseDetailDialog'
import { TestCaseFormDialog } from './TestCaseFormDialog'

/** Tabela de casos de teste com ações de execução, edição e consulta do histórico. */
export function TestCaseTable({ views, projectId, showProject = true, emptyAction = true }: { views: TestCaseView[]; projectId?: ID; showProject?: boolean; emptyAction?: boolean }) {
  const ref = useReferenceData()
  const [detailId, setDetailId] = React.useState<ID>()
  const [executing, setExecuting] = React.useState<TestCaseView>()
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<TestCase>()
  const [removing, setRemoving] = React.useState<TestCase>()
  const detailProject = views.find((v) => v.testCase.id === detailId)?.testCase.projectId

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <>
      {views.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nenhum caso de teste"
          description="Cadastre os casos que serão executados pelos usuários."
          action={emptyAction ? <Button onClick={openNew}><Plus /> Novo caso de teste</Button> : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>ID</TH>
                <TH>Caso de teste</TH>
                {showProject && <TH>Projeto</TH>}
                <TH>Prioridade</TH>
                <TH>Responsável</TH>
                <TH>Tentativas</TH>
                <TH>Última execução</TH>
                <TH>Status</TH>
                <TH className="w-28" />
              </tr>
            </THead>
            <TBody>
              {views.map((v) => (
                <TR key={v.testCase.id} onClick={() => setDetailId(v.testCase.id)}>
                  <TD className="font-mono text-xs text-muted-foreground">{v.testCase.code}</TD>
                  <TD className="min-w-56 max-w-80">
                    <p className="font-medium">{v.testCase.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.testCase.system}
                      {v.testCase.feature && ` · ${v.testCase.feature}`}
                    </p>
                  </TD>
                  {showProject && (
                    <TD className="max-w-48">
                      <Link to={`/projetos/${v.testCase.projectId}?aba=testes`} className="text-sm text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {ref.projectName(v.testCase.projectId)}
                      </Link>
                    </TD>
                  )}
                  <TD>
                    <OptionBadge options={PRIORITIES} value={v.testCase.priority} dot={false} />
                  </TD>
                  <TD className="whitespace-nowrap">{ref.personName(v.testCase.ownerId)}</TD>
                  <TD className="tabular-nums">{v.executions.length}</TD>
                  <TD className="whitespace-nowrap">{v.latest ? formatDate(v.latest.date) : '—'}</TD>
                  <TD>
                    <div className="flex flex-col items-start gap-1">
                      <OptionBadge options={TEST_STATUSES} value={v.status} />
                      {v.retestPending && <Badge tone="amber">Aguardando reteste</Badge>}
                    </div>
                  </TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" title="Registrar execução" onClick={() => setExecuting(v)}>
                        <PlayCircle />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Editar"
                        onClick={() => {
                          setEditing(v.testCase)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Excluir" onClick={() => setRemoving(v.testCase)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <TestCaseDetailDialog caseId={detailId} projectId={detailProject} onOpenChange={(o) => !o && setDetailId(undefined)} />
      <ExecutionDialog open={!!executing} onOpenChange={(o) => !o && setExecuting(undefined)} view={executing} />
      <TestCaseFormDialog open={formOpen} onOpenChange={setFormOpen} testCase={editing} projectId={projectId} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(undefined)}
        title="Excluir caso de teste"
        description={`O caso ${removing?.code} e todas as suas execuções e evidências serão excluídos.`}
        onConfirm={async () => {
          if (removing) await runAction(() => services.tests.removeCase(removing.id), 'Caso de teste excluído.')
        }}
      />
    </>
  )
}

/** Botão + diálogo para cadastrar caso de teste fora da tabela. */
export function NewTestCaseButton({ projectId }: { projectId?: ID }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Novo caso de teste
      </Button>
      <TestCaseFormDialog open={open} onOpenChange={setOpen} projectId={projectId} />
    </>
  )
}

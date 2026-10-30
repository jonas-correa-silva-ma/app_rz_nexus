import * as React from 'react'
import { Database, Eraser, Info, RotateCcw, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/form-controls'
import { Progress } from '@/components/ui/progress'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ConfirmDialog, PageHeader, runAction } from '@/components/common'
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '@/config/app'
import { PROGRESS_RULES } from '@/config/labels'
import { useQuery } from '@/hooks/useQuery'
import { services } from '@/services'
import type { ProgressRule } from '@/types'
import { formatBytes } from '@/utils/format'

export function SettingsPage() {
  const { data: settings } = useQuery(() => services.settings.get())
  const { data: people = [] } = useQuery(() => services.people.list())
  const { data: storage } = useQuery(() => services.settings.storageInfo())
  const [confirm, setConfirm] = React.useState<'reset' | 'clear'>()
  const [threshold, setThreshold] = React.useState('')

  React.useEffect(() => {
    if (settings) setThreshold(String(settings.scheduleGapThreshold))
  }, [settings])

  if (!settings) return null

  return (
    <div>
      <PageHeader title="Configurações" description="Regras de cálculo, dados de demonstração e informações do protótipo." />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Regra de progresso dos projetos</CardTitle>
            <CardDescription>Define como o percentual do projeto é calculado a partir das tarefas. A alteração recalcula todos os indicadores.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {PROGRESS_RULES.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${settings.progressRule === r.value ? 'border-primary bg-accent' : 'border-border hover:bg-muted/50'}`}
              >
                <input
                  type="radio"
                  name="rule"
                  className="mt-1 accent-primary"
                  checked={settings.progressRule === r.value}
                  onChange={() => runAction(() => services.settings.update({ progressRule: r.value as ProgressRule }), 'Regra de progresso atualizada.')}
                />
                <span>
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.description}</span>
                </span>
              </label>
            ))}
            <Field label="Limite de atraso de cronograma (p.p.)" hint="Diferença entre progresso esperado e real a partir da qual o projeto é considerado em risco alto (metade do valor gera 'atenção')." className="mt-3">
              <div className="flex gap-2">
                <Input type="number" min={5} max={100} value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-28" />
                <Button
                  variant="outline"
                  disabled={Number(threshold) === settings.scheduleGapThreshold || !(Number(threshold) >= 5 && Number(threshold) <= 100)}
                  onClick={() => runAction(() => services.settings.update({ scheduleGapThreshold: Number(threshold) }), 'Limite atualizado.')}
                >
                  Aplicar
                </Button>
              </div>
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Usuário simulado</CardTitle>
              <CardDescription>Sem autenticação nesta fase. O usuário selecionado é usado como padrão nos cadastros e no histórico.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={settings.currentUserId} onChange={(e) => runAction(() => services.settings.update({ currentUserId: e.target.value }), 'Usuário simulado alterado.')}>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-4" /> Dados de demonstração
              </CardTitle>
              <CardDescription>{storage?.backend}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <p>
                  Armazenamento provisório: os dados ficam apenas neste navegador, sem compartilhamento entre usuários, controle de acesso ou backup. Não é adequado para uso
                  corporativo multiusuário em produção.
                </p>
              </div>
              {storage && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Uso aproximado</span>
                    <span>
                      {formatBytes(storage.usedBytes)} de ~{formatBytes(storage.approxLimitBytes)}
                    </span>
                  </div>
                  <Progress value={(storage.usedBytes / storage.approxLimitBytes) * 100} />
                  <p className="mt-1 text-xs text-muted-foreground">Arquivos de até {formatBytes(storage.maxInlineFileBytes)} são guardados; acima disso, a associação é simulada.</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setConfirm('reset')}>
                  <RotateCcw /> Restaurar dados originais
                </Button>
                <Button variant="outline" className="text-red-700" onClick={() => setConfirm('clear')}>
                  <Eraser /> Limpar todos os dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4" /> Sobre o protótipo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              <span className="font-semibold tracking-widest">{APP_NAME}</span> · versão {APP_VERSION} (protótipo funcional)
            </p>
            <p className="text-muted-foreground">{APP_TAGLINE}</p>
            <div>
              <p className="mb-1 font-medium">Regras de referência</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Projeto atrasado: prazo final vencido e projeto não concluído/cancelado.</li>
                <li>Tarefa atrasada: vencimento passado e tarefa não concluída/cancelada.</li>
                <li>Severidade de riscos: probabilidade × impacto (≥15 crítica, ≥10 alta, ≥5 média).</li>
                <li>Risco alto do projeto: atraso, risco crítico aberto ou progresso abaixo do esperado além do limite.</li>
                <li>Status do caso de teste: o da execução mais recente; tentativas anteriores são preservadas.</li>
                <li>Todos os casos aprovados movem o projeto para "Aguardando homologação".</li>
                <li>Homologação aprovada pode concluir o projeto; reprovada o devolve para "Em andamento".</li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium">Funcionalidades futuras (não implementadas nesta fase)</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Banco de dados definitivo (SharePoint Lists, PostgreSQL, Dataverse ou outro — a definir).</li>
                <li>Autenticação corporativa (Microsoft Entra ID) e permissões por perfil.</li>
                <li>Armazenamento definitivo de documentos e evidências.</li>
                <li>Integrações com Microsoft Graph, Power BI, e-mail e Teams.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pessoas de referência</CardTitle>
            <CardDescription>Cadastro simulado usado nos seletores de responsáveis.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <THead>
                <tr>
                  <TH className="pl-5">Nome</TH>
                  <TH>Cargo</TH>
                  <TH>Área</TH>
                </tr>
              </THead>
              <TBody>
                {people.map((p) => (
                  <TR key={p.id}>
                    <TD className="pl-5 font-medium">{p.name}</TD>
                    <TD className="text-muted-foreground">{p.role}</TD>
                    <TD className="text-muted-foreground">{p.area}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm === 'reset'}
        onOpenChange={(o) => !o && setConfirm(undefined)}
        title="Restaurar dados de demonstração"
        description="Todas as alterações feitas no protótipo serão descartadas e os dados originais de demonstração serão recarregados."
        confirmLabel="Restaurar"
        onConfirm={() => runAction(() => services.settings.resetDemoData(), 'Dados de demonstração restaurados.').then(() => undefined)}
      />
      <ConfirmDialog
        open={confirm === 'clear'}
        onOpenChange={(o) => !o && setConfirm(undefined)}
        title="Limpar todos os dados"
        description="Projetos, tarefas, riscos, testes, documentos, atualizações e histórico serão apagados. O cadastro de pessoas é mantido. É possível restaurar a demonstração depois."
        confirmLabel="Limpar dados"
        onConfirm={() => runAction(() => services.settings.clearAll(), 'Dados removidos.').then(() => undefined)}
      />
    </div>
  )
}

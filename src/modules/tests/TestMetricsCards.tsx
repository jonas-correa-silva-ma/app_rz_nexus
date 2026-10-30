import { Ban, CheckCircle2, ClipboardList, Clock, Hourglass, Percent, PlayCircle, RotateCcw, XCircle } from 'lucide-react'
import { StatCard } from '@/components/common'
import type { TestMetrics } from '@/types'

export function TestMetricsCards({ metrics, awaitingHomologation }: { metrics: TestMetrics; awaitingHomologation?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Casos cadastrados" value={metrics.total} icon={ClipboardList} tone="blue" />
      <StatCard label="Não iniciados" value={metrics.byStatus.nao_iniciado} icon={Clock} tone="slate" />
      <StatCard label="Em andamento" value={metrics.byStatus.em_andamento} icon={PlayCircle} tone="blue" />
      <StatCard label="Aprovados" value={metrics.byStatus.aprovado} icon={CheckCircle2} tone="green" />
      <StatCard label="Reprovados" value={metrics.byStatus.reprovado} icon={XCircle} tone="red" />
      <StatCard label="Bloqueados" value={metrics.byStatus.bloqueado} icon={Ban} tone="amber" />
      <StatCard label="Execução" value={`${metrics.executionRate}%`} icon={Percent} tone="blue" hint="casos com resultado final" />
      <StatCard label="Aprovação" value={`${metrics.approvalRate}%`} icon={Percent} tone="green" hint="casos aprovados" />
      <StatCard label="Falhas abertas" value={metrics.openFailures} icon={XCircle} tone="red" />
      <StatCard label="Retestes pendentes" value={metrics.pendingRetests} icon={RotateCcw} tone="amber" />
      {awaitingHomologation !== undefined && <StatCard label="Aguardando homologação" value={awaitingHomologation} icon={Hourglass} tone="violet" hint="projetos" />}
    </div>
  )
}

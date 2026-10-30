import * as React from 'react'
import { AlertOctagon, AlertTriangle, CalendarX, Construction, ListTodo, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader, StatCard } from '@/components/common'
import { computeSeverity, isRiskOpen } from '@/domain/rules'
import { useQuery } from '@/hooks/useQuery'
import { RiskBoard, RiskMatrix } from '@/modules/risks/RiskBoard'
import { services } from '@/services'
import { isPast } from '@/utils/dates'

export function RisksPage() {
  const { data: risks = [] } = useQuery(() => services.risks.list())
  const [severity, setSeverity] = React.useState('')
  const open = risks.filter(isRiskOpen)
  const sev = (s: string) => open.filter((r) => computeSeverity(r.probability, r.impact) === s).length

  return (
    <div>
      <PageHeader title="Riscos e pendências" description="Riscos, problemas, impedimentos e pendências dos projetos. Severidade = probabilidade × impacto." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Registros em aberto" value={open.length} icon={ShieldAlert} tone="blue" />
        <StatCard label="Severidade crítica" value={sev('critica')} icon={AlertOctagon} tone="red" onClick={() => setSeverity('critica')} />
        <StatCard label="Severidade alta" value={sev('alta')} icon={AlertTriangle} tone="amber" onClick={() => setSeverity('alta')} />
        <StatCard label="Impedimentos abertos" value={open.filter((r) => r.type === 'impedimento').length} icon={Construction} tone="violet" />
        <StatCard label="Pendências abertas" value={open.filter((r) => r.type === 'pendencia').length} icon={ListTodo} tone="slate" />
        <StatCard label="Prazo vencido" value={open.filter((r) => isPast(r.dueDate)).length} icon={CalendarX} tone="red" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Matriz de criticidade</CardTitle>
            <CardDescription>Registros em aberto. Clique em uma célula para filtrar pela severidade.</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskMatrix risks={risks} selected={severity} onSelect={setSeverity} />
          </CardContent>
        </Card>
        <RiskBoard risks={risks} severityFilter={severity} onSeverityFilter={setSeverity} />
      </div>
    </div>
  )
}

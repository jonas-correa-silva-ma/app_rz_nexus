/**
 * Padrões de gráficos do NEXO (Recharts).
 * Paleta categórica em ordem fixa e cores de status reservadas para estados.
 */
import * as React from 'react'
import { Table2, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']

/** Cores fixas por entidade (a cor segue a categoria, não a posição). */
export const ENTITY_COLORS: Record<string, string> = {
  // status (estado): verde = bom, âmbar = alerta, laranja = sério, vermelho = crítico
  'Concluído': '#0ca30c',
  'Concluída': '#0ca30c',
  'Aprovado': '#0ca30c',
  'Em andamento': '#2a78d6',
  'Planejamento': '#9ec5f4',
  'Não iniciada': '#9ec5f4',
  'Não iniciado': '#9ec5f4',
  'Pausado': '#fab219',
  'Bloqueada': '#ec835a',
  'Bloqueado': '#ec835a',
  'Aguardando homologação': '#6250d6',
  'Reprovado': '#d03b3b',
  'Cancelado': '#c3c2b7',
  'Cancelada': '#c3c2b7',
  // prioridade/severidade (escala ordinal de um único tom)
  'Baixa': '#86b6ef',
  'Média': '#3987e5',
  'Alta': '#256abf',
  'Crítica': '#0d366b',
}

export const RISK_TYPE_COLORS = { risco: SERIES[0], problema: SERIES[1], impedimento: SERIES[2], pendencia: SERIES[3] }

export const AXIS = { stroke: '#c3c2b7', tick: { fill: '#898781', fontSize: 12 }, tickLine: false }
export const GRID = { stroke: '#e1e0d9', strokeDasharray: '0', vertical: false }

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: { fill?: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

/**
 * Cartão de gráfico com alternância para visualização em tabela (acessibilidade
 * e conferência dos números).
 */
export function ChartCard({
  title,
  description,
  table,
  children,
  empty,
}: {
  title: string
  description?: React.ReactNode
  table:{ columns: string[]; rows: (string | number)[][] }
  children: React.ReactNode
  empty?: boolean
}) {
  const [asTable, setAsTable] = React.useState(false)
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        <Button variant="ghost" size="icon-sm" title={asTable ? 'Ver gráfico' : 'Ver tabela'} onClick={() => setAsTable((v) => !v)}>
          {asTable ? <BarChart3 /> : <Table2 />}
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {empty ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">Sem dados para os filtros selecionados.</div>
        ) : asTable ? (
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {table.columns.map((c, i) => (
                    <th key={c} className={i ? 'py-1.5 text-right font-medium' : 'py-1.5 font-medium'}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {r.map((v, j) => (
                      <td key={j} className={j ? 'py-1.5 text-right tabular-nums' : 'py-1.5'}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

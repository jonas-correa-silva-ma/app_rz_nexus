import { differenceInCalendarDays, eachMonthOfInterval, format, max as maxDate, min as minDate, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { formatDate, toDate } from '@/utils/dates'

export interface GanttItem {
  id: string
  label: string
  sublabel?: string
  start: string
  end: string
  progress: number
  tone: 'blue' | 'green' | 'red' | 'amber' | 'slate' | 'violet'
  href?: string
}

const barTone = {
  blue: 'bg-blue-200 [&>span]:bg-blue-600',
  green: 'bg-emerald-200 [&>span]:bg-emerald-600',
  red: 'bg-red-200 [&>span]:bg-red-600',
  amber: 'bg-amber-200 [&>span]:bg-amber-500',
  slate: 'bg-slate-200 [&>span]:bg-slate-500',
  violet: 'bg-violet-200 [&>span]:bg-violet-600',
}

/** Cronograma simplificado (barras de período com preenchimento do progresso e marcador de hoje). */
export function Gantt({ items, legend }: { items: GanttItem[]; legend?: { label: string; tone: GanttItem['tone'] }[] }) {
  const navigate = useNavigate()
  const dated = items.filter((i) => toDate(i.start) && toDate(i.end))
  if (!dated.length) return <p className="py-8 text-center text-sm text-muted-foreground">Sem itens com datas para exibir.</p>

  const today = new Date()
  const from = startOfMonth(minDate([...dated.map((i) => toDate(i.start)!), today]))
  const to = endOfMonth(maxDate([...dated.map((i) => toDate(i.end)!), today]))
  const total = differenceInCalendarDays(to, from) + 1
  const pos = (d: Date) => (differenceInCalendarDays(d, from) / total) * 100
  const months = eachMonthOfInterval({ start: from, end: to })
  const todayPos = pos(today)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="flex border-b border-border pb-1 text-[11px] text-muted-foreground">
          <div className="w-60 shrink-0" />
          <div className="relative h-4 flex-1">
            {months.map((m) => (
              <span key={m.toISOString()} className="absolute top-0 border-l border-border pl-1 capitalize" style={{ left: `${pos(m)}%` }}>
                {format(m, months.length > 14 ? 'MMM/yy' : 'MMM yy', { locale: ptBR })}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          {dated.map((i) => {
            const s = toDate(i.start)!
            const e = toDate(i.end)!
            const left = pos(s)
            const width = Math.max(((differenceInCalendarDays(e, s) + 1) / total) * 100, 0.8)
            return (
              <div
                key={i.id}
                className={cn('flex items-center border-b border-border/60 py-2', i.href && 'cursor-pointer hover:bg-muted/40')}
                onClick={i.href ? () => navigate(i.href!) : undefined}
              >
                <div className="w-60 shrink-0 pr-3">
                  <p className="truncate text-sm font-medium">{i.label}</p>
                  {i.sublabel && <p className="truncate text-xs text-muted-foreground">{i.sublabel}</p>}
                </div>
                <div className="relative h-6 flex-1">
                  {months.map((m) => (
                    <span key={m.toISOString()} className="absolute inset-y-0 border-l border-border/50" style={{ left: `${pos(m)}%` }} />
                  ))}
                  <div
                    className={cn('absolute top-1 flex h-4 overflow-hidden rounded', barTone[i.tone])}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${i.label}: ${formatDate(i.start)} a ${formatDate(i.end)} · ${i.progress}%`}
                  >
                    <span className="h-full" style={{ width: `${i.progress}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
          <div className="pointer-events-none absolute inset-y-0 flex" style={{ left: `calc(15rem + (100% - 15rem) * ${todayPos / 100})` }}>
            <span className="w-px bg-red-500" />
            <span className="absolute -top-0.5 -translate-x-1/2 rounded bg-red-500 px-1 text-[10px] font-medium text-white">Hoje</span>
          </div>
        </div>
        {legend && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {legend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className={cn('flex h-2.5 w-5 overflow-hidden rounded-sm', barTone[l.tone])}>
                  <span className="w-1/2" />
                </span>
                {l.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-px bg-red-500" /> Hoje
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

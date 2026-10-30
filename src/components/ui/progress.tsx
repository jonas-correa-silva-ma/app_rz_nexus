import { cn } from '@/lib/utils'

export function Progress({ value, className, tone = 'blue', showLabel }: { value: number; className?: string; tone?: 'blue' | 'green' | 'amber' | 'red'; showLabel?: boolean }) {
  const color = { blue: 'bg-blue-600', green: 'bg-emerald-600', amber: 'bg-amber-500', red: 'bg-red-600' }[tone]
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{Math.round(v)}%</span>}
    </div>
  )
}

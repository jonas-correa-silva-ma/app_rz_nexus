import * as React from 'react'
import { AlertTriangle, CheckCircle2, CircleAlert, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { labelOf, RISK_LEVELS, toneOf, type Option } from '@/config/labels'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'
import { daysUntil, formatDate, relativeDeadline } from '@/utils/dates'
import { initials } from '@/utils/format'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const statTones = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
  slate: 'bg-slate-100 text-slate-700',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  hint,
  onClick,
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  tone?: keyof typeof statTones
  hint?: string
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-xs',
        onClick && 'cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50/30',
      )}
    >
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', statTones[tone])}>
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold leading-tight">{value}</p>
        {hint && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Comp>
  )
}

export function OptionBadge<T extends string>({ options, value, dot = true }: { options: Option<T>[]; value: T | undefined; dot?: boolean }) {
  return (
    <Badge tone={toneOf(options, value)} dot={dot}>
      {labelOf(options, value)}
    </Badge>
  )
}

/** Nível de risco do projeto: sempre ícone + rótulo, nunca apenas cor. */
export function RiskLevelBadge({ level, reasons }: { level: RiskLevel; reasons?: string[] }) {
  const Icon = level === 'alto' ? AlertTriangle : level === 'medio' ? CircleAlert : CheckCircle2
  return (
    <Badge tone={toneOf(RISK_LEVELS, level)} title={reasons?.join('\n')}>
      <Icon className="size-3" />
      {labelOf(RISK_LEVELS, level)}
    </Badge>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-800', className)} title={name}>
      {initials(name)}
    </span>
  )
}

export function PersonChip({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar name={name} className="size-6 text-[10px]" />
      <span className="truncate">{name}</span>
    </span>
  )
}

/** Data com indicação relativa; destaca em vermelho quando vencida e não encerrada. */
export function Deadline({ date, closed }: { date: string; closed?: boolean }) {
  const n = daysUntil(date)
  const overdue = !closed && n !== undefined && n < 0
  const soon = !closed && n !== undefined && n >= 0 && n <= 7
  return (
    <span className="flex flex-col leading-tight">
      <span className={cn('whitespace-nowrap', overdue && 'font-medium text-red-700')}>{formatDate(date)}</span>
      {!closed && (overdue || soon) && <span className={cn('text-xs', overdue ? 'text-red-600' : 'text-amber-700')}>{relativeDeadline(date)}</span>}
    </span>
  )
}

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}>{children}</div>
}

export function InfoItem({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm">{children || '—'}</dd>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
}) {
  const [busy, setBusy] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader title={title} />
        <DialogBody>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm()
                onOpenChange(false)
              } finally {
                setBusy(false)
              }
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Executa uma operação de serviço exibindo mensagem de sucesso ou erro. */
export async function runAction<T>(action: () => Promise<T>, success: string): Promise<T | undefined> {
  try {
    const result = await action()
    toast.success(success)
    return result
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Não foi possível concluir a operação.')
    return undefined
  }
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold">{children}</h2>
      {action}
    </div>
  )
}

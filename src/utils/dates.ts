import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Data de hoje no formato yyyy-MM-dd. */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** Data relativa a hoje (yyyy-MM-dd). Usada pelos dados de demonstração. */
export function daysFromToday(offset: number): string {
  return format(addDays(startOfDay(new Date()), offset), 'yyyy-MM-dd')
}

export function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const d = parseISO(value)
  return isValid(d) ? d : undefined
}

export function formatDate(value: string | undefined, pattern = 'dd/MM/yyyy'): string {
  const d = toDate(value)
  return d ? format(d, pattern, { locale: ptBR }) : '—'
}

export function formatDateTime(value: string | undefined): string {
  return formatDate(value, "dd/MM/yyyy 'às' HH:mm")
}

/** Dias entre hoje e a data (negativo quando já passou). */
export function daysUntil(value: string | undefined): number | undefined {
  const d = toDate(value)
  return d ? differenceInCalendarDays(d, startOfDay(new Date())) : undefined
}

export function isPast(value: string | undefined): boolean {
  const n = daysUntil(value)
  return n !== undefined && n < 0
}

export function relativeDeadline(value: string | undefined): string {
  const n = daysUntil(value)
  if (n === undefined) return ''
  if (n === 0) return 'vence hoje'
  if (n === 1) return 'vence amanhã'
  if (n > 0) return `em ${n} dias`
  if (n === -1) return 'venceu ontem'
  return `${Math.abs(n)} dias de atraso`
}

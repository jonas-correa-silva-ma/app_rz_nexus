import type { ID } from '@/types'

/** Seleção múltipla compacta (pessoas, projetos). */
export function MultiChecklist({ items, value, onChange, emptyText = 'Nenhum item disponível.' }: { items: { id: ID; label: string; hint?: string }[]; value: ID[]; onChange: (ids: ID[]) => void; emptyText?: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>
  return (
    <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-input p-2 sm:grid-cols-2">
      {items.map((i) => (
        <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={value.includes(i.id)}
            onChange={(e) => onChange(e.target.checked ? [...value, i.id] : value.filter((x) => x !== i.id))}
          />
          <span className="truncate">{i.label}</span>
          {i.hint && <span className="ml-auto truncate text-xs text-muted-foreground">{i.hint}</span>}
        </label>
      ))}
    </div>
  )
}

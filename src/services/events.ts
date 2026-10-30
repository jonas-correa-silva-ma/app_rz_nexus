/**
 * Notificação de alterações de dados. Qualquer implementação de serviço deve chamar
 * `notifyDataChanged()` após uma gravação, para que as telas recarreguem suas consultas.
 */
type Listener = () => void

const listeners = new Set<Listener>()

export function subscribeDataChanges(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyDataChanged(): void {
  listeners.forEach((l) => l())
}

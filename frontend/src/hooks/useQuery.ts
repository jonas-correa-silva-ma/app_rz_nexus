import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribeDataChanges } from '@/services/events'

export interface QueryState<T> {
  data: T | undefined
  loading: boolean
  error: Error | undefined
  reload: () => void
}

/**
 * Executa uma consulta assíncrona a um serviço e a refaz automaticamente sempre que
 * qualquer dado for alterado (criação, edição, exclusão), mantendo as telas sincronizadas.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error>()
  const fnRef = useRef(fn)
  fnRef.current = fn
  const requestId = useRef(0)

  const run = useCallback(() => {
    const id = ++requestId.current
    fnRef
      .current()
      .then((result) => {
        if (id === requestId.current) {
          setData(result)
          setError(undefined)
        }
      })
      .catch((err: unknown) => {
        if (id === requestId.current) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    return subscribeDataChanges(run)
  }, [run])

  return { data, loading, error, reload: run }
}

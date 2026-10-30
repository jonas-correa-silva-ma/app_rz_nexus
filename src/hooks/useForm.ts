import { useState } from 'react'

export type Errors<T> = Partial<Record<keyof T, string>>

/** Estado de formulário simples com validação síncrona. */
export function useForm<T extends object>(initial: T, validate: (values: T) => Errors<T>) {
  const [values, setValues] = useState<T>(initial)
  const [errors, setErrors] = useState<Errors<T>>({})

  function set<K extends keyof T>(key: K, value: T[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function check(): boolean {
    const result = validate(values)
    setErrors(result)
    return Object.values(result).every((v) => !v)
  }

  return { values, set, setValues, errors, check, reset: (v: T) => (setValues(v), setErrors({})) }
}

export const required = (v: unknown, msg = 'Campo obrigatório.') => (v === undefined || v === null || String(v).trim() === '' ? msg : undefined)

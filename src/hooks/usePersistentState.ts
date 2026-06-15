import { useEffect, useState } from 'react'
import { localStorageAdapter } from '../services/storage'

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    return localStorageAdapter.getJson<T>(key) ?? initialValue
  })

  useEffect(() => {
    localStorageAdapter.setJson(key, value)
  }, [key, value])

  return [value, setValue] as const
}

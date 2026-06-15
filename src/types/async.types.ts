export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncData<T> {
  status: AsyncStatus
  data: T | null
  error: string | null
  updatedAt: string | null
}

export const idleAsyncData = <T>(): AsyncData<T> => ({
  data: null,
  error: null,
  status: 'idle',
  updatedAt: null,
})

export const loadingAsyncData = <T>(previous?: AsyncData<T>): AsyncData<T> => ({
  data: previous?.data ?? null,
  error: null,
  status: 'loading',
  updatedAt: previous?.updatedAt ?? null,
})

export const successAsyncData = <T>(data: T, updatedAt = new Date().toISOString()): AsyncData<T> => ({
  data,
  error: null,
  status: 'success',
  updatedAt,
})

export const errorAsyncData = <T>(error: string, previous?: AsyncData<T>): AsyncData<T> => ({
  data: previous?.data ?? null,
  error,
  status: 'error',
  updatedAt: previous?.updatedAt ?? null,
})

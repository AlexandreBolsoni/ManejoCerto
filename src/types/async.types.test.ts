import { describe, expect, it } from 'vitest'
import { errorAsyncData, idleAsyncData, loadingAsyncData, successAsyncData } from './async.types'

describe('async data helpers', () => {
  it('preserves previous data while loading and erroring', () => {
    const success = successAsyncData({ value: 42 }, '2026-06-10T10:00:00.000Z')
    const loading = loadingAsyncData(success)
    const error = errorAsyncData('Falha temporaria', success)

    expect(idleAsyncData()).toEqual({ data: null, error: null, status: 'idle', updatedAt: null })
    expect(loading.data).toEqual({ value: 42 })
    expect(loading.status).toBe('loading')
    expect(error.data).toEqual({ value: 42 })
    expect(error.error).toBe('Falha temporaria')
  })
})

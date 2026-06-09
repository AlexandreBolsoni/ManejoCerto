import { afterEach, describe, expect, it, vi } from 'vitest'
import { weatherCacheService } from './weatherCacheService'

function fakeStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(globalThis, 'window')
})

describe('weatherCacheService', () => {
  it('reutiliza uma resposta válida durante o TTL', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: fakeStorage() },
    })
    const fetcher = vi.fn(async () => ({ temperatureC: 27 }))

    const first = await weatherCacheService.getOrFetch({
      fetcher,
      key: 'forecast:test',
      provider: 'open_meteo',
      ttlMs: 60_000,
      userId: 'demo-user',
    })
    const second = await weatherCacheService.getOrFetch({
      fetcher,
      key: 'forecast:test',
      provider: 'open_meteo',
      ttlMs: 60_000,
      userId: 'demo-user',
    })

    expect(first).toEqual({ temperatureC: 27 })
    expect(second).toEqual(first)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

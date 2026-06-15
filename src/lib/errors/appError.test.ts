import { describe, expect, it } from 'vitest'
import { createAppError, toUserMessage } from './appError'

describe('app error helpers', () => {
  it('creates coded errors and maps them to friendly messages', () => {
    const validation = createAppError('VALIDATION_ERROR', 'Informe uma area valida.')
    const network = createAppError('NETWORK_ERROR', 'fetch failed')

    expect(validation.code).toBe('VALIDATION_ERROR')
    expect(toUserMessage(validation)).toBe('Informe uma area valida.')
    expect(toUserMessage(network)).toContain('Sem conexão')
  })
})

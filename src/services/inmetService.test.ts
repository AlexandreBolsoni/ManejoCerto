import { describe, expect, it } from 'vitest'
import { mapInmetObservation, parseInmetNumber } from './inmetService'

describe('inmetService', () => {
  it('maps the nearest station payload and converts wind from m/s to km/h', () => {
    const observation = mapInmetObservation(
      {
        estacao: {
          CODIGO: 'A612',
          DISTANCIA_EM_KM: '1',
          LATITUDE: '-20.27083332',
          LONGITUDE: '-40.30583333',
          NOME: 'VITÓRIA',
          UF: 'ES',
        },
        dados: {
          CHUVA: '0',
          DT_MEDICAO: '2026-06-06',
          HR_MEDICAO: '1300',
          TEM_INS: '23.7',
          TEM_SEN: '23.2',
          UMD_INS: '56',
          VEN_RAJ: '4.4',
          VEN_VEL: '1.4',
        },
      },
      new Date('2026-06-06T14:00:00Z'),
    )

    expect(observation?.station.code).toBe('A612')
    expect(observation?.observedAt).toBe('2026-06-06T13:00:00.000Z')
    expect(observation?.isFresh).toBe(true)
    expect(observation?.temperatureC).toBe(23.7)
    expect(observation?.windKmh).toBe(5)
    expect(observation?.gustKmh).toBe(15.8)
  })

  it('rejects missing and sentinel values', () => {
    expect(parseInmetNumber('9999')).toBeUndefined()
    expect(parseInmetNumber(null)).toBeUndefined()
    expect(parseInmetNumber('12,5')).toBe(12.5)
  })
})

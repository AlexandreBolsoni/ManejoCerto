import type { Severity } from '../shared/shared.types'

export type Alert = {
  id: string
  type: 'geada' | 'chuva severa' | 'vento forte' | 'baixa umidade' | 'risco de incendio' | 'excesso de chuva' | 'estiagem' | 'pulverizacao'
  severity: Severity
  title: string
  message: string
  fieldId: string
  fieldName: string
  timeLabel: string
  archived?: boolean
  muted?: boolean
}

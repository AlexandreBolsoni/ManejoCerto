export type AppErrorCode =
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'FIREBASE_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

export interface AppError {
  code: AppErrorCode
  message: string
  details?: unknown
}

export function createAppError(code: AppErrorCode, message: string, details?: unknown): AppError {
  return { code, details, message }
}

export function toUserMessage(error: AppError): string {
  if (error.code === 'NETWORK_ERROR') return 'Sem conexão no momento. Vamos tentar novamente quando a rede voltar.'
  if (error.code === 'PERMISSION_DENIED') return 'Voce nao tem permissao para acessar esta informacao.'
  if (error.code === 'PROVIDER_UNAVAILABLE') return 'Fonte de dados temporariamente indisponivel.'
  if (error.code === 'VALIDATION_ERROR') return error.message

  return 'Nao foi possivel concluir a acao agora.'
}

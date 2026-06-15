import { CloudOff, CloudSun, MapPinned, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

export function RadarEmptyState({
  action,
  kind,
}: {
  action?: ReactNode
  kind: 'loading' | 'offline' | 'no-location' | 'error'
}) {
  const content = {
    loading: {
      Icon: CloudSun,
      title: 'Carregando radar climático...',
      body: 'Buscando dados e interpretando o cenário da sua região.',
    },
    offline: {
      Icon: CloudOff,
      title: 'Sem conexão no momento',
      body: 'Os últimos dados salvos serão atualizados automaticamente quando a conexão voltar.',
    },
    'no-location': {
      Icon: MapPinned,
      title: 'Localização da fazenda necessária',
      body: 'Defina o pino da fazenda para receber leitura climática e recomendações da sua região.',
    },
    error: {
      Icon: RefreshCw,
      title: 'Não conseguimos atualizar o radar agora',
      body: 'Tente novamente em alguns minutos. Os demais dados do NimbuES continuam disponíveis.',
    },
  }[kind]
  const Icon = content.Icon

  return (
    <article className={`radar2-empty-state ${kind}`}>
      <span><Icon size={28} aria-hidden="true" /></span>
      <h2>{content.title}</h2>
      <p>{content.body}</p>
      {kind === 'loading' ? <div className="radar2-loading-bars"><i /><i /><i /></div> : action}
    </article>
  )
}

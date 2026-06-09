import { LinkButton } from '../components/Button'
import { Card } from '../components/Surface'

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <Card className="empty-state">
        <h1>Rota não encontrada</h1>
        <p>Volte para o painel principal do NibusES.</p>
        <LinkButton to="/dashboard">Abrir dashboard</LinkButton>
      </Card>
    </main>
  )
}

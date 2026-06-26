import { LinkButton } from '../components/ui'
import { Card } from '../components/ui'

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <Card className="empty-state">
        <h1>Rota não encontrada</h1>
        <p>Volte para o painel principal.</p>
        <LinkButton to="/dashboard">Abrir dashboard</LinkButton>
      </Card>
    </main>
  )
}

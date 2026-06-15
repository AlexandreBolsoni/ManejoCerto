import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react'
import { Badge, Card, LinkButton } from '../../../components/ui'
import type { Alert } from '../../../types'

export function AlertsPreview({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="today-alert-card">
      <div className="card-title-row">
        <span>
          <Bell size={17} aria-hidden="true" />
          Alertas ativos
        </span>
      </div>
      {alerts.length === 0 ? (
        <div className="alert-clear-state">
          <span>
            <CheckCircle2 size={30} aria-hidden="true" />
          </span>
          <strong>Nenhum alerta crítico</strong>
          <p>Tudo sob controle por aqui.</p>
        </div>
      ) : (
        <div className="alert-list">
          {alerts.slice(0, 2).map((alert) => (
            <article className="compact-alert" key={alert.id}>
              <AlertTriangle size={18} aria-hidden="true" />
              <div>
                <strong>{alert.title}</strong>
                <span>
                  {alert.fieldName} · {alert.timeLabel}
                </span>
              </div>
              <Badge tone={alert.severity}>{alert.severity}</Badge>
            </article>
          ))}
        </div>
      )}
      {alerts.length > 0 ? (
        <LinkButton size="sm" to="/alertas" variant="ghost">
          Abrir alertas
        </LinkButton>
      ) : null}
    </Card>
  )
}

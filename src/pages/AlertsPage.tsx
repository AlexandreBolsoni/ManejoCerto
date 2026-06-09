import { Archive, Bell, BellOff, CloudRain, Flame, Snowflake, Wind } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { PageHeader } from '../components/PageHeader'
import { Card, EmptyState } from '../components/Surface'
import { useAppData } from '../hooks/useAppData'
import type { Alert, Severity } from '../types'

const groups: { label: string; severity: Severity }[] = [
  { label: 'Crítico', severity: 'critico' },
  { label: 'Alto', severity: 'alto' },
  { label: 'Moderado', severity: 'moderado' },
  { label: 'Baixo', severity: 'baixo' },
]

export function AlertsPage() {
  const { alerts, archiveAlert, muteAlert } = useAppData()
  const visibleAlerts = alerts.filter((alert) => !alert.muted)

  return (
    <section className="alerts-page">
      <PageHeader subtitle="Riscos calculados por área com base em chuva, vento, umidade, ET₀ e temperatura." title="Alertas" />
      {visibleAlerts.length === 0 ? (
        <EmptyState body="Quando houver risco relevante por área, ele aparece aqui com prioridade clara." title="Nenhum alerta ativo" />
      ) : (
        <div className="alert-groups">
          {groups.map((group) => {
            const groupAlerts = visibleAlerts.filter((alert) => alert.severity === group.severity)
            return (
              <section className="alert-group" key={group.severity}>
                <div className="alert-group-title">
                  <h2>{group.label}</h2>
                  <Badge tone={group.severity}>{groupAlerts.length}</Badge>
                </div>
                {groupAlerts.length === 0 ? (
                  <p className="group-empty">Sem alertas nesta severidade.</p>
                ) : (
                  groupAlerts.map((alert) => (
                    <AlertCard alert={alert} key={alert.id} onArchive={archiveAlert} onMute={muteAlert} />
                  ))
                )}
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}

function AlertCard({
  alert,
  onArchive,
  onMute,
}: {
  alert: Alert
  onArchive: (alertId: string) => void
  onMute: (alertId: string) => void
}) {
  const Icon = alert.type === 'geada' ? Snowflake : alert.type === 'vento forte' ? Wind : alert.type === 'risco de incendio' ? Flame : CloudRain

  return (
    <Card className={`alert-card severity-${alert.severity}`}>
      <div className="alert-symbol">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="alert-content">
        <div className="alert-meta">
          <Badge tone={alert.severity}>{alert.severity === 'alto' ? 'alta' : alert.severity}</Badge>
          <span>{alert.timeLabel}</span>
        </div>
        <h3>{alert.title}</h3>
        <p>{alert.message}</p>
        <small>{alert.fieldName} · {alert.type}</small>
        <div className="alert-actions">
          {alert.type.includes('chuva') && (
            <Link className="btn primary sm" to="/feedback">
              <Bell size={15} aria-hidden="true" />
              Confirmar chuva observada
            </Link>
          )}
          <Button onClick={() => onMute(alert.id)} size="sm" type="button" variant="secondary">
            <BellOff size={15} aria-hidden="true" />
            Silenciar 24h
          </Button>
          <Button onClick={() => onArchive(alert.id)} size="sm" type="button" variant="ghost">
            <Archive size={15} aria-hidden="true" />
            Arquivar
          </Button>
        </div>
      </div>
      <Bell size={18} aria-hidden="true" />
    </Card>
  )
}

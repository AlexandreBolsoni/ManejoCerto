import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, CloudRain, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, LinkButton } from '../components/Button'
import { TextAreaField, TextField } from '../components/FormField'
import { Card, EmptyState } from '../components/Surface'
import { useAppData } from '../hooks/useAppData'

export function FeedbackPage() {
  const navigate = useNavigate()
  const { farm, feedbackQueue, fields, isOnline, saveFeedback } = useAppData()
  const [saved, setSaved] = useState(false)
  const [rained, setRained] = useState<boolean | null>(true)
  const [rainMm, setRainMm] = useState(12)
  const [frost, setFrost] = useState(false)
  const [forecastWasRight, setForecastWasRight] = useState<boolean | null>(true)
  const [recommendationWasUseful, setRecommendationWasUseful] = useState<boolean | null>(true)
  const [notes, setNotes] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!farm || fields.length === 0) return

    void saveFeedback({
      fieldId: fields[0].id,
      rained,
      rainMm: rained ? rainMm : 0,
      frost,
      forecastWasRight,
      recommendationWasUseful,
      notes,
    }).then(() => setSaved(true))
  }

  return (
    <section className="feedback-page">
      <button className="back-link" onClick={() => navigate(-1)} type="button">
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </button>
      <header className="feedback-header">
        <h1>Confirmar chuva</h1>
        <p>Sua observação melhora a previsão da sua fazenda.</p>
        <div className="feedback-progress">
          <span />
        </div>
      </header>

      {!farm || fields.length === 0 ? (
        <EmptyState
          action={<LinkButton to={!farm ? '/fazenda/nova' : '/talhoes/novo'}>{!farm ? 'Cadastrar fazenda' : 'Cadastrar área'}</LinkButton>}
          body="O feedback local precisa estar ligado a uma fazenda e uma área para melhorar a previsão daquele ponto."
          title="Cadastre sua base operacional primeiro"
        />
      ) : (

      <form className="feedback-grid" onSubmit={submit}>
        <Card className="feedback-question-card">
          <div className="feedback-icon">
            <CloudRain size={28} aria-hidden="true" />
          </div>
          <h2>Choveu na sua lavoura hoje?</h2>
          <p>Detectamos chuva na área principal às 14:32.</p>
          <div className="choice-row">
            <button className={rained === true ? 'active' : ''} onClick={() => setRained(true)} type="button">
              Sim, choveu
            </button>
            <button className={rained === false ? 'active' : ''} onClick={() => setRained(false)} type="button">
              Não choveu
            </button>
          </div>
          <TextField
            disabled={!rained}
            label="QUANTO CHOVEU (MM)"
            min="0"
            onChange={(event) => setRainMm(Number(event.target.value))}
            type="number"
            value={rainMm}
          />
          <div className="choice-stack">
            <ToggleChoice checked={frost} label="Houve geada?" onChange={setFrost} />
            <TriChoice label="A previsão acertou?" onChange={setForecastWasRight} value={forecastWasRight} />
            <TriChoice label="A recomendação foi útil?" onChange={setRecommendationWasUseful} value={recommendationWasUseful} />
          </div>
          <TextAreaField
            label="OBSERVAÇÃO LOCAL"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex.: chuva só no setor norte, vento forte após 16h..."
            value={notes}
          />
          <Button className="full" type="submit">
            <Send size={18} aria-hidden="true" />
            {isOnline ? 'Enviar feedback' : 'Salvar na fila offline'}
          </Button>
          {saved && (
            <p className="success-note">
              <CheckCircle2 size={17} aria-hidden="true" />
              Feedback salvo. Sua observação melhora a previsão da sua fazenda.
            </p>
          )}
        </Card>

        <Card className="feedback-side-card">
          <h2>Fila offline</h2>
          <p>{feedbackQueue.filter((item) => item.status === 'queued').length} feedbacks aguardando sincronização.</p>
          <small>{isOnline ? 'Online: novos feedbacks sincronizam automaticamente.' : 'Offline: você pode continuar registrando no campo.'}</small>
        </Card>
      </form>
      )}
    </section>
  )
}

function ToggleChoice({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-choice">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  )
}

function TriChoice({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: boolean | null) => void
  value: boolean | null
}) {
  return (
    <div className="tri-choice">
      <span>{label}</span>
      <div>
        <button className={value === true ? 'active' : ''} onClick={() => onChange(true)} type="button">
          Sim
        </button>
        <button className={value === false ? 'active' : ''} onClick={() => onChange(false)} type="button">
          Não
        </button>
      </div>
    </div>
  )
}

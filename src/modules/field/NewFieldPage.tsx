import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, LocateFixed, Save, Sprout } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, LinkButton } from '../../components/ui'
import { SelectField, TextAreaField, TextField } from '../../components/ui'
import { PageHeader } from '../../components/ui'
import { EmptyState } from '../../components/ui'
import { useCurrentFarm } from '../../hooks/useCurrentFarm'
import { useFields } from '../../hooks/useFields'
import { useWeather } from '../../hooks/useWeather'
import type { Field } from '../../types'

const sensitivityOptions = ['geada', 'seca', 'vento', 'chuva severa', 'baixa umidade', 'excesso de chuva']
const cropOptions = ['Soja', 'Milho', 'Algodão', 'Café', 'Cana-de-açúcar', 'Trigo', 'Feijão', 'Arroz', 'Sorgo', 'Pastagem', 'Hortaliças', 'Uva']
const stageOptions = ['Pré-plantio', 'Emergência', 'V4 · vegetativo', 'V8 · vegetativo', 'R1 · florescimento', 'R3 · enchimento', 'Maturação', 'Colheita']

export function NewFieldPage() {
  const navigate = useNavigate()
  const { farm, requestUserLocation, userLocation } = useCurrentFarm()
  const { addField } = useFields()
  const { locationError, locationStatus } = useWeather()
  const [sensitivities, setSensitivities] = useState<string[]>(['seca'])
  const [draft, setDraft] = useState({
    name: 'Área Oeste',
    crop: 'Soja',
    areaHa: 48,
    stage: 'V4 · vegetativo',
    soilType: 'Argiloso',
    irrigation: 'Pivô central',
    notes: '',
  })

  const toggleSensitivity = (value: string) => {
    setSensitivities((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const id = draft.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\W+/g, '-')
      .replace(/^-|-$/g, '')

    const field: Field = {
      id: id || crypto.randomUUID(),
      name: draft.name,
      crop: draft.crop,
      areaHa: draft.areaHa,
      stage: draft.stage,
      soilType: draft.soilType,
      irrigation: draft.irrigation,
      climateStatus: 'Aguardando primeira leitura climática',
      currentRecommendation: 'Monitorar nas próximas 24h',
      riskLevel: 'baixo',
      lastUpdate: 'agora',
      sensitivities,
      coordinates: userLocation ?? undefined,
      notes: draft.notes,
    }

    void addField(field).then(() => navigate('/talhoes'))
  }

  const captureLocation = async () => {
    await requestUserLocation()
  }

  if (!farm) {
    return (
      <section className="page-container">
        <PageHeader subtitle="Cadastre a fazenda antes de criar áreas de cultivo." title="Nova área de cultivo" />
        <EmptyState
          action={<LinkButton to="/fazenda/nova">Cadastrar fazenda</LinkButton>}
          body="A área usa a localização da fazenda como referência inicial."
          title="Nenhuma fazenda cadastrada"
        />
      </section>
    )
  }

  return (
    <section className="page-container">
      <PageHeader
        action={
          <LinkButton to="/talhoes" variant="secondary">
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar
          </LinkButton>
        }
        subtitle="Defina cultura, área e riscos sensíveis."
        title="Nova área"
      />
      
      <form className="new-field-grid" onSubmit={submit}>
        <div className="form-card">
          <div className="field-form-title">
            <div className="field-icon" style={{ width: '40px', height: '40px', borderRadius: '8px' }}>
              <Sprout size={24} color="var(--color-primary-dark)" aria-hidden="true" />
            </div>
            <div>
              <h2>Dados da área</h2>
              <p>Parâmetros do motor de decisão.</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <TextField 
              label="NOME DA ÁREA *" 
              onChange={(event) => setDraft({ ...draft, name: event.target.value })} 
              value={draft.name} 
            />
          </div>
          
          <div className="form-two-columns">
            <SelectField 
              label="CULTURA *" 
              onChange={(event) => setDraft({ ...draft, crop: event.target.value })} 
              value={draft.crop}
            >
              {cropOptions.map((crop) => (
                <option key={crop}>{crop}</option>
              ))}
            </SelectField>
            <TextField
              label="ÁREA EM HECTARES *"
              min="1"
              onChange={(event) => setDraft({ ...draft, areaHa: Number(event.target.value) })}
              type="number"
              value={draft.areaHa}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <SelectField 
              label="ESTÁGIO DA LAVOURA" 
              onChange={(event) => setDraft({ ...draft, stage: event.target.value })} 
              value={draft.stage}
            >
              {stageOptions.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </SelectField>
          </div>
          
          <div className="form-two-columns">
            <SelectField 
              label="TIPO DE SOLO" 
              onChange={(event) => setDraft({ ...draft, soilType: event.target.value })} 
              value={draft.soilType}
            >
              <option>Argiloso</option>
              <option>Médio</option>
              <option>Arenoso</option>
              <option>Hidromórfico</option>
            </SelectField>
            <SelectField 
              label="SISTEMA DE IRRIGAÇÃO" 
              onChange={(event) => setDraft({ ...draft, irrigation: event.target.value })} 
              value={draft.irrigation}
            >
              <option>Pivô central</option>
              <option>Aspersão</option>
              <option>Gotejamento</option>
              <option>Sequeiro</option>
            </SelectField>
          </div>
          
          <TextAreaField
            label="OBSERVAÇÕES"
            onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            placeholder="Ex.: baixada com histórico de geada..."
            value={draft.notes}
          />
          
          <div className="location-capture">
            <Button onClick={() => void captureLocation()} type="button" variant="secondary">
              <LocateFixed size={18} aria-hidden="true" />
              {locationStatus === 'requesting' ? 'Buscando...' : 'Capturar meu GPS'}
            </Button>
            <p>
              {userLocation
                ? `GPS Salvo: ±${Math.round(userLocation.accuracyM ?? 0)} m.`
                : 'A localização ajuda no radar meteorológico.'}
            </p>
            {locationError ? <p style={{ color: 'var(--color-danger)', textAlign: 'center', fontSize: '0.8125rem' }}>{locationError}</p> : null}
          </div>
        </div>

        <div className="sensitivity-card">
          <h2>Riscos Climáticos</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Marque o que afeta sua lavoura hoje:</p>
          
          <div className="chip-grid">
            {sensitivityOptions.map((option) => (
              <button 
                className={sensitivities.includes(option) ? 'selected' : ''} 
                key={option} 
                onClick={() => toggleSensitivity(option)} 
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
          
          <Button type="submit" variant="primary">
            <Save size={20} aria-hidden="true" />
            Salvar área
          </Button>
        </div>
      </form>
    </section>
  )
}
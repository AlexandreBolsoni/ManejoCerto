import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import { Bell, Building2, Clock, CloudSun, Edit3, LineChart, LocateFixed, LogOut, MapPin, Plus, Ruler, Save, ShieldAlert, Sprout, Trash2, Users, WifiOff } from 'lucide-react'
import { Button, LinkButton } from '../../components/ui'
import { SelectField, TextAreaField, TextField } from '../../components/ui'
import { Card } from '../../components/ui'
import { APP_STATE } from '../../config/brand'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentFarm } from '../../hooks/useCurrentFarm'
import { useFields } from '../../hooks/useFields'
import { useUserSettings } from '../../hooks/useUserSettings'
import type { Farm, Field, UserSettings } from '../../types'

const cropOptions = ['Soja', 'Milho', 'Algodão', 'Café', 'Café Conilon', 'Café Arábica', 'Pimenta-do-reino', 'Mamão', 'Cana-de-açúcar', 'Trigo', 'Feijão', 'Arroz', 'Sorgo', 'Pastagem', 'Hortaliças', 'Uva']
const stageOptions = ['Pré-plantio', 'Emergência', 'V4 · vegetativo', 'V8 · vegetativo', 'R1 · florescimento', 'R3 · enchimento', 'Maturação', 'Colheita']
const sensitivityOptions = ['geada', 'seca', 'vento', 'chuva severa', 'baixa umidade', 'excesso de chuva']

export function AccountPage() {
  const { deleteFarm, farm, saveFarm } = useCurrentFarm()
  const { addField, deleteField, fields } = useFields()
  const { settings, updateSettings } = useUserSettings()
  const { signOut, user } = useAuth()
  const [farmDraft, setFarmDraft] = useState<Farm | null>(null)
  const [fieldDraft, setFieldDraft] = useState<Field | null>(null)

  const changeSetting = (key: keyof UserSettings, value: boolean) => {
    updateSettings({ ...settings, [key]: value })
  }

  const submitFarm = (event: FormEvent) => {
    event.preventDefault()
    if (!farm || !farmDraft) return

    void saveFarm({
      ...farm,
      ...farmDraft,
      areaHa: Number(farmDraft.areaHa) || 0,
      locationLabel: farmDraft.locationLabel.trim() || `${farmDraft.locality ?? farmDraft.municipality}, ${APP_STATE}`,
      municipality: farmDraft.municipality.trim(),
      name: farmDraft.name.trim(),
      productionType: farmDraft.productionType.trim(),
      state: APP_STATE,
    }).then(() => setFarmDraft(null))
  }

  const removeFarm = () => {
    if (!farm) return
    const confirmed = window.confirm(`Apagar ${farm.name}? Isso também remove as áreas cadastradas nesta fazenda deste dispositivo.`)
    if (!confirmed) return
    setFarmDraft(null)
    setFieldDraft(null)
    void deleteFarm(farm.id)
  }

  const submitField = (event: FormEvent) => {
    event.preventDefault()
    if (!fieldDraft) return

    void addField({
      ...fieldDraft,
      areaHa: Number(fieldDraft.areaHa) || 0,
      crop: fieldDraft.crop.trim(),
      name: fieldDraft.name.trim(),
      notes: fieldDraft.notes?.trim(),
    }).then(() => setFieldDraft(null))
  }

  const removeField = (field: Field) => {
    const confirmed = window.confirm(`Apagar a área ${field.name}?`)
    if (!confirmed) return
    if (fieldDraft?.id === field.id) setFieldDraft(null)
    void deleteField(field.id)
  }

  const toggleFieldSensitivity = (value: string) => {
    setFieldDraft((current) => {
      if (!current) return current
      const sensitivities = current.sensitivities.includes(value)
        ? current.sensitivities.filter((item) => item !== value)
        : [...current.sensitivities, value]
      return { ...current, sensitivities }
    })
  }

  return (
    <section className="account-page">
      <h1>Conta e preferências</h1>
      <div className="account-grid">
        <Card className="profile-card">
          <span>PERFIL</span>
          <div className="profile-row">
            <strong className="avatar-large">{user?.initials ?? 'JS'}</strong>
            <div>
              <h2>{user?.name ?? 'João Silva'}</h2>
              <p>{user?.email ?? 'joao.silva@email.com.br'}</p>
            </div>
          </div>
        </Card>

        <Card className="team-card">
          <span>EQUIPE</span>
          <p>
            <Users size={18} aria-hidden="true" />
            <strong>2 membros</strong>
            <em>admin</em>
          </p>
          <Button className="full" type="button" variant="secondary">Convidar membro</Button>
        </Card>

        <Card className="farms-card">
          <div className="card-title-row">
            <span>FAZENDA</span>
            <LinkButton size="sm" to="/fazenda/nova" variant="ghost">
              <Plus size={15} aria-hidden="true" />
              Nova
            </LinkButton>
          </div>

          {farm ? (
            <>
              <div className="farm-list-row account-management-row">
                <Building2 size={18} aria-hidden="true" />
                <div>
                  <strong>{farm.name}</strong>
                  <span>{farm.locationLabel} · {fields.length} áreas · {farm.areaHa} ha</span>
                </div>
                <div className="row-actions">
                  <Button onClick={() => setFarmDraft(farm)} size="sm" type="button" variant="secondary">
                    <Edit3 size={14} aria-hidden="true" />
                    Editar
                  </Button>
                  <Button onClick={removeFarm} size="sm" type="button" variant="danger">
                    <Trash2 size={14} aria-hidden="true" />
                    Apagar
                  </Button>
                </div>
              </div>

              {farmDraft ? (
                <form className="account-edit-form" onSubmit={submitFarm}>
                  <TextField label="NOME DA FAZENDA" onChange={(event) => setFarmDraft({ ...farmDraft, name: event.target.value })} required value={farmDraft.name} />
                  <TextField
                    label="CIDADE, MUNICÍPIO, DISTRITO, VILA OU POVOADO"
                    onChange={(event) => setFarmDraft({ ...farmDraft, locality: event.target.value, municipality: event.target.value, municipalityId: undefined })}
                    required
                    value={farmDraft.locality ?? farmDraft.municipality}
                  />
                  <div className="form-two-columns">
                    <TextField label="ÁREA TOTAL (HA)" min="0" onChange={(event) => setFarmDraft({ ...farmDraft, areaHa: Number(event.target.value) })} type="number" value={farmDraft.areaHa || ''} />
                    <TextField label="PRODUÇÃO PRINCIPAL" onChange={(event) => setFarmDraft({ ...farmDraft, productionType: event.target.value })} value={farmDraft.productionType} />
                  </div>
                  <TextField label="LOCALIZAÇÃO" onChange={(event) => setFarmDraft({ ...farmDraft, locationLabel: event.target.value })} value={farmDraft.locationLabel} />
                  <TextAreaField label="OBSERVAÇÕES" onChange={(event) => setFarmDraft({ ...farmDraft, notes: event.target.value })} value={farmDraft.notes ?? ''} />
                  <div className="inline-form-actions">
                    <Button type="submit">
                      <Save size={16} aria-hidden="true" />
                      Salvar fazenda
                    </Button>
                    <Button onClick={() => setFarmDraft(null)} type="button" variant="secondary">Cancelar</Button>
                  </div>
                </form>
              ) : null}
            </>
          ) : (
            <p>Nenhuma fazenda cadastrada nesta conta.</p>
          )}
        </Card>

        <Card className="fields-management-card">
          <div className="card-title-row">
            <span>ÁREAS DE CULTIVO</span>
            <LinkButton size="sm" to={farm ? '/talhoes/novo' : '/fazenda/nova'} variant="ghost">
              <Plus size={15} aria-hidden="true" />
              Nova
            </LinkButton>
          </div>

          {fields.length === 0 ? (
            <p>{farm ? 'Nenhuma área cadastrada nesta fazenda.' : 'Cadastre uma fazenda antes de criar áreas.'}</p>
          ) : (
            <div className="account-field-list">
              {fields.map((field) => (
                <article className="account-field-row" key={field.id}>
                  <Sprout size={18} aria-hidden="true" />
                  <div>
                    <strong>{field.name}</strong>
                    <span>{field.crop} · {field.stage} · {field.areaHa} ha</span>
                  </div>
                  <div className="row-actions">
                    <Button onClick={() => setFieldDraft(field)} size="sm" type="button" variant="secondary">
                      <Edit3 size={14} aria-hidden="true" />
                      Editar
                    </Button>
                    <Button onClick={() => removeField(field)} size="sm" type="button" variant="danger">
                      <Trash2 size={14} aria-hidden="true" />
                      Apagar
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {fieldDraft ? (
            <form className="account-edit-form" onSubmit={submitField}>
              <TextField label="NOME DA ÁREA" onChange={(event) => setFieldDraft({ ...fieldDraft, name: event.target.value })} required value={fieldDraft.name} />
              <div className="form-two-columns">
                <SelectField label="CULTURA" onChange={(event) => setFieldDraft({ ...fieldDraft, crop: event.target.value })} value={fieldDraft.crop}>
                  {cropOptions.map((crop) => (
                    <option key={crop}>{crop}</option>
                  ))}
                </SelectField>
                <TextField label="ÁREA (HA)" min="0" onChange={(event) => setFieldDraft({ ...fieldDraft, areaHa: Number(event.target.value) })} type="number" value={fieldDraft.areaHa || ''} />
              </div>
              <SelectField label="ESTÁGIO" onChange={(event) => setFieldDraft({ ...fieldDraft, stage: event.target.value })} value={fieldDraft.stage}>
                {stageOptions.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </SelectField>
              <div className="form-two-columns">
                <SelectField label="TIPO DE SOLO" onChange={(event) => setFieldDraft({ ...fieldDraft, soilType: event.target.value })} value={fieldDraft.soilType}>
                  <option>Argiloso</option>
                  <option>Médio</option>
                  <option>Arenoso</option>
                  <option>Hidromórfico</option>
                </SelectField>
                <SelectField label="IRRIGAÇÃO" onChange={(event) => setFieldDraft({ ...fieldDraft, irrigation: event.target.value })} value={fieldDraft.irrigation}>
                  <option>Pivô central</option>
                  <option>Aspersão</option>
                  <option>Gotejamento</option>
                  <option>Sequeiro</option>
                </SelectField>
              </div>
              <div className="account-chip-section">
                <span>SENSIBILIDADES</span>
                <div className="chip-grid vertical">
                  {sensitivityOptions.map((option) => (
                    <button className={fieldDraft.sensitivities.includes(option) ? 'selected' : ''} key={option} onClick={() => toggleFieldSensitivity(option)} type="button">
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <TextAreaField label="OBSERVAÇÕES" onChange={(event) => setFieldDraft({ ...fieldDraft, notes: event.target.value })} value={fieldDraft.notes ?? ''} />
              <div className="inline-form-actions">
                <Button type="submit">
                  <Save size={16} aria-hidden="true" />
                  Salvar área
                </Button>
                <Button onClick={() => setFieldDraft(null)} type="button" variant="secondary">Cancelar</Button>
              </div>
            </form>
          ) : null}
        </Card>

        <Card className="preferences-card">
          <span>PREFERÊNCIAS</span>
          <div className="preference-section">
            <h2>Operação</h2>
            <PreferenceRow checked={settings.metricSystem} icon={<Ruler size={17} />} label="Sistema métrico (mm, °C, ha)" onChange={(value) => changeSetting('metricSystem', value)} />
            <PreferenceRow checked={settings.twentyFourHour} icon={<Clock size={17} />} label="Formato 24h" onChange={(value) => changeSetting('twentyFourHour', value)} />
            <PreferenceRow checked={settings.autoLocationRefresh} icon={<LocateFixed size={17} />} label="Atualizar localização quando eu solicitar clima" onChange={(value) => changeSetting('autoLocationRefresh', value)} />
            <PreferenceRow checked={settings.dataSaverMode} icon={<WifiOff size={17} />} label="Economia de dados em rede móvel" onChange={(value) => changeSetting('dataSaverMode', value)} />
          </div>
          <div className="preference-section">
            <h2>Alertas</h2>
            <PreferenceRow checked={settings.pushNotifications} icon={<Bell size={17} />} label="Notificações push" onChange={(value) => changeSetting('pushNotifications', value)} />
            <PreferenceRow checked={settings.severeWeatherAlerts} icon={<ShieldAlert size={17} />} label="Priorizar alertas críticos de clima" onChange={(value) => changeSetting('severeWeatherAlerts', value)} />
            <PreferenceRow checked={settings.dailySummary} icon={<CloudSun size={17} />} label="Resumo diário da fazenda" onChange={(value) => changeSetting('dailySummary', value)} />
            <PreferenceRow checked={settings.offlineMode} icon={<MapPin size={17} />} label="Modo offline no campo" onChange={(value) => changeSetting('offlineMode', value)} />
          </div>
          <div className="preference-section">
            <h2>Mercado</h2>
            <PreferenceRow checked={settings.marketReferencePrices} icon={<LineChart size={17} />} label="Mostrar referências de preço em validação" onChange={(value) => changeSetting('marketReferencePrices', value)} />
            <PreferenceRow checked={settings.marketWatchlistOnly} icon={<Sprout size={17} />} label="Priorizar apenas minhas culturas no mercado" onChange={(value) => changeSetting('marketWatchlistOnly', value)} />
          </div>
        </Card>

        <button className="logout-button" onClick={() => void signOut()} type="button">
          <LogOut size={18} aria-hidden="true" />
          Sair da conta
        </button>
      </div>
    </section>
  )
}

function PreferenceRow({
  checked,
  icon,
  label,
  onChange,
}: {
  checked: boolean
  icon?: ReactNode
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="preference-row">
      <span>
        {icon}
        {label}
      </span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  )
}

import { Brand } from '../Brand'
import { LinkButton } from '../ui'

export function PublicHeader() {
  return (
    <header className="public-header">
      <Brand />
      <nav aria-label="Seções da landing">
        <a href="/#recursos">Recursos</a>
        <a href="/#motor">Motor de decisão</a>
        <a href="/#feedback">Validação local</a>
      </nav>
      <div className="public-actions">
        <a href="/login"></a>
        <LinkButton to="/login">
          Entrar 
        </LinkButton>
      </div>
    </header>
  )
}

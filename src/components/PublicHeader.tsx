import { ArrowRight } from 'lucide-react'
import { Brand } from './Brand'
import { LinkButton } from './Button'

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
        <a href="/login">Entrar</a>
        <LinkButton to="/onboarding">
          Começar grátis <ArrowRight size={17} aria-hidden="true" />
        </LinkButton>
      </div>
    </header>
  )
}

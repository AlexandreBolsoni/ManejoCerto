import { useState } from 'react'
import type { FormEvent } from 'react'
import { Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { FullLogo } from '../components/Brand'
import { Button } from '../components/Button'
import { TextField } from '../components/FormField'
import { useAuth } from '../hooks/useAuth'

type AuthMode = 'password' | 'emailLink'
type PasswordMode = 'login' | 'register'

export function LoginPage() {
  const { loading, signInWithEmail, signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>('password')
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('login')
  const [name, setName] = useState('Joao Silva')
  const [email, setEmail] = useState('joao.silva@email.com.br')
  const [password, setPassword] = useState('')
  const [emailLinkSent, setEmailLinkSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const submitEmailLink = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setEmailLinkSent(false)

    try {
      await signInWithEmail(email)
      setEmailLinkSent(true)
    } catch {
      setErrorMessage('Nao foi possivel enviar o link agora. Confira o e-mail e tente novamente.')
    }
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setEmailLinkSent(false)

    if (password.length < 6) {
      setErrorMessage('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    try {
      if (passwordMode === 'register') {
        await signUpWithPassword(email, password, name)
      } else {
        await signInWithPassword(email, password)
      }
    } catch {
      setErrorMessage('Nao foi possivel acessar com este e-mail e senha. Confira os dados e tente novamente.')
    }
  }

  const googleSignIn = async () => {
    setErrorMessage('')

    try {
      await signInWithGoogle()
    } catch {
      setErrorMessage('Nao foi possivel entrar com Google agora. Tente novamente em alguns instantes.')
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <FullLogo />
        <div>
          <h1>Entrar no NibusES</h1>
          <p>Acesso rápido para começar suas decisões do dia.</p>
        </div>
        <Button className="full" disabled={loading} onClick={() => void googleSignIn()} type="button">
          <ShieldCheck size={18} aria-hidden="true" />
          {loading ? 'Entrando...' : 'Continuar com Google'}
        </Button>
        <div className="divider">ou</div>
        <div className="auth-mode" role="tablist" aria-label="Modo de acesso">
          <button
            aria-selected={authMode === 'password'}
            onClick={() => setAuthMode('password')}
            role="tab"
            type="button"
          >
            <Lock size={16} aria-hidden="true" />
            Senha
          </button>
          <button
            aria-selected={authMode === 'emailLink'}
            onClick={() => setAuthMode('emailLink')}
            role="tab"
            type="button"
          >
            <Mail size={16} aria-hidden="true" />
            Link por e-mail
          </button>
        </div>
        {authMode === 'password' ? (
          <form className="auth-form" onSubmit={submitPassword}>
            <div className="auth-inline-actions">
              <button
                aria-pressed={passwordMode === 'login'}
                onClick={() => setPasswordMode('login')}
                type="button"
              >
                Entrar
              </button>
              <button
                aria-pressed={passwordMode === 'register'}
                onClick={() => setPasswordMode('register')}
                type="button"
              >
                Criar conta
              </button>
            </div>
            {passwordMode === 'register' ? (
              <TextField
                label="Nome"
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                type="text"
                value={name}
              />
            ) : null}
            <TextField
              label="E-mail"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@fazenda.com.br"
              type="email"
              value={email}
            />
            <TextField
              label="Senha"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo de 6 caracteres"
              type="password"
              value={password}
            />
            <Button className="full" disabled={loading} type="submit" variant="secondary">
              {passwordMode === 'register' ? <UserPlus size={18} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}
              {loading ? 'Acessando...' : passwordMode === 'register' ? 'Criar conta' : 'Entrar com senha'}
            </Button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitEmailLink}>
            <TextField
              label="E-mail"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@fazenda.com.br"
              type="email"
              value={email}
            />
            <Button className="full" disabled={loading} type="submit" variant="secondary">
              <Mail size={18} aria-hidden="true" />
              {loading ? 'Enviando...' : 'Enviar link de acesso'}
            </Button>
          </form>
        )}
        {emailLinkSent ? (
          <p className="auth-message success">Enviamos um link para {email}. Abra o e-mail para concluir o acesso.</p>
        ) : null}
        {errorMessage ? <p className="auth-message error">{errorMessage}</p> : null}
        <small>Ao continuar você aceita nossos Termos e Política de Privacidade</small>
      </section>
    </main>
  )
}

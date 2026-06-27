import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react'
import { FullLogo } from '../components/Brand'
import { Button, LinkButton, TextField } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

type LoginMode = 'magic-link' | 'password'
type PasswordMode = 'login' | 'register'

export function LoginPage() {
  const { loading, signInWithEmail, signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth()
  
  const [loginMode, setLoginMode] = useState<LoginMode>('magic-link')
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('login')
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailLinkSent, setEmailLinkSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setEmailLinkSent(false)

    if (loginMode === 'magic-link') {
      try {
        await signInWithEmail(email)
        setEmailLinkSent(true)
      } catch {
        setErrorMessage('Não foi possível enviar o link agora. Confira o e-mail e tente novamente.')
      }
    } else {
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
        setErrorMessage('Não foi possível acessar com este e-mail e senha. Confira os dados e tente novamente.')
      }
    }
  }

  const googleSignIn = async () => {
    setErrorMessage('')
    try {
      await signInWithGoogle()
    } catch {
      setErrorMessage('Não foi possível entrar com Google agora. Tente novamente em alguns instantes.')
    }
  }

  return (
    <main className="auth-page auth-page-with-footer">
      <section className="auth-card">
        <div className="auth-login-top">
          <LinkButton size="sm" variant="ghost" className="auth-login-back" to="/">
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar à página inicial
          </LinkButton>
        </div>

        {/* Adicionei uma classe para a logo para garantir o alinhamento */}
        <div className="auth-logo-wrapper">
          <FullLogo />
        </div>
        
        {/* Aplicando a classe auth-card-header que já existia no seu CSS */}
        <div className="auth-card-header">
          <h1>Entrar</h1>
          <p>Acesso rápido</p>
        </div>

        {/* Alterado para usar a classe específica de redes sociais (se o seu componente Button aceitar custom classes) */}
        <button 
          className="social-login-btn full" 
          disabled={loading} 
          onClick={() => void googleSignIn()} 
          type="button"
        >
          <ShieldCheck size={18} aria-hidden="true" />
          {loading ? 'Entrando...' : 'Continuar com Google'}
        </button>

        <div className="divider">ou use seu e-mail</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <TextField
            label="E-mail"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com.br"
            type="email"
            value={email}
            required
          />

          {loginMode === 'password' && (
            <>
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

              {passwordMode === 'register' && (
                <TextField
                  label="Nome"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome completo"
                  type="text"
                  value={name}
                  required
                />
              )}

              <TextField
                label="Senha"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo de 6 caracteres"
                type="password"
                value={password}
                required
              />
            </>
          )}

          <Button 
            className="full" 
            disabled={loading || !email} 
            type="submit" 
            variant={loginMode === 'password' ? 'secondary' : 'primary'}
          >
            {loginMode === 'magic-link' ? (
               <><Mail size={18} aria-hidden="true" /> {loading ? 'Enviando...' : 'Receber link de acesso'}</>
            ) : (
               <><Lock size={18} aria-hidden="true" /> {loading ? 'Acessando...' : passwordMode === 'register' ? 'Criar conta' : 'Entrar com senha'}</>
            )}
          </Button>
        </form>

        {emailLinkSent && (
          <p className="auth-message success" role="alert">Enviamos um link para {email}. Abra o e-mail para concluir o acesso.</p>
        )}
        {errorMessage && (
          <p className="auth-message error" role="alert">{errorMessage}</p>
        )}

        {/* Removido o inline CSS e criado uma classe limpa no CSS abaixo */}
        <div className="auth-switch-mode">
          <button
            type="button"
            onClick={() => {
              setLoginMode(mode => mode === 'magic-link' ? 'password' : 'magic-link')
              setErrorMessage('')
            }}
          >
            {loginMode === 'magic-link' 
              ? 'Prefere usar uma senha? Entrar com senha' 
              : 'Voltar para acesso sem senha'}
          </button>
        </div>

        <small className="auth-terms">Ao continuar você aceita nossos Termos e Política de Privacidade</small>
      </section>
    </main>
  )
}
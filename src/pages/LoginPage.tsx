import { useState } from 'react'
import type { FormEvent } from 'react'
import { Lock, Mail, ShieldCheck } from 'lucide-react'
import { FullLogo } from '../components/Brand'
import { Button, TextField } from '../components/ui'

import { useAuth } from '../hooks/useAuth'

type LoginMode = 'magic-link' | 'password'
type PasswordMode = 'login' | 'register'

export function LoginPage() {
  const { loading, signInWithEmail, signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth()
  
  // UX Otimizada: Foco inicial direto no Magic Link (Link por e-mail) para menor atrito
  const [loginMode, setLoginMode] = useState<LoginMode>('magic-link')
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('login')
  
  // Estados do formulário
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
      // Fluxo tradicional com Senha
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
        <FullLogo />
        <div>
          <h1 style={{ textAlign: 'center' }}>Entrar</h1>
          <p style={{ textAlign: 'center' }}>Acesso rápido</p>
        </div>

        {/* Opção 1: Google (Destaque máximo na hierarquia visual) */}
        <Button className="full" disabled={loading} onClick={() => void googleSignIn()} type="button">
          <ShieldCheck size={18} aria-hidden="true" />
          {loading ? 'Entrando...' : 'Continuar com Google'}
        </Button>

        <div className="divider">ou use seu e-mail</div>

        {/* Formulário Principal Unificado */}
        <form className="auth-form" onSubmit={handleSubmit}>
          
          <TextField
            label="E-mail"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@fazenda.com.br"
            type="email"
            value={email}
            required
          />

          {/* Revelação Progressiva: Campos de senha só aparecem se o utilizador alternar */}
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

        {/* Mensagens de Feedback ao utilizador */}
        {emailLinkSent && (
          <p className="auth-message success">Enviamos um link para {email}. Abra o e-mail para concluir o acesso.</p>
        )}
        {errorMessage && (
          <p className="auth-message error">{errorMessage}</p>
        )}

        {/* Opção secundária sutil para alternar o método de login */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => {
              setLoginMode(mode => mode === 'magic-link' ? 'password' : 'magic-link')
              setErrorMessage('')
            }}
            style={{ 
              background: 'transparent', border: 'none', textDecoration: 'underline', 
              cursor: 'pointer', fontSize: '0.875rem', color: 'inherit', opacity: 0.8 
            }}
          >
            {loginMode === 'magic-link' 
              ? 'Prefere usar uma senha? Entrar com senha' 
              : 'Voltar para acesso sem senha (Link por e-mail)'}
          </button>
        </div>

        <small>Ao continuar você aceita nossos Termos e Política de Privacidade</small>
      </section>
      
    
    </main>
  )
}
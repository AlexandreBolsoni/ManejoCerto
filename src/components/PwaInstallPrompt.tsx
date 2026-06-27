import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type BeforeInstallPrompt = Event & {
  readonly prompt: () => Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPrompt | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPrompt)
      setIsVisible(true)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    if (window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsVisible(false)
    }

    setDeferredPrompt(null)
  }

  if (isInstalled || !isVisible) return null

  return (
    <div className="pwa-install-banner">
      <div>
        <strong>Instalar Manejo Certo</strong>
        <p>Use o app como atalho na tela inicial e acesse mais rápido.</p>
      </div>
      <div className="pwa-install-actions">
        <button onClick={handleInstall} type="button">
          <Download size={16} aria-hidden="true" />
          Instalar
        </button>
        <button aria-label="Fechar sugestão de instalação" onClick={() => setIsVisible(false)} type="button">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

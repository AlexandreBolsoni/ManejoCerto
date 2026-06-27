import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Sempre que o 'pathname' (a rota da URL) mudar, a tela rola para o topo
    window.scrollTo(0, 0)
  }, [pathname])

  return null // Este componente não renderiza nada visualmente
}
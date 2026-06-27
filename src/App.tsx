import { BrowserRouter } from 'react-router-dom'
import { AppDataProvider } from './contexts/AppDataContext'
import { AuthProvider } from './contexts/AuthContext'
import { AppRoutes } from './routes/AppRoutes'
import { ScrollToTop } from './components/ScrollToTop'
import { PwaInstallPrompt } from './components/PwaInstallPrompt'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes />
          <PwaInstallPrompt />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

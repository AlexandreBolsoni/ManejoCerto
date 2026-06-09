import { BrowserRouter } from 'react-router-dom'
import { AppDataProvider } from './contexts/AppDataContext'
import { AuthProvider } from './contexts/AuthContext'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

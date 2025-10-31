import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider'
import { AuthProvider } from './contexts/AuthContext'
import { generationManager } from './lib/generationManager'
import './index.css'
import App from './App.tsx'

function AppWithRecovery() {
  useEffect(() => {
    // Call recovery on mount to reconnect to in-progress generations
    generationManager.recoverGenerations()
  }, [])

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppWithRecovery />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
)

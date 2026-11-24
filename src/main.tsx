import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './app/router.tsx'
import { AuthProvider } from './features/auth/contexts/AuthContext.tsx'
import { FeedbackProvider } from './features/feedback/FeedbackProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <FeedbackProvider>
        <AppRouter />
      </FeedbackProvider>
    </AuthProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/efb.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/states/ErrorBoundary'


const root = document.getElementById('root')!



createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

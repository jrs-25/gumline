import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { runSelfCheck } from './lib/selfCheck'
import './index.css'

// Assertions for the join and the deadline override, logged to the console in dev.
if (import.meta.env.DEV) {
  runSelfCheck()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

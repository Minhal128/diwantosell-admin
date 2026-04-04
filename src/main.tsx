import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error handler to suppress known third-party errors
window.addEventListener('error', (event) => {
  // Suppress checkout popup config errors from third-party scripts
  if (event.message?.includes('No checkout popup config found')) {
    console.warn('Suppressed third-party checkout error:', event.message)
    event.preventDefault()
    return false
  }
})

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress checkout popup config errors from third-party scripts
  if (event.reason?.message?.includes('No checkout popup config found')) {
    console.warn('Suppressed third-party checkout promise rejection:', event.reason.message)
    event.preventDefault()
    return false
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

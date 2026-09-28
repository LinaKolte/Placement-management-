import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const browserFetch = window.fetch.bind(window)
window.fetch = (input, init = {}) => {
  const token = localStorage.getItem('studentToken') || localStorage.getItem('adminToken')
  if (!token) return browserFetch(input, init)

  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  return browserFetch(input, { ...init, headers })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

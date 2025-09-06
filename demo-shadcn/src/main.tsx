import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

// Initialize theme from storage
const saved = localStorage.getItem('demo-shadcn-theme')
if (saved === 'dark') document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)


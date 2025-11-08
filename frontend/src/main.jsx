import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize Capacitor
import { Capacitor } from '@capacitor/core'

// Wait for device ready if on Capacitor
const initApp = async () => {
  if (Capacitor.isNativePlatform()) {
    // Wait a bit for Capacitor plugins to initialize
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

initApp()

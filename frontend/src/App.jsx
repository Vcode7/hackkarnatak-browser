import { useState, useEffect } from 'react'
import Browser from './components/Browser'
import AiChat from './components/AiChat'
import WebsiteSuggestion from './components/WebsiteSuggestion'
import DownloadPage from './components/DownloadPage'
import Login from './components/Login'
import { ThemeProvider } from './context/ThemeContext'
import { BrowserProvider } from './context/BrowserContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { isWeb } from './utils/platform'

function AppContent() {
  const { user, loading, login } = useAuth()

  // Show download page for web browsers
  if (isWeb()) {
    return <DownloadPage />
  }

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <Login onLogin={login} />
  }

  // Show full app for authenticated users
  return (
    <BrowserProvider>
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
        <Browser />
        <AiChat />
        <WebsiteSuggestion />
      </div>
    </BrowserProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

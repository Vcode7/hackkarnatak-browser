import Browser from './components/browser'
import ChatPanel from './components/AiChat'
import { ThemeProvider } from './context/ThemeContext'
import { BrowserProvider } from './context/BrowserContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { isWeb } from './utils/platform'

function AppContent() {
  const { user, loading, login } = useAuth()

  // Show simple message for web browsers
  if (isWeb()) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-gray-100">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">GenAI Browser</h1>
          <p className="text-gray-400">Please use the desktop (Electron) or mobile (Capacitor) app.</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated - allow guest mode
  if (!user) {
    // Auto-login as guest
    login({
      user_id: 'guest',
      email: 'guest@genai-browser.com',
      name: 'Guest User',
      session_token: 'guest_token'
    })
    return null
  }

  // Show full app for authenticated users
  return (
    <BrowserProvider>
      <div className="h-screen w-screen overflow-hidden bg-gray-900 text-gray-100 flex">
        <div className="flex-1 flex flex-col">
          <Browser />
        </div>
        <ChatPanel />
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

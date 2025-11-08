import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const sessionToken = localStorage.getItem('session_token')
        const userId = localStorage.getItem('user_id')
        const userEmail = localStorage.getItem('user_email')
        const userName = localStorage.getItem('user_name')

        if (sessionToken && userId) {
          // Check if guest mode
          if (sessionToken === 'guest_token') {
            setUser({
              user_id: 'guest',
              email: 'guest@lernova.com',
              name: 'Guest User',
              session_token: 'guest_token'
            })
            setLoading(false)
            return
          }

          try {
            // Verify session with backend with timeout
            const response = await axios.get(`${API_URL}/api/auth/verify`, {
              params: { session_token: sessionToken },
              timeout: 5000 // 5 second timeout
            })

            if (response.data.valid) {
              setUser({
                user_id: userId,
                email: userEmail,
                name: userName,
                session_token: sessionToken
              })
            } else {
              // Invalid session, clear storage
              clearSession()
            }
          } catch (error) {
            console.error('Session verification failed:', error.response?.status, error.message)
            // If 404, the endpoint doesn't exist - check if backend is running
            if (error.response?.status === 404) {
              console.error('Auth endpoint not found. Is the backend running on', API_URL, '?')
            }
            // On Capacitor, if backend is unreachable, still allow guest mode
            clearSession()
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('session_token', userData.session_token)
    localStorage.setItem('user_id', userData.user_id)
    localStorage.setItem('user_email', userData.email)
    localStorage.setItem('user_name', userData.name)
  }

  const logout = async () => {
    const sessionToken = localStorage.getItem('session_token')
    
    if (sessionToken && sessionToken !== 'guest_token') {
      try {
        await axios.post(`${API_URL}/api/auth/logout`, null, {
          params: { session_token: sessionToken }
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    clearSession()
    setUser(null)
  }

  const clearSession = () => {
    localStorage.removeItem('session_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_name')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

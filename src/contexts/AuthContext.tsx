import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('adminToken')
      const isAuthStored = localStorage.getItem('isAuthenticated') === 'true'
      
      if (token && isAuthStored) {
        // Validate token with backend
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            setIsAuthenticated(true)
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminData')
            localStorage.removeItem('isAuthenticated')
            setIsAuthenticated(false)
          }
        } catch (error) {
          console.error('Token validation error:', error)
          // Clear storage on error
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminData')
          localStorage.removeItem('isAuthenticated')
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
      
      setIsLoading(false)
    }

    checkAuthStatus()
  }, [])

  // Redirect logic
  useEffect(() => {
    if (isLoading) return // Don't redirect while checking auth status
    
    const publicPaths = ['/login', '/forgot-password', '/reset-password']
    
    if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
      navigate('/login')
    } else if (isAuthenticated && publicPaths.includes(location.pathname)) {
      navigate('/')
    }
  }, [isAuthenticated, location.pathname, navigate, isLoading])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Invalid credentials')
      }

      const data = await response.json()
      
      if (!data.token) {
        throw new Error('No authentication token received')
      }

      setIsAuthenticated(true)
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminData', JSON.stringify(data))
      
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      throw error // Re-throw to let the component handle the error display
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    navigate('/login')
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1ABFA1] mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

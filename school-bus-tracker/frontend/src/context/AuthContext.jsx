import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('bus_tracker_auth')
    if (saved) {
      const parsed = JSON.parse(saved)
      setUser(parsed.user)
      setToken(parsed.token)
    }
    setLoading(false)
  }, [])

  const login = (userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem('bus_tracker_auth', JSON.stringify({ user: userData, token: accessToken }))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('bus_tracker_auth')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

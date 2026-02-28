import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem('trivia_auth')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback((player, token) => {
    const data = { player, token }
    localStorage.setItem('trivia_auth', JSON.stringify(data))
    localStorage.setItem('trivia_token', token)
    setAuth(data)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('trivia_auth')
    localStorage.removeItem('trivia_token')
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout, player: auth?.player }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
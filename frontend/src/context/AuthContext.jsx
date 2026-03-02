import { createContext, useContext, useState } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getUser())

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    return data
  }

  const register = async (formData) => {
    const data = await authService.register(formData)
    return data
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
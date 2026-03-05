import { createContext, useContext, useState } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getUser())
  const [fotoPerfil, setFotoPerfil] = useState(localStorage.getItem('foto_perfil') || null)

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    // Recuperar foto si existe
    const foto = localStorage.getItem('foto_perfil')
    if (foto) setFotoPerfil(foto)
    return data
  }

  const register = async (formData) => {
    const data = await authService.register(formData)
    return data
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setFotoPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, fotoPerfil, setFotoPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
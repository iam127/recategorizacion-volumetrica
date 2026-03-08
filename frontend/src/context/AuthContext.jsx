import { createContext, useContext, useState } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getUser())
  const [fotoPerfil, setFotoPerfil] = useState(() => {
    const storedUser = authService.getUser()
    if (storedUser) {
      // Migrar foto antigua si existe
      const fotoAntigua = localStorage.getItem('foto_perfil')
      if (fotoAntigua) {
        localStorage.setItem(`foto_perfil_${storedUser.email}`, fotoAntigua)
        localStorage.removeItem('foto_perfil')
      }
      return localStorage.getItem(`foto_perfil_${storedUser.email}`) || null
    }
    return null
  })

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)

    // Migrar foto antigua si existe
    const fotoAntigua = localStorage.getItem('foto_perfil')
    if (fotoAntigua) {
      localStorage.setItem(`foto_perfil_${data.user.email}`, fotoAntigua)
      localStorage.removeItem('foto_perfil')
    }

    const foto = localStorage.getItem(`foto_perfil_${data.user.email}`)
    setFotoPerfil(foto || null)
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
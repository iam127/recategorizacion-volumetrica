import axios from 'axios'
import api from './axiosInstance'

const API_URL = 'http://localhost:8000/api/auth'

const authService = {
  login: async (email, password) => {
    // Login usa axios directo (aún no hay token, no necesita interceptor)
    const response = await axios.post(`${API_URL}/login/`, { email, password })
    if (response.data.tokens) {
      localStorage.setItem('access_token', response.data.tokens.access)
      localStorage.setItem('refresh_token', response.data.tokens.refresh)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  register: async (formData) => {
    const response = await axios.post(`${API_URL}/register/`, formData)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  getUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  getToken: () => localStorage.getItem('access_token'),

  isAuthenticated: () => !!localStorage.getItem('access_token'),

  // Actualizar perfil usando la instancia con refresh automático
  getPerfil: () => api.get('/auth/perfil/'),
  updatePerfil: (data) => api.put('/auth/perfil/', data),
  cambiarPassword: (data) => api.post('/auth/cambiar-password/', data),
}

export default authService
import axios from 'axios'

const API_URL = 'http://localhost:8000/api/auth'

const authService = {
  login: async (email, password) => {
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
}

export default authService
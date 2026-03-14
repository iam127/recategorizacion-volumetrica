import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const axiosInstance = axios.create({
  baseURL: API_URL,
})

// ── Request: agrega el access token a cada request ────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: si llega 401, refresca el token y reintenta ─────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else       prom.resolve(token)
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Si no es 401 o ya reintentamos, rechazar directo
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Si ya hay un refresh en curso, encolar esta request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return axiosInstance(original)
      }).catch(err => Promise.reject(err))
    }

    original._retry  = true
    isRefreshing     = true

    try {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) throw new Error('No refresh token')

      const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh })
      const newToken = data.access

      localStorage.setItem('access_token', newToken)
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return axiosInstance(original)

    } catch (refreshError) {
      processQueue(refreshError, null)
      // Refresh también venció → limpiar sesión y redirigir al login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(refreshError)

    } finally {
      isRefreshing = false
    }
  }
)

export default axiosInstance
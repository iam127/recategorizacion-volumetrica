import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import styles from './Login.module.css'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Aquí irá la llamada a la API cuando el backend esté listo
      console.log('Login:', formData)
      // navigate('/dashboard')
    } catch (err) {
      setError('Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <h1>ConTugas</h1>
          <p>Sistema de Recategorización</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>Iniciar Sesión</h2>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@contugas.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className={styles.link}>
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
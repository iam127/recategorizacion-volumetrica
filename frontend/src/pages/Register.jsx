import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import styles from './Register.module.css'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      // Aquí irá la llamada a la API cuando el backend esté listo
      console.log('Register:', formData)
      // navigate('/login')
    } catch (err) {
      setError('Error al registrar. Intenta de nuevo.')
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
          <h2>Crear Cuenta</h2>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Juan"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Pérez"
                required
              />
            </div>
          </div>

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

          <div className={styles.field}>
            <label>Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>

          <p className={styles.link}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Register.module.css'

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      await register(formData)
      navigate('/login')
    } catch (err) {
      const errors = err.response?.data
      if (errors?.email) {
        setError('Este correo ya está registrado')
      } else {
        setError('Error al registrar. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      {/* Panel Izquierdo */}
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" stroke="#F59E0B" strokeWidth="1.5" fill="none"/>
                <path d="M14 8v12M8 11.5l6 3.5 6-3.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className={styles.brandName}>ConTugas</span>
          </div>

          <h1 className={styles.heroTitle}>
            Únete al<br />
            <span className={styles.heroAccent}>Sistema de</span><br />
            Gestión
          </h1>
          <p className={styles.heroDesc}>
            Crea tu cuenta para acceder a la plataforma de recategorización volumétrica de ConTugas.
          </p>

          <div className={styles.steps}>
            {['Crea tu cuenta', 'Accede al sistema', 'Gestiona tarifas'].map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{i + 1}</div>
                <span className={styles.stepLabel}>{s}</span>
              </div>
            ))}
          </div>

          <div className={styles.leftDecor} />
        </div>
      </div>

      {/* Panel Derecho */}
      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Crear cuenta</h2>
            <p className={styles.formSub}>Completa los datos para registrarte</p>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5"/>
                <path d="M8 5v3M8 11h.01" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre</label>
                <input type="text" name="nombre" value={formData.nombre}
                  onChange={handleChange} placeholder="Juan"
                  className={styles.input} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Apellido</label>
                <input type="text" name="apellido" value={formData.apellido}
                  onChange={handleChange} placeholder="Pérez"
                  className={styles.input} required />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Correo electrónico</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4h14v10H2V4zm0 0l7 6 7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="ejemplo@contugas.com"
                  className={styles.inputWithIcon} required />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 8V6a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={formData.password} onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className={styles.inputWithIcon} required />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 4C5 4 2 9 2 9s3 5 7 5 7-5 7-5-3-5-7-5z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Confirmar contraseña</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 8V6a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className={styles.inputWithIcon} required />
              </div>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? (
                <span className={styles.btnLoading}>
                  <span className={styles.spinner} />
                  Creando cuenta...
                </span>
              ) : (
                <>
                  Crear Cuenta
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className={styles.loginLink}>
            ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>

          <div className={styles.footer}>
            <span>© 2026 ConTugas · Grupo Energía Bogotá</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
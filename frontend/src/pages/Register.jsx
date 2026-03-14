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
  const [rol, setRol] = useState('usuario')
  const [adminKey, setAdminKey] = useState('')
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
    if (rol === 'admin' && adminKey !== '12345') {
      setError('Clave de administrador incorrecta')
      return
    }
    setLoading(true)
    try {
      await register({ ...formData, rol })
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
            <img src="/logo-contugas-sf.jpg" alt="ConTugas" className={styles.brandLogo} />
          </div>
          <h1 className={styles.heroTitle}>
            Únete al<br />
            <span className={styles.heroAccent}>Sistema de</span><br />
            Recategorización
          </h1>
          <p className={styles.heroDesc}>
            Crea tu cuenta para acceder a la plataforma de recategorización volumétrica de ConTugas.
          </p>
          <div className={styles.steps}>
            {['Crea tu cuenta', 'Accede a la plataforma', 'Analiza y recategoriza'].map((s, i) => (
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

            {/* Selector de rol */}
            <div className={styles.rolSelector}>
              <button
                type="button"
                className={`${styles.rolBtn} ${rol === 'usuario' ? styles.rolActive : ''}`}
                onClick={() => { setRol('usuario'); setAdminKey(''); setError('') }}
              >
                👤 Usuario
              </button>
              <button
                type="button"
                className={`${styles.rolBtn} ${rol === 'admin' ? styles.rolActive : ''}`}
                onClick={() => { setRol('admin'); setError('') }}
              >
                ⚙️ Administrador
              </button>
            </div>

            {/* Clave admin */}
            <div style={{
              display: 'grid',
              gridTemplateRows: rol === 'admin' ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.25s ease'
            }}>
              <div style={{ overflow: 'hidden' }}>
                <div className={styles.field} style={{ paddingBottom: '4px' }}>
                  <label className={styles.label}>Clave de Administrador</label>
                  <div className={styles.inputWrap}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M6 8V6a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="password"
                      value={adminKey}
                      onChange={e => setAdminKey(e.target.value)}
                      placeholder="Ingresa la clave de administrador"
                      className={styles.inputWithIcon}
                      required={rol === 'admin'}
                    />
                  </div>
                  <p className={styles.adminHint}>Solo personal autorizado puede crear cuentas de administrador</p>
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Juan"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Pérez"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Correo electrónico</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4h14v10H2V4zm0 0l7 6 7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@contugas.com"
                  className={styles.inputWithIcon}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 8V6a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className={styles.inputWithIcon}
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 2l14 14M7.5 7.6A2 2 0 0010.4 10.5M6 4.9C7 4.3 8 4 9 4c4 0 7 5 7 5s-1.1 1.9-3 3.1M3.3 6.9C2.5 7.8 2 8.7 2 9s3 5 7 5c1 0 2-.3 2.9-.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 4C5 4 2 9 2 9s3 5 7 5 7-5 7-5-3-5-7-5z" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
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
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className={styles.inputWithIcon}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? (
                <span className={styles.btnLoading}>
                  <span className={styles.spinner} />
                  Registrando...
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
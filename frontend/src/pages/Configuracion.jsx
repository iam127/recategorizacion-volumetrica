import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import api from '../services/axiosInstance'
import styles from './Configuracion.module.css'

function Configuracion() {
  const { user, setUser, fotoPerfil, setFotoPerfil } = useAuth()
  const [activeTab, setActiveTab] = useState('perfil')

  // Perfil
  const [perfil, setPerfil] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
  })
  const [perfilMsg, setPerfilMsg] = useState({ type: '', text: '' })
  const [perfilLoading, setPerfilLoading] = useState(false)

  // Password
  const [passwords, setPasswords] = useState({
    old_password: '', new_password: '', confirm_password: ''
  })
  const [passMsg, setPassMsg] = useState({ type: '', text: '' })
  const [passLoading, setPassLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Notificaciones
  const [notif, setNotif] = useState({
    recategorizacion: true, reportes: false, sistema: true
  })
  const [notifMsg, setNotifMsg] = useState({ type: '', text: '' })

  // Foto
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(fotoPerfil)
  const [fotoMsg, setFotoMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    const saved = localStorage.getItem('notificaciones')
    if (saved) setNotif(JSON.parse(saved))
  }, [])

  useEffect(() => {
    setFotoPreview(fotoPerfil)
  }, [fotoPerfil])

  // Handlers perfil
  const handlePerfilSubmit = async (e) => {
    e.preventDefault()
    setPerfilLoading(true)
    setPerfilMsg({ type: '', text: '' })
    try {
      await api.put('/auth/perfil/', perfil)
      const storedUser = JSON.parse(localStorage.getItem('user'))
      const updatedUser = { ...storedUser, ...perfil }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setPerfilMsg({ type: 'success', text: 'Perfil actualizado correctamente' })
    } catch {
      setPerfilMsg({ type: 'error', text: 'Error al actualizar el perfil' })
    } finally {
      setPerfilLoading(false)
    }
  }

  // Handlers password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPassMsg({ type: '', text: '' })
    if (passwords.new_password !== passwords.confirm_password) {
      setPassMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden' })
      return
    }
    if (passwords.new_password.length < 6) {
      setPassMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }
    setPassLoading(true)
    try {
      await api.post('/auth/cambiar-password/', {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      })
      setPassMsg({ type: 'success', text: 'Contraseña actualizada correctamente' })
      setPasswords({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.error || 'Error al cambiar la contraseña' })
    } finally {
      setPassLoading(false)
    }
  }

  // Handlers notificaciones
  const handleNotifSave = () => {
    localStorage.setItem('notificaciones', JSON.stringify(notif))
    setNotifMsg({ type: 'success', text: 'Preferencias guardadas correctamente' })
    setTimeout(() => setNotifMsg({ type: '', text: '' }), 3000)
  }

  // Handlers foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFotoMsg({ type: 'error', text: 'La imagen no debe superar 2MB' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setFotoPreview(reader.result)
      setFoto(file)
    }
    reader.readAsDataURL(file)
  }

  const handleFotoSave = () => {
    if (!fotoPreview) return
    localStorage.setItem(`foto_perfil_${user.email}`, fotoPreview)
    setFotoPerfil(fotoPreview)
    setFotoMsg({ type: 'success', text: 'Foto actualizada correctamente' })
    setTimeout(() => setFotoMsg({ type: '', text: '' }), 3000)
  }

  const handleFotoDelete = () => {
    setFotoPreview(null)
    setFoto(null)
    setFotoPerfil(null)
    localStorage.removeItem(`foto_perfil_${user.email}`)
  }

  const tabs = [
    { id: 'perfil',         label: 'Editar Perfil',    icon: '👤' },
    { id: 'foto',           label: 'Foto de Perfil',   icon: '📷' },
    { id: 'password',       label: 'Contraseña',       icon: '🔒' },
    { id: 'notificaciones', label: 'Notificaciones',   icon: '🔔' },
  ]

  return (
    <Layout title="Configuración">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="perfil" className={styles.avatarImg} />
            ) : (
              <>{user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}</>
            )}
          </div>
          <div>
            <h2 className={styles.headerName}>{user?.nombre} {user?.apellido}</h2>
            <p className={styles.headerEmail}>{user?.email}</p>
            <span className={styles.headerRole}>
              {user?.rol === 'admin' ? '⚙️ Administrador' : '👤 Usuario'}
            </span>
          </div>
        </div>

        <div className={styles.body}>
          {/* Tabs */}
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className={styles.content}>

            {/* PERFIL */}
            {activeTab === 'perfil' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Información Personal</h3>
                <p className={styles.sectionSub}>Actualiza tus datos de perfil</p>

                {perfilMsg.text && (
                  <div className={`${styles.msg} ${styles[perfilMsg.type]}`}>
                    {perfilMsg.type === 'success' ? '✅' : '❌'} {perfilMsg.text}
                  </div>
                )}

                <form onSubmit={handlePerfilSubmit} className={styles.form}>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>Nombre</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={perfil.nombre}
                        onChange={e => setPerfil({ ...perfil, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Apellido</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={perfil.apellido}
                        onChange={e => setPerfil({ ...perfil, apellido: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Correo electrónico</label>
                    <input
                      className={styles.input}
                      type="email"
                      value={perfil.email}
                      onChange={e => setPerfil({ ...perfil, email: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className={styles.btn} disabled={perfilLoading}>
                    {perfilLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </form>
              </div>
            )}

            {/* FOTO */}
            {activeTab === 'foto' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Foto de Perfil</h3>
                <p className={styles.sectionSub}>Sube una imagen para personalizar tu perfil</p>

                {fotoMsg.text && (
                  <div className={`${styles.msg} ${styles[fotoMsg.type]}`}>
                    {fotoMsg.type === 'success' ? '✅' : '❌'} {fotoMsg.text}
                  </div>
                )}

                <div className={styles.fotoWrap}>
                  <div className={styles.fotoPreview}>
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Foto de perfil" className={styles.fotoImg} />
                    ) : (
                      <div className={styles.fotoPlaceholder}>
                        {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className={styles.fotoActions}>
                    <p className={styles.fotoHint}>
                      Formatos permitidos: JPG, PNG. Tamaño máximo: 2MB
                    </p>
                    <label className={styles.fotoLabel}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleFotoChange}
                        className={styles.fotoInput}
                      />
                      📁 Seleccionar imagen
                    </label>
                    {foto && (
                      <p className={styles.fotoName}>✅ {foto.name}</p>
                    )}
                    <button className={styles.btn} onClick={handleFotoSave} disabled={!foto}>
                      Guardar Foto
                    </button>
                    {fotoPerfil && (
                      <button className={styles.btnDanger} onClick={handleFotoDelete}>
                        🗑️ Eliminar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PASSWORD */}
            {activeTab === 'password' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Cambiar Contraseña</h3>
                <p className={styles.sectionSub}>Elige una contraseña segura de al menos 6 caracteres</p>

                {passMsg.text && (
                  <div className={`${styles.msg} ${styles[passMsg.type]}`}>
                    {passMsg.type === 'success' ? '✅' : '❌'} {passMsg.text}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.label}>Contraseña actual</label>
                    <div className={styles.inputWrap}>
                      <input
                        className={styles.input}
                        type={showPass ? 'text' : 'password'}
                        value={passwords.old_password}
                        onChange={e => setPasswords({ ...passwords, old_password: e.target.value })}
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Nueva contraseña</label>
                    <input
                      className={styles.input}
                      type={showPass ? 'text' : 'password'}
                      value={passwords.new_password}
                      onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Confirmar nueva contraseña</label>
                    <input
                      className={styles.input}
                      type={showPass ? 'text' : 'password'}
                      value={passwords.confirm_password}
                      onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button type="submit" className={styles.btn} disabled={passLoading}>
                    {passLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </form>
              </div>
            )}

            {/* NOTIFICACIONES */}
            {activeTab === 'notificaciones' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Preferencias de Notificaciones</h3>
                <p className={styles.sectionSub}>Elige qué notificaciones deseas recibir</p>

                {notifMsg.text && (
                  <div className={`${styles.msg} ${styles[notifMsg.type]}`}>
                    ✅ {notifMsg.text}
                  </div>
                )}

                <div className={styles.notifList}>
                  {[
                    { key: 'recategorizacion', label: 'Proceso de Recategorización', desc: 'Notificaciones cuando se completa un proceso de recategorización' },
                    { key: 'reportes',         label: 'Reportes Disponibles',        desc: 'Avisos cuando hay nuevos reportes listos para descargar' },
                    { key: 'sistema',          label: 'Alertas del Sistema',         desc: 'Notificaciones importantes sobre el funcionamiento del sistema' },
                  ].map(item => (
                    <div key={item.key} className={styles.notifItem}>
                      <div className={styles.notifInfo}>
                        <span className={styles.notifLabel}>{item.label}</span>
                        <span className={styles.notifDesc}>{item.desc}</span>
                      </div>
                      <button
                        className={`${styles.toggle} ${notif[item.key] ? styles.toggleOn : ''}`}
                        onClick={() => setNotif({ ...notif, [item.key]: !notif[item.key] })}
                      >
                        <span className={styles.toggleThumb} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className={styles.btn} onClick={handleNotifSave}>
                  Guardar Preferencias
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Configuracion
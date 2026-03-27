import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/axiosInstance'
import styles from './Navbar.module.css'

function Navbar({ title }) {
  const { user } = useAuth()
  const [abierto, setAbierto]               = useState(false)
  const [notificaciones, setNotificaciones] = useState([])
  const [leidas, setLeidas]                 = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_leidas') || '[]') } catch { return [] }
  })
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cargarNotificaciones = () => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    api.get('/operaciones/historial/').then(res => {
      const prefs = JSON.parse(
        localStorage.getItem('notificaciones') ||
        '{"recategorizacion":true,"reportes":false,"sistema":true}'
      )
      const notifs = []

      res.data.forEach(imp => {
        const fecha = imp.fecha
        if (prefs.recategorizacion) {
          notifs.push({ id: `comp_${imp.id}`, tipo: 'exito', titulo: 'Importación completada', mensaje: `${imp.procesados.toLocaleString()} clientes procesados · ${imp.recategorizados.toLocaleString()} recategorizados`, fecha })
          notifs.push({ id: `resumen_${imp.id}`, tipo: 'info', titulo: 'Resumen del proceso ETL', mensaje: `Sin cambios: ${imp.sin_cambios.toLocaleString()} · No aptos: ${imp.no_aptos.toLocaleString()} · Anomalías: ${imp.anomalias.toLocaleString()}`, fecha })
        }
        if (prefs.sistema && imp.anomalias > 0)
          notifs.push({ id: `anom_${imp.id}`, tipo: 'alerta', titulo: 'Anomalías detectadas', mensaje: `Se detectaron ${imp.anomalias.toLocaleString()} anomalías en la última importación`, fecha })
        const pctNoAptos = imp.total_registros > 0 ? (imp.no_aptos / imp.total_registros) * 100 : 0
        if (prefs.sistema && pctNoAptos > 10)
          notifs.push({ id: `noaptos_${imp.id}`, tipo: 'advertencia', titulo: 'Alto porcentaje de no aptos', mensaje: `El ${pctNoAptos.toFixed(1)}% de clientes quedaron como no aptos`, fecha })
        if (prefs.sistema && imp.procesados < 10000)
          notifs.push({ id: `pocos_${imp.id}`, tipo: 'advertencia', titulo: 'Pocos registros importados', mensaje: `Solo se procesaron ${imp.procesados.toLocaleString()} clientes. Verifica que hayas cargado todos los meses.`, fecha })
        if (prefs.reportes)
          notifs.push({ id: `reporte_${imp.id}`, tipo: 'info', titulo: 'Reporte disponible', mensaje: `El reporte de la importación del ${fecha} está listo para descargar`, fecha })
      })

      setNotificaciones(notifs.slice(0, 20))
    }).catch(() => {})
  }

  useEffect(() => {
    cargarNotificaciones()
    const intervalo = setInterval(cargarNotificaciones, 60000)

    // ── Recargar cuando termina una importación ──
    window.addEventListener('importacion-completada', cargarNotificaciones)

    return () => {
      clearInterval(intervalo)
      window.removeEventListener('importacion-completada', cargarNotificaciones)
    }
  }, [])

  const noLeidas = notificaciones.filter(n => !leidas.includes(n.id)).length

  const marcarTodas = () => {
    const ids = notificaciones.map(n => n.id)
    localStorage.setItem('notif_leidas', JSON.stringify(ids))
    setLeidas(ids)
  }

  const marcarUna = (id) => {
    const nuevas = [...leidas, id]
    localStorage.setItem('notif_leidas', JSON.stringify(nuevas))
    setLeidas(nuevas)
  }

  const iconTipo = {
    exito:       { emoji: '✅', color: '#10B981', bg: '#ECFDF5' },
    info:        { emoji: '📊', color: '#2e75b6', bg: '#EFF6FF' },
    alerta:      { emoji: '🔍', color: '#EF4444', bg: '#FEF2F2' },
    advertencia: { emoji: '⚠️', color: '#F59E0B', bg: '#FFFBEB' },
    error:       { emoji: '❌', color: '#EF4444', bg: '#FEF2F2' },
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.right}>

        {/* Campanita */}
        <div className={styles.notifWrap} ref={ref}>
          <button
            className={`${styles.notifBtn} ${abierto ? styles.notifBtnActive : ''}`}
            onClick={() => setAbierto(v => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5A1 1 0 003.5 15h13a1 1 0 00.86-1.5L16 11V8a6 6 0 00-6-6z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {noLeidas > 0 && (
              <span className={styles.notifBadge}>{noLeidas > 9 ? '9+' : noLeidas}</span>
            )}
          </button>

          {abierto && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Notificaciones</span>
                {noLeidas > 0 && (
                  <button className={styles.marcarBtn} onClick={marcarTodas}>
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              <div className={styles.notifList}>
                {notificaciones.length === 0 ? (
                  <div className={styles.notifEmpty}>
                    <span>🔔</span>
                    <p>Sin notificaciones aún</p>
                  </div>
                ) : (
                  notificaciones.map(n => {
                    const estilo  = iconTipo[n.tipo] || iconTipo.info
                    const esLeida = leidas.includes(n.id)
                    return (
                      <div
                        key={n.id}
                        className={`${styles.notifItem} ${esLeida ? styles.notifLeida : ''}`}
                        onClick={() => marcarUna(n.id)}
                      >
                        <div className={styles.notifIconWrap} style={{ background: estilo.bg }}>
                          <span className={styles.notifEmoji}>{estilo.emoji}</span>
                        </div>
                        <div className={styles.notifContent}>
                          <p className={styles.notifTitulo}
                            style={{ color: esLeida ? '#9CA3AF' : '#0B1120' }}>
                            {n.titulo}
                          </p>
                          <p className={styles.notifMensaje}>{n.mensaje}</p>
                          <p className={styles.notifFecha}>{n.fecha}</p>
                        </div>
                        {!esLeida && (
                          <div className={styles.notifDot} style={{ background: estilo.color }} />
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {notificaciones.length > 0 && (
                <div className={styles.dropdownFooter}>
                  <span className={styles.footerText}>
                    {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día ✓'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.divider} />
        <div className={styles.badge}>
          {user?.rol === 'admin' ? '⚙️ Admin' : '👤 Usuario'}
        </div>
        <span className={styles.email}>{user?.email}</span>
      </div>
    </header>
  )
}

export default Navbar
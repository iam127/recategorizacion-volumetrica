import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import api from '../services/axiosInstance'
import styles from './Usuarios.module.css'


function Usuarios() {
  const [usuarios, setUsuarios]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [filtroRol, setFiltroRol]   = useState('todos')
  const [togglingId, setTogglingId] = useState(null)

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/auth/usuarios/')
      setUsuarios(res.data)
    } catch (err) {
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsuarios() }, [])

  const toggleActivo = async (id, activo) => {
    setTogglingId(id)
    try {
      await api.patch(`/auth/usuarios/${id}/toggle/`, {})
      setUsuarios(prev => prev.map(u =>
        u.id === id ? { ...u, is_active: !activo } : u
      ))
    } catch {
      setError('Error al actualizar usuario')
    } finally {
      setTogglingId(null)
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const matchSearch = (
      u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      u.apellido?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    return matchSearch && matchRol
  })

  const totalActivos   = usuarios.filter(u => u.is_active).length
  const totalAdmins    = usuarios.filter(u => u.rol === 'admin').length
  const totalUsuarios  = usuarios.filter(u => u.rol !== 'admin').length

  return (
    <Layout title="Usuarios">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>👥</div>
          <div>
            <h2 className={styles.headerTitle}>Gestión de Usuarios</h2>
            <p className={styles.headerDesc}>
              Administra los usuarios del sistema, activa o desactiva cuentas y controla los accesos.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <p className={styles.statNum}>{usuarios.length}</p>
            <p className={styles.statLabel}>Total usuarios</p>
          </div>
          <div className={styles.statCard}>
            <p className={`${styles.statNum} ${styles.verde}`}>{totalActivos}</p>
            <p className={styles.statLabel}>Activos</p>
          </div>
          <div className={styles.statCard}>
            <p className={`${styles.statNum} ${styles.ambar}`}>{totalAdmins}</p>
            <p className={styles.statLabel}>Administradores</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statNum}>{totalUsuarios}</p>
            <p className={styles.statLabel}>Usuarios normales</p>
          </div>
        </div>

        {/* Filtros */}
        <div className={styles.filtros}>
          <input
            className={styles.searchInput}
            placeholder="🔍 Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={styles.filtroRoles}>
            {['todos', 'admin', 'usuario'].map(rol => (
              <button
                key={rol}
                className={`${styles.filtroBtn} ${filtroRol === rol ? styles.filtroBtnActivo : ''}`}
                onClick={() => setFiltroRol(rol)}
              >
                {rol === 'todos' ? 'Todos' : rol === 'admin' ? 'Admins' : 'Usuarios'}
              </button>
            ))}
          </div>
        </div>

        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

        {/* Tabla */}
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.loadingBox}>
              <span className={styles.spinner} />
              <p>Cargando usuarios...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className={styles.emptyBox}>
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Importaciones</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map(u => (
                  <tr key={u.id} className={!u.is_active ? styles.rowInactivo : ''}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {u.nombre?.charAt(0)}{u.apellido?.charAt(0)}
                        </div>
                        <div>
                          <p className={styles.userName}>{u.nombre} {u.apellido}</p>
                          <p className={styles.userId}>ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.emailCell}>{u.email}</td>
                    <td>
                      <span className={`${styles.rolBadge} ${u.rol === 'admin' ? styles.rolAdmin : styles.rolUser}`}>
                        {u.rol === 'admin' ? '👑 Admin' : '👤 Usuario'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.estadoBadge} ${u.is_active ? styles.estadoActivo : styles.estadoInactivo}`}>
                        {u.is_active ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                    <td className={styles.importCell}>
                      <span className={styles.importCount}>{u.total_importaciones ?? 0}</span>
                    </td>
                    <td>
                      <button
                        className={`${styles.toggleBtn} ${u.is_active ? styles.toggleBtnDesactivar : styles.toggleBtnActivar}`}
                        onClick={() => toggleActivo(u.id, u.is_active)}
                        disabled={togglingId === u.id}
                      >
                        {togglingId === u.id
                          ? '...'
                          : u.is_active ? 'Desactivar' : 'Activar'
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default Usuarios
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  clientes: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  reportes: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2v4h4M7 9h6M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  usuarios: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 17c0-3 2.686-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 9a3 3 0 000-6M19 17c0-3-2-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  config: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M8 3H4a1 1 0 00-1 1v12a1 1 0 001 1h4M13 14l4-4-4-4M17 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    
  ),
  operaciones: (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 4h14M3 8h9M3 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 11v6M11 14l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  ),

  ayuda: (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 11V10a2 2 0 100-4 2 2 0 000 4M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
  ),
}

function Sidebar() {
  const { user, logout, fotoPerfil } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const adminLinks = [
    { to: '/dashboard',    label: 'Dashboard',    icon: icons.dashboard },
    { to: '/reportes',     label: 'Reportes',     icon: icons.reportes },
    { to: '/usuarios',     label: 'Usuarios',     icon: icons.usuarios },
    { to: '/configuracion',label: 'Configuración',icon: icons.config },
    { to: '/ayuda', label: 'Ayuda', icon: icons.ayuda },
  ]

  const userLinks = [
    { to: '/dashboard',     label: 'Dashboard',     icon: icons.dashboard },
    { to: '/clientes',      label: 'Clientes',       icon: icons.clientes },
    { to: '/operaciones',   label: 'Operaciones',    icon: icons.operaciones },
    { to: '/reportes',      label: 'Reportes',       icon: icons.reportes },
    { to: '/configuracion', label: 'Configuración',  icon: icons.config },
    { to: '/ayuda', label: 'Ayuda', icon: icons.ayuda },
  ]

  const links = user?.rol === 'admin' ? adminLinks : userLinks

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <img src="/logo-contugas.jpg" alt="ConTugas" className={styles.logoImg} />
      </div>

      {/* User info */}
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {fotoPerfil ? (
            <img src={fotoPerfil} alt="perfil" className={styles.avatarImg} />
          ) : (
            <>{user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}</>
          )}
        </div>
        <div className={styles.userDetails}>
          <span className={styles.userName}>{user?.nombre} {user?.apellido}</span>
          <span className={styles.userRole}>
            {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <span className={styles.navLabel}>Menú Principal</span>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <span className={styles.navIcon}>{icons.logout}</span>
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  )
}

export default Sidebar
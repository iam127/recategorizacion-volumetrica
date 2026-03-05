import { useAuth } from '../../context/AuthContext'
import styles from './Navbar.module.css'

function Navbar({ title }) {
  const { user } = useAuth()

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.right}>
        <div className={styles.badge}>
          {user?.rol === 'admin' ? '⚙️ Admin' : '👤 Usuario'}
        </div>
        <span className={styles.email}>{user?.email}</span>
      </div>
    </header>
  )
}

export default Navbar
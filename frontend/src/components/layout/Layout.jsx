import Sidebar from './Sidebar'
import Navbar from './Navbar'
import styles from './Layout.module.css'

function Layout({ children, title }) {
  return (
    <div className={styles.root}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar title={title} />
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
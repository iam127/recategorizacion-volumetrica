import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import styles from './Clientes.module.css'

const API_URL = 'http://localhost:8000/api'

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalClientes, setTotalClientes] = useState(0)
  const clientesPorPagina = 10

  useEffect(() => {
    fetchClientes()
  }, [paginaActual, busqueda])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_URL}/clientes/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: paginaActual,
          search: busqueda,
          page_size: clientesPorPagina,
        }
      })
      setClientes(res.data.results || [])
      setTotalClientes(res.data.count || 0)
    } catch {
      setClientes([])
      setTotalClientes(0)
    } finally {
      setLoading(false)
    }
  }

  const totalPaginas = Math.ceil(totalClientes / clientesPorPagina)

  const getCategoriaColor = (categoria) => {
    if (categoria === 'A1') return styles.catA1
    if (categoria === 'A2') return styles.catA2
    if (categoria === 'B') return styles.catB
    return styles.catDefault
  }

  return (
    <Layout title="Clientes">
      <div className={styles.page}>

        {/* Header con stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <div>
              <p className={styles.statValue}>{totalClientes.toLocaleString()}</p>
              <p className={styles.statLabel}>Total Clientes</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📊</span>
            <div>
              <p className={styles.statValue}>
                {clientes.filter(c => c.categoria === 'A1').length}
              </p>
              <p className={styles.statLabel}>Categoría A1</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📈</span>
            <div>
              <p className={styles.statValue}>
                {clientes.filter(c => c.categoria === 'A2').length}
              </p>
              <p className={styles.statLabel}>Categoría A2</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📉</span>
            <div>
              <p className={styles.statValue}>
                {clientes.filter(c => c.categoria === 'B').length}
              </p>
              <p className={styles.statLabel}>Categoría B</p>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className={styles.tableCard}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Buscar por nombre, código o dirección..."
                value={busqueda}
                onChange={e => {
                  setBusqueda(e.target.value)
                  setPaginaActual(1)
                }}
              />
            </div>
            <div className={styles.toolbarRight}>
              <span className={styles.totalBadge}>
                {totalClientes} registros
              </span>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre / Razón Social</th>
                  <th>Dirección</th>
                  <th>Localidad</th>
                  <th>Consumo Promedio</th>
                  <th>Categoría Anterior</th>
                  <th>Categoría Nueva</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyRow}>
                      <div className={styles.loadingWrap}>
                        <span className={styles.spinner} />
                        <span>Cargando clientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyRow}>
                      <div className={styles.emptyWrap}>
                        <span className={styles.emptyIcon}>👥</span>
                        <p className={styles.emptyTitle}>Sin clientes registrados</p>
                        <p className={styles.emptySub}>
                          Importa un archivo Excel en la sección de Operaciones para ver los clientes aquí
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente, i) => (
                    <tr key={cliente.id || i} className={styles.row}>
                      <td className={styles.codigo}>{cliente.codigo}</td>
                      <td className={styles.nombre}>{cliente.nombre}</td>
                      <td className={styles.direccion}>{cliente.direccion}</td>
                      <td>{cliente.localidad}</td>
                      <td className={styles.consumo}>
                        {cliente.consumo_promedio?.toLocaleString()} m³
                      </td>
                      <td>
                        <span className={`${styles.categoria} ${getCategoriaColor(cliente.categoria_anterior)}`}>
                          {cliente.categoria_anterior || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.categoria} ${getCategoriaColor(cliente.categoria_nueva)}`}>
                          {cliente.categoria_nueva || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.estado} ${cliente.recategorizado ? styles.estadoCambio : styles.estadoSinCambio}`}>
                          {cliente.recategorizado ? 'Recategorizado' : 'Sin cambio'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                ← Anterior
              </button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let page = i + 1
                  if (totalPaginas > 5 && paginaActual > 3) {
                    page = paginaActual - 2 + i
                  }
                  if (page > totalPaginas) return null
                  return (
                    <button
                      key={page}
                      className={`${styles.pageNum} ${paginaActual === page ? styles.pageNumActive : ''}`}
                      onClick={() => setPaginaActual(page)}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              <button
                className={styles.pageBtn}
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default Clientes
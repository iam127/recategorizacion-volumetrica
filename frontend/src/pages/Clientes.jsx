import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import styles from './Clientes.module.css'

const API_URL = 'http://localhost:8000/api'

function Clientes() {
  const [clientes, setClientes]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [busqueda, setBusqueda]         = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalClientes, setTotalClientes] = useState(0)
  const clientesPorPagina = 10

  useEffect(() => { fetchClientes() }, [paginaActual, busqueda])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_URL}/operaciones/clientes/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: paginaActual, search: busqueda, page_size: clientesPorPagina }
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

  const getTarifaColor = (tarifa) => {
    if (tarifa === 'REG-A1-CO') return styles.catA1
    if (tarifa === 'REG-A2-CO') return styles.catA2
    if (tarifa === 'REG-B-CO')  return styles.catB
    return styles.catDefault
  }

  return (
    <Layout title="Clientes">
      <div className={styles.page}>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <div>
              <p className={styles.statValue}>{totalClientes.toLocaleString()}</p>
              <p className={styles.statLabel}>Total Clientes</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🔄</span>
            <div>
              <p className={styles.statValue}>
                {clientes.filter(c => c.Estado === 'Recategorizado').length}
              </p>
              <p className={styles.statLabel}>Recategorizados</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>➖</span>
            <div>
              <p className={styles.statValue}>
                {clientes.filter(c => c.Estado === 'Sin cambio').length}
              </p>
              <p className={styles.statLabel}>Sin Cambio</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📊</span>
            <div>
              <p className={styles.statValue}>
                {clientes.filter(c => c.Nueva_tarifa === 'REG-A1-CO').length}
              </p>
              <p className={styles.statLabel}>Categoría A1</p>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className={styles.tableCard}>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Buscar por instalación, contrato o porción..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setPaginaActual(1) }}
              />
            </div>
            <span className={styles.totalBadge}>{totalClientes} registros</span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Instalación</th>
                  <th>Cuenta Contrato</th>
                  <th>Días Consumo</th>
                  <th>Consumo Total (m³)</th>
                  <th>Prom. Diario</th>
                  <th>Prom. Mensual</th>
                  <th>Prom. Redondeado</th>
                  <th>Tarifa Anterior</th>
                  <th>Nueva Tarifa</th>
                  <th>Porción</th>
                  <th>Unidad Predial</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className={styles.emptyRow}>
                      <div className={styles.loadingWrap}>
                        <span className={styles.spinner} />
                        <span>Cargando clientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={12} className={styles.emptyRow}>
                      <div className={styles.emptyWrap}>
                        <span className={styles.emptyIcon}>👥</span>
                        <p className={styles.emptyTitle}>Sin clientes registrados</p>
                        <p className={styles.emptySub}>
                          Importa los archivos Excel en Operaciones para ver los clientes aquí
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clientes.map((c, i) => (
                    <tr key={c.id || i} className={styles.row}>
                      <td className={styles.codigo}>{c['Instalación']}</td>
                      <td className={styles.codigo}>{c.Cuenta_contrato}</td>
                      <td>{c.Total_dias_consumo?.toLocaleString()}</td>
                      <td>{c.Total_consumo_facturado?.toLocaleString()}</td>
                      <td>{c.Promedio_diario}</td>
                      <td>{c.Promedio_mensual}</td>
                      <td><strong>{c.Promedio_mensual_redondeado}</strong></td>
                      <td>
                        <span className={`${styles.categoria} ${getTarifaColor(c.Tarifa_referencia)}`}>
                          {c.Tarifa_referencia || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.categoria} ${getTarifaColor(c.Nueva_tarifa)}`}>
                          {c.Nueva_tarifa || '-'}
                        </span>
                      </td>
                      <td className={styles.direccion}>{c.Porcion}</td>
                      <td>{c.Unidad_Predial}</td>
                      <td>
                        <span className={`${styles.estado} ${c.Estado === 'Recategorizado' ? styles.estadoCambio : styles.estadoSinCambio}`}>
                          {c.Estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >← Anterior</button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let page = i + 1
                  if (totalPaginas > 5 && paginaActual > 3) page = paginaActual - 2 + i
                  if (page > totalPaginas) return null
                  return (
                    <button
                      key={page}
                      className={`${styles.pageNum} ${paginaActual === page ? styles.pageNumActive : ''}`}
                      onClick={() => setPaginaActual(page)}
                    >{page}</button>
                  )
                })}
              </div>
              <button
                className={styles.pageBtn}
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >Siguiente →</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Clientes
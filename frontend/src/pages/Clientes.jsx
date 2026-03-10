import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import styles from './Clientes.module.css'

const API_URL = 'http://localhost:8000/api'

function ModalCliente({ cliente, onClose }) {
  if (!cliente) return null

  const getTarifaColor = (tarifa) => {
    if (tarifa === 'REG-A1-CO') return { bg: '#DBEAFE', color: '#1e3a5f' }
    if (tarifa === 'REG-A2-CO') return { bg: '#EFF6FF', color: '#2e75b6' }
    if (tarifa === 'REG-B-CO')  return { bg: '#F3F4F6', color: '#6B7280' }
    return { bg: '#F3F4F6', color: '#6B7280' }
  }

  const t1 = getTarifaColor(cliente.Tarifa_referencia)
  const t2 = getTarifaColor(cliente.Nueva_tarifa)
  const cambio = cliente.Tarifa_referencia !== cliente.Nueva_tarifa

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Detalle del Cliente</h3>
            <p className={styles.modalSub}>Instalación {cliente['Instalación']}</p>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Estado banner */}
        <div className={`${styles.modalBanner} ${cliente.Estado === 'Recategorizado' ? styles.bannerVerde : styles.bannerGris}`}>
          <span className={styles.bannerIcon}>{cliente.Estado === 'Recategorizado' ? '🔄' : '➖'}</span>
          <span className={styles.bannerText}>{cliente.Estado}</span>
        </div>

        {/* Info principal */}
        <div className={styles.modalGrid}>
          <div className={styles.modalField}>
            <span className={styles.fieldLabel}>Instalación</span>
            <span className={styles.fieldValue}>{cliente['Instalación']}</span>
          </div>
          <div className={styles.modalField}>
            <span className={styles.fieldLabel}>Cuenta Contrato</span>
            <span className={styles.fieldValue}>{cliente.Cuenta_contrato}</span>
          </div>
          <div className={styles.modalField}>
            <span className={styles.fieldLabel}>Porción</span>
            <span className={styles.fieldValue}>{cliente.Porcion || '—'}</span>
          </div>
          <div className={styles.modalField}>
            <span className={styles.fieldLabel}>Unidad Predial</span>
            <span className={styles.fieldValue}>{cliente.Unidad_Predial || '—'}</span>
          </div>
        </div>

        {/* Separador */}
        <div className={styles.modalDivider} />

        {/* Consumo */}
        <p className={styles.modalSection}>📊 Consumo</p>
        <div className={styles.modalGrid}>
          <div className={styles.modalStat}>
            <span className={styles.modalStatNum}>{cliente.Total_dias_consumo?.toLocaleString()}</span>
            <span className={styles.modalStatLabel}>Total Días Consumo</span>
          </div>
          <div className={styles.modalStat}>
            <span className={styles.modalStatNum}>{cliente.Total_consumo_facturado?.toLocaleString()}</span>
            <span className={styles.modalStatLabel}>Total Consumo m³</span>
          </div>
          <div className={styles.modalStat}>
            <span className={styles.modalStatNum}>{cliente.Promedio_diario}</span>
            <span className={styles.modalStatLabel}>Promedio Diario</span>
          </div>
          <div className={styles.modalStat}>
            <span className={styles.modalStatNum}>{cliente.Promedio_mensual}</span>
            <span className={styles.modalStatLabel}>Promedio Mensual</span>
          </div>
          <div className={styles.modalStat}>
            <span className={styles.modalStatNum} style={{ color: '#F59E0B' }}>{cliente.Promedio_mensual_redondeado}</span>
            <span className={styles.modalStatLabel}>Prom. Redondeado</span>
          </div>
        </div>

        <div className={styles.modalDivider} />

        {/* Tarifas */}
        <p className={styles.modalSection}>🏷️ Recategorización Tarifaria</p>
        <div className={styles.tarifasWrap}>
          <div className={styles.tarifaBox}>
            <span className={styles.tarifaLabel}>Tarifa Anterior</span>
            <span className={styles.tarifaBadge} style={{ background: t1.bg, color: t1.color }}>
              {cliente.Tarifa_referencia || '—'}
            </span>
          </div>
          <div className={styles.tarifaArrow}>
            {cambio ? '→' : '='}
          </div>
          <div className={styles.tarifaBox}>
            <span className={styles.tarifaLabel}>Tarifa Nueva</span>
            <span className={styles.tarifaBadge} style={{ background: t2.bg, color: t2.color }}>
              {cliente.Nueva_tarifa || '—'}
            </span>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

function Clientes() {
  const [clientes, setClientes]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [busqueda, setBusqueda]           = useState('')
  const [paginaActual, setPaginaActual]   = useState(1)
  const [totalClientes, setTotalClientes] = useState(0)
  const [clienteSelec, setClienteSelec]   = useState(null)
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
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className={styles.emptyRow}>
                      <div className={styles.loadingWrap}>
                        <span className={styles.spinner} />
                        <span>Cargando clientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={13} className={styles.emptyRow}>
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
                      <td>
                        <button
                          className={styles.btnVer}
                          onClick={() => setClienteSelec(c)}
                        >
                          👁 Ver
                        </button>
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

      {/* Modal */}
      <ModalCliente cliente={clienteSelec} onClose={() => setClienteSelec(null)} />
    </Layout>
  )
}

export default Clientes
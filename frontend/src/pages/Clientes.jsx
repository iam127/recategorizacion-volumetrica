import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import api from '../services/axiosInstance'
import styles from './Clientes.module.css'

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
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Detalle del Cliente</h3>
            <p className={styles.modalSub}>Instalación {cliente['Instalación']}</p>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={`${styles.modalBanner} ${cliente.Estado === 'Recategorizado' ? styles.bannerVerde : styles.bannerGris}`}>
          <span className={styles.bannerIcon}>{cliente.Estado === 'Recategorizado' ? '🔄' : '➖'}</span>
          <span className={styles.bannerText}>{cliente.Estado}</span>
        </div>

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

        <div className={styles.modalDivider} />

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

        <p className={styles.modalSection}>🏷️ Recategorización Tarifaria</p>
        <div className={styles.tarifasWrap}>
          <div className={styles.tarifaBox}>
            <span className={styles.tarifaLabel}>Tarifa Anterior</span>
            <span className={styles.tarifaBadge} style={{ background: t1.bg, color: t1.color }}>
              {cliente.Tarifa_referencia || '—'}
            </span>
          </div>
          <div className={styles.tarifaArrow}>{cambio ? '→' : '='}</div>
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

// ── Selector compacto reutilizable ────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {label}
      </p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 9,
          border: `1px solid ${value ? '#2e75b6' : '#E5E7EB'}`,
          fontSize: 13, fontFamily: 'DM Sans, sans-serif',
          outline: 'none', cursor: 'pointer', color: '#374151',
          background: value ? '#EFF6FF' : '#fff',
          transition: 'border .2s, background .2s',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o, i) => (
          <option key={i} value={o.value}>{o.label}</option>
        ))}
      </select>
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

  // Filtros
  const [porciones, setPorciones]   = useState([])
  const [periodos, setPeriodos]     = useState([])
  const [filtroPorcion, setFiltroPorcion] = useState('')
  const [filtroDesde, setFiltroDesde]     = useState('')
  const [filtroHasta, setFiltroHasta]     = useState('')

  const clientesPorPagina = 10
  const hayFiltros = filtroPorcion || filtroDesde || filtroHasta

  useEffect(() => { fetchClientes() }, [paginaActual, busqueda, filtroPorcion, filtroDesde, filtroHasta])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const importacionId = localStorage.getItem('importacion_seleccionada') || ''
      const params = {
        page:      paginaActual,
        page_size: clientesPorPagina,
        search:    busqueda,
      }
      
      if (importacionId) params.importacion_id = importacionId 
      if (filtroPorcion) params.porcion     = filtroPorcion
      if (filtroDesde)   params.fecha_desde = filtroDesde
      if (filtroHasta)   params.fecha_hasta = filtroHasta

      const res = await api.get('/operaciones/clientes/', { params })
      setClientes(res.data.results || [])
      setTotalClientes(res.data.count || 0)

      // Poblar opciones de filtros solo en la primera carga
      if (res.data.porciones?.length > 0 && porciones.length === 0) {
        setPorciones(res.data.porciones)
      }
      if (res.data.periodos?.length > 0 && periodos.length === 0) {
        setPeriodos(res.data.periodos)
      }
    } catch {
      setClientes([])
      setTotalClientes(0)
    } finally {
      setLoading(false)
    }
  }

  const limpiarFiltros = () => {
    setFiltroPorcion('')
    setFiltroDesde('')
    setFiltroHasta('')
    setPaginaActual(1)
  }

  const handleBusqueda = (val) => {
    setBusqueda(val)
    setPaginaActual(1)
  }

  const handleFiltro = (setter) => (val) => {
    setter(val)
    setPaginaActual(1)
  }

  const totalPaginas = Math.ceil(totalClientes / clientesPorPagina)

  const getTarifaColor = (tarifa) => {
    if (tarifa === 'REG-A1-CO') return styles.catA1
    if (tarifa === 'REG-A2-CO') return styles.catA2
    if (tarifa === 'REG-B-CO')  return styles.catB
    return styles.catDefault
  }

  // Opciones cruzadas para los selects de fecha
  const opcionesPeriodo = periodos.map(p => ({ value: p, label: p }))
  const opcionesDesde   = filtroHasta ? opcionesPeriodo.filter(o => o.value <= filtroHasta) : opcionesPeriodo
  const opcionesHasta   = filtroDesde ? opcionesPeriodo.filter(o => o.value >= filtroDesde) : opcionesPeriodo
  const opcionesPorcion = porciones.map(p => ({ value: p, label: `Porción ${p}` }))

  return (
    <Layout title="Clientes">
      <div className={styles.page}>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <div>
              <p className={styles.statValue}>{totalClientes.toLocaleString()}</p>
              <p className={styles.statLabel}>{hayFiltros ? 'Clientes filtrados' : 'Total Clientes'}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🔄</span>
            <div>
              <p className={styles.statValue}>{clientes.filter(c => c.Estado === 'Recategorizado').length}</p>
              <p className={styles.statLabel}>Recategorizados</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>➖</span>
            <div>
              <p className={styles.statValue}>{clientes.filter(c => c.Estado === 'Sin cambio').length}</p>
              <p className={styles.statLabel}>Sin Cambio</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📊</span>
            <div>
              <p className={styles.statValue}>{clientes.filter(c => c.Nueva_tarifa === 'REG-A1-CO').length}</p>
              <p className={styles.statLabel}>Categoría A1</p>
            </div>
          </div>
        </div>

        {/* Panel de filtros */}
        <div style={{
          background: '#fff',
          border: `1px solid ${hayFiltros ? '#2e75b6' : '#F0F0F0'}`,
          borderRadius: 14, padding: '16px 20px',
          transition: 'border .25s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>🔎</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0B1120', margin: 0, fontFamily: 'Sora, sans-serif' }}>
                Filtrar por Porción y Período
              </p>
              {hayFiltros && (
                <span style={{
                  background: '#EFF6FF', color: '#2e75b6', fontSize: 11,
                  fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: '1px solid #BFDBFE'
                }}>
                  FILTRO ACTIVO
                </span>
              )}
            </div>
            {hayFiltros && (
              <button
                onClick={limpiarFiltros}
                style={{
                  background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
                  padding: '4px 12px', fontSize: 12, color: '#6B7280',
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <FilterSelect
              label="Porción"
              value={filtroPorcion}
              onChange={handleFiltro(setFiltroPorcion)}
              options={opcionesPorcion}
              placeholder="— Todas las porciones —"
            />
            <FilterSelect
              label="Desde (mes)"
              value={filtroDesde}
              onChange={handleFiltro(setFiltroDesde)}
              options={opcionesDesde}
              placeholder="— Mes inicio —"
            />
            <FilterSelect
              label="Hasta (mes)"
              value={filtroHasta}
              onChange={handleFiltro(setFiltroHasta)}
              options={opcionesHasta}
              placeholder="— Mes fin —"
            />
          </div>

          {/* Resumen filtro activo */}
          {hayFiltros && !loading && (
            <div style={{
              marginTop: 12, padding: '8px 14px',
              background: '#F0F7FF', borderRadius: 9, border: '1px solid #BFDBFE',
              display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
              fontSize: 12, color: '#6B7280',
            }}>
              <span>Mostrando <strong style={{ color: '#2e75b6' }}>{totalClientes.toLocaleString()}</strong> clientes</span>
              {filtroPorcion && <span>📍 Porción <strong style={{ color: '#1e3a5f' }}>{filtroPorcion}</strong></span>}
              {(filtroDesde || filtroHasta) && (
                <span>📅 {filtroDesde || '...'} → {filtroHasta || '...'}</span>
              )}
            </div>
          )}
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
                onChange={e => handleBusqueda(e.target.value)}
              />
            </div>
            <span className={styles.totalBadge}>{totalClientes.toLocaleString()} registros</span>
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
                        <p className={styles.emptyTitle}>
                          {hayFiltros ? 'Sin resultados para los filtros aplicados' : 'Sin clientes registrados'}
                        </p>
                        <p className={styles.emptySub}>
                          {hayFiltros
                            ? 'Intenta con otra porción o rango de fechas'
                            : 'Importa los archivos Excel en Operaciones para ver los clientes aquí'
                          }
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
                        <button className={styles.btnVer} onClick={() => setClienteSelec(c)}>
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

      <ModalCliente cliente={clienteSelec} onClose={() => setClienteSelec(null)} />
    </Layout>
  )
}

export default Clientes
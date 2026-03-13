import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import api from '../services/axiosInstance'
import styles from './Dashboard.module.css'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'

const COLORS  = ['#1e3a5f', '#2e75b6', '#9CA3AF']
const TARIFA_COLORS = {
  'REG-A1-CO': '#1e3a5f',
  'REG-A2-CO': '#2e75b6',
  'REG-B-CO':  '#9CA3AF',
}

function StatCard({ label, sub, value, icon, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <div>
          <p className={styles.statLabel}>{label}</p>
          <p className={styles.statSub}>{sub}</p>
        </div>
        <div className={styles.statIcon} style={{ background: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className={styles.statValue}>{value}</p>
    </div>
  )
}

// ── Selector de estilo compacto ───────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {label}
      </p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 10,
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

function Dashboard() {
  const { user } = useAuth()

  // ── Estado principal ──────────────────────────────────────────────────────
  const [stats,       setStats]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [loadingSel,  setLoadingSel]  = useState(false)
  const [tabCuadro3,  setTabCuadro3]  = useState('todos')

  // Selectores admin
  const [usuarioSel,    setUsuarioSel]    = useState('')
  const [importacionSel, setImportacionSel] = useState('')

  // ── Estado de filtros (solo usuario normal) ───────────────────────────────
  const [filtrosOpciones, setFiltrosOpciones] = useState({ porciones: [], periodos: [] })
  const [filtroPorcion,   setFiltroPorcion]   = useState('')
  const [filtroDesde,     setFiltroDesde]     = useState('')
  const [filtroHasta,     setFiltroHasta]     = useState('')
  const [filtroStats,     setFiltroStats]     = useState(null)   // null = sin filtro activo
  const [loadingFiltro,   setLoadingFiltro]   = useState(false)
  const [importacionId,   setImportacionId]   = useState(null)

  const esAdmin = user?.rol === 'admin'

  // ── Fetch stats principal ─────────────────────────────────────────────────
  const fetchStats = async (params = {}) => {
    const res = await api.get('/operaciones/dashboard/stats/', { params })
    setStats(res.data)
    return res.data
  }

  // ── Fetch opciones de filtros (porciones + periodos disponibles) ──────────
  const fetchFiltrosOpciones = useCallback(async (impId) => {
    const params = impId ? { importacion_id: impId } : {}
    try {
      const res = await api.get('/operaciones/dashboard/filtros/', { params })
      setFiltrosOpciones({ porciones: res.data.porciones, periodos: res.data.periodos })
    } catch {
      // silencioso — si no hay datos simplemente no hay opciones
    }
  }, [])

  // ── Fetch stats filtradas ─────────────────────────────────────────────────
  const fetchFiltroStats = useCallback(async (porcion, desde, hasta, impId) => {
    if (!porcion && !desde && !hasta) {
      setFiltroStats(null)
      return
    }
    setLoadingFiltro(true)
    const params = {}
    if (impId)   params.importacion_id = impId
    if (porcion) params.porcion        = porcion
    if (desde)   params.fecha_desde    = desde
    if (hasta)   params.fecha_hasta    = hasta
    try {
      const res = await api.get('/operaciones/dashboard/filtros/', { params })
      setFiltroStats(res.data.stats)
    } catch {
      setFiltroStats(null)
    } finally {
      setLoadingFiltro(false)
    }
  }, [])

  // ── Efecto inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats().then(data => {
      if (!esAdmin && data?.importacion_id) {
        setImportacionId(data.importacion_id)
        fetchFiltrosOpciones(data.importacion_id)
      }
    }).finally(() => setLoading(false))
  }, [])

  // ── Handlers admin ────────────────────────────────────────────────────────
  const handleUsuarioChange = async (e) => {
    const id = e.target.value
    setUsuarioSel(id)
    setImportacionSel('')
    setLoadingSel(true)
    try { await fetchStats(id ? { usuario_id: id } : {}) }
    finally { setLoadingSel(false) }
  }

  const handleImportacionChange = async (e) => {
    const id = e.target.value
    setImportacionSel(id)
    setLoadingSel(true)
    try { await fetchStats(id ? { importacion_id: id } : { usuario_id: usuarioSel }) }
    finally { setLoadingSel(false) }
  }

  // ── Handlers filtros usuario ──────────────────────────────────────────────
  const handleFiltroPorcion = (val) => {
    setFiltroPorcion(val)
    fetchFiltroStats(val, filtroDesde, filtroHasta, importacionId)
  }

  const handleFiltroDesde = (val) => {
    setFiltroDesde(val)
    fetchFiltroStats(filtroPorcion, val, filtroHasta, importacionId)
  }

  const handleFiltroHasta = (val) => {
    setFiltroHasta(val)
    fetchFiltroStats(filtroPorcion, filtroDesde, val, importacionId)
  }

  const limpiarFiltros = () => {
    setFiltroPorcion('')
    setFiltroDesde('')
    setFiltroHasta('')
    setFiltroStats(null)
  }

  const hayFiltros = filtroPorcion || filtroDesde || filtroHasta

  // ── Datos para render ─────────────────────────────────────────────────────
  const activeStats = filtroStats || stats   // si hay filtro activo, usarlo

  const total      = activeStats?.total_clientes  || 0
  const recat      = activeStats?.recategorizados || 0
  const sinCambios = activeStats?.sin_cambios     || 0
  const noAptos    = activeStats?.no_aptos        || 0
  const anomalias  = stats?.anomalias             || 0   // anomalías siempre del total
  const globales   = stats?.globales              || {}

  const pieData = activeStats?.distribucion_categorias?.map(d => ({
    name: d.tarifa_nueva, value: d.cantidad,
  })) || []

  const barData = activeStats?.cambios_tarifarios
    ?.filter(d => d.tarifa_anterior !== d.tarifa_nueva)
    ?.map(d => ({ name: `${d.tarifa_anterior} → ${d.tarifa_nueva}`, value: d.cantidad_clientes })) || []

  const cuadro3Data     = activeStats?.cambios_tarifarios || []
  const cuadro3Filtrado = tabCuadro3 === 'todos'
    ? cuadro3Data
    : cuadro3Data.filter(d => d.tarifa_anterior !== d.tarifa_nueva)

  const noAptosObs    = stats?.no_aptos_observaciones || []
  const anomaliasTipo = stats?.anomalias_por_tipo     || []

  // Gráfica de consumo mensual (solo visible con filtro activo)
  const consumoPorPeriodo = filtroStats?.consumo_por_periodo?.map(d => ({
    periodo: d.periodo,
    consumo: parseFloat(d.consumo_total?.toFixed(1) || 0),
  })) || []

  // Importaciones del usuario seleccionado (admin)
  const importacionesUsuario = usuarioSel
    ? (stats?.usuarios_lista?.find(u => String(u.id) === String(usuarioSel))?.importaciones || [])
    : []

  // Opciones para los selects de fecha
  const opcionesPeriodo = filtrosOpciones.periodos.map(p => ({ value: p, label: p }))
  const opcionesPorcion = filtrosOpciones.porciones.map(p => ({ value: p, label: `Porción ${p}` }))

  // Periodos para "hasta" (solo los >= desde seleccionado)
  const opcionesHasta = filtroDesde
    ? opcionesPeriodo.filter(o => o.value >= filtroDesde)
    : opcionesPeriodo

  // Periodos para "desde" (solo los <= hasta seleccionado)
  const opcionesDesde = filtroHasta
    ? opcionesPeriodo.filter(o => o.value <= filtroHasta)
    : opcionesPeriodo

  return (
    <Layout title="Dashboard">
      <div className={styles.page}>

        {/* ── Bienvenida ── */}
        <div className={styles.welcome}>
          <div>
            <h2 className={styles.welcomeTitle}>Bienvenido, {user?.nombre} 👋</h2>
            <p className={styles.welcomeSub}>
              {esAdmin
                ? 'Vista global del sistema — estadísticas de todos los usuarios'
                : 'Resumen del proceso de recategorización volumétrica'
              }
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {esAdmin && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 10, padding: '6px 14px'
              }}>
                <span>👑</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309' }}>Vista Admin Global</span>
              </div>
            )}
            <div className={styles.period}>
              <span>Período actual</span>
              <strong>{new Date().toLocaleString('es-PE', { month: 'long', year: 'numeric' })}</strong>
            </div>
          </div>
        </div>

        {/* ── Stats globales + selectores — solo admin ── */}
        {esAdmin && !loading && (
          <>
            {/* 4 tarjetas globales oscuras */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: 'TOTAL IMPORTACIONES',  value: globales.total_importaciones ?? 0,                       icon: '📥', color: '#F59E0B' },
                { label: 'USUARIOS ACTIVOS',      value: stats.usuarios_activos ?? 0,                             icon: '👥', color: '#10B981' },
                { label: 'TOTAL REGISTROS',       value: (globales.total_registros ?? 0).toLocaleString(),        icon: '📊', color: '#2e75b6' },
                { label: 'TOTAL RECATEGORIZADOS', value: (globales.total_recategorizados ?? 0).toLocaleString(),  icon: '✅', color: '#10B981' },
              ].map((s, i) => (
                <div key={i} className={styles.statCard} style={{ background: 'linear-gradient(135deg,#0B1120,#1e3a5f)' }}>
                  <div className={styles.statTop}>
                    <div>
                      <p className={styles.statLabel} style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</p>
                      <p className={styles.statSub}   style={{ color: 'rgba(255,255,255,0.35)' }}>Sistema completo</p>
                    </div>
                    <div className={styles.statIcon} style={{ background: `${s.color}25` }}>
                      <span style={{ color: s.color }}>{s.icon}</span>
                    </div>
                  </div>
                  <p className={styles.statValue} style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Selectores usuario / importación */}
            <div style={{
              background: '#fff', border: '1px solid #F0F0F0',
              borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0B1120', margin: 0, fontFamily: 'Sora, sans-serif' }}>
                📋 Ver estadísticas detalladas
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase' }}>Usuario</p>
                  <select
                    value={usuarioSel}
                    onChange={handleUsuarioChange}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #E5E7EB', fontSize: 14,
                      fontFamily: 'DM Sans, sans-serif', outline: 'none', cursor: 'pointer', color: '#374151',
                    }}
                  >
                    <option value="">— Última importación del sistema —</option>
                    {(stats.usuarios_lista || []).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellido} · {u.total_importaciones} importación{u.total_importaciones !== 1 ? 'es' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {usuarioSel && importacionesUsuario.length > 1 && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase' }}>Importación</p>
                    <select
                      value={importacionSel}
                      onChange={handleImportacionChange}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '1px solid #E5E7EB', fontSize: 14,
                        fontFamily: 'DM Sans, sans-serif', outline: 'none', cursor: 'pointer', color: '#374151',
                      }}
                    >
                      <option value="">— Más reciente —</option>
                      {importacionesUsuario.map((imp, i) => (
                        <option key={imp.id} value={imp.id}>
                          #{importacionesUsuario.length - i} · {imp.fecha_str} · {imp.total_registros.toLocaleString()} registros
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {loadingSel && <span style={{ fontSize: 13, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Cargando...</span>}

                {stats.importador && (
                  <div style={{
                    background: '#F9FAFB', border: '1px solid #F0F0F0',
                    borderRadius: 10, padding: '8px 16px',
                    fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap', alignSelf: 'flex-end'
                  }}>
                    Viendo: <strong style={{ color: '#0B1120' }}>
                      {stats.importador}{stats.importacion_fecha ? ` · ${stats.importacion_fecha}` : ''}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Stats principales ── */}
        <div className={styles.statsGrid}>
          <StatCard label="TOTAL CLIENTES"  sub={hayFiltros ? '🔍 Filtrado' : 'Base activa'}
            value={loading ? '...' : total.toLocaleString()}      icon="👥" color="#2e75b6" />
          <StatCard label="RECATEGORIZADOS" sub={`${total > 0 ? ((recat/total)*100).toFixed(1) : 0}% del total`}
            value={loading ? '...' : recat.toLocaleString()}       icon="📊" color="#10B981" />
          <StatCard label="SIN CAMBIOS"     sub={`${total > 0 ? ((sinCambios/total)*100).toFixed(1) : 0}% del total`}
            value={loading ? '...' : sinCambios.toLocaleString()}  icon="➖" color="#6B7280" />
          <StatCard label="NO APTOS"        sub={hayFiltros ? 'En porción seleccionada' : 'No cumplen criterios'}
            value={loading ? '...' : noAptos.toLocaleString()}     icon="⚠️" color="#F59E0B" />
          <StatCard label="ANOMALÍAS"       sub="Detectadas en lecturas"
            value={loading ? '...' : anomalias.toLocaleString()}   icon="🔍" color="#EF4444" />
        </div>

        {/* ── Panel de filtros — solo usuario normal ── */}
        {!esAdmin && !loading && (
          <div style={{
            background: '#fff',
            border: `1px solid ${hayFiltros ? '#2e75b6' : '#F0F0F0'}`,
            borderRadius: 14, padding: '18px 24px',
            transition: 'border .25s',
          }}>
            {/* Header del panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔎</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0B1120', margin: 0, fontFamily: 'Sora, sans-serif' }}>
                  Análisis por Porción y Período
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
                    padding: '5px 12px', fontSize: 12, color: '#6B7280',
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  ✕ Limpiar filtros
                </button>
              )}
            </div>

            {/* Controles */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <FilterSelect
                label="Porción"
                value={filtroPorcion}
                onChange={handleFiltroPorcion}
                options={opcionesPorcion}
                placeholder="— Todas las porciones —"
              />
              <FilterSelect
                label="Desde (mes)"
                value={filtroDesde}
                onChange={handleFiltroDesde}
                options={opcionesDesde}
                placeholder="— Mes inicio —"
              />
              <FilterSelect
                label="Hasta (mes)"
                value={filtroHasta}
                onChange={handleFiltroHasta}
                options={opcionesHasta}
                placeholder="— Mes fin —"
              />

              {loadingFiltro && (
                <div style={{ alignSelf: 'flex-end', paddingBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Calculando...</span>
                </div>
              )}
            </div>

            {/* Resumen del filtro activo */}
            {hayFiltros && !loadingFiltro && filtroStats && (
              <div style={{
                marginTop: 14, padding: '10px 16px',
                background: '#F0F7FF', borderRadius: 10, border: '1px solid #BFDBFE',
                display: 'flex', gap: 24, flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Clientes',         value: filtroStats.total_clientes.toLocaleString(),   color: '#2e75b6' },
                  { label: 'Recategorizados',  value: filtroStats.recategorizados.toLocaleString(),  color: '#10B981' },
                  { label: 'Sin cambios',      value: filtroStats.sin_cambios.toLocaleString(),      color: '#6B7280' },
                  { label: 'No aptos',         value: filtroStats.no_aptos.toLocaleString(),         color: '#F59E0B' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{s.label}:</span>
                    <strong style={{ fontSize: 15, color: s.color }}>{s.value}</strong>
                  </div>
                ))}
                {filtroPorcion && (
                  <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 'auto' }}>
                    📍 Porción <strong style={{ color: '#1e3a5f' }}>{filtroPorcion}</strong>
                  </span>
                )}
                {(filtroDesde || filtroHasta) && (
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    📅 {filtroDesde || '...'} → {filtroHasta || '...'}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Gráfica de consumo mensual (solo con filtro activo) ── */}
        {!esAdmin && hayFiltros && !loadingFiltro && consumoPorPeriodo.length > 0 && (
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>📈 Evolución de Consumo Mensual</h3>
                <p className={styles.chartSub}>
                  Consumo m³ por período
                  {filtroPorcion ? ` — Porción ${filtroPorcion}` : ''}
                  {filtroDesde || filtroHasta ? ` — ${filtroDesde || '...'} a ${filtroHasta || '...'}` : ''}
                </p>
              </div>
              <span style={{
                background: '#EFF6FF', color: '#2e75b6', fontSize: 11,
                fontWeight: 700, padding: '3px 12px', borderRadius: 20, border: '1px solid #BFDBFE'
              }}>
                {consumoPorPeriodo.length} meses
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={consumoPorPeriodo} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
                <Tooltip formatter={v => [v.toLocaleString() + ' m³', 'Consumo']} />
                <Line
                  type="monotone" dataKey="consumo" stroke="#2e75b6"
                  strokeWidth={2.5} dot={{ r: 5, fill: '#2e75b6' }} activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Charts fila 1 ── */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Distribución de Cambios Tarifarios</h3>
                <p className={styles.chartSub}>Solo recategorizaciones entre tarifas distintas</p>
              </div>
            </div>
            {barData.length === 0 ? (
              <div className={styles.emptyChart}>Sin datos de cambios tarifarios aún</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0"/>
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130}/>
                  <Tooltip />
                  <Bar dataKey="value" radius={[0,6,6,0]}>
                    {barData.map((_, i) => <Cell key={i} fill={i%2===0?'#1e3a5f':'#9CA3AF'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Distribución por Tarifa Nueva</h3>
                <p className={styles.chartSub}>Por categoría de consumo</p>
              </div>
            </div>
            {pieData.length === 0 ? (
              <div className={styles.emptyChart}>Sin datos de distribución aún</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.legend}>
                  {pieData.map((item, i) => (
                    <div key={i} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: COLORS[i%COLORS.length] }} />
                      <span className={styles.legendName}>{item.name}</span>
                      <span className={styles.legendValue}>{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Cuadro 3 ── */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>📋 Resumen Tarifario</h3>
              <p className={styles.chartSub}>Movimientos entre categorías tarifarias</p>
            </div>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${tabCuadro3==='todos'   ? styles.tabActive:''}`} onClick={()=>setTabCuadro3('todos')}>Todos</button>
              <button className={`${styles.tab} ${tabCuadro3==='cambios' ? styles.tabActive:''}`} onClick={()=>setTabCuadro3('cambios')}>Solo cambios</button>
            </div>
          </div>
          {cuadro3Filtrado.length === 0 ? (
            <div className={styles.emptyChart}>Sin datos aún</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tarifa Anterior</th><th>Tarifa Nueva</th>
                    <th>Cantidad</th><th>Porcentaje</th><th>Movimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {cuadro3Filtrado.map((row, i) => (
                    <tr key={i}>
                      <td><span className={styles.badge} style={{ background: TARIFA_COLORS[row.tarifa_anterior]+'20', color: TARIFA_COLORS[row.tarifa_anterior] }}>{row.tarifa_anterior}</span></td>
                      <td><span className={styles.badge} style={{ background: TARIFA_COLORS[row.tarifa_nueva]+'20',      color: TARIFA_COLORS[row.tarifa_nueva]      }}>{row.tarifa_nueva}</span></td>
                      <td className={styles.tdNum}>{(row.cantidad_clientes ?? row.cantidad ?? 0).toLocaleString()}</td>
                      <td className={styles.tdNum}>{parseFloat(row.porcentaje ?? 0).toFixed(2)}%</td>
                      <td>
                        {row.tarifa_anterior === row.tarifa_nueva
                          ? <span className={styles.badgeGray}>Sin cambio</span>
                          : <span className={styles.badgeGreen}>Recategorizado</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Cuadro 4 y 5 ── */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>⚠️ Clientes No Aptos</h3>
                <p className={styles.chartSub}>Principales razones de exclusión</p>
              </div>
              <span className={styles.badgeCount}>{noAptos.toLocaleString()}</span>
            </div>
            {noAptosObs.length === 0 ? (
              <div className={styles.emptyChart}>Sin datos aún</div>
            ) : (
              <div className={styles.obsList}>
                {noAptosObs.map((item, i) => {
                  const pct = noAptos > 0 ? (item.cantidad / noAptos * 100).toFixed(1) : 0
                  return (
                    <div key={i} className={styles.obsItem}>
                      <div className={styles.obsTop}>
                        <span className={styles.obsLabel}>{item.observacion}</span>
                        <span className={styles.obsNum}>{item.cantidad.toLocaleString()}</span>
                      </div>
                      <div className={styles.obsBar}>
                        <div className={styles.obsBarFill} style={{ width:`${pct}%`, background:'#F59E0B' }} />
                      </div>
                      <span className={styles.obsPct}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>🔍 Anomalías Detectadas</h3>
                <p className={styles.chartSub}>Tipos de anomalías detectadas</p>
              </div>
              <span className={styles.badgeCount}>{anomalias.toLocaleString()}</span>
            </div>
            {anomaliasTipo.length === 0 ? (
              <div className={styles.emptyChart}>Sin datos aún</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={anomaliasTipo.map(d=>({name:d.tipo_anomalia,value:d.cantidad}))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0"/>
                    <XAxis type="number" tick={{ fontSize:11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} width={160}/>
                    <Tooltip />
                    <Bar dataKey="value" fill="#EF4444" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className={styles.legend} style={{ marginTop:12 }}>
                  {anomaliasTipo.map((item,i) => (
                    <div key={i} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background:'#EF4444' }} />
                      <span className={styles.legendName}>{item.tipo_anomalia}</span>
                      <span className={styles.legendValue}>{item.cantidad.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </Layout>
  )
}

export default Dashboard
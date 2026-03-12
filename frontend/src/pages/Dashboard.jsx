import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import styles from './Dashboard.module.css'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

const API_URL = 'http://localhost:8000/api'
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

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [loadingSel, setLoadingSel] = useState(false)
  const [tabCuadro3, setTabCuadro3] = useState('todos')
  const [usuarioSel, setUsuarioSel] = useState('')
  const [importacionSel, setImportacionSel] = useState('')

  const esAdmin = user?.rol === 'admin'

  const fetchStats = async (params = {}) => {
    const token = localStorage.getItem('access_token')
    const res = await axios.get(`${API_URL}/operaciones/dashboard/stats/`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    })
    setStats(res.data)
  }

  useEffect(() => {
    fetchStats().finally(() => setLoading(false))
  }, [])

  const handleUsuarioChange = async (e) => {
    const id = e.target.value
    setUsuarioSel(id)
    setImportacionSel('')
    setLoadingSel(true)
    try {
      await fetchStats(id ? { usuario_id: id } : {})
    } finally {
      setLoadingSel(false)
    }
  }

  const handleImportacionChange = async (e) => {
    const id = e.target.value
    setImportacionSel(id)
    setLoadingSel(true)
    try {
      await fetchStats(id ? { importacion_id: id } : { usuario_id: usuarioSel })
    } finally {
      setLoadingSel(false)
    }
  }

  const total      = stats?.total_clientes  || 0
  const recat      = stats?.recategorizados || 0
  const sinCambios = stats?.sin_cambios     || 0
  const noAptos    = stats?.no_aptos        || 0
  const anomalias  = stats?.anomalias       || 0
  const globales   = stats?.globales        || {}

  const pieData = stats?.distribucion_categorias?.map(d => ({
    name: d.tarifa_nueva, value: d.cantidad,
  })) || []

  const barData = stats?.cambios_tarifarios
    ?.filter(d => d.tarifa_anterior !== d.tarifa_nueva)
    ?.map(d => ({ name: `${d.tarifa_anterior} → ${d.tarifa_nueva}`, value: d.cantidad_clientes })) || []

  const cuadro3Data     = stats?.cambios_tarifarios || []
  const cuadro3Filtrado = tabCuadro3 === 'todos'
    ? cuadro3Data
    : cuadro3Data.filter(d => d.tarifa_anterior !== d.tarifa_nueva)

  const noAptosObs    = stats?.no_aptos_observaciones || []
  const anomaliasTipo = stats?.anomalias_por_tipo     || []

  // Importaciones del usuario seleccionado
  const importacionesUsuario = usuarioSel
    ? (stats?.usuarios_lista?.find(u => String(u.id) === String(usuarioSel))?.importaciones || [])
    : []

  return (
    <Layout title="Dashboard">
      <div className={styles.page}>

        {/* Bienvenida */}
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

        {/* Stats globales + selectores — solo admin */}
        {esAdmin && !loading && (
          <>
            {/* 4 tarjetas globales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: 'TOTAL IMPORTACIONES',  value: globales.total_importaciones ?? 0,                              icon: '📥', color: '#F59E0B' },
                { label: 'USUARIOS ACTIVOS',      value: stats.usuarios_activos ?? 0,                                   icon: '👥', color: '#10B981' },
                { label: 'TOTAL REGISTROS',       value: (globales.total_registros ?? 0).toLocaleString(),              icon: '📊', color: '#2e75b6' },
                { label: 'TOTAL RECATEGORIZADOS', value: (globales.total_recategorizados ?? 0).toLocaleString(),        icon: '✅', color: '#10B981' },
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

            {/* Selectores */}
            <div style={{
              background: '#fff', border: '1px solid #F0F0F0',
              borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0B1120', margin: 0, fontFamily: 'Sora, sans-serif' }}>
                📋 Ver estadísticas detalladas
              </p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* Selector 1 — Usuario */}
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

                {/* Selector 2 — Importación (solo si hay usuario seleccionado con más de 1 importación) */}
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

        {/* Stats principales */}
        <div className={styles.statsGrid}>
          <StatCard label="TOTAL CLIENTES"  sub="Base activa"
            value={loading ? '...' : total.toLocaleString()}      icon="👥" color="#2e75b6" />
          <StatCard label="RECATEGORIZADOS" sub={`${total > 0 ? ((recat/total)*100).toFixed(1) : 0}% del total`}
            value={loading ? '...' : recat.toLocaleString()}       icon="📊" color="#10B981" />
          <StatCard label="SIN CAMBIOS"     sub={`${total > 0 ? ((sinCambios/total)*100).toFixed(1) : 0}% del total`}
            value={loading ? '...' : sinCambios.toLocaleString()}  icon="➖" color="#6B7280" />
          <StatCard label="NO APTOS"        sub="No cumplen criterios"
            value={loading ? '...' : noAptos.toLocaleString()}     icon="⚠️" color="#F59E0B" />
          <StatCard label="ANOMALÍAS"       sub="Detectadas en lecturas"
            value={loading ? '...' : anomalias.toLocaleString()}   icon="🔍" color="#EF4444" />
        </div>

        {/* Charts fila 1 */}
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

        {/* Cuadro 3 */}
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
                      <td className={styles.tdNum}>{row.cantidad_clientes.toLocaleString()}</td>
                      <td className={styles.tdNum}>{parseFloat(row.porcentaje).toFixed(2)}%</td>
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

        {/* Cuadro 4 y 5 */}
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
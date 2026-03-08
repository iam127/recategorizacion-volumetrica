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
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tabCuadro3, setTabCuadro3] = useState('todos')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const res = await axios.get(`${API_URL}/operaciones/dashboard/stats/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStats(res.data)
      } catch {
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const total      = stats?.total_clientes  || 0
  const recat      = stats?.recategorizados || 0
  const sinCambios = stats?.sin_cambios     || 0
  const noAptos    = stats?.no_aptos        || 0
  const anomalias  = stats?.anomalias       || 0

  // PieChart
  const pieData = stats?.distribucion_categorias?.map(d => ({
    name:  d.tarifa_nueva,
    value: d.cantidad,
  })) || []

  // BarChart cambios
  const barData = stats?.cambios_tarifarios
    ?.filter(d => d.tarifa_anterior !== d.tarifa_nueva)
    ?.map(d => ({
      name:  `${d.tarifa_anterior} → ${d.tarifa_nueva}`,
      value: d.cantidad_clientes,
    })) || []

  // Cuadro 3 — resumen tarifario completo
  const cuadro3Data = stats?.cambios_tarifarios || []
  const cuadro3Filtrado = tabCuadro3 === 'todos'
    ? cuadro3Data
    : cuadro3Data.filter(d => d.tarifa_anterior !== d.tarifa_nueva)

  // Cuadro 4 — no aptos observaciones
  const noAptosObs = stats?.no_aptos_observaciones || []

  // Cuadro 5 — anomalías por tipo
  const anomaliasTipo = stats?.anomalias_por_tipo || []

  return (
    <Layout title="Dashboard">
      <div className={styles.page}>

        {/* Bienvenida */}
        <div className={styles.welcome}>
          <div>
            <h2 className={styles.welcomeTitle}>
              Bienvenido, {user?.nombre} 👋
            </h2>
            <p className={styles.welcomeSub}>
              Resumen del proceso de recategorización volumétrica
            </p>
          </div>
          <div className={styles.period}>
            <span>Periodo actual</span>
            <strong>
              {new Date().toLocaleString('es-PE', { month: 'long', year: 'numeric' })}
            </strong>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard
            label="TOTAL CLIENTES"
            sub="Base activa"
            value={loading ? '...' : total.toLocaleString()}
            icon="👥" color="#2e75b6"
          />
          <StatCard
            label="RECATEGORIZADOS"
            sub={`${total > 0 ? ((recat / total) * 100).toFixed(1) : 0}% del total`}
            value={loading ? '...' : recat.toLocaleString()}
            icon="📊" color="#10B981"
          />
          <StatCard
            label="SIN CAMBIOS"
            sub={`${total > 0 ? ((sinCambios / total) * 100).toFixed(1) : 0}% del total`}
            value={loading ? '...' : sinCambios.toLocaleString()}
            icon="➖" color="#6B7280"
          />
          <StatCard
            label="NO APTOS"
            sub="No cumplen criterios"
            value={loading ? '...' : noAptos.toLocaleString()}
            icon="⚠️" color="#F59E0B"
          />
          <StatCard
            label="ANOMALÍAS"
            sub="Detectadas en lecturas"
            value={loading ? '...' : anomalias.toLocaleString()}
            icon="🔍" color="#EF4444"
          />
        </div>

        {/* Charts fila 1 */}
        <div className={styles.chartsGrid}>

          {/* BarChart cambios */}
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
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? '#1e3a5f' : '#9CA3AF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* PieChart distribución */}
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
                    <Pie data={pieData} cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80} dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.legend}>
                  {pieData.map((item, i) => (
                    <div key={i} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                      <span className={styles.legendName}>{item.name}</span>
                      <span className={styles.legendValue}>{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cuadro 3 — Resumen Tarifario completo */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>📋 Resumen Tarifario</h3>
              <p className={styles.chartSub}>Movimientos entre categorías tarifarias</p>
            </div>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${tabCuadro3 === 'todos' ? styles.tabActive : ''}`}
                onClick={() => setTabCuadro3('todos')}
              >Todos</button>
              <button
                className={`${styles.tab} ${tabCuadro3 === 'cambios' ? styles.tabActive : ''}`}
                onClick={() => setTabCuadro3('cambios')}
              >Solo cambios</button>
            </div>
          </div>
          {cuadro3Filtrado.length === 0 ? (
            <div className={styles.emptyChart}>Sin datos aún</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tarifa Anterior</th>
                    <th>Tarifa Nueva</th>
                    <th>Cantidad</th>
                    <th>Porcentaje</th>
                    <th>Movimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {cuadro3Filtrado.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <span className={styles.badge} style={{ background: TARIFA_COLORS[row.tarifa_anterior] + '20', color: TARIFA_COLORS[row.tarifa_anterior] }}>
                          {row.tarifa_anterior}
                        </span>
                      </td>
                      <td>
                        <span className={styles.badge} style={{ background: TARIFA_COLORS[row.tarifa_nueva] + '20', color: TARIFA_COLORS[row.tarifa_nueva] }}>
                          {row.tarifa_nueva}
                        </span>
                      </td>
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

        {/* Cuadro 4 y 5 — fila */}
        <div className={styles.chartsGrid}>

          {/* Cuadro 4 — No aptos */}
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
                        <div
                          className={styles.obsBarFill}
                          style={{ width: `${pct}%`, background: '#F59E0B' }}
                        />
                      </div>
                      <span className={styles.obsPct}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cuadro 5 — Anomalías */}
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
                  <BarChart data={anomaliasTipo.map(d => ({ name: d.tipo_anomalia, value: d.cantidad }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0"/>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={160}/>
                    <Tooltip />
                    <Bar dataKey="value" fill="#EF4444" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className={styles.legend} style={{ marginTop: 12 }}>
                  {anomaliasTipo.map((item, i) => (
                    <div key={i} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#EF4444' }} />
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
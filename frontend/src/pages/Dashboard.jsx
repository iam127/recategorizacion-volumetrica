import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import styles from './Dashboard.module.css'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts'

const API_URL = 'http://localhost:8000/api'

const COLORS = ['#1e3a5f', '#2e75b6', '#9CA3AF']

function StatCard({ label, sub, value, icon, trend, trendLabel, color }) {
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
      {trend !== undefined && (
        <div className={`${styles.statTrend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}</span>
          <span className={styles.trendLabel}>{trendLabel}</span>
        </div>
      )}
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total_clientes: 0,
    recategorizados: 0,
    sin_cambios: 0,
    pendientes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const res = await axios.get(`${API_URL}/dashboard/stats/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStats(res.data)
      } catch (err) {
        // Backend aún no tiene el endpoint — mostramos 0
        setStats({
          total_clientes: 0,
          recategorizados: 0,
          sin_cambios: 0,
          pendientes: 0,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const pieData = [
    { name: 'Categoría A1', value: stats.a1 || 0 },
    { name: 'Categoría A2', value: stats.a2 || 0 },
    { name: 'Categoría B', value: stats.b || 0 },
  ]

  const barData = [
    { name: 'A2 → A1', value: stats.a2_a1 || 0 },
    { name: 'B → A2', value: stats.b_a2 || 0 },
    { name: 'A1 → A2', value: stats.a1_a2 || 0 },
    { name: 'A2 → B', value: stats.a2_b || 0 },
  ]

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
            value={loading ? '...' : stats.total_clientes.toLocaleString()}
            icon="👥"
            color="#2e75b6"
            trend={0}
            trendLabel="vs mes anterior"
          />
          <StatCard
            label="RECATEGORIZADOS"
            sub={`${stats.total_clientes > 0 ? ((stats.recategorizados / stats.total_clientes) * 100).toFixed(1) : 0}% del total`}
            value={loading ? '...' : stats.recategorizados.toLocaleString()}
            icon="📊"
            color="#10B981"
            trend={0}
            trendLabel="nuevos este mes"
          />
          <StatCard
            label="SIN CAMBIOS"
            sub={`${stats.total_clientes > 0 ? ((stats.sin_cambios / stats.total_clientes) * 100).toFixed(1) : 0}% del total`}
            value={loading ? '...' : stats.sin_cambios.toLocaleString()}
            icon="➖"
            color="#6B7280"
            trend={0}
            trendLabel="mantienen categoría"
          />
          <StatCard
            label="PENDIENTES"
            sub="Requieren revisión"
            value={loading ? '...' : stats.pendientes.toLocaleString()}
            icon="⚠️"
            color="#F59E0B"
            trend={0}
            trendLabel="vs semana anterior"
          />
        </div>

        {/* Charts */}
        <div className={styles.chartsGrid}>
          {/* Bar chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Distribución de Cambios por Tipo</h3>
                <p className={styles.chartSub}>
                  Análisis de {stats.recategorizados} recategorizaciones
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0"/>
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60}/>
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={i < 2 ? '#1e3a5f' : '#9CA3AF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Distribución Actual</h3>
                <p className={styles.chartSub}>Por categoría de consumo</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {pieData.map((item, i) => (
                <div key={i} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: COLORS[i] }} />
                  <span className={styles.legendName}>{item.name}</span>
                  <span className={styles.legendValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}

export default Dashboard
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import styles from './Reportes.module.css'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'

const API_URL = 'http://localhost:8000/api'
const COLORS  = ['#1e3a5f', '#2e75b6', '#9CA3AF']

function Reportes() {
  const { user } = useAuth()
  const [historial, setHistorial]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [descargando, setDescargando] = useState(null)
  const [comparativa, setComparativa] = useState(null)
  const [loadingComp, setLoadingComp] = useState(false)
  const [selId1, setSelId1]           = useState('')
  const [selId2, setSelId2]           = useState('')

  const esAdmin = user?.rol === 'admin'
  const token   = () => localStorage.getItem('access_token')

  useEffect(() => {
    axios.get(`${API_URL}/operaciones/historial/`, {
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => setHistorial(r.data)).finally(() => setLoading(false))
  }, [])

  const descargarExcel = async (importacionId, fecha) => {
    setDescargando(importacionId)
    try {
      const res = await axios.get(`${API_URL}/operaciones/exportar-excel/`, {
        headers:      { Authorization: `Bearer ${token()}` },
        params:       { importacion_id: importacionId },
        responseType: 'blob',
      })
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `recategorizacion_${fecha.replace(/[/:]/g, '-')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      alert('Error al descargar el archivo')
    } finally {
      setDescargando(null)
    }
  }

  const verComparativa = async () => {
    if (!selId1 || !selId2 || selId1 === selId2) return
    setLoadingComp(true)
    try {
      const res = await axios.get(`${API_URL}/operaciones/comparativa/`, {
        headers: { Authorization: `Bearer ${token()}` },
        params:  { id1: selId1, id2: selId2 },
      })
      setComparativa(res.data)
    } catch {
      alert('Error al cargar comparativa')
    } finally {
      setLoadingComp(false)
    }
  }

  const barComparativa = comparativa ? [
    { name: 'Total',           p1: comparativa.periodo1.total_registros, p2: comparativa.periodo2.total_registros },
    { name: 'Recategorizados', p1: comparativa.periodo1.recategorizados, p2: comparativa.periodo2.recategorizados },
    { name: 'Sin cambios',     p1: comparativa.periodo1.sin_cambios,     p2: comparativa.periodo2.sin_cambios     },
    { name: 'No aptos',        p1: comparativa.periodo1.no_aptos,        p2: comparativa.periodo2.no_aptos        },
    { name: 'Anomalías',       p1: comparativa.periodo1.anomalias,       p2: comparativa.periodo2.anomalias       },
  ] : []

  return (
    <Layout title="Reportes">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>📊</div>
          <div>
            <h2 className={styles.headerTitle}>Reportes y Exportaciones</h2>
            <p className={styles.headerDesc}>
              {esAdmin
                ? 'Vista global — historial de todas las importaciones del sistema'
                : 'Historial de importaciones, exportación de datos y comparativa entre períodos'
              }
            </p>
          </div>
          {esAdmin && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 10, padding: '6px 14px', flexShrink: 0
            }}>
              <span>👑</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309' }}>Vista Admin</span>
            </div>
          )}
        </div>

        {/* Historial */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>🕒 Historial de Importaciones</h3>
              <p className={styles.cardSub}>
                {esAdmin ? 'Todas las importaciones del sistema' : 'Todas tus importaciones realizadas'}
              </p>
            </div>
            <span className={styles.badge}>{historial.length} importaciones</span>
          </div>

          {loading ? (
            <div className={styles.empty}>Cargando...</div>
          ) : historial.length === 0 ? (
            <div className={styles.empty}>No hay importaciones aún</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    {esAdmin && <th>Usuario</th>}
                    <th>Total</th>
                    <th>Recategorizados</th>
                    <th>Sin Cambios</th>
                    <th>No Aptos</th>
                    <th>Anomalías</th>
                    <th>Exportar</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((imp, i) => (
                    <tr key={imp.id}>
                      <td className={styles.tdIdx}>{historial.length - i}</td>
                      <td className={styles.tdFecha}>{imp.fecha}</td>
                      {esAdmin && (
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1120' }}>{imp.usuario}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{imp.email}</div>
                        </td>
                      )}
                      <td className={styles.tdNum}>{imp.total_registros.toLocaleString()}</td>
                      <td><span className={styles.badgeGreen}>{imp.recategorizados.toLocaleString()}</span></td>
                      <td className={styles.tdNum}>{imp.sin_cambios.toLocaleString()}</td>
                      <td><span className={styles.badgeAmbar}>{imp.no_aptos.toLocaleString()}</span></td>
                      <td><span className={styles.badgeRed}>{imp.anomalias.toLocaleString()}</span></td>
                      <td>
                        <button
                          className={styles.btnExcel}
                          onClick={() => descargarExcel(imp.id, imp.fecha)}
                          disabled={descargando === imp.id}
                        >
                          {descargando === imp.id ? '⏳' : '⬇️ Excel'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Comparativa */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>📈 Comparativa entre Períodos</h3>
              <p className={styles.cardSub}>Selecciona dos importaciones para comparar</p>
            </div>
          </div>

          <div className={styles.comparativaSelects}>
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Período 1</label>
              <select className={styles.select} value={selId1}
                onChange={e => { setSelId1(e.target.value); setComparativa(null) }}>
                <option value="">Seleccionar importación...</option>
                {historial.map((imp, i) => (
                  <option key={imp.id} value={imp.id}>
                    #{historial.length - i} — {imp.fecha}{esAdmin ? ` (${imp.usuario})` : ''} ({imp.total_registros.toLocaleString()} registros)
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.vsDivider}>VS</div>

            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Período 2</label>
              <select className={styles.select} value={selId2}
                onChange={e => { setSelId2(e.target.value); setComparativa(null) }}>
                <option value="">Seleccionar importación...</option>
                {historial.map((imp, i) => (
                  <option key={imp.id} value={imp.id}>
                    #{historial.length - i} — {imp.fecha}{esAdmin ? ` (${imp.usuario})` : ''} ({imp.total_registros.toLocaleString()} registros)
                  </option>
                ))}
              </select>
            </div>

            <button className={styles.btnComparar} onClick={verComparativa}
              disabled={!selId1 || !selId2 || selId1 === selId2 || loadingComp}>
              {loadingComp ? <><span className={styles.spinner} /> Cargando...</> : '📊 Comparar'}
            </button>
          </div>

          {selId1 && selId2 && selId1 === selId2 && (
            <p className={styles.errorMsg}>⚠️ Selecciona dos importaciones diferentes</p>
          )}

          {comparativa && (
            <div className={styles.comparativaResultado}>
              <div className={styles.kpiGrid}>
                {[
                  { label: 'Total Registros', k: 'total_registros' },
                  { label: 'Recategorizados', k: 'recategorizados' },
                  { label: 'Sin Cambios',     k: 'sin_cambios'     },
                  { label: 'No Aptos',        k: 'no_aptos'        },
                  { label: 'Anomalías',       k: 'anomalias'       },
                ].map(({ label, k }) => {
                  const v1   = comparativa.periodo1[k]
                  const v2   = comparativa.periodo2[k]
                  const diff = v2 - v1
                  const pct  = v1 > 0 ? ((diff / v1) * 100).toFixed(1) : 0
                  return (
                    <div key={k} className={styles.kpiCard}>
                      <p className={styles.kpiLabel}>{label}</p>
                      <div className={styles.kpiValues}>
                        <div className={styles.kpiVal}>
                          <span className={styles.kpiNum}>{v1.toLocaleString()}</span>
                          <span className={styles.kpiPeriod}>{comparativa.periodo1.fecha}</span>
                        </div>
                        <div className={`${styles.kpiDiff} ${diff > 0 ? styles.diffUp : diff < 0 ? styles.diffDown : styles.diffNeutral}`}>
                          {diff > 0 ? '▲' : diff < 0 ? '▼' : '—'} {Math.abs(pct)}%
                        </div>
                        <div className={styles.kpiVal}>
                          <span className={styles.kpiNum}>{v2.toLocaleString()}</span>
                          <span className={styles.kpiPeriod}>{comparativa.periodo2.fecha}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className={styles.chartWrap}>
                <h4 className={styles.chartTitle}>Comparación visual</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barComparativa} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="p1" name={comparativa.periodo1.fecha} fill="#1e3a5f" radius={[4,4,0,0]} />
                    <Bar dataKey="p2" name={comparativa.periodo2.fecha} fill="#F59E0B" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.distGrid}>
                {[comparativa.periodo1, comparativa.periodo2].map((p, pi) => (
                  <div key={pi} className={styles.distCard}>
                    <h4 className={styles.distTitle}>Distribución tarifaria — {p.fecha}</h4>
                    <div className={styles.distList}>
                      {p.distribucion.map((d, i) => (
                        <div key={i} className={styles.distItem}>
                          <span className={styles.distDot} style={{ background: COLORS[i % COLORS.length] }} />
                          <span className={styles.distLabel}>{d.tarifa_nueva}</span>
                          <span className={styles.distVal}>{d.cantidad.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default Reportes
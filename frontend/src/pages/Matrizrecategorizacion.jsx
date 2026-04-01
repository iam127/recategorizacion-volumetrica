import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import api from '../services/axiosInstance'
import styles from './MatrizRecategorizacion.module.css'

const TARIFA_COLORS = {
  'REG-A1-CO': '#1e3a5f',
  'REG-A2-CO': '#2e75b6',
  'REG-B-CO' : '#9CA3AF',
}

const COLS = [
  { key: 'instalacion',         label: 'Instalación'     },
  { key: 'cuenta_contrato',     label: 'Cta. Contrato'   },
  { key: 'porcion',             label: 'Porción'         },
  { key: 'tipo_tarifa',         label: 'Tarifa Tipo'     },
  { key: 'cf_mes_historico',    label: 'CF Hist.'        },
  { key: 'fl_mes_historico',    label: 'FL Hist.'        },
  { key: 'cl_mes_historico',    label: 'CL Hist.'        },
  { key: 'cf_mes_1',            label: 'CF M1'           },
  { key: 'fl_mes_1',            label: 'FL M1'           },
  { key: 'dc_mes_1',            label: 'DC M1'           },
  { key: 'cl_mes_1',            label: 'CL M1'           },
  { key: 'tarifa_mes_1',        label: 'Tarifa M1'       },
  { key: 'cf_mes_2',            label: 'CF M2'           },
  { key: 'fl_mes_2',            label: 'FL M2'           },
  { key: 'dc_mes_2',            label: 'DC M2'           },
  { key: 'cl_mes_2',            label: 'CL M2'           },
  { key: 'tarifa_mes_2',        label: 'Tarifa M2'       },
  { key: 'cf_mes_3',            label: 'CF M3'           },
  { key: 'fl_mes_3',            label: 'FL M3'           },
  { key: 'dc_mes_3',            label: 'DC M3'           },
  { key: 'cl_mes_3',            label: 'CL M3'           },
  { key: 'tarifa_mes_3',        label: 'Tarifa M3'       },
  { key: 'cf_mes_4',            label: 'CF M4'           },
  { key: 'fl_mes_4',            label: 'FL M4'           },
  { key: 'dc_mes_4',            label: 'DC M4'           },
  { key: 'cl_mes_4',            label: 'CL M4'           },
  { key: 'tarifa_mes_4',        label: 'Tarifa M4'       },
  { key: 'cf_mes_5',            label: 'CF M5'           },
  { key: 'fl_mes_5',            label: 'FL M5'           },
  { key: 'dc_mes_5',            label: 'DC M5'           },
  { key: 'cl_mes_5',            label: 'CL M5'           },
  { key: 'tarifa_mes_5',        label: 'Tarifa M5'       },
  { key: 'cf_mes_6',            label: 'CF M6'           },
  { key: 'fl_mes_6',            label: 'FL M6'           },
  { key: 'dc_mes_6',            label: 'DC M6'           },
  { key: 'cl_mes_6',            label: 'CL M6'           },
  { key: 'lectura_anterior',    label: 'Lec. Ant.'       },
  { key: 'lectura_actual',      label: 'Lec. Act.'       },
  { key: 'factor_correccion',   label: 'FC'              },
  { key: 'total_consumo',       label: 'Total CF'        },
  { key: 'total_dias',          label: 'Total Días'      },
  { key: 'promedio_diario',     label: 'Prom. Diario'    },
  { key: 'promedio_mensual',    label: 'Prom. Mensual'   },
  { key: 'promedio_redondeado', label: 'Prom. Red.'      },
  { key: 'tarifa_actual',       label: 'Tarifa Actual'   },
  { key: 'tarifa_nueva',        label: 'Tarifa Nueva'    },
  { key: 'recategorizar',       label: '¿Recategorizar?' },
  { key: 'rango_consumo',       label: 'Rango'           },
]

const TARIFA_COLS = ['tarifa_actual', 'tarifa_nueva', 'tipo_tarifa', 'tarifa_mes_1', 'tarifa_mes_2', 'tarifa_mes_3', 'tarifa_mes_4', 'tarifa_mes_5']

function Paginacion({ page, total, size, onChange }) {
  const totalPages = Math.ceil(total / size)
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
        {((page - 1) * size) + 1}–{Math.min(page * size, total)} de {total.toLocaleString()}
      </span>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#D1D5DB' : '#374151', fontSize: 13 }}>‹</button>
      <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#D1D5DB' : '#374151', fontSize: 13 }}>›</button>
    </div>
  )
}

function MatrizRecategorizacion() {
  const { user } = useAuth()
  const esAdmin = user?.rol === 'admin'

  const [data,          setData]          = useState([])
  const [total,         setTotal]         = useState(0)
  const [page,          setPage]          = useState(1)
  const [search,        setSearch]        = useState('')
  const [filtroRec,     setFiltroRec]     = useState('')
  const [loading,       setLoading]       = useState(true)
  const [importacionId, setImportacionId] = useState(() => localStorage.getItem('importacion_seleccionada') || '')
  const [importaciones, setImportaciones] = useState([])

  const PAGE_SIZE = 50

  const fetchData = useCallback(async (p = 1, s = '', rec = '', impId = '') => {
    setLoading(true)
    try {
      const params = { page: p, page_size: PAGE_SIZE }
      if (s)     params.search         = s
      if (rec)   params.recategorizar  = rec
      if (impId) params.importacion_id = impId
      const res = await api.get('/operaciones/matriz/', { params })
      setData(res.data.results || [])
      setTotal(res.data.count  || 0)
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const impId = localStorage.getItem('importacion_seleccionada') || ''

    Promise.all([
      api.get('/operaciones/historial/'),
      api.get('/operaciones/matriz/', {
        params: {
          page: 1,
          page_size: PAGE_SIZE,
          ...(impId ? { importacion_id: impId } : {})
        }
      })
    ]).then(([historialRes, dataRes]) => {
      // historial devuelve array de importaciones
      const lista = (historialRes.data || []).map((imp, i, arr) => ({
        id             : imp.id,
        fecha          : imp.fecha,
        total_registros: imp.total_registros,
        indice         : arr.length - i,
      }))
      setImportaciones(lista)
      // Si no hay impId guardado, usar la primera (más reciente)
      if (!impId && lista.length > 0) {
        setImportacionId(String(lista[0].id))
      }
      setData(dataRes.data.results || [])
      setTotal(dataRes.data.count  || 0)
    }).catch(() => {
      setData([])
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const handleSearch = (val) => {
    setSearch(val); setPage(1)
    fetchData(1, val, filtroRec, importacionId)
  }

  const handleFiltroRec = (val) => {
    setFiltroRec(val); setPage(1)
    fetchData(1, search, val, importacionId)
  }

  const handlePage = (p) => {
    setPage(p)
    fetchData(p, search, filtroRec, importacionId)
  }

  const handleImportacion = (id) => {
    setImportacionId(id)
    localStorage.setItem('importacion_seleccionada', id)
    setPage(1); setSearch(''); setFiltroRec('')
    fetchData(1, '', '', id)
  }

  const fmtNum = (v) => v != null ? Number(v).toLocaleString('es-PE', { maximumFractionDigits: 2 }) : '—'

  return (
    <Layout title="Matriz de Recategorización">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.welcome}>
          <div>
            <h2 className={styles.welcomeTitle}>📊 Matriz de Recategorización</h2>
            <p className={styles.welcomeSub}>
              Detalle completo por instalación con consumo mensual por período evaluado
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {esAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '6px 14px' }}>
                <span>👑</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309' }}>Vista Admin</span>
              </div>
            )}
            <span style={{ background: '#EFF6FF', color: '#2e75b6', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20, border: '1px solid #BFDBFE' }}>
              {total.toLocaleString()} instalaciones
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ background: '#fff', border: '1px solid #F0F0F0', borderRadius: 14, padding: '18px 24px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {importaciones.length > 0 && (
            <div style={{ flex: 2, minWidth: 220 }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase' }}>Importación</p>
              <select
                value={importacionId}
                onChange={e => handleImportacion(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${importacionId ? '#2e75b6' : '#E5E7EB'}`, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', cursor: 'pointer', color: '#374151', background: importacionId ? '#EFF6FF' : '#fff' }}
              >
                <option value="">— Más reciente —</option>
                {importaciones.map(imp => (
                  <option key={imp.id} value={imp.id}>
                    #{imp.indice} · {imp.fecha} · {imp.total_registros.toLocaleString()} registros
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ flex: 2, minWidth: 200 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase' }}>Buscar</p>
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Instalación o cuenta contrato..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 160 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase' }}>¿Recategorizar?</p>
            <select
              value={filtroRec}
              onChange={e => handleFiltroRec(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${filtroRec ? '#2e75b6' : '#E5E7EB'}`, fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', cursor: 'pointer', color: '#374151', background: filtroRec ? '#EFF6FF' : '#fff' }}
            >
              <option value="">— Todos —</option>
              <option value="Sí">Sí — Recategorizar</option>
              <option value="No">No — Sin cambio</option>
            </select>
          </div>

          {(search || filtroRec) && (
            <button
              onClick={() => { setSearch(''); setFiltroRec(''); setPage(1); fetchData(1, '', '', importacionId) }}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontFamily: 'DM Sans, sans-serif' }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className={styles.chartCard}>
          {loading ? (
            <div className={styles.emptyChart}>Cargando matriz...</div>
          ) : data.length === 0 ? (
            <div className={styles.emptyChart}>
              Sin datos. Realiza una nueva importación para ver la Matriz de Recategorización.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table} style={{ minWidth: 2800, fontSize: 12 }}>
                  <thead>
                    <tr>
                      {COLS.map(col => (
                        <th key={col.key} style={{ whiteSpace: 'nowrap', padding: '10px 10px', fontSize: 10 }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i}>
                        {COLS.map(col => {
                          const val = row[col.key]
                          if (col.key === 'recategorizar') {
                            return (
                              <td key={col.key}>
                                {val === 'Sí'
                                  ? <span className={styles.badgeGreen}>Sí</span>
                                  : <span className={styles.badgeGray}>No</span>
                                }
                              </td>
                            )
                          }
                          if (TARIFA_COLS.includes(col.key)) {
                            return (
                              <td key={col.key}>
                                {val
                                  ? <span className={styles.badge} style={{ background: (TARIFA_COLORS[val] || '#6B7280') + '20', color: TARIFA_COLORS[val] || '#6B7280', fontSize: 10 }}>{val}</span>
                                  : <span style={{ color: '#D1D5DB' }}>—</span>
                                }
                              </td>
                            )
                          }
                          return (
                            <td key={col.key} className={typeof val === 'number' ? styles.tdNum : ''} style={{ whiteSpace: 'nowrap' }}>
                              {val != null
                                ? (typeof val === 'number' ? fmtNum(val) : val)
                                : <span style={{ color: '#D1D5DB' }}>—</span>
                              }
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Paginacion page={page} total={total} size={PAGE_SIZE} onChange={handlePage} />
            </>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default MatrizRecategorizacion
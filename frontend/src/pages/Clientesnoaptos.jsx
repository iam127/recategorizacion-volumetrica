import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import api from '../services/axiosInstance'
import styles from './ClientesNoAptos.module.css'

const TARIFA_COLORS = {
  'REG-A1-CO': '#1e3a5f',
  'REG-A2-CO': '#2e75b6',
  'REG-B-CO' : '#9CA3AF',
}

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

function ClientesNoAptos() {
  const { user } = useAuth()
  const esAdmin = user?.rol === 'admin'

  const [data,          setData]          = useState([])
  const [total,         setTotal]         = useState(0)
  const [page,          setPage]          = useState(1)
  const [search,        setSearch]        = useState('')
  const [loading,       setLoading]       = useState(true)
  const [importacionId, setImportacionId] = useState(() => localStorage.getItem('importacion_seleccionada') || '')
  const [importaciones, setImportaciones] = useState([])

  const PAGE_SIZE = 50

  const fetchData = useCallback(async (p = 1, s = '', impId = '') => {
    setLoading(true)
    try {
      const params = { page: p, page_size: PAGE_SIZE }
      if (s)     params.search         = s
      if (impId) params.importacion_id = impId
      const res = await api.get('/operaciones/no-aptos/', { params })
      setData(res.data.results || [])
      setTotal(res.data.count  || 0)
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const impId = localStorage.getItem('importacion_seleccionada') || ''

    Promise.all([
      api.get('/operaciones/historial/'),
      api.get('/operaciones/no-aptos/', {
        params: {
          page: 1,
          page_size: PAGE_SIZE,
          ...(impId ? { importacion_id: impId } : {})
        }
      })
    ]).then(([historialRes, dataRes]) => {
      const lista = (historialRes.data || []).map((imp, i, arr) => ({
        id             : imp.id,
        fecha          : imp.fecha,
        total_registros: imp.total_registros,
        indice         : arr.length - i,
      }))
      setImportaciones(lista)
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
    fetchData(1, val, importacionId)
  }

  const handlePage = (p) => {
    setPage(p)
    fetchData(p, search, importacionId)
  }

  const handleImportacion = (id) => {
    setImportacionId(id)
    localStorage.setItem('importacion_seleccionada', id)
    setPage(1); setSearch('')
    fetchData(1, '', id)
  }

  return (
    <Layout title="Clientes No Aptos">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.welcome}>
          <div>
            <h2 className={styles.welcomeTitle}>🚫 Clientes No Aptos</h2>
            <p className={styles.welcomeSub}>
              Instalaciones excluidas del proceso de recategorización volumétrica
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {esAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '6px 14px' }}>
                <span>👑</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309' }}>Vista Admin</span>
              </div>
            )}
            <span style={{ background: '#FFFBEB', color: '#B45309', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20, border: '1px solid #FDE68A' }}>
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

          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); fetchData(1, '', importacionId) }}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontFamily: 'DM Sans, sans-serif' }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className={styles.chartCard}>
          {loading ? (
            <div className={styles.emptyChart}>Cargando...</div>
          ) : data.length === 0 ? (
            <div className={styles.emptyChart}>Sin datos de clientes no aptos.</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Instalación</th>
                      <th>Cuenta Contrato</th>
                      <th>Tarifa Ref.</th>
                      <th>Observación</th>
                      <th>Porción</th>
                      <th>Meses en Ventana</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i}>
                        <td className={styles.tdNum}>{row.instalacion}</td>
                        <td>{row.cuenta_contrato}</td>
                        <td>
                          {row.tarifa_referencia
                            ? <span className={styles.badge} style={{ background: (TARIFA_COLORS[row.tarifa_referencia] || '#6B7280') + '20', color: TARIFA_COLORS[row.tarifa_referencia] || '#6B7280' }}>
                                {row.tarifa_referencia}
                              </span>
                            : <span style={{ color: '#D1D5DB' }}>—</span>
                          }
                        </td>
                        <td style={{ maxWidth: 320, whiteSpace: 'normal', fontSize: 12, color: '#374151' }}>
                          {row.observacion}
                        </td>
                        <td style={{ color: '#6B7280' }}>{row.porcion || '—'}</td>
                        <td className={styles.tdNum}>{row.meses_en_ventana ?? '—'}</td>
                        <td>
                          <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                            {row.estado_inicial || 'No apto'}
                          </span>
                        </td>
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

export default ClientesNoAptos
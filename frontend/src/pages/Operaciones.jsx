import { useState, useRef } from 'react'
import Layout from '../components/layout/Layout'
import api from '../services/axiosInstance'
import styles from './Operaciones.module.css'

const PASOS = [
  { id: 1, label: 'Carga de Archivos',  desc: 'Lectura y concatenación de los Excel mensuales',      icon: '📁' },
  { id: 2, label: 'Limpieza de Datos',  desc: 'Eliminación de duplicados, nulos y valores inválidos', icon: '🧹' },
  { id: 3, label: 'Validación',         desc: 'Verificación de reglas de negocio y formatos',         icon: '✅' },
  { id: 4, label: 'Recategorización',   desc: 'Aplicación de lógica volumétrica por cliente',         icon: '⚙️' },
  { id: 5, label: 'Carga a BD',         desc: 'Guardado de resultados en la base de datos',           icon: '💾' },
]

function Operaciones() {
  const [archivos, setArchivos]         = useState([])
  const [archivosFact, setArchivosFact] = useState([])
  const [isDragging, setIsDragging]     = useState(false)
  const [isDraggingF, setIsDraggingF]   = useState(false)
  const [pasoActual, setPasoActual]     = useState(0)
  const [procesando, setProcesando]     = useState(false)
  const [completado, setCompletado]     = useState(false)
  const [error, setError]               = useState('')
  const [resultado, setResultado]       = useState(null)
  const inputRef  = useRef()
  const inputRefF = useRef()

  const agregarLecturas = (files) => {
    const validos = Array.from(files).filter(
      f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    )
    if (validos.length === 0) return
    setArchivos(prev => {
      const nombres = prev.map(f => f.name)
      const nuevos  = validos.filter(f => !nombres.includes(f.name))
      return [...prev, ...nuevos]
    })
    setError('')
  }

  const agregarFacturacion = (files) => {
    const validos = Array.from(files).filter(
      f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    )
    if (validos.length === 0) return
    setArchivosFact(prev => {
      const nombres = prev.map(f => f.name)
      const nuevos  = validos.filter(f => !nombres.includes(f.name))
      return [...prev, ...nuevos]
    })
    setError('')
  }

  const procesarArchivos = async () => {
    if (archivos.length === 0) return
    if (archivos.length > 7) {
      setError('Máximo 7 archivos de lecturas')
      return
    }
    if (archivosFact.length > 7) {
      setError('Máximo 7 archivos de facturación')
      return
    }
    setError('')
    setProcesando(true)
    setCompletado(false)
    setPasoActual(0)

    for (let i = 1; i <= 4; i++) {
      setPasoActual(i)
      await new Promise(r => setTimeout(r, 800))
    }

    try {
      const formData = new FormData()
      archivos.forEach(f => formData.append('archivos_lectura', f))
      archivosFact.forEach(f => formData.append('archivos_facturacion', f))

      const res = await api.post('/operaciones/importar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setPasoActual(5)
      await new Promise(r => setTimeout(r, 600))
      setResultado(res.data)
      setCompletado(true)

    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar los archivos')
      setPasoActual(0)
    } finally {
      setProcesando(false)
    }
  }

  const resetear = () => {
    setArchivos([])
    setArchivosFact([])
    setPasoActual(0)
    setProcesando(false)
    setCompletado(false)
    setError('')
    setResultado(null)
  }

  const totalSize  = archivos.reduce((acc, f) => acc + f.size, 0)
  const totalSizeF = archivosFact.reduce((acc, f) => acc + f.size, 0)

  return (
    <Layout title="Operaciones">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>⚡</div>
          <div>
            <h2 className={styles.headerTitle}>Importación y Recategorización</h2>
            <p className={styles.headerDesc}>
              Importa los archivos Excel mensuales de lecturas y opcionalmente los de facturación
              para obtener resultados más precisos.
            </p>
          </div>
        </div>

        {/* Instrucciones */}
        <div className={styles.instrucciones}>
          <div className={styles.instrItem}>
            <span className={styles.instrNum}>7</span>
            <span className={styles.instrText}>Archivos de <strong>lecturas</strong> (requerido)</span>
          </div>
          <div className={styles.instrSep}>+</div>
          <div className={styles.instrItem}>
            <span className={styles.instrNum}>7</span>
            <span className={styles.instrText}>Archivos de <strong>facturación</strong> (opcional, mejora precisión)</span>
          </div>
        </div>

        {!completado ? (
          <>
            <div className={styles.grid}>

              {/* Panel izquierdo — Lecturas */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  📋 Archivos de Lecturas
                  <span className={styles.badge}>Requerido</span>
                </h3>
                <p className={styles.cardDesc}>
                  {archivos.length === 0
                    ? 'Selecciona entre 1 y 7 archivos .xlsx o .xls'
                    : `${archivos.length} archivo${archivos.length > 1 ? 's' : ''} · ${(totalSize / 1024 / 1024).toFixed(1)} MB`
                  }
                </p>

                <div
                  className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${archivos.length > 0 ? styles.hasFile : ''}`}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDragging(false)
                    agregarLecturas(e.dataTransfer.files)
                  }}
                  onClick={() => inputRef.current.click()}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => { agregarLecturas(e.target.files); e.target.value = '' }}
                  />
                  <span className={styles.dropIcon}>📁</span>
                  <p className={styles.dropText}>Arrastra archivos de lecturas aquí</p>
                  <p className={styles.dropSub}>Carpeta: 01. Reporte resumen de lecturas</p>
                </div>

                {archivos.length > 0 && (
                  <div className={styles.archivosList}>
                    {archivos.map((f, i) => (
                      <div key={f.name} className={styles.archivoItem}>
                        <span className={styles.archivoIdx}>{i + 1}</span>
                        <span className={styles.archivoIcono}>📊</span>
                        <div className={styles.archivoInfo}>
                          <p className={styles.archivoNombre}>{f.name}</p>
                          <p className={styles.archivoTamano}>{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          className={styles.archivoRemove}
                          onClick={() => setArchivos(prev => prev.filter(x => x.name !== f.name))}
                          disabled={procesando}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel derecho — Flujo */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>🔄 Flujo del Proceso</h3>
                <p className={styles.cardDesc}>Pasos de transformación automática</p>
                <div className={styles.pasos}>
                  {PASOS.map((paso) => (
                    <div
                      key={paso.id}
                      className={`${styles.paso} ${
                        pasoActual === paso.id ? styles.pasoActivo :
                        pasoActual >  paso.id ? styles.pasoCompletado : ''
                      }`}
                    >
                      <div className={styles.pasoNum}>
                        {pasoActual > paso.id ? '✓' : paso.id}
                      </div>
                      <div className={styles.pasoInfo}>
                        <span className={styles.pasoIcon}>{paso.icon}</span>
                        <div>
                          <p className={styles.pasoLabel}>{paso.label}</p>
                          <p className={styles.pasoDesc}>{paso.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sección Facturación — ancho completo */}
            <div className={`${styles.card} ${styles.cardFull}`}>
              <h3 className={styles.cardTitle}>
                🧾 Archivos de Facturación
                <span className={styles.badgeOpcional}>Opcional</span>
              </h3>
              <p className={styles.cardDesc}>
                {archivosFact.length === 0
                  ? 'Si los agregas, la tarifa de referencia será más precisa y los resultados coincidirán con el análisis oficial.'
                  : `${archivosFact.length} archivo${archivosFact.length > 1 ? 's' : ''} · ${(totalSizeF / 1024 / 1024).toFixed(1)} MB`
                }
              </p>

              <div
                className={`${styles.dropzone} ${styles.dropzoneFact} ${isDraggingF ? styles.dragging : ''} ${archivosFact.length > 0 ? styles.hasFile : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDraggingF(true) }}
                onDragLeave={() => setIsDraggingF(false)}
                onDrop={e => {
                  e.preventDefault()
                  setIsDraggingF(false)
                  agregarFacturacion(e.dataTransfer.files)
                }}
                onClick={() => inputRefF.current.click()}
              >
                <input
                  ref={inputRefF}
                  type="file"
                  accept=".xlsx,.xls"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => { agregarFacturacion(e.target.files); e.target.value = '' }}
                />
                <span className={styles.dropIcon}>🧾</span>
                <p className={styles.dropText}>Arrastra archivos de facturación aquí</p>
                <p className={styles.dropSub}>Carpeta: 03. Reportes resumen de facturación</p>
              </div>

              {archivosFact.length > 0 && (
                <div className={styles.archivosListH}>
                  {archivosFact.map((f, i) => (
                    <div key={f.name} className={styles.archivoItem}>
                      <span className={styles.archivoIdx}>{i + 1}</span>
                      <span className={styles.archivoIcono}>🧾</span>
                      <div className={styles.archivoInfo}>
                        <p className={styles.archivoNombre}>{f.name}</p>
                        <p className={styles.archivoTamano}>{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        className={styles.archivoRemove}
                        onClick={() => setArchivosFact(prev => prev.filter(x => x.name !== f.name))}
                        disabled={procesando}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className={styles.errorBox}>⚠️ {error}</div>}

            <button
              className={styles.btnProcesar}
              onClick={procesarArchivos}
              disabled={procesando || archivos.length === 0}
            >
              {procesando
                ? <><span className={styles.spinner} /> Procesando...</>
                : <>⚡ Iniciar Procesamiento ({archivos.length} lectura{archivos.length !== 1 ? 's' : ''}{archivosFact.length > 0 ? ` + ${archivosFact.length} facturación` : ''})</>
              }
            </button>
          </>

        ) : (
          <div className={styles.resultado}>
            <div className={styles.resultadoHeader}>
              <span className={styles.resultadoIcon}>✅</span>
              <h3 className={styles.resultadoTitle}>¡Procesamiento completado!</h3>
              <p className={styles.resultadoSub}>
                Los datos han sido recategorizados exitosamente
                {resultado?.uso_facturacion_externa ? ' · Con datos de facturación' : ' · Solo con lecturas'}
              </p>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <p className={styles.statNum}>{resultado?.total?.toLocaleString()}</p>
                <p className={styles.statLabel}>Total Registros</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statNum}>{resultado?.procesados?.toLocaleString()}</p>
                <p className={styles.statLabel}>Procesados</p>
              </div>
              <div className={`${styles.statBox} ${styles.statDestacado}`}>
                <p className={styles.statNum}>{resultado?.recategorizados?.toLocaleString()}</p>
                <p className={styles.statLabel}>Recategorizados</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statNum}>{resultado?.sin_cambios?.toLocaleString()}</p>
                <p className={styles.statLabel}>Sin Cambios</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statNum}>{resultado?.no_aptos?.toLocaleString()}</p>
                <p className={styles.statLabel}>No Aptos</p>
              </div>
              <div className={styles.statBox}>
                <p className={styles.statNum}>{resultado?.anomalias?.toLocaleString()}</p>
                <p className={styles.statLabel}>Anomalías</p>
              </div>
            </div>
            <button className={styles.btnNuevo} onClick={resetear}>
              🔄 Nueva Importación
            </button>
          </div>
        )}

      </div>
    </Layout>
  )
}

export default Operaciones
import { useState, useRef } from 'react'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import styles from './Operaciones.module.css'

const API_URL = 'http://localhost:8000/api'

const PASOS = [
  { id: 1, label: 'Carga de Archivos',  desc: 'Lectura y concatenación de los Excel mensuales',      icon: '📁' },
  { id: 2, label: 'Limpieza de Datos',  desc: 'Eliminación de duplicados, nulos y valores inválidos', icon: '🧹' },
  { id: 3, label: 'Validación',         desc: 'Verificación de reglas de negocio y formatos',         icon: '✅' },
  { id: 4, label: 'Recategorización',   desc: 'Aplicación de lógica volumétrica por cliente',         icon: '⚙️' },
  { id: 5, label: 'Carga a BD',         desc: 'Guardado de resultados en la base de datos',           icon: '💾' },
]

function Operaciones() {
  const [archivos, setArchivos]     = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [pasoActual, setPasoActual] = useState(0)
  const [procesando, setProcesando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [error, setError]           = useState('')
  const [resultado, setResultado]   = useState(null)
  const inputRef = useRef()

  const agregarArchivos = (files) => {
    const validos = Array.from(files).filter(
      f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    )
    setArchivos(prev => {
      const nombres = prev.map(f => f.name)
      const nuevos  = validos.filter(f => !nombres.includes(f.name))
      return [...prev, ...nuevos]
    })
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    agregarArchivos(e.dataTransfer.files)
  }

  const removerArchivo = (nombre) => {
    setArchivos(prev => prev.filter(f => f.name !== nombre))
  }

  const procesarArchivos = async () => {
    if (archivos.length === 0) return
    if (archivos.length > 7) {
      setError('Máximo 7 archivos (6 meses + 1 histórico)')
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
      const token    = localStorage.getItem('access_token')
      const formData = new FormData()
      archivos.forEach(f => formData.append('archivos_lectura', f))

      const res = await axios.post(`${API_URL}/operaciones/importar/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
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
    setPasoActual(0)
    setProcesando(false)
    setCompletado(false)
    setError('')
    setResultado(null)
  }

  const totalSize = archivos.reduce((acc, f) => acc + f.size, 0)

  return (
    <Layout title="Operaciones">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>⚡</div>
          <div>
            <h2 className={styles.headerTitle}>Importación y Recategorización</h2>
            <p className={styles.headerDesc}>
              Importa entre 1 y 7 archivos Excel mensuales. El sistema los concatenará
              y ejecutará automáticamente el flujo de recategorización volumétrica.
            </p>
          </div>
        </div>

        {/* Instrucciones */}
        <div className={styles.instrucciones}>
          <div className={styles.instrItem}>
            <span className={styles.instrNum}>6</span>
            <span className={styles.instrText}>Archivos de los <strong>6 meses</strong> de la ventana de análisis</span>
          </div>
          <div className={styles.instrSep}>+</div>
          <div className={styles.instrItem}>
            <span className={styles.instrNum}>1</span>
            <span className={styles.instrText}>Archivo <strong>histórico opcional</strong> para escenarios operativos</span>
          </div>
          <div className={styles.instrSep}>=</div>
          <div className={styles.instrItem}>
            <span className={styles.instrNum}>7</span>
            <span className={styles.instrText}>Archivos máximo en total</span>
          </div>
        </div>

        {!completado ? (
          <div className={styles.grid}>

            {/* Panel izquierdo */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📋 Cargar Archivos Excel</h3>
              <p className={styles.cardDesc}>
                {archivos.length === 0
                  ? 'Selecciona entre 1 y 7 archivos .xlsx o .xls'
                  : `${archivos.length} archivo${archivos.length > 1 ? 's' : ''} seleccionado${archivos.length > 1 ? 's' : ''} · ${(totalSize / 1024 / 1024).toFixed(1)} MB`
                }
              </p>

              {/* Dropzone */}
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${archivos.length > 0 ? styles.hasFile : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => { agregarArchivos(e.target.files); e.target.value = '' }}
                />
                <span className={styles.dropIcon}>📁</span>
                <p className={styles.dropText}>Arrastra tus archivos aquí</p>
                <p className={styles.dropSub}>o haz clic para seleccionar múltiples archivos</p>
              </div>

              {/* Lista de archivos */}
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
                        onClick={() => removerArchivo(f.name)}
                        disabled={procesando}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {error && <div className={styles.errorBox}>⚠️ {error}</div>}

              <button
                className={styles.btnProcesar}
                onClick={procesarArchivos}
                disabled={procesando || archivos.length === 0}
              >
                {procesando
                  ? <><span className={styles.spinner} /> Procesando...</>
                  : <>⚡ Iniciar Procesamiento ({archivos.length} archivo{archivos.length !== 1 ? 's' : ''})</>
                }
              </button>
            </div>

            {/* Panel derecho - Flujo */}
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

        ) : (
          <div className={styles.resultado}>
            <div className={styles.resultadoHeader}>
              <span className={styles.resultadoIcon}>✅</span>
              <h3 className={styles.resultadoTitle}>¡Procesamiento completado!</h3>
              <p className={styles.resultadoSub}>Los datos han sido recategorizados exitosamente</p>
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
import { useState, useRef } from 'react'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import styles from './Operaciones.module.css'

const API_URL = 'http://localhost:8000/api'

const PASOS = [
  { id: 1, label: 'Carga de Archivo',  desc: 'Lectura del Excel e identificación de columnas',       icon: '📁' },
  { id: 2, label: 'Limpieza de Datos', desc: 'Eliminación de duplicados, nulos y valores inválidos',  icon: '🧹' },
  { id: 3, label: 'Validación',        desc: 'Verificación de reglas de negocio y formatos',          icon: '✅' },
  { id: 4, label: 'Recategorización',  desc: 'Aplicación de lógica volumétrica por cliente',          icon: '⚙️' },
  { id: 5, label: 'Carga a BD',        desc: 'Guardado de resultados en la base de datos',            icon: '💾' },
]

function Operaciones() {
  const [archivoLectura, setArchivoLectura] = useState(null)
  const [isDragging, setIsDragging]         = useState(false)
  const [pasoActual, setPasoActual]         = useState(0)
  const [procesando, setProcesando]         = useState(false)
  const [completado, setCompletado]         = useState(false)
  const [error, setError]                   = useState('')
  const [resultado, setResultado]           = useState(null)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setArchivoLectura(file)
      setError('')
    }
  }

  const procesarArchivo = async () => {
    if (!archivoLectura) return
    setError('')
    setProcesando(true)
    setCompletado(false)
    setPasoActual(0)

    // Pasos 1-4 animados
    for (let i = 1; i <= 4; i++) {
      setPasoActual(i)
      await new Promise(r => setTimeout(r, 800))
    }

    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('archivo_lectura', archivoLectura)

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
      setError(err.response?.data?.error || 'Error al procesar el archivo')
      setPasoActual(0)
    } finally {
      setProcesando(false)
    }
  }

  const resetear = () => {
    setArchivoLectura(null)
    setPasoActual(0)
    setProcesando(false)
    setCompletado(false)
    setError('')
    setResultado(null)
  }

  return (
    <Layout title="Operaciones">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>⚡</div>
          <div>
            <h2 className={styles.headerTitle}>Importación y Recategorización</h2>
            <p className={styles.headerDesc}>
              Importa el archivo Excel de lecturas. El sistema ejecutará automáticamente
              el flujo de limpieza, validación y recategorización volumétrica.
            </p>
          </div>
        </div>

        {!completado ? (
          <div className={styles.grid}>

            {/* Panel izquierdo */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📋 Cargar Archivo Excel</h3>
              <p className={styles.cardDesc}>Formatos aceptados: .xlsx, .xls</p>

              {/* Dropzone */}
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${archivoLectura ? styles.hasFile : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={e => {
                    setArchivoLectura(e.target.files[0])
                    setError('')
                  }}
                />
                {archivoLectura ? (
                  <div className={styles.fileInfo}>
                    <span className={styles.fileIcon}>📊</span>
                    <div>
                      <p className={styles.fileName}>{archivoLectura.name}</p>
                      <p className={styles.fileSize}>
                        {(archivoLectura.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      className={styles.fileRemove}
                      onClick={e => { e.stopPropagation(); setArchivoLectura(null) }}
                    >✕</button>
                  </div>
                ) : (
                  <>
                    <span className={styles.dropIcon}>📁</span>
                    <p className={styles.dropText}>Arrastra tu archivo aquí</p>
                    <p className={styles.dropSub}>o haz clic para seleccionar</p>
                  </>
                )}
              </div>

              {error && (
                <div className={styles.errorBox}>⚠️ {error}</div>
              )}

              <button
                className={styles.btnProcesar}
                onClick={procesarArchivo}
                disabled={procesando || !archivoLectura}
              >
                {procesando ? (
                  <><span className={styles.spinner} /> Procesando...</>
                ) : (
                  <>⚡ Iniciar Procesamiento</>
                )}
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
                      pasoActual === paso.id  ? styles.pasoActivo :
                      pasoActual >  paso.id  ? styles.pasoCompletado : ''
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

          /* Resultado */
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
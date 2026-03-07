import { useState } from 'react'
import Layout from '../components/layout/Layout'
import styles from './Operaciones.module.css'

const PASOS_ETL = [
  {
    id: 1,
    label: 'Carga de Archivo',
    desc: 'Lectura del Excel e identificación de columnas',
    icon: '📂',
  },
  {
    id: 2,
    label: 'Limpieza de Datos',
    desc: 'Eliminación de duplicados, nulos y valores inválidos',
    icon: '🧹',
  },
  {
    id: 3,
    label: 'Validación',
    desc: 'Verificación de reglas de negocio y formatos',
    icon: '✅',
  },
  {
    id: 4,
    label: 'Recategorización',
    desc: 'Aplicación de lógica volumétrica por cliente',
    icon: '⚙️',
  },
  {
    id: 5,
    label: 'Carga a Base de Datos',
    desc: 'Inserción de resultados y actualización del dashboard',
    icon: '💾',
  },
]

function Operaciones() {
  const [archivo, setArchivo] = useState(null)
  const [pasoActual, setPasoActual] = useState(null)
  const [estado, setEstado] = useState('idle') // idle | loading | success | error
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  const handleArchivo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Solo se permiten archivos Excel (.xlsx, .xls)')
      return
    }
    setError('')
    setArchivo(file)
    setEstado('idle')
    setResultado(null)
    setPasoActual(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Solo se permiten archivos Excel (.xlsx, .xls)')
      return
    }
    setError('')
    setArchivo(file)
    setEstado('idle')
    setResultado(null)
    setPasoActual(null)
  }

  const simularProceso = async () => {
    setEstado('loading')
    setResultado(null)
    setPasoActual(0)

    for (let i = 0; i < PASOS_ETL.length; i++) {
      setPasoActual(i)
      await new Promise(r => setTimeout(r, 900))
    }

    // Cuando Jesús tenga lista la API, reemplazar esto con:
    // const token = localStorage.getItem('access_token')
    // const formData = new FormData()
    // formData.append('archivo', archivo)
    // const res = await axios.post('http://localhost:8000/api/operaciones/importar/', formData, {
    //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    // })
    // setResultado(res.data)

    setEstado('success')
    setPasoActual(PASOS_ETL.length)
    setResultado({
      total: 0,
      procesados: 0,
      recategorizados: 0,
      errores: 0,
    })
  }

  const handleReset = () => {
    setArchivo(null)
    setEstado('idle')
    setResultado(null)
    setPasoActual(null)
    setError('')
  }

  return (
    <Layout title="Operaciones">
      <div className={styles.page}>

        {/* Header info */}
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>⚡</div>
          <div>
            <h3 className={styles.infoTitle}>Importación y Recategorización</h3>
            <p className={styles.infoDesc}>
              Importa un archivo Excel con los datos de clientes. El sistema ejecutará automáticamente
              el flujo de limpieza, validación y recategorización volumétrica.
            </p>
          </div>
        </div>

        <div className={styles.grid}>

          {/* Upload */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>📁 Cargar Archivo Excel</h3>
            <p className={styles.cardSub}>Formatos aceptados: .xlsx, .xls</p>

            {error && (
              <div className={styles.errorMsg}>❌ {error}</div>
            )}

            {!archivo ? (
              <div
                className={styles.dropzone}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <div className={styles.dropIcon}>📊</div>
                <p className={styles.dropText}>Arrastra tu archivo aquí</p>
                <p className={styles.dropSub}>o haz clic para seleccionar</p>
                <input
                  id="fileInput"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleArchivo}
                  className={styles.hiddenInput}
                />
              </div>
            ) : (
              <div className={styles.archivoInfo}>
                <div className={styles.archivoIcon}>📗</div>
                <div className={styles.archivoDetalles}>
                  <span className={styles.archivoNombre}>{archivo.name}</span>
                  <span className={styles.archivoTamano}>
                    {(archivo.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button className={styles.archivoRemove} onClick={handleReset}>✕</button>
              </div>
            )}

            {archivo && estado === 'idle' && (
              <button className={styles.btnProcesar} onClick={simularProceso}>
                ⚡ Iniciar Proceso ETL
              </button>
            )}

            {estado === 'success' && (
              <button className={styles.btnNuevo} onClick={handleReset}>
                + Nueva Importación
              </button>
            )}
          </div>

          {/* Flujo ETL */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>🔄 Flujo del Proceso</h3>
            <p className={styles.cardSub}>Pasos de transformación automática</p>

            <div className={styles.pasos}>
              {PASOS_ETL.map((paso, i) => {
                let estadoPaso = 'pendiente'
                if (pasoActual !== null) {
                  if (i < pasoActual) estadoPaso = 'completado'
                  else if (i === pasoActual && estado === 'loading') estadoPaso = 'activo'
                  else if (estado === 'success') estadoPaso = 'completado'
                }

                return (
                  <div key={paso.id} className={`${styles.paso} ${styles[estadoPaso]}`}>
                    <div className={styles.pasoLeft}>
                      <div className={styles.pasoNum}>
                        {estadoPaso === 'completado' ? '✓' : estadoPaso === 'activo' ? (
                          <span className={styles.spinner} />
                        ) : i + 1}
                      </div>
                      {i < PASOS_ETL.length - 1 && (
                        <div className={`${styles.pasoLinea} ${estadoPaso === 'completado' ? styles.lineaActiva : ''}`} />
                      )}
                    </div>
                    <div className={styles.pasoCuerpo}>
                      <div className={styles.pasoHeader}>
                        <span className={styles.pasoIcon}>{paso.icon}</span>
                        <span className={styles.pasoLabel}>{paso.label}</span>
                      </div>
                      <p className={styles.pasoDesc}>{paso.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className={styles.resultadoCard}>
            <div className={styles.resultadoHeader}>
              <span className={styles.resultadoBadge}>✅ Proceso Completado</span>
              <h3 className={styles.resultadoTitle}>Resumen de Importación</h3>
              <p className={styles.resultadoSub}>
                El dashboard se actualizará con los nuevos datos
              </p>
            </div>
            <div className={styles.resultadoGrid}>
              {[
                { label: 'Total Registros', value: resultado.total, color: '#2e75b6', icon: '📋' },
                { label: 'Procesados', value: resultado.procesados, color: '#10B981', icon: '✅' },
                { label: 'Recategorizados', value: resultado.recategorizados, color: '#F59E0B', icon: '🔄' },
                { label: 'Con Errores', value: resultado.errores, color: '#EF4444', icon: '⚠️' },
              ].map((item, i) => (
                <div key={i} className={styles.resultadoStat}>
                  <span className={styles.resultadoStatIcon}>{item.icon}</span>
                  <span className={styles.resultadoStatValue} style={{ color: item.color }}>
                    {item.value.toLocaleString()}
                  </span>
                  <span className={styles.resultadoStatLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

export default Operaciones
import { useState } from 'react'
import Layout from '../components/layout/Layout'
import styles from './Ayuda.module.css'

const PASOS = [
  { num: '01', icon: '📁', titulo: 'Cargar archivos Excel',     desc: 'Ve a la sección Operaciones y sube los archivos mensuales de lecturas y facturación. El sistema acepta uno o más archivos .xlsx por cada tipo.' },
  { num: '02', icon: '⚡', titulo: 'Ejecutar el procesamiento', desc: 'Presiona "Iniciar Procesamiento". El sistema ejecutará el ETL automáticamente: limpieza de datos, validación de reglas y cálculo de consumo por instalación.' },
  { num: '03', icon: '📊', titulo: 'Revisar el Dashboard',      desc: 'Una vez completado, ve al Dashboard para ver el resumen: total de clientes, recategorizados, sin cambio, no aptos y anomalías detectadas.' },
  { num: '04', icon: '👥', titulo: 'Explorar los Clientes',     desc: 'En la sección Clientes puedes filtrar por porción y período para ver el detalle de cada instalación y su nueva tarifa asignada.' },
  { num: '05', icon: '⬇️', titulo: 'Exportar los resultados',   desc: 'En Reportes puedes descargar el Excel completo con los 4 cuadros: clientes recategorizados, resumen tarifario, no aptos y anomalías.' },
]

const TARIFAS = [
  {
    codigo: 'REG-A1-CO', rango: '0 — 30 m³',    label: 'Categoría A1',
    desc:   'Clientes residenciales de bajo consumo. Promedio mensual redondeado de 0 a 30 m³.',
    color: '#1e3a5f', bg: '#EFF6FF', border: '#BFDBFE',
  },
  {
    codigo: 'REG-A2-CO', rango: '31 — 300 m³',  label: 'Categoría A2',
    desc:   'Clientes residenciales o comerciales de consumo medio. Promedio mensual redondeado de 31 a 300 m³.',
    color: '#2e75b6', bg: '#E0F2FE', border: '#BAE6FD',
  },
  {
    codigo: 'REG-B-CO',  rango: '> 300 m³',     label: 'Categoría B',
    desc:   'Clientes industriales o de alto consumo. Promedio mensual redondeado mayor a 300 m³.',
    color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB',
  },
]

const FAQS = [
  { q: '¿Por qué un cliente aparece como "No Apto"?',         a: 'Un cliente es No Apto cuando no cumple los criterios mínimos para ser recategorizado. Las razones más comunes son: tener menos de 6 meses de historial en la ventana de evaluación, tener una tarifa no vigente (distinta a REG-A1-CO, REG-A2-CO o REG-B-CO), o no tener lecturas registradas en el período evaluado.' },
  { q: '¿Qué es una anomalía?',                               a: 'Una anomalía es un registro con comportamiento inusual detectado en los datos de lectura. Puede ser una ruptura diagonal (la lectura anterior del registro siguiente no coincide con la lectura actual), consumo registrado después de un corte sin reconexión, o consumo después de un desmontaje sin montaje posterior.' },
  { q: '¿Cada cuánto tiempo se realiza la recategorización?', a: 'Según la normativa de OSINERGMIN, la recategorización se realiza periódicamente. El sistema evalúa una ventana fija de 6 meses de historial de consumo para determinar la tarifa correspondiente a cada instalación.' },
  { q: '¿Qué significa la ventana de 6 meses?',               a: 'El sistema toma los últimos 6 meses de lecturas disponibles para calcular el promedio diario de consumo de cada instalación. Solo los clientes con lecturas en los 6 meses completos son considerados aptos para recategorización.' },
  { q: '¿Cómo se calcula la nueva tarifa?',                   a: 'Se suma el consumo total facturado de los 6 meses, se divide entre los días totales para obtener el promedio diario, y luego se multiplica por 30.41 (días estándar del mes) para obtener el promedio mensual. Ese valor se redondea según la regla: decimales ≤ 0.5 bajan, decimales ≥ 0.6 suben. Finalmente se asigna la tarifa según el rango: 0-30 m³ → A1, 31-300 m³ → A2, >300 m³ → B.' },
  { q: '¿Qué pasa si subo más de 7 archivos de lecturas?',    a: 'El sistema concatena automáticamente todos los archivos cargados. Puedes subir 7 o más archivos — el motor tomará automáticamente los últimos 6 meses como ventana de evaluación y los meses extra servirán como historial de referencia.' },
  { q: '¿Los archivos de facturación son obligatorios?',      a: 'Sí. Los archivos de facturación son requeridos para que el sistema pueda asignar correctamente la tarifa de referencia de cada cliente por mes, lo que garantiza resultados más precisos y alineados con el análisis oficial.' },
]

const TABS = [
  { id: 'uso',     label: '🚀 ¿Cómo usar el sistema?',    },
  { id: 'tarifas', label: '🏷️ ¿Qué significan las tarifas?', },
  { id: 'faq',     label: '💬 Preguntas Frecuentes',      },
]

function FAQItem({ pregunta, respuesta }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className={`${styles.faqItem} ${abierto ? styles.faqAbierto : ''}`}>
      <button className={styles.faqPregunta} onClick={() => setAbierto(v => !v)}>
        <span>{pregunta}</span>
        <span className={`${styles.faqChevron} ${abierto ? styles.faqChevronAbierto : ''}`}>›</span>
      </button>
      {abierto && (
        <div className={styles.faqRespuesta}>
          <p>{respuesta}</p>
        </div>
      )}
    </div>
  )
}

function Ayuda() {
  const [tabActiva, setTabActiva] = useState('uso')

  return (
    <Layout title="Ayuda">
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>❓</div>
          <div>
            <h2 className={styles.headerTitle}>Centro de Ayuda</h2>
            <p className={styles.headerDesc}>
              Guía de uso del Sistema de Recategorización Volumétrica de ConTugas
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsWrap}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${tabActiva === tab.id ? styles.tabActiva : ''}`}
              onClick={() => setTabActiva(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className={styles.contenido}>

          {/* ── Tab 1: Cómo usar ── */}
          {tabActiva === 'uso' && (
            <div className={styles.section}>
              <p className={styles.sectionDesc}>
                Sigue estos pasos para ejecutar el proceso de recategorización correctamente.
              </p>
              <div className={styles.pasos}>
                {PASOS.map((paso, i) => (
                  <div key={i} className={styles.paso}>
                    <div className={styles.pasoLeft}>
                      <div className={styles.pasoNum}>{paso.num}</div>
                      {i < PASOS.length - 1 && <div className={styles.pasoLinea} />}
                    </div>
                    <div className={styles.pasoCard}>
                      <div className={styles.pasoIcono}>{paso.icon}</div>
                      <div>
                        <p className={styles.pasoTitulo}>{paso.titulo}</p>
                        <p className={styles.pasoDesc}>{paso.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab 2: Tarifas ── */}
          {tabActiva === 'tarifas' && (
            <div className={styles.section}>
              <p className={styles.sectionDesc}>
                El sistema asigna una de estas tres categorías tarifarias según el promedio mensual de consumo de cada instalación.
              </p>

              <div className={styles.tarifasGrid}>
                {TARIFAS.map((t, i) => (
                  <div key={i} className={styles.tarifaCard} style={{ borderColor: t.border }}>
                    <div className={styles.tarifaTop} style={{ background: t.bg }}>
                      <span className={styles.tarifaCodigo} style={{ color: t.color }}>{t.codigo}</span>
                      <span className={styles.tarifaRango} style={{ background: t.color, color: '#fff' }}>{t.rango}</span>
                    </div>
                    <div className={styles.tarifaBody}>
                      <p className={styles.tarifaLabel} style={{ color: t.color }}>{t.label}</p>
                      <p className={styles.tarifaDesc}>{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Regla de redondeo */}
              <div className={styles.redondeoCaja}>
                <p className={styles.redondeoTitulo}>📐 Regla de redondeo del promedio mensual</p>
                <div className={styles.redondeoGrid}>
                  <div className={styles.redondeoItem}>
                    <span className={styles.redondeoNum} style={{ color: '#10B981' }}>≤ 0.5</span>
                    <span className={styles.redondeoFlecha}>→</span>
                    <span className={styles.redondeoTexto}>Redondea hacia abajo</span>
                    <span className={styles.redondeoEj}>Ej: 30.5 → 30</span>
                  </div>
                  <div className={styles.redondeoDivider} />
                  <div className={styles.redondeoItem}>
                    <span className={styles.redondeoNum} style={{ color: '#EF4444' }}>≥ 0.6</span>
                    <span className={styles.redondeoFlecha}>→</span>
                    <span className={styles.redondeoTexto}>Redondea hacia arriba</span>
                    <span className={styles.redondeoEj}>Ej: 30.6 → 31</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: FAQ ── */}
          {tabActiva === 'faq' && (
            <div className={styles.section}>
              <p className={styles.sectionDesc}>
                Respuestas a las dudas más comunes sobre el sistema y el proceso de recategorización.
              </p>
              <div className={styles.faqList}>
                {FAQS.map((faq, i) => (
                  <FAQItem key={i} pregunta={faq.q} respuesta={faq.a} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default Ayuda
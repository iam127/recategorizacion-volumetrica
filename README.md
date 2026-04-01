<div align="center">

<img src="frontend/public/logo-contugas.jpg" alt="CONTUGAS" width="180"/>

# Sistema Web de Recategorización Volumétrica Automatizada

### Gestión Tarifaria de Clientes de Gas Natural — CONTUGAS

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-6.0.2-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)

**Pasantías Profesionales · TECSUP · Diseño y Desarrollo de Software · 2026**

[📁 Repositorio](https://github.com/iam127/recategorizacion-volumetrica)

</div>

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Uso del Sistema](#uso-del-sistema)
- [API Reference](#api-reference)
- [Base de Datos](#base-de-datos)
- [Roles y Permisos](#roles-y-permisos)
- [Equipo](#equipo)

---

## Descripción General

El **Sistema de Recategorización Volumétrica** automatiza el proceso de clasificación tarifaria de clientes de gas natural en CONTUGAS, aplicando las normativas de OSINERGMIN sobre el consumo volumétrico mensual registrado.

El sistema procesa más de **639,000 registros de lecturas** mensuales para determinar si cada instalación debe mantenerse en su categoría tarifaria actual o ser recategorizada, eliminando la dependencia de procesos manuales en hojas de cálculo.

### Resultados con datos reales CONTUGAS (7 meses)

| Indicador | Resultado |
|-----------|-----------|
| Registros totales procesados | 639,896 |
| Instalaciones evaluadas (aptas) | 82,610 |
| Instalaciones recategorizadas | 1,099 (1.33%) |
| Instalaciones sin cambio de tarifa | 81,511 (98.67%) |
| Instalaciones no aptas | 21,618 |
| Clientes con anomalías detectadas | 1,487 |
| **Cobertura total del padrón** | **103,287 (100%)** |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│              React 18 + Vite · CSS Modules · Recharts            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / REST + JWT
┌──────────────────────────▼──────────────────────────────────────┐
│                         BACKEND                                  │
│           Django 6.0.2 · Django REST Framework · Python 3.13    │
│                                                                  │
│   ┌─────────────────┐    ┌─────────────────┐                    │
│   │   API Endpoints  │    │   Motor ETL      │                    │
│   │   (views.py)     │    │   (etl.py)       │                    │
│   │                  │    │   pandas · numpy │                    │
│   └────────┬─────────┘    └────────┬────────┘                    │
└────────────┼──────────────────────-┼───────────────────────────┘
             │                       │
┌────────────▼───────────────────────▼───────────────────────────┐
│                      BASE DE DATOS                               │
│                    MySQL 8.0 · utf8mb4                           │
│         recategorizacion_db · 7 tablas · índices optimizados    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React + Vite | 18 / 5.x |
| **Visualización** | Recharts | 2.x |
| **Estilos** | CSS Modules | — |
| **Backend** | Django + DRF | 6.0.2 |
| **Autenticación** | Simple JWT | — |
| **Base de Datos** | MySQL | 8.0 |
| **ETL** | pandas + numpy | 2.x |
| **Reportes** | openpyxl | 3.x |
| **Control de versiones** | Git + GitHub | — |

---

## Estructura del Proyecto

```
recategorizacion-volumetrica/
│
├── backend/
│   ├── backend/                        # Configuración principal Django
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── operaciones/                    # App principal del sistema
│   │   ├── migrations/                 # Migraciones de BD
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── etl.py                      # Motor ETL de recategorización
│   │   ├── models.py                   # 7 modelos de BD
│   │   ├── tests.py
│   │   ├── urls.py                     # Rutas de la API
│   │   └── views.py                    # 10 endpoints REST
│   │
│   ├── usuarios/                       # App de autenticación y roles
│   │   ├── migrations/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py                   # Modelo de usuario personalizado
│   │   ├── serializers.py              # Serializers JWT
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   ├── .env                            # Variables de entorno (no commitear)
│   ├── .env.example                    # Plantilla de variables de entorno
│   ├── manage.py
│   └── test_etl.py                     # Tests del motor ETL
│
└── frontend/
    ├── public/
    │   ├── logo-contugas.jpg
    │   ├── logo-contugas-sf.jpg
    │   ├── logo-icono.jpg
    │   └── vite.svg
    │
    └── src/
        ├── assets/
        │   └── react.svg
        │
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.jsx              # Contenedor principal con sidebar
        │   │   ├── Layout.module.css
        │   │   ├── Navbar.jsx              # Barra superior con notificaciones
        │   │   ├── Navbar.module.css
        │   │   ├── Sidebar.jsx             # Menú lateral con roles
        │   │   ├── Sidebar.module.css
        │   │   └── ProtectedRoute.jsx      # Guard de rutas por rol
        │   │
        │   └── context/
        │       └── AuthContext.jsx         # Contexto global de autenticación
        │
        ├── pages/
        │   ├── Login.jsx                   # Autenticación JWT
        │   ├── Login.module.css
        │   ├── Register.jsx                # Registro de usuarios
        │   ├── Register.module.css
        │   ├── Dashboard.jsx               # KPIs + gráficas + filtros
        │   ├── Dashboard.module.css
        │   ├── Clientes.jsx                # Cuadro 2 — clientes aptos
        │   ├── Clientes.module.css
        │   ├── Operaciones.jsx             # Carga de archivos + ETL
        │   ├── Operaciones.module.css
        │   ├── Reportes.jsx                # Exportación Excel (5 hojas)
        │   ├── Reportes.module.css
        │   ├── Matrizrecategorizacion.jsx  # Cuadro 3 — detalle mensual
        │   ├── Matrizrecategorizacion.module.css
        │   ├── Clientesnoaptos.jsx         # Cuadro 4 — excluidos
        │   ├── Clientesnoaptos.module.css
        │   ├── Usuarios.jsx                # Gestión de usuarios (admin)
        │   ├── Usuarios.module.css
        │   ├── Configuracion.jsx           # Configuración de cuenta
        │   ├── Configuracion.module.css
        │   ├── Ayuda.jsx                   # Guía de uso, tarifas y FAQ
        │   └── Ayuda.module.css
        │
        ├── services/
        │   ├── authService.js              # Funciones de login / logout
        │   └── axiosInstance.js            # Cliente HTTP con interceptores JWT
        │
        ├── App.jsx                         # Rutas principales
        ├── App.css
        ├── main.jsx                        # Punto de entrada React
        ├── index.css
        ├── .env                            # Variables de entorno (no commitear)
        ├── .env.example                    # Plantilla de variables de entorno
        ├── .gitignore
        ├── eslint.config.js
        ├── index.html
        ├── package.json
        ├── package-lock.json
        └── vite.config.js
```

---

## Instalación

### Requisitos Previos

- Python 3.13+
- Node.js 18+
- MySQL 8.0+
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/iam127/recategorizacion-volumetrica.git
cd recategorizacion-volumetrica
```

### 2. Configurar el Backend

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / Mac

# Instalar dependencias
pip install -r requirements.txt
```

Crear la base de datos en MySQL:

```sql
CREATE DATABASE recategorizacion_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Configurar el archivo `.env` en la carpeta `backend/` basándote en `.env.example`:

```env
SECRET_KEY=tu_secret_key_de_django
DB_NAME=recategorizacion_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=3306
DEBUG=True
```

Aplicar migraciones y levantar el servidor:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install
```

Configurar el archivo `.env` en la carpeta `frontend/` basándote en `.env.example`:

```env
VITE_API_URL=http://localhost:8000/api
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en **http://localhost:5173**

---

## Uso del Sistema

### Archivos Requeridos

El proceso requiere dos conjuntos de archivos Excel, uno por cada mes de la ventana de evaluación (7 meses en total):

| Carpeta | Contenido |
|---------|-----------|
| `01/` | Archivos de lecturas de medidor |
| `03/` | Archivos de facturación |

> ⚠️ Se requieren **mínimo 7 archivos** de cada tipo para ejecutar la ventana de 6 meses de evaluación.

### Flujo del Proceso

```
Cargar archivos  →  ETL automático  →  Dashboard  →  Exportar Excel
     (7+7)           (~20 min)        (resultados)    (5 hojas)
```

### Cuadros de Resultados

| Cuadro | Descripción | Módulo |
|--------|-------------|--------|
| **Cuadro 2** | Clientes aptos con resultado de recategorización | `/clientes` |
| **Cuadro 3** | Matriz completa con detalle mensual por instalación | `/matriz` |
| **Cuadro 4** | Instalaciones excluidas con motivo de exclusión | `/no-aptos` |
| **Cuadro 5** | Anomalías detectadas en datos de lecturas | Dashboard |

### Categorías Tarifarias

| Tarifa | Umbral de Consumo Mensual |
|--------|--------------------------|
| REG-A1-CO | ≤ 30 m³/mes |
| REG-A2-CO | 31 – 300 m³/mes |
| REG-B-CO | > 300 m³/mes |

---

## API Reference

Base URL: `http://localhost:8000/api`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/login/` | Obtener token JWT | ❌ |
| `POST` | `/operaciones/importar/` | Procesar archivos Excel | ✅ |
| `GET` | `/operaciones/dashboard/stats/` | Estadísticas del dashboard | ✅ |
| `GET` | `/operaciones/dashboard/filtros/` | Filtrar por porción y período | ✅ |
| `GET` | `/operaciones/clientes/` | Listado paginado de clientes aptos | ✅ |
| `GET` | `/operaciones/matriz/` | Matriz de recategorización | ✅ |
| `GET` | `/operaciones/no-aptos/` | Clientes no aptos | ✅ |
| `GET` | `/operaciones/historial/` | Historial de importaciones | ✅ |
| `GET` | `/operaciones/exportar-excel/` | Descargar reporte Excel (5 hojas) | ✅ |
| `GET` | `/operaciones/comparativa/` | Comparar dos importaciones | ✅ |

---

## Base de Datos

### Diagrama de relaciones

```
resultado_importacion (1) ──────────────────────────────── (N) clientes
        │                                                         │
        ├── (N) resumen_tarifario                                  │
        ├── (N) clientes_no_aptos                    (N) consumo_mensual
        ├── (N) anomalias
        └── (N) matriz_recategorizacion
```

### Tablas

| Tabla | Descripción | Registros aprox. |
|-------|-------------|-----------------|
| `resultado_importacion` | Metadatos de cada ejecución | 1 por proceso |
| `clientes` | Resultado de recategorización | 82,610 por proceso |
| `consumo_mensual` | Consumo facturado por período | ~495,000 por proceso |
| `resumen_tarifario` | Movimientos entre tarifas | 9 por proceso |
| `clientes_no_aptos` | Instalaciones excluidas | 21,618 por proceso |
| `anomalias` | Lecturas con comportamiento inusual | 1,487 por proceso |
| `matriz_recategorizacion` | Detalle mensual por instalación | 82,610 por proceso |

---

## Roles y Permisos

| Módulo | Usuario | Administrador |
|--------|---------|--------------|
| Dashboard (propias importaciones) | ✅ | ✅ |
| Dashboard (vista global del sistema) | ❌ | ✅ |
| Clientes | ✅ | ❌ |
| Operaciones (importar archivos) | ✅ | ❌ |
| Matriz de Recategorización | ✅ | ✅ |
| Clientes No Aptos | ✅ | ✅ |
| Reportes (exportar Excel) | ✅ | ✅ |
| Gestión de Usuarios | ❌ | ✅ |
| Configuración | ✅ | ✅ |
| Ayuda | ✅ | ✅ |

---

## Equipo

<table>
  <tr>
    <td align="center">
      <b>Matias Galván Guerrero</b><br/>
      <sub>Frontend · Backend · Base de Datos</sub>
    </td>
    <td align="center">
      <b>Jhadir Abdel Yupanqui Chahua</b><br/>
      <sub>Motor ETL · Lógica de recategorización</sub>
    </td>
    <td align="center">
      <b>Jesús Alejandro Vásquez Espinoza</b><br/>
      <sub>Motor ETL · Lógica de recategorización</sub>
    </td>
  </tr>
</table>

**Asesora:** Mg. Laura Meléndez  
**Institución:** TECSUP — Diseño y Desarrollo de Software  
**Área de pasantías:** Gerencia Comercial — CONTUGAS  
**Período:** 13 enero – 10 abril 2026

### Ramas de trabajo

| Rama | Descripción |
|------|-------------|
| `feature/frontend` | Desarrollo del frontend React |
| `feature/backend` | Desarrollo del backend Django |

---

<div align="center">

Desarrollado con 💙 para CONTUGAS · TECSUP 2026

</div>
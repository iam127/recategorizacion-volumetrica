import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Configuracion from './pages/Configuracion'
import Operaciones from './pages/Operaciones'
import Clientes from './pages/Clientes'
import Reportes from './pages/Reportes'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/configuracion" element={<Configuracion />} />
      <Route path="/operaciones" element={<Operaciones />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/reportes" element={<Reportes />} />
    </Routes>
  )
}

export default App
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Configuracion from './pages/Configuracion'
import Operaciones from './pages/Operaciones'
import Clientes from './pages/Clientes'
import Reportes from './pages/Reportes'
import Usuarios from './pages/Usuarios'
import Ayuda from './pages/Ayuda'


function App() {
  return (
    <Routes>
      <Route path="/"          element={<Navigate to="/login" />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/register"  element={<Register />} />

      <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
      <Route path="/operaciones"   element={<ProtectedRoute><Operaciones /></ProtectedRoute>} />
      <Route path="/clientes"      element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/reportes"      element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
      <Route path="/ayuda" element={<ProtectedRoute><Ayuda /></ProtectedRoute>} />

      <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
    </Routes>
  )
}

export default App
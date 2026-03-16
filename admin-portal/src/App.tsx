import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AdminHomePage from './pages/AdminHomePage'
import Users from './pages/Users'
import Merchants from './pages/Merchants'
import Transactions from './pages/Transactions'
import Blacklist from './pages/Blacklist'
import Frozen from './pages/Frozen'
import Complaints from './pages/Complaints'
import Invoices from './pages/Invoices'
import Audit from './pages/Audit'
import Settings from './pages/Settings'
import Team from './pages/Team'
import StaffProfile from './pages/StaffProfile'
import Messages from './pages/Messages'
import ProtectedRoute from './components/ProtectedRoute'
import { AdminSession, getSession } from './lib/storage'
import { roleAccess } from './lib/rbac'

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const location = useLocation()

  useEffect(() => {
    setSession(getSession())
  }, [location.pathname])

  const allow = (key: string) => session && roleAccess[session.role].includes(key)

  const getUrlRole = () => {
    if (!session) return '';
    return (session.role === 'administrator' || session.role === 'ceo') ? 'admin' : session.role;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<Login isAdminPortal />} />
      
      {/* Role-based routing built with ProtectedRoute wrapper */}
      <Route path="/:role/home" element={<ProtectedRoute session={session} requiredPermission="overview" onLogout={() => setSession(null)}><AdminHomePage /></ProtectedRoute>} />
      <Route path="/:role/users" element={<ProtectedRoute session={session} requiredPermission="users" onLogout={() => setSession(null)}><Users isAdmin={session?.role === 'administrator' || session?.role === 'admin' || session?.isCEO === true} /></ProtectedRoute>} />
      <Route path="/:role/merchants" element={<ProtectedRoute session={session} requiredPermission="merchants" onLogout={() => setSession(null)}><Merchants isAdmin={session?.role === 'administrator' || session?.role === 'admin' || session?.isCEO === true} /></ProtectedRoute>} />
      <Route path="/:role/transactions" element={<ProtectedRoute session={session} requiredPermission="transactions" onLogout={() => setSession(null)}><Transactions /></ProtectedRoute>} />
      <Route path="/:role/blacklist" element={<ProtectedRoute session={session} requiredPermission="blacklist" onLogout={() => setSession(null)}><Blacklist /></ProtectedRoute>} />
      <Route path="/:role/frozen" element={<ProtectedRoute session={session} requiredPermission="frozen" onLogout={() => setSession(null)}><Frozen isAdmin={session?.role === 'administrator' || session?.role === 'admin' || session?.isCEO === true} /></ProtectedRoute>} />
      <Route path="/:role/complaints" element={<ProtectedRoute session={session} requiredPermission="complaints" onLogout={() => setSession(null)}><Complaints /></ProtectedRoute>} />
      <Route path="/:role/invoices" element={<ProtectedRoute session={session} requiredPermission="invoices" onLogout={() => setSession(null)}><Invoices /></ProtectedRoute>} />
      <Route path="/:role/audit" element={<ProtectedRoute session={session} requiredPermission="audit" onLogout={() => setSession(null)}><Audit /></ProtectedRoute>} />
      <Route path="/:role/settings" element={<ProtectedRoute session={session} requiredPermission="settings" onLogout={() => setSession(null)}><Settings /></ProtectedRoute>} />
      <Route path="/:role/team" element={<ProtectedRoute session={session} requiredPermission="team" onLogout={() => setSession(null)}><Team /></ProtectedRoute>} />
      <Route path="/:role/messages" element={<ProtectedRoute session={session} requiredPermission="messages" onLogout={() => setSession(null)}><Messages /></ProtectedRoute>} />
      
      {/* Legacy Redirections */}
      <Route path="/dashboard" element={<Navigate to={session ? `/${getUrlRole()}/home` : '/login'} replace />} />
      <Route path="/dashboard/*" element={<Navigate to={session ? `/${getUrlRole()}/home` : '/login'} replace />} />
      
      <Route path="/staff/:id" element={<ProtectedRoute session={session} requiredPermission="overview" onLogout={() => setSession(null)}><StaffProfile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

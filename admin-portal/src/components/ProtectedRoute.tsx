import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AdminSession } from '../lib/storage'
import { roleAccess } from '../lib/rbac'
import DashboardLayout from './DashboardLayout'

type Props = {
  session: AdminSession | null
  requiredPermission?: string
  children: ReactNode
  onLogout: () => void
}

export default function ProtectedRoute({ session, requiredPermission, children, onLogout }: Props) {
  const location = useLocation()

  // No session, boot to login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Calculate generic URL role ('administrator' and 'ceo' map to 'admin')
  const urlRole = (session.role === 'administrator' || session.role === 'ceo') ? 'admin' : session.role

  // Check if user is locked into their assigned path structure
  if (!location.pathname.startsWith(`/${urlRole}/`)) {
    return <Navigate to={`/${urlRole}/home`} replace />
  }

  // If a specific access key (like 'users' or 'transactions') is needed, verify the role has it
  if (requiredPermission && !roleAccess[session.role].includes(requiredPermission)) {
    return <Navigate to={`/${urlRole}/home`} replace />
  }

  return (
    <DashboardLayout session={session} onLogout={onLogout}>
      {children}
    </DashboardLayout>
  )
}

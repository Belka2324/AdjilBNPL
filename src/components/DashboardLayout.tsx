import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { AdminSession, clearSession } from '../lib/storage'

type Props = {
  session: AdminSession
  children: ReactNode
  onLogout: () => void
}

export default function DashboardLayout({ session, children, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-nexus-bg p-6">
      <div className="grid grid-cols-[280px_1fr] gap-6">
        <Sidebar role={session.role} />
        <div className="flex flex-col gap-6">
          <TopBar
            role={session.role}
            username={session.username}
            onLogout={() => {
              clearSession()
              onLogout()
            }}
          />
          <div className="grid gap-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

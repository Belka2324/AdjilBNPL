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
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div className="flex flex-col gap-6">
          <TopBar
            role={session.role}
            username={session.username}
            isCEO={session.isCEO}
            onLogout={() => {
              clearSession()
              onLogout()
            }}
          />
          <div className="grid gap-6">{children}</div>
        </div>
        <Sidebar role={session.role} />
      </div>
    </div>
  )
}

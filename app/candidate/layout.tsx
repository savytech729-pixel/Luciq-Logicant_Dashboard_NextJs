import { Sidebar } from '@/components/dashboard/Sidebar'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  
  if (!session || session.role !== 'CANDIDATE') {
    redirect('/login')
  }

  if (!session.isOnboarded) {
    redirect('/onboarding')
  }
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar role="CANDIDATE" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Briefcase, LogOut, UserCircle, MonitorPlay, Building2, UserCog, Settings, ShieldCheck, Receipt, Target, BrainCircuit } from 'lucide-react'
import { motion } from 'framer-motion'

interface SidebarProps {
  role: 'ADMIN' | 'CANDIDATE'
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const adminNav = [
    {
      group: 'Core',
      links: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Vacancies', href: '/admin/jobs', icon: Briefcase },
        { name: 'Candidates', href: '/admin/candidates', icon: Users },
        { name: 'My Profile', href: '/admin/profile', icon: UserCircle },
      ]
    },
    {
      group: 'Network',
      links: [
        { name: 'Recruiters', href: '/admin/recruiters', icon: UserCog },
      ]
    },
    {
      group: 'System',
      links: [
        { name: 'Global Settings', href: '/admin/settings', icon: Settings },
      ]
    }
  ]

  const candidateNav = [
    {
      group: 'Opportunities',
      links: [
        { name: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
        { name: 'Available Jobs', href: '/candidate/jobs', icon: Briefcase },
        { name: 'Applied Jobs', href: '/candidate/dashboard#tracker', icon: Target },
        { name: 'Interview Practice', href: '/candidate/prep', icon: BrainCircuit },
      ]
    },
    {
      group: 'My Account',
      links: [
        { name: 'My Resume', href: '/candidate/resume', icon: Briefcase },
        { name: 'Salary Insights', href: '/candidate/market', icon: Receipt },
        { name: 'Settings', href: '/candidate/settings', icon: Settings },
      ]
    }
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col min-h-screen shrink-0 relative z-10">
      <div className="h-20 flex items-center px-8 border-b border-white/5 shrink-0 relative" style={{ background: 'radial-gradient(circle at 0% 50%, rgba(37,99,235,0.1) 0%, transparent 70%)' }}>
        <img src="https://www.luciqandlogicant.com/logo.png" alt="Luciq & Logicant Logo" className="h-12 object-contain relative z-10" />
      </div>
      <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto scrollbar-hide">
        {(role === 'ADMIN' ? adminNav : candidateNav).map((section, sidx) => (
          <div key={sidx} className="space-y-1">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-4 mb-2">{section.group}</h4>
            {section.links.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/candidate/dashboard#tracker' && pathname.startsWith(`${link.href}/`))
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'text-white bg-white/5 shadow-[inset_2px_0_0_#2563eb]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                  )}
                >
                  <link.icon className={cn('mr-3 h-4 w-4 transition-transform group-hover:scale-105', isActive ? 'text-blue-500' : 'text-slate-500')} />
                  <span className="relative z-10">{link.name}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors group"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-500 group-hover:text-red-400 transition-colors" />
          Disconnect
        </button>
      </div>
    </aside>
  )
}

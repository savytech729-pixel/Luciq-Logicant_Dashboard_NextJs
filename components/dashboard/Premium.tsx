'use client'

import { ReactNode } from 'react'

export function PageHero({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string
  title: string
  description?: string
  right?: ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
      <div>
        {eyebrow && <p className="text-xs font-semibold tracking-wide text-blue-400 mb-1">{eyebrow}</p>}
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="text-slate-400 mt-2">{description}</p>}
      </div>
      {right ? <div className="w-full md:w-auto">{right}</div> : null}
    </div>
  )
}

export function SurfaceCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">{children}</label>
}

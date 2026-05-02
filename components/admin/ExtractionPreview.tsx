'use client'

import type { ReactNode } from 'react'
import { FileText, Mail, Phone, MapPin, Briefcase, GraduationCap, Banknote, Clock, Sparkles, AlertTriangle, Link2, Languages, Award, FolderKanban } from 'lucide-react'

export type ExtractionIntelligence = {
  parsingConfidence?: number
  extractedPoints?: string[]
  needsReview?: boolean
  issues?: string[]
}

type Props = {
  data: Record<string, unknown> | null
  intelligence?: ExtractionIntelligence | null
  fileLabel?: string
  compact?: boolean
}

function str(v: unknown, fallback = '—') {
  if (v == null || v === '') return fallback
  return String(v)
}

function skillsList(skills: unknown): string[] {
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean)
  if (typeof skills === 'string') {
    return skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export function ExtractionPreview({ data, intelligence, fileLabel, compact }: Props) {
  if (!data) return null

  const conf = Number(data.parseConfidence ?? intelligence?.parsingConfidence ?? 0)
  const issues = (Array.isArray(data.parseIssues) ? data.parseIssues : intelligence?.issues) as string[] | undefined
  const needsReview = Boolean(data.parseNeedsReview ?? intelligence?.needsReview)
  const points = intelligence?.extractedPoints
  const skills = skillsList(data.skills)

  return (
    <div className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
      {fileLabel && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-2">
          Source · {fileLabel}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parse quality</span>
        <div className="h-2 flex-1 min-w-[120px] max-w-[200px] rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${conf >= 75 ? 'bg-emerald-500' : conf >= 45 ? 'bg-amber-500' : 'bg-red-500/80'}`}
            style={{ width: `${Math.min(100, Math.max(0, conf))}%` }}
          />
        </div>
        <span className="text-sm font-bold text-white tabular-nums">{Math.round(conf)}%</span>
        {needsReview && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
            <AlertTriangle className="h-3 w-3" /> Review
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={str(data.email)} highlight={!data.email} />
        <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={str(data.phone)} />
        <Field icon={<Briefcase className="h-3.5 w-3.5" />} label="Current role" value={str(data.currentRole)} />
        <Field icon={<Clock className="h-3.5 w-3.5" />} label="Total experience" value={str(data.totalExperience, '—') + (data.totalExperience != null && data.totalExperience !== '' ? ' yrs' : '')} />
        <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={str(data.preferredLocation)} />
        <Field icon={<Banknote className="h-3.5 w-3.5" />} label="Expected salary" value={str(data.expectedSalary)} />
        <Field icon={<Clock className="h-3.5 w-3.5" />} label="Notice period" value={str(data.noticePeriod)} />
        <Field icon={<Link2 className="h-3.5 w-3.5" />} label="LinkedIn" value={str(data.linkedInUrl)} wrap />
      </div>

      {skillsList(data.languages).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <Languages className="h-3 w-3 text-sky-400" /> Languages ({skillsList(data.languages).length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skillsList(data.languages).map((lang) => (
              <span key={lang} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-200">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-violet-400" /> Skills ({skills.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {skills.length ? (
            skills.map((s) => (
              <span key={s} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-200">
                {s}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">No skills extracted</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
          <GraduationCap className="h-3 w-3 text-cyan-400" /> Education
        </p>
        <p className="text-sm text-slate-200 leading-relaxed break-words">{str(data.education, 'Not extracted')}</p>
      </div>

      {(data.employmentHistory != null && String(data.employmentHistory).trim() !== '') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
            <Briefcase className="h-3 w-3 text-amber-400" /> Work experience
          </p>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{String(data.employmentHistory)}</p>
        </div>
      )}

      {(data.certifications != null && String(data.certifications).trim() !== '') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
            <Award className="h-3 w-3 text-violet-400" /> Certifications
          </p>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{String(data.certifications)}</p>
        </div>
      )}

      {(data.projects != null && String(data.projects).trim() !== '') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
            <FolderKanban className="h-3 w-3 text-emerald-400" /> Projects
          </p>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{String(data.projects)}</p>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-blue-400" /> Professional summary
        </p>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{str(data.summary, 'Not extracted')}</p>
      </div>

      {points && points.length > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-300/80 mb-2">Extraction notes</p>
          <ul className="space-y-1.5 text-xs text-slate-400">
            {points.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-violet-500 shrink-0">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {issues && issues.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-100/90">
          <p className="font-bold text-amber-200 mb-1">Flags</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Field({
  icon,
  label,
  value,
  highlight,
  wrap,
}: {
  icon: ReactNode
  label: string
  value: string
  highlight?: boolean
  wrap?: boolean
}) {
  return (
    <div className={`rounded-xl border p-2.5 ${highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p
        className={`text-sm font-medium ${wrap ? 'break-all whitespace-pre-wrap' : 'truncate'} ${value === '—' ? 'text-slate-500' : 'text-white'}`}
        title={wrap ? undefined : value}
      >
        {value}
      </p>
    </div>
  )
}

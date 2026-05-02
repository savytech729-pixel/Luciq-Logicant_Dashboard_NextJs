'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHero, SurfaceCard } from '@/components/dashboard/Premium'
import {
  adminWelcomeTemplate,
  candidateAppliedAdminTemplate,
  candidateAppliedTemplate,
  candidateRejectedTemplate,
  candidateScreeningTemplate,
  candidateSelectedTemplate,
  candidateShortlistedTemplate,
  candidateWelcomeTemplate,
  loginOtpTemplate,
  recruiterWelcomeTemplate,
  signupOtpTemplate,
  vacancyCreatedTemplate
} from '@/lib/email/templates'

const previews = [
  { id: 'signup-otp', label: 'Signup OTP', template: signupOtpTemplate('348921') },
  { id: 'login-otp', label: 'Login OTP', template: loginOtpTemplate('629503') },
  { id: 'admin-welcome', label: 'Admin Welcome', template: adminWelcomeTemplate('admin@luciqandlogicant.com') },
  { id: 'candidate-welcome', label: 'Candidate Welcome', template: candidateWelcomeTemplate('Aarav') },
  { id: 'recruiter-welcome', label: 'Recruiter Welcome', template: recruiterWelcomeTemplate('recruiter@luciqandlogicant.com') },
  { id: 'vacancy-created', label: 'Vacancy Created', template: vacancyCreatedTemplate('Senior React Developer', 'admin@luciqandlogicant.com') },
  { id: 'candidate-applied', label: 'Candidate Applied (Candidate)', template: candidateAppliedTemplate('Aarav', 'Senior React Developer') },
  { id: 'candidate-applied-admin', label: 'Candidate Applied (Admin)', template: candidateAppliedAdminTemplate('Aarav', 'aarav@example.com', 'Senior React Developer') },
  { id: 'screening', label: 'Status: Screening', template: candidateScreeningTemplate('Aarav', 'Senior React Developer') },
  { id: 'shortlisted', label: 'Status: Shortlisted', template: candidateShortlistedTemplate('Aarav', 'Senior React Developer') },
  { id: 'selected', label: 'Status: Selected', template: candidateSelectedTemplate('Aarav', 'Senior React Developer') },
  { id: 'rejected', label: 'Status: Rejected', template: candidateRejectedTemplate('Aarav', 'Senior React Developer') },
]

export default function EmailTemplatesPreviewPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <PageHero
        eyebrow="System"
        title="Email Templates Preview"
        description="Visual preview of all transactional templates currently wired in production flows."
        right={
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to settings
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {previews.map((item) => (
          <SurfaceCard key={item.id} className="p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <span className="text-xs text-slate-400 max-w-[55%] truncate">Subject: {item.template.subject}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#090f1a] p-2">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
                Live HTML render
              </div>
              <iframe
                title={item.label}
                srcDoc={item.template.html}
                className="w-full h-[620px] rounded-b-lg bg-slate-950"
              />
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  )
}

import { prisma } from '@/lib/prisma'

export interface NotificationPayload {
  candidateName: string
  jobTitle: string
  phone?: string
  email: string
}

export const commService = {
  async generateInviteTemplate(candidateId: string, jobId: string, channel: 'email' | 'whatsapp') {
    // 1. Fetch Candidate & Job details via raw find for reliability
    const candidateResult = await (prisma as any).$runCommandRaw({
      find: 'Candidate',
      filter: { _id: { $oid: candidateId } },
      limit: 1
    })
    const candidate = (candidateResult as any)?.cursor?.firstBatch?.[0]
    
    const jobResult = await (prisma as any).$runCommandRaw({
      find: 'Job',
      filter: { _id: { $oid: jobId } },
      limit: 1
    })
    const job = (jobResult as any)?.cursor?.firstBatch?.[0]

    if (!candidate || !job) throw new Error('Candidate or Job not found')

    // 2. Map payload
    const payload: NotificationPayload = {
      candidateName: candidate.name,
      jobTitle: job.title,
      phone: candidate.phone,
      email: candidate.email || 'N/A' // Need user email if not on candidate
    }

    // 3. Generate templates
    if (channel === 'whatsapp') {
      return {
        target: payload.phone || 'No Phone Number',
        title: 'WhatsApp Interview Invite',
        message: `Hi ${payload.candidateName}! 👋 This is the Talent Team at EasyHire. 

We loved your AI match score for the ${payload.jobTitle} position and would like to invite you for an interview. 

Are you available this week for a quick chat? Let us know!`,
        actionUrl: `https://wa.me/${payload.phone?.replace('+', '').replace(' ', '')}?text=${encodeURIComponent(`Hi ${payload.candidateName}! This is the Talent Team at EasyHire. We loved your profile for ${payload.jobTitle}...`)}`
      }
    }

    return {
      target: payload.email,
      title: 'Interview Invitation: ' + payload.jobTitle,
      message: `Dear ${payload.candidateName},

I hope this email finds you well.

Our AI screening system has identified your profile as a high-confidence match for the ${payload.jobTitle} requisition at our firm. We were particularly impressed with your expertise and the alignment of your notice period.

Would you be open to a 30-minute virtual technical screener later this week?

Best regards,
The Talent Management Team
EasyHire (Internal Stack)`,
      actionUrl: `mailto:${payload.email}?subject=${encodeURIComponent('Interview Invitation: ' + payload.jobTitle)}&body=${encodeURIComponent(`Dear ${payload.candidateName}, ...`)}`
    }
  },

  async logInvitation(candidateId: string, jobId: string, channel: string) {
    console.log(`[INVITE LOG] ${channel} invitation sent to candidate ${candidateId} for job ${jobId}`)
    // In production, we'd save this to an ActivityLog collection
    return true
  }
}

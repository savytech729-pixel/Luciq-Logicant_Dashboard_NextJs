import { prisma } from '@/lib/prisma'
import { generateOutreachMessage } from '@/lib/ai'

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

    // 3. Generate templates using AI
    const aiMessage = await generateOutreachMessage(candidate, job, channel)
    
    if (aiMessage) {
      return {
        target: channel === 'whatsapp' ? (payload.phone || 'No Phone Number') : payload.email,
        ...aiMessage,
        // Override actionUrls with proper schemes if needed
        actionUrl: channel === 'whatsapp' 
          ? `https://wa.me/${payload.phone?.replace('+', '').replace(' ', '')}?text=${encodeURIComponent(aiMessage.message)}`
          : `mailto:${payload.email}?subject=${encodeURIComponent(aiMessage.title)}&body=${encodeURIComponent(aiMessage.message)}`
      }
    }

    // Fallback if AI fails
    if (channel === 'whatsapp') {
      return {
        target: payload.phone || 'No Phone Number',
        title: 'WhatsApp Interview Invite',
        message: `Hi ${payload.candidateName}! 👋 This is the Talent Team. We loved your match for ${payload.jobTitle}.`,
        actionUrl: `https://wa.me/${payload.phone?.replace('+', '').replace(' ', '')}?text=${encodeURIComponent(`Hi ${payload.candidateName}!`)}`
      }
    }

    return {
      target: payload.email,
      title: 'Interview Invitation: ' + payload.jobTitle,
      message: `Dear ${payload.candidateName}, we loved your profile...`,
      actionUrl: `mailto:${payload.email}`
    }
  },

  async logInvitation(candidateId: string, jobId: string, channel: string) {
    console.log(`[INVITE LOG] ${channel} invitation sent to candidate ${candidateId} for job ${jobId}`)
    // In production, we'd save this to an ActivityLog collection
    return true
  }
}

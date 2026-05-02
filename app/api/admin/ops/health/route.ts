import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { env } from '@/lib/env'
import { getAiSpendMetrics } from '@/lib/ai'
import { isOcrConfigured } from '@/lib/ocr'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ai = getAiSpendMetrics()
    return NextResponse.json({
      ocrConfigured: isOcrConfigured(),
      otpEmailConfigured: Boolean(env.BREVO_API_KEY && env.BREVO_FROM_EMAIL),
      alertSlackConfigured: Boolean(env.ALERT_SLACK_WEBHOOK_URL),
      alertEmailConfigured: Boolean(env.ALERT_EMAIL_TO),
      aiFallbackCount: ai.fallbackCount,
      aiCallsUsed: ai.callsUsed,
      aiCallsRemaining: ai.callsRemaining,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

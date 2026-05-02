import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { parseResume } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestId, logError, logInfo } from '@/lib/logger'
import { extractTextWithDocumentAi } from '@/lib/ocr'
import { sendOperationalAlert } from '@/lib/alerts'
import { normalizeCvMimeType } from '@/lib/cv-mime'

/** OCR + Gemini can exceed default serverless limits on large PDFs. */
export const maxDuration = 300

// POST /api/admin/candidates/screen
// Intelligent Simulation of CV Extraction with Document Awareness
export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const limiter = checkRateLimit({ key: `admin-screen:${session.id}`, limit: 600, windowMs: 60_000 })
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many resume screening requests. Try again shortly.' }, { status: 429 })
    }

    const { fileName, fileSize, content, fileData } = await req.json()

    if (!fileName) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (fileData && (!fileData.base64 || !fileData.mimeType)) {
      return NextResponse.json({ error: 'Invalid file payload' }, { status: 400 })
    }

    if (!content && !fileData) {
      return NextResponse.json({ error: 'No parseable resume content provided' }, { status: 400 })
    }

    // 1. Intelligence: Detect Non-CV Documents
    const lowerName = fileName.toLowerCase()
    const suspiciousKeywords = ['invoice', 'receipt', 'bill', 'payment', 'transfer', 'salary_slip']
    const isSuspicious = suspiciousKeywords.some(kw => lowerName.includes(kw))

    if (isSuspicious) {
      return NextResponse.json({
        type: 'INVALID_DOCUMENT',
        message: 'Document type mismatch detected. This file appears to be a financial record (Invoice/Receipt) rather than a Professional Resume/CV.',
        confidence: 0.12,
        recommendation: 'Please upload a valid Curriculum Vitae in PDF or DOCX format.'
      }, { status: 422 })
    }


    // 2. OCR-first extraction for uploaded documents
    let normalizedContent = content || ''
    let usedOcr = false
    let ocrNote = ''
    const fileDataForAi =
      fileData?.base64 && fileData?.mimeType
        ? { ...fileData, mimeType: normalizeCvMimeType(fileName, fileData.mimeType) }
        : undefined

    if (fileDataForAi?.base64 && fileDataForAi?.mimeType) {
      try {
        const ocr = await extractTextWithDocumentAi(fileDataForAi.base64, fileDataForAi.mimeType)
        if (ocr.usedOcr && ocr.text) {
          normalizedContent = ocr.text
          usedOcr = true
        } else if (!ocr.usedOcr && ocr.reason) {
          ocrNote = ocr.reason
        }
      } catch (ocrErr: any) {
        ocrNote = `OCR failed: ${ocrErr?.message || 'unknown error'}`
        void sendOperationalAlert('OCR failure', `RequestId: ${requestId}\nFile: ${fileName}\nError: ${ocrErr?.message || 'unknown error'}`)
      }
    }

    // 3. Real AI Resume Parsing
    const extraction = await parseResume(fileName, normalizedContent, fileDataForAi)

    if (!extraction) {
      return NextResponse.json({ 
        error: 'AI Parsing failed', 
        details: 'The AI model could not process this document. It might be too large or have an unsupported format.',
        requestId
      }, { status: 500 })
    }
    logInfo('Resume screened successfully', { route: '/api/admin/candidates/screen', requestId, userId: session.id, meta: { fileName } })

    return NextResponse.json({
      type: 'RESUME',
      candidate: extraction,
      requestId,
      intelligence: {
        parsingConfidence: extraction.parseConfidence ?? 0.7,
        extractedPoints: [
          `Real-time AI extraction successful for ${extraction.name}.`,
          usedOcr ? 'Google Document AI OCR used for text extraction.' : (ocrNote || 'Direct parser path used (OCR skipped).'),
          `Identified core expertise in ${extraction.skills?.slice(0, 3).join(', ')}.`,
          `Detected experience level: ${extraction.totalExperience}.`,
          ...(extraction.parseNeedsReview ? [`Flagged for review: ${(extraction.parseIssues || []).join(', ')}`] : [])
        ],
        needsReview: extraction.parseNeedsReview || false,
        issues: extraction.parseIssues || []
      }
    })
  } catch (err: any) {
    logError('Resume screening failed', { route: '/api/admin/candidates/screen', requestId }, err)
    return NextResponse.json({ 
      error: 'Server Error', 
      details: err.message,
      requestId,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
}

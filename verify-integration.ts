import { prisma } from './lib/prisma'
import { candidateService } from './lib/services/candidate.service'
import { talentService } from './lib/services/talent.service'

async function verifySync() {
  console.log('--- Platform Integration Audit ---')
  
  // 1. Find a test candidate
  const candidate = await prisma.candidate.findFirst()
  if (!candidate) {
    console.log('❌ No candidates found to test.')
    return
  }
  
  console.log(`Found candidate: ${candidate.name} (ID: ${candidate.id})`)
  
  // 2. Mock a portal update (Adding a unique skill)
  const uniqueSkill = `Neural-Sync-${Date.now()}`
  console.log(`Simulating Candidate portal update: Adding skill "${uniqueSkill}"...`)
  
  await candidateService.updateProfile(candidate.userId, {
    skills: [...(candidate.skills as string[]), uniqueSkill]
  })
  
  // 3. Verify in Admin Talent Database
  console.log('Verifying in Admin Talent Service...')
  const adminCandidates = await talentService.getAllCandidates()
  const updatedCandidate = adminCandidates.find((c: any) => c.id === candidate.id)
  
  if (updatedCandidate?.skills.includes(uniqueSkill)) {
    console.log('✅ SYNC VERIFIED: Admin portal sees the Candidate\'s updates immediately.')
  } else {
    console.log('❌ SYNC FAILED: Admin portal does not reflect Candidate updates.')
  }

  // 4. Test Job Matching
  const job = await prisma.job.findFirst()
  if (job) {
    console.log(`Testing AI Matcher for Job: ${job.title}...`)
    const matches = await talentService.matchCandidatesForJob(job.id)
    console.log(`✅ MATCHING ENGINE: Found ${matches.matchedCandidates.length} potential matches for this job.`)
  }
}

verifySync().catch(console.error).finally(() => prisma.$disconnect())

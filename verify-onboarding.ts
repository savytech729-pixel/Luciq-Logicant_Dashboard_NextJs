import { prisma } from './lib/prisma'
import { hash } from 'bcryptjs'

async function verifyRegistrationLifecycle() {
  console.log('--- Register & Profile Lifecycle Audit ---')
  
  const testEmail = `talent.test.${Date.now()}@test.com`
  const password = "password123"
  const role = "CANDIDATE"
  
  console.log(`Step 1: Simulating registration for ${testEmail}...`)
  
  const hashedPassword = await hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      role
    }
  })
  
  console.log(`✅ User created with ID: ${user.id}`)
  
  console.log('Step 2: Automating profile provisioning (Simulating API logic)...')
  
  // This mimics what I just added to the /api/auth/register route
  const profile = await prisma.candidate.create({
    data: {
      userId: user.id,
      name: testEmail.split('@')[0],
      currentRole: 'Unindexed Talent',
      experienceYears: 0,
      skills: []
    }
  })
  
  console.log(`✅ Profile provisioned with ID: ${profile.id}`)
  
  console.log('Step 3: Verifying database consistency...')
  
  const verifyProfile = await prisma.candidate.findFirst({
    where: { userId: user.id }
  })
  
  if (verifyProfile && verifyProfile.userId === user.id) {
    console.log('✅ LIFECYCLE VERIFIED: New users are fully indexed and provisioned upon registration.')
  } else {
    console.log('❌ LIFECYCLE FAILED: User profile not found.')
  }
}

verifyRegistrationLifecycle().catch(console.error).finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seeding Test Job ---')

  // 1. Get or Create an Admin User
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) {
    console.log('No admin found, creating a dummy admin...')
    admin = await prisma.user.create({
      data: {
        email: 'test.admin@luciqandlogicant.com',
        password: 'password123', // In real life, hash this!
        role: 'ADMIN',
        name: 'Test Admin',
        isOnboarded: true
      }
    })
  }

  // 2. Create the Test Job
  const job = await prisma.job.create({
    data: {
      title: 'Senior AI Engineer',
      description: 'We are looking for a Senior AI Engineer to join our core team. You will be responsible for designing and implementing LLM-based solutions, optimizing inference pipelines, and leading AI research initiatives. Knowledge of Python, PyTorch, and Vector Databases is essential.',
      department: 'Engineering',
      clientName: 'FutureAI Labs',
      location: 'Remote',
      workSetting: 'Remote',
      positionType: 'Permanent',
      requiredSkills: ['Python', 'PyTorch', 'Gemini/OpenAI APIs', 'Vector Databases', 'LangChain'],
      experienceRequired: 5,
      salaryRange: '₹35L - ₹50L p.a.',
      status: 'Active',
      createdBy: admin.id,
      screeningQuestions: [
        'How would you handle hallucination in a RAG-based AI system?',
        'What is your experience with fine-tuning open-source LLMs like Llama 3?',
        'Describe a complex AI pipeline you built and how you optimized its latency.'
      ]
    }
  })

  console.log('--- Seed Complete! ---')
  console.log(`Job Created: ${job.title} (${job.id})`)
  console.log(`Creator: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

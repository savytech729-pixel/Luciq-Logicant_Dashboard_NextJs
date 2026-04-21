import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing database...')
  await prisma.invoice.deleteMany()
  await prisma.placement.deleteMany()
  await prisma.client.deleteMany()
  await prisma.job.deleteMany()
  await prisma.candidate.deleteMany()
  await prisma.user.deleteMany()

  console.log('Creating Admin User...')
  const adminPassword = await hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@aitalent.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  console.log('Creating Admin Jobs...')
  await prisma.job.create({
    data: {
      title: 'Data Center Architect',
      description: 'We are seeking an experienced Data Center Architect to design, implement, and run our enterprise data center and cloud infrastructure. You will architect network topologies, manage global traffic through BGP/OSPF, and ensure enterprise-level virtualization uptime.',
      requiredSkills: ['Data Center Architecture', 'Cisco Nexus', 'VMware', 'AWS', 'BGP', 'OSPF', 'Network Design'],
      experienceRequired: 15,
      location: 'Hybrid / Silicon Valley',
      createdBy: adminUser.id
    }
  })

  await prisma.job.create({
    data: {
      title: 'Senior Network Engineer',
      description: 'Join our core infrastructure team as a Senior Network Engineer. You will design, build, and maintain scalable networking solutions and RESTful routing, optimizing for massive concurrency and low-latency metrics.',
      requiredSkills: ['Cisco Nexus', 'BGP', 'OSPF', 'Palo Alto', 'Routing', 'Switching'],
      experienceRequired: 8,
      location: 'Remote',
      createdBy: adminUser.id
    }
  })
  await prisma.job.create({
    data: {
      title: 'Cloud Security Engineer',
      description: 'Implement and monitor security measures for the protection of computer systems, networks and information. Design cloud security architecture and manage Palo Alto firewalls within enterprise setups.',
      requiredSkills: ['Palo Alto', 'Cloud Security', 'Network Security', 'Firewalls', 'AWS'],
      experienceRequired: 6,
      location: 'Remote',
      createdBy: adminUser.id
    }
  })

  await prisma.job.create({
    data: {
      title: 'Data Center Optimization Lead',
      description: 'Analyze and optimize data center performance. Focus on reducing latency, improving SAN storage efficiency, and leading migration efforts across large-scale VMware environments.',
      requiredSkills: ['Data Center', 'VMware', 'SAN', 'Storage', 'Virtualization'],
      experienceRequired: 10,
      location: 'Austin, TX',
      createdBy: adminUser.id
    }
  })

  await prisma.job.create({
    data: {
      title: 'Network Automation Engineer',
      description: 'Drive the automation of network provisioning and management using Ansible, Python, and CI/CD pipelines in a hybrid cloud data center environment.',
      requiredSkills: ['Ansible', 'Python', 'Linux', 'Network Automation', 'BGP'],
      experienceRequired: 5,
      location: 'Seattle, WA',
      createdBy: adminUser.id
    }
  })
  console.log('Seeding completed! ✅')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

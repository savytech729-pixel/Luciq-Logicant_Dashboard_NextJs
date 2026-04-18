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
  console.log('Creating Candidates...')
  const mockCandidates = [
    { name: 'Abhinandan Verma', exp: 7, role: 'Cloud Infrastructure Engineer', skills: ['AWS', 'Data Center', 'Linux', 'Ansible'] },
    { name: 'Akashdeep Bhagat', exp: 20, role: 'Senior Network Architect', skills: ['Cisco Nexus', 'BGP', 'OSPF', 'Data Center'] },
    { name: 'Pardeep Dhiman', exp: 20, role: 'Data Center Architect', skills: ['Data Center Architecture', 'Cisco Nexus', 'VMware', 'AWS', 'Network Design'] },
    { name: 'K Kiran Kumar', exp: 20, role: 'Data Center Architect', skills: ['VMware', 'Cloud Infrastructure', 'Network Security', 'Routing'] },
    { name: 'Ritesh Kumar', exp: 20, role: 'Lead Network Engineer', skills: ['Cisco ACI', 'BGP', 'OSPF', 'Data Center'] },
    { name: 'Rohit Roy', exp: 17, role: 'Data Center Specialist', skills: ['SAN', 'Storage', 'Virtualization', 'VMware'] },
    { name: 'Rohitendrasingh', exp: 18, role: 'Network Security Architect', skills: ['Palo Alto', 'Cisco Firepower', 'Data Center', 'BGP'] },
    { name: 'Saurabh Giri', exp: 8, role: 'Network Engineer', skills: ['CCNP', 'Routing', 'Switching', 'Data Center'] },
    { name: 'Kamal Kant', exp: 18, role: 'Cloud Network Architect', skills: ['AWS', 'Azure', 'Data Center', 'BGP'] },
    { name: 'Mayur Tayal', exp: 16, role: 'Data Protection Architect', skills: ['Backup Solutions', 'Disaster Recovery', 'Storage', 'VMware'] }
  ]

  for (const c of mockCandidates) {
    const pwd = await hash('password123', 10)
    const u = await prisma.user.create({
      data: {
        email: `${c.name.split(' ')[0].toLowerCase()}@example.com`,
        password: pwd,
        role: 'CANDIDATE'
      }
    })

    await prisma.candidate.create({
      data: {
        userId: u.id,
        name: c.name,
        experienceYears: c.exp,
        currentRole: c.role,
        skills: c.skills
      }
    })
  }

  console.log('Creating Clients...')
  const client1 = await prisma.client.create({
    data: { name: 'Acme Corp', region: 'US-East', plan: 'Enterprise', status: 'Active' }
  })
  const client2 = await prisma.client.create({
    data: { name: 'GlobalX Analytics', region: 'EU-Central', plan: 'Pro', status: 'Active' }
  })
  const client3 = await prisma.client.create({
    data: { name: 'Quantum Finance', region: 'US-West', plan: 'Enterprise', status: 'Active' }
  })

  console.log('Creating Placements...')
  // Select some candidates for placements
  const pardeep = await prisma.candidate.findFirst({ where: { name: 'Pardeep Dhiman' } })
  const akashdeep = await prisma.candidate.findFirst({ where: { name: 'Akashdeep Bhagat' } })
  const rohit = await prisma.candidate.findFirst({ where: { name: 'Rohit Roy' } })
  
  const datacentreJob = await prisma.job.findFirst({ where: { title: 'Data Center Architect' } })
  const networkJob = await prisma.job.findFirst({ where: { title: 'Senior Network Engineer' } })
  const optimizationJob = await prisma.job.findFirst({ where: { title: 'Data Center Optimization Lead' } })

  if (pardeep && datacentreJob && client1) {
    const pl = await prisma.placement.create({
      data: {
        candidateId: pardeep.id,
        jobId: datacentreJob.id,
        clientId: client1.id,
        candidateName: pardeep.name,
        jobTitle: datacentreJob.title,
        clientName: client1.name,
        hireDate: new Date('2026-03-12'),
        baseSalary: 185000,
        feePercentage: 20,
        status: 'PAID'
      }
    })
    await prisma.invoice.create({
       data: { placementId: pl.id, amount: 37000, status: 'PAID' }
    })
  }

  if (akashdeep && networkJob && client2) {
    await prisma.placement.create({
      data: {
        candidateId: akashdeep.id,
        jobId: networkJob.id,
        clientId: client2.id,
        candidateName: akashdeep.name,
        jobTitle: networkJob.title,
        clientName: client2.name,
        hireDate: new Date('2026-04-05'),
        baseSalary: 210000,
        feePercentage: 22,
        status: 'UNBILLED'
      }
    })
  }

  if (rohit && optimizationJob && client3) {
    const pl = await prisma.placement.create({
      data: {
        candidateId: rohit.id,
        jobId: optimizationJob.id,
        clientId: client3.id,
        candidateName: rohit.name,
        jobTitle: optimizationJob.title,
        clientName: client3.name,
        hireDate: new Date('2026-04-10'),
        baseSalary: 145000,
        feePercentage: 18,
        status: 'PENDING'
      }
    })
    await prisma.invoice.create({
        data: { placementId: pl.id, amount: 26100, status: 'PENDING' }
    })
  }

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

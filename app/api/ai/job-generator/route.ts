import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await req.json()
    if (!title) {
      return NextResponse.json({ error: 'Title required for generation' }, { status: 400 })
    }

    // SIMULATE AI DELAY
    await new Promise(r => setTimeout(r, 2000))

    const ltitle = title.toLowerCase()
    let description = ''
    let skills = 'React, Node.js, SQL'
    let exp = 3 // default

    if (ltitle.includes('architect') || ltitle.includes('data center') || ltitle.includes('cloud')) {
      description = `We are seeking an experienced ${title} to design, implement, and run our enterprise data center and cloud infrastructure. You will architect network topologies, manage global traffic through BGP/OSPF, and ensure enterprise-level virtualization uptime.`
      skills = 'Data Center Architecture, Cisco Nexus, VMware, AWS, BGP, OSPF, Network Design'
      exp = 15
    } else if (ltitle.includes('frontend') || ltitle.includes('ui')) {
      description = `We are seeking a high-impact ${title} to spearhead our client-facing web architecture. You will be responsible for translating design wireframes into highly performant, accessible code. Expect to work deeply with modern component frameworks and state management mechanisms.`
      skills = 'React, TypeScript, TailwindCSS, Next.js'
      exp = 4
    } else if (ltitle.includes('backend') || ltitle.includes('api')) {
      description = `Join our core infrastructure team as a ${title}. You will design, build, and maintain scalable microservices and RESTful APIs, optimizing for massive concurrency and low-latency database queries.`
      skills = 'Node.js, PostgreSQL, Docker, Redis, AWS'
      exp = 5
    } else if (ltitle.includes('data') || ltitle.includes('machine learning')) {
      description = `As a ${title}, you will dive deep into our analytics pipeline, constructing predictive models and automating data ingestion vectors. We need someone passionate about massive datasets.`
      skills = 'Python, TensorFlow, SQL, Spark, Pandas'
      exp = 3
    } else {
      description = `We are looking for a versatile ${title} to join our fast-paced tech division. This role requires cross-functional collaboration and a strong problem-solving mindset to tackle complex abstract technical challenges.`
      skills = 'JavaScript, SQL, Cloud Architecture, Agile methodologies'
      exp = 2
    }

    if (ltitle.includes('senior') || ltitle.includes('lead')) {
      exp += 3
      description += ' Must be capable of mentoring junior engineers and leading system design review matrices.'
    }

    return NextResponse.json({
      title,
      description,
      skills,
      experience: exp
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

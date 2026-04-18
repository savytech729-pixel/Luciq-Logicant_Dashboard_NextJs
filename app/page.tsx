'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BrainCircuit, Users, Building2, ShieldCheck, ChevronRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Navigation Header */}
      <header className="absolute top-0 w-full p-6 z-50 flex justify-between items-center bg-transparent">
         <img src="https://www.luciqandlogicant.com/logo.png" alt="Luciq & Logicant Logo" className="h-10 object-contain" />
         <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 px-4">Sign In</Link>
            <Link href="/register" className="bg-white text-black text-sm font-bold py-2 px-5 rounded-full hover:bg-slate-200 transition-colors">Get Started</Link>
         </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_40%,#000_10%,transparent_100%)] pointer-events-none z-0" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
           <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
             className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-5 py-2 backdrop-blur-md mb-8"
           >
             <BrainCircuit className="h-4 w-4 text-blue-400" />
             <span className="text-sm font-semibold text-blue-200">The Neural Recruitment Engine</span>
           </motion.div>

           <motion.h1 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
             className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6"
           >
             Hiring Intelligence,<br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-white">
               Automated at Scale.
             </span>
           </motion.h1>
           
           <motion.p 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
             className="text-lg md:text-xl text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed mb-10"
           >
             We deploy state-of-the-art NLP models to instantly parse unstructured resumes, conduct automated technical interviews, and precision-match top global talent to complex enterprise requisitions.
           </motion.p>
           
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
             className="flex flex-col sm:flex-row gap-5 justify-center"
           >
             <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-8 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center w-full sm:w-auto">
                 Deploy Enterprise Hub <ArrowRight className="ml-2 w-5 h-5" />
             </Link>
             <Link href="/login" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium py-4 px-8 rounded-full transition-all flex items-center justify-center w-full sm:w-auto">
                 Access Candidate Portal
             </Link>
           </motion.div>
        </div>
      </section>

      {/* Tri-Pillar Architecture Section */}
      <section className="py-24 px-4 bg-white/[0.01] border-y border-white/5 relative">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-bold mb-4">A Tri-Pillar Architecture</h2>
               <p className="text-slate-400 max-w-2xl mx-auto">Designed from the ground up to serve the entire corporate hiring ecosystem seamlessly.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {/* 1. Candidate Advantage */}
               <div className="bg-[#0A0A0A] border border-white/5 hover:border-blue-500/30 p-8 rounded-3xl transition-colors group">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Users className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Candidate Intelligence</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                     Applicants don't fill out forms. They drop their unstructured CVs into our Neural Parser, chat with our AI Career Coach, and take automated Mock Technical Interviews that grade them in real-time.
                  </p>
                  <Link href="/register" className="text-blue-400 font-semibold flex items-center group-hover:text-blue-300">
                     Join Talent Pool <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>

               {/* 2. Admin Command */}
               <div className="bg-[#0A0A0A] border border-white/5 hover:border-purple-500/30 p-8 rounded-3xl transition-colors group">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <ShieldCheck className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Admin Telemetry</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                     Recruiters utilize a high-density, automated Command Center. Generate complex job requisitions explicitly via our AI generator, and use the Rapid Screener to instantly score candidates via mathematical vector mapping.
                  </p>
                  <Link href="/login" className="text-purple-400 font-semibold flex items-center group-hover:text-purple-300">
                     Access Admin Portal <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>

               {/* 3. Client Tenants */}
               <div className="bg-[#0A0A0A] border border-white/5 hover:border-emerald-500/30 p-8 rounded-3xl transition-colors group">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Building2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Enterprise SaaS Hub</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                     Scaling an agency? Deploy satellite instances for your clients globally. Our Multi-Tenant architecture supports full white-labeling, Single Sign-On (SAML/OAuth), and active Role-Based Access Control pipelines.
                  </p>
                  <Link href="/login" className="text-emerald-400 font-semibold flex items-center group-hover:text-emerald-300">
                     Manage Global Clients <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>
            </div>
         </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm">
         <p>© {new Date().getFullYear()} Luciq & Logicant IT Services. All architectural rights reserved.</p>
      </footer>
    </div>
  )
}

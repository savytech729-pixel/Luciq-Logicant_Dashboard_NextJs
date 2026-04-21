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
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 px-4">Login</Link>
            <Link href="/register" className="bg-white text-black text-sm font-bold py-2 px-6 rounded-full hover:bg-slate-200 transition-colors">Register</Link>
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
             <span className="text-sm font-semibold text-blue-200">AI-Powered Recruitment Platform</span>
           </motion.div>

           <motion.h1 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
             className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6"
           >
             The Smart Way to Hire<br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-white">
               and Get Hired.
             </span>
           </motion.h1>
           
           <motion.p 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
             className="text-lg md:text-xl text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed mb-10"
           >
             Our AI helps recruiters find the perfect candidates and helps job seekers find their dream roles in seconds. No complex forms, just smart matching.
           </motion.p>
           
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
             className="flex flex-col sm:flex-row gap-5 justify-center"
           >
             <Link href="/register?role=ADMIN" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-8 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center w-full sm:w-auto">
                 Recruiter Portal <ArrowRight className="ml-2 w-5 h-5" />
             </Link>
             <Link href="/register?role=CANDIDATE" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium py-4 px-8 rounded-full transition-all flex items-center justify-center w-full sm:w-auto">
                 Candidate Portal
             </Link>
           </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white/[0.01] border-y border-white/5 relative">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Everyone</h2>
               <p className="text-slate-400 max-w-2xl mx-auto">A seamless experience for candidates, recruiters, and companies alike.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {/* 1. Candidate */}
               <div className="bg-[#0A0A0A] border border-white/5 hover:border-blue-500/30 p-8 rounded-3xl transition-colors group">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Users className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">For Candidates</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                     Simply upload your resume and let our AI do the work. Get matched with jobs that fit your skills and complete a quick AI screening to stand out.
                  </p>
                  <Link href="/register" className="text-blue-400 font-semibold flex items-center group-hover:text-blue-300">
                     Find a Job <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>

               {/* 2. Recruiter */}
               <div className="bg-[#0A0A0A] border border-white/5 hover:border-purple-500/30 p-8 rounded-3xl transition-colors group">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <ShieldCheck className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">For Recruiters</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                     Manage your entire hiring pipeline in one place. Use AI to instantly screen thousands of resumes and find the top talent for any vacancy.
                  </p>
                  <Link href="/login" className="text-purple-400 font-semibold flex items-center group-hover:text-purple-300">
                     Start Hiring <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>

               {/* 3. Business */}
               <div className="bg-[#0A0A0A] border border-white/5 hover:border-emerald-500/30 p-8 rounded-3xl transition-colors group">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Building2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">For Businesses</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                     Scalable hiring solutions for growing companies. Automate your recruitment process and make data-driven hiring decisions with ease.
                  </p>
                  <Link href="/login" className="text-emerald-400 font-semibold flex items-center group-hover:text-emerald-300">
                     Learn More <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>
            </div>
         </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm">
         <p>© {new Date().getFullYear()} Luciq & Logicant IT Services. All rights reserved.</p>
      </footer>
    </div>
  )
}

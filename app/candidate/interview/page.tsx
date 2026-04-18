'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MonitorPlay, Send, User, ChevronRight, CheckCircle2 } from 'lucide-react'

export default function CandidateInterview() {
  const [activeJob, setActiveJob] = useState<string | null>(null)
  const [sessionState, setSessionState] = useState<'idle' | 'interviewing' | 'completed'>('idle')
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages])

  const jobs = [
    { id: '1', title: 'Senior Backend Engineer', focus: 'System Design & Node.js' },
    { id: '2', title: 'Frontend Team Lead', focus: 'React, State Management & Architecture' }
  ]

  const startInterview = (jobTitle: string) => {
    setActiveJob(jobTitle)
    setSessionState('interviewing')
    setMessages([
      { role: 'ai', content: `Hello! I am the automated technical recruiter for the ${jobTitle} position. Before we bring you in for human loops, I'd like to ask a technical screening question.` },
      { role: 'ai', content: `Can you explain your approach to handling massive concurrency and preventing race conditions in a production web application?` }
    ])
  }

  const handleSend = () => {
    if (!input.trim()) return
    const userAns = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userAns }])
    setIsTyping(true)

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', content: '' }])
      
      const feedback = "Excellent answer. Leveraging atomic locks or distinct queuing mechanisms (like Redis/Kafka) is exactly what we look for in our High-Throughput architectural teams. I'm assigning your technical screen a passing grade."
      
      let charIndex = 0
      const streamingInterval = setInterval(() => {
        if (charIndex < feedback.length) {
          const char = feedback[charIndex]
          setMessages(prev => {
            const newArr = [...prev]
            newArr[newArr.length - 1].content += char
            return newArr
          })
          charIndex++
        } else {
          clearInterval(streamingInterval)
          setIsTyping(false)
          
          setTimeout(() => {
             setSessionState('completed')
             setScore(94)
          }, 2000)
        }
      }, 30)

    }, 1500)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 h-full flex flex-col pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
          <MonitorPlay className="w-8 h-8 mr-3 text-blue-500" /> AI Mock Interviews
        </h1>
        <p className="text-slate-400">Practice technical screens or take mandatory pre-qualification tests.</p>
      </div>

      {sessionState === 'idle' && (
        <div className="grid md:grid-cols-2 gap-6">
           {jobs.map(job => (
              <Card key={job.id} onClick={() => startInterview(job.title)} className="glass-card cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.04] transition-all group">
                 <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{job.title}</h3>
                       <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                          <ChevronRight className="w-4 h-4 text-white" />
                       </div>
                    </div>
                    <p className="text-sm text-slate-400">Focus Area: <span className="text-slate-200">{job.focus}</span></p>
                 </CardContent>
              </Card>
           ))}
        </div>
      )}

      {sessionState === 'interviewing' && (
        <Card className="glass-card flex-1 flex flex-col h-[600px] border-blue-500/20">
          <CardHeader className="border-b border-white/5 bg-white/[0.01]">
             <CardTitle className="text-lg text-white font-medium flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-3 shadow-[0_0_8px_#ef4444]" />
                Technical Screen: {activeJob}
             </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
             {messages.map((m, idx) => (
                <div key={idx} className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                   <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-white/10 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'}`}>
                     {m.role === 'user' ? <User className="w-5 h-5" /> : <MonitorPlay className="w-5 h-5" />}
                   </div>
                   <div className={`p-4 rounded-xl max-w-[80%] text-sm md:text-base leading-relaxed tracking-wide ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-white rounded-tr-none' : 'bg-transparent text-slate-200'}`}>
                     {m.content}
                     {m.role === 'ai' && m.content === '' && isTyping && (
                        <span className="flex space-x-1 items-center h-5 opacity-70">
                           <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                           <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                           <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                        </span>
                     )}
                   </div>
                </div>
             ))}
             <div ref={bottomRef} />
          </CardContent>
          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
             <div className="relative">
               <textarea 
                 value={input} 
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                 }}
                 placeholder="Type your technical response..." 
                 rows={3}
                 className="w-full bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all resize-none pr-14"
               />
               <button 
                 onClick={handleSend}
                 disabled={isTyping || !input.trim()}
                 className="absolute right-3 bottom-3 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
               >
                 <Send className="w-4 h-4" />
               </button>
             </div>
          </div>
        </Card>
      )}

      {sessionState === 'completed' && (
        <Card className="glass-card text-center py-20 px-4 space-y-6">
           <div className="w-24 h-24 rounded-full bg-blue-600/10 border border-blue-500/20 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-blue-400" />
           </div>
           <div>
             <h2 className="text-3xl font-bold text-white mb-2">Screening Completed</h2>
             <p className="text-slate-400 max-w-lg mx-auto">Your technical response vectors have been compiled and sent to the administrator panel for review.</p>
           </div>
           
           <div className="inline-block p-6 rounded-2xl bg-white/[0.02] border border-white/5 mt-8 min-w-[250px]">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Autograded Score</p>
              <div className="text-5xl font-bold text-blue-400">{score}<span className="text-2xl text-slate-500">/100</span></div>
           </div>

           <div className="pt-8">
              <button onClick={() => setSessionState('idle')} className="btn-primary">
                 Return to Hub
              </button>
           </div>
        </Card>
      )}
    </div>
  )
}

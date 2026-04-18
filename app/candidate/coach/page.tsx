'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BrainCircuit, Send, User } from 'lucide-react'

export default function CandidateCoachChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello model. I am ready to process your career vector. What would you like to ask regarding your skill matrix or trajectory?" }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const query = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query }])
    setIsLoading(true)
    
    // Simulate API Network Delay
    setTimeout(() => {
      let aiResponseStr = ''
      const lowerQuery = query.toLowerCase()

      if (lowerQuery.includes('salary') || lowerQuery.includes('pay')) {
        aiResponseStr = "Based on market heuristics, adding full-stack capabilities to your vector would yield an estimated 15-20% compensation premium over current baselines."
      } else if (lowerQuery.includes('resume') || lowerQuery.includes('experience')) {
        aiResponseStr = "Your experience map is well-ordered. However, quantifying your bullet points with performance percentages (e.g. 'improved latency by 45%') increases semantic indexing weight."
      } else if (lowerQuery.includes('job') || lowerQuery.includes('hire')) {
        aiResponseStr = "There is currently high statistical demand for React engineers with strong typing paradigms. Ensure TypeScript is explicitly tagged in your profile schema."
      } else {
        aiResponseStr = "Interesting input. My models recommend continuously polling the Job Explorer matrix to align your skill graph against real-time active requisitions."
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]) // Empty for streaming effect
      
      // Artificial streaming effect
      let charIndex = 0
      const streamingInterval = setInterval(() => {
        if (charIndex < aiResponseStr.length) {
          const char = aiResponseStr[charIndex]
          setMessages(prev => {
            const newArr = [...prev]
            newArr[newArr.length - 1].content += char
            return newArr
          })
          charIndex++
        } else {
          clearInterval(streamingInterval)
          setIsLoading(false)
        }
      }, 20)

    }, 800)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-100px)] flex flex-col pt-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center">
          <BrainCircuit className="w-8 h-8 mr-3 text-blue-500" /> Career Coach Bot
        </h1>
        <p className="text-slate-400">Conversational graph analysis connected to your profile.</p>
      </div>

      <Card className="glass-card flex-1 flex flex-col overflow-hidden border-white/10 mt-4 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none" />
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative z-10">
          {messages.map((m, idx) => (
             <div key={idx} className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-white/10 text-white' : 'bg-blue-600/20 text-blue-400'}`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-xl max-w-[80%] text-sm md:text-base leading-relaxed tracking-wide ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-white rounded-tr-none' : 'bg-blue-900/10 border border-blue-500/20 text-slate-200 rounded-tl-none'}`}>
                  {m.content}
                   {m.role === 'assistant' && m.content === '' && (
                      <span className="flex space-x-1 items-center h-5">
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
             <input 
               value={input} 
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Query your career trajectory..." 
               className="w-full bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 px-4 py-4 rounded-xl outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all pr-14"
             />
             <button 
               onClick={handleSend}
               disabled={isLoading || !input.trim()}
               className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
             >
               <Send className="w-4 h-4" />
             </button>
           </div>
           <p className="text-center text-xs text-slate-600 mt-2">Chat engine parses local profile data to optimize responses.</p>
        </div>
      </Card>
    </div>
  )
}

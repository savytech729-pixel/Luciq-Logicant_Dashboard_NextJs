'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { BrainCircuit, Sparkles, Send, RefreshCcw, ShieldCheck, Zap } from 'lucide-react'

export default function AIPrepLab() {
  const [targetRole, setTargetRole] = useState('Senior AI Engineer')
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const generatePractice = async () => {
    setIsGenerating(true)
    setFeedback(null)
    setQuestions([])
    try {
      // Mocking AI generation for the demo
      setTimeout(() => {
        setQuestions([
          { q: "How do you optimize a transformer model for real-time inference?", type: "TECHNICAL" },
          { q: "Explain the difference between LoRA and Full Fine-tuning.", type: "CORE" },
          { q: "A stakeholder wants to deploy an LLM but is worried about data leakage. What is your strategy?", type: "SCENARIO" }
        ])
        setIsGenerating(false)
      }, 1500)
    } catch (err) {
      setIsGenerating(false)
    }
  }

  const analyzeAnswer = async () => {
    setIsAnalyzing(true)
    try {
      // Mocking AI analysis
      setTimeout(() => {
        setFeedback({
          score: 85,
          sentiment: "STRONG",
          advice: "Excellent technical depth. You correctly identified quantization as a key optimization. Try to mention Flash Attention for even better scoring.",
          strengths: ["Technical Accuracy", "Clarity"],
          improvements: ["Mentioning specific hardware optimizations"]
        })
        setIsAnalyzing(false)
      }, 2000)
    } catch (err) {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">Interview Practice</h1>
          <p className="text-slate-400 font-medium">Practice with the same intelligence that screens you.</p>
        </div>
        <div className="flex gap-2">
           <input 
             type="text" 
             value={targetRole}
             onChange={(e) => setTargetRole(e.target.value)}
             className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 transition-all outline-none"
             placeholder="Target Role..."
           />
           <button 
             onClick={generatePractice}
             disabled={isGenerating}
             className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
           >
             {isGenerating ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
             New Session
           </button>
        </div>
      </div>

      {!questions.length ? (
        <div className="py-20 text-center space-y-6">
           <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-3xl mx-auto flex items-center justify-center">
              <BrainCircuit className="w-10 h-10 text-blue-500 animate-pulse" />
           </div>
           <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-white mb-2">Initialize Practice Sequence</h3>
              <p className="text-slate-500 text-sm">Enter your target role and click "New Session" to generate AI-driven mock questions customized for your background.</p>
           </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-12">
           <div className="md:col-span-7 space-y-6">
              <Card className="glass-card border-blue-500/20 bg-blue-600/[0.02]">
                 <CardHeader>
                    <div className="flex items-center gap-2 mb-4">
                       <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-tighter rounded">Practice Mode</span>
                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
                    </div>
                    <CardTitle className="text-xl text-white leading-relaxed">
                       {questions[currentIdx].q}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <textarea 
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Synthesize your response here..."
                      className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-slate-200 focus:border-blue-500 outline-none transition-all placeholder:text-slate-700 resize-none"
                    />
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] text-slate-600 font-bold uppercase italic">AI is listening...</p>
                       <button 
                         onClick={analyzeAnswer}
                         disabled={isAnalyzing || !answer}
                         className="bg-white text-black text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
                       >
                         {isAnalyzing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                         Evaluate Response
                       </button>
                    </div>
                 </CardContent>
              </Card>

              <div className="flex gap-4">
                 <button 
                   onClick={() => {
                     setCurrentIdx((prev) => (prev > 0 ? prev - 1 : prev))
                     setFeedback(null)
                     setAnswer('')
                   }}
                   className="flex-1 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all"
                 >
                   Previous
                 </button>
                 <button 
                   onClick={() => {
                     setCurrentIdx((prev) => (prev < questions.length - 1 ? prev + 1 : prev))
                     setFeedback(null)
                     setAnswer('')
                   }}
                   className="flex-1 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all"
                 >
                   Skip / Next
                 </button>
              </div>
           </div>

           <div className="md:col-span-5 space-y-6">
              <AnimatePresence mode="wait">
                 {feedback ? (
                   <motion.div 
                     key="feedback"
                     initial={{ opacity: 0, x: 20 }} 
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                   >
                     <Card className="glass-card border-emerald-500/20 bg-emerald-500/[0.02] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />
                        <CardHeader>
                           <div className="flex items-center justify-between mb-2">
                              <CardTitle className="text-emerald-400 text-lg flex items-center gap-2">
                                 <ShieldCheck className="w-5 h-5" /> AI Evaluation
                              </CardTitle>
                              <span className="text-2xl font-black text-white">{feedback.score}%</span>
                           </div>
                           <CardDescription className="text-slate-300 italic text-xs">
                             "{feedback.advice}"
                           </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3">Top Strengths</h4>
                              <div className="flex flex-wrap gap-2">
                                 {feedback.strengths.map((s: string) => (
                                   <span key={s} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded capitalize">{s}</span>
                                 ))}
                              </div>
                           </div>
                           <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Improvement Vector</h4>
                              <ul className="space-y-2">
                                 {feedback.improvements.map((i: string) => (
                                   <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                                      <Zap className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                      {i}
                                   </li>
                                 ))}
                              </ul>
                           </div>
                        </CardContent>
                     </Card>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="empty"
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }}
                     className="h-full min-h-[300px] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
                   >
                      <Sparkles className="w-8 h-8 text-slate-700 mb-4" />
                      <p className="text-slate-500 text-xs font-medium max-w-[200px]">Submit your answer to receive real-time intelligence analysis.</p>
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
      )}
    </div>
  )
}

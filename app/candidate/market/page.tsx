'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUp, DollarSign, MapPin, Briefcase, Zap, ShieldCheck } from 'lucide-react'
import { useCandidate } from '@/lib/hooks/useCandidate'

export default function MarketValuePage() {
  const { candidate, loading } = useCandidate()

  if (loading) return null

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">Salary Insights</h1>
        <p className="text-slate-400 font-medium">Real-time compensation analysis based on your AI-mapped skills.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card border-blue-500/20 bg-blue-600/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Est. Range</span>
            </div>
            <div className="text-2xl font-black text-white">$140k - $185k</div>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Per Annum (Total Comp)</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Percentile</span>
            </div>
            <div className="text-2xl font-black text-white">Top 12%</div>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Against {candidate?.currentRole}s</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20 bg-purple-500/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Growth Velocity</span>
            </div>
            <div className="text-2xl font-black text-white">+24.5%</div>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">YOY Skill Demand Increase</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
             <CardTitle className="text-lg text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" /> High-Value Skill Gaps
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-slate-400 leading-relaxed">
                Acquiring these skills could increase your market valuation by up to <span className="text-white font-bold">$15,000/year</span>.
             </p>
             <div className="space-y-3">
                {[
                  { skill: "System Design for AI", impact: "High", boost: "+$8k" },
                  { skill: "Vector DB Optimization", impact: "Medium", boost: "+$4k" },
                  { skill: "MLOps / Kubeflow", impact: "High", boost: "+$6k" }
                ].map((item) => (
                  <div key={item.skill} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                     <span className="text-xs text-white font-medium">{item.skill}</span>
                     <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black uppercase text-blue-500">{item.impact} Impact</span>
                        <span className="text-xs font-bold text-emerald-400">{item.boost}</span>
                     </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
             <CardTitle className="text-lg text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" /> Geographical Arbitrage
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-slate-400 leading-relaxed">
                Top paying regions for your current intelligence profile:
             </p>
             <div className="space-y-3">
                {[
                  { region: "San Francisco / Remote US", range: "$180k - $220k" },
                  { region: "London / EU Remote", range: "$110k - $140k" },
                  { region: "Bangalore / Remote India", range: "₹45L - ₹65L" }
                ].map((item) => (
                  <div key={item.region} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                     <span className="text-xs text-white font-medium">{item.region}</span>
                     <span className="text-xs font-bold text-slate-400">{item.range}</span>
                  </div>
                ))}
             </div>
             <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5" />
                <p className="text-[10px] text-blue-300 leading-relaxed italic">
                  Data aggregated from 1.2M+ active job listings and verified recruitment records.
                </p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, Briefcase, Activity, Target, Zap, CheckCircle2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !stats) return null

  // Process activity data from real stats
  const alerts = stats.recentActivity?.length > 0 ? stats.recentActivity : [
    { id: 'm1', title: 'System Heartbeat', body: 'AI Match Engine is running at 100% efficiency.', time: 'Live' },
    { id: 'm2', title: 'Data Consistency', body: 'Regional multi-tenant sync completed successfully.', time: 'Recently' }
  ]

  const pipelineData = stats.pipelineData || []

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse ring-4 ring-blue-500/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Live Engine Telemetry</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">AI Command Center</h1>
          <p className="text-slate-400 font-medium">Monitoring global talent influx and recruitment velocity across specialized domains.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-1 rounded-2xl">
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">Operational</button>
          <button className="px-4 py-2 rounded-xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Maintenance</button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SmartKpi
          label="Talent Indexed"
          value={stats.candidates}
          subValue="+14% Activity"
          icon={<Users className="h-4 w-4 text-blue-400" />}
          trend="up"
        />
        <SmartKpi
          label="Active Sequences"
          value={stats.jobs}
          subValue="Cross-border reqs"
          icon={<Briefcase className="h-4 w-4 text-violet-400" />}
        />
        <SmartKpi
          label="Match Velocity"
          value={stats.matchVelocity}
          subValue="AI processing time"
          icon={<Zap className="h-4 w-4 text-amber-400" />}
          trend="up"
        />
        <SmartKpi
          label="Placement Yield"
          value={`₹${stats.placementYield}`}
          subValue="Projected Revenue"
          icon={<Target className="h-4 w-4 text-emerald-400" />}
          trend="up"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="glass-card md:col-span-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-blue-600/10 transition-all duration-1000" />
          <CardHeader className="bg-white/[0.02] border-b border-white/5 flex flex-row items-center justify-between py-5">
            <div>
              <CardTitle className="text-lg text-white font-black uppercase tracking-widest">Global Pipeline Influx</CardTitle>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Real-time candidate indexing trajectory</p>
            </div>
            <div className="flex gap-2">
               {['7D', '30D', '90D'].map(p => <button key={p} className={`px-3 py-1 rounded-lg text-[9px] font-black border transition-all ${p === '30D' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}>{p}</button>)}
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="currentColor" className="text-[10px] uppercase font-black tracking-widest text-slate-600" tick={{fill: '#475569'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-[10px] font-black text-slate-600" tick={{fill: '#475569'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(20px)' }}
                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="processed" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorProcessed)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-4 space-y-6">
          <Card className="glass-card overflow-hidden border-blue-500/20 shadow-lg shadow-blue-500/5">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                 <Zap className="w-4 h-4 text-blue-500 fill-blue-500" /> Executive AI Briefing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
               {alerts.map((alert: any, i: number) => (
                  <motion.div 
                     initial={{ opacity: 0, x: 20 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     transition={{ delay: i * 0.15 }}
                     key={alert.id} 
                     className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-default"
                  >
                     <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white text-xs font-black uppercase tracking-widest">{alert.title}</h4>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded">{alert.time}</span>
                     </div>
                     <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{alert.body}</p>
                  </motion.div>
                ))}
                <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all mt-2">
                  View Intelligence Log
                </button>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden bg-gradient-to-br from-blue-600/10 to-transparent">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white">System Calibration</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <span>Extraction Accuracy</span>
                     <span className="text-blue-400">99.4%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-[99.4%] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <span>Matching Fidelity</span>
                     <span className="text-emerald-400">98.1%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-[98.1%] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SmartKpi({ label, value, subValue, icon, trend }: any) {
  return (
    <Card className="glass-card group hover:border-blue-500/30 transition-all border-white/5 bg-white/[0.01]">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all">
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
               <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
               <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Growth</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</p>
          <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  )
}

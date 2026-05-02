'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, Briefcase, AlertCircle, CheckCircle2, XCircle, Timer, PauseCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

  const pipelineData = stats.pipelineData || []

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6.5rem)] overflow-hidden flex flex-col gap-3 animate-in fade-in duration-700">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-blue-400">Control Center</p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">Operations Command Dashboard</h1>
        </div>
        <div className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold whitespace-nowrap">
          System Healthy
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <Card className="glass-card lg:col-span-8 overflow-hidden border-white/10">
          <CardHeader className="border-b border-white/10 bg-white/[0.02] py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Pipeline Velocity</CardTitle>
              <span className="text-xs text-slate-400">Last 30 days</span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="processed" stroke="#3b82f6" strokeWidth={3} fill="url(#velocityFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 grid grid-cols-2 gap-2 auto-rows-fr">
          <Card className="glass-card border-white/10">
            <CardContent className="p-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">Hired</p>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.hiredCount}</p>
              <p className="text-xs text-slate-500 mt-1">Candidates selected in pipeline</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">Non-hired</p>
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.nonHiredCount}</p>
              <p className="text-xs text-slate-500 mt-1">Rejected in pipeline</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">Deadline Risk</p>
                <Timer className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.deadlineRiskJobs}</p>
              <p className="text-xs text-slate-500 mt-1">Active jobs older than 45 days</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="p-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">On Hold Jobs</p>
                <PauseCircle className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.onHoldJobs}</p>
              <p className="text-xs text-slate-500 mt-1">Vacancies waiting for action</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Candidates"
          value={stats.candidates}
          subValue="Available profiles"
          icon={<Users className="h-4 w-4 text-blue-400" />}
        />
        <Metric
          label="Active Vacancies"
          value={stats.activeJobs}
          subValue="Live roles"
          icon={<Briefcase className="h-4 w-4 text-violet-400" />}
        />
        <Metric
          label="Closed Vacancies"
          value={stats.closedJobs}
          subValue="Closed roles"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        />
        <Metric
          label="Integrity Alerts"
          value={stats.aiFraudAlerts}
          subValue="Needs review"
          icon={<AlertCircle className={`h-4 w-4 ${stats.aiFraudAlerts > 0 ? 'text-red-400' : 'text-slate-400'}`} />}
        />
      </div>
    </div>
  )
}

function Metric({ label, value, subValue, icon }: any) {
  return (
    <Card className="glass-card border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-400">{label}</p>
          {icon}
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{subValue}</p>
      </CardContent>
    </Card>
  )
}

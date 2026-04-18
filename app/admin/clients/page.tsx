'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Building2, Plus, Server, Globe2, AlertCircle, Cpu, 
  Database, Network, ShieldCheck, Activity, Zap
} from 'lucide-react'
import { useClients } from '@/lib/hooks/useClients'

export default function AdminClientsPage() {
  const { 
    clients, 
    loading, 
    provisionClient 
  } = useClients()

  const [isProvisionOpen, setIsProvisionOpen] = useState(false)
  const [provisionState, setProvisionState] = useState<'idle' | 'deploying' | 'deployed'>('idle')

  const [clientName, setClientName] = useState('')
  const [region, setRegion] = useState('US-East (N. Virginia)')
  const [plan, setPlan] = useState('Enterprise (Dedicated)')

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault()
    setProvisionState('deploying')
    
    const success = await provisionClient({ 
      name: clientName, 
      region, 
      plan: plan.split(' ')[0] 
    })
    
    if (success) {
      setProvisionState('deployed')
      setTimeout(() => {
        setIsProvisionOpen(false)
        setProvisionState('idle')
        setClientName('')
      }, 2500)
    } else {
      setProvisionState('idle')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin" />
      <p className="text-slate-400 font-medium">Syncing regional clusters...</p>
    </div>
  )

  const activeUsers = clients.reduce((sum, c) => sum + (c.users || 0), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 px-2 py-0.5 rounded bg-blue-500/10">Global Infrastructure</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Multi-Tenant Hub</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">Managed Clients</h1>
          <p className="text-slate-400 mt-2 max-w-xl">Deploy and govern white-labeled satellite tenants across your professional ecosystem with high-availability MongoDB clusters.</p>
        </div>
        
        <Dialog open={isProvisionOpen} onOpenChange={setIsProvisionOpen}>
           <DialogTrigger render={<button className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group" />}>
             <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Provision New Tenant
           </DialogTrigger>
           <DialogContent className="glass-card border border-white/10 text-white sm:max-w-md overflow-hidden bg-[#0A0A0B]">
              <DialogHeader>
                 <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-500" /> satellite.deploy.v1
                 </DialogTitle>
              </DialogHeader>

              <AnimatePresence mode="wait">
                {provisionState === 'idle' && (
                  <motion.form 
                    key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={handleProvision} className="space-y-6 pt-4"
                  >
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Client Organization</label>
                        <input 
                          type="text" required placeholder="e.g. Acme Corp" 
                          value={clientName} onChange={e => setClientName(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Cluster Region</label>
                          <select 
                            value={region} onChange={e => setRegion(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none text-sm"
                          >
                            <option className="bg-[#0A0A0A]">US-East (Virginia)</option>
                            <option className="bg-[#0A0A0A]">EU-Central (Frankfurt)</option>
                            <option className="bg-[#0A0A0A]">AP-South (Mumbai)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">SLA Tier</label>
                          <select 
                            value={plan} onChange={e => setPlan(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none text-sm"
                          >
                            <option className="bg-[#0A0A0A]">Enterprise (Dedicated)</option>
                            <option className="bg-[#0A0A0A]">Pro (Shared Pool)</option>
                          </select>
                        </div>
                      </div>
                     <button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                        <Cpu className="w-4 h-4" /> Initialize Shards
                     </button>
                  </motion.form>
                )}

                {provisionState === 'deploying' && (
                   <motion.div 
                     key="deploying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="py-12 flex flex-col items-center justify-center text-center"
                   >
                      <div className="w-16 h-16 mb-6 relative">
                         <div className="absolute inset-0 bg-blue-500/20 blur-[30px] rounded-full animate-pulse" />
                         <Database className="w-16 h-16 text-blue-500 animate-pulse relative z-10" />
                         <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin p-2" />
                      </div>
                      <h3 className="text-white font-black text-xl mb-2">Cloning Core Architecture...</h3>
                      <p className="text-xs text-slate-500 font-medium max-w-[200px]">Allocating MongoDB replica-set & provisioning UI fragments in {region}.</p>
                   </motion.div>
                )}

                {provisionState === 'deployed' && (
                   <motion.div 
                     key="completed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                     className="py-12 flex flex-col items-center justify-center text-center"
                   >
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                         <Globe2 className="w-10 h-10 text-emerald-400" />
                      </div>
                      <h3 className="text-white font-black text-2xl">Tenant Online</h3>
                      <p className="text-sm text-slate-400 mt-2 max-w-[240px]">Satellite hub deployed with 100% data isolation. Admin key-link generated.</p>
                   </motion.div>
                )}
              </AnimatePresence>
           </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ClusterStatsCard 
            label="Deployed Tenants" 
            value={clients.length} 
            icon={<Network className="w-5 h-5 text-blue-500" />} 
          />
         <ClusterStatsCard 
            label="Total Contract Value" 
            value={`₹${clients.reduce((sum, c) => sum + (c.revenue || 0), 0).toLocaleString()}`} 
            icon={<Zap className="w-5 h-5 text-emerald-500" />} 
          />
         <ClusterStatsCard 
            label="Cluster Health" 
            value="99.98%" 
            icon={<Activity className="w-5 h-5 text-amber-500" />} 
          />
      </div>

      {/* Main Ledger */}
      <Card className="glass-card border border-white/5 bg-transparent overflow-hidden">
         <CardHeader className="border-b border-white/5 bg-white/[0.01] p-6">
            <CardTitle className="text-xl text-white font-black flex items-center gap-3">
               <Globe2 className="w-6 h-6 text-blue-500" /> Regional Satellite Hubs
            </CardTitle>
         </CardHeader>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-[#080808] text-[10px] uppercase text-slate-600 font-black tracking-widest border-b border-white/5">
                   <tr>
                     <th className="p-6">Tenant / Namespace</th>
                     <th className="p-6">Region</th>
                     <th className="p-6">SLA Tier</th>
                     <th className="p-6">Requisition Pulse</th>
                     <th className="p-6">Contract Value</th>
                     <th className="p-6">Status</th>
                     <th className="p-6 text-right">Management</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {clients.map((tenant: any, idx: number) => (
                     <motion.tr 
                        key={tenant.id || idx}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                        className="hover:bg-white/[0.01] transition-all group"
                      >
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black group-hover:scale-110 transition-transform">
                               {tenant.name.charAt(0)}
                             </div>
                             <div>
                               <span className="text-white font-bold block">{tenant.name}</span>
                               <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">ID: {tenant.id.slice(-8)}</span>
                             </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center text-sm text-slate-300 font-medium">
                             <Server className="w-3.5 h-3.5 mr-2 text-slate-600" /> {tenant.region}
                           </div>
                        </td>
                        <td className="p-6">
                           <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">{tenant.plan}</span>
                        </td>
                        <td className="p-6">
                           <div className="space-y-1.5 min-w-[120px]">
                              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">
                                 <span>Jobs: {tenant.activeJobs || 0}</span>
                                 <span className="text-blue-500">Talent: {tenant.shortlisted || 0}</span>
                              </div>
                              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${Math.min((tenant.shortlisted || 0) * 20, 100)}%` }} />
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                            <span className="text-sm font-mono text-emerald-400 font-bold">₹{(tenant.revenue || 0).toLocaleString()}</span>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${tenant.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></span>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tenant.status}</span>
                           </div>
                        </td>
                        <td className="p-6 text-right">
                           <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-400 hover:bg-blue-500/5 transition-all">
                              Configure
                           </button>
                        </td>
                     </motion.tr>
                   ))}
                 </tbody>
               </table>
            </div>
         </CardContent>
      </Card>
      
      {/* Alert */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 flex items-start gap-4">
         <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
         <div>
           <p className="text-blue-200 text-sm font-bold">Satellite Isolated Deployment Flow</p>
           <p className="text-blue-300/60 text-xs mt-1 leading-relaxed">
             Provisioning a new tenant initializes specialized MongoDB replica-sets and clones the primary UI namespace down to the client scope. 
             Status updates to <span className="text-blue-400">Active</span> once regional propagation is verified.
           </p>
         </div>
      </div>
    </div>
  )
}

function ClusterStatsCard({ label, value, icon }: any) {
  return (
    <Card className="glass-card bg-white/[0.01] border-white/5 p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/5 transition-all" />
      <div className="flex justify-between items-start mb-4">
         <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-all">
            {icon}
         </div>
         <Zap className="w-4 h-4 text-blue-500/20" />
      </div>
      <div className="space-y-1">
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
         <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
      </div>
    </Card>
  )
}

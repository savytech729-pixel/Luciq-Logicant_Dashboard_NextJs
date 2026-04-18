'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  CheckCircle2, Download, Receipt, Users, Banknote, 
  Building2, TrendingUp, ArrowUpRight, Clock, ShieldCheck
} from 'lucide-react'
import { useBilling } from '@/lib/hooks/useBilling'

export default function AdminBillingPage() {
  const { 
    placements, 
    invoices, 
    loading, 
    isProcessing, 
    generateInvoice, 
    markAsPaid 
  } = useBilling()

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 rounded-full border-t-2 border-emerald-500 animate-spin" />
      <p className="text-slate-400">Loading financials...</p>
    </div>
  )

  const invoiceMap = invoices.reduce((acc, inv) => {
    acc[inv.placementId] = inv.status;
    return acc;
  }, {} as Record<string, string>);

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0)
  const pendingRevenue = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0)
  const avgPlacementFee = placements.length > 0 
    ? (placements.reduce((sum, p) => sum + (p.feePercentage || 15), 0) / placements.length).toFixed(1)
    : '0'

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Header with Glass Gradient */}
      <div className="relative p-8 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.01]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 px-2 py-0.5 rounded bg-emerald-500/10">Financials</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Revenue Management</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">Placements & Billing</h1>
            <p className="text-slate-400 mt-2">Track successful candidate placements and manage global client invoicing.</p>
          </div>
          <div className="flex gap-3">
             <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Export Report
             </button>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatsCard 
            label="Total Revenue (YTD)" 
            value={`$${totalRevenue.toLocaleString()}`} 
            icon={<Banknote className="w-5 h-5" />} 
            color="emerald"
            trend="+12.5%"
         />
         <StatsCard 
            label="Pending Receivables" 
            value={`$${pendingRevenue.toLocaleString()}`} 
            icon={<Receipt className="w-5 h-5" />} 
            color="yellow"
            description="Active invoices"
         />
         <StatsCard 
            label="Total Placements" 
            value={placements.length} 
            icon={<Users className="w-5 h-5" />} 
            color="blue"
            trend="+3 this month"
         />
         <StatsCard 
            label="Avg. Agency Fee" 
            value={`${avgPlacementFee}%`} 
            icon={<TrendingUp className="w-5 h-5" />} 
            color="purple"
            description="Market competitive"
         />
      </div>

      {/* Main Ledger Table */}
      <Card className="glass-card border border-white/10 overflow-hidden">
         <CardHeader className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-row items-center justify-between">
            <div className="space-y-1">
               <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Recent Placements Ledger
               </CardTitle>
               <p className="text-xs text-slate-500 font-medium">Verified hires mapped to satellite tenants</p>
            </div>
         </CardHeader>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-[#080808] text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-white/5">
                    <tr>
                      <th className="p-6">Placed Talent</th>
                      <th className="p-6">Hiring Client</th>
                      <th className="p-6">Economic Value</th>
                      <th className="p-6">Agency Fee</th>
                      <th className="p-6 text-center">Lifecycle</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {placements.map((p, idx) => {
                       const feeAmount = (p.baseSalary * ((p.feePercentage || 15) / 100))
                       const status = invoiceMap[p.id] || 'UNBILLED'

                       return (
                        <motion.tr 
                          key={p.id || idx}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                          className="hover:bg-white/[0.01] transition-colors group"
                        >
                           <td className="p-6">
                              <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{p.candidateName}</div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{p.jobTitle}</div>
                           </td>
                           <td className="p-6">
                              <div className="flex items-center text-sm font-medium text-slate-300">
                                 <Building2 className="w-3.5 h-3.5 mr-2 text-blue-500" /> {p.clientName}
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1 opacity-60">
                                <Clock className="w-3 h-3" /> Hired: {new Date(p.hireDate).toLocaleDateString()}
                              </div>
                           </td>
                          <td className="p-6">
                             <div className="text-sm font-bold text-white">${p.baseSalary.toLocaleString()}</div>
                             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Base Compensation</div>
                          </td>
                          <td className="p-6">
                             <div className="text-sm text-emerald-400 font-black">${feeAmount.toLocaleString()}</div>
                             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{p.feePercentage || 15}% Placement Fee</div>
                          </td>
                           <td className="p-6 text-center">
                              {status === 'PAID' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                  <CheckCircle2 className="w-3 h-3" /> Settled
                                </span>
                              )}
                              {status === 'PENDING' && (
                                <span className="inline-block px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                  Awaiting Payout
                                </span>
                              )}
                              {status === 'UNBILLED' && (
                                <span className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                  Unbilled
                                </span>
                              )}
                           </td>
                           <td className="p-6 text-right">
                              {status === 'UNBILLED' && (
                                 <button 
                                   onClick={() => generateInvoice(p.id)}
                                   disabled={isProcessing === p.id}
                                   className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 group/btn ml-auto"
                                 >
                                   {isProcessing === p.id ? (
                                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                   ) : (
                                     <><Receipt className="w-3.5 h-3.5"/> Bill Client</>
                                   )}
                                 </button>
                              )}
                              {status === 'PENDING' && (
                                <div className="flex gap-2 justify-end">
                                   <button 
                                      onClick={() => markAsPaid(p.id)}
                                      className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all flex items-center gap-2"
                                   >
                                      Mark Paid
                                   </button>
                                </div>
                              )}
                              {status === 'PAID' && (
                                <button className="h-10 px-4 rounded-xl border border-white/5 text-slate-600 text-[10px] font-black uppercase tracking-widest cursor-default ml-auto">
                                   Audit Trail Locked
                                </button>
                              )}
                            </td>
                         </motion.tr>
                       )
                    })}
                  </tbody>
               </table>
            </div>
         </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({ label, value, icon, color, trend, description }: any) {
  const getColors = () => {
    if (color === 'emerald') return 'text-emerald-500 bg-emerald-500/10'
    if (color === 'yellow') return 'text-yellow-500 bg-yellow-500/10'
    if (color === 'purple') return 'text-purple-500 bg-purple-500/10'
    return 'text-blue-500 bg-blue-500/10'
  }

  return (
    <Card className="glass-card hover:border-white/20 transition-all group relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-[20px] opacity-20 ${getColors().split(' ')[0].replace('text-', 'bg-')}`} />
      <CardHeader className="pb-2">
         <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-xl ${getColors()} group-hover:scale-110 transition-transform`}>
               {icon}
            </div>
            {trend && <span className="text-[10px] font-black text-emerald-500 flex items-center tracking-widest uppercase">{trend} <ArrowUpRight className="w-3 h-3 ml-0.5" /></span>}
         </div>
         <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">
            {label}
         </CardTitle>
      </CardHeader>
      <CardContent>
         <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
         {description && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Settings, Lock, Cpu, Globe, Key, Building } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Settings</h1>
        <p className="text-slate-400">Manage platform security, branding, and AI options.</p>
      </div>

      <div className="space-y-6">
        {/* White Labeling Section */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
             <CardTitle className="text-lg text-white flex items-center">
                <Globe className="w-5 h-5 mr-3 text-blue-500" /> White-Label & Theming
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium block">Custom Domain Mapping</label>
                  <p className="text-xs text-slate-400">Allow tenants to map `jobs.theircompany.com`</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer opacity-50">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
             </div>
             <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                 <label className="text-sm text-slate-300 font-bold mb-2 block flex items-center">
                   <Building className="w-4 h-4 mr-2" /> Global Organization Name
                 </label>
                 <input type="text" defaultValue="Luciq & Logicant" className="w-full bg-black/50 border border-white/10 px-4 py-2 rounded-lg text-white outline-none focus:border-blue-500" />
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 block">Will be injected into tenant headers</p>
             </div>
          </CardContent>
        </Card>

        {/* Security & SSO Section */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
             <CardTitle className="text-lg text-white flex items-center">
                <Lock className="w-5 h-5 mr-3 text-emerald-500" /> Authentication & SSO
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium block">Enforce Global 2FA</label>
                  <p className="text-xs text-slate-400">Require MFA for all Tenant Admins</p>
                </div>
                <div className="w-12 h-6 bg-emerald-600 rounded-full relative cursor-pointer opacity-50">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
             </div>
             <div className="pt-4 border-t border-white/5">
                <label className="text-sm text-slate-300 font-bold flex items-center mb-4">
                  <Key className="w-4 h-4 mr-2 text-slate-400" /> SAML / OAuth Integrations
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button className="py-3 px-4 rounded-xl border border-white/10 bg-white/[0.02] text-slate-300 text-sm hover:bg-white/5 transition-colors">
                     Configure Azure AD
                  </button>
                  <button className="py-3 px-4 rounded-xl border border-white/10 bg-white/[0.02] text-slate-300 text-sm hover:bg-white/5 transition-colors">
                     Configure Okta
                  </button>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* AI Routing Section */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
             <CardTitle className="text-lg text-white flex items-center">
                <Cpu className="w-5 h-5 mr-3 text-purple-500" /> AI Settings
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
             <div>
                <label className="text-white font-medium block mb-3">Primary LLM Provider</label>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 border-2 border-purple-500 bg-purple-500/10 rounded-xl cursor-pointer">
                      <h4 className="font-bold text-white mb-1">OpenAI (GPT-4)</h4>
                      <p className="text-xs text-purple-300">Active Node</p>
                   </div>
                   <div className="p-4 border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl cursor-pointer transition-colors opacity-50">
                      <h4 className="font-bold text-white mb-1">Anthropic (Claude 3.5)</h4>
                      <p className="text-xs text-slate-500">Failover Storage</p>
                   </div>
                </div>
             </div>
             
             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <h4 className="text-sm font-bold text-red-400 mb-1">Notice</h4>
                <p className="text-xs text-red-300">Advanced AI settings are currently restricted. Contact support for custom model integration.</p>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

import React from 'react';
import { Shield, MapPin, Calendar, Hash, UserCircle, History, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarInfoProps {
  formData: any;
  activeCaseId: string | null;
  userProfile: any;
  onAuditClick?: () => void;
}

export const SidebarInfo: React.FC<SidebarInfoProps> = ({ 
  formData, 
  activeCaseId, 
  userProfile,
  onAuditClick 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Anmäld': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Pågående': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Avslutad': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Ej angivet';
    if (date?.seconds) return new Date(date.seconds * 1000).toLocaleDateString('sv-SE');
    return new Date(date).toLocaleDateString('sv-SE');
  };

  return (
    <div className="w-80 flex-shrink-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Case Header Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-visuera-dark rounded-xl flex items-center justify-center text-white shadow-lg shadow-visuera-dark/20">
              <Shield size={16} />
            </div>
            <span className="text-xs font-black text-visuera-dark uppercase tracking-widest leading-none">Ärende</span>
          </div>
          <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusColor(formData.status)}`}>
            {formData.status}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between group pt-4 border-t border-slate-50">
            <div className="flex items-center gap-3">
              <Hash size={14} className="text-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              {activeCaseId ? activeCaseId.substring(0, 8).toUpperCase() : 'NYTT'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={14} className="text-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skola</span>
            </div>
            <span className="text-[11px] font-bold text-slate-700">{formData.school || 'Ej vald'}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={14} className="text-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skapat</span>
            </div>
            <span className="text-[11px] font-bold text-slate-700">{formatDate(formData.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* User Context Card */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 space-y-4 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
          <UserCircle size={100} />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
            <UserCircle size={14} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Utredare / Roll</span>
        </div>

        <div>
          <h4 className="text-sm font-bold truncate">{userProfile?.name || 'Inläser...'}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              {userProfile?.role === 'principal' ? 'Rektor / Administratör' : 'Personal / Pedagog'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation / Actions */}
      <div className="space-y-2">
        <button 
          onClick={onAuditClick}
          className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-600 hover:border-visuera-green/30 hover:text-visuera-green transition-all group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <History size={16} className="text-slate-300 group-hover:text-visuera-green transition-colors" />
            <span>Händelselogg / Audit</span>
          </div>
          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <div className="p-6 bg-visuera-green/5 rounded-3xl border border-visuera-green/10">
        <p className="text-[10px] text-visuera-dark/60 font-medium leading-relaxed italic">
          "Fokusera på det främjande arbetet. Barnets trygghet är utgångspunkten för alla beslut."
        </p>
      </div>
    </div>
  );
};

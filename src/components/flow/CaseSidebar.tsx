import React from 'react';
import { 
  Shield, 
  Clock, 
  User, 
  Building2, 
  History, 
  ExternalLink,
  Info,
  AlertCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface CaseSidebarProps {
  caseId?: string | null;
  formData: any;
  currentStepTitle: string;
  onShowOriginal?: () => void;
  onShowAudit?: () => void;
  onGoToUtredning?: () => void;
}

export const CaseSidebar: React.FC<CaseSidebarProps> = ({ 
  caseId, 
  formData, 
  currentStepTitle,
  onShowOriginal,
  onShowAudit,
  onGoToUtredning
}) => {
  const incidentDate = formData.incidentDate ? new Date(formData.incidentDate) : null;
  const createdAt = formData.createdAt ? (formData.createdAt.seconds ? new Date(formData.createdAt.seconds * 1000) : new Date(formData.createdAt)) : null;
  
  // Calculate remaining time (48h rule)
  let hoursLeft = 0;
  if (createdAt) {
    const deadline = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
    const now = new Date();
    hoursLeft = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'anmäld': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'utredning': 
      case 'utreds': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'åtgärder': 
      case 'åtgärdad': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'avslutad': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <aside className="w-80 flex-shrink-0 hidden lg:block">
      <div className="sticky top-6 space-y-6">
        {/* Case ID & Status */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">Ärende-ID</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(formData.status)}`}>
              {formData.status || 'Draft'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            #{caseId?.substring(0, 8) || 'NYTT'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{currentStepTitle}</p>
        </div>

        {/* Roles */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User size={12} /> Roller
          </h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Ansvarig rektor</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{formData.assignedToName || 'Ej tilldelad'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Utredare</p>
              <div className="space-y-1 mt-0.5">
                {formData.investigators && formData.investigators.length > 0 ? (
                  formData.investigators.map((inv: any) => (
                    <div key={inv.uid} className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium capitalize ${inv.role === 'primary' ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                        {inv.name}
                      </p>
                      {inv.role === 'primary' && <Shield size={10} className="text-visuera-green" />}
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-400 italic">Ej tilldelad</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Skola</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 size={12} className="text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formData.school || 'Välj skola...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={12} /> Tidslinje
          </h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Händelsedatum</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formData.incidentDate || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Anmäld</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{createdAt?.toLocaleDateString('sv-SE') || '-'}</p>
              </div>
            </div>

            {createdAt && formData.status !== 'avslutad' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">48h-regeln</span>
                  <span className={`text-xs font-bold ${hoursLeft < 12 ? 'text-rose-600' : 'text-amber-600'}`}>
                    {hoursLeft} timmar kvar
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${hoursLeft < 12 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (hoursLeft / 48) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tools */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-3 transition-colors">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={12} /> Verktyg
          </h4>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={onShowOriginal}
              className="flex items-center justify-between p-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <Shield size={14} />
                </div>
                <span>Ursprunglig anmälan</span>
              </div>
              <ExternalLink size={12} className="text-slate-300 dark:text-slate-600" />
            </button>

            <button 
              onClick={onShowAudit}
              className="flex items-center justify-between p-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <History size={14} />
                </div>
                <span>Händelselogg (Audit)</span>
              </div>
              <ExternalLink size={12} className="text-slate-300 dark:text-slate-600" />
            </button>

            {onGoToUtredning && (
              <button 
                onClick={onGoToUtredning}
                className="flex items-center justify-between p-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <History size={14} />
                  </div>
                  <span>Gå till Utredning</span>
                </div>
                <ArrowRight size={12} className="text-blue-300 dark:text-blue-600" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 transition-colors">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0" size={18} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-500">Legal Compliance</p>
              <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-600 opacity-80">
                Detta ärende hanteras enligt Skollagen 6 kap. och GDPR. All dokumentation loggas och är spårbar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

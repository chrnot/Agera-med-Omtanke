import React, { useMemo, useState } from 'react';
import { ShieldAlert, Zap, ArrowRight, User, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { caseService } from '../../services/caseService';

export const SafetyRadar = ({ cases, userId, school, onOpenCase }: { 
  cases: any[], 
  userId: string,
  school: string,
  onOpenCase: (id: string) => void 
}) => {
  const [isSending, setIsSending] = useState<string | null>(null);
  const [sentAlerts, setSentAlerts] = useState<Set<string>>(new Set());

  const alerts = useMemo(() => {
    return caseService.analyzeEarlyWarning(cases);
  }, [cases]);

  const handleSendToEHT = async (alert: any) => {
    setIsSending(alert.id);
    try {
      await caseService.createCollectionCase(alert, userId, school);
      setSentAlerts(prev => new Set(prev).add(alert.id));
    } catch (error) {
      console.error("Failed to create EWS case:", error);
    } finally {
      setIsSending(null);
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
            <Zap size={14} className="text-amber-400" /> Early Warning System (EWS)
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Realtidsanalys av kluster och riskmönster</p>
        </div>
        <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
          Trygghets-radar
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-5 rounded-[24px] border flex flex-col justify-between ${
              alert.severity === 'CRITICAL' 
                ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                : 'bg-amber-500/5 border-amber-500/20'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-xl ${
                  alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {alert.type === 'PERSON' ? <User size={18} /> : 
                   alert.type === 'LOCATION' ? <MapPin size={18} /> : 
                   <ShieldAlert size={18} />}
                </div>
                <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                   alert.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {alert.severity === 'CRITICAL' ? 'Kritisk' : 'Varning'}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-black text-white leading-tight uppercase tracking-tight">
                  {alert.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  {alert.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {alert.cases.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => onOpenCase(c.id)}
                    className="text-[8px] font-black bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-lg border border-white/5 transition-all"
                  >
                    ÄRE-{c.id.slice(-4).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              {sentAlerts.has(alert.id) ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest py-2">
                  <CheckCircle2 size={14} /> Skickad till EHT
                </div>
              ) : (
                <button
                  disabled={isSending === alert.id}
                  onClick={() => handleSendToEHT(alert)}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSending === alert.id ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Skicka till Elevhälsoteamet <ArrowRight size={12} /></>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

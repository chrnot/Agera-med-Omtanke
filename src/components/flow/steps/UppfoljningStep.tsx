import React from 'react';
import { CheckCircle2, User, Calendar, Info, AlertTriangle } from 'lucide-react';
import { StepCard } from '../../ui/StepCard';
import { InfoPopover } from '../../ui/InfoPopover';
import { motion } from 'motion/react';

interface UppfoljningStepProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const UppfoljningStep: React.FC<UppfoljningStepProps> = ({
  formData,
  updateFormData
}) => {
  return (
    <div className="space-y-8">
      <StepCard title="Utvärdering & Resultat" icon={CheckCircle2}>
        <div className="space-y-6">
          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
               <Info size={16} />
            </div>
            <div className="space-y-1">
              <h5 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Hanteringsregel</h5>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Sker inom 2 veckor efter insatser. Samtal ska genomföras med både den utsatta och den som kränkt.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Har kränkningarna upphört? *</label>
              <InfoPopover title="Utvärdering" content="Beskriv resultatet av uppföljningssamtalen och din bedömning av om åtgärderna varit tillräckliga." />
            </div>
            <textarea 
              value={formData.followUpText}
              onChange={(e) => updateFormData('followUpText', e.target.value)}
              placeholder="Dokumentera resultatet av uppföljningen..."
              className="w-full h-48 p-6 bg-slate-50 rounded-3xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none text-sm leading-relaxed text-slate-700 font-medium"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slutsats</label>
            <div className="grid grid-cols-1 gap-3">
              {[
                'Problemet har upphört - avsluta ärendet',
                'Problemet kvarstår - nya åtgärder och nytt datum för uppföljning'
              ].map(decision => (
                <button
                  key={decision}
                  type="button"
                  onClick={() => updateFormData('followUpDecision', decision)}
                  className={`flex items-center gap-4 p-5 rounded-[22px] text-xs font-bold transition-all border text-left ${
                    formData.followUpDecision === decision
                      ? decision.includes('upphört') 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    formData.followUpDecision === decision 
                      ? decision.includes('upphört') ? 'border-emerald-500 bg-emerald-500' : 'border-amber-500 bg-amber-500'
                      : 'border-slate-200'
                  }`}>
                    {formData.followUpDecision === decision && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  {decision}
                </button>
              ))}
            </div>
          </div>
        </div>
      </StepCard>

      {formData.followUpDecision === 'Problemet har upphört - avsluta ärendet' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 border border-emerald-100 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 pb-2 text-emerald-600">
             <User size={16} />
             <h3 className="text-[11px] font-black uppercase tracking-[0.15em]">Signatur: Uppföljning klar</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Utredarens signatur *</label>
              <input 
                type="text"
                value={formData.signatureName}
                onChange={(e) => updateFormData('signatureName', e.target.value)}
                placeholder="Ditt fullständiga namn..."
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm font-medium text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Datum *</label>
              <input 
                type="date"
                value={formData.signatureDate}
                onChange={(e) => updateFormData('signatureDate', e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm font-medium text-slate-700"
              />
            </div>
          </div>
        </motion.div>
      )}

      {formData.followUpDecision?.includes('kvarstår') && (
        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
            Du kommer att skickas tillbaka till steg 4 (Åtgärder) för att revidera planen när du klickar på nästa.
          </p>
        </div>
      )}
    </div>
  );
};

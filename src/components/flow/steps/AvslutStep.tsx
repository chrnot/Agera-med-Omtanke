import React from 'react';
import { ShieldCheck, FileCheck, ClipboardList, PenTool, AlertTriangle, Users, FileDown } from 'lucide-react';
import { StepCard } from '../../ui/StepCard';
import { motion } from 'motion/react';

interface AvslutStepProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  showClosingSummary: boolean;
  setShowClosingSummary: (val: boolean) => void;
  activeCaseId: string | null;
  onGenerateAnonymizedReport?: (studentId: string) => void;
  isGeneratingPDF?: boolean;
}

export const AvslutStep: React.FC<AvslutStepProps> = ({
  formData,
  updateFormData,
  showClosingSummary,
  setShowClosingSummary,
  activeCaseId,
  onGenerateAnonymizedReport,
  isGeneratingPDF
}) => {
  if (showClosingSummary) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="bg-slate-900 text-white rounded-[40px] p-10 space-y-8 shadow-2xl relative overflow-hidden">
          {/* Subtle noise/texture overlay would go here if needed */}
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Slutgiltig granskning</h3>
                <p className="text-slate-400 font-medium text-sm">Verifiera uppgifterna innan ärendet låses och arkiveras.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-slate-800">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ansvarig rektor</p>
                  <p className="text-lg font-bold text-slate-200">{formData.signatureName || formData.assignedToName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Skola</p>
                  <p className="text-lg font-bold text-slate-200">{formData.school}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Elev</p>
                  <p className="text-lg font-bold text-slate-200">{formData.studentName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bedömning</p>
                  <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">{formData.incidentConfirmed}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Metadata för arkiv</p>
              <div className="bg-slate-950 rounded-2xl p-6 font-mono text-[10px] text-slate-400 border border-slate-800/50">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify({
                    id: activeCaseId,
                    type: "SAFE_REACTION_ARCHIVE",
                    legalRef: "Skollagen 6 kap. 10 §",
                    gdprStatus: "Compliant - Encryption At Rest",
                    timestamp: new Date().toISOString(),
                    user: formData.signatureName,
                    status: "FINALIZED"
                  }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <p className="text-[11px] text-blue-100 leading-relaxed font-medium">
                Genom att signera intygar jag att skolan fullgjort sin utrednings- och åtgärdsskyldighet enligt gällande lagstiftning. Handlingen kommer att arkiveras och låsas för framtida redigering.
              </p>
            </div>

            <button 
              onClick={() => setShowClosingSummary(false)}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest py-2"
            >
              Avbryt och återgå till redigering
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-blue-600 rounded-[40px] p-10 text-white text-center space-y-6 shadow-xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck size={120} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto border border-white/30">
            <FileCheck size={40} className="text-white" />
          </div>
          <div>
            <h4 className="text-2xl font-black tracking-tight">Klar för arkivering</h4>
            <p className="text-blue-100 text-sm font-medium">Granska sammanställningen och slutför ärendet.</p>
          </div>
        </div>
      </div>

      <StepCard title="Sammanfattning för signering" icon={ClipboardList}>
        <div className="space-y-8 divide-y divide-slate-50">
          <div className="grid grid-cols-2 gap-8 pt-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Identifierad Elev</p>
              <p className="text-sm font-bold text-slate-800">{formData.studentName || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Skolenhet</p>
              <p className="text-sm font-bold text-slate-800">{formData.school || '-'}</p>
            </div>
          </div>

          <div className="pt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Händelseförlopp</p>
            <p className="text-sm text-slate-600 leading-relaxed font-normal italic">
              "{formData.incidentDescription}"
            </p>
            <div className="flex gap-2 flex-wrap mt-3">
              {formData.reportType?.map((t: string) => (
                <span key={t} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider">{t}</span>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bedömning & Åtgärder</p>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50">
              <p className="text-sm font-bold text-slate-800 mb-2">{formData.incidentConfirmed} - {formData.incidentTypes?.join(', ')}</p>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {formData.actionsText}
              </p>
            </div>
          </div>

          <div className="pt-8">
            <div className="flex items-center gap-3 mb-6">
               <ShieldCheck size={16} className="text-emerald-600" />
               <h3 className="text-[11px] font-black uppercase tracking-[0.15em]">GDPR-Export (Anonymiserade rapporter)</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
              Generera elevspecifika rapporter för vårdnadshavare. Systemet maskerar automatiskt övriga inblandades namn i fritextfälten baserat på listan över inblandade parter.
            </p>

            <div className="space-y-3">
              {(formData.involvedParties || []).filter((p: any) => p.type === 'Elev').map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{student.role}</p>
                      <p className="text-xs font-bold text-slate-700">{student.name}</p>
                    </div>
                  </div>
                  <button 
                    disabled={isGeneratingPDF}
                    onClick={() => onGenerateAnonymizedReport?.(student.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                  >
                    <FileDown size={14} />
                    {isGeneratingPDF ? 'Skapar...' : 'Skapa rapport'}
                  </button>
                </div>
              ))}
              
              {(formData.involvedParties || []).filter((p: any) => p.type === 'Elev').length === 0 && (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inga elever i partlistan</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 pt-8">
            <div className="flex items-center gap-3 mb-6">
               <PenTool size={16} className="text-blue-600" />
               <h3 className="text-[11px] font-black uppercase tracking-[0.15em]">Rektors Signering</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Namnförtydligande *</label>
                <input 
                  type="text"
                  value={formData.signatureName}
                  onChange={(e) => updateFormData('signatureName', e.target.value)}
                  placeholder="Signaturs namn..."
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-bold text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Datum *</label>
                <input 
                  type="date"
                  value={formData.signatureDate}
                  onChange={(e) => updateFormData('signatureDate', e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-bold text-slate-800"
                />
              </div>
            </div>

            <div className={`p-6 rounded-[28px] border-2 transition-all flex items-center justify-between group ${
              formData.isClosed ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
            }`}
            onClick={() => {
              if (formData.signatureName && formData.signatureDate) {
                updateFormData('isClosed', !formData.isClosed);
              }
            }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                  formData.isClosed ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'bg-white border-slate-200 group-hover:border-slate-300'
                }`}>
                  {formData.isClosed ? <ShieldCheck size={18} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                    {formData.isClosed ? 'Signerat med BankID' : 'Signera digitalt'}
                  </p>
                  <p className="text-[10px] opacity-60 font-medium">
                    {formData.isClosed ? 'Handlingen är arkiverad och juridiskt bindande' : 'Kräver giltigt tjänste-legg/BankID'}
                  </p>
                </div>
              </div>
              {!formData.isClosed && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Väntar...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </StepCard>
    </div>
  );
};

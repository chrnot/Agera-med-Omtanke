import React from 'react';
import { User, Zap, Users, CheckCircle2, MessageSquare, Send, Check } from 'lucide-react';
import { StepCard } from '../../ui/StepCard';
import { InfoPopover } from '../../ui/InfoPopover';
import { StudentVoiceModule } from '../../StudentVoiceModule';
import { LEGAL_HELP_TEXTS, DISCRIMINATION_GROUNDS } from '../../../constants/guidanceContent';
import { motion, AnimatePresence } from 'motion/react';
import { TeamContributions } from '../TeamContributions';

interface UtredningStepProps {
  formData: any;
  userProfile: any;
  activeCaseId: string | null;
  quickMessage: string;
  setQuickMessage: (val: string) => void;
  handleSendQuickMessage: (text: string) => void;
  updateFormData: (field: string, value: any) => void;
}

export const UtredningStep: React.FC<UtredningStepProps> = ({
  formData,
  userProfile,
  activeCaseId,
  quickMessage,
  setQuickMessage,
  handleSendQuickMessage,
  updateFormData
}) => {
  const [showInterviewGuide, setShowInterviewGuide] = React.useState(false);

  const isInvestigator = userProfile?.uid === (formData.assignedToUid || formData.assignedTeacherUid);
  const isTeamMember = userProfile?.team === formData.assignedTeam;
  const isAdmin = userProfile?.globalRole === 'admin' || userProfile?.role === 'admin' || userProfile?.role === 'principal';
  const canEditMain = isInvestigator || isAdmin;

  return (
    <div className="space-y-8">
      {activeCaseId && (
        <TeamContributions
          activeCaseId={activeCaseId}
          userProfile={userProfile}
          formData={formData}
          updateFormData={updateFormData}
          isInvestigator={isInvestigator}
          isTeamMember={isTeamMember}
        />
      )}

      {/* Principal Quick Message Panel */}
      {(userProfile?.role === 'principal' || userProfile?.globalRole === 'admin') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 space-y-4 shadow-xl transition-colors">
          <div className="flex items-center gap-3 text-visuera-green">
            <MessageSquare size={18} />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-visuera-dark dark:text-slate-100">Direktmeddelande till utredare</h4>
          </div>
          <div className="relative">
            <textarea 
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value.slice(0, 280))}
              placeholder="Skriv ett meddelande eller begär komplettering..."
              className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-[11px] font-medium text-slate-700 dark:text-slate-100 placeholder:text-slate-500"
            />
            <div className="absolute bottom-3 right-3 text-[9px] text-slate-500 font-bold font-mono">
              {quickMessage.length}/280
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Behöver förtydligande.", "Saknas elevversion.", "När förväntas du vara klar?"].map(t => (
              <button 
                key={t} 
                onClick={() => setQuickMessage(t)} 
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold text-slate-400 dark:text-slate-500 hover:text-visuera-green dark:hover:text-visuera-green transition-all uppercase tracking-wider"
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleSendQuickMessage(quickMessage)}
            disabled={!quickMessage.trim()}
            className="w-full py-3 bg-visuera-green hover:bg-visuera-green/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-visuera-green/20"
          >
            <Send size={14} /> Skicka
          </button>
        </div>
      )}

      {/* Card 1: Barnets röst */}
      <StepCard title="BARNETS RÖST" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Elevens Namn</label>
            <input 
              type="text"
              readOnly
              value={formData.studentName}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none text-sm font-bold text-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personnummer</label>
            <input 
              type="text"
              readOnly
              value={formData.studentSSN || ''}
              onChange={(e) => updateFormData('studentSSN', e.target.value)}
              placeholder={canEditMain ? "YYYYMMDD-XXXX" : "Ej ifyllt"}
              className={`w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-700 dark:text-slate-100 ${!canEditMain ? 'cursor-not-allowed opacity-80' : ''}`}
            />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Samtalsstöd & Metod</h5>
            <button 
              onClick={() => setShowInterviewGuide(!showInterviewGuide)}
              className="text-[10px] font-bold text-visuera-green uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              {showInterviewGuide ? 'Dölj samtalsstöd' : 'Visa samtalsstöd'}
            </button>
          </div>
          
          <AnimatePresence>
            {showInterviewGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6"
              >
                <div className="p-6">
                  <StudentVoiceModule
                    selectedStage={formData.studentStage}
                    onStageChange={(stage) => updateFormData('studentStage', stage)}
                    checkedQuestions={formData.interviewQuestionsChecklist}
                    onToggleQuestion={(q) => {
                      const current = formData.interviewQuestionsChecklist || [];
                      const updated = current.includes(q) ? current.filter(i => i !== q) : [...current, q];
                      updateFormData('interviewQuestionsChecklist', updated);
                    }}
                    childRightsStatus={formData.childRightsChecklist}
                    onToggleChildRight={(point) => {
                      const current = formData.childRightsChecklist || [];
                      const updated = current.includes(point) ? current.filter(i => i !== point) : [...current, point];
                      updateFormData('childRightsChecklist', updated);
                    }}
                    ageAdaptedConfirmation={formData.ageAdaptedConfirmation}
                    onToggleConfirmation={(val) => updateFormData('ageAdaptedConfirmation', val)}
                    studentVersion={formData.studentVersion}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Elevens egen beskrivning *</label>
            <InfoPopover title="Barnets röst" content={LEGAL_HELP_TEXTS.childVoice.text} />
          </div>
          <textarea 
            value={formData.studentVersion}
            readOnly={!canEditMain}
            onChange={(e) => updateFormData('studentVersion', e.target.value)}
            placeholder={canEditMain ? "Dokumentera elevens ord sakligt och fritt från tolkningar." : "Ingen dokumentation ännu."}
            className={`w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm leading-relaxed text-slate-700 dark:text-slate-100 font-medium ${!canEditMain ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>
      </StepCard>

      {/* Card 2: Andras versioner */}
      <StepCard title="ANDRAS VERSIONER" icon={Users}>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vårdnadshavares och andras versioner *</label>
              <InfoPopover title="Dokumentation" content="Beskriv vad vårdnadshavare och eventuellt den anklagade/observatörer har uppgett under utredningen." />
            </div>
            <textarea 
              value={formData.investigationText}
              readOnly={!canEditMain}
              onChange={(e) => updateFormData('investigationText', e.target.value)}
              placeholder={canEditMain ? "Dokumentera sakligt vad övriga inblandade har uppgett..." : "Ingen dokumentation ännu."}
              className={`w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm leading-relaxed text-slate-700 dark:text-slate-100 font-medium ${!canEditMain ? 'cursor-not-allowed opacity-80' : ''}`}
            />
          </div>
        </div>
      </StepCard>

      {/* Card 3: Analys */}
      <StepCard title="ANALYS OCH BEDÖMNING" icon={CheckCircle2}>
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategorisering</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'kränkning', label: 'Kränkande behandling' },
                { id: 'diskriminering', label: 'Diskriminering' },
                { id: 'track', label: 'Trakasserier' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    if (!canEditMain) return;
                    const current = formData.incidentTypes || [];
                    const updated = current.includes(type.id) ? current.filter(t => t !== type.id) : [...current, type.id];
                    updateFormData('incidentTypes', updated);
                  }}
                  disabled={!canEditMain}
                  className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-between ${
                    formData.incidentTypes?.includes(type.id)
                      ? 'bg-visuera-green text-white border-visuera-green shadow-md shadow-visuera-green/10'
                      : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  } ${!canEditMain ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {type.label}
                  {formData.incidentTypes?.includes(type.id) && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          {formData.incidentTypes?.includes('diskriminering') && (
            <div className="p-6 bg-visuera-green/5 dark:bg-visuera-green/10 border border-visuera-green/20 dark:border-visuera-green/30 rounded-[28px] space-y-4">
              <label className="text-[10px] font-bold text-visuera-green uppercase tracking-[0.2em] ml-1">Diskrimineringsgrund *</label>
              <div className="flex flex-wrap gap-2">
                {DISCRIMINATION_GROUNDS.map(ground => (
                  <button
                    key={ground}
                    type="button"
                    onClick={() => {
                      if (canEditMain) updateFormData('discriminationGround', ground);
                    }}
                    disabled={!canEditMain}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                      formData.discriminationGround === ground 
                        ? 'bg-visuera-green text-white border-visuera-green shadow-sm' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-visuera-green/30'
                    } ${!canEditMain ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    {ground}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Konstateras kränkning/diskriminering? *</label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Ja', 'Nej', 'Kan ej avgöras'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (canEditMain) updateFormData('incidentConfirmed', opt);
                    }}
                    disabled={!canEditMain}
                    className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      formData.incidentConfirmed === opt
                        ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 shadow-xl'
                        : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    } ${!canEditMain ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Analys & Bedömning *</label>
              <InfoPopover title="Analys" content="Beskriv de överväganden som lett fram till bedömningen. Dokumentera mönster (enskild händelse eller upprepat)." />
            </div>
            <textarea 
              value={formData.investigationAnalysis}
              readOnly={!canEditMain}
              onChange={(e) => updateFormData('investigationAnalysis', e.target.value)}
              placeholder={canEditMain ? "Dokumentera de överväganden som lett till bedömningen..." : "Ingen analys ännu."}
              className={`w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm leading-relaxed text-slate-700 dark:text-slate-100 font-medium ${!canEditMain ? 'cursor-not-allowed opacity-80' : ''}`}
            />
          </div>
        </div>
      </StepCard>
    </div>
  );
};

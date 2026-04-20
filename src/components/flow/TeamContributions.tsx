import React from 'react';
import { Users, HeartHandshake, Plus, CheckCircle2, Quote, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { caseService } from '../../services/caseService';

interface TeamContributionsProps {
  activeCaseId: string;
  userProfile: any;
  formData: any;
  updateFormData: (field: string, value: any) => void;
  isInvestigator: boolean;
  isTeamMember: boolean;
}

export const TeamContributions: React.FC<TeamContributionsProps> = ({
  activeCaseId,
  userProfile,
  formData,
  updateFormData,
  isInvestigator,
  isTeamMember
}) => {
  const [contributions, setContributions] = React.useState<any[]>([]);
  const [newContribution, setNewContribution] = React.useState('');
  const [isSubmittingContrib, setIsSubmittingContrib] = React.useState(false);
  const [isRequestingTeam, setIsRequestingTeam] = React.useState(false);

  React.useEffect(() => {
    if (activeCaseId) {
      const unsubscribe = caseService.subscribeToContributions(activeCaseId, (data) => {
        setContributions(data);
      });
      return () => unsubscribe();
    }
  }, [activeCaseId]);

  const handleRequestTeam = async () => {
    if (!formData.assignedTeam) return;
    setIsRequestingTeam(true);
    try {
      await caseService.requestTeamContribution(activeCaseId, formData.assignedTeam, userProfile.name);
      updateFormData('requestTeamContribution', true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRequestingTeam(false);
    }
  };

  const handleAddContribution = async () => {
    if (!newContribution.trim()) return;
    setIsSubmittingContrib(true);
    try {
      await caseService.addContribution(activeCaseId, newContribution, userProfile);
      setNewContribution('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingContrib(false);
    }
  };

  const handleQuote = (contrib: any) => {
    const quoteText = `\n\nObservation från ${contrib.authorName}: "${contrib.text}"`;
    const currentText = formData.investigationText || '';
    updateFormData('investigationText', currentText + quoteText);
    
    // Smooth alert to show it worked
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300';
    toast.innerText = 'Text kopierad till "Andras versioner"';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Team Collaboration Prompt for Investigator */}
      {isInvestigator && !formData.requestTeamContribution && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-[32px] p-6 text-white shadow-xl shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Behöver du fler ögon?</h4>
              <p className="text-sm font-bold">Be arbetslaget om bidrag</p>
            </div>
          </div>
          
          <button
            onClick={handleRequestTeam}
            disabled={isRequestingTeam}
            className="relative z-10 px-6 py-3 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:scale-105 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isRequestingTeam ? 'Skickar...' : 'Be om bidrag'}
          </button>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
        </motion.div>
      )}

      {/* Main Contributions Log */}
      {(formData.requestTeamContribution || contributions.length > 0) && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-sm transition-colors">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-visuera-green/10 rounded-xl flex items-center justify-center text-visuera-green">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-visuera-dark dark:text-slate-100 tracking-tight">ARBETSLAGETS INSIKTER</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Observationer & Bidrag</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Info size={14} />
              <span className="text-[9px] font-black uppercase tracking-wider">Internt underlag</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                Dessa bidrag är interna arbetsnoteringar och utgör underlag för den officiella utredningen. De kan inte ändras i efterhand.
              </p>
            </div>

            <div className="relative pl-4 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {contributions.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="mx-auto text-slate-300 mb-2 animate-pulse" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inga bidrag ännu...</p>
                </div>
              ) : (
                contributions.map((c, i) => (
                  <motion.div 
                    key={c.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute -left-[21px] top-4 w-4 h-4 bg-white dark:bg-slate-900 border-2 border-visuera-green rounded-full shadow-sm z-10" />
                    
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 group transition-all hover:shadow-md hover:border-visuera-green/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                            {c.authorName?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-visuera-dark dark:text-slate-100">{c.authorName}</span>
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-[7px] font-black uppercase tracking-tight">
                                {c.authorRole || (userProfile?.uid === c.authorUid ? userProfile.role : 'Lärare')}
                              </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                              {new Date(c.createdAt?.seconds * 1000).toLocaleString('sv-SE', { 
                                year: 'numeric', month: '2-digit', day: '2-digit', 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {isInvestigator && (
                          <button 
                            onClick={() => handleQuote(c)}
                            className="p-2 text-slate-300 dark:text-slate-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg transition-all flex items-center gap-2 group/btn"
                            title='Citera observationen i avsnittet "Andras versioner"'
                          >
                            <Quote size={14} className="group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest hidden group-hover/btn:block">Citera till "Andras versioner"</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="relative">
                        <div className="absolute -left-2 top-0 h-full w-0.5 bg-visuera-green/10" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium pl-3">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input Section for Team Members */}
            {isTeamMember && (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-visuera-green text-white rounded-lg flex items-center justify-center shadow-lg shadow-visuera-green/20">
                    <Plus size={18} />
                  </div>
                  <h4 className="text-[10px] font-black text-visuera-dark dark:text-slate-100 uppercase tracking-[0.2em]">Lägg till din observation</h4>
                </div>
                
                <div className="relative">
                  <textarea 
                    value={newContribution}
                    onChange={(e) => setNewContribution(e.target.value)}
                    placeholder="Beskriv vad du har sett eller hört som är relevant för ärendet..."
                    className="w-full h-32 p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-visuera-green/20 focus:ring-4 focus:ring-visuera-green/5 transition-all resize-none text-[11px] font-medium text-slate-700 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-3">
                     <span className="text-[9px] font-bold text-slate-300 dark:text-slate-500">{newContribution.length} tecken</span>
                     <button
                        onClick={handleAddContribution}
                        disabled={isSubmittingContrib || !newContribution.trim()}
                        className="px-5 py-2.5 bg-visuera-green text-white rounded-xl shadow-lg shadow-visuera-green/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                      >
                        {isSubmittingContrib ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>Skicka <Send size={12} className="ml-1" /></>
                        )}
                      </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-400 font-bold italic px-1">
                  <CheckCircle2 size={12} className="text-visuera-green" />
                  Inlägget loggas med ditt namn och roll och kan ses av utredare och rektor.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Send = ({ size, className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className} 
    {...props}
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

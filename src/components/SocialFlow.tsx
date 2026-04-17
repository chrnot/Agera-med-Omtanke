import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Archive,
  Info,
  UserCheck,
  Zap
} from 'lucide-react';

interface CaseData {
  id: string;
  title: string;
  reference: string;
  status: 'Mottagande' | 'Utredning' | 'Beslut';
  isCompliant: boolean;
  nextAction: {
    label: string;
    deadline: string;
    isUrgent: boolean;
    automationNote?: string;
  };
  availableActions: string[];
}

const mockCase: CaseData = {
  id: '2026-042',
  title: 'Barnavårdsutredning',
  reference: 'Akt 2026-042',
  status: 'Utredning',
  isCompliant: true,
  nextAction: {
    label: 'Dags för uppföljning av insats',
    deadline: '2026-04-14',
    isUrgent: true,
    automationNote: 'Systemet har hämtat närvaro från skolan automatiskt'
  },
  availableActions: ['Approve', 'RequestMoreInfo', 'Archive']
};

export const SocialFlow: React.FC = () => {
  const [currentCase, setCurrentCase] = React.useState<CaseData>(mockCase);
  const [summary, setSummary] = React.useState('');
  const [role, setRole] = React.useState<'Handläggare' | 'Chef'>('Handläggare');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleApprove = () => {
    setIsProcessing(true);
    
    // Simulate automated flow processing
    setTimeout(() => {
      setCurrentCase(prev => ({
        ...prev,
        status: 'Beslut',
        nextAction: {
          label: 'Signering av beslut krävs',
          deadline: '2026-04-15',
          isUrgent: false,
          automationNote: 'Beslutsunderlag genererat baserat på utredning och lagkrav.'
        }
      }));
      setIsProcessing(false);
      setSummary(''); // Clear for next step
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* 1. Statuspanel (Överst) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-visuera-dark">
              {currentCase.title} – <span className="text-slate-400 font-medium">{currentCase.reference}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">Ansvarig: Anna Andersson</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-visuera-light-green/10 text-visuera-green rounded-full border border-visuera-light-green/20">
            <ShieldCheck size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">GDPR & Lagkrav 2026 OK</span>
          </div>
        </div>

        {/* Process-indikator */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2"></div>
          <div className="relative flex justify-between items-center">
            {['Mottagande', 'Utredning', 'Beslut'].map((step, i) => {
              const isActive = currentCase.status === step;
              const isPast = (currentCase.status === 'Utredning' && i < 1) || (currentCase.status === 'Beslut' && i < 2);
              
              return (
                <div key={step} className="flex flex-col items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                    isActive 
                      ? 'bg-visuera-green border-visuera-light-green/30 text-white scale-110 shadow-lg shadow-visuera-green/20' 
                      : isPast 
                        ? 'bg-visuera-light-green border-white text-white' 
                        : 'bg-white border-slate-100 text-slate-300'
                  }`}>
                    {isPast ? <CheckCircle2 size={20} /> : <span className="text-sm font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wide ${
                    isActive ? 'text-visuera-green' : 'text-slate-400'
                  }`}>
                    {step}
                    {isActive && <span className="block text-[10px] normal-case font-medium text-center">(Här är du)</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 2. Metodstödskortet (Mitten) */}
      <motion.div 
        key={currentCase.status} // Trigger animation on status change
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-8 shadow-xl border-l-4 border-visuera-green relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4">
          <Zap className="text-visuera-green/10" size={120} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-visuera-green/10 rounded-lg text-visuera-green">
              <Info size={24} />
            </div>
            <h3 className="text-xl font-bold text-visuera-dark">Nästa steg enligt Socialtjänstlagen 2026</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1 font-medium italic">Rekommenderad åtgärd:</p>
                <p className="text-lg font-bold text-visuera-dark">{currentCase.nextAction.label}</p>
              </div>

              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                currentCase.nextAction.isUrgent 
                  ? 'bg-red-50 border-red-100 text-red-700' 
                  : 'bg-slate-50 border-slate-100 text-slate-700'
              }`}>
                <Clock size={20} />
                <div>
                  <p className="text-sm font-bold">Deadline: {currentCase.nextAction.deadline}</p>
                  <p className="text-xs opacity-80">
                    {currentCase.nextAction.isUrgent ? '3 dagar kvar – Prioriterat ärende' : 'Planerad uppföljning'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="p-5 bg-visuera-green/5 rounded-2xl border border-visuera-green/10 flex gap-4">
                <div className="mt-1">
                  <Zap size={20} className="text-visuera-green" />
                </div>
                <div>
                  <p className="text-sm font-bold text-visuera-green uppercase tracking-wider mb-1">Datadrivet beslutsstöd</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    "{currentCase.nextAction.automationNote}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Interaktivt Beslutsformulär (Nederst) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-50 rounded-2xl p-8 border border-slate-200 relative"
      >
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
            <div className="w-12 h-12 border-4 border-visuera-green border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-visuera-green font-bold animate-pulse">Automatiserat flöde startat...</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileText size={20} className="text-slate-400" />
            Beslutsunderlag
          </h3>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setRole('Handläggare')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${role === 'Handläggare' ? 'bg-visuera-green text-white' : 'text-slate-400'}`}
            >
              Handläggare
            </button>
            <button 
              onClick={() => setRole('Chef')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${role === 'Chef' ? 'bg-visuera-green text-white' : 'text-slate-400'}`}
            >
              Chef
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <textarea 
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={currentCase.status === 'Utredning' ? "Sammanfattning av samtal med vårdnadshavare..." : "Kommentar till beslut..."}
              className="w-full h-32 bg-white rounded-xl p-4 border border-slate-200 focus:border-visuera-green focus:ring-2 focus:ring-visuera-green/20 outline-none transition-all resize-none"
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-mono">
              LOGGAT: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleApprove}
              disabled={currentCase.status !== 'Utredning'}
              className={`flex items-center justify-center gap-2 bg-white hover:bg-visuera-green hover:text-white text-visuera-dark border border-slate-200 p-4 rounded-xl font-bold transition-all group ${currentCase.status !== 'Utredning' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CheckCircle2 size={18} className="text-visuera-green group-hover:text-white" />
              Bevilja insats
            </button>
            <button className="flex items-center justify-center gap-2 bg-white hover:bg-visuera-green hover:text-white text-visuera-dark border border-slate-200 p-4 rounded-xl font-bold transition-all group">
              <AlertCircle size={18} className="text-amber-500 group-hover:text-white" />
              Begär mer info
            </button>
            <button className="flex items-center justify-center gap-2 bg-white hover:bg-visuera-green hover:text-white text-visuera-dark border border-slate-200 p-4 rounded-xl font-bold transition-all group">
              <Archive size={18} className="text-slate-400 group-hover:text-white" />
              Avsluta ärende
            </button>
          </div>

          {(role === 'Chef' || currentCase.status === 'Beslut') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4 border-t border-slate-200"
            >
              <button 
                disabled={role !== 'Chef'}
                className={`w-full p-5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl ${
                  role === 'Chef' 
                    ? 'bg-visuera-dark text-white hover:bg-black' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <UserCheck size={22} />
                Signera & Arkivera Beslut
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2 uppercase tracking-widest">
                Kräver rollstyrd behörighet: SEKTIONSCHEF
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest px-2">
        <span>Agera Med Omtanke Social-Flow v2.0</span>
        <span>Säker anslutning via JWT</span>
        <span>© 2026 Agera Med Omtanke</span>
      </div>
    </div>
  );
};

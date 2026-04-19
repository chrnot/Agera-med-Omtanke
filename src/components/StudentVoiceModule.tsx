import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  User, 
  CheckCircle2, 
  Mic, 
  Image as ImageIcon, 
  Info, 
  ChevronDown, 
  Heart,
  Baby,
  GraduationCap,
  Users,
  ShieldAlert
} from 'lucide-react';

interface InterviewTemplate {
  id: string;
  label: string;
  icon: React.ReactNode;
  questions: string[];
  purpose: string;
}

const templates: Record<string, InterviewTemplate> = {
  'F-3': {
    id: 'F-3',
    label: 'Lågstadiet (F–3)',
    icon: <Baby size={18} />,
    purpose: 'Fokus på trygghet och konkreta händelser. Fånga upplevelsen utan förhörskänsla.',
    questions: [
      "Kan du berätta vad som hände, som om det vore en film?",
      "Vart på skolan var ni? Fanns det någon vuxen i närheten?",
      "Hur kändes det i magen eller kroppen när det hände?",
      "Vad skulle göra att det kändes bättre och tryggare i skolan imorgon?"
    ]
  },
  '4-6': {
    id: '4-6',
    label: 'Mellanstadiet (4–6)',
    icon: <Users size={18} />,
    purpose: 'Fokus på maktbalans och social kontext. Identifiera mönster.',
    questions: [
      "Beskriv händelseförloppet. Hade det hänt något tidigare under dagen?",
      "Upplever du att du kan säga ifrån, eller känns det svårt? Varför?",
      "Har du pratat med någon hemma eller en kompis om detta?",
      "Vad behöver hända från skolans sida för att du ska känna dig helt trygg igen?"
    ]
  },
  '7-Gy': {
    id: '7-Gy',
    label: 'Högstadiet & Gymnasiet (7–Gy)',
    icon: <GraduationCap size={18} />,
    purpose: 'Fokus på juridik och ansvar. Identifiera diskrimineringsgrunder.',
    questions: [
      "Upplever du att detta har att göra med t.ex. ditt kön, din bakgrund eller någon annan personlig egenskap?",
      "Hur påverkar detta din skolgång och din studiero?",
      "Vilka åtgärder anser du är rimliga för att stoppa detta beteende permanent?",
      "Finns det något digitalt (sociala medier) kopplat till detta som vi behöver känna till?"
    ]
  }
};

interface StudentVoiceModuleProps {
  selectedStage: string;
  onStageChange: (stage: string) => void;
  checkedQuestions: string[];
  onToggleQuestion: (question: string) => void;
  childRightsStatus: string[];
  onToggleChildRight: (point: string) => void;
  ageAdaptedConfirmation: boolean;
  onToggleConfirmation: (val: boolean) => void;
  studentVersion: string;
}

export const StudentVoiceModule: React.FC<StudentVoiceModuleProps> = ({
  selectedStage,
  onStageChange,
  checkedQuestions,
  onToggleQuestion,
  childRightsStatus,
  onToggleChildRight,
  ageAdaptedConfirmation,
  onToggleConfirmation,
  studentVersion
}) => {
  const [showSupport, setShowSupport] = React.useState(false);
  const currentTemplate = templates[selectedStage];
  const charCount = studentVersion.length;
  const isMinCharsMet = charCount >= 150;

  const childRightsPoints = [
    { id: 'informed', text: 'Eleven har informerats om varför samtalet sker.' },
    { id: 'unfiltered', text: 'Elevens version har dokumenterats utan tolkningar.' },
    { id: 'actions', text: 'Eleven har tillfrågats om önskade åtgärder.' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-visuera-green/10 rounded-2xl flex items-center justify-center text-visuera-green">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-visuera-dark uppercase tracking-widest">Elevens Röst</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Säkerställ dokumentation enligt Barnkonventionen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${isMinCharsMet ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
             {isMinCharsMet ? 'Rättssäker volym' : 'För ytligt'}
           </span>
        </div>
      </div>

      {/* Stage Selection */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Välj elevens stadium</label>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(templates).map(t => (
            <button
              key={t.id}
              onClick={() => {
                onStageChange(t.id);
                setShowSupport(true);
              }}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                selectedStage === t.id
                  ? 'bg-visuera-green/5 border-visuera-green text-visuera-green shadow-sm'
                  : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${
                selectedStage === t.id ? 'bg-visuera-green text-white shadow-lg shadow-visuera-green/20' : 'bg-white text-slate-300 group-hover:text-visuera-green shadow-sm'
              }`}>
                {t.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedStage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setShowSupport(!showSupport)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border font-black uppercase tracking-widest text-[10px] ${
                showSupport ? 'bg-visuera-dark text-white border-visuera-dark shadow-xl shadow-visuera-dark/20' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={14} />
                <span>Samtalsstöd för {currentTemplate?.label}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 ${showSupport ? 'rotate-180' : ''}`} />
            </button>

            {showSupport && currentTemplate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 shadow-inner"
              >
                <p className="text-[10px] text-slate-500 font-bold italic leading-relaxed text-center px-4">
                  "{currentTemplate.purpose}"
                </p>
                <div className="space-y-2">
                  {currentTemplate.questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onToggleQuestion(q)}
                      className={`w-full p-4 rounded-xl border transition-all text-left flex items-start gap-3 group/q ${
                        checkedQuestions.includes(q)
                          ? 'bg-white border-visuera-green text-visuera-green shadow-sm'
                          : 'bg-white/50 border-slate-200/50 text-slate-600 hover:border-visuera-green/30'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checkedQuestions.includes(q) ? 'bg-visuera-green border-visuera-green text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {checkedQuestions.includes(q) && <CheckCircle2 size={10} strokeWidth={4} />}
                      </div>
                      <span className="text-[11px] font-bold leading-relaxed">{q}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 pt-2 border-t border-slate-50">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Skriven dokumentation</span>
          <span className={isMinCharsMet ? 'text-emerald-600' : 'text-orange-500'}>
            {charCount} / 150
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((charCount / 150) * 100, 100)}%` }}
            className={`h-full transition-colors duration-500 ${isMinCharsMet ? 'bg-emerald-500' : 'bg-orange-500'}`}
          />
        </div>
      </div>

      {/* Multimedia Mockup */}
      <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <ImageIcon size={14} className="text-slate-300" />
          Kompletterande dokumentation
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <button className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-center gap-2 text-[10px] font-bold text-slate-500 hover:border-visuera-green/30 hover:text-visuera-green transition-all group shadow-sm">
            <Mic size={20} className="text-slate-300 group-hover:text-visuera-green transition-colors" />
            Ljudfil (Intervju)
          </button>
          <button className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-center gap-2 text-[10px] font-bold text-slate-500 hover:border-visuera-green/30 hover:text-visuera-green transition-all group shadow-sm">
            <ImageIcon size={20} className="text-slate-300 group-hover:text-visuera-green transition-colors" />
            Bild (Teckning)
          </button>
        </div>
      </div>

      {/* Child Rights Checklist */}
      <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
             <Heart size={16} fill="currentColor" />
           </div>
           <div>
             <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest leading-none">Barnrättsperspektiv</h4>
             <p className="text-[10px] text-blue-700/60 font-medium mt-1">Säkerställ att samtalet följer Barnkonventionen</p>
           </div>
        </div>

        <div className="space-y-4">
          {childRightsPoints.map(point => (
            <label 
              key={point.id}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div className="relative flex items-center mt-0.5">
                <input 
                  type="checkbox"
                  checked={childRightsStatus.includes(point.id)}
                  onChange={() => onToggleChildRight(point.id)}
                  className="w-5 h-5 rounded-lg border-2 border-blue-200 text-blue-600 focus:ring-blue-500/20 cursor-pointer transition-colors"
                />
              </div>
              <span className={`text-[11px] font-medium leading-relaxed transition-colors ${
                childRightsStatus.includes(point.id) ? 'text-blue-900' : 'text-blue-700/70 group-hover:text-blue-800'
              }`}>
                {point.text}
              </span>
            </label>
          ))}
        </div>

        <div className="pt-4 border-t border-blue-100/30">
          <label className="flex items-center gap-3 p-4 bg-white/60 rounded-2xl border border-blue-100 cursor-pointer hover:bg-white transition-all">
            <input 
              type="checkbox"
              required
              checked={ageAdaptedConfirmation}
              onChange={(e) => onToggleConfirmation(e.target.checked)}
              className="w-5 h-5 rounded-lg border-2 border-blue-300 text-visuera-green focus:ring-visuera-green/20 cursor-pointer"
            />
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
              Jag bekräftar att frågorna har anpassats efter barnets ålder och mognad
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

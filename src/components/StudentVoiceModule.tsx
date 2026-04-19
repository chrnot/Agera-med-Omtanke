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
  const currentTemplate = templates[selectedStage];
  const charCount = studentVersion.length;
  const isMinCharsMet = charCount >= 150;

  const childRightsPoints = [
    { id: 'informed', text: 'Eleven har informerats om varför samtalet sker.' },
    { id: 'unfiltered', text: 'Elevens version har dokumenterats utan tolkningar.' },
    { id: 'actions', text: 'Eleven har tillfrågats om önskade åtgärder.' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stage Selection */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400极 uppercase tracking-[0.2em] ml-1">Välj elevens stadium för anpassad guide</label>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(templates).map(t => (
            <button
              key={t.id}
              onClick={() => onStageChange(t.id)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                selectedStage === t.id
                  ? 'bg-visuera-green/5 border-visuera-green text-visuera-green shadow-sm'
                  : 'bg-white border-slate-100 text-slate-400 hover:border-visuera-green/30'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
                selectedStage === t.id ? 'bg-visuera-green text-white' : 'bg-slate-50 text-slate-300 group-hover:text-visuera-green'
              }`}>
                {t.icon}
              </div>
              <span className="text-[11px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentTemplate && (
          <motion.div
            key={currentTemplate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Interactive Question Card */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 border-l-4 border-l-visuera-green shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-visuera-green/10 rounded-xl flex items-center justify-center text-visuera-green">
                   <MessageSquare size={16} />
                 </div>
                 <div>
                   <h4 className="text-xs font-black text-visuera-dark uppercase tracking-widest leading-none">Intervjuguide: {currentTemplate.label}</h4>
                   <p className="text-[10px] text-slate-500 font-medium mt-1 italic">{currentTemplate.purpose}</p>
                 </div>
              </div>

              <div className="space-y-3">
                {currentTemplate.questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onToggleQuestion(q)}
                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-3 group/q ${
                      checkedQuestions.includes(q)
                        ? 'bg-white border-visuera-green text-visuera-green shadow-sm'
                        : 'bg-white/50 border-slate-100 text-slate-600 hover:border-visuera-green/20'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checkedQuestions.includes(q) ? 'bg-visuera-green border-visuera-green text-white shadow-sm' : 'border-slate-200 bg-white group-hover/q:border-visuera-green/50'
                    }`}>
                      {checkedQuestions.includes(q) && <CheckCircle2 size={12} strokeWidth={3} />}
                    </div>
                    <span className="text-xs font-semibold leading-relaxed">{q}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Progress Indicator */}
            <div className="px-2 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400">Fokus på barnets perspektiv</span>
                <span className={isMinCharsMet ? 'text-visuera-green' : 'text-slate-400'}>
                  {charCount} / 150 tecken
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((charCount / 150) * 100, 100)}%` }}
                  className={`h-full transition-colors duration-500 ${isMinCharsMet ? 'bg-visuera-green shadow-[0_0_10px_rgba(5,150,105,0.3)]' : 'bg-orange-400'}`}
                />
              </div>
              {!isMinCharsMet && (
                <p className="text-[9px] text-orange-500 font-bold italic animate-pulse">
                  Fortsätt dokumentera elevens röst – fördjupad dokumentation krävs för rättssäkerhet.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

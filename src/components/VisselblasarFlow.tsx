import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  EyeOff,
  MessageSquare,
  FileText,
  AlertTriangle,
  Clock,
  Scale,
  Key,
  X,
  Info,
  Send,
  ShieldAlert
} from 'lucide-react';

interface WhistleFormData {
  category: string;
  description: string;
  location: string;
  incidentDate: string;
  involvedPersons: string;
  anonymityLevel: 'full' | 'partial';
}

const steps = [
  { id: 1, title: 'Rapportering', status: 'current' },
  { id: 2, title: 'Bekräftelse', status: 'upcoming' },
  { id: 3, title: 'Utredning', status: 'upcoming' },
  { id: 4, title: 'Återkoppling', status: 'upcoming' }
];

export const VisselblasarFlow = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [caseCode] = useState('WB-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [formData, setFormData] = useState<WhistleFormData>({
    category: '',
    description: '',
    location: '',
    incidentDate: '',
    involvedPersons: '',
    anonymityLevel: 'full'
  });

  const updateFormData = (field: keyof WhistleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="max-w-5xl mx-auto px-6 space-y-8 pb-20">
      {/* Security Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-visuera-dark rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Lock size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-visuera-green rounded-full text-[10px] font-bold uppercase tracking-widest">
                Säker Anslutning
              </div>
              <div className="flex items-center gap-1 text-visuera-light-green">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">End-to-end krypterat</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold">Visselblåsartjänst</h1>
            <p className="text-slate-400 text-sm mt-2 max-w-xl">
              Denna kanal är avsedd för rapportering av allvarliga missförhållanden. Din anonymitet är tekniskt garanterad.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Din unika ärendekod</div>
            <div className="text-xl font-mono font-bold text-visuera-light-green tracking-wider">{caseCode}</div>
            <div className="text-[9px] text-orange-400 mt-2 italic">Spara koden! Den krävs för anonym uppföljning.</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Support & Law */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-visuera-dark">
              <Scale size={20} className="text-visuera-green" />
              <h3 className="font-bold">Lagstadgat skydd</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-visuera-dark mb-1">Repressalieförbud</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Lagen förbjuder alla former av bestraffning eller diskriminering av den som rapporterar.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-visuera-dark mb-1">Sekretess</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Uppgifter som kan identifiera dig omfattas av strikt sekretess enligt offentlighets- och sekretesslagen.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-visuera-green/5 rounded-3xl p-8 border border-visuera-green/10 space-y-4">
            <div className="flex items-center gap-3 text-visuera-green">
              <Info size={20} />
              <h3 className="font-bold">Vad kan anmälas?</h3>
            </div>
            <ul className="space-y-2">
              {[
                'Mutor och korruption',
                'Ekonomisk brottslighet',
                'Allvarliga miljöbrott',
                'Säkerhetsbrister',
                'Allvarliga trakasserier'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                  <div className="w-1 h-1 rounded-full bg-visuera-green" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Reporting Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 min-h-[600px] flex flex-col">
            {!reportSubmitted ? (
              <div className="space-y-8 flex-1">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-visuera-green">
                      <EyeOff size={20} />
                    </div>
                    <h3 className="font-bold text-visuera-dark">Säker Rapportering</h3>
                  </div>
                  <div className="flex gap-2">
                    {steps.map((s, i) => (
                      <div key={s.id} className={`w-2 h-2 rounded-full ${i <= currentStepIndex ? 'bg-visuera-green' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>

                {currentStepIndex === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori av missförhållande *</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                      >
                        <option value="">Välj kategori...</option>
                        <option value="Mutor">Mutor & Korruption</option>
                        <option value="Ekonomi">Ekonomiska oegentligheter</option>
                        <option value="Miljö">Miljöbrott</option>
                        <option value="Arbetsmiljö">Allvarliga brister i arbetsmiljö</option>
                        <option value="Annat">Annat allvarligt missförhållande</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Beskrivning av händelsen *</label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        placeholder="Beskriv vad som hänt så detaljerat som möjligt utan att avslöja din egen identitet..."
                        className="w-full h-48 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Plats/Enhet</label>
                        <input 
                          type="text"
                          value={formData.location}
                          onChange={(e) => updateFormData('location', e.target.value)}
                          placeholder="Var skedde detta?"
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tidpunkt</label>
                        <input 
                          type="text"
                          value={formData.incidentDate}
                          onChange={(e) => updateFormData('incidentDate', e.target.value)}
                          placeholder="När skedde detta?"
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex gap-4">
                      <ShieldAlert className="text-orange-500 shrink-0" size={24} />
                      <div>
                        <h4 className="text-sm font-bold text-orange-800 mb-1">Viktigt om din anonymitet</h4>
                        <p className="text-xs text-orange-700 leading-relaxed">
                          Om du väljer att vara helt anonym kommer vi inte att kunna kontakta dig utanför denna portal. Du måste själv logga in med din kod för att se svar.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Välj anonymitetsnivå *</label>
                      <div className="grid grid-cols-1 gap-4">
                        <button 
                          onClick={() => updateFormData('anonymityLevel', 'full')}
                          className={`p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            formData.anonymityLevel === 'full' ? 'border-visuera-green bg-visuera-green/5' : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-visuera-dark">Helt anonym</div>
                            <div className="text-xs text-slate-500">Inga personuppgifter sparas. All kontakt sker via portalen.</div>
                          </div>
                          {formData.anonymityLevel === 'full' && <CheckCircle2 className="text-visuera-green" />}
                        </button>
                        <button 
                          onClick={() => updateFormData('anonymityLevel', 'partial')}
                          className={`p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            formData.anonymityLevel === 'partial' ? 'border-visuera-green bg-visuera-green/5' : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-visuera-dark">Namngiven för mottagaren</div>
                            <div className="text-xs text-slate-500">Mottagaren vet vem du är, men din identitet skyddas mot organisationen.</div>
                          </div>
                          {formData.anonymityLevel === 'partial' && <CheckCircle2 className="text-visuera-green" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <input type="checkbox" className="w-4 h-4 accent-visuera-green" />
                        <span className="text-xs text-slate-600 font-medium">Jag intygar att jag har skälig anledning att anta att informationen är sann.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="mt-auto pt-8 border-t border-slate-50 flex justify-between">
                  <button 
                    onClick={() => setCurrentStepIndex(0)}
                    disabled={currentStepIndex === 0}
                    className={`px-8 py-4 rounded-2xl text-sm font-bold transition-all ${
                      currentStepIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Föregående
                  </button>
                  <button 
                    onClick={() => {
                      if (currentStepIndex === 0) setCurrentStepIndex(1);
                      else setReportSubmitted(true);
                    }}
                    className="bg-visuera-dark text-white px-10 py-4 rounded-2xl text-sm font-bold hover:bg-visuera-dark/90 transition-all flex items-center gap-2 shadow-xl"
                  >
                    {currentStepIndex === 0 ? 'Nästa steg' : 'Skicka säker rapport'}
                    <Send size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-8 py-12"
              >
                <div className="w-24 h-24 bg-visuera-green/10 rounded-full flex items-center justify-center text-visuera-green mb-4">
                  <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-visuera-dark">Rapporten är mottagen</h2>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Ditt ärende har registrerats säkert. Vi kommer att granska informationen och återkoppla inom lagstadgad tid.
                  </p>
                </div>

                <div className="w-full max-w-md bg-visuera-dark rounded-3xl p-8 text-white space-y-6">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">Viktigt: Spara din kod</div>
                    <div className="text-3xl font-mono font-bold text-visuera-light-green tracking-widest">{caseCode}</div>
                  </div>
                  <div className="h-px bg-white/10 w-full" />
                  <div className="space-y-4 text-left">
                    <div className="flex gap-3">
                      <Clock size={16} className="text-visuera-green shrink-0 mt-1" />
                      <div className="text-xs text-slate-300">Bekräftelse skickas till din säkra inkorg inom <strong>7 dagar</strong>.</div>
                    </div>
                    <div className="flex gap-3">
                      <MessageSquare size={16} className="text-visuera-green shrink-0 mt-1" />
                      <div className="text-xs text-slate-300">Återkoppling om åtgärder lämnas inom <strong>3 månader</strong>.</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setReportSubmitted(false);
                    setCurrentStepIndex(0);
                  }}
                  className="text-visuera-green font-bold text-sm hover:underline"
                >
                  Skicka en ny rapport
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

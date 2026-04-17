import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Clock,
  AlertCircle,
  ClipboardList,
  Scale,
  Calendar,
  User,
  Mail,
  Info,
  PenTool,
  FileText,
  Activity,
  Stethoscope,
  Brain,
  ChevronRight,
  Search,
  MessageSquare,
  X
} from 'lucide-react';

interface AvvikelseFormData {
  school: string;
  incidentType: string;
  category: string;
  incidentDate: string;
  incidentDescription: string;
  immediateActions: string;
  reporterName: string;
  reporterEmail: string;
  insatsType: 'MLA' | 'PLA' | '';
  severity: string;
  probability: string;
  avoidable: string;
  investigationText: string;
  actionPlan: { action: string; responsible: string; deadline: string }[];
  followUpText: string;
}

const steps = [
  { id: 1, title: 'Anmälan', status: 'current' },
  { id: 2, title: 'Bedömning', status: 'upcoming' },
  { id: 3, title: 'Utredning', status: 'upcoming' },
  { id: 4, title: 'Åtgärdsplan', status: 'upcoming' },
  { id: 5, title: 'Uppföljning', status: 'upcoming' }
];

export const AvvikelseFlow = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showLegal, setShowLegal] = useState(false);
  const [formData, setFormData] = useState<AvvikelseFormData>({
    school: '',
    incidentType: '',
    category: '',
    incidentDate: '',
    incidentDescription: '',
    immediateActions: '',
    reporterName: '',
    reporterEmail: '',
    insatsType: '',
    severity: '',
    probability: '',
    avoidable: '',
    investigationText: '',
    actionPlan: [{ action: '', responsible: '', deadline: '' }],
    followUpText: ''
  });

  const currentStep = steps[currentStepIndex];

  const updateFormData = (field: keyof AvvikelseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStepContent = (stepId: number) => {
    switch (stepId) {
      case 1:
        return {
          support: "Rapportera avvikelsen direkt. Beskriv händelseförloppet sakligt. Vid akuta händelser vidtas omedelbara åtgärder först.",
          deadline: "Skyndsamt",
          urgency: "Hög",
          action: "Skicka anmälan till chef"
        };
      case 2:
        return {
          support: "MLA/PLA granskar rapporten. Klassificera händelsen utifrån allvarlighetsgrad och sannolikhet. Bedöm om skadan var undvikbar.",
          deadline: "Inom 48h",
          urgency: "Normal",
          action: "Slutför initial bedömning"
        };
      case 3:
        return {
          support: "Utred varför händelsen inträffade (rotorsaksanalys). Fokusera på systemfel snarare än individfel.",
          deadline: "Inom 2 veckor",
          urgency: "Normal",
          action: "Dokumentera orsaksanalys"
        };
      case 4:
        return {
          support: "Besluta om långsiktiga åtgärder för att förhindra upprepning. Varje åtgärd ska ha en ansvarig och ett slutdatum.",
          deadline: "Inom 1 vecka efter utredning",
          urgency: "Hög",
          action: "Fastställ åtgärdsplan"
        };
      case 5:
        return {
          support: "Kontrollera att åtgärderna haft avsedd effekt. Dela lärdomar vid yrkesträffar.",
          deadline: "Enligt tidsplan",
          urgency: "Låg",
          action: "Utvärdera och avsluta ärende"
        };
      default:
        return null;
    }
  };

  const content = getStepContent(currentStep.id);

  const mlaCategories = [
    'Läkemedelshantering/Vaccin',
    'Hygienrutiner',
    'Medicinteknisk utrustning',
    'Journalföring (Medicinsk)',
    'Remisshantering',
    'Annat'
  ];

  const plaCategories = [
    'Testmaterial/Protokoll',
    'Journaldokumentation',
    'Informationshantering',
    'Utredningsprocess',
    'Sekretess',
    'Annat'
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 space-y-8 pb-20">
      {/* Status Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                Ärende: AVV-2026-042
              </span>
              <div className="flex items-center gap-1 text-visuera-green bg-visuera-green/10 px-3 py-1 rounded-full">
                <Activity size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Patientsäkerhet</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-visuera-dark">Avvikelsehantering – {formData.insatsType || 'Ny anmälan'}</h1>
          </div>
          
          <div className="flex gap-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    idx < currentStepIndex ? 'bg-visuera-green text-white' :
                    idx === currentStepIndex ? 'bg-visuera-green/20 text-visuera-green ring-4 ring-visuera-green/10' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {idx < currentStepIndex ? <CheckCircle2 size={20} /> : <span className="font-bold">{step.id}</span>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                    idx === currentStepIndex ? 'text-visuera-green' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-8 md:w-12 h-[2px] mb-6 mx-2 ${
                    idx < currentStepIndex ? 'bg-visuera-green' : 'bg-slate-100'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-visuera-dark rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Zap size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-visuera-green rounded-lg flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Metodstöd</span>
              </div>
              
              <h3 className="text-xl font-bold mb-4">Processstöd: {currentStep.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                {content?.support}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-visuera-green" />
                    <span className="text-sm">Tidsfrist</span>
                  </div>
                  <span className="text-sm font-bold">{content?.deadline}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={18} className="text-orange-400" />
                    <span className="text-sm">Prioritet</span>
                  </div>
                  <span className="text-sm font-bold">{content?.urgency}</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowLegal(!showLegal)}
            className="w-full p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-visuera-green transition-colors">
                <Scale size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-visuera-dark">Lagstöd & Riktlinjer</div>
                <div className="text-xs text-slate-400">HSL, Patiently, Lex Maria</div>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Statistics Dashboard */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avvikelsestatistik</span>
              <BarChart3 size={14} className="text-visuera-green" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">MLA (Medicinsk)</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">24</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">PLA (Psykologisk)</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Allvarliga (Eskalerade)</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">3</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-visuera-green">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-visuera-dark">Dokumentation: {currentStep.title}</h3>
                  <p className="text-xs text-slate-400">Systematiskt patientsäkerhetsarbete</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-8">
              {currentStep.id === 1 ? (
                /* Step 1: Anmälan Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Använd detta formulär för att rapportera avvikelser, tillbud eller risker inom elevhälsans medicinska eller psykologiska insatser. 
                    </p>
                    <p className="text-[10px] text-visuera-green font-bold mt-4 uppercase tracking-widest">* Obligatoriskt fält</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Typ av insats *</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => updateFormData('insatsType', 'MLA')}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                          formData.insatsType === 'MLA' 
                            ? 'border-visuera-green bg-visuera-green/5 text-visuera-green' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-400'
                        }`}
                      >
                        <Stethoscope size={32} />
                        <span className="font-bold">MLA (Medicinsk)</span>
                      </button>
                      <button
                        onClick={() => updateFormData('insatsType', 'PLA')}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                          formData.insatsType === 'PLA' 
                            ? 'border-visuera-green bg-visuera-green/5 text-visuera-green' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-400'
                        }`}
                      >
                        <Brain size={32} />
                        <span className="font-bold">PLA (Psykologisk)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Skola *</label>
                      <select 
                        value={formData.school}
                        onChange={(e) => updateFormData('school', e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                      >
                        <option value="">Välj skola...</option>
                        <option value="Danderyd">Danderyds Gymnasium</option>
                        <option value="Enebyberg">Enebybergsskolan</option>
                        <option value="Mörby">Mörbyskolan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori *</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                      >
                        <option value="">Välj kategori...</option>
                        {formData.insatsType === 'MLA' ? mlaCategories.map(c => <option key={c} value={c}>{c}</option>) : null}
                        {formData.insatsType === 'PLA' ? plaCategories.map(c => <option key={c} value={c}>{c}</option>) : null}
                        {!formData.insatsType && <option disabled>Välj insatstyp först</option>}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Händelseförlopp *</label>
                    <textarea 
                      value={formData.incidentDescription}
                      onChange={(e) => updateFormData('incidentDescription', e.target.value)}
                      placeholder="Beskriv sakligt vad som hänt..."
                      className="w-full h-32 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Omedelbara åtgärder *</label>
                    <textarea 
                      value={formData.immediateActions}
                      onChange={(e) => updateFormData('immediateActions', e.target.value)}
                      placeholder="Vad gjordes direkt för att begränsa skadan?"
                      className="w-full h-24 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                    />
                  </div>
                </div>
              ) : currentStep.id === 2 ? (
                /* Step 2: Bedömning Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-visuera-dark mb-2">Initial bedömning (MLA/PLA/Chef)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Klassificera händelsen utifrån riskmatrisen. Bedöm om händelsen medfört eller kunnat medföra en allvarlig vårdskada.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Allvarlighetsgrad *</label>
                      <select 
                        value={formData.severity}
                        onChange={(e) => updateFormData('severity', e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                      >
                        <option value="">Välj nivå...</option>
                        <option value="Lindrig">Lindrig (Ingen/obetydlig skada)</option>
                        <option value="Måttlig">Måttlig (Övergående skada)</option>
                        <option value="Betydande">Betydande (Bestående skada)</option>
                        <option value="Allvarlig">Allvarlig (Dödsfall/svår skada)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sannolikhet för upprepning *</label>
                      <select 
                        value={formData.probability}
                        onChange={(e) => updateFormData('probability', e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                      >
                        <option value="">Välj sannolikhet...</option>
                        <option value="Mycket liten">Mycket liten</option>
                        <option value="Liten">Liten</option>
                        <option value="Medel">Medel</option>
                        <option value="Stor">Stor</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle size={18} />
                      <h5 className="text-xs font-bold uppercase tracking-widest">Vårdskadebedömning</h5>
                    </div>
                    <div className="flex gap-4">
                      {['Ja', 'Nej'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateFormData('avoidable', opt)}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                            formData.avoidable === opt 
                              ? 'bg-amber-600 border-amber-600 text-white' 
                              : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-100'
                          }`}
                        >
                          Var skadan undvikbar? {opt}
                        </button>
                      ))}
                    </div>
                    {formData.avoidable === 'Ja' && formData.severity === 'Allvarlig' && (
                      <div className="p-4 bg-red-100 rounded-xl border border-red-200 flex items-center gap-3 text-red-700">
                        <AlertCircle size={20} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Trigger: Eskalera till verksamhetschef för Lex Maria-anmälan!</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : currentStep.id === 3 ? (
                /* Step 3: Utredning Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-visuera-dark mb-2">Utredning & Orsaksanalys</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sök svar på <strong>varför</strong> händelsen inträffade. Analysera områden som utförande, material, samverkan och rutiner.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rotorsaksanalys *</label>
                    <textarea 
                      value={formData.investigationText}
                      onChange={(e) => updateFormData('investigationText', e.target.value)}
                      placeholder="Beskriv bakomliggande orsaker. Var det brist i rutiner, teknik eller kommunikation?"
                      className="w-full h-48 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {['Utförande', 'Material/Teknik', 'Samverkan', 'Rutiner'].map(area => (
                      <div key={area} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl">
                        <div className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-visuera-green" />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{area} analyserad</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentStep.id === 4 ? (
                /* Step 4: Åtgärdsplan Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-visuera-dark mb-2">Beslut om åtgärder</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Fastställ konkreta åtgärder för att förhindra att händelsen upprepas. Varje åtgärd måste ha en ansvarig person.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {formData.actionPlan.map((item, idx) => (
                      <div key={idx} className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-visuera-green uppercase tracking-widest">Åtgärd {idx + 1}</span>
                          <button className="text-slate-300 hover:text-red-400 transition-colors"><X size={16} /></button>
                        </div>
                        <input 
                          type="text"
                          placeholder="Beskriv åtgärd (t.ex. revidering av rutin)"
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text"
                            placeholder="Ansvarig person"
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm"
                          />
                          <input 
                            type="date"
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-visuera-green/50 hover:text-visuera-green transition-all">
                      + Lägg till åtgärd
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 5: Uppföljning Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-visuera-dark mb-2">Uppföljning & Lärande</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Säkerställ att åtgärderna haft avsedd effekt. Dokumentera lärdomar för den årliga patientsäkerhetsberättelsen.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Utvärdering av resultat *</label>
                    <textarea 
                      value={formData.followUpText}
                      onChange={(e) => updateFormData('followUpText', e.target.value)}
                      placeholder="Har åtgärderna fungerat? Vad har vi lärt oss?"
                      className="w-full h-48 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                    />
                  </div>

                  <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 space-y-6 shadow-sm">
                    <h5 className="text-xs font-bold text-visuera-dark uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-visuera-green" />
                      Checklista för avslut
                    </h5>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        'Åtgärderna är genomförda och verifierade',
                        'Lärdomar har delats vid yrkesträff',
                        'Ärendet är sammanställt för patientsäkerhetsberättelse',
                        'Rapport skickad till verksamhetschef',
                        'Ärendet arkiverat i systemet'
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <input type="checkbox" className="w-4 h-4 accent-visuera-green" />
                          <span className="text-xs text-slate-600">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h5 className="text-xs font-bold text-visuera-dark uppercase tracking-widest flex items-center gap-2 mb-4">
                        <PenTool size={14} className="text-visuera-green" />
                        Signering av MLA/PLA
                      </h5>
                      <div className="h-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-xs italic">
                        Digital signering här...
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button 
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className={`px-8 py-4 rounded-2xl text-sm font-bold transition-all ${
                  currentStepIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Föregående steg
              </button>
              
              <div className="flex gap-4">
                <button className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  Spara utkast
                </button>
                <button 
                  onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
                  className="bg-visuera-green text-white px-10 py-4 rounded-2xl text-sm font-bold hover:bg-visuera-light-green transition-all shadow-lg shadow-visuera-green/20 flex items-center gap-2"
                >
                  {currentStepIndex === steps.length - 1 ? 'Slutför ärende' : 'Nästa steg'}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Legal Overlay */}
      <AnimatePresence>
        {showLegal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-visuera-dark/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-visuera-green rounded-xl flex items-center justify-center text-white">
                    <Scale size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-visuera-dark">Lagstöd & Riktlinjer</h3>
                </div>
                <button onClick={() => setShowLegal(false)} className="text-slate-400 hover:text-visuera-dark transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <h4 className="font-bold text-visuera-dark flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-visuera-green"></div>
                    Patientsäkerhetslagen (2010:659)
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Vårdgivaren ska bedriva ett systematiskt patientsäkerhetsarbete. Detta innebär att utreda händelser som medfört eller kunnat medföra en vårdskada.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-visuera-dark flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-visuera-green"></div>
                    Lex Maria (SOSFS 2005:28)
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Skyldighet att anmäla händelser som har medfört eller kunnat medföra en allvarlig vårdskada till Inspektionen för vård och omsorg (IVO).
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-visuera-dark flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-visuera-green"></div>
                    Dokumentationskrav
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    All avvikelsehantering ska dokumenteras på ett sätt som möjliggör uppföljning och lärande utan att peka ut enskilda individer i onödan.
                  </p>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setShowLegal(false)}
                  className="w-full py-4 bg-visuera-dark text-white rounded-2xl font-bold hover:bg-visuera-dark/90 transition-all"
                >
                  Jag förstår
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

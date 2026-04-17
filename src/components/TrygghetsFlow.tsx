import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Zap, 
  BarChart3,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  AlertTriangle,
  Users,
  FileText,
  Scale,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Info,
  PenTool,
  FileCheck,
  ChevronDown,
  Building2,
  Layers
} from 'lucide-react';
import { caseService } from '../services/caseService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface Step {
  id: number;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface TrygghetsFlowProps {
  isQuickReport?: boolean;
  onSuccess?: (caseId: string) => void;
  initialCaseId?: string | null;
  cases?: any[];
}

const INITIAL_STEPS: Step[] = [
  { id: 1, title: 'Anmälan', status: 'current' },
  { id: 2, title: 'Tilldelning', status: 'upcoming' },
  { id: 3, title: 'Utredning', status: 'upcoming' },
  { id: 4, title: 'Åtgärder', status: 'upcoming' },
  { id: 5, title: 'Uppföljning', status: 'upcoming' },
  { id: 6, title: 'Avslut', status: 'upcoming' },
];

const DEFAULT_FORM_DATA = {
  area: '',
  school: '',
  studentName: '',
  studentClass: '',
  reportType: [] as string[],
  incidentDate: '',
  incidentLocation: '',
  activeParticipants: '',
  incidentDescription: '',
  actionsTaken: [] as string[],
  actionsTakenOther: '',
  guardianContacted: '',
  followUpScheduled: '',
  reporterName: '',
  reporterEmail: '',
  reporterPhone: '',
  schoolId: '',
  authorityId: '',
  // Step 2: Tilldelning
  assignedTeam: '',
  assignedTeacher: '',
  assignedTeacherUid: '',
  // Step 3 & 4 fields
  studentSSN: '',
  guardianContactStatus: '',
  investigationDate: '',
  investigationText: '',
  studentVersion: '',
  incidentConfirmed: '',
  discriminationGround: '',
  actionsText: '',
  closureDate: '',
  closureReason: '',
  // Step 4 fields
  followUpText: '',
  followUpClosureDate: '',
  // Step 5 fields
  followUpDecision: '',
  signatureName: '',
  signatureDate: '',
  isClosed: false
};

export const TrygghetsFlow = ({ isQuickReport = false, onSuccess, initialCaseId, cases = [] }: TrygghetsFlowProps) => {
  const [activeCaseId, setActiveCaseId] = React.useState<string | null>(initialCaseId || null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [documentation, setDocumentation] = React.useState('');

  // Form State
  const [formData, setFormData] = React.useState(DEFAULT_FORM_DATA);
  const [showLegal, setShowLegal] = React.useState(false);
  const [showInvestigationInfo, setShowInvestigationInfo] = React.useState(false);
  const [showDecisionInfo, setShowDecisionInfo] = React.useState(false);
  const [showActionsInfo, setShowActionsInfo] = React.useState(false);
  const [showCompletedItems, setShowCompletedItems] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const [selectedParticipants, setSelectedParticipants] = React.useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = React.useState<string[]>([]);
  const [completedChecklistItems, setCompletedChecklistItems] = React.useState<string[]>([]);

  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [authorities, setAuthorities] = React.useState<any[]>([]);
  const [selectedAuthority, setSelectedAuthority] = React.useState<string>('');
  const [availableSchools, setAvailableSchools] = React.useState<any[]>([]);
  const [availableStaff, setAvailableStaff] = React.useState<any[]>([]);
  const [availableTeams, setAvailableTeams] = React.useState<string[]>([]);

  // Filter cases by school for statistics
  const schoolCases = React.useMemo(() => {
    if (!userProfile?.school) return cases;
    return cases.filter(c => c.school === userProfile.school);
  }, [cases, userProfile?.school]);

  // Update activeCaseId when initialCaseId changes
  React.useEffect(() => {
    setActiveCaseId(initialCaseId || null);
    // Reset basic state when switching to "new" mode
    if (!initialCaseId) {
      setFormData(DEFAULT_FORM_DATA);
      setCurrentStepIndex(0);
      setSelectedParticipants([]);
      setSelectedActivities([]);
      setCompletedChecklistItems([]);
      setSelectedAuthority('');
      setError(null);
      setIsSubmitted(false);
    }
  }, [initialCaseId]);

  // Fetch school and authority list
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolsSnap = await getDocs(collection(db, 'schools'));
        setAvailableSchools(schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const authoritiesSnap = await getDocs(collection(db, 'authorities'));
        const authoritiesData = authoritiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAuthorities(authoritiesData);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch staff and extract teams for selected school
  React.useEffect(() => {
    const fetchStaff = async () => {
      const schoolTarget = formData.school;
      if (!schoolTarget) {
        setAvailableStaff([]);
        setAvailableTeams([]);
        return;
      }
      try {
        // Query users where school is the selected one
        const q = query(collection(db, 'users'), where('school', '==', schoolTarget));
        const staffSnap = await getDocs(q);
        const staffData = staffSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
        
        setAvailableStaff(staffData);
        
        // Extract teams
        const teams = Array.from(new Set(staffData.map((s: any) => s.team).filter(Boolean))) as string[];
        
        // Sorting: F, 1, 2, 3, 4, 5, 6, others (like 'Övriga')
        const teamOrder = ['F', '1', '2', '3', '4', '5', '6'];
        const sortedTeams = teams.sort((a, b) => {
          const idxA = teamOrder.indexOf(a);
          const idxB = teamOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        });
        
        if (sortedTeams.length > 0 && !formData.assignedTeam) {
            const defaultTeam = sortedTeams.includes('Övriga') ? 'Övriga' : sortedTeams[0];
            setFormData(prev => ({ ...prev, assignedTeam: defaultTeam }));
        }

        setAvailableTeams(sortedTeams);
      } catch (err) {
        console.error("Error fetching staff for school:", err);
      }
    };
    fetchStaff();
  }, [formData.school]);

  // Fetch user profile for role/school
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      }
    };
    fetchProfile();
  }, [auth.currentUser]);

  // Load case data if activeCaseId exists
  React.useEffect(() => {
    const loadCaseData = async () => {
      if (!activeCaseId) return;
      
      setIsProcessing(true);
      try {
        const data = await caseService.getCase(activeCaseId);
        if (data) {
          // Map array-like fields correctly
          setFormData({
            ...DEFAULT_FORM_DATA, // Use defaults first to clear old state if any fields missing
            ...data,
            reportType: Array.isArray(data.reportType) ? data.reportType : [],
            actionsTaken: Array.isArray(data.actionsTaken) ? data.actionsTaken : [],
            incidentDescription: data.description || data.incidentDescription || '',
          });

          if (Array.isArray(data.selectedParticipants)) setSelectedParticipants(data.selectedParticipants);
          if (Array.isArray(data.selectedActivities)) setSelectedActivities(data.selectedActivities);
          if (Array.isArray(data.completedChecklistItems)) setCompletedChecklistItems(data.completedChecklistItems);

          // Update selectedAuthority based on loaded schoolId/authorityId if possible
          if (data.authorityId) {
            setSelectedAuthority(data.authorityId);
          }

          // Map status to step index
          const statusMap: Record<string, number> = {
            'anmäld': 0,
            'tilldelad': 1,
            'utredning': 2,
            'utreds': 2,
            'åtgärder': 3,
            'åtgärdad': 3,
            'uppföljning': 4,
            'uppföljd': 4,
            'avslutad': 5,
            'avslutat': 5
          };
          
          if (data.status && statusMap[data.status] !== undefined) {
            setCurrentStepIndex(statusMap[data.status]);
          }
        }
      } catch (err: any) {
        console.error("Scale-out error loading case:", err);
        setError("Kunde inte ladda ärendet.");
      } finally {
        setIsProcessing(false);
      }
    };
    loadCaseData();
  }, [activeCaseId]);

  const toggleChecklistItem = (item: string) => {
    setCompletedChecklistItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleReportType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      reportType: prev.reportType.includes(type) 
        ? prev.reportType.filter(t => t !== type) 
        : [...prev.reportType, type]
    }));
  };

  const toggleActionTaken = (action: string) => {
    setFormData(prev => ({
      ...prev,
      actionsTaken: prev.actionsTaken.includes(action) 
        ? prev.actionsTaken.filter(a => a !== action) 
        : [...prev.actionsTaken, action]
    }));
  };

  const activities = [
    'Enskilda samtal',
    'Vårdnadshavarkontakt',
    'Extra tillsyn i korridorer',
    'Gruppstärkande övningar',
    'Disciplinära åtgärder'
  ];

  const toggleParticipant = (name: string) => {
    setSelectedParticipants(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => {
      const isAdding = !prev.includes(activity);
      const nextActivities = isAdding ? [...prev, activity] : prev.filter(a => a !== activity);
      
      // Update the actionsText textarea automatically
      setFormData(fPrev => {
        let currentText = fPrev.actionsText || '';
        if (isAdding) {
          // Add activity to text if not already present in some form
          if (!currentText.includes(activity)) {
            const separator = currentText.length > 0 ? '\n' : '';
            currentText = `${currentText}${separator}- ${activity}`;
          }
        } else {
          // Attempt to remove the activity line if it was added automatically
          const lines = currentText.split('\n');
          const filteredLines = lines.filter(line => line.trim() !== `- ${activity}` && line.trim() !== activity);
          currentText = filteredLines.join('\n');
        }
        return { ...fPrev, actionsText: currentText };
      });

      return nextActivities;
    });
  };

  const steps = INITIAL_STEPS.map((step, index) => {
    if (index < currentStepIndex) return { ...step, status: 'completed' as const };
    if (index === currentStepIndex) return { ...step, status: 'current' as const };
    return { ...step, status: 'upcoming' as const };
  });

  const currentStep = steps[currentStepIndex];

  const [showClosingSummary, setShowClosingSummary] = React.useState(false);

  const isStepValid = () => {
    switch (currentStepIndex) {
      case 0: // Anmälan
        return !!(formData.studentName && formData.incidentDate && formData.incidentDescription && formData.school);
      case 1: // Tilldelning
        return !!formData.assignedTeacherUid;
      case 2: // Utredning
        return !!(formData.investigationText && formData.studentVersion);
      case 3: // Åtgärder
        return !!(formData.actionsText && formData.followUpScheduled);
      case 4: // Uppföljning
        return !!(formData.followUpText && formData.followUpDecision);
      case 5: // Avslut
        return !!(formData.signatureName && formData.signatureDate);
      default:
        return true;
    }
  };

  const handleNextStep = async () => {
    if (!isStepValid()) {
      setError("Vänligen fyll i alla obligatoriska fält markerade med *");
      return;
    }

    if (currentStepIndex === 5 && !showClosingSummary) {
      setShowClosingSummary(true);
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const stepStatusMap: Record<number, string> = {
        0: 'anmäld',
        1: 'tilldelad',
        2: 'utredning',
        3: 'åtgärder',
        4: 'uppföljning',
        5: 'avslutat'
      };

      // If it's the first step (Anmälan) and NO case exists yet, save new
      if (currentStepIndex === 0 && !activeCaseId) {
        // Validation
        if (!formData.studentName || !formData.incidentDate || !formData.incidentDescription || !formData.school) {
          throw new Error('Vänligen fyll i alla obligatoriska fält (*) inklusive val av skola.');
        }

        const casePayload = {
          title: formData.incidentDescription.substring(0, 50) + (formData.incidentDescription.length > 50 ? '...' : ''),
          description: formData.incidentDescription, // Mapping incidentDescription to description
          studentName: formData.studentName,
          incidentDate: formData.incidentDate,
          reporterUid: auth.currentUser?.uid || 'anonymous',
          reporterName: formData.reporterName || auth.currentUser?.displayName || 'Anonym anmälare',
          reporterEmail: formData.reporterEmail || auth.currentUser?.email || '',
          school: formData.school || userProfile?.school || 'Danderyds Skola',
          status: 'anmäld',
          type: 'trygghet',
          ...formData, // Spread the rest
          selectedParticipants,
          selectedActivities,
          completedChecklistItems
        };

        const newCaseId = await caseService.createCase(casePayload);
        if (newCaseId) {
          setActiveCaseId(newCaseId);
          if (onSuccess) onSuccess(newCaseId);
        }
        
        if (isQuickReport) {
          setIsSubmitted(true);
          return;
        }
      } else if (activeCaseId) {
        // Update existing case with current data and next status
        const nextStepIndex = Math.min(currentStepIndex + 1, steps.length - 1);
        
        // Custom logic for Step 5 (index 4)
        const actualNextIndex = (currentStepIndex === 4 && formData.followUpDecision === 'Problemet kvarstår - nya åtgärder och nytt datum för uppföljning')
          ? 3 : nextStepIndex;

        const newStatus = stepStatusMap[actualNextIndex];

        await caseService.updateCase(activeCaseId, {
          ...formData,
          description: formData.incidentDescription,
          status: newStatus,
          oldStatus: stepStatusMap[currentStepIndex],
          selectedParticipants,
          selectedActivities,
          completedChecklistItems,
          updatedAt: new Date().toISOString()
        });
      }

      setShowClosingSummary(false);

      if (currentStepIndex < steps.length - 1) {
        // Custom logic for Step 5 (index 4) navigation
        if (currentStepIndex === 4 && formData.followUpDecision === 'Problemet kvarstår - nya åtgärder och nytt datum för uppföljning') {
          setCurrentStepIndex(3); // Go back to Step 4: Åtgärder
        } else {
          setCurrentStepIndex(prev => prev + 1);
        }
        setDocumentation('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepContent = (stepId: number) => {
    const step1Items = ["Registrera ärendet i huvudmannens system"];
    const step2Items = [...step1Items, "Tilldela rätt arbetslag ansvar för ärendet", "Utse ansvarig utredare"];
    const step3Items = [...step2Items, "Genomför enskilda samtal med alla inblandade", "Dokumentera händelseförloppet objektivt", "Analysera bakomliggande orsaker"];
    const step4Items = [...step3Items, "Upprätta skriftlig åtgärdsplan", "Informera berörd personal", "Säkerställ individanpassade åtgärder"];
    const step5Items = [...step4Items, "Genomför uppföljningssamtal", "Utvärdera åtgärdernas effekt", "Besluta om ev. ytterligare åtgärder"];
    const step6Items = [...step5Items, "Slutdokumentera ärendet", "Informera vårdnadshavare om avslut", "Arkivera enligt gällande regler"];

    switch (stepId) {
      case 1:
        return {
          support: "Anmälan görs inom 24h från kännedom. Beskriv händelsen mycket kortfattat. Gör ingen värdering av allvaret före anmälan.",
          deadline: "Inom 24 timmar",
          urgency: "Hög",
          action: "Skicka anmälan till rektor",
          checklist: step1Items
        };
      case 2:
        return {
          support: "Rektor eller biträdande rektor tilldelar ärendet till ansvarigt arbetslag och utredare för vidare hantering.",
          deadline: "Skyndsamt",
          urgency: "Hög",
          action: "Tilldela ärende",
          checklist: step2Items
        };
      case 3:
        return {
          support: "Utredning påbörjas i samband med anmälan. Samtliga inblandades versioner ska finnas med. Endast saklig beskrivning, inga värderingar.",
          deadline: "Inom 1 vecka",
          urgency: "Normal",
          action: "Dokumentera alla versioner",
          checklist: step3Items
        };
      case 4:
        return {
          support: "Åtgärder beslutas utifrån analysen. Informera berörd personal, elevhälsa och vårdnadshavare.",
          deadline: "Inom 1 vecka (tillsammans med utredning)",
          urgency: "Hög",
          action: "Upprätta åtgärdsplan",
          checklist: step4Items
        };
      case 5:
        return {
          support: "Utvärderas inom 2 veckor efter utredning. Prata med både utsatt och den som utsatt. Om problemet kvarstår - nya åtgärder.",
          deadline: "Inom 2 veckor",
          urgency: "Normal",
          action: "Genomför utvärderingssamtal",
          checklist: step5Items
        };
      case 6:
        return {
          support: "Ärendet ska avslutas inom 4 veckor från händelsen/kännedom. Säkerställ att all dokumentation är komplett.",
          deadline: "Inom 4 veckor totalt",
          urgency: "Låg",
          action: "Slutför checklistan och arkivera",
          checklist: step6Items
        };
      default:
        return null;
    }
  };

  const content = getStepContent(currentStep.id);

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 px-6"
      >
        <div className="w-20 h-20 bg-visuera-green/10 text-visuera-green rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-2xl font-black text-visuera-dark tracking-tight mb-4">Anmälan Skickad!</h3>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed mb-12">
          Din anmälan har registrerats och skickats till rektorn för vidare hantering enligt Skollagen 6 kap.
        </p>
        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button 
            onClick={() => {
              setIsSubmitted(false);
              setCurrentStepIndex(0);
              setActiveCaseId(null);
            }}
            className="w-full py-4 bg-visuera-green text-white rounded-2xl font-bold shadow-lg shadow-visuera-green/20 hover:scale-[1.02] transition-all"
          >
            Gör en till anmälan
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto px-6 space-y-12 pb-20 ${isQuickReport ? 'pt-6' : ''}`}>
      {/* Dashboard Statistics - Hide if Quick Report */}
      {!isQuickReport && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="w-12 h-12 bg-visuera-green/10 rounded-2xl flex items-center justify-center text-visuera-green">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-visuera-dark">
                {schoolCases.filter(c => c.status !== 'avslutat').length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pågående ärenden</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="w-12 h-12 bg-visuera-dark/5 rounded-2xl flex items-center justify-center text-visuera-dark">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-visuera-dark">
                {schoolCases.filter(c => c.status === 'avslutat').length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avslutade ärenden</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status Panel - Hide if Quick Report */}
      {!isQuickReport && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-8 border-b border-slate-50 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    Ärende: {activeCaseId ? `ÄRE-${activeCaseId.slice(-4).toUpperCase()}` : 'NYTT'}
                  </span>
                  {activeCaseId && cases.find(c => c.id === activeCaseId)?.status === 'anmäld' && (Date.now() - (cases.find(c => c.id === activeCaseId)?.createdAt?.seconds * 1000 || Date.now())) > (48 * 60 * 60 * 1000) && (
                    <div className="flex items-center gap-1 text-red-500 bg-red-50 px-3 py-1 rounded-full animate-pulse">
                      <AlertCircle size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">SLA Överskriden</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-visuera-green bg-visuera-green/10 px-3 py-1 rounded-full">
                    <ShieldCheck size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Skollagen 6 kap.</span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-visuera-dark">Kränkande behandling</h1>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {steps.map((step, idx) => {
                const stepStatusMap: Record<number, string> = {
                  0: 'anmäld',
                  1: 'tilldelad',
                  2: 'utredning',
                  3: 'åtgärder',
                  4: 'uppföljning',
                  5: 'avslutat'
                };
                const stepStatus = stepStatusMap[idx];
                const count = schoolCases.filter(c => c.status === stepStatus).length;
                const badgeColor = count > 5 ? 'bg-amber-500' : 'bg-visuera-green';
                const badgeOpacity = count === 0 ? 'opacity-30' : 'opacity-100';

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative ${
                        step.status === 'completed' ? 'bg-visuera-green text-white' :
                        step.status === 'current' ? 'bg-visuera-green/20 text-visuera-green ring-4 ring-visuera-green/10' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {step.status === 'completed' ? <CheckCircle2 size={20} /> : <span className="font-bold">{step.id}</span>}
                        {count > 0 && (
                          <div className={`absolute -top-1 -right-1 w-5 h-5 ${badgeColor} ${badgeOpacity} text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                            {count}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <span className={`text-[10px] font-bold uppercase tracking-tighter block ${
                          step.status === 'current' ? 'text-visuera-green' : 'text-slate-400'
                        }`}>
                          {step.title}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-0.5 opacity-60">
                          {count} {count === 1 ? 'ärende' : 'ärenden'}
                        </span>
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-8 md:w-12 h-[2px] mb-8 mx-2 ${
                        idx < currentStepIndex ? 'bg-visuera-green' : 'bg-slate-100'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      <div className={`grid grid-cols-1 ${isQuickReport ? '' : 'lg:grid-cols-3'} gap-8`}>
        {/* Sidebar Column - Hide if Quick Report */}
        {!isQuickReport && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
          {/* Checklist Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-visuera-green/10 rounded-xl flex items-center justify-center text-visuera-green">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-visuera-dark">Checklista</h3>
              </div>
            </div>

            <div className="space-y-3">
              {/* Active Items */}
              {content?.checklist?.filter(item => !completedChecklistItems.includes(item)).map((item, i) => (
                <div 
                  key={`active-${i}`} 
                  onClick={() => toggleChecklistItem(item)}
                  className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-md border-2 border-slate-200 mt-0.5 group-hover:border-visuera-green flex items-center justify-center transition-colors">
                    <CheckCircle2 size={12} className="text-white opacity-0" />
                  </div>
                  <span className="text-xs leading-tight text-slate-600">
                    {item}
                  </span>
                </div>
              ))}

              {/* Completed Items Dropdown */}
              {content?.checklist?.some(item => completedChecklistItems.includes(item)) && (
                <div className="pt-2 border-t border-slate-50">
                  <button 
                    onClick={() => setShowCompletedItems(!showCompletedItems)}
                    className="flex items-center justify-between w-full p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-visuera-green transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
                        {content.checklist.filter(item => completedChecklistItems.includes(item)).length}
                      </div>
                      <span>Avklarade punkter</span>
                    </div>
                    <motion.div
                      animate={{ rotate: showCompletedItems ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showCompletedItems && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 mt-2 pl-2 border-l-2 border-slate-50 ml-2">
                          {content.checklist.filter(item => completedChecklistItems.includes(item)).map((item, i) => (
                            <div 
                              key={`completed-${i}`} 
                              onClick={() => toggleChecklistItem(item)}
                              className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                            >
                              <div className="w-4 h-4 rounded bg-visuera-green mt-0.5 flex items-center justify-center">
                                <CheckCircle2 size={10} className="text-white" />
                              </div>
                              <span className="text-[11px] leading-tight text-slate-300 line-through">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Method Support Card */}
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
              
              <h3 className="text-xl font-bold mb-4">Nästa steg i processen</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                {content?.support}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-visuera-green" />
                    <span className="text-sm">Deadline</span>
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
                <div className="font-bold text-visuera-dark">Juridisk bakgrund</div>
                <div className="text-xs text-slate-400">Skollagen & Barnkonventionen</div>
              </div>
            </div>
            <ArrowRight size={20} className={`text-slate-300 group-hover:translate-x-1 transition-transform ${showLegal ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showLegal && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-visuera-dark flex items-center gap-2 uppercase tracking-widest">
                    <Scale size={14} className="text-visuera-green" />
                    Juridisk vägledning
                  </h4>
                  <div className="space-y-4 text-[11px] text-slate-600 leading-relaxed">
                    <div>
                      <p className="font-bold text-visuera-dark mb-1">7 § Anmälningsskyldighet</p>
                      <p>Personal som får kännedom om att en elev anser sig ha blivit utsatt för kränkande behandling är skyldig att anmäla detta till rektorn.</p>
                    </div>
                    <div>
                      <p className="font-bold text-visuera-dark mb-1">8 § Skyldighet att utreda</p>
                      <p>Huvudmannen är skyldig att skyndsamt utreda omständigheterna och vidta åtgärder för att förhindra kränkningar i framtiden.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        )}

        {/* Documentation Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={isQuickReport ? 'w-full max-w-2xl mx-auto' : 'lg:col-span-2'}
        >
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-visuera-green">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-visuera-dark">Dokumentation: {currentStep.title}</h3>
                  <p className="text-xs text-slate-400">Uppdateras i realtid till huvudman och skolledning</p>
                </div>
              </div>
              {!isQuickReport && (
                <div className="flex -space-x-2">
                  {selectedParticipants.length === 0 ? (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-300 italic">
                      Inga
                    </div>
                  ) : (
                    selectedParticipants.map(name => {
                      const p = availableStaff.find(part => part.name === name);
                      return (
                        <div 
                          key={name} 
                          title={name}
                          className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${
                            p?.uid === 'principal' ? 'bg-visuera-green' : 'bg-visuera-dark'
                          }`}
                        >
                          {p?.role || name[0]}
                        </div>
                      );
                    })
                  )}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-400">
                    <Users size={12} />
                  </div>
                </div>
              )}
            </div>

            {/* Incident Context Summary (Visible for steps 2-6) */}
            {currentStepIndex > 0 && (
              <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-visuera-dark uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} className="text-visuera-green" />
                    Händelseinfo från anmälan
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">{formData.incidentDate}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium uppercase text-[9px]">Elev</span>
                    <span className="font-bold text-visuera-dark truncate block">{formData.studentName} {formData.studentClass && `(${formData.studentClass})`}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium uppercase text-[9px]">Plats</span>
                    <span className="font-bold text-visuera-dark truncate block">{formData.incidentLocation || 'Ej angiven'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase mb-1">Beskrivning</span>
                  <p className="text-xs text-slate-600 italic leading-relaxed bg-white/50 p-4 rounded-2xl border border-white max-h-32 overflow-y-auto">
                    "{formData.incidentDescription}"
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in zoom-in duration-300">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="flex-1 space-y-8">
              {currentStep.id === 1 ? (
                /* Simplified Anmälan Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Anmälan görs <strong>inom 24h</strong> från dess att du fått kännedom om misstänkt kränkande behandling. 
                      Beskriv händelsen <strong>mycket kortfattat</strong>. Gör ingen värdering av allvaret före anmälan.
                    </p>
                    <p className="text-[10px] text-visuera-green font-bold mt-4 uppercase tracking-widest">* Obligatoriskt fält</p>
                  </div>

                  {/* Authority Selection */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Välj huvudman (Kommun/Fristående) *</label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                        <select 
                          value={selectedAuthority}
                          onChange={(e) => {
                            setSelectedAuthority(e.target.value);
                            updateFormData('school', '');
                            updateFormData('schoolId', '');
                            updateFormData('authorityId', e.target.value);
                          }}
                          className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm appearance-none cursor-pointer"
                        >
                          <option value="">Välj huvudman...</option>
                          {authorities.map(auth => (
                            <option key={auth.id} value={auth.id}>{auth.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>

                    {/* School Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Välj skola/enhet *</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                        <select 
                          value={formData.school}
                          disabled={!selectedAuthority}
                          onChange={(e) => {
                            const school = availableSchools.find(s => s.name === e.target.value);
                            updateFormData('school', e.target.value);
                            if (school) {
                              updateFormData('schoolId', school.id);
                              updateFormData('authorityId', school.authorityId);
                            }
                          }}
                          className={`w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm appearance-none cursor-pointer ${!selectedAuthority ? 'opacity-50 grayscale' : ''}`}
                        >
                          <option value="">{selectedAuthority ? 'Välj en skola...' : 'Välj huvudman först...'}</option>
                          {availableSchools
                            .filter(s => s.authorityId === selectedAuthority)
                            .map(s => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Namn på berörd elev *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="text"
                          value={formData.studentName}
                          onChange={(e) => updateFormData('studentName', e.target.value)}
                          placeholder="Elevens namn"
                          className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Klass/Grupp</label>
                      <input 
                        type="text"
                        value={formData.studentClass}
                        onChange={(e) => updateFormData('studentClass', e.target.value)}
                        placeholder="t.ex. 4B"
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Datum för händelsen *</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="date"
                          value={formData.incidentDate}
                          onChange={(e) => updateFormData('incidentDate', e.target.value)}
                          className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Plats för händelsen</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="text"
                          value={formData.incidentLocation}
                          onChange={(e) => updateFormData('incidentLocation', e.target.value)}
                          placeholder="t.ex. Skolgården, matsalen"
                          className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kort beskrivning av händelsen *</label>
                    <textarea 
                      value={formData.incidentDescription}
                      onChange={(e) => updateFormData('incidentDescription', e.target.value)}
                      placeholder="Beskriv vad som hänt mycket kortfattat..."
                      className="w-full h-32 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                    />
                  </div>

                  <div className="pt-8 border-t border-slate-100 space-y-6">
                    <h4 className="text-xs font-bold text-visuera-dark uppercase tracking-widest flex items-center gap-2">
                      <Info size={14} className="text-visuera-green" />
                      Uppgiftslämnare (om ej anonym)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ditt namn</label>
                        <input 
                          type="text"
                          value={formData.reporterName}
                          onChange={(e) => updateFormData('reporterName', e.target.value)}
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Din e-post</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="email"
                            value={formData.reporterEmail}
                            onChange={(e) => updateFormData('reporterEmail', e.target.value)}
                            className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentStep.id === 2 ? (
                /* Tilldelning Step */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-visuera-dark mb-2">Tilldelning av ärende</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Välj vilket arbetslag som ansvarar för ärendet och utse en ansvarig utredare.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Välj arbetslag *</label>
                      <div className="flex flex-wrap gap-2">
                        {availableTeams.map(team => (
                          <button
                            key={team}
                            onClick={() => {
                              updateFormData('assignedTeam', team);
                              updateFormData('assignedTeacher', '');
                              updateFormData('assignedTeacherUid', '');
                            }}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border ${
                              formData.assignedTeam === team
                                ? 'bg-visuera-green text-white border-visuera-green shadow-lg shadow-visuera-green/20'
                                : 'bg-white border-slate-100 text-slate-500 hover:border-visuera-green/30'
                            }`}
                          >
                            Arbetslag {team}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Välj ansvarig utredare *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                        <select 
                          value={formData.assignedTeacher}
                          onChange={(e) => {
                            const teacher = availableStaff.find(s => s.name === e.target.value);
                            updateFormData('assignedTeacher', e.target.value);
                            updateFormData('assignedTeacherUid', teacher?.uid || '');
                          }}
                          disabled={!formData.assignedTeam}
                          className={`w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm appearance-none cursor-pointer text-visuera-dark font-medium ${!formData.assignedTeam ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="">{formData.assignedTeam ? 'Välj en lärare...' : 'Välj arbetslag först...'}</option>
                          {availableStaff
                            .filter(p => p.team === formData.assignedTeam)
                            .map(teacher => (
                              <option key={teacher.uid} value={teacher.name}>
                                {teacher.name}
                              </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-visuera-green/5 rounded-2xl border border-visuera-green/10 flex items-start gap-3">
                    <Info size={18} className="text-visuera-green shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      När du klickar på "Gå till nästa steg" kommer den valda utredaren att meddelas och ärendet flyttas till utredningsfasen.
                    </p>
                  </div>
                </div>
              ) : currentStep.id === 3 ? (
                /* Detailed Utredning Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-visuera-dark mb-2">Utredning av kränkande behandling</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Utredningen ska utgöra grund för att bedöma om kränkande behandling förekommit. 
                      <strong> Samtliga inblandades versioner ska finnas med.</strong> Endast saklig beskrivning, inga egna värderingar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Berörd elev</label>
                      <input 
                        type="text"
                        value={formData.studentName}
                        onChange={(e) => updateFormData('studentName', e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personnummer</label>
                      <input 
                        type="text"
                        value={formData.studentSSN}
                        onChange={(e) => updateFormData('studentSSN', e.target.value)}
                        placeholder="YYYYMMDD-XXXX"
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                      />
                    </div>
                  </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Elevens version *</label>
                      <textarea 
                        value={formData.studentVersion}
                        onChange={(e) => updateFormData('studentVersion', e.target.value)}
                        placeholder="Beskriv den utsatta elevens version av händelsen..."
                        className="w-full h-32 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 ml-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Övriga inblandades versioner (utredning) *</label>
                        <button 
                          onClick={() => setShowInvestigationInfo(!showInvestigationInfo)}
                          className="text-slate-300 hover:text-visuera-green transition-colors"
                          title="Mer information om utredning"
                        >
                          <Info size={14} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {showInvestigationInfo && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-visuera-green/5 p-4 rounded-xl border border-visuera-green/10 text-[10px] text-slate-600 space-y-3 leading-relaxed">
                              <p>
                                Utredningen ska utgöra grund för att bedöma om kränkande behandling förekommit eller om det inte förekommit. Utredningen ska omfatta både den som kan ha utfört handlingen och den som blivit utsatt. Syftet är att samla in tillräckligt med information och kunskap om situationen för att kunna bedöma om eleven har blivit utsatt och vilka åtgärder som i så fall måste genomföras för att få stopp på handlingarna.
                              </p>
                              <p>
                                Utredningens storlek och genomförande anpassas till det enskilda fallet. I de flesta fall ingår att fråga alla inblandade vad som har hänt, det vill säga den som upplever sig kränkt och den som kan ha utfört kränkningen. Det kan också ingå att:
                              </p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>fråga andra elever samt personal och vårdnadshavare</li>
                                <li>ta reda på vad som händer på sociala medier och på andra fysiska och virtuella platser där barnen eller eleverna finns</li>
                                <li>ta hjälp av särskild kompetens, som kuratorer eller psykologer, till exempel för att göra observationer</li>
                                <li>läsa de inblandades mejl, sms, chattkonversationer eller liknande.</li>
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <textarea 
                        value={formData.investigationText}
                        onChange={(e) => updateFormData('investigationText', e.target.value)}
                        placeholder="Dokumentera övriga inblandades versioner sakligt..."
                        className="w-full h-48 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                      />
                    </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 ml-1 pt-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Har det skett en kränkning? *</label>
                      <button 
                        onClick={() => setShowDecisionInfo(!showDecisionInfo)}
                        className="text-slate-300 hover:text-visuera-green transition-colors"
                        title="Mer information om bedömning"
                      >
                        <Info size={14} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showDecisionInfo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-visuera-green/5 p-4 rounded-xl border border-visuera-green/10 text-[10px] text-slate-600 leading-relaxed">
                            <p>
                              Skolan måste skaffa sig en egen uppfattning om vad som har hänt. Det räcker inte att låta utredningen stanna vid att ord står mot ord. Skolan behöver fatta ett beslut om en kränkning skett eller inte. Vid konstaterad kränkning, oavsett diskrimineringsgrund, ska utredningen innehålla en analys. Analysen ska utgöra grund för att vidta lämpliga åtgärder.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 gap-3">
                      {[
                        'Ja',
                        'Nej',
                        'Kränkning kan ej konstateras'
                      ].map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateFormData('incidentConfirmed', opt)}
                          className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all border text-left ${
                            formData.incidentConfirmed === opt
                              ? 'bg-visuera-green/10 border-visuera-green text-visuera-green'
                              : 'bg-white border-slate-100 text-slate-500 hover:border-visuera-green/30'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            formData.incidentConfirmed === opt ? 'bg-visuera-green border-visuera-green text-white' : 'border-slate-200'
                          }`}>
                            {formData.incidentConfirmed === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {(formData.incidentConfirmed === 'Nej' || formData.incidentConfirmed === 'Kränkning kan ej konstateras') && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                          <strong>Info:</strong> Om kränkning inte ägt rum eller går att konstatera kan du gå direkt vidare till steg 5 (Avslut) för att arkivera ärendet.
                        </p>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {formData.incidentConfirmed === 'Ja' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="space-y-4 pt-4"
                      >
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vilken diskrimineringsgrund?</label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            'Kränkande behandling, SL 6: 10',
                            'Trakasserier, DiskrL 1:4',
                            'Sexuella trakasserier, DiskrL 1:4',
                            'Direkt diskriminering, DiskrL 1:4',
                            'Indirekt diskriminering, DiskrL 1:4',
                            'Instruktioner att diskriminera, DiskrL 1:4',
                            'Vet inte'
                          ].map(ground => (
                            <button
                              key={ground}
                              onClick={() => updateFormData('discriminationGround', ground)}
                              className={`flex items-center gap-3 p-3 rounded-xl text-[11px] transition-all border text-left ${
                                formData.discriminationGround === ground
                                  ? 'bg-visuera-green/5 border-visuera-green text-visuera-green font-bold'
                                  : 'bg-white border-slate-100 text-slate-500'
                              }`}
                            >
                              {ground}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : currentStep.id === 4 ? (
                /* Detailed Åtgärder Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-visuera-dark mb-2">Åtgärder och beslut</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Åtgärderna ska vara anpassade efter eleven utifrån analysen. Det innebär ofta att åtgärder riktas mot både den utsatte och den som utsätter andra.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 ml-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beskrivning av åtgärder *</label>
                      <button 
                        onClick={() => setShowActionsInfo(!showActionsInfo)}
                        className="text-slate-300 hover:text-visuera-green transition-colors"
                        title="Mer information om åtgärder"
                      >
                        <Info size={14} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showActionsInfo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-visuera-green/5 p-4 rounded-xl border border-visuera-green/10 text-[10px] text-slate-600 space-y-3 leading-relaxed">
                            <p>
                              Åtgärderna ska vara anpassade efter eleven utifrån analysen. Det innebär ofta att åtgärder riktas mot både den utsatte och den som utsätter andra för kränkande behandling. Det är viktigt att bestämma när åtgärderna ska vara genomförda och vem eller vilka i personalen som ska genomföra åtgärderna.
                            </p>
                            <p className="font-bold text-visuera-dark">Exempel på åtgärder kan vara att</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>samtala med elever och eventuellt vårdnadshavare</li>
                              <li>samtala med den i personalen som har utsatt eleven för kränkande behandling</li>
                              <li>hålla ökad uppsikt, särskilt på platser och tidpunkter som har visat sig vara riskfyllda</li>
                              <li>tilldela en assistent eller en resursperson för den eller de som kränker</li>
                              <li>se över gruppindelningar och schemaläggning</li>
                              <li>göra insatser med hjälp av skolkurator och skolpsykolog</li>
                              <li>genomföra disciplinära åtgärder enligt konsekvenstrappan i kap. 5 skollagen respektive de arbetsrättsliga reglerna, i de fall det handlar om anställda i skolan.</li>
                            </ul>
                            <p className="font-bold text-visuera-dark">
                              Viktigt att bestämma vem eller vilka som ska utföra åtgärderna samt när åtgärderna ska vara genomförda.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <textarea 
                      value={formData.actionsText}
                      onChange={(e) => updateFormData('actionsText', e.target.value)}
                      placeholder="Beskriv planerade och vidtagna åtgärder..."
                      className="w-full h-48 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Snabbval: Vanliga åtgärder</label>
                    <div className="flex flex-wrap gap-2">
                      {activities.map(activity => (
                        <button
                          key={activity}
                          onClick={() => toggleActivity(activity)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-medium transition-all border ${
                            selectedActivities.includes(activity)
                              ? 'bg-visuera-green border-visuera-green text-white shadow-md shadow-visuera-green/20'
                              : 'bg-white border-slate-100 text-slate-500 hover:border-visuera-green/30'
                          }`}
                        >
                          {activity}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <button 
                        onClick={() => {
                          setIsProcessing(true);
                          setTimeout(() => {
                            setCurrentStepIndex(2); // Go back to Step 3: Utredning
                            setIsProcessing(false);
                          }, 800);
                        }}
                        className="flex-1 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 font-bold text-xs hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                      >
                        <AlertCircle size={16} />
                        Skicka tillbaka för komplettering i steg 3
                      </button>
                      <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-500 italic">
                          Använd knappen till vänster om utredningen behöver kompletteras av ansvarig lärare innan åtgärder beslutas.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Datum för uppföljning *</label>
                      <input 
                        type="date"
                        value={formData.followUpScheduled}
                        onChange={(e) => updateFormData('followUpScheduled', e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kränkningsärendet avslutas (om tillämpligt)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="date"
                          value={formData.closureDate}
                          onChange={(e) => updateFormData('closureDate', e.target.value)}
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                        />
                        <input 
                          type="text"
                          value={formData.closureReason}
                          onChange={(e) => updateFormData('closureReason', e.target.value)}
                          placeholder="Anledning till avslut..."
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ladda upp filer</label>
                    <div className="relative group">
                      <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-visuera-green/50 transition-colors bg-slate-50/50">
                        <FileText size={24} className="text-slate-300 group-hover:text-visuera-green transition-colors" />
                        <span className="text-xs text-slate-400">Klicka här eller dra filer hit!</span>
                        <span className="text-[10px] text-slate-300 uppercase tracking-widest">Max 100 MB</span>
                      </div>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              ) : currentStep.id === 5 ? (
                /* Detailed Uppföljning Form */
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-visuera-dark mb-2">Utvärdering av åtgärder</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Utvärderas <strong>inom 2 veckor</strong> från dess att utredningen är klar. 
                      Prata med både den som varit utsatt och den/de som har utsatt för att bedöma effekt.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Utvärdering & Resultat *</label>
                    <textarea 
                      value={formData.followUpText}
                      onChange={(e) => updateFormData('followUpText', e.target.value)}
                      placeholder="Har kränkningarna upphört? Beskriv samtal med inblandade..."
                      className="w-full h-48 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm"
                    />
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h5 className="text-xs font-bold text-visuera-dark uppercase tracking-widest">Beslut efter utvärdering</h5>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        'Problemet har upphört - avsluta ärendet',
                        'Problemet kvarstår - nya åtgärder och nytt datum för uppföljning'
                      ].map(decision => (
                        <button
                          key={decision}
                          onClick={() => updateFormData('followUpDecision', decision)}
                          className={`flex items-center gap-3 p-4 rounded-xl text-xs font-bold transition-all border text-left ${
                            formData.followUpDecision === decision
                              ? 'bg-visuera-green/10 border-visuera-green text-visuera-green'
                              : 'bg-white border-slate-100 text-slate-500 hover:border-visuera-green/30'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            formData.followUpDecision === decision ? 'bg-visuera-green border-visuera-green text-white' : 'border-slate-200 bg-white'
                          }`}>
                            {formData.followUpDecision === decision && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          {decision}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : currentStep.id === 6 ? (
                showClosingSummary ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                    id="closing-summary-container"
                  >
                    <div className="p-8 bg-visuera-green/5 border-2 border-visuera-green/20 rounded-3xl space-y-6">
                      <div className="flex items-center gap-4 text-visuera-green">
                        <ShieldCheck size={32} />
                        <div>
                          <h3 className="text-xl font-bold">Slutgiltig granskning & Signering</h3>
                          <p className="text-sm opacity-80 font-medium">Jag som rektor intygar att utredning och åtgärder vidtagits enligt Skollagen 6 kap.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ansvarig rektor</p>
                            <p className="font-bold text-visuera-dark">{formData.signatureName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Datum för avslut</p>
                            <p className="font-bold text-visuera-dark">{formData.signatureDate}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Elev</p>
                            <p className="font-bold text-visuera-dark">{formData.studentName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slutgiltig bedömning</p>
                            <p className="text-xs font-bold text-visuera-green uppercase tracking-wider">{formData.followUpDecision}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-900 rounded-2xl text-slate-300 font-mono text-[10px] leading-relaxed shadow-inner overflow-hidden relative">
                        <div className="absolute top-2 right-3 text-slate-700 font-sans font-bold uppercase tracking-widest">Audit JSON Entry</div>
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify({
                            event: "CASE_ARCHIVED",
                            timestamp: new Date().toISOString(),
                            caseId: activeCaseId,
                            signer: formData.signatureName,
                            legalFramework: "Skollagen 6 kap.",
                            school: formData.school,
                            finalDecision: formData.followUpDecision
                          }, null, 2)}
                        </pre>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                        <p className="text-[10px] text-amber-900 leading-relaxed italic">
                          Genom att bekräfta låses ärendet för redigering och arkiveras digitalt i enlighet med gällande juridiska krav för kränkande behandling.
                        </p>
                      </div>

                      <button 
                        onClick={() => setShowClosingSummary(false)}
                        className="text-xs font-bold text-slate-400 hover:text-visuera-dark transition-colors uppercase tracking-widest block w-full text-center"
                        id="cancel-closing-summary"
                      >
                        Avbryt och redigera uppgifter
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Detailed Avslut Form */
                  <div className="space-y-8" id="detailed-avslut-form">
                    <div className="bg-visuera-green/10 p-8 rounded-3xl border border-visuera-green/20 text-center space-y-4">
                      <div className="w-16 h-16 bg-visuera-green rounded-full flex items-center justify-center mx-auto shadow-lg shadow-visuera-green/20">
                        <FileCheck size={32} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-visuera-dark">Ärendet är redo att avslutas</h4>
                        <p className="text-sm text-slate-600">Granska sammanfattningen nedan och fyll i slutgiltig signering.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={14} className="text-visuera-green" />
                        Sammanfattning för arkivering
                      </h5>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-tighter mb-1">Elev</p>
                            <p className="text-visuera-dark font-medium">{formData.studentName || 'Ej angivet'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-tighter mb-1">Skola</p>
                            <p className="text-visuera-dark font-medium">{formData.school || 'Ej angivet'}</p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter mb-2">Händelse & Utredning</p>
                          <p className="text-xs text-slate-600 italic leading-relaxed">
                            {formData.incidentDescription || 'Ingen beskrivning angiven.'}
                          </p>
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {formData.reportType.map(t => (
                              <span key={t} className="px-2 py-1 bg-visuera-green/10 text-visuera-green rounded text-[9px] font-bold uppercase">{t}</span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter mb-2">Konstaterad kränkning</p>
                          <p className="text-xs font-bold text-visuera-dark">
                            {formData.incidentConfirmed || 'Ej bedömt'}
                            {formData.discriminationGround && ` - ${formData.discriminationGround}`}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter mb-2">Åtgärder & Uppföljning</p>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {formData.actionsText || 'Inga åtgärder dokumenterade.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 space-y-6 shadow-sm">
                    <h5 className="text-xs font-bold text-visuera-dark uppercase tracking-widest flex items-center gap-2 pt-4">
                      <PenTool size={14} className="text-visuera-green" />
                      Signering av ansvarig
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Namnförtydligande *</label>
                        <input 
                          type="text"
                          value={formData.signatureName}
                          onChange={(e) => updateFormData('signatureName', e.target.value)}
                          placeholder="Ansvarig rektor/trygghetsteam"
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Datum för signering *</label>
                        <input 
                          type="date"
                          value={formData.signatureDate}
                          onChange={(e) => updateFormData('signatureDate', e.target.value)}
                          className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        id="closeCase"
                        checked={formData.isClosed}
                        onChange={(e) => updateFormData('isClosed', e.target.checked)}
                        className="w-5 h-5 accent-visuera-green rounded"
                      />
                      <label htmlFor="closeCase" className="text-xs font-bold text-visuera-dark cursor-pointer">
                        Jag bekräftar att ärendet är utrett, åtgärdat och uppföljt enligt gällande rutiner och kan därmed avslutas.
                      </label>
                    </div>
                  </div>

                  {formData.isClosed && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-visuera-green text-white p-6 rounded-3xl text-center shadow-xl shadow-visuera-green/30"
                    >
                      <h4 className="text-lg font-bold flex items-center justify-center gap-2">
                        <ShieldCheck size={24} />
                        ÄRENDET ÄR OFFICIELLT AVSLUTAT
                      </h4>
                      <p className="text-xs opacity-90 mt-1">Dokumentationen är låst och arkiverad i Agera Med Omtanke.</p>
                    </motion.div>
                  )}
                </div>
              )) : (
                /* Existing steps UI (5) */
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Händelseförlopp & Analys</label>
                    <textarea 
                      value={documentation}
                      onChange={(e) => setDocumentation(e.target.value)}
                      placeholder="Beskriv händelsen, vidtagna åtgärder eller utredningsresultat här..."
                      className="w-full h-48 p-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-visuera-dark placeholder:text-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Users size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Koppla deltagare</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {availableStaff.map(p => (
                          <button
                            key={p.uid}
                            onClick={() => toggleParticipant(p.name)}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                              selectedParticipants.includes(p.name)
                                ? 'bg-visuera-green/10 text-visuera-green font-bold'
                                : 'hover:bg-white text-slate-500'
                            }`}
                          >
                            <span>{p.name}</span>
                            {selectedParticipants.includes(p.name) && <CheckCircle2 size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-slate-400">
                        <FileText size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Bilagor</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-300 text-[10px] font-medium uppercase tracking-widest">
                        Dra & Släpp
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                {isStepValid() ? (
                  <>
                    <div className="w-2 h-2 bg-visuera-green rounded-full" />
                    <span>Redo för nästa steg</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span>Väntar på obligatoriska fält</span>
                  </>
                )}
              </div>
              
              <button 
                onClick={handleNextStep}
                disabled={isProcessing || (currentStepIndex === steps.length - 1 && !showClosingSummary && isSubmitted) || (!isStepValid())}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-visuera-green/20 ${
                  isProcessing || !isStepValid()
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-visuera-green text-white hover:bg-visuera-light-green hover:-translate-y-1'
                }`}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {showClosingSummary ? 'Bekräfta & Avsluta' : (currentStepIndex === 0 ? 'Skicka anmälan' : 'Gå till nästa steg')}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

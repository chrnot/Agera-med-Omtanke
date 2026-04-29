import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Zap, 
  BarChart3,
  ArrowRight,
  ArrowLeft,
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Building2,
  Layers,
  FileDown,
  X,
  MessageSquare,
  Send,
  Check,
  History,
  PlusCircle,
  Bell
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { caseService } from '../services/caseService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp, updateDoc, orderBy } from 'firebase/firestore';
import { LegalGuidance } from './LegalGuidance';
import { ContextualGuidance } from './ContextualGuidance';
import { StudentVoiceModule } from './StudentVoiceModule';
import { CaseSidebar } from './flow/CaseSidebar';
import { ProgressHeader } from './ProgressHeader';
import { CollapsibleLegal } from './CollapsibleLegal';
import { INCIDENT_CATEGORIES, LEGAL_HELP_TEXTS, ACTION_TEMPLATES } from '../constants/guidanceContent';

// Import New Step Components
import { AnmalanStep } from './flow/steps/AnmalanStep';
import { TilldelningStep } from './flow/steps/TilldelningStep';
import { UtredningStep } from './flow/steps/UtredningStep';
import { AtgarderStep } from './flow/steps/AtgarderStep';
import { UppfoljningStep } from './flow/steps/UppfoljningStep';
import { AvslutStep } from './flow/steps/AvslutStep';

interface Step {
  id: number;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  action: string;
}

enum CaseStatus {
  Anmald = 'anmäld',
  Tilldelad = 'tilldelad',
  Utredning = 'utredning',
  Utreds = 'utreds',
  Atgarder = 'åtgärder',
  Atgardad = 'åtgärdad',
  Uppfoljd = 'uppföljd',
  Avslutad = 'avslutad',
  Avslutat = 'avslutat'
}

interface TrygghetsFlowProps {
  isQuickReport?: boolean;
  onSuccess?: (caseId: string) => void;
  initialCaseId?: string | null;
  cases?: any[];
}

const INITIAL_STEPS: Step[] = [
  { id: 1, title: 'Anmälan', status: 'current', action: 'Gå till Tilldelning' },
  { id: 2, title: 'Tilldelning', status: 'upcoming', action: 'Börja Utreda' },
  { id: 3, title: 'Utredning', status: 'upcoming', action: 'Spara & Gå till Åtgärder' },
  { id: 4, title: 'Åtgärder', status: 'upcoming', action: 'Planera Uppföljning' },
  { id: 5, title: 'Uppföljning', status: 'upcoming', action: 'Slutför Avstämning' },
  { id: 6, title: 'Avslut', status: 'upcoming', action: 'Lås & Arkivera' },
];

const DEFAULT_FORM_DATA = {
  area: '',
  school: '',
  studentName: '',
  studentClass: '',
  reportType: [] as string[],
  incidentDate: '',
  incidentLocation: '',
  incidentLocationOther: '',
  involvedParties: [{ id: 'party-1', name: '', role: 'Utsatt', type: 'Elev', class: '' }] as { id: string, name: string, role: 'Utsatt' | 'Utövare' | 'Observatör', type: 'Elev' | 'Vuxen', class?: string }[],
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
  authority: '',
  incidentTypes: [] as string[],
  investigationAnalysis: '',
  // Step 2: Tilldelning
  assignedTeam: '',
  assignedTeacher: '',
  assignedTeacherUid: '',
  assignedToUid: '',
  investigators: [] as { uid: string, name: string, role: 'primary' | 'co-investigator', assignedAt: string }[],
  investigatorUids: [] as string[],
  // Step 3 & 4 fields
  studentSSN: '',
  guardianContactStatus: '',
  investigationDate: '',
  investigationText: '',
  studentVersion: '',
  studentStage: '',
  childRightsChecklist: [] as string[],
  interviewQuestionsChecklist: [] as string[],
  ageAdaptedConfirmation: false,
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
  status: CaseStatus.Anmald,
  isClosed: false,
  createdAt: null as any
};

export const TrygghetsFlow = ({ isQuickReport = false, onSuccess, initialCaseId, cases = [] }: TrygghetsFlowProps) => {
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth >= 1024);

  const [activeCaseId, setActiveCaseId] = React.useState<string | null>(initialCaseId || null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form State
  const [formData, setFormData] = React.useState(DEFAULT_FORM_DATA);
  const [showStats, setShowStats] = React.useState(false);
  const [historyTab, setHistoryTab] = React.useState<'original' | 'audit'>('original');
  const [auditLog, setAuditLog] = React.useState<any[]>([]);
  const [selectedActivities, setSelectedActivities] = React.useState<string[]>([]);
  const [successToast, setSuccessToast] = React.useState<{message: string, visible: boolean}>({ message: '', visible: false });
  const [showCloneModal, setShowCloneModal] = React.useState(false);
  const [cloneStudentName, setCloneStudentName] = React.useState('');
  const [cloneStudentSSN, setCloneStudentSSN] = React.useState('');

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
      setFormData({
        ...DEFAULT_FORM_DATA,
        reporterName: userProfile?.displayName || userProfile?.name || '',
        reporterEmail: userProfile?.email || auth.currentUser?.email || '',
        school: userProfile?.school || '',
        schoolId: userProfile?.schoolId || '',
        authorityId: userProfile?.authorityId || '',
        authority: userProfile?.authority || ''
      });
      if (userProfile?.authorityId) {
        setSelectedAuthority(userProfile.authorityId);
      }
      setCurrentStepIndex(0);
      setSelectedActivities([]);
      setError(null);
      setIsSubmitted(false);
    }
  }, [initialCaseId, userProfile]);

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
        const schoolDoc = availableSchools.find(s => s.name === schoolTarget);
        const schoolId = schoolDoc?.id;

        // Fetch users for this school specifically to comply with security rules and improve performance
        const q = userProfile?.globalRole === 'admin' 
          ? query(collection(db, 'users'))
          : query(collection(db, 'users'), where('school', '==', schoolTarget));
        
        const staffSnap = await getDocs(q);
        
        const staffData = staffSnap.docs
          .map(d => {
            const data = d.data();
            const uid = d.id;
            
            // Resolve the team for THIS school
            let activeTeam = '';
            if (data.school === schoolTarget) {
              activeTeam = data.team || '';
            } else if (schoolId && data.schoolAccess && data.schoolAccess[schoolId]) {
              const access = data.schoolAccess[schoolId];
              if (!Array.isArray(access) && typeof access === 'object') {
                activeTeam = access.team || '';
              }
            }

            return { uid, ...data, activeTeam } as any;
          })
          .filter(u => {
            const isActive = u.isActive !== false;
            const matchesPrimary = u.school === schoolTarget;
            const matchesAccess = schoolId && u.schoolAccess && u.schoolAccess[schoolId];
            const isGlobalAdmin = u.globalRole === 'admin';
            return isActive && (matchesPrimary || matchesAccess || isGlobalAdmin);
          });
        
        setAvailableStaff(staffData);
        
        // Extract teams using the contextual activeTeam
        const teams = Array.from(new Set(staffData.map((s: any) => s.activeTeam).filter(Boolean))) as string[];
        const hasStaffWithoutTeam = staffData.some((s: any) => !s.activeTeam);
        if (hasStaffWithoutTeam) {
          teams.push('Utan arbetslag');
        }
        
        // Sorting: F, 1, 2, 3, 4, 5, 6, others (like 'Övriga')
        const teamOrder = ['F', '1', '2', '3', '4', '5', '6'];
        const sortedTeams = teams.sort((a, b) => {
          if (a === 'Utan arbetslag') return 1;
          if (b === 'Utan arbetslag') return -1;
          const idxA = teamOrder.indexOf(a);
          const idxB = teamOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        });
        
        if (sortedTeams.length > 0 && !formData.assignedTeam) {
          // If we had a team selected, keep it, otherwise set default
          // No auto-set here to prevent unwanted switches
        }

        setAvailableTeams(sortedTeams);
      } catch (err) {
        console.error("Error fetching staff for school:", err);
      }
    };
    fetchStaff();
  }, [formData.school, availableSchools]);

  // Fetch user profile for role/school
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Fetch audit log when drawer is open
  React.useEffect(() => {
    if (showStats && activeCaseId && historyTab === 'audit') {
      const fetchAudit = async () => {
        try {
          const auditSnap = await getDocs(query(collection(db, `cases/${activeCaseId}/audit`), orderBy('timestamp', 'desc')));
          setAuditLog(auditSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error("Failed to fetch audit log:", e);
        }
      };
      fetchAudit();
    }
  }, [showStats, activeCaseId, historyTab]);

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

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => {
      const isAdding = !prev.includes(activity);
      const nextActivities = isAdding ? [...prev, activity] : prev.filter(a => a !== activity);
      
      // Determine which textarea to update
      const isStructural = ACTION_TEMPLATES.structural.includes(activity);
      const targetField = isStructural ? 'structuralActions' : 'actionsText';
      
      setFormData(fPrev => {
        let currentText = fPrev[targetField as keyof typeof fPrev] || '';
        if (isAdding) {
          if (!currentText.includes(activity)) {
            const separator = currentText.length > 0 ? '\n' : '';
            currentText = `${currentText}${separator}- ${activity}`;
          }
        } else {
          const lines = currentText.split('\n');
          const filteredLines = lines.filter(line => line.trim() !== `- ${activity}` && line.trim() !== activity);
          currentText = filteredLines.join('\n');
        }
        return { ...fPrev, [targetField]: currentText };
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

  const isPrincipalOrAdmin = userProfile?.role === 'principal' || userProfile?.role === 'admin' || userProfile?.globalRole === 'admin';
  const isPrimaryInvestigator = formData.investigators?.some((i: any) => i.uid === auth.currentUser?.uid && i.role === 'primary');
  const canClone = isPrincipalOrAdmin || isPrimaryInvestigator;

  const [showClosingSummary, setShowClosingSummary] = React.useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [isNudging, setIsNudging] = React.useState(false);
  const [quickMessage, setQuickMessage] = React.useState('');

  const maskNames = (text: string, parties: any[], targetId: string) => {
    if (!text) return '';
    let maskedText = text;
    
    // Sort parties by name length descending to avoid partial matches
    const otherParties = parties
      .filter(p => p.id !== targetId)
      .sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

    otherParties.forEach((p, index) => {
      if (p.name && p.name.trim().length > 2) {
        // Simple case-insensitive replacement
        const regex = new RegExp(p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const placeholder = p.type === 'Elev' ? `Elev ${index + 1}` : `Personal/Vuxen ${index + 1}`;
        maskedText = maskedText.replace(regex, placeholder);
      }
    });

    return maskedText;
  };

  const handleGenerateAnonymizedReport = async (studentId: string) => {
    const student = formData.involvedParties.find((p: any) => p.id === studentId);
    if (!student) return;

    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ELEVRAPPORT - TRYGGHETSÄRENDE', 20, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`ANONYMISERAD KOPIA FÖR: ${student.name.toUpperCase()}`, 20, 30);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      
      // Case Info
      const head = [['Information', 'Detaljer']];
      const caseInfo = [
        ['Ärende-ID', `ÄRE-${activeCaseId?.slice(-4).toUpperCase()}`],
        ['Skola', formData.school],
        ['Händelsedatum', formData.incidentDate],
        ['Status', 'Arkiverat & Signerat'],
        ['Sekretess', 'Maskerad enligt GDPR/OSL']
      ];
      
      autoTable(doc, {
        startY: 50,
        head: head,
        body: caseInfo,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85] }
      });

      // Anonymized Content
      doc.setFont('helvetica', 'bold');
      doc.text('HÄNDELSEBESKRIVNING', 20, (doc as any).lastAutoTable.finalY + 15);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const maskedDesc = maskNames(formData.incidentDescription, formData.involvedParties, studentId);
      const splitDesc = doc.splitTextToSize(maskedDesc, pageWidth - 40);
      doc.text(splitDesc, 20, (doc as any).lastAutoTable.finalY + 22);

      const nextY = (doc as any).lastAutoTable.finalY + 25 + (splitDesc.length * 5);

      doc.setFont('helvetica', 'bold');
      doc.text('UTREDNING & ANALYS', 20, nextY);
      
      doc.setFont('helvetica', 'normal');
      const analysisText = formData.investigationAnalysis || formData.investigationText || '';
      const maskedAnalysis = maskNames(analysisText, formData.involvedParties, studentId);
      const splitAnalysis = doc.splitTextToSize(maskedAnalysis, pageWidth - 40);
      doc.text(splitAnalysis, 20, nextY + 7);

      const nextY2 = nextY + 10 + (splitAnalysis.length * 5);

      doc.setFont('helvetica', 'bold');
      doc.text('BESLUTADE ÅTGÄRDER', 20, nextY2);
      
      doc.setFont('helvetica', 'normal');
      const maskedActions = maskNames(formData.actionsText || '', formData.involvedParties, studentId);
      const splitActions = doc.splitTextToSize(maskedActions, pageWidth - 40);
      doc.text(splitActions, 20, nextY2 + 7);

      // Warning footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('OBS: Detta är en anonymiserad rapport avsedd för vårdnadshavare. Kontrollera alltid att inga personnamn kvarstår i fritexten innan utlämning.', 20, 280);

      doc.save(`Rapport_${student.name.replace(/\s+/g, '_')}_${activeCaseId?.slice(-4)}.pdf`);

      // Audit Log
      if (activeCaseId) {
        await addDoc(collection(db, `cases/${activeCaseId}/audit`), {
          caseId: activeCaseId,
          userId: auth.currentUser?.uid || 'system',
          userName: auth.currentUser?.displayName || 'System',
          action: 'ANONYMISERAD_RAPPORT_GENERERAD',
          targetStudent: student.name,
          timestamp: serverTimestamp()
        });
      }

      setSuccessToast({ message: 'Anonymiserad rapport skapad', visible: true });
      setTimeout(() => setSuccessToast(prev => ({ ...prev, visible: false })), 5000);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setError('Kunde inte skapa anonymiserad rapport.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(31, 41, 55); // visuera-dark
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Agera med omtanke', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Ärenderapport - Trygghet & Studiero', pageWidth - 20, 25, { align: 'right' });

      // Title Section
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Ärende: ${formData.studentName || 'Oidentifierad'}`, 20, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Skapad: ${new Date().toLocaleDateString('sv-SE')}`, 20, 62);
      doc.text(`Status: ${steps[currentStepIndex].title}`, pageWidth - 20, 62, { align: 'right' });

      // Horizontal Line
      doc.setDrawColor(229, 231, 235);
      doc.line(20, 68, pageWidth - 20, 68);

      // Data Sections
      const sections = [
        {
          title: 'Händelseinformation',
          data: [
            ['Elev', formData.studentName || 'Ej angivet'],
            ['Klass', formData.studentClass || 'Ej angivet'],
            ['Datum', formData.incidentDate || 'Ej angivet'],
            ['Plats', formData.incidentLocation === 'Annan plats' && formData.incidentLocationOther ? `Annan plats (${formData.incidentLocationOther})` : (formData.incidentLocation || 'Ej angivet')],
            ['Typ av händelse', formData.reportType?.join(', ') || 'Ej angivet'],
          ]
        },
        {
          title: 'Beskrivning',
          data: [
            ['Händelseförlopp', formData.incidentDescription || 'Ingen beskrivning angiven'],
          ]
        }
      ];

      if (currentStepIndex >= 1) {
        sections.push({
          title: 'Tilldelning & Ansvar',
          data: [
            ['Arbetslag', formData.assignedTeam || 'Ej angivet'],
            ['Ansvarig utredare', formData.assignedTeacher || 'Ej angivet'],
          ]
        });
      }

      if (currentStepIndex >= 2) {
        sections.push({
          title: 'Utredning',
          data: [
            ['Utredningsdatum', formData.investigationDate || 'Ej angivet'],
            ['Resultat', formData.investigationText || 'Ej angivet'],
            ['Elevens version', formData.studentVersion || 'Ej angivet'],
            ['Diskrimineringsgrund', formData.discriminationGround || 'Ej angivet'],
          ]
        });
      }

      if (currentStepIndex >= 3) {
        sections.push({
          title: 'Åtgärder & Uppföljning',
          data: [
            ['Beslutade åtgärder', formData.actionsText || 'Ej angivet'],
            ['Planerad uppföljning', formData.followUpScheduled || 'Ej angivet'],
          ]
        });
      }

      let currentY = 75;

      sections.forEach(section => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, 20, currentY);
        
        autoTable(doc, {
          startY: currentY + 5,
          head: [],
          body: section.data,
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 2 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
          margin: { left: 20 },
          didDrawPage: (data) => {
            currentY = data.cursor?.y || currentY;
          }
        });
        
        currentY += (section.data.length * 8) + 15;
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }
      });

      // Footer
      const pageCount = (doc as any).internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Sida ${i} av ${pageCount} - Genererad via Agera med omtanke`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`Agera_Rapport_${formData.studentName || 'Handelse'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Misslyckades att generera PDF-rapport.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleNudge = async () => {
    if (!activeCaseId) return;
    setIsNudging(true);
    try {
      await caseService.requestClarification(activeCaseId);
      setSuccessToast({ message: "Förtydligande begärt. Notifiering skickad till utredare.", visible: true });
      setTimeout(() => setSuccessToast(prev => ({ ...prev, visible: false })), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsNudging(false);
    }
  };

  const handleSendQuickMessage = async (text: string) => {
    if (!activeCaseId || !text.trim()) return;
    setIsProcessing(true);
    try {
      await caseService.sendDirectMessage(activeCaseId, text.trim());
      setQuickMessage('');
      setSuccessToast({ message: "Meddelande skickat till utredaren.", visible: true });
      setTimeout(() => setSuccessToast(prev => ({ ...prev, visible: false })), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendBack = async (comment: string) => {
    if (!activeCaseId) return;
    setIsProcessing(true);
    try {
      await caseService.sendBackForRevision(activeCaseId, comment);
      setSuccessToast({ message: "Ärendet har skickats tillbaka för komplettering.", visible: true });
      setTimeout(() => setSuccessToast(prev => ({ ...prev, visible: false })), 5000);
      
      // Navigate away or back to cases list since the flow might be invalid now for the current user (if they are principal)
      // Or just reset the view
      setShowClosingSummary(false);
      // Optional: Redirect to dashboard or cases list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloneCase = async () => {
    if (!activeCaseId || !cloneStudentName.trim()) return;
    
    setIsProcessing(true);
    try {
      await caseService.cloneCase(activeCaseId, cloneStudentName.trim(), cloneStudentSSN.trim());
      setSuccessToast({ message: `Ärendet har klonats med ${cloneStudentName}`, visible: true });
      setTimeout(() => setSuccessToast(prev => ({ ...prev, visible: false })), 5000);
      
      setShowCloneModal(false);
      setCloneStudentName('');
      setCloneStudentSSN('');
      
      // We no longer navigate away, we stay in the current view as requested
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isStepValid = () => {
    switch (currentStepIndex) {
      case 0: // Anmälan
        return !!(formData.studentName && formData.incidentDate && formData.incidentDescription && formData.school);
      case 1: // Tilldelning
        return (formData.investigators?.length || 0) > 0;
      case 2: // Utredning
        const needsDiscriminationGround = formData.incidentTypes?.includes('diskriminering');
        const hasDiscriminationGround = !!formData.discriminationGround;
        
        return !!(
          formData.investigationText && 
          formData.studentVersion && 
          formData.incidentConfirmed && 
          formData.investigationAnalysis &&
          (!needsDiscriminationGround || hasDiscriminationGround)
        );
      case 3: // Åtgärder
        if (formData.incidentConfirmed === 'Nej' || formData.incidentConfirmed === 'Kränkning kan ej konstateras') return true;
        return !!(formData.actionsText && formData.followUpScheduled);
      case 4: // Uppföljning
        if (formData.incidentConfirmed === 'Nej' || formData.incidentConfirmed === 'Kränkning kan ej konstateras') return true;
        if (formData.followUpDecision === 'Problemet har upphört - avsluta ärendet') {
          return !!(formData.followUpText && formData.followUpDecision && formData.signatureName && formData.signatureDate);
        }
        return !!(formData.followUpText && formData.followUpDecision);
      case 5: // Avslut
        return !!(formData.signatureName && formData.signatureDate);
      default:
        return true;
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
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
      const stepStatusMap: Record<number, CaseStatus> = {
        0: CaseStatus.Anmald,
        1: CaseStatus.Tilldelad,
        2: CaseStatus.Utreds,
        3: CaseStatus.Atgardad,
        4: CaseStatus.Uppfoljd,
        5: CaseStatus.Avslutat
      };

      // If it's the first step (Anmälan) and NO case exists yet, save new
      if (currentStepIndex === 0 && !activeCaseId) {
        // Validation
        if (!formData.studentName || !formData.incidentDate || !formData.incidentDescription || !formData.school) {
          throw new Error('Vänligen fyll i alla obligatoriska fält (*) inklusive val av skola.');
        }

        let assignedToUid = '';
        let assignedToName = '';

        // If it's a quick report, we automatically assign to a principal
        if (isQuickReport) {
          try {
            // Try to find a principal for this school
            // Note: This only works if the user is authenticated, 
            // but for QuickReport they are often anonymous.
            // In that case, we fallback to a default.
            if (auth.currentUser) {
              const q = query(
                collection(db, 'users'),
                where('role', '==', 'principal'),
                where('school', '==', formData.school)
              );
              const snap = await getDocs(q);
              if (!snap.empty) {
                assignedToUid = snap.docs[0].id;
                assignedToName = snap.docs[0].data().name;
              }
            }
          } catch (e) {
            console.warn('Could not query principals automatically:', e);
          }

          // Fallback if no specific principal found or if anonymous
          if (!assignedToUid) {
            assignedToUid = 'malin-wimby-danderyd-se'; // Default principal derived from enebybergStaff data
            assignedToName = 'Malin Wimby';
          }
        }

        const casePayload = {
          title: formData.incidentDescription.substring(0, 50) + (formData.incidentDescription.length > 50 ? '...' : ''),
          description: formData.incidentDescription, 
          studentName: formData.studentName,
          incidentDate: formData.incidentDate,
          reporterUid: auth.currentUser?.uid || 'anonymous',
          reporterName: formData.reporterName || auth.currentUser?.displayName || 'Anonym anmälare',
          reporterEmail: formData.reporterEmail || auth.currentUser?.email || '',
          school: formData.school || userProfile?.school || 'Danderyds Skola',
          status: CaseStatus.Anmald,
          type: 'trygghet',
          assignedToUid,
          assignedToName,
          ...formData, 
          selectedActivities,
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
        let actualNextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
        
        // Custom logic for skipping steps or going back
        if (currentStepIndex === 2 && (formData.incidentConfirmed === 'Nej' || formData.incidentConfirmed === 'Kränkning kan ej konstateras')) {
          actualNextIndex = 5; // Skip directly to Avslut
        } else if (currentStepIndex === 4 && formData.followUpDecision === 'Problemet kvarstår - nya åtgärder och nytt datum för uppföljning') {
          actualNextIndex = 3; // Go back to Step 4: Åtgärder
        }

        const newStatus = stepStatusMap[actualNextIndex];

        await caseService.updateCase(activeCaseId, {
          ...formData,
          description: formData.incidentDescription,
          status: newStatus,
          oldStatus: stepStatusMap[currentStepIndex],
          selectedActivities,
          updatedAt: new Date().toISOString()
        });

        // TRIGGER SUCCESS TOAST
        if (newStatus === CaseStatus.Tilldelad) {
          setSuccessToast({ message: "Anmälan sparad. Notifiering skickad till rektor och huvudman.", visible: true });
        } else if (newStatus === CaseStatus.Uppfoljd || newStatus === CaseStatus.Avslutat) {
          setSuccessToast({ message: "Utredning färdigställd. Notifiering skickad till rektor för granskning.", visible: true });
        } else {
          setSuccessToast({ message: "Framsteg sparade i ärendet.", visible: true });
        }
        
        setTimeout(() => setSuccessToast(prev => ({ ...prev, visible: false })), 5000);
      }

      setShowClosingSummary(false);

      if (currentStepIndex < steps.length - 1) {
        // Custom logic for navigation
        if (currentStepIndex === 2 && (formData.incidentConfirmed === 'Nej' || formData.incidentConfirmed === 'Kränkning kan ej konstateras')) {
          setCurrentStepIndex(5); // Skip to Avslut
        } else if (currentStepIndex === 4 && formData.followUpDecision === 'Problemet kvarstår - nya åtgärder och nytt datum för uppföljning') {
          setCurrentStepIndex(3); // Go back to Step 4: Åtgärder
        } else {
          setCurrentStepIndex(prev => prev + 1);
        }
      }
    } catch (err: any) {
      console.error("Error in handleNextStep:", err);
      let errorMessage = err.message || "Ett fel uppstod";
      
      try {
        if (typeof errorMessage === 'string' && errorMessage.startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          errorMessage = parsed.error || errorMessage;
          if (errorMessage.includes('Missing or insufficient permissions')) {
            errorMessage = "Du saknar behörighet att utföra denna åtgärd (Säkerhetsregler).";
          }
        }
      } catch (e) {
        // Not JSON
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 px-6 bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 transition-colors"
      >
        <div className="w-20 h-20 bg-visuera-green/10 text-visuera-green rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-2xl font-black text-visuera-dark dark:text-slate-100 tracking-tight mb-4">Anmälan Skickad!</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-12">
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
          
          {auth.currentUser && activeCaseId && (
            <button 
              onClick={() => {
                setIsSubmitted(false);
                if (onSuccess) onSuccess(activeCaseId);
              }}
              className="w-full py-4 bg-white dark:bg-slate-700 text-visuera-dark dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              Visa anmälan <ArrowRight size={18} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`${!isQuickReport ? 'min-h-screen bg-slate-50 dark:bg-slate-900' : ''} flex flex-col font-sans transition-colors duration-500`}>
      {!isQuickReport && (
        <ProgressHeader 
          steps={steps.map((s, i) => ({
            ...s,
            status: i === currentStepIndex ? 'current' : i < currentStepIndex ? 'completed' : 'upcoming'
          }))}
          currentStepIndex={currentStepIndex}
          onStepClick={(idx) => {
            const canJumpToStep = (userProfile?.role === 'principal' || userProfile?.role === 'admin' || userProfile?.globalRole === 'admin');
            if (canJumpToStep || idx <= currentStepIndex) {
              setCurrentStepIndex(idx);
            }
          }}
        />
      )}

      <div className={`${!isQuickReport ? 'flex-1 flex overflow-hidden' : ''} bg-transparent`}>
        {/* Main Workspace Area */}
        <div className={`${!isQuickReport ? 'flex-1 overflow-y-auto no-scrollbar' : 'w-full'}`}>
          <div className={`${isQuickReport ? 'w-full' : 'max-w-6xl mx-auto px-4 py-8 lg:p-8'} flex flex-col lg:flex-row gap-8 lg:gap-12 items-start h-full`}>
            
            {/* Mobile Sidebar Toggle Button */}
            {!isQuickReport && activeCaseId && (
              <button 
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="lg:hidden w-full p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm flex items-center justify-between group active:scale-95 transition-all"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 bg-visuera-green/10 rounded-xl flex items-center justify-center text-visuera-green">
                    <Info size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Ärendeinformation</span>
                    <span className="text-sm font-bold text-visuera-dark dark:text-slate-100">Visa detaljer & verktyg</span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-visuera-green transition-all ${showMobileSidebar ? 'rotate-180' : ''}`}>
                  <ChevronDown size={18} />
                </div>
              </button>
            )}

            {/* Mobile Sidebar (Collapsible) */}
            <AnimatePresence>
              {!isQuickReport && showMobileSidebar && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden w-full overflow-hidden"
                >
                  <div className="pb-6">
                    <CaseSidebar 
                      formData={formData}
                      caseId={activeCaseId}
                      currentStepTitle={currentStep.title}
                      onShowOriginal={() => {
                        setHistoryTab('original');
                        setShowStats(true);
                        setShowMobileSidebar(false);
                      }}
                      onShowAudit={() => {
                        setHistoryTab('audit');
                        setShowStats(true);
                        setShowMobileSidebar(false);
                      }}
                      onGoToUtredning={currentStepIndex === 3 ? () => {
                        setCurrentStepIndex(2);
                        setShowMobileSidebar(false);
                      } : undefined}
                      onClone={() => setShowCloneModal(true)}
                      canClone={canClone}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Content Column */}
            <div className={`w-full flex-1 space-y-8 lg:space-y-12 pb-32 transition-all duration-500 ${isSidebarOpen ? '' : 'lg:px-12'}`}>
              <motion.div 
                key={currentStepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                  {!isQuickReport && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-visuera-green/10 rounded-2xl flex items-center justify-center text-visuera-green">
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg lg:text-xl font-black text-visuera-dark dark:text-slate-100 uppercase tracking-widest">{currentStep.title}</h2>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 text-left">Dokumenteras enligt legal standard</p>
                      </div>
                    </div>
                  )}

                  {!isQuickReport && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={generatePDF}
                        disabled={isGeneratingPDF}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
                      >
                        {isGeneratingPDF ? (
                          <div className="w-4 h-4 border-2 border-visuera-green border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FileDown size={14} className="text-visuera-green" />
                        )}
                        Export PDF
                      </button>
                      {activeCaseId && userProfile?.role === 'principal' && currentStepIndex >= 2 && currentStepIndex <= 4 && (
                        <button
                          onClick={handleNudge}
                          disabled={isNudging}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-visuera-green/5 hover:bg-visuera-green/10 text-visuera-green rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-visuera-green/20"
                        >
                          <Zap size={14} />
                          Nödvändig uppföljning
                        </button>
                      )}
                      
                      {/* Explicit Focus Mode Toggle */}
                      {!isQuickReport && (
                        <button
                          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                          className={`hidden lg:flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm hover:-translate-y-0.5 active:translate-y-0 ${
                            isSidebarOpen 
                              ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700' 
                              : 'bg-visuera-green text-white border-visuera-green shadow-visuera-green/20'
                          }`}
                          title={isSidebarOpen ? "Dölj verktyg för att fokusera" : "Visa ärendeverktyg"}
                        >
                          {isSidebarOpen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                          {isSidebarOpen ? 'Dölj Verktyg' : 'Visa Verktyg'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
                  <motion.div 
                    layout
                    className="flex-1 space-y-8 lg:space-y-10 min-w-0"
                  >
                    {currentStep.id === 1 && (
                      <AnmalanStep 
                        formData={formData}
                        updateFormData={updateFormData}
                        authorities={authorities}
                        availableSchools={availableSchools}
                        selectedAuthority={selectedAuthority}
                        setSelectedAuthority={setSelectedAuthority}
                      />
                    )}
                    {currentStep.id === 2 && (
                      <TilldelningStep 
                        formData={formData}
                        updateFormData={updateFormData}
                        availableStaff={availableStaff}
                        availableTeams={availableTeams}
                      />
                    )}
                    {currentStep.id === 3 && (
                      <UtredningStep 
                        formData={formData}
                        userProfile={userProfile}
                        activeCaseId={activeCaseId}
                        quickMessage={quickMessage}
                        setQuickMessage={setQuickMessage}
                        handleSendQuickMessage={handleSendQuickMessage}
                        updateFormData={updateFormData}
                        availableStaff={availableStaff}
                        availableTeams={availableTeams}
                      />
                    )}
                    {currentStep.id === 4 && (
                      <AtgarderStep 
                        formData={formData}
                        updateFormData={updateFormData}
                        selectedActivities={selectedActivities}
                        toggleActivity={toggleActivity}
                        availableStaff={availableStaff}
                        availableTeams={availableTeams}
                        userProfile={userProfile}
                      />
                    )}
                    {currentStep.id === 5 && (
                      <UppfoljningStep 
                        formData={formData}
                        updateFormData={updateFormData}
                      />
                    )}
                    {currentStep.id === 6 && (
                      <AvslutStep 
                        formData={formData}
                        updateFormData={updateFormData}
                        showClosingSummary={showClosingSummary}
                        setShowClosingSummary={setShowClosingSummary}
                        activeCaseId={activeCaseId}
                        onGenerateAnonymizedReport={handleGenerateAnonymizedReport}
                        isGeneratingPDF={isGeneratingPDF}
                        onSendBack={handleSendBack}
                      />
                    )}

                    <div className="mt-8 lg:mt-12 pt-8 lg:pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                        {isStepValid() ? (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="uppercase tracking-[0.15em] text-[8px] lg:text-[9px] font-black">All information ifylld</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-slate-50 text-slate-400 px-4 py-2 rounded-full border border-slate-100">
                            <div className="w-2 h-2 bg-slate-300 rounded-full" />
                            <span className="uppercase tracking-[0.15em] text-[8px] lg:text-[9px] font-black">Väntar på obligatoriska fält *</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                        {currentStepIndex > 0 && (
                          <button 
                            onClick={handlePrevStep}
                            disabled={isProcessing}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 lg:px-8 py-3.5 lg:py-4 rounded-2xl font-black bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-[9px] lg:text-[10px] uppercase tracking-[0.2em]"
                          >
                            <ArrowLeft size={16} />
                            Föregående
                          </button>
                        )}
                        
                        <button 
                          onClick={handleNextStep}
                          disabled={isProcessing || !isStepValid()}
                          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 lg:px-10 py-4 lg:py-5 rounded-2xl font-black transition-all shadow-xl text-[9px] lg:text-[10px] uppercase tracking-[0.2em] ${
                            isProcessing || !isStepValid()
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border border-slate-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-600/20'
                          }`}
                        >
                          {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              {showClosingSummary 
                                ? 'Slutför Arkivering' 
                                : (isQuickReport && currentStepIndex === 0 
                                    ? 'Skicka Anmälan' 
                                    : steps[currentStepIndex].action)}
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Smart Sidopanel (Sticky Sidebar) */}
                  {!isQuickReport && (
                    <AnimatePresence mode="wait">
                      {isSidebarOpen ? (
                        <motion.div 
                          key="sidebar-open"
                          initial={{ opacity: 0.5, x: 20 }}
                          animate={{ opacity: 1, x: 0, width: 320 }}
                          exit={{ opacity: 0, x: 20, width: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                          className="hidden lg:block sticky top-8 space-y-6 h-fit shrink-0 overflow-visible"
                        >
                          <div className="relative">
                            {/* Visual Handle for Sidebar - Overlapping trigger area */}
                            <div 
                              onClick={() => setIsSidebarOpen(false)}
                              className="absolute -left-6 top-0 bottom-0 w-6 group cursor-pointer z-50 flex items-center justify-center"
                              title="Dölj sidopanel"
                            >
                               <div className="w-1.5 h-16 bg-slate-200 rounded-full group-hover:bg-visuera-green group-hover:w-2 transition-all shadow-sm" />
                            </div>

                            <CaseSidebar 
                              formData={formData}
                              caseId={activeCaseId}
                              currentStepTitle={currentStep.title}
                              onShowOriginal={() => {
                                setHistoryTab('original');
                                setShowStats(true);
                              }}
                              onShowAudit={() => {
                                setHistoryTab('audit');
                                setShowStats(true);
                              }}
                              onGoToUtredning={currentStepIndex === 3 ? () => setCurrentStepIndex(2) : undefined}
                              onClone={() => setShowCloneModal(true)}
                              canClone={canClone}
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="sidebar-closed"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="hidden lg:flex flex-col items-center gap-6 sticky top-8 py-8 px-3 bg-white/40 backdrop-blur-md border border-slate-100 rounded-[32px] h-fit shadow-sm"
                        >
                          <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-visuera-green shadow-sm transition-all hover:scale-110"
                            aria-label="Visa ärendeinformation"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          
                          <div className="flex flex-col items-center gap-6 text-slate-300">
                             <div className="p-2 rounded-xl bg-slate-50/50" title={`ID: ÄRE-${activeCaseId?.slice(-4).toUpperCase()}`}>
                                <Info size={16} />
                             </div>
                             <div className="p-2 rounded-xl bg-slate-50/50" title="Dokumentation">
                                <FileText size={16} />
                             </div>
                             <div className="p-2 rounded-xl bg-slate-50/50" title="Historik">
                                <History size={16} />
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

    <AnimatePresence>
        {showStats && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStats(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-visuera-dark text-white rounded-2xl flex items-center justify-center shadow-lg shadow-visuera-dark/20">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-visuera-dark uppercase tracking-tight">Ärende-detaljer</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Historik & Dokumentation</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowStats(false)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex border-b border-slate-100 px-6 lg:px-8">
                {[
                  { id: 'original', label: 'Ursprunglig anmälan', icon: ShieldCheck },
                  { id: 'audit', label: 'Händelselogg', icon: History }
                ].map((tab: any) => (
                  <button
                    key={tab.id}
                    onClick={() => setHistoryTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-bold text-xs uppercase tracking-widest ${
                      historyTab === tab.id 
                        ? 'border-visuera-green text-visuera-green' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                {historyTab === 'original' ? (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <User size={12} className="text-visuera-green" /> Inblandade
                        </h4>
                        <div className="space-y-3">
                          {formData.involvedParties?.length > 0 ? (
                            formData.involvedParties.map((p: any) => (
                              <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{p.role} ({p.type})</p>
                                  {p.class && <span className="text-[9px] font-bold text-visuera-green">{p.class}</span>}
                                </div>
                                <p className="text-xs font-bold text-slate-700">{p.name}</p>
                              </div>
                            ))
                          ) : (
                            <>
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Fullständigt namn</p>
                                <p className="text-sm font-bold text-slate-700">{formData.studentName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Klass/Grupp</p>
                                <p className="text-sm font-bold text-slate-700">{formData.studentClass || '-'}</p>
                              </div>
                            </>
                          )}
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Plats för incident</p>
                            <p className="text-sm font-bold text-slate-700">
                              {formData.incidentLocation === 'Annan plats' ? formData.incidentLocationOther : formData.incidentLocation || '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Calendar size={12} className="text-visuera-green" /> Tid & Typ
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Incidentdatum</p>
                            <p className="text-sm font-bold text-slate-700">{formData.incidentDate || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Registrerad</p>
                            <p className="text-sm font-bold text-slate-700">{formData.createdAt?.seconds ? new Date(formData.createdAt.seconds * 1000).toLocaleString('sv-SE') : formData.createdAt || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Typ av händelse</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {formData.reportType?.length > 0 ? formData.reportType.map((t: string) => (
                                <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold uppercase">{t}</span>
                              )) : <span className="text-sm font-bold text-slate-700">-</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Phone size={12} className="text-visuera-green" /> Kontaktpersoner
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Anmälare</p>
                            <p className="text-sm font-bold text-slate-700">{formData.reporterName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Vårdnadshavare kontaktad</p>
                            <p className="text-sm font-bold text-slate-700">{formData.guardianContacted || 'Ej angivet'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-[28px] p-8 border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText size={16} className="text-visuera-green" />
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Händelseförlopp</h4>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                        {formData.incidentDescription || 'Ingen beskrivning tillgänglig.'}
                      </p>
                    </div>

                    {formData.actionsTaken?.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Omedelbara åtgärder vidtagna</h4>
                        <div className="flex flex-wrap gap-2">
                          {formData.actionsTaken.map((a: string) => (
                            <div key={a} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                              <CheckCircle2 size={12} className="text-visuera-green" />
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {auditLog.length > 0 ? (
                      <div className="relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-slate-100 space-y-8 pl-12 pr-4">
                        {auditLog.map((log, idx) => (
                          <div key={log.id || idx} className="relative">
                            <div className="absolute -left-12 top-0 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 text-slate-400">
                              {log.action === 'Created' ? <PlusCircle size={14} className="text-emerald-500" /> : 
                               log.action === 'Updated' ? <PenTool size={14} className="text-blue-500" /> :
                               log.action === 'NOTIFIERING_SKICKAD' ? <Bell size={14} className="text-amber-500" /> :
                               <Clock size={14} />}
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{log.action || 'Händelse'}</span>
                              <span className="text-[10px] font-mono font-medium text-slate-400">
                                {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString('sv-SE') : '-'}
                              </span>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                              <p className="text-[11px] font-bold text-slate-600 mb-2">Utförd av: <span className="text-slate-900">{log.userName || log.userId}</span></p>
                              {log.message && <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 border-slate-200 pl-3">"{log.message}"</p>}
                              {log.oldStatus && log.newStatus && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded text-[9px] font-bold uppercase">{log.oldStatus}</span>
                                  <ArrowRight size={10} className="text-slate-300" />
                                  <span className="px-2 py-0.5 bg-visuera-green/10 text-visuera-green rounded text-[9px] font-bold uppercase">{log.newStatus}</span>
                                </div>
                              )}
                              {log.changes && log.changes.length > 0 && historyTab === 'audit' && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {log.changes.map((field: string) => (
                                    <span key={field} className="text-[9px] text-slate-400 font-medium">#{field}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <History size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ingen händelselogg tillgänglig ännu</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 lg:p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                   Sekretess & Spårbarhet enligt GDPR
                </p>
                <button 
                  onClick={() => setShowStats(false)}
                  className="px-8 py-3 bg-visuera-dark text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                  Stäng
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showCloneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCloneModal(false)}
              className="absolute inset-0 bg-visuera-dark/40 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="bg-visuera-green p-8 text-white relative">
                <button 
                  onClick={() => setShowCloneModal(false)}
                  className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Layers size={24} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest leading-none mb-2">Klona utredning</h3>
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest leading-none">Skapa en individuell kopia av ärendet</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-2xl flex gap-3">
                  <AlertCircle size={18} className="text-amber-500 shrink-0" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed italic">
                    Vid kloning kopieras all utredningsdata till ett nytt separat ärende. Det ursprungliga elevnamnet rensas och ersätts för att bibehålla integritet och GDPR-efterlevnad.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ny elevs namn *</label>
                    <input 
                      type="text"
                      value={cloneStudentName}
                      onChange={(e) => setCloneStudentName(e.target.value)}
                      placeholder="Ange fullständigt namn..."
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-visuera-green/10 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnummer (valfritt)</label>
                    <input 
                      type="text"
                      value={cloneStudentSSN}
                      onChange={(e) => setCloneStudentSSN(e.target.value)}
                      placeholder="ÅÅÅÅMMDD-XXXX"
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-visuera-green/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    disabled={!cloneStudentName.trim() || isProcessing}
                    onClick={handleCloneCase}
                    className="flex-1 py-4 bg-visuera-green text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-visuera-green/20"
                  >
                    {isProcessing ? 'Skapar kopia...' : 'Bekräfta Kloning'}
                  </button>
                  <button 
                    onClick={() => setShowCloneModal(false)}
                    className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {successToast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 lg:bottom-12 left-1/2 -translate-x-1/2 z-[150] w-[calc(100%-2rem)] max-w-md bg-visuera-dark text-white px-6 lg:px-8 py-4 lg:py-5 rounded-[24px] lg:rounded-[30px] shadow-2xl flex items-center gap-4 border border-white/10"
          >
            <div className="w-10 h-10 bg-visuera-green rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm uppercase tracking-wider">Klart!</span>
              <span className="text-xs text-slate-300 font-medium">{successToast.message}</span>
            </div>
            <button 
              onClick={() => setSuccessToast(prev => ({ ...prev, visible: false }))}
              className="ml-4 p-2 hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

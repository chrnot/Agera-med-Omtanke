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
  Building2,
  Layers,
  FileDown,
  X,
  MessageSquare,
  Send,
  Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { caseService } from '../services/caseService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { LegalGuidance } from './LegalGuidance';
import { ContextualGuidance } from './ContextualGuidance';
import { StudentVoiceModule } from './StudentVoiceModule';
import { CaseSidebar } from './flow/CaseSidebar';
import { ProgressHeader } from './ProgressHeader';
import { CollapsibleLegal } from './CollapsibleLegal';
import { INCIDENT_CATEGORIES, LEGAL_HELP_TEXTS } from '../constants/guidanceContent';

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
  authority: '',
  incidentTypes: [] as string[],
  investigationAnalysis: '',
  // Step 2: Tilldelning
  assignedTeam: '',
  assignedTeacher: '',
  assignedTeacherUid: '',
  assignedToUid: '',
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
  const [activeCaseId, setActiveCaseId] = React.useState<string | null>(initialCaseId || null);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form State
  const [formData, setFormData] = React.useState(DEFAULT_FORM_DATA);
  const [showStats, setShowStats] = React.useState(false);
  const [selectedActivities, setSelectedActivities] = React.useState<string[]>([]);
  const [successToast, setSuccessToast] = React.useState<{message: string, visible: boolean}>({ message: '', visible: false });

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
      setSelectedActivities([]);
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
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [isNudging, setIsNudging] = React.useState(false);
  const [quickMessage, setQuickMessage] = React.useState('');

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

  const isStepValid = () => {
    switch (currentStepIndex) {
      case 0: // Anmälan
        return !!(formData.studentName && formData.incidentDate && formData.incidentDescription && formData.school);
      case 1: // Tilldelning
        return !!formData.assignedTeacherUid;
      case 2: // Utredning
        const isStudentVersionLongEnough = (formData.studentVersion || '').length >= 150;
        return !!(formData.investigationText && isStudentVersionLongEnough && formData.incidentConfirmed && formData.ageAdaptedConfirmation);
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
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };


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
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
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

      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-8 flex gap-12 items-start h-full">
            
            {/* Form Content Column */}
            <div className="flex-1 space-y-12 pb-32">
              <motion.div 
                key={currentStepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-visuera-green/10 rounded-2xl flex items-center justify-center text-visuera-green">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-visuera-dark uppercase tracking-widest">{currentStep.title}</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Dokumenteras enligt legal standard</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={generatePDF}
                      disabled={isGeneratingPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 shadow-sm"
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
                        className="flex items-center gap-2 px-4 py-2 bg-visuera-green/5 hover:bg-visuera-green/10 text-visuera-green rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-visuera-green/20"
                      >
                        <Zap size={14} />
                        Begär uppdatering
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
                  <div className="space-y-10">
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
                        quickMessage={quickMessage}
                        setQuickMessage={setQuickMessage}
                        handleSendQuickMessage={handleSendQuickMessage}
                        updateFormData={updateFormData}
                      />
                    )}
                    {currentStep.id === 4 && (
                      <AtgarderStep 
                        formData={formData}
                        updateFormData={updateFormData}
                        selectedActivities={selectedActivities}
                        toggleActivity={toggleActivity}
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
                      />
                    )}

                    <div className="mt-12 pt-10 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                        {isStepValid() ? (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="uppercase tracking-[0.15em] text-[9px] font-black">All information ifylld</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-slate-50 text-slate-400 px-4 py-2 rounded-full border border-slate-100">
                            <div className="w-2 h-2 bg-slate-300 rounded-full" />
                            <span className="uppercase tracking-[0.15em] text-[9px] font-black">Väntar på obligatoriska fält *</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-4">
                        {currentStepIndex > 0 && (
                          <button 
                            onClick={handlePrevStep}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-[10px] uppercase tracking-[0.2em]"
                          >
                            <ArrowLeft size={16} />
                            Föregående
                          </button>
                        )}
                        
                        <button 
                          onClick={handleNextStep}
                          disabled={isProcessing || !isStepValid()}
                          className={`flex items-center gap-2 px-10 py-5 rounded-2xl font-black transition-all shadow-xl text-[10px] uppercase tracking-[0.2em] ${
                            isProcessing || !isStepValid()
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border border-slate-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-600/20'
                          }`}
                        >
                          {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              {showClosingSummary ? 'Slutför Arkivering' : steps[currentStepIndex].action}
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Smart Sidopanel (Sticky Sidebar) */}
                  <div className="hidden lg:block sticky top-8 space-y-6">
                    <CaseSidebar 
                      formData={formData}
                      caseId={activeCaseId}
                      currentStepTitle={currentStep.title}
                      onShowAudit={() => setShowStats(true)}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

    <AnimatePresence>
        {successToast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[150] bg-visuera-dark text-white px-8 py-5 rounded-[30px] shadow-2xl flex items-center gap-4 border border-white/10"
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

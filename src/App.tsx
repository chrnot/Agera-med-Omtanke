import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  LayoutDashboard, 
  FileSearch, 
  Layers, 
  Users, 
  Database, 
  Bell, 
  LogOut, 
  X, 
  ChevronDown, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Zap, 
  ArrowLeft, 
  Search, 
  Filter, 
  User as UserIcon, 
  Building2, 
  Calendar, 
  Trash2, 
  FileDown, 
  ClipboardList, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  LayoutGrid,
  List,
  Clock,
  ChevronRight,
  ChevronUp,
  Smartphone,
  Fingerprint,
  Lock,
  Settings,
  BookOpen,
  MapPin
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { TrygghetsFlow } from './components/TrygghetsFlow';
import { UserManagement } from './components/UserManagement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationInbox } from './components/NotificationInbox';
import { caseService } from './services/caseService';
import { setupService } from './services/setupService';
import { onSnapshot, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  school: string;
  team?: string;
  personalNumber?: string;
  globalRole?: string;
  schoolAccess?: Record<string, string[] | { roles: string[]; team?: string }>;
  authorityAccess?: Record<string, string>;
  createdAt: string;
  isActive?: boolean;
  migratedTo?: string;
}

const BankIDModal = ({ isOpen, onClose, onAuthenticated }: { isOpen: boolean, onClose: () => void, onAuthenticated: (pnr: string) => void }) => {
  const [step, setStep] = useState<'input' | 'waiting' | 'success'>('input');
  const [pnr, setPnr] = useState('');
  const [error, setError] = useState('');

  const handleStart = () => {
    if (pnr.length !== 12 && pnr.length !== 13) {
      setError('Vänligen ange ett giltigt personnummer (ÅÅÅÅMMDD-XXXX)');
      return;
    }
    setStep('waiting');
    // Simulate BankID process
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onAuthenticated(pnr);
      }, 1500);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-visuera-dark/40">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-[#003da5] rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-[#003da5]/20">
            <Smartphone size={40} className="text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#003da5]">BankID</h2>
            <p className="text-slate-500 text-sm font-medium">Säker inloggning med e-legitimation</p>
          </div>

          <div className="py-2">
            {step === 'input' && (
              <div className="space-y-4">
                <div className="text-left space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personnummer</label>
                  <input 
                    type="text"
                    placeholder="ÅÅÅÅMMDD-XXXX"
                    value={pnr}
                    onChange={(e) => {
                      setPnr(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center text-lg font-black tracking-widest focus:border-[#003da5] transition-all outline-none"
                  />
                  {error && <p className="text-red-500 text-[10px] font-bold text-center mt-2">{error}</p>}
                </div>
                <button 
                  onClick={handleStart}
                  className="w-full py-4 bg-[#003da5] text-white rounded-2xl font-bold text-lg hover:bg-[#002d7a] transition-all shadow-lg shadow-[#003da5]/20"
                >
                  Starta BankID
                </button>
              </div>
            )}

            {step === 'waiting' && (
              <div className="py-8 space-y-6">
                <div className="relative w-16 h-16 mx-auto">
                   <div className="absolute inset-0 border-4 border-[#003da5]/10 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-[#003da5] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-visuera-dark">Starta BankID-appen</p>
                  <p className="text-xs text-slate-400">Väntar på att du ska signera i din BankID-app...</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-8 space-y-6">
                <div className="w-16 h-16 bg-visuera-green rounded-full flex items-center justify-center mx-auto text-white">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-visuera-dark">Legitimering klar</p>
                  <p className="text-xs text-slate-400">Du skickas nu vidare...</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 text-xs font-bold hover:text-slate-600 transition-all uppercase tracking-widest"
          >
            Avbryt
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Login = ({ onQuickReport, onBankIDLogin }: { onQuickReport: () => void, onBankIDLogin: (pnr: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const [showBankID, setShowBankID] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in DB, if not create
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // RECONCILIATION: Check if there's a provisioned user document with this email but different ID
        const emailQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const emailSnap = await getDocs(emailQuery);
        
        if (!emailSnap.empty && emailSnap.docs[0].id !== user.uid) {
          const oldDoc = emailSnap.docs[0];
          const oldData = oldDoc.data();
          
          // Migrate old profile data to the new UID-based document
          await setDoc(userRef, {
            ...oldData,
            uid: user.uid,
            reconciledFrom: oldDoc.id,
            updatedAt: new Date().toISOString()
          });
          
          // Optionally delete or mark the old document to avoid duplicates in lists
          // For now, let's mark it as inactive or migrated to keep lists clean
          await updateDoc(doc(db, 'users', oldDoc.id), {
             isActive: false,
             migratedTo: user.uid
          });
        } else {
          // Regular new user creation
          const isAdminEmail = user.email === 'christopher.nottberg@gmail.com';
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            role: isAdminEmail ? 'admin' : 'staff',
            globalRole: isAdminEmail ? 'admin' : 'none',
            school: 'Danderyds Skola',
            isActive: true,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        const userData = userSnap.data();
        if (userData.isActive === false && !userData.migratedTo) {
          await signOut(auth);
          setError('Ditt konto har avaktiverats. Kontakta en administratör vid frågor.');
          return;
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setError('Inloggningen misslyckades. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://picsum.photos/seed/danderyd/1920/1080?blur=10')] bg-cover">
      <div className="absolute inset-0 bg-visuera-green/10 backdrop-blur-[2px]"></div>
      <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-white/50 w-full max-w-xl relative z-10 text-center space-y-8">
        <div className="w-20 h-20 bg-visuera-green rounded-[24px] flex items-center justify-center mx-auto shadow-xl shadow-visuera-green/20">
          <span className="text-white font-bold text-3xl">AmO</span>
        </div>
        <div>
          <h1 className="text-4xl font-black text-visuera-dark tracking-tight">Agera med Omtanke</h1>
          <p className="text-slate-500 font-medium mt-2">Trygghetsärenden i Danderyds Kommun</p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}
        <div className="py-4 space-y-4">
          <button 
            onClick={onQuickReport}
            className="w-full py-4 bg-white text-visuera-green border-2 border-visuera-green rounded-2xl font-bold text-base hover:bg-visuera-green/5 transition-all flex items-center justify-center gap-3"
          >
            <PlusCircle size={20} />
            Snabb-anmälan (Utan inloggning)
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Eller logga in</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold text-base hover:bg-slate-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
                  Logga in med Google
                </>
              )}
            </button>

            <button 
              onClick={() => setShowBankID(true)}
              className="w-full py-5 bg-[#003da5] text-white rounded-2xl font-bold text-lg hover:bg-[#002d7a] transition-all shadow-lg shadow-[#003da5]/20 flex items-center justify-center gap-3"
            >
              <Smartphone size={22} />
              Logga in med BankID
            </button>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
          Genom att använda Agera med Omtanke godkänner du hantering av personuppgifter enligt GDPR och Danderyds kommuns riktlinjer.
        </p>
      </div>

      <BankIDModal 
        isOpen={showBankID} 
        onClose={() => setShowBankID(false)} 
        onAuthenticated={(pnr) => {
          setShowBankID(false);
          onBankIDLogin(pnr);
        }}
      />
    </div>
  );
};

const ROLE_LABELS: Record<string, string> = {
  'staff': 'Anmälare',
  'teacher': 'Utredare',
  'principal': 'Beslutsfattare (Rektor)',
  'authority': 'Huvudman (Skolchef)',
  'admin': 'Systemadministratör'
};

const Dashboard = ({ onNewReport, cases: allCases, onOpenCase, onNavigate, caseQuestions, userProfile }: { 
  onNewReport: () => void, 
  cases: any[], 
  onOpenCase: (id: string) => void, 
  onNavigate: (tab: any) => void, 
  caseQuestions: string[],
  userProfile: any
}) => {
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'mine'>('all');
  const [statusFilter, setStatusFilter] = React.useState<string | 'all'>('all');
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');

  const statusLevels = [
    { label: 'Anmälda', status: 'anmäld', ringColor: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { label: 'Utredning', status: 'utredning', ringColor: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
    { label: 'Åtgärder', status: 'åtgärder', ringColor: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { label: 'Uppföljning', status: 'uppföljd', ringColor: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { label: 'Avslutade', status: 'avslutat', ringColor: 'bg-slate-300', bgColor: 'bg-slate-50', textColor: 'text-slate-500' }
  ];

  // Context-aware filtering for Role and School
  const cases = React.useMemo(() => {
    if (!userProfile) return allCases;
    let filtered = allCases;
    if (userProfile.globalRole !== 'admin') {
      if (userProfile.school) {
        filtered = allCases.filter(c => c.school === userProfile.school);
      }
    }
    return filtered;
  }, [allCases, userProfile]);

  const activeCases = cases.filter(c => c.status !== 'avslutat' && c.status !== 'avslutan');
  const unassignedCases = cases.filter(c => c.status === 'anmäld' && !c.assignedToUid);
  
  const displayCases = React.useMemo(() => {
    let filtered = cases;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title?.toLowerCase().includes(q) || 
        c.studentName?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
      );
    }
    if (filterType === 'mine' && userProfile) {
      filtered = filtered.filter(c => c.assignedToUid === userProfile.uid || c.reporterUid === userProfile.uid);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        if (statusFilter === 'utredning') return c.status === 'utredning' || c.status === 'utreds';
        if (statusFilter === 'avslutat') return c.status === 'avslutat' || c.status === 'avslutad';
        return c.status === statusFilter;
      });
    }
    return [...filtered].sort((a, b) => {
      const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime();
      const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime();
      return (Number(timeB)) - (Number(timeA));
    });
  }, [cases, searchQuery, filterType, statusFilter, userProfile]);

  const calculateAverageLeadTime = () => {
    const durations: number[] = [];
    cases.forEach(c => {
      if ((c.investigationStartedAt || c.status !== 'anmäld') && c.createdAt) {
        const start = c.investigationStartedAt?.seconds ? c.investigationStartedAt.seconds * 1000 : (c.investigationStartedAt ? new Date(c.investigationStartedAt).getTime() : (c.updatedAt?.seconds ? c.updatedAt.seconds * 1000 : (c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now())));
        const created = c.createdAt?.seconds ? c.createdAt.seconds * 1000 : new Date(c.createdAt).getTime();
        durations.push(start - created);
      }
    });

    if (durations.length === 0) return "0.0";
    const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
    return (avgMs / (1000 * 60 * 60 * 24)).toFixed(1);
  };

  const hotspotData = React.useMemo(() => {
    const locations: Record<string, number> = {};
    cases.forEach(c => {
      const loc = c.incidentLocation || c.location || 'Ospecificerat';
      locations[loc] = (locations[loc] || 0) + 1;
    });
    return Object.entries(locations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [cases]);

  const trendData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    return months.map((month, index) => {
      const count = cases.filter(c => {
        const date = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      }).length;
      return { name: month, antal: count };
    });
  }, [cases]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('sv-SE', { dateStyle: 'short' });
  };

  const isOld = (createdAt: any) => {
    if (!createdAt) return false;
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return (Date.now() - date.getTime()) > (48 * 60 * 60 * 1000);
  };

  const dashboardStats = [
    { 
      label: 'Aktiva ärenden', 
      value: activeCases.length.toString(), 
      icon: Layers, 
      color: 'text-visuera-green', 
      bg: 'bg-visuera-green/10',
      description: 'Ärenden under behandling' 
    },
    { 
      label: 'Ej påbörjade', 
      value: unassignedCases.length.toString(), 
      icon: Clock, 
      color: unassignedCases.length > 0 ? 'text-red-500' : 'text-slate-400', 
      bg: unassignedCases.length > 0 ? 'bg-red-50' : 'bg-slate-50',
      description: 'Väntar på tilldelning',
      alert: unassignedCases.length > 0
    },
    { 
      label: 'Genomsnittlig ledtid', 
      value: `${calculateAverageLeadTime()} dgr`, 
      icon: TrendingUp, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      description: 'Från anmälan till utredning' 
    }
  ];

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'anmäld': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'utredning': case 'utreds': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'åtgärder': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'uppföljd': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'avslutat': case 'avslutad': return 'bg-slate-50 text-slate-400 border-slate-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-32 lg:pb-12">
      {/* BankID Status Bar */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Verifierad Session</p>
            <p className="text-xs font-bold text-visuera-dark mt-1">Inloggad som {userProfile?.name} via BankID</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Säker anslutning</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold text-visuera-green uppercase tracking-widest mb-1">Välkommen tillbaka</p>
          <h1 className="text-3xl font-black text-visuera-dark tracking-tight">Instrumentpanel</h1>
        </div>
        <button 
          onClick={onNewReport}
          className="hidden sm:flex bg-visuera-green text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] items-center gap-3 hover:bg-visuera-light-green transition-all shadow-xl shadow-visuera-green/20"
        >
          <PlusCircle size={20} />
          Ny anmälan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {dashboardStats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-5 group"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
              <stat.icon size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl lg:text-3xl font-black text-visuera-dark tracking-tight">{stat.value}</span>
                {stat.alert && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter truncate mt-1">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {(userProfile?.role === 'principal' || userProfile?.role === 'authority') && (
        <div className="bg-visuera-dark rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
          <button 
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full px-8 py-6 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-4 text-white">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-visuera-green">
                <TrendingUp size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-sm uppercase tracking-widest">Strategisk Analysvy</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter mt-1">Underlag för systematiskt kvalitetsarbete</p>
              </div>
            </div>
            <div className={`p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-visuera-green transition-all ${showAnalysis ? 'rotate-180' : ''}`}>
              <ChevronDown size={20} />
            </div>
          </button>

          <AnimatePresence>
            {showAnalysis && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-8 pb-8 space-y-8"
              >
                <div className="h-px bg-white/5 w-full" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest">Anmälningsfrekvens per månad</h4>
                    <div className="h-[200px] w-full bg-white/5 rounded-2xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#ffffff40', fontWeight: 600 }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', background: '#1c252a', color: '#fff', fontSize: '10px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="antal" 
                            stroke="#10B981" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest">Identifierade Risky-Locs (Hotspots)</h4>
                    <div className="space-y-3">
                      {hotspotData.map((loc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-visuera-green/20 flex items-center justify-center text-visuera-green text-xs font-bold">
                              {i + 1}
                            </div>
                            <span className="text-xs font-bold text-white/80">{loc.name}</span>
                          </div>
                          <span className="text-xs font-black text-white">{loc.value} ärenden</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="bg-white rounded-[40px] p-6 lg:p-8 border border-slate-100 shadow-sm space-y-6">
        {/* Status Levels Overview */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap border-2 ${
              statusFilter === 'all' 
                ? 'bg-visuera-dark border-visuera-dark text-white shadow-lg' 
                : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Alla ärenden</span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {cases.length}
            </div>
          </button>
          
          {statusLevels.map((level) => {
            const count = cases.filter(c => {
              if (level.status === 'utredning') return c.status === 'utredning' || c.status === 'utreds';
              if (level.status === 'avslutat') return c.status === 'avslutat' || c.status === 'avslutad';
              return c.status === level.status;
            }).length;
            
            const isActive = statusFilter === level.status;
            
            return (
              <button
                key={level.status}
                onClick={() => setStatusFilter(level.status)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap border-2 ${
                  isActive 
                    ? `${level.bgColor} border-current ${level.textColor} shadow-md` 
                    : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                }`}
                style={isActive ? { borderColor: 'currentColor' } : {}}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{level.label}</span>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? `${level.ringColor} text-white` : 'bg-slate-200 text-slate-400'
                }`}>
                  {count}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <h3 className="font-black text-visuera-dark uppercase tracking-widest">Ärendelista</h3>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-white text-visuera-dark shadow-sm' : 'text-slate-400 hover:text-visuera-dark'}`}
              >
                Alla
              </button>
              <button 
                onClick={() => setFilterType('mine')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === 'mine' ? 'bg-white text-visuera-dark shadow-sm' : 'text-slate-400 hover:text-visuera-dark'}`}
              >
                Mina
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Sök i arkivet..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 transition-all placeholder:text-slate-300"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            </div>
            <div className="hidden sm:flex bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-visuera-dark shadow-sm' : 'text-slate-400'}`}
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white text-visuera-dark shadow-sm' : 'text-slate-400'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {displayCases.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-visuera-green/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="text-visuera-green/20" size={40} />
            </div>
            <h4 className="text-xl font-black text-visuera-dark">Skolan är just nu trygg</h4>
            <p className="text-sm text-slate-400 mt-2">Inga rapporterade incidenter hittades för detta filter.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto no-scrollbar">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="text-left px-4">Referens & Titel</th>
                    <th className="text-left px-4">Elev</th>
                    <th className="text-left px-4">Status</th>
                    <th className="text-left px-4">Datum</th>
                    <th className="text-right px-4">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {displayCases.map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => onOpenCase(c.id)}
                      className="group bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                    >
                      <td className="px-4 py-5 rounded-l-[20px]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-visuera-green shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                            <FileSearch size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ÄRE-{c.id.slice(-4).toUpperCase()}</p>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-visuera-dark">{c.title}</span>
                              {isOld(c.createdAt) && c.status === 'anmäld' && (
                                <AlertTriangle size={14} className="text-red-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-xs font-bold text-slate-600">{c.studentName}</span>
                      </td>
                      <td className="px-4 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-5 font-bold text-xs text-slate-500">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-5 rounded-r-[20px] text-right">
                        <button className="p-2 text-slate-300 hover:text-visuera-green transition-colors">
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayCases.map((c) => (
                <motion.div 
                  key={c.id}
                  whileHover={{ y: -2 }}
                  onClick={() => onOpenCase(c.id)}
                  className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(c.status)}`}>
                      {c.status}
                    </div>
                    {isOld(c.createdAt) && c.status === 'anmäld' && (
                      <AlertTriangle size={14} className="text-red-500 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ÄRE-{c.id.slice(-4).toUpperCase()}</p>
                    <h4 className="font-extrabold text-visuera-dark truncate">{c.title}</h4>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>{c.studentName}</span>
                    <span>{formatDate(c.createdAt)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onNewReport}
        className="sm:hidden fixed bottom-6 right-6 w-16 h-16 bg-visuera-green text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 border-4 border-white"
      >
        <PlusCircle size={24} />
      </motion.button>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'report' | 'flow' | 'users'>(
    (localStorage.getItem('lastActiveTab') as any) || 'dashboard'
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    localStorage.getItem('lastSelectedCaseId')
  );
  const [cases, setCases] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  
  // Filtering States
  const [filterStatus, setFilterStatus] = useState<string>('alla');
  const [filterSchool, setFilterSchool] = useState<string>('alla');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [caseQuestions, setCaseQuestions] = useState<string[]>([]);

  const handleDeleteCase = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    try {
      await caseService.deleteCase(caseId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Error deleting case:", err);
      setConfirmDeleteId(null);
      // We'll show the error in the console or maybe a fleeting toast if needed
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    if (dateValue.toDate) return dateValue.toDate().toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
    if (typeof dateValue.seconds === 'number') return new Date(dateValue.seconds * 1000).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
  };

  const handleBankIDLogin = async (pnr: string) => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('personalNumber', '==', pnr));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserProfile;
        
        if (userData.isActive === false) {
          setAuthError('Ditt konto har avaktiverats. Kontakta en administratör vid frågor.');
          return;
        }

        // Mock a Firebase user object for the session
        const mockUser = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.name,
          photoURL: null,
          isBankID: true
        } as any;
        
        setUser(mockUser);
        setUserProfile(userData);
        setAuthError(null);
      } else {
        setAuthError('Ingen användare hittades med detta personnummer. Kontakta en administratör.');
      }
    } catch (err) {
      console.error("BankID login error:", err);
      setAuthError('Ett fel uppstod vid BankID-inloggning.');
    } finally {
      setLoading(false);
    }
  };

  // PERSISTENCE LOGIC: Save last state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('lastActiveTab', activeTab);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (user && selectedCaseId) {
      localStorage.setItem('lastSelectedCaseId', selectedCaseId);
    } else if (user && !selectedCaseId) {
      localStorage.removeItem('lastSelectedCaseId');
    }
  }, [selectedCaseId, user]);

  // Security check: Redirect if user lacks permissions for current tab
  useEffect(() => {
    if (userProfile && activeTab === 'users' && userProfile.globalRole !== 'admin' && userProfile.role !== 'admin') {
      setActiveTab('dashboard');
    }
  }, [userProfile, activeTab]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        // Setup a real-time listener for the user profile
        unsubscribeProfile = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            let data = snap.data() as UserProfile;
            
            if (data.isActive === false && !data.migratedTo) {
              await signOut(auth);
              setUser(null);
              setUserProfile(null);
              return;
            }

            // Ensure the primary user becomes admin if they aren't already
            if (user.email === 'christopher.nottberg@gmail.com' && (data.role !== 'admin' || data.globalRole !== 'admin')) {
              await updateDoc(userRef, { role: 'admin', globalRole: 'admin' });
              // Snapshot will trigger again after this update
            } else {
              setUserProfile(data);
              if (data.role === 'admin' || data.globalRole === 'admin') {
                await setupService.seedInitialData();
              }
            }
          } else {
            // Document doesn't exist, check for migration
            const emailQuery = query(collection(db, 'users'), where('email', '==', user.email));
            const emailSnap = await getDocs(emailQuery);
            if (!emailSnap.empty && emailSnap.docs[0].id !== user.uid) {
               const oldDoc = emailSnap.docs[0];
               const oldData = oldDoc.data();
               
               console.log("Migrating provisioned profile for:", user.email);
               await setDoc(userRef, {
                 ...oldData,
                 uid: user.uid,
                 isActive: true,
                 reconciledFrom: oldDoc.id,
                 updatedAt: new Date().toISOString()
               });
               
               await updateDoc(doc(db, 'users', oldDoc.id), {
                  isActive: false,
                  migratedTo: user.uid
               });
               // snapshot listener will catch the new doc
            } else if (emailSnap.empty) {
               // New user
               const isAdminEmail = user.email === 'christopher.nottberg@gmail.com';
               await setDoc(userRef, {
                 uid: user.uid,
                 email: user.email,
                 name: user.displayName,
                 role: isAdminEmail ? 'admin' : 'staff',
                 globalRole: isAdminEmail ? 'admin' : 'none',
                 school: 'Danderyds Skola',
                 isActive: true,
                 createdAt: new Date().toISOString()
               });
            }
          }
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Subscribe to real-time cases
  useEffect(() => {
    if (user && userProfile) {
      // If global admin, we can subscribe to all cases. 
      // Otherwise, we MUST filter to avoid permission-denied errors.
      const filters: any = {};
      
      if (userProfile.globalRole !== 'admin' && userProfile.role !== 'admin') {
        if (userProfile.school) {
          filters.school = userProfile.school;
        } else {
          // If no school and not admin, try only cases reported by or assigned to user
          filters.reporterUid = user.uid;
        }
      }

      const unsubscribe = caseService.subscribeToCases((fetchedCases) => {
        setCases(fetchedCases);
      }, filters);
      return unsubscribe;
    }
  }, [user, userProfile]);

  // Subscribe to notifications for unread count
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'notifications'), 
        where('recipientUid', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        const unreadDocs = docs.filter((d: any) => d.read === false);
        
        setUnreadCount(unreadDocs.length);
        const questions = unreadDocs
          .filter((d: any) => d.type === 'DIRECT_MESSAGE')
          .map((d: any) => d.caseId);
        setCaseQuestions(Array.from(new Set(questions)));
      });
      return unsubscribe;
    }
  }, [user]);

  // SLA REMINDER TRIGGER (Client-side simulation)
  useEffect(() => {
    if (userProfile?.role === 'principal' && user) {
      const checkSLA = async () => {
        const threshold = Date.now() - (48 * 60 * 60 * 1000);
        // Find all cases in 'anmäld' status older than 48h for this school
        const q = query(
          collection(db, 'cases'), 
          where('status', '==', 'anmäld'),
          where('school', '==', userProfile.school)
        );
        
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const data = d.data();
          const createdAt = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : new Date(data.createdAt).getTime();
          
          if (createdAt < threshold) {
            // Check if we already sent an SLA reminder for this case in the last 24h
            const notifCheck = query(
              collection(db, 'notifications'),
              where('caseId', '==', d.id),
              where('type', '==', 'REMINDER'),
              where('recipientUid', '==', user.uid)
            );
            const notifSnap = await getDocs(notifCheck);
            
            if (notifSnap.empty) {
              const template = caseService.getNotificationTemplate('sla_reminder', { 
                caseId: d.id, 
                schoolName: userProfile.school 
              });
              await caseService.sendNotification({
                ...template,
                caseId: d.id,
                recipientUid: user.uid,
                school: userProfile.school
              });
            }
          }
        }
      };
      
      checkSLA();
    }
  }, [userProfile, user]);

  // Fetch schools for filtering
  useEffect(() => {
    if (user) {
      const fetchSchools = async () => {
        const schoolsSnap = await getDocs(query(collection(db, 'schools'), orderBy('name', 'asc')));
        setSchools(schoolsSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      };
      fetchSchools();
    }
  }, [user]);

  // Compute filtered cases
  const filteredCases = React.useMemo(() => {
    const filtered = cases.filter(c => {
      // Status filter
      if (filterStatus !== 'alla' && c.status !== filterStatus) return false;
      
      // School filter
      if (filterSchool !== 'alla' && c.school !== filterSchool) return false;
      
      // Search query filter
      if (filterQuery) {
        const q = filterQuery.toLowerCase();
        const matchesQuery = 
          c.title?.toLowerCase().includes(q) || 
          c.studentName?.toLowerCase().includes(q) || 
          c.id?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      
      // Date range filter
      if (filterDateStart || filterDateEnd) {
        const caseDate = c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000) : null;
        if (!caseDate) return false;
        
        if (filterDateStart) {
          const start = new Date(filterDateStart);
          start.setHours(0, 0, 0, 0);
          if (caseDate < start) return false;
        }
        
        if (filterDateEnd) {
          const end = new Date(filterDateEnd);
          end.setHours(23, 59, 59, 999);
          if (caseDate > end) return false;
        }
      }
      
      return true;
    });

    // Default sort by anmälningsdatum (createdAt) descending
    return [...filtered].sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds : (new Date(a.createdAt).getTime() / 1000 || 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds : (new Date(b.createdAt).getTime() / 1000 || 0);
      return timeB - timeA;
    });
  }, [cases, filterStatus, filterSchool, filterDateStart, filterDateEnd, filterQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-visuera-green/20 border-t-visuera-green rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAnonymous && !user) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-12 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 bg-visuera-green rounded-xl flex items-center justify-center text-white font-bold text-sm px-2">AmO</div>
              <h1 className="text-2xl font-black text-visuera-dark">Agera med Omtanke</h1>
            </div>
            <button 
              onClick={() => setIsAnonymous(false)}
              className="text-xs font-bold text-slate-400 hover:text-visuera-green uppercase tracking-widest flex items-center gap-2"
            >
              Tillbaka till loginvyn <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="bg-white rounded-[40px] p-8 lg:p-12 shadow-xl border border-slate-100">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-black text-visuera-dark tracking-tight">Anonym Snabb-anmälan</h2>
              <p className="text-sm text-slate-500 mt-2">Här kan du anmäla en incident direkt utan att logga in. Din anmälan går direkt till skolans rektor.</p>
            </div>
            <TrygghetsFlow isQuickReport={true} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onQuickReport={() => setIsAnonymous(true)} onBankIDLogin={handleBankIDLogin} />
        {authError && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
            <AlertCircle size={20} />
            <span className="font-bold text-sm text-center">{authError}</span>
            <button onClick={() => setAuthError(null)} className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-all">
              <X size={18} />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-visuera-dark/40 backdrop-blur-sm z-[80] lg:hidden"
              />
              <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-[90] p-8 flex flex-col lg:hidden"
              >
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-visuera-green rounded-[14px] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-visuera-green/20">
                      AmO
                    </div>
                    <span className="text-xl font-extrabold text-visuera-dark tracking-tight">Agera med Omtanke</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-all">
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-2 flex-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'cases', label: 'Alla ärenden', icon: FileSearch },
                    { id: 'report', label: 'Ny anmälan', icon: PlusCircle },
                    { id: 'flow', label: 'Aktiv utredning', icon: Layers },
                    ...(userProfile?.role === 'admin' ? [{ id: 'users', label: 'Användare', icon: Users }] : [])
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        if (item.id === 'report') setSelectedCaseId(null);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        activeTab === item.id 
                          ? 'bg-visuera-green text-white shadow-xl shadow-visuera-green/20' 
                          : 'text-slate-400 hover:bg-slate-50 hover:text-visuera-green'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="font-bold text-sm">{item.label}</span>
                    </button>
                  ))}
                </nav>

                <button 
                  onClick={() => {
                    signOut(auth);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all mt-auto"
                >
                  <LogOut size={20} />
                  <span className="font-bold text-sm">Logga ut</span>
                </button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar (Fixed) */}
        <aside className="hidden md:flex w-20 lg:w-64 bg-white border-r border-slate-100 flex-col items-center lg:items-stretch py-8 px-4 lg:px-6 fixed h-full z-20">
          <div className="flex items-center gap-3 px-2 mb-12">
            <div className="w-10 h-10 bg-visuera-green rounded-[14px] flex items-center justify-center shrink-0 shadow-lg shadow-visuera-green/20">
              <span className="text-white font-bold text-xs">AmO</span>
            </div>
            <span className="text-xl font-extrabold text-visuera-dark tracking-tight hidden lg:block">Agera med Omtanke</span>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'cases', label: 'Alla ärenden', icon: FileSearch },
              { id: 'report', label: 'Ny anmälan', icon: PlusCircle },
              { id: 'flow', label: 'Aktiv utredning', icon: Layers },
              ...(userProfile?.role === 'admin' ? [{ id: 'users', label: 'Användare', icon: Users }] : [])
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (item.id === 'report') setSelectedCaseId(null);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                  activeTab === item.id 
                    ? 'bg-visuera-green text-white shadow-xl shadow-visuera-green/20' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-visuera-green'
                }`}
              >
                <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-bold text-sm hidden lg:block">{item.label}</span>
              </button>
            ))}
          </nav>

          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all mt-auto"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm hidden lg:block">Logga ut</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-0 md:ml-20 lg:ml-64 p-4 sm:p-6 lg:p-12 min-w-0">
          {/* Notification Sidebar / Overlay */}
          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsNotificationsOpen(false)}
                  className="fixed inset-0 bg-visuera-dark/40 backdrop-blur-sm z-[60]"
                />
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[70] border-l border-slate-100"
                >
                  <NotificationInbox 
                    userId={user.uid} 
                    onOpenCase={(id) => {
                      setSelectedCaseId(id);
                      setActiveTab('flow');
                    }}
                    onClose={() => setIsNotificationsOpen(false)}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <header className="flex justify-between items-center mb-8 lg:mb-12">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-visuera-green lg:hidden"
              >
                <Database size={20} />
              </button>
              <div className="hidden lg:flex items-center gap-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Sök ärende..." 
                    className="bg-white border-none rounded-2xl pl-12 pr-6 py-3 w-80 text-sm shadow-sm focus:ring-2 focus:ring-visuera-green/20 transition-all"
                  />
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-all group"
                title="Notifieringar"
              >
                <Bell size={20} className="text-slate-400 group-hover:text-visuera-green transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-[7px] text-white font-black">{unreadCount}</span>
                  </span>
                )}
              </button>

              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-visuera-dark truncate max-w-[150px]">{user.displayName}</div>
                <div className="text-[9px] font-bold text-visuera-green uppercase tracking-widest truncate max-w-[150px]">
                  {userProfile?.globalRole === 'admin' || userProfile?.role === 'admin' ? 'Systemadministratör' : (
                    <>
                      {Object.keys(userProfile?.schoolAccess || {}).length > 1 ? 'Multipel Åtkomst' : (ROLE_LABELS[userProfile?.role || ''] || 'Anmälare')}
                      {' • '}
                      {userProfile?.school || 'Danderyds Skola'}
                    </>
                  )}
                </div>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-12 h-12 rounded-2xl border-2 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
          </header>

          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                onNewReport={() => setActiveTab('report')} 
                cases={cases} 
                onOpenCase={(id) => {
                  setSelectedCaseId(id);
                  setActiveTab('flow');
                }}
                onNavigate={setActiveTab}
                caseQuestions={caseQuestions}
                userProfile={userProfile}
              />
            )}
            {activeTab === 'cases' && (
              <div className="space-y-6">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                     <div>
                        <h2 className="text-xl lg:text-2xl font-black text-visuera-dark tracking-tight">Ärendehantering</h2>
                        <p className="text-[11px] lg:text-sm text-slate-500 mt-1">Här visas alla ärenden på din skola.</p>
                     </div>
                     <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                          <input 
                            type="text" 
                            placeholder="Sök..." 
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs w-full sm:w-48 lg:w-64 focus:ring-2 focus:ring-visuera-green/20 transition-all font-bold"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        </div>
                        <button 
                          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isFilterExpanded || filterStatus !== 'alla' || filterSchool !== 'alla' || filterDateStart || filterDateEnd
                              ? 'bg-visuera-green text-white shadow-lg shadow-visuera-green/20' 
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Filter size={14} />
                          Filter
                        </button>
                     </div>
                  </div>

                  <AnimatePresence>
                    {isFilterExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                            <select 
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 transition-all appearance-none cursor-pointer"
                            >
                              <option value="alla">Alla statusar</option>
                              <option value="anmäld">Inkomna anmälningar</option>
                              <option value="utredning">Under utredning</option>
                              <option value="åtgärder">Under åtgärder</option>
                              <option value="åtgärdad">Åtgärdade (väntar uppföljning)</option>
                              <option value="uppföljd">Uppföljda (väntar avslut)</option>
                              <option value="avslutat">Avslutade ärenden</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Skola</label>
                            <select 
                              value={filterSchool}
                              onChange={(e) => setFilterSchool(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 transition-all appearance-none cursor-pointer"
                            >
                              <option value="alla">Alla skolor</option>
                              {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Från datum</label>
                            <div className="relative">
                              <input 
                                type="date" 
                                value={filterDateStart}
                                onChange={(e) => setFilterDateStart(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 transition-all appearance-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Till datum</label>
                            <input 
                              type="date" 
                              value={filterDateEnd}
                              onChange={(e) => setFilterDateEnd(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 transition-all appearance-none"
                            />
                          </div>

                          <div className="md:col-span-4 flex justify-end gap-2 pt-2">
                             <button 
                               onClick={() => {
                                 setFilterStatus('alla');
                                 setFilterSchool('alla');
                                 setFilterDateStart('');
                                 setFilterDateEnd('');
                                 setFilterQuery('');
                               }}
                               className="text-[10px] font-bold text-slate-400 hover:text-visuera-green uppercase tracking-widest"
                             >
                               Rensa alla
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="grid grid-cols-1 gap-4">
                     {filteredCases.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 italic">Inga ärenden hittades som matchar dina filter.</div>
                     ) : (
                        filteredCases.map(c => (
                        <div 
                          key={c.id} 
                          className="p-4 lg:p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between hover:border-visuera-green/30 transition-all cursor-pointer group gap-4"
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setActiveTab('flow');
                          }}
                        >
                           <div className="flex items-start lg:items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-visuera-green shadow-sm shrink-0">
                                 <FileSearch size={20} />
                              </div>
                              <div className="min-w-0">
                                 <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[9px] font-black bg-white text-slate-400 px-2 py-0.5 rounded uppercase shrink-0">ÄRE-{c.id.slice(-4).toUpperCase()}</span>
                                    <h4 className="font-bold text-visuera-dark group-hover:text-visuera-green transition-colors truncate">{c.title}</h4>
                                    {caseQuestions.includes(c.id) && (
                                       <div className="flex items-center gap-1 text-blue-500" title="Väntande fråga från rektor">
                                         <MessageSquare size={12} />
                                         <span className="text-[8px] font-black uppercase tracking-wider">Fråga</span>
                                       </div>
                                    )}
                                 </div>
                                 <div className="text-[10px] text-slate-400 font-medium mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="flex items-center gap-1"><UserIcon size={12}/> {c.studentName}</span>
                                    <span className="flex items-center gap-1 hidden sm:flex"><Building2 size={12}/> {c.school}</span>
                                    <span className="flex items-center gap-1" title="Anmälningsdatum">
                                       <Calendar size={12}/> {formatDate(c.createdAt)}
                                    </span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center justify-between md:justify-end gap-x-4 lg:gap-x-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                              <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${
                                c.status === 'anmäld' ? 'bg-blue-100 text-blue-600' :
                                c.status === 'utredning' ? 'bg-amber-100 text-amber-600' :
                                c.status === 'avslutat' ? 'bg-slate-100 text-slate-500' :
                                'bg-visuera-green/10 text-visuera-green'
                              }`}>
                                {c.status}
                              </span>
                              <div className="flex items-center gap-4">
                                <button className="text-visuera-green font-bold text-xs uppercase hover:underline">Hantera</button>
                                
                                {userProfile?.role === 'admin' && (
                                  <div className="flex items-center gap-1">
                                    {confirmDeleteId === c.id ? (
                                      <div className="flex items-center bg-red-50 rounded-xl overflow-hidden border border-red-100">
                                        <button 
                                          onClick={(e) => handleDeleteCase(e, c.id)}
                                          className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                                        >
                                          Radera?
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                          className="px-2 py-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                                        className="text-slate-200 hover:text-red-500 transition-colors p-2"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
               </div>
             </div>
           )}
            {activeTab === 'report' && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                   <h1 className="text-3xl font-black text-visuera-dark tracking-tight">Ny anmälan</h1>
                   <p className="text-sm text-slate-500 mt-2">Anmälan ska göras skyndsamt och helst inom 24h</p>
                </div>
                {/* We'll use the Step 1 of TrygghetsFlow as the simplified reporter view */}
                <TrygghetsFlow isQuickReport={true} cases={cases} />
              </div>
            )}
            {activeTab === 'flow' && <TrygghetsFlow initialCaseId={selectedCaseId || undefined} cases={cases} />}
            {activeTab === 'users' && <UserManagement />}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;

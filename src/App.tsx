import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  User as UserIcon,
  Building2,
  Clock,
  Lock,
  Database,
  Layers,
  Settings,
  PlusCircle,
  LogOut,
  LayoutDashboard,
  FileSearch,
  BookOpen,
  Zap,
  AlertCircle,
  Trash2,
  X,
  Smartphone,
  Fingerprint
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { TrygghetsFlow } from './components/TrygghetsFlow';
import { UserManagement } from './components/UserManagement';
import { ErrorBoundary } from './components/ErrorBoundary';
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
  schoolAccess?: Record<string, string[]>;
  authorityAccess?: Record<string, string>;
  createdAt: string;
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

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in DB, if not create
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const isAdminEmail = user.email === 'christopher.nottberg@gmail.com';
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: isAdminEmail ? 'admin' : 'staff', // Assign admin to owner email
          globalRole: isAdminEmail ? 'admin' : 'none',
          school: 'Danderyds Skola',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://picsum.photos/seed/danderyd/1920/1080?blur=10')] bg-cover">
      <div className="absolute inset-0 bg-visuera-green/10 backdrop-blur-[2px]"></div>
      <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-white/50 w-full max-w-xl relative z-10 text-center space-y-8">
        <div className="w-20 h-20 bg-visuera-green rounded-[24px] flex items-center justify-center mx-auto shadow-xl shadow-visuera-green/20">
          <span className="text-white font-bold text-4xl">C</span>
        </div>
        <div>
          <h1 className="text-4xl font-black text-visuera-dark tracking-tight">CRID-Safe</h1>
          <p className="text-slate-500 font-medium mt-2">Trygghetshantering i Danderyds Kommun</p>
        </div>
        
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
              onClick={() => setShowBankID(true)}
              className="w-full py-5 bg-[#003da5] text-white rounded-2xl font-bold text-lg hover:bg-[#002d7a] transition-all shadow-lg shadow-[#003da5]/20 flex items-center justify-center gap-3"
            >
              <Smartphone size={22} />
              Logga in med BankID
            </button>

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
          </div>
        </div>
        
        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
          Genom att använda CRID-Safe godkänner du hantering av personuppgifter enligt GDPR och Danderyds kommuns riktlinjer.
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

const Dashboard = ({ onNewReport, cases, onOpenCase }: { onNewReport: () => void, cases: any[], onOpenCase: (id: string) => void }) => {
  const activeCases = cases.filter(c => c.status !== 'avslutat');
  const closedCases = cases.filter(c => c.status === 'avslutat');
  const recentCases = [...cases].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);

  const getTrend = (label: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthCases = cases.filter(c => {
      const date = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const prevMonthCases = cases.filter(c => {
      const date = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    }).length;

    if (prevMonthCases === 0) return { val: '+100%', up: true };
    const diff = ((currentMonthCases - prevMonthCases) / prevMonthCases) * 100;
    return { 
      val: `${diff > 0 ? '+' : ''}${Math.round(diff)}%`, 
      up: diff >= 0 
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-visuera-green uppercase tracking-widest mb-1">Välkommen tillbaka</p>
          <h1 className="text-3xl font-black text-visuera-dark tracking-tight">Systemöversikt</h1>
        </div>
        <button 
          onClick={onNewReport}
          className="bg-visuera-green text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-visuera-light-green transition-all shadow-lg shadow-visuera-green/10"
        >
          <PlusCircle size={20} />
          Ny Snabb-anmälan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Nya anmälningar', value: cases.filter(c => c.status === 'anmäld').length.toString(), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Pågående utredningar', value: activeCases.length.toString(), icon: FileSearch, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Aktiva åtgärder', value: cases.filter(c => c.status === 'åtgärder').length.toString(), icon: Zap, color: 'text-visuera-green', bg: 'bg-visuera-green/5' },
          { label: 'Avslutade YTD', value: closedCases.length.toString(), icon: CheckCircle2, color: 'text-slate-400', bg: 'bg-slate-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-2`}>
              <stat.icon size={20} />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-black text-visuera-dark">{stat.value}</div>
              {(stat.label === 'Nya anmälningar' || stat.label === 'Pågående utredningar') && (
                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${getTrend(stat.label).up ? 'bg-visuera-green/10 text-visuera-green' : 'bg-red-50 text-red-500'}`}>
                  {getTrend(stat.label).up ? '↑' : '↓'} {getTrend(stat.label).val}
                </div>
              )}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-visuera-dark flex items-center gap-2">
              <Clock size={18} className="text-visuera-green" />
              Aktuella händelser
            </h3>
            <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-visuera-green transition-colors">Se alla</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentCases.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm italic">
                Inga ärenden registrerade än.
              </div>
            ) : (
              recentCases.map((item, i) => (
                <div 
                  key={i} 
                  className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => onOpenCase(item.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded tracking-wider uppercase">ÄRE-{item.id.slice(-4).toUpperCase()}</span>
                      <h4 className="font-bold text-visuera-dark group-hover:text-visuera-green transition-colors">{item.title}</h4>
                      {item.status === 'anmäld' && (Date.now() - (item.createdAt?.seconds * 1000 || Date.now())) > (48 * 60 * 60 * 1000) && (
                        <div className="flex items-center gap-1 text-red-500 animate-pulse" title="SLA Överskriden (>48h utan utredare)">
                          <AlertCircle size={14} />
                          <span className="text-[8px] font-black uppercase">SLA</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${
                      item.status === 'anmäld' ? 'bg-blue-100 text-blue-600' :
                      item.status === 'utredning' ? 'bg-amber-100 text-amber-600' :
                      'bg-visuera-green/10 text-visuera-green'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Building2 size={12}/> {item.school || 'Danderyds Skola'}</span>
                    <span className="flex items-center gap-1"><UserIcon size={12}/> {item.studentName}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {item.incidentDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-visuera-dark rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-visuera-green rounded-lg flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Lagstöd</span>
              </div>
              <h3 className="text-xl font-bold">Skollagen 6 kap.</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Huvudmannen är skyldig att skyndsamt utreda och vidta åtgärder mot kränkande behandling.
              </p>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-bold transition-all">
                Läs mer om kraven
              </button>
            </div>
          </div>
          
          <div className="bg-visuera-green/5 rounded-[32px] p-8 border border-visuera-green/10 space-y-6">
            <div>
              <h4 className="font-bold text-visuera-dark flex items-center gap-2 mb-1">
                <BarChart3 size={18} className="text-visuera-green" />
                Strategisk Analys
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">Baserat på aggregerade data</p>
            </div>

            <div className="space-y-6">
              {/* Hotspots */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Hotspot: Skolgården</span>
                  <span className="text-visuera-green">42%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-visuera-green w-[42%] rounded-full"></div>
                </div>
              </div>

              {/* Lead Times */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Genomsnittlig ledtid</div>
                <div className="flex items-end gap-2">
                  <div className="text-2xl font-black text-visuera-dark">1.8</div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">DAGAR TILL UTREDNING</div>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-visuera-green bg-visuera-green/10 px-2 py-1 rounded-lg w-fit">
                  <ArrowRight size={10} className="-rotate-45" />
                  Minskar med 12% mot föreg mån.
                </div>
              </div>

              {/* Trend */}
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trendanalys</div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  * Just nu syns en ökning av incidenter under raster på förmiddagen. Överväg ökad vuxentäthet vid klätternätet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'report' | 'flow' | 'users'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const handleBankIDLogin = async (pnr: string) => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('personalNumber', '==', pnr));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserProfile;
        
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          // Ensure the primary user becomes admin if they aren't already
          if (user.email === 'christopher.nottberg@gmail.com' && data.role !== 'admin') {
            await updateDoc(userRef, { role: 'admin', globalRole: 'admin' });
            setUserProfile({ ...data, role: 'admin', globalRole: 'admin' });
            // Seed schools on first admin login
            await setupService.seedInitialData();
          } else {
            setUserProfile(data);
            if (data.role === 'admin' || data.globalRole === 'admin') {
               await setupService.seedInitialData();
            }
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Subscribe to real-time cases
  useEffect(() => {
    if (user) {
      const unsubscribe = caseService.subscribeToCases((fetchedCases) => {
        setCases(fetchedCases);
      });
      return unsubscribe;
    }
  }, [user]);

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
              <div className="w-10 h-10 bg-visuera-green rounded-xl flex items-center justify-center text-white font-bold">C</div>
              <h1 className="text-2xl font-black text-visuera-dark">CRID-Safe</h1>
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
      <div className="min-h-screen bg-slate-50 flex">
        {/* Simplified Sidebar */}
        <aside className="w-20 lg:w-64 bg-white border-r border-slate-100 flex flex-col items-center lg:items-stretch py-8 px-4 lg:px-6 fixed h-full z-20">
          <div className="flex items-center gap-3 px-2 mb-12">
            <div className="w-10 h-10 bg-visuera-green rounded-[14px] flex items-center justify-center shrink-0 shadow-lg shadow-visuera-green/20">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-extrabold text-visuera-dark tracking-tight hidden lg:block">CRID-Safe</span>
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
        <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-12">
          <header className="flex justify-between items-center mb-12">
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
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-visuera-dark">{user.displayName}</div>
                <div className="text-[10px] font-bold text-visuera-green uppercase tracking-widest">
                  {userProfile?.globalRole === 'admin' ? 'Systemadministratör' : (
                    <>
                      {Object.keys(userProfile?.schoolAccess || {}).length > 1 ? 'Multipel Åtkomst' : (ROLE_LABELS[userProfile?.role] || 'Anmälare')}
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
              />
            )}
            {activeTab === 'cases' && (
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                   <div>
                      <h2 className="text-2xl font-black text-visuera-dark tracking-tight">Ärendehantering</h2>
                      <p className="text-sm text-slate-500 mt-1">Här visas alla ärenden på din skola.</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   {cases.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 italic">Inga ärenden hittades.</div>
                   ) : (
                      cases.map(c => (
                        <div key={c.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-visuera-green/30 transition-all cursor-pointer group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-visuera-green shadow-sm">
                                 <FileSearch size={20} />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black bg-white text-slate-400 px-2 py-0.5 rounded uppercase">ÄRE-{c.id.slice(-4).toUpperCase()}</span>
                                    <h4 className="font-bold text-visuera-dark group-hover:text-visuera-green transition-colors">{c.title}</h4>
                                 </div>
                                 <div className="text-[10px] text-slate-400 font-medium mt-1 flex gap-3">
                                    <span>Elev: {c.studentName}</span>
                                    <span>Skola: {c.school}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${
                                c.status === 'anmäld' ? 'bg-blue-100 text-blue-600' :
                                c.status === 'utredning' ? 'bg-amber-100 text-amber-600' :
                                'bg-visuera-green/10 text-visuera-green'
                              }`}>
                                {c.status}
                              </span>
                              <div className="flex items-center gap-4">
                                <button onClick={(e) => { e.stopPropagation(); setActiveTab('flow'); setSelectedCaseId(c.id); }} className="text-visuera-green font-bold text-xs uppercase hover:underline">Öppna</button>
                                
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
                                      className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                      title="Ta bort ärende"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                           </div>
                        </div>
                      ))
                   )}
                </div>
              </div>
            )}
            {activeTab === 'report' && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                   <h1 className="text-3xl font-black text-visuera-dark tracking-tight">Ny Snabb-anmälan</h1>
                   <p className="text-sm text-slate-500 mt-2">Professionell anmälan inom 24h enligt Skollagen.</p>
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

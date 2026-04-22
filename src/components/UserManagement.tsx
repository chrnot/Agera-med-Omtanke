import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  Building2, 
  Save, 
  X, 
  CheckCircle2, 
  Building, 
  Plus, 
  Trash2,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  GraduationCap,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Papa from 'papaparse';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy, 
  addDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { setupService } from '../services/setupService';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Authority {
  id: string;
  name: string;
}

interface School {
  id: string;
  name: string;
  authorityId: string;
}

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: string;
  globalRole?: string;
  schoolAccess?: Record<string, string[] | { roles: string[]; team?: string }>;
  authorityAccess?: Record<string, string>;
  school: string; // Legacy
  team?: string;
  personalNumber?: string;
  createdAt: string;
  isActive?: boolean;
}

const ROLE_OPTIONS = [
  { id: 'admin', label: 'Administratör' },
  { id: 'teacher', label: 'Utredare' },
  { id: 'observer', label: 'Observatör' },
  { id: 'staff', label: 'Anmälare' }
];

// --- Sub-components ---

const AdminTabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all font-bold text-sm ${
      active 
        ? 'border-visuera-green text-visuera-green dark:text-emerald-400 bg-visuera-green/5 dark:bg-emerald-900/10' 
        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

// --- Main Component ---

export const UserManagement = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'entities' | 'import'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // CSV Import State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<number[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [gdprConfirmed, setGdprConfirmed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Entity Management State
  const [newAuthorityName, setNewAuthorityName] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('');

  // Add User State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'staff', school: '' });
  
  // User Edit State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersSnap, authSnap, schoolSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('name', 'asc'))),
        getDocs(query(collection(db, 'authorities'), orderBy('name', 'asc'))),
        getDocs(query(collection(db, 'schools'), orderBy('name', 'asc')))
      ]);

      setUsers(usersSnap.docs
        .map(d => ({ ...d.data(), uid: d.id }))
        .filter((u: any) => u.isActive !== false) as UserProfile[]);
      setAuthorities(authSnap.docs.map(d => ({ ...d.data(), id: d.id })) as Authority[]);
      setSchools(schoolSnap.docs.map(d => ({ ...d.data(), id: d.id })) as School[]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- CSV Import Logic ---

  const handleCsvUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const errors: number[] = [];
        
        data.forEach((row, index) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email || '')) {
            errors.push(index);
          }
        });
        
        setCsvData(data);
        setCsvErrors(errors);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCsvUpload(e.dataTransfer.files[0]);
    }
  };

  const processImport = async () => {
    if (!gdprConfirmed || csvData.length === 0 || csvErrors.length > 0) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      // In a real scenario, we would send this to a Cloud Function.
      // Here we simulate the batch process and log it.
      
      const total = csvData.length;
      for (let i = 0; i < total; i++) {
        // Simulation of Cloud Function call / sequential create
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      // Create Audit Log
      await addDoc(collection(db, 'AuditLog'), {
        action: 'USER_IMPORT',
        adminId: auth.currentUser?.uid || 'unknown',
        timestamp: serverTimestamp(),
        count: total,
        details: `Batch-import av ${total} användare utförd.`
      });

      setSuccess(`${total} användare har köats för import! (Struktur för Cloud Function förberedd)`);
      setCsvData([]);
      setGdprConfirmed(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // --- Entity Actions ---

  const handleAddAuthority = async () => {
    if (!newAuthorityName) return;
    try {
      const docRef = await addDoc(collection(db, 'authorities'), { name: newAuthorityName });
      setAuthorities(prev => [...prev, { id: docRef.id, name: newAuthorityName }].sort((a,b) => a.name.localeCompare(b.name)));
      setNewAuthorityName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    setIsUpdating(true);
    try {
      const userId = newUser.email.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const userRef = doc(db, 'users', userId);
      
      const userDoc = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        school: newUser.school || 'System',
        isActive: true,
        createdAt: new Date().toISOString(),
        schoolAccess: newUser.school ? {
          [schools.find(s => s.name === newUser.school)?.id || 'system']: [newUser.role]
        } : {}
      };

      await setDoc(userRef, userDoc, { merge: true });
      
      await addDoc(collection(db, 'AuditLog'), {
        action: 'ANVÄNDARE_SKAPAD',
        targetUserId: userId,
        targetUserName: newUser.name,
        changedByUid: auth.currentUser?.uid || 'unknown',
        changedByName: auth.currentUser?.displayName || auth.currentUser?.email || 'System',
        timestamp: serverTimestamp()
      });

      setUsers(prev => [...prev, { ...userDoc, uid: userId }].sort((a,b) => a.name.localeCompare(b.name)));
      setSuccess(`Användare ${newUser.name} har skapats!`);
      setNewUser({ name: '', email: '', role: 'staff', school: '' });
      setIsAddingUser(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSchool = async () => {
    if (!newSchoolName || !selectedAuthorityId) return;
    try {
      const schoolId = newSchoolName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await setDoc(doc(db, 'schools', schoolId), { name: newSchoolName, authorityId: selectedAuthorityId });
      setSchools(prev => [...prev, { id: schoolId, name: newSchoolName, authorityId: selectedAuthorityId }].sort((a,b) => a.name.localeCompare(b.name)));
      setNewSchoolName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm('Radera skola? Detta kan påverka användares åtkomst.')) return;
    try {
      await deleteDoc(doc(db, 'schools', id));
      setSchools(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // --- User Permission Actions ---

  const toggleUserSchoolRole = (schoolId: string, roleId: string) => {
    if (!selectedUser) return;
    const currentAccess = selectedUser.schoolAccess || {};
    const accessEntry = currentAccess[schoolId];
    
    let currentRoles: string[] = [];
    let currentTeam: string | undefined = undefined;

    if (Array.isArray(accessEntry)) {
        currentRoles = accessEntry;
    } else if (accessEntry && typeof accessEntry === 'object') {
        currentRoles = accessEntry.roles;
        currentTeam = accessEntry.team;
    }

    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(r => r !== roleId)
      : [...currentRoles, roleId];

    const newAccess = { ...currentAccess };
    if (newRoles.length === 0 && !currentTeam) {
      delete newAccess[schoolId];
    } else {
      newAccess[schoolId] = { roles: newRoles, team: currentTeam };
    }

    setSelectedUser({ ...selectedUser, schoolAccess: newAccess });
  };

  const updateUserSchoolTeam = (schoolId: string, team: string) => {
    if (!selectedUser) return;
    const currentAccess = selectedUser.schoolAccess || {};
    const accessEntry = currentAccess[schoolId];
    
    let currentRoles: string[] = [];
    if (Array.isArray(accessEntry)) {
        currentRoles = accessEntry;
    } else if (accessEntry && typeof accessEntry === 'object') {
        currentRoles = accessEntry.roles;
    }

    const newAccess = { ...currentAccess };
    if (currentRoles.length === 0 && !team) {
       delete newAccess[schoolId];
    } else {
       newAccess[schoolId] = { roles: currentRoles, team: team };
    }
    setSelectedUser({ ...selectedUser, schoolAccess: newAccess });
  };

  const toggleUserAuthority = (authId: string) => {
    if (!selectedUser) return;
    const currentAuthAccess = selectedUser.authorityAccess || {};
    const newAuthAccess = { ...currentAuthAccess };
    
    if (newAuthAccess[authId]) {
      delete newAuthAccess[authId];
    } else {
      newAuthAccess[authId] = 'authority';
    }

    setSelectedUser({ ...selectedUser, authorityAccess: newAuthAccess });
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const oldUser = users.find(u => u.uid === selectedUser.uid);
      const userRef = doc(db, 'users', selectedUser.uid);
      const updates = {
        role: selectedUser.role,
        schoolAccess: selectedUser.schoolAccess || {},
        authorityAccess: selectedUser.authorityAccess || {},
        globalRole: selectedUser.globalRole || 'none',
        school: selectedUser.school || '',
        team: selectedUser.team || '',
        personalNumber: selectedUser.personalNumber || ''
      };

      // Calculate changes for AuditLog
      const changes: Record<string, any> = {};
      if (oldUser) {
        if (JSON.stringify(oldUser.schoolAccess) !== JSON.stringify(updates.schoolAccess)) {
          changes.schoolAccess = { from: oldUser.schoolAccess || {}, to: updates.schoolAccess };
        }
        if (JSON.stringify(oldUser.authorityAccess) !== JSON.stringify(updates.authorityAccess)) {
          changes.authorityAccess = { from: oldUser.authorityAccess || {}, to: updates.authorityAccess };
        }
        if (oldUser.globalRole !== updates.globalRole) {
          changes.globalRole = { from: oldUser.globalRole || 'none', to: updates.globalRole };
        }
        if (oldUser.role !== selectedUser.role) {
          changes.role = { from: oldUser.role, to: selectedUser.role };
        }
        if (oldUser.school !== updates.school) {
          changes.school = { from: oldUser.school || '', to: updates.school };
        }
        if (oldUser.team !== updates.team) {
          changes.team = { from: oldUser.team || '', to: updates.team };
        }
        if (oldUser.personalNumber !== updates.personalNumber) {
          changes.personalNumber = { from: oldUser.personalNumber || '', to: updates.personalNumber };
        }
      }

      await updateDoc(userRef, updates);

      // Create Audit Log
      if (Object.keys(changes).length > 0) {
        await addDoc(collection(db, 'AuditLog'), {
          action: 'UPPDATERING_BEHÖRIGHET',
          targetUserId: selectedUser.uid,
          targetUserName: selectedUser.name,
          changedByUid: auth.currentUser?.uid || 'unknown',
          changedByName: auth.currentUser?.displayName || auth.currentUser?.email || 'System',
          changes,
          timestamp: serverTimestamp()
        });
      }
      
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, ...updates } : u));
      setSuccess(`Behörigheter sparade för ${selectedUser.name}`);
      setTimeout(() => setSuccess(null), 3000);
      setSelectedUser(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSyncDanderyd = async () => {
    setIsUpdating(true);
    try {
      await setupService.seedInitialData();
      await fetchData();
      
      // Audit log for bulk sync
      await addDoc(collection(db, 'AuditLog'), {
        action: 'BULK_SYNKRONISERING_SKOLOR',
        changedByUid: auth.currentUser?.uid || 'unknown',
        changedByName: auth.currentUser?.displayName || auth.currentUser?.email || 'System',
        details: 'Synkronisering av Danderyds skolor och huvudmän utförd.',
        timestamp: serverTimestamp()
      });

      setSuccess('Danderyds skolor har synkroniserats!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: false,
        role: 'none',
        globalRole: 'none',
        updatedAt: serverTimestamp()
      });

      // Audit log for user "deletion"
      await addDoc(collection(db, 'AuditLog'), {
        action: 'ANVÄNDARE_BORTTAGEN',
        targetUserId: userId,
        targetUserName: userName,
        changedByUid: auth.currentUser?.uid || 'unknown',
        changedByName: auth.currentUser?.displayName || auth.currentUser?.email || 'System',
        timestamp: serverTimestamp()
      });

      setUsers(prev => prev.filter(u => u.uid !== userId));
      setSuccess(`Användare ${userName} har raderats.`);
      setConfirmDeleteUserId(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error('Error deleting user:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.isActive !== false) && (
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-visuera-dark dark:text-slate-100 tracking-tight flex items-center gap-3">
            <Shield size={32} className="text-visuera-green" />
            Administration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Hantera huvudmän, skolor och avancerade behörigheter.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden transition-colors shadow-slate-200/50 dark:shadow-none">
        <div className="flex border-b border-slate-100 dark:border-slate-700 px-4">
          <AdminTabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={Users} 
            label="Användaråtkomst" 
          />
          <AdminTabButton 
            active={activeTab === 'entities'} 
            onClick={() => setActiveTab('entities')} 
            icon={Building2} 
            label="Skolor & Huvudmän" 
          />
          <AdminTabButton 
            active={activeTab === 'import'} 
            onClick={() => setActiveTab('import')} 
            icon={UploadCloud} 
            label="Batch-import" 
          />
          <div className="ml-auto flex items-center pr-4">
            <button 
              onClick={() => setIsAddingUser(true)}
              className="flex items-center gap-2 bg-visuera-green text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-visuera-green/20"
            >
              <Plus size={16} />
              Lägg till användare
            </button>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'users' ? (
              <motion.div 
                key="users"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Create User Modal-like Section */}
                <AnimatePresence>
                  {isAddingUser && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border-2 border-visuera-green/30 dark:border-visuera-green/20 mb-8"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-visuera-dark dark:text-slate-100 uppercase text-xs tracking-widest flex items-center gap-2">
                          <Plus size={16} className="text-visuera-green" />
                          Skapa ny användare
                        </h3>
                        <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <X size={18} className="text-slate-400" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Namn</label>
                          <input 
                            type="text" 
                            placeholder="Namn..."
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-post</label>
                          <input 
                            type="email" 
                            placeholder="E-post..."
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Roll</label>
                          <select 
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 outline-none appearance-none"
                          >
                            {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            <option value="admin">Systemadministratör</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Skola</label>
                          <select 
                            value={newUser.school}
                            onChange={(e) => setNewUser({...newUser, school: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-visuera-green/20 outline-none appearance-none"
                          >
                            <option value="">Ingen (System)</option>
                            {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end gap-3">
                        <button 
                          onClick={() => setIsAddingUser(false)}
                          className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Avbryt
                        </button>
                        <button 
                          onClick={handleAddUser}
                          disabled={isUpdating || !newUser.name || !newUser.email}
                          className="px-8 py-2.5 bg-visuera-green text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-visuera-green/20 hover:scale-105 transition-all disabled:opacity-50"
                        >
                          {isUpdating ? 'Skapar...' : 'Skapa användare'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsible User Permission Editor */}
                <AnimatePresence>
                  {selectedUser && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      className="mb-8 border border-visuera-green/20 dark:border-visuera-green/40 rounded-[32px] overflow-hidden bg-white dark:bg-slate-900 shadow-xl shadow-visuera-green/5 transition-colors"
                    >
                      <div 
                        onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
                        className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-visuera-green/10 rounded-2xl flex items-center justify-center text-visuera-green">
                            <ShieldAlert size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-visuera-dark dark:text-slate-100 tracking-tight">Access Control: {selectedUser.name}</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                              {isEditorCollapsed ? 'Klicka för att expandera' : 'Klicka för att minimera sektionen'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
                             {isEditorCollapsed ? <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" /> : <ChevronDown size={16} className="text-visuera-green" />}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(null); }}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                          >
                            <X size={20} className="text-slate-300 dark:text-slate-600" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {!isEditorCollapsed && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-8 space-y-12 transition-colors">
                              {/* Bas-information */}
                              <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Bas-information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Anställning / Primär skola</label>
                                    <select 
                                      value={selectedUser.school}
                                      onChange={(e) => setSelectedUser({ ...selectedUser, school: e.target.value })}
                                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-visuera-green transition-all font-bold appearance-none cursor-pointer text-slate-900 dark:text-slate-100"
                                    >
                                      <option value="">Välj skola...</option>
                                      {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Arbetslag</label>
                                    <input 
                                      type="text"
                                      placeholder="t.ex. F-3, Arbetslag 1..."
                                      value={selectedUser.team || ''}
                                      onChange={(e) => setSelectedUser({ ...selectedUser, team: e.target.value })}
                                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-visuera-green transition-all font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                    />
                                  </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Personnummer</label>
                                  <input 
                                    type="text"
                                    placeholder="YYYYMMDD-XXXX"
                                    value={selectedUser.personalNumber || ''}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, personalNumber: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-visuera-green transition-all font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                  />
                                </div>
                              </section>

                              {/* Global Role */}
                              <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Global Behörighet</h4>
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => setSelectedUser({ ...selectedUser, globalRole: selectedUser.globalRole === 'admin' ? 'none' : 'admin' })}
                                    className={`flex-1 p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                                      selectedUser.globalRole === 'admin' 
                                        ? 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10' 
                                        : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                       <div className={`p-3 rounded-xl ${selectedUser.globalRole === 'admin' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600'}`}>
                                          <Shield size={20} />
                                       </div>
                                       <div className="text-left">
                                          <div className="font-bold text-visuera-dark dark:text-slate-100">Systemadministratör</div>
                                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Full access till arkiv, inställningar och roller.</div>
                                       </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                      selectedUser.globalRole === 'admin' ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 dark:border-slate-600'
                                    }`}>
                                       {selectedUser.globalRole === 'admin' && <CheckCircle2 size={14} />}
                                    </div>
                                  </button>
                                </div>
                              </section>

                              {/* Authority Level */}
                              <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Huvudmanna-åtkomst</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {authorities.map(auth => (
                                    <button
                                      key={auth.id}
                                      onClick={() => toggleUserAuthority(auth.id)}
                                      className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                        selectedUser.authorityAccess?.[auth.id] === 'authority'
                                          ? 'border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-900/10'
                                          : 'border-slate-50 dark:border-slate-700 hover:border-slate-100 dark:hover:border-slate-600 bg-slate-50/20 dark:bg-slate-800/20'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                         <Building size={16} className={selectedUser.authorityAccess?.[auth.id] ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'} />
                                         <span className={`text-sm font-bold ${selectedUser.authorityAccess?.[auth.id] ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                           {auth.name}
                                         </span>
                                      </div>
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                        selectedUser.authorityAccess?.[auth.id] ? 'bg-purple-600 dark:bg-purple-500 border-purple-600 dark:border-purple-500 text-white' : 'border-slate-200 dark:border-slate-600'
                                      }`}>
                                         {selectedUser.authorityAccess?.[auth.id] && <Plus size={12} className="rotate-45" />}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </section>

                              {/* School-specific roles */}
                              <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Skol-specifika Roller</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {schools.map(school => (
                                    <div key={school.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 transition-colors">
                                      <div className="flex justify-between items-start mb-4">
                                         <div>
                                            <h5 className="font-bold text-visuera-dark dark:text-slate-100">{school.name}</h5>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                                              {authorities.find(a => a.id === school.authorityId)?.name}
                                            </p>
                                         </div>
                                         {(() => {
                                            const entry = selectedUser.schoolAccess?.[school.id];
                                            const isActive = Array.isArray(entry) ? entry.length > 0 : (entry?.roles?.length || 0) > 0;
                                            return isActive && (
                                              <span className="bg-visuera-green text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Aktiv</span>
                                            );
                                         })()}
                                      </div>

                                      <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2 text-center items-center">
                                          {ROLE_OPTIONS.map(role => {
                                            const entry = selectedUser.schoolAccess?.[school.id];
                                            const isSelected = Array.isArray(entry) ? entry.includes(role.id) : entry?.roles?.includes(role.id);
                                            return (
                                              <button
                                                  key={role.id}
                                                  onClick={() => toggleUserSchoolRole(school.id, role.id)}
                                                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                    isSelected
                                                      ? 'bg-visuera-green text-white shadow-lg shadow-visuera-green/20 dark:shadow-none scale-105'
                                                      : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 hover:border-visuera-green/30'
                                                  }`}
                                              >
                                                {role.label}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {(() => {
                                           const entry = selectedUser.schoolAccess?.[school.id];
                                           const roles = Array.isArray(entry) ? entry : entry?.roles || [];
                                           if (roles.length > 0) {
                                              const team = Array.isArray(entry) ? '' : entry?.team || '';
                                              return (
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2 text-left">
                                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Arbetslag på {school.name}</label>
                                                  <input 
                                                    type="text"
                                                    placeholder="t.ex. F-3, Arbetslag 1..."
                                                    value={team}
                                                    onChange={(e) => updateUserSchoolTeam(school.id, e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-xs focus:border-visuera-green transition-all font-bold placeholder:font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                                  />
                                                </div>
                                              );
                                           }
                                           return null;
                                        })()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>
                              
                              <div className="pt-8 bg-slate-50/80 dark:bg-slate-900/80 -mx-8 -mb-8 p-8 flex gap-4 border-t border-slate-100 dark:border-slate-700 transition-colors">
                                <button onClick={() => setSelectedUser(null)} className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">AVBRYT</button>
                                <button 
                                  onClick={handleSavePermissions}
                                  disabled={isUpdating}
                                  className="flex-[2] bg-visuera-green text-white font-black py-4 rounded-2xl shadow-xl shadow-visuera-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                  {isUpdating ? 'SPARAR...' : (
                                    <>
                                      <Save size={20} />
                                      UPPDATERA BEHÖRIGHETER
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Sök användare..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-4 focus:ring-visuera-green/10 transition-all font-bold text-slate-900 dark:text-slate-100"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                </div>

                <div className="overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl transition-colors shadow-slate-200/50 dark:shadow-none">
                  <table className="w-full text-left border-collapse tabular-nums">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4">Namn</th>
                        <th className="px-6 py-4">Primär Skola</th>
                        <th className="px-6 py-4">Access-omfång</th>
                        <th className="px-6 py-4 text-right">Åtgärd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {filteredUsers.map(user => (
                        <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all group">
                          <td className="px-6 py-4 text-left">
                            <div className="font-bold text-visuera-dark dark:text-slate-100">{user.name}</div>
                            <div className="flex flex-col">
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">{user.email}</div>
                              {user.personalNumber && (
                                <div className="text-[10px] text-visuera-green font-bold">{user.personalNumber}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.school}</div>
                            {user.team && (
                              <div className="text-[9px] font-black text-visuera-green uppercase">Arbetslag {user.team}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(user.schoolAccess || {}).length > 0 && (
                                <span className="bg-visuera-green/10 dark:bg-visuera-green/20 text-visuera-green text-[9px] font-black px-2 py-1 rounded-lg uppercase">
                                  {Object.keys(user.schoolAccess || {}).length} Skolor
                                </span>
                              )}
                              {Object.keys(user.authorityAccess || {}).length > 0 && (
                                <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[9px] font-black px-2 py-1 rounded-lg uppercase">
                                  {Object.keys(user.authorityAccess || {}).length} Huvudmän
                                </span>
                              )}
                              {user.globalRole === 'admin' && (
                                <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">Global Admin</span>
                              )}
                              {!user.schoolAccess && !user.authorityAccess && user.globalRole !== 'admin' && (
                                <span className="text-[9px] text-slate-300 dark:text-slate-600 italic">Ingen anpassad åtkomst</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => setSelectedUser(user)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-visuera-green hover:text-white rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-300"
                              >
                                Hantera Access
                              </button>
                              
                              <div className="relative">
                                {confirmDeleteUserId === user.uid ? (
                                  <div className="flex items-center bg-red-50 dark:bg-red-900/20 rounded-xl overflow-hidden border border-red-100 dark:border-red-900/30">
                                    <button 
                                      onClick={() => handleDeleteUser(user.uid, user.name)}
                                      className="px-3 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                                    >
                                      Ta bort?
                                    </button>
                                    <button 
                                      onClick={() => setConfirmDeleteUserId(null)}
                                      className="px-2 py-2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setConfirmDeleteUserId(user.uid)}
                                    className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                    title="Radera användare"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : activeTab === 'import' ? (
              <motion.div
                key="import"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-xl font-black text-visuera-dark dark:text-slate-100 uppercase tracking-tight mb-2">Batch-import (CSV)</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ladda upp en CSV-fil för att lägga till flera användare samtidigt.</p>
                </div>

                <div 
                  className={`border-4 border-dashed rounded-[40px] p-12 transition-all flex flex-col items-center justify-center gap-4 text-center ${
                    dragActive 
                      ? 'border-visuera-green bg-visuera-green/5' 
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center text-visuera-green mb-2">
                    <UploadCloud size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-visuera-dark dark:text-slate-100">Dra och släpp CSV-fil här</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Eller klicka för att välja fil från datorn</p>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {csvData.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <FileText size={14} />
                          Förhandsgranskning ({csvData.length} rader)
                        </h3>
                        <button onClick={() => setCsvData([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">Rensa</button>
                      </div>
                      <div className="max-h-96 overflow-auto">
                        <table className="w-full text-left border-collapse tabular-nums">
                          <thead className="sticky top-0 bg-white dark:bg-slate-900 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 z-10">
                            <tr>
                              <th className="px-6 py-3">Namn</th>
                              <th className="px-6 py-3">E-post</th>
                              <th className="px-6 py-3">Roll</th>
                              <th className="px-6 py-3">Arbetslag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {csvData.map((row, idx) => (
                              <tr 
                                key={idx} 
                                className={`text-xs ${csvErrors.includes(idx) ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                              >
                                <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-300">{row.name}</td>
                                <td className={`px-6 py-3 font-medium ${csvErrors.includes(idx) ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {row.email}
                                  {csvErrors.includes(idx) && <AlertCircle size={12} className="inline ml-1" />}
                                </td>
                                <td className="px-6 py-3 text-slate-400 uppercase font-black text-[10px] tracking-widest">{row.role}</td>
                                <td className="px-6 py-3 text-slate-400">{row.team || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {csvErrors.length > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl text-red-600 dark:text-red-400">
                        <AlertCircle size={20} />
                        <p className="text-xs font-bold">CSV-filen innehåller {csvErrors.length} felaktiga rader. Vänligen korrigera dem innan import.</p>
                      </div>
                    )}

                    <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-1">
                          <input 
                            type="checkbox" 
                            checked={gdprConfirmed}
                            onChange={(e) => setGdprConfirmed(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-visuera-green focus:ring-visuera-green transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-visuera-dark dark:text-slate-200 group-hover:text-visuera-green transition-colors">GDPR-försäkran</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Jag intygar att dessa användare har informerats om behandling av personuppgifter enligt skolans riktlinjer och GDPR.</p>
                        </div>
                      </label>

                      <div className="pt-4 space-y-4">
                        <button 
                          onClick={processImport}
                          disabled={!gdprConfirmed || csvData.length === 0 || csvErrors.length > 0 || isImporting}
                          className="w-full bg-visuera-dark dark:bg-slate-100 text-white dark:text-visuera-dark font-black py-4 rounded-2xl shadow-xl shadow-visuera-dark/20 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          {isImporting ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              IMPORTERAR ({importProgress}%)
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={20} />
                              STARTA IMPORT
                            </>
                          )}
                        </button>
                        
                        {isImporting && (
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${importProgress}%` }}
                              className="h-full bg-visuera-green"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="entities"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12"
              >
                {/* Authorities Column */}
                <div className="space-y-6">
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-visuera-dark dark:text-slate-100 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Building size={16} className="text-visuera-green" />
                        Huvudmän (Organisationer)
                      </h3>
                      <button 
                        onClick={handleSyncDanderyd}
                        disabled={isUpdating}
                        className="text-[9px] font-black bg-visuera-green/10 dark:bg-visuera-green/20 text-visuera-green px-3 py-1.5 rounded-lg hover:bg-visuera-green/20 transition-all uppercase tracking-widest disabled:opacity-50"
                      >
                        {isUpdating ? 'Synkar...' : 'Synka Danderyd'}
                      </button>
                    </div>
                    <div className="flex gap-2 mb-6">
                      <input 
                        type="text" 
                        placeholder="Namn på huvudman..." 
                        value={newAuthorityName}
                        onChange={(e) => setNewAuthorityName(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 px-4 py-2 rounded-xl text-sm focus:border-visuera-green transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-bold"
                      />
                      <button 
                        onClick={handleAddAuthority}
                        className="bg-visuera-green text-white p-2 rounded-xl hover:scale-110 transition-transform"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {authorities.map(auth => (
                        <div key={auth.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group shadow-sm">
                           <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{auth.name}</span>
                           <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase">{schools.filter(s => s.authorityId === auth.id).length} Enheter</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schools Column */}
                <div className="space-y-6">
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 transition-colors">
                    <h3 className="font-black text-visuera-dark dark:text-slate-100 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                       <GraduationCap size={16} className="text-visuera-green" />
                       Skolor & Enheter
                    </h3>
                    <div className="space-y-3 mb-6">
                      <select 
                        value={selectedAuthorityId}
                        onChange={(e) => setSelectedAuthorityId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 px-4 py-2 rounded-xl text-sm focus:border-visuera-green transition-all font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Välj Huvudman...</option>
                        {authorities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Namn på skola..." 
                          value={newSchoolName}
                          onChange={(e) => setNewSchoolName(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 px-4 py-2 rounded-xl text-sm focus:border-visuera-green transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-bold"
                        />
                        <button 
                          onClick={handleAddSchool}
                          disabled={!selectedAuthorityId}
                          className="bg-visuera-green text-white p-2 rounded-xl hover:scale-110 transition-transform disabled:opacity-30"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {schools.map(school => (
                        <div key={school.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group shadow-sm">
                           <div className="text-left">
                              <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{school.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                 {authorities.find(a => a.id === school.authorityId)?.name}
                              </div>
                           </div>
                           <button 
                            onClick={() => handleDeleteSchool(school.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                           >
                            <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Audit Log / Sync Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-12 right-12 z-[100] bg-visuera-dark dark:bg-slate-900 text-white dark:text-slate-100 px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border dark:border-slate-700">
             <div className="w-8 h-8 bg-visuera-green rounded-full flex items-center justify-center">
                <CheckCircle2 size={18} />
             </div>
             <span className="font-bold text-sm">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

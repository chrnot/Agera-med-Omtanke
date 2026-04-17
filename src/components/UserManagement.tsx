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
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  schoolAccess?: Record<string, string[]>;
  authorityAccess?: Record<string, string>;
  school: string; // Legacy
  team?: string;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { id: 'staff', label: 'Anmälare' },
  { id: 'teacher', label: 'Utredare' },
  { id: 'principal', label: 'Rektor' }
];

// --- Sub-components ---

const AdminTabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all font-bold text-sm ${
      active 
        ? 'border-visuera-green text-visuera-green bg-visuera-green/5' 
        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

// --- Main Component ---

export const UserManagement = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'entities'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Entity Management State
  const [newAuthorityName, setNewAuthorityName] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('');
  
  // User Edit State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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

      setUsers(usersSnap.docs.map(d => ({ ...d.data(), uid: d.id })) as UserProfile[]);
      setAuthorities(authSnap.docs.map(d => ({ ...d.data(), id: d.id })) as Authority[]);
      setSchools(schoolSnap.docs.map(d => ({ ...d.data(), id: d.id })) as School[]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
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

  const toggleUserSchoolRole = (schoolId: string, role: string) => {
    if (!selectedUser) return;
    const currentAccess = selectedUser.schoolAccess || {};
    const schoolRoles = currentAccess[schoolId] || [];
    
    let newRoles;
    if (schoolRoles.includes(role)) {
      newRoles = schoolRoles.filter(r => r !== role);
    } else {
      newRoles = [...schoolRoles, role];
    }

    const newAccess = { ...currentAccess };
    if (newRoles.length === 0) {
      delete newAccess[schoolId];
    } else {
      newAccess[schoolId] = newRoles;
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
      const userRef = doc(db, 'users', selectedUser.uid);
      const updates = {
        schoolAccess: selectedUser.schoolAccess || {},
        authorityAccess: selectedUser.authorityAccess || {},
        globalRole: selectedUser.globalRole || 'none',
        school: selectedUser.school || '',
        team: selectedUser.team || ''
      };
      await updateDoc(userRef, updates);
      
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
      setSuccess('Danderyds skolor har synkroniserats!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProvisionStaff = async () => {
    setIsUpdating(true);
    try {
      await setupService.provisionEnebybergStaff();
      await fetchData();
      setSuccess('Personal för Enebyberg har importerats!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-visuera-dark tracking-tight flex items-center gap-3">
            <Shield size={32} className="text-visuera-green" />
            Administration
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Hantera huvudmän, skolor och avancerade behörigheter.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden shadow-slate-200/50">
        <div className="flex border-b border-slate-100 px-4">
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
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Sök användare..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-4 focus:ring-visuera-green/10 transition-all font-bold"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>

                <div className="overflow-hidden bg-white border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Namn</th>
                        <th className="px-6 py-4">Primär Skola</th>
                        <th className="px-6 py-4">Access-omfång</th>
                        <th className="px-6 py-4 text-right">Åtgärd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map(user => (
                        <tr key={user.uid} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-visuera-dark">{user.name}</div>
                            <div className="text-[10px] text-slate-400">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-500">{user.school}</div>
                            {user.team && (
                              <div className="text-[9px] font-black text-visuera-green uppercase">Arbetslag {user.team}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(user.schoolAccess || {}).length > 0 && (
                                <span className="bg-visuera-green/10 text-visuera-green text-[9px] font-black px-2 py-1 rounded-lg uppercase">
                                  {Object.keys(user.schoolAccess || {}).length} Skolor
                                </span>
                              )}
                              {Object.keys(user.authorityAccess || {}).length > 0 && (
                                <span className="bg-purple-50 text-purple-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase">
                                  {Object.keys(user.authorityAccess || {}).length} Huvudmän
                                </span>
                              )}
                              {user.globalRole === 'admin' && (
                                <span className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">Global Admin</span>
                              )}
                              {!user.schoolAccess && !user.authorityAccess && user.globalRole !== 'admin' && (
                                <span className="text-[9px] text-slate-300 italic">Ingen anpassad åtkomst</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedUser(user)}
                              className="w-full md:w-auto px-4 py-2 bg-slate-100 hover:bg-visuera-green hover:text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Hantera Access
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-visuera-dark uppercase text-xs tracking-widest flex items-center gap-2">
                        <Building size={16} className="text-visuera-green" />
                        Huvudmän (Organisationer)
                      </h3>
                      <button 
                        onClick={handleSyncDanderyd}
                        disabled={isUpdating}
                        className="text-[9px] font-black bg-visuera-green/10 text-visuera-green px-3 py-1.5 rounded-lg hover:bg-visuera-green/20 transition-all uppercase tracking-widest disabled:opacity-50"
                      >
                        {isUpdating ? 'Synkar...' : 'Synka Danderyd'}
                      </button>
                      <button 
                        onClick={handleProvisionStaff}
                        disabled={isUpdating}
                        className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all uppercase tracking-widest disabled:opacity-50 ml-2"
                      >
                        {isUpdating ? 'Importerar...' : 'Importera Personal (Enebyberg)'}
                      </button>
                    </div>
                    <div className="flex gap-2 mb-6">
                      <input 
                        type="text" 
                        placeholder="Namn på huvudman..." 
                        value={newAuthorityName}
                        onChange={(e) => setNewAuthorityName(e.target.value)}
                        className="flex-1 bg-white border-2 border-slate-100 px-4 py-2 rounded-xl text-sm focus:border-visuera-green transition-all"
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
                        <div key={auth.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center group shadow-sm">
                           <span className="font-bold text-slate-700 text-sm">{auth.name}</span>
                           <span className="text-[9px] font-black text-slate-300 uppercase">{schools.filter(s => s.authorityId === auth.id).length} Enheter</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schools Column */}
                <div className="space-y-6">
                  <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <h3 className="font-black text-visuera-dark uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                       <GraduationCap size={16} className="text-visuera-green" />
                       Skolor & Enheter
                    </h3>
                    <div className="space-y-3 mb-6">
                      <select 
                        value={selectedAuthorityId}
                        onChange={(e) => setSelectedAuthorityId(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 px-4 py-2 rounded-xl text-sm focus:border-visuera-green transition-all font-bold"
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
                          className="flex-1 bg-white border-2 border-slate-100 px-4 py-2 rounded-xl text-sm focus:border-visuera-green transition-all"
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
                        <div key={school.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center group shadow-sm">
                           <div>
                              <div className="font-bold text-slate-700 text-sm">{school.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase">
                                 {authorities.find(a => a.id === school.authorityId)?.name}
                              </div>
                           </div>
                           <button 
                            onClick={() => handleDeleteSchool(school.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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

      {/* Advanced Permission Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-visuera-dark/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-visuera-green/10 rounded-2xl flex items-center justify-center text-visuera-green">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-visuera-dark tracking-tight">Access Control</h3>
                    <p className="text-sm text-slate-500 font-medium">Behörighet för <span className="text-visuera-green">{selectedUser.name}</span></p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                  <X size={24} className="text-slate-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12">
                {/* User Info */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bas-information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Anställning / Primär skola</label>
                      <select 
                        value={selectedUser.school}
                        onChange={(e) => setSelectedUser({ ...selectedUser, school: e.target.value })}
                        className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-visuera-green transition-all font-bold appearance-none cursor-pointer"
                      >
                        <option value="">Välj skola...</option>
                        {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Arbetslag</label>
                      <input 
                        type="text"
                        placeholder="t.ex. F-3, Arbetslag 1..."
                        value={selectedUser.team || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, team: e.target.value })}
                        className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-visuera-green transition-all font-bold"
                      />
                    </div>
                  </div>
                </section>

                {/* Global Role */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Behörighet</h4>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedUser({ ...selectedUser, globalRole: selectedUser.globalRole === 'admin' ? 'none' : 'admin' })}
                      className={`flex-1 p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                        selectedUser.globalRole === 'admin' 
                          ? 'border-red-200 bg-red-50/50' 
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-xl ${selectedUser.globalRole === 'admin' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                            <Shield size={20} />
                         </div>
                         <div className="text-left">
                            <div className="font-bold text-visuera-dark">Systemadministratör</div>
                            <div className="text-[10px] text-slate-500">Full access till arkiv, inställningar och roller.</div>
                         </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedUser.globalRole === 'admin' ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200'
                      }`}>
                         {selectedUser.globalRole === 'admin' && <CheckCircle2 size={14} />}
                      </div>
                    </button>
                  </div>
                </section>

                {/* Authority Level */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Huvudmanna-åtkomst</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {authorities.map(auth => (
                      <button
                        key={auth.id}
                        onClick={() => toggleUserAuthority(auth.id)}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                          selectedUser.authorityAccess?.[auth.id] === 'authority'
                            ? 'border-purple-200 bg-purple-50/30'
                            : 'border-slate-50 hover:border-slate-100 bg-slate-50/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                           <Building size={16} className={selectedUser.authorityAccess?.[auth.id] ? 'text-purple-600' : 'text-slate-300'} />
                           <span className={`text-sm font-bold ${selectedUser.authorityAccess?.[auth.id] ? 'text-purple-600' : 'text-slate-600'}`}>
                             {auth.name}
                           </span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedUser.authorityAccess?.[auth.id] ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-200'
                        }`}>
                           {selectedUser.authorityAccess?.[auth.id] && <Plus size={12} className="rotate-45" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* School-specific roles */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Skol-specifika Roller</h4>
                  <div className="space-y-4">
                    {schools.map(school => (
                      <div key={school.id} className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <h5 className="font-bold text-visuera-dark">{school.name}</h5>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {authorities.find(a => a.id === school.authorityId)?.name}
                              </p>
                           </div>
                           {(selectedUser.schoolAccess?.[school.id]?.length || 0) > 0 && (
                             <span className="bg-visuera-green text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Aktiv</span>
                           )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-center items-center">
                           {ROLE_OPTIONS.map(role => (
                             <button
                                key={role.id}
                                onClick={() => toggleUserSchoolRole(school.id, role.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                  selectedUser.schoolAccess?.[school.id]?.includes(role.id)
                                    ? 'bg-visuera-green text-white shadow-lg shadow-visuera-green/20 scale-105'
                                    : 'bg-white text-slate-400 border border-slate-100 hover:border-visuera-green/30'
                                }`}
                             >
                               {role.label}
                             </button>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex gap-4">
                <button onClick={() => setSelectedUser(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all">AVBRYT</button>
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-12 right-12 z-[100] bg-visuera-dark text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3">
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

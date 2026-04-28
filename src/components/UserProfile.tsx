import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Building2, 
  CheckCircle2, 
  Plus, 
  Save, 
  Loader2,
  Lock,
  Smartphone,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';

interface UserProfileProps {
  user: any;
  profile: any;
  onClose?: () => void;
}

export const UserProfile = ({ user, profile, onClose }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    team: profile?.team || '',
    emailNotifications: profile?.preferences?.emailNotifications ?? true
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        team: formData.team,
        'preferences.emailNotifications': formData.emailNotifications,
        updatedAt: new Date().toISOString()
      });
      
      setSuccess('Profilen har uppdaterats!');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    'staff': 'Anmälare',
    'teacher': 'Utredare',
    'principal': 'Beslutsfattare (Rektor)',
    'authority': 'Huvudman (Skolchef)',
    'admin': 'Systemadministratör'
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-visuera-dark dark:text-slate-100 tracking-tight">Din Profil</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hantera din identitet och dina inställningar i systemet.</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl font-bold text-xs text-visuera-dark dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            Redigera Profil
          </button>
        ) : (
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-2xl font-bold text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
            >
              Avbryt
            </button>
            <button 
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="flex items-center gap-2 bg-visuera-green text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-visuera-light-green transition-all shadow-lg shadow-visuera-green/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Spara Ändringar
            </button>
          </div>
        )}
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-3"
        >
          <CheckCircle2 size={18} />
          {success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 border border-slate-100 dark:border-slate-700 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-visuera-green/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            
            <div className="relative inline-block mb-6">
              <img 
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${formData.name}&size=128&background=10b981&color=fff`} 
                alt={formData.name} 
                className="w-32 h-32 rounded-[40px] border-4 border-white dark:border-slate-700 shadow-2xl relative z-10 mx-auto"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800 z-20" title="Verifierad identitet">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-visuera-dark dark:text-slate-100">{formData.name}</h3>
              <p className="text-xs font-bold text-visuera-green uppercase tracking-widest">
                {profile?.role === 'admin' ? 'Systemadministratör' : ROLE_LABELS[profile?.role || ''] || 'Användare'}
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-700 space-y-4">
               <div className="flex items-center justify-between text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inloggad via</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                     <Smartphone size={14} className="text-visuera-green" /> BankID / Google
                  </div>
               </div>
               <div className="flex items-center justify-between text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medlem sedan</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('sv-SE') : 'N/A'}
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-visuera-dark p-8 rounded-[40px] text-white space-y-6 shadow-xl shadow-visuera-dark/20 border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
             <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-visuera-green">
                   <Shield size={20} />
                </div>
                <div>
                   <h4 className="font-black text-sm uppercase tracking-widest">Säkerhetsnivå</h4>
                   <p className="text-[10px] text-white/40 font-bold uppercase">Högsta behörighet tillämpas</p>
                </div>
             </div>
             <p className="text-xs text-white/60 leading-relaxed italic">
               Din profil är kopplad till din officiella identitet i Danderyds Kommun. Ändringar i grunddata kan kräva administrativt godkännande.
             </p>
          </div>
        </div>

        {/* Settings & Info */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-800 rounded-[40px] p-8 lg:p-12 border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <UserIcon size={14} className="text-visuera-green" /> Grunduppgifter
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fullständigt Namn</label>
                  <input 
                    type="text"
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-visuera-green/20 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-postadress</label>
                  <input 
                    type="email"
                    disabled={true}
                    value={user?.email || ''}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none opacity-50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Skola / Enhet</label>
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3 opacity-70">
                    <Building2 size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{profile?.school || 'Ej tilldelad'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Arbetslag / Team</label>
                  <input 
                    type="text"
                    disabled={!isEditing}
                    placeholder="T.ex. Arbetslag 4-6..."
                    value={formData.team}
                    onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-visuera-green/20 outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-700 w-full" />

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <Bell size={14} className="text-visuera-green" /> Notisinställningar
              </h3>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-visuera-green shadow-sm">
                    <Mail size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-visuera-dark dark:text-slate-100">E-post-notiser</p>
                    <p className="text-xs text-slate-400">Skicka kopia av alla notiser till din jobbmejl</p>
                  </div>
                </div>
                <button 
                  type="button"
                  disabled={!isEditing}
                  onClick={() => setFormData(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 disabled:opacity-30 ${
                    formData.emailNotifications ? 'bg-visuera-green' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-md ${
                    formData.emailNotifications ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-700 w-full" />

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <Lock size={14} className="text-visuera-green" /> Säkerhet & Inloggning
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl flex items-center gap-3">
                   <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                      <Smartphone size={16} />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">BankID Anslutet</p>
                      <p className="text-[9px] text-emerald-600/70 font-medium">Extra stark autentisering aktiv</p>
                   </div>
                </div>
                <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                      <Smartphone size={16} />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Google Auth</p>
                      <p className="text-[9px] text-blue-600/70 font-medium">christopher.nottberg@gmail.com</p>
                   </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

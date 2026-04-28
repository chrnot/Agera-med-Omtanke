import React, { useState } from 'react';
import { 
  User, 
  ChevronDown, 
  Info, 
  Search, 
  X, 
  ShieldCheck, 
  Users, 
  Trash2,
  Star,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { StepCard } from '../../ui/StepCard';

interface TilldelningStepProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  availableStaff: any[];
  availableTeams: string[];
}

export const TilldelningStep: React.FC<TilldelningStepProps> = ({
  formData,
  updateFormData,
  availableStaff,
  availableTeams
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const investigators = formData.investigators || [];
  const investigatorUids = formData.investigatorUids || [];

  const handleAddInvestigator = (staff: any) => {
    if (investigatorUids.includes(staff.uid)) return;

    const newInvestigator = {
      uid: staff.uid,
      name: staff.name,
      role: investigators.length === 0 ? 'primary' : 'co-investigator',
      assignedAt: new Date().toISOString(),
      team: staff.activeTeam || staff.team || ''
    };

    const newInvestigators = [...investigators, newInvestigator];
    const newUids = [...investigatorUids, staff.uid];

    updateFormData('investigators', newInvestigators);
    updateFormData('investigatorUids', newUids);
    
    // Maintain backward compatibility for single-assignment components
    const primary = newInvestigators.find((i: any) => i.role === 'primary');
    if (primary) {
      updateFormData('assignedTeacher', primary.name);
      updateFormData('assignedTeacherUid', primary.uid);
      updateFormData('assignedToUid', primary.uid);
    }
    
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleRemoveInvestigator = (uid: string) => {
    const newInvestigators = investigators.filter((i: any) => i.uid !== uid);
    const newUids = investigatorUids.filter((id: string) => id !== uid);

    // If we removed the primary, assign the first remaining as primary
    if (newInvestigators.length > 0 && !newInvestigators.some((i: any) => i.role === 'primary')) {
      newInvestigators[0].role = 'primary';
    }

    updateFormData('investigators', newInvestigators);
    updateFormData('investigatorUids', newUids);

    const primary = newInvestigators.find((i: any) => i.role === 'primary');
    if (primary) {
      updateFormData('assignedTeacher', primary.name);
      updateFormData('assignedTeacherUid', primary.uid);
      updateFormData('assignedToUid', primary.uid);
    } else {
      updateFormData('assignedTeacher', '');
      updateFormData('assignedTeacherUid', '');
      updateFormData('assignedToUid', '');
    }
  };

  const handleTogglePrimary = (uid: string) => {
    const newInvestigators = investigators.map((i: any) => ({
      ...i,
      role: i.uid === uid ? 'primary' : 'co-investigator'
    }));
    
    updateFormData('investigators', newInvestigators);
    
    const primary = newInvestigators.find((i: any) => i.role === 'primary');
    if (primary) {
      updateFormData('assignedTeacher', primary.name);
      updateFormData('assignedTeacherUid', primary.uid);
      updateFormData('assignedToUid', primary.uid);
    }
  };

  const filteredStaffForSearch = availableStaff.filter(staff => {
    if (investigatorUids.includes(staff.uid)) return false;
    const search = searchQuery.toLowerCase();
    return (
      staff.name?.toLowerCase().includes(search) ||
      staff.activeTeam?.toLowerCase().includes(search) ||
      staff.role?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StepCard title="Tilldela Utredningsansvar" icon={Users}>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Valda Utredare ({investigators.length})</label>
              <p className="text-[9px] font-bold text-visuera-green uppercase tracking-widest bg-visuera-green/5 px-2 py-0.5 rounded">Flerparts-tilldelning Aktiv</p>
            </div>
            
            {investigators.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ingen utredare tilldelad</p>
                  <p className="text-[10px] text-slate-400">Sök och lägg till personal nedan</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {investigators.map((inv: any) => (
                  <div 
                    key={inv.uid}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:border-visuera-green/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                        inv.role === 'primary' ? 'bg-visuera-green text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {inv.role === 'primary' ? <ShieldCheck size={24} /> : <User size={24} />}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-visuera-dark dark:text-slate-100">{inv.name}</h4>
                          {inv.role === 'primary' && (
                            <span className="text-[8px] font-black bg-visuera-green/10 text-visuera-green px-1.5 py-0.5 rounded uppercase tracking-tighter">Huvudutredare</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{inv.team || 'Inget arbetslag'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {inv.role !== 'primary' && (
                        <button 
                          type="button"
                          onClick={() => handleTogglePrimary(inv.uid)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100"
                        >
                          <Star size={14} /> Gör till huvudutredare
                        </button>
                      )}
                      
                      <button 
                        type="button"
                        onClick={() => handleRemoveInvestigator(inv.uid)}
                        className="p-2.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sök & Lägg till utredare (Samarbeta över arbetslag)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={18} />
              </div>
              <input 
                type="text"
                placeholder="Sök på namn, roll eller arbetslag..."
                value={searchQuery}
                onFocus={() => setShowSearch(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-visuera-green/10 outline-none transition-all placeholder:text-slate-300"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {showSearch && (
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-xl max-h-60 overflow-y-auto no-scrollbar border-t-0 -mt-2 animate-in slide-in-from-top-2 duration-300 relative z-10">
                {filteredStaffForSearch.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold italic">
                    Inga utredare hittades matchande din sökning
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredStaffForSearch.map(staff => (
                      <button
                        key={staff.uid}
                        type="button"
                        onClick={() => handleAddInvestigator(staff)}
                        className="w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-visuera-green group-hover:text-white transition-colors">
                            <User size={16} />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-visuera-dark dark:text-slate-100">{staff.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{staff.activeTeam || staff.team || 'Inget arbetslag'}</p>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-200 group-hover:border-visuera-green group-hover:text-visuera-green">
                           <PlusCircle size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-[32px] border border-emerald-100 dark:border-emerald-900/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-visuera-green text-white flex items-center justify-center shrink-0 shadow-lg shadow-visuera-green/20">
              <Info size={20} />
            </div>
            <div className="space-y-1 pt-1 text-left">
              <h5 className="text-[12px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">Behörighet och Samarbete</h5>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-500/80 leading-relaxed font-medium">
                Alla tilldelade utredare får **samma fulla läs- och skrivrättigheter** i ärendet. Den markerade huvudutredaren bär det formella ansvaret för dokumentationen. Uppdateringar synkroniseras i realtid för alla parter.
              </p>
            </div>
          </div>
        </div>
      </StepCard>
    </div>
  );
};

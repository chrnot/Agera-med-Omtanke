import React, { useState } from 'react';
import { 
  User, 
  Search, 
  X, 
  ShieldCheck, 
  Users, 
  Trash2,
  PlusCircle,
  Info
} from 'lucide-react';
import { StepCard } from '../ui/StepCard';

interface CollaboratorAssignmentProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  availableStaff: any[];
  availableTeams: string[];
  title?: string;
  description?: string;
  roleType?: 'investigator' | 'measure_collaborator';
}

export const CollaboratorAssignment: React.FC<CollaboratorAssignmentProps> = ({
  formData,
  updateFormData,
  availableStaff,
  availableTeams,
  title = "BJUD IN SAMARBETSPARTNERS",
  description = "Lägg till kollegor som ska kunna läsa och skriva i ärendet.",
  roleType = 'investigator'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const investigators = formData.investigators || [];
  const investigatorUids = formData.investigatorUids || [];

  const handleAddCollaborator = (staff: any) => {
    if (investigatorUids.includes(staff.uid)) return;

    const newCollaborator = {
      uid: staff.uid,
      name: staff.name,
      role: 'co-investigator', // Always co-investigator when invited later
      assignedAt: new Date().toISOString(),
      team: staff.activeTeam || staff.team || '',
      invitedType: roleType
    };

    const newInvestigators = [...investigators, newCollaborator];
    const newUids = [...investigatorUids, staff.uid];

    updateFormData('investigators', newInvestigators);
    updateFormData('investigatorUids', newUids);
    
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleRemoveCollaborator = (uid: string) => {
    // Prevent removing the primary investigator if possible, but the UI should handle that
    const collaborator = investigators.find((i: any) => i.uid === uid);
    if (collaborator?.role === 'primary') return;

    const newInvestigators = investigators.filter((i: any) => i.uid !== uid);
    const newUids = investigatorUids.filter((id: string) => id !== uid);

    updateFormData('investigators', newInvestigators);
    updateFormData('investigatorUids', newUids);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{title}</label>
      </div>
      
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={18} />
        </div>
        <input 
          type="text"
          placeholder="Sök namn eller arbetslag för att bjuda in..."
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
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-xl max-h-60 overflow-y-auto no-scrollbar border-t-0 -mt-2 animate-in slide-in-from-top-2 duration-300 relative z-20">
          {filteredStaffForSearch.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold italic">
              Ingen personal hittades
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredStaffForSearch.map(staff => (
                <button
                  key={staff.uid}
                  type="button"
                  onClick={() => handleAddCollaborator(staff)}
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

      {/* List of currently assigned (excluding primary if needed, but showing all is better for context) */}
      <div className="flex flex-wrap gap-2 mt-4">
        {investigators.map((inv: any) => (
          <div 
            key={inv.uid}
            className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all ${
              inv.role === 'primary' 
                ? 'bg-visuera-green/10 border-visuera-green/20 text-visuera-green' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {inv.role === 'primary' ? <ShieldCheck size={12} /> : <User size={12} />}
            {inv.name}
            {inv.role !== 'primary' && (
              <button 
                onClick={() => handleRemoveCollaborator(inv.uid)}
                className="hover:text-red-500 transition-colors ml-1"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-start gap-3">
        <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
          {description} Inbjudna kollegor notifieras och får direkt tillgång till ärendet.
        </p>
      </div>
    </div>
  );
};

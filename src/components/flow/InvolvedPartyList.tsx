import React from 'react';
import { User, Users, Trash2, PlusCircle, AlertCircle, ChevronDown } from 'lucide-react';

interface InvolvedParty {
  id: string;
  name: string;
  role: 'Utsatt' | 'Utövare' | 'Vittne';
  type: 'Elev' | 'Vuxen';
  class?: string;
}

interface InvolvedPartyListProps {
  parties: InvolvedParty[];
  onChange: (parties: InvolvedParty[]) => void;
}

export const InvolvedPartyList: React.FC<InvolvedPartyListProps> = ({ parties, onChange }) => {
  const addParty = () => {
    const newParty: InvolvedParty = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      role: 'Utsatt',
      type: 'Elev',
      class: ''
    };
    onChange([...parties, newParty]);
  };

  const removeParty = (id: string) => {
    onChange(parties.filter(p => p.id !== id));
  };

  const updateParty = (id: string, field: keyof InvolvedParty, value: string) => {
    onChange(parties.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inblandade personer *</label>
        <button 
          onClick={addParty}
          className="flex items-center gap-2 px-5 py-2.5 bg-visuera-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-visuera-green/90 transition-all shadow-lg shadow-visuera-green/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Lägg till person
        </button>
      </div>

      {parties.length === 0 ? (
        <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-300">
            <Users size={24} />
          </div>
          <p className="text-xs font-bold text-slate-400">Inga personer tillagda än.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {parties.map((party) => (
            <div 
              key={party.id}
              className="group bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-4 items-start lg:items-center"
            >
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-1.5 md:col-span-6">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input 
                      type="text"
                      placeholder="Namn..."
                      value={party.name}
                      onChange={(e) => updateParty(party.id, 'name', e.target.value)}
                      className="w-full pl-9 p-2.5 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-visuera-green/20 text-xs font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <div className="relative">
                    <select 
                      value={party.role}
                      onChange={(e) => updateParty(party.id, 'role', e.target.value as any)}
                      className="w-full p-2.5 pr-8 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-visuera-green/20 text-[10px] font-black uppercase tracking-wider text-slate-600 appearance-none cursor-pointer"
                    >
                      <option value="Utsatt">Utsatt</option>
                      <option value="Utövare">Utövare</option>
                      <option value="Vittne">Vittne</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <div className="relative">
                    <select 
                      value={party.type}
                      onChange={(e) => updateParty(party.id, 'type', e.target.value as any)}
                      className="w-full p-2.5 pr-8 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-visuera-green/20 text-[10px] font-black uppercase tracking-wider text-slate-600 appearance-none cursor-pointer"
                    >
                      <option value="Elev">Elev</option>
                      <option value="Vuxen">Vuxen</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                {party.type === 'Elev' && (
                  <div className="w-full lg:w-24">
                    <input 
                      type="text"
                      placeholder="Klass..."
                      value={party.class || ''}
                      onChange={(e) => updateParty(party.id, 'class', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-visuera-green/20 text-xs font-bold text-slate-700"
                    />
                  </div>
                )}

                <button 
                  onClick={() => removeParty(party.id)}
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-auto lg:ml-0"
                  title="Ta bort person"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {parties.length > 0 && parties.filter(p => !p.name.trim()).length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-100/50">
          <AlertCircle size={14} className="text-amber-500" />
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Fyll i namn på alla inblandade</p>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Building2, Calendar, MapPin, Zap, Mail, ChevronDown, Layers, Users } from 'lucide-react';
import { StepCard } from '../../ui/StepCard';
import { InfoPopover } from '../../ui/InfoPopover';
import { LEGAL_HELP_TEXTS } from '../../../constants/guidanceContent';
import { InvolvedPartyList } from '../InvolvedPartyList';

interface AnmalanStepProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  authorities: any[];
  availableSchools: any[];
  selectedAuthority: string;
  setSelectedAuthority: (val: string) => void;
}

export const AnmalanStep: React.FC<AnmalanStepProps> = ({
  formData,
  updateFormData,
  authorities,
  availableSchools,
  selectedAuthority,
  setSelectedAuthority
}) => {
  return (
    <div className="space-y-8">
      {/* Card 1: Grund */}
      <StepCard title="GRUNDINFORMATION" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Huvudman *</label>
            <div className="relative">
              <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
              <select 
                value={selectedAuthority}
                onChange={(e) => {
                  setSelectedAuthority(e.target.value);
                  updateFormData('school', '');
                  updateFormData('schoolId', '');
                  updateFormData('authorityId', e.target.value);
                }}
                className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm appearance-none cursor-pointer font-medium text-slate-700"
              >
                <option value="">Välj huvudman...</option>
                {authorities.map(auth => (
                  <option key={auth.id} value={auth.id}>{auth.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Skola/Enhet *</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
              <select 
                value={formData.school}
                disabled={!selectedAuthority}
                onChange={(e) => {
                  const school = availableSchools.find(s => s.name === e.target.value);
                  updateFormData('school', e.target.value);
                  if (school) {
                    updateFormData('schoolId', school.id);
                    updateFormData('authorityId', school.authorityId);
                  }
                }}
                className={`w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm appearance-none cursor-pointer font-medium text-slate-700 ${!selectedAuthority ? 'opacity-50 grayscale' : ''}`}
              >
                <option value="">{selectedAuthority ? 'Välj en skola...' : 'Välj huvudman först...'}</option>
                {availableSchools
                  .filter(s => s.authorityId === selectedAuthority)
                  .map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Datum för händelsen *</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="date"
                required
                value={formData.incidentDate}
                onChange={(e) => updateFormData('incidentDate', e.target.value)}
                className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-700"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Plats för händelsen</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <select 
                value={formData.incidentLocation}
                onChange={(e) => updateFormData('incidentLocation', e.target.value)}
                className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm appearance-none cursor-pointer font-medium text-slate-700"
              >
                <option value="">Välj plats...</option>
                <option value="Skolgården">Skolgården</option>
                <option value="Matsalen">Matsalen</option>
                <option value="Korridoren">Korridoren</option>
                <option value="Idrotten">Idrotten</option>
                <option value="Klassrummet">Klassrummet</option>
                <option value="Utanför skolan">Utanför skolan</option>
                <option value="Annan plats">Annan plats</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <InvolvedPartyList 
            parties={formData.involvedParties || []}
            onChange={(parties) => {
              updateFormData('involvedParties', parties);
              // For backward compatibility with dashboard/lists, use the first victim as primary student
              const primary = parties.find(p => p.role === 'Utsatt') || parties[0];
              if (primary) {
                updateFormData('studentName', primary.name);
                updateFormData('studentClass', primary.class || '');
              }
            }}
          />
        </div>
      </StepCard>

      {/* Card 2: Händelsen */}
      <StepCard title="BESKRIV HÄNDELSEN" icon={Zap}>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Händelseförlopp *</label>
              <InfoPopover title="Vägledning" content={LEGAL_HELP_TEXTS.investigation.text} />
            </div>
            <textarea 
              value={formData.incidentDescription}
              onChange={(e) => updateFormData('incidentDescription', e.target.value)}
              placeholder="Beskriv sakligt och kortfattat vad som hände..."
              className="w-full h-40 p-6 bg-slate-50 rounded-3xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none text-sm leading-relaxed text-slate-700 font-medium"
            />
          </div>
        </div>
      </StepCard>

      {/* Card 3: Uppgiftslämnare */}
      <StepCard title="UPPGIFTSLÄMNARE" icon={Mail}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Namn på uppgiftslämnare</label>
            <input 
              type="text"
              value={formData.reporterName}
              onChange={(e) => updateFormData('reporterName', e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-post</label>
            <input 
              type="email"
              value={formData.reporterEmail}
              onChange={(e) => updateFormData('reporterEmail', e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-700"
            />
          </div>
        </div>
      </StepCard>
    </div>
  );
};

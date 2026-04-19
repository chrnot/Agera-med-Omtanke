import React from 'react';
import { User, ChevronDown, Info } from 'lucide-react';
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
  return (
    <div className="space-y-8">
      <StepCard title="Ansvarig Utredare" icon={User}>
        <div className="space-y-8">
          {availableTeams.length > 0 && (
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Välj arbetslag *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableTeams.map(team => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => {
                      updateFormData('assignedTeam', team);
                      updateFormData('assignedTeacher', '');
                      updateFormData('assignedTeacherUid', '');
                      updateFormData('assignedToUid', '');
                    }}
                    className={`p-4 rounded-2xl text-[11px] font-bold transition-all border ${
                      formData.assignedTeam === team
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                        : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Utse ansvarig utredare *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
              <select 
                value={formData.assignedTeacher}
                disabled={availableTeams.length > 0 && !formData.assignedTeam}
                onChange={(e) => {
                  const teacher = availableStaff.find(s => s.name === e.target.value);
                  updateFormData('assignedTeacher', e.target.value);
                  updateFormData('assignedTeacherUid', teacher?.uid || '');
                  updateFormData('assignedToUid', teacher?.uid || '');
                  updateFormData('assignedToName', teacher?.name || '');
                }}
                className={`w-full pl-12 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm appearance-none cursor-pointer font-medium text-slate-700 ${availableTeams.length > 0 && !formData.assignedTeam ? 'opacity-50 grayscale' : ''}`}
              >
                <option value="">{formData.assignedTeam ? 'Välj en lärare...' : 'Välj arbetslag först...'}</option>
                {availableStaff
                  .filter(p => !formData.assignedTeam || p.activeTeam === formData.assignedTeam)
                  .map(teacher => (
                    <option key={teacher.uid} value={teacher.name}>{teacher.name}</option>
                  ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Info size={16} />
          </div>
          <div className="space-y-1 pt-0.5">
            <h5 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Nästa steg</h5>
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              När du går till nästa steg kommer utredaren att meddelas och ärendet låsas för utredningsfasen.
            </p>
          </div>
        </div>
      </StepCard>
    </div>
  );
};

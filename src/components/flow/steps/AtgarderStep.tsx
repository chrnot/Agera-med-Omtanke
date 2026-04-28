import React from 'react';
import { ShieldCheck, Layers, Calendar, User, Info, FileText, Users } from 'lucide-react';
import { StepCard } from '../../ui/StepCard';
import { InfoPopover } from '../../ui/InfoPopover';
import { ACTION_TEMPLATES } from '../../../constants/guidanceContent';
import { CollaboratorAssignment } from '../CollaboratorAssignment';

interface AtgarderStepProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  selectedActivities: string[];
  toggleActivity: (activity: string) => void;
  availableStaff: any[];
  availableTeams: string[];
  userProfile: any;
}

export const AtgarderStep: React.FC<AtgarderStepProps> = ({
  formData,
  updateFormData,
  selectedActivities,
  toggleActivity,
  availableStaff,
  availableTeams,
  userProfile
}) => {
  const isInvestigator = formData.investigatorUids?.includes(userProfile?.uid) || userProfile?.role === 'admin' || userProfile?.role === 'principal';

  return (
    <div className="space-y-8">
      {/* Search/Invite Collaborators Card */}
      {isInvestigator && (
        <StepCard title="SAMARBETE & ÅTGÄRDSANSVAR" icon={Users}>
          <CollaboratorAssignment 
            formData={formData}
            updateFormData={updateFormData}
            availableStaff={availableStaff}
            availableTeams={availableTeams}
            title="BJUD IN TILL ÅTGÄRDSARBETE"
            description="Lägg till kollegor eller medlemmar från arbetslaget för att samskapa åtgärder."
            roleType="measure_collaborator"
          />
        </StepCard>
      )}

      {/* Card 1: Individuellt */}
      <StepCard title="INDIVIDUELLA ÅTGÄRDER" icon={User}>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Beslutade åtgärder *</label>
              <InfoPopover title="Åtgärder" content="Beskriv både stöd till utsatt elev och åtgärder mot den som kränkt." />
            </div>
            <textarea 
              value={formData.actionsText}
              onChange={(e) => updateFormData('actionsText', e.target.value)}
              placeholder="Beskriv stödinsatser och disciplinära åtgärder på individnivå..."
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm leading-relaxed text-slate-700 dark:text-slate-100 font-medium"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Välj från mallar</label>
            <div className="flex flex-wrap gap-2">
              {ACTION_TEMPLATES.individual.map(template => (
                <button
                  key={template}
                  type="button"
                  onClick={() => toggleActivity(template)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                    selectedActivities.includes(template)
                      ? 'bg-visuera-green border-visuera-green text-white shadow-md shadow-visuera-green/10'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-visuera-green/30'
                  }`}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </div>
      </StepCard>

      {/* Card 2: Strukturellt */}
      <StepCard title="STRUKTURELLA ÅTGÄRDER" icon={Layers}>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Miljö & Grupp</label>
              <InfoPopover title="Strukturella insatser" content="Beskriv förändringar i skolmiljön eller gruppstärkande insatser som ska genomföras." />
            </div>
            <textarea 
              value={formData.structuralActions || ''}
              onChange={(e) => updateFormData('structuralActions', e.target.value)}
              placeholder="Beskriv förändringar i den fysiska eller psykosociala miljön..."
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all resize-none text-sm leading-relaxed text-slate-700 dark:text-slate-100 font-medium"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gemensamma insatser</label>
            <div className="flex flex-wrap gap-2">
              {ACTION_TEMPLATES.structural.map(template => (
                <button
                  key={template}
                  type="button"
                  onClick={() => toggleActivity(template)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                    selectedActivities.includes(template)
                      ? 'bg-slate-900 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </div>
      </StepCard>

      {/* Card 3: Uppföljning Datum */}
      <StepCard title="UPPFÖLJNINGSPLAN" icon={Calendar}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ansvarig för uppföljning *</label>
            <input 
              type="text"
              value={formData.followUpResponsible || formData.assignedTeacher || ''}
              onChange={(e) => updateFormData('followUpResponsible', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm font-medium text-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Uppföljningsdatum *</label>
            <input 
              type="date"
              value={formData.followUpScheduled}
              onChange={(e) => updateFormData('followUpScheduled', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none focus:ring-2 focus:ring-visuera-green/20 transition-all text-sm font-medium text-slate-700 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
           <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Dokument & Bilagor</label>
           <div className="mt-3 relative group">
              <div className="w-full h-32 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-visuera-green/30 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                <FileText size={20} className="text-slate-300 dark:text-slate-700 group-hover:text-visuera-green transition-colors" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ladda upp ev. Bilaga</span>
              </div>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
        </div>
      </StepCard>
    </div>
  );
};

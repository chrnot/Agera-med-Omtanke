import React from 'react';
import { ShieldCheck, Layers, Calendar, User, Info, FileText } from 'lucide-react';
import { StepCard } from '../../ui/StepCard';
import { InfoPopover } from '../../ui/InfoPopover';
import { ACTION_TEMPLATES } from '../../../constants/guidanceContent';

interface AtgarderStepProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  selectedActivities: string[];
  toggleActivity: (activity: string) => void;
}

export const AtgarderStep: React.FC<AtgarderStepProps> = ({
  formData,
  updateFormData,
  selectedActivities,
  toggleActivity
}) => {
  return (
    <div className="space-y-8">
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
              className="w-full h-40 p-6 bg-slate-50 rounded-3xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none text-sm leading-relaxed text-slate-700 font-medium"
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
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-blue-300'
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Miljö & Grupp *</label>
              <InfoPopover title="Strukturella insatser" content="Beskriv förändringar i skolmiljön eller gruppstärkande insatser som ska genomföras." />
            </div>
            <textarea 
              value={formData.structuralActions || ''}
              onChange={(e) => updateFormData('structuralActions', e.target.value)}
              placeholder="Beskriv förändringar i den fysiska eller psykosociala miljön..."
              className="w-full h-40 p-6 bg-slate-50 rounded-3xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none text-sm leading-relaxed text-slate-700 font-medium"
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
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
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
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Uppföljningsdatum *</label>
            <input 
              type="date"
              value={formData.followUpScheduled}
              onChange={(e) => updateFormData('followUpScheduled', e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-700"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dokument & Bilagor</label>
           <div className="mt-3 relative group">
              <div className="w-full h-32 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-blue-200 transition-colors bg-slate-50/50">
                <FileText size={20} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ladda upp ev. Bilaga</span>
              </div>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
        </div>
      </StepCard>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  status: 'current' | 'upcoming' | 'completed';
}

interface ProgressHeaderProps {
  steps: Step[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({ 
  steps, 
  currentStepIndex,
  onStepClick 
}) => {
  return (
    <div className="w-full bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-slate-200/50">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onStepClick?.(index)}
                disabled={!isCompleted && !isCurrent}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap group ${
                  isCurrent 
                    ? 'bg-visuera-dark text-white shadow-lg shadow-visuera-dark/20' 
                    : isCompleted
                      ? 'bg-visuera-green/10 text-visuera-green hover:bg-visuera-green/20'
                      : 'text-slate-400 opacity-60'
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-colors ${
                  isCurrent 
                    ? 'bg-white text-visuera-dark' 
                    : isCompleted 
                      ? 'bg-visuera-green text-white' 
                      : 'bg-slate-100 text-slate-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 size={14} strokeWidth={3} />
                  ) : (
                    <span className="text-[11px] font-black">{step.id}</span>
                  )}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isCurrent ? 'opacity-100' : 'opacity-80'}`}>
                  {step.title}
                </span>
              </button>
              
              {index < steps.length - 1 && (
                <div className="flex items-center px-1">
                   <ChevronRight size={14} className="text-slate-200" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
          <div className="flex items-center gap-1.5 mt-0.5">
             <div className="w-1.5 h-1.5 bg-visuera-green rounded-full shadow-[0_0_8px_rgba(5,150,105,0.5)]" />
             <span className="text-[11px] font-bold text-visuera-dark">Aktiv redigering</span>
          </div>
        </div>
      </div>
    </div>
  );
};

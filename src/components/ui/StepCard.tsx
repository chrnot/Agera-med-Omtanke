import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StepCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export const StepCard: React.FC<StepCardProps> = ({ title, icon: Icon, children, className = "" }) => {
  return (
    <div className={`bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6 ${className}`}>
      <div className="flex items-center gap-3 pb-2">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <Icon size={16} />
          </div>
        )}
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">{title}</h3>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

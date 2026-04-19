import React from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InfoPopoverProps {
  title?: string;
  content: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({ title, content }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-300 hover:text-blue-500 transition-colors p-0.5 rounded-full"
      >
        <Info size={14} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[100] w-64 p-4 bg-slate-900 text-white rounded-xl shadow-xl text-left left-1/2 -translate-x-1/2 bottom-full mb-3"
          >
            {title && <h5 className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-blue-400">{title}</h5>}
            <p className="text-[11px] leading-relaxed text-slate-200 font-medium">{content}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

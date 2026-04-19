import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, ExternalLink, ChevronRight, Scale } from 'lucide-react';

interface CollapsibleLegalProps {
  title: string;
  text: string;
  bullets?: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export const CollapsibleLegal: React.FC<CollapsibleLegalProps> = ({
  title,
  text,
  bullets,
  isOpen,
  onToggle
}) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          isOpen 
            ? 'bg-visuera-dark text-white' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
        }`}
      >
        <Info size={14} />
        {isOpen ? 'Dölj vägledning' : `Vägledning: ${title}`}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full left-0 mt-3 w-[280px] sm:w-80 bg-[#EBF8FF] border border-blue-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-40"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Scale size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Juridisk Vägledning</span>
              </div>
              <button 
                onClick={onToggle}
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-blue-900 mb-2">{title}</h4>
                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                  {text}
                </p>
              </div>

              {bullets && (
                <ul className="space-y-2">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-blue-800 font-semibold italic">
                      <ChevronRight size={12} className="shrink-0 mt-0.5 text-blue-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-2 flex gap-3">
                <a 
                  href="https://www.skolverket.se" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-black text-blue-600 flex items-center gap-1 hover:underline uppercase tracking-wider"
                >
                  Skolverket <ExternalLink size={10} />
                </a>
                <a 
                  href="https://www.do.se" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-black text-blue-600 flex items-center gap-1 hover:underline uppercase tracking-wider"
                >
                  DO <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

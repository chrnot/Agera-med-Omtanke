import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Scale, ExternalLink, ChevronDown } from 'lucide-react';

interface LegalGuidanceProps {
  incidentTypes: string[];
}

export const LegalGuidance: React.FC<LegalGuidanceProps> = ({ incidentTypes }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // The 7 discrimination grounds + standard bullying
  const discriminationGrounds = [
    'Kön', 
    'Könsöverskridande identitet', 
    'Etnisk tillhörighet', 
    'Religion eller annan trosuppfattning', 
    'Funktionsnedsättning', 
    'Sexuell läggning', 
    'Ålder'
  ];

  const hasDiscrimination = incidentTypes.some(t => discriminationGrounds.includes(t));
  const hasBullying = incidentTypes.includes('Kränkande behandling') || incidentTypes.includes('Annan kränkning');

  if (incidentTypes.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50/50 rounded-3xl border border-blue-100 p-6 space-y-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm shadow-blue-200/50">
          <Info size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
            Juridisk Vägledning
          </h4>
          
          <div className="space-y-4">
            {hasDiscrimination && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-400">
                <div className="flex items-center gap-2 mb-1">
                  <Scale size={12} className="text-blue-600" />
                  <span className="text-[11px] font-black text-blue-800 uppercase tracking-wider">Diskrimineringslagen</span>
                </div>
                <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
                  "När en skola på osakliga grunder behandlar en elev sämre än andra elever och detta har samband med t.ex. kön, könsöverskridande identitet, etnisk tillhörighet, religion, funktionsnedsättning, sexuell läggning eller ålder."
                </p>
              </div>
            )}

            {hasBullying && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-400 border-t border-blue-100/50 pt-3">
                <div className="flex items-center gap-2 mb-1">
                  <Scale size={12} className="text-blue-600" />
                  <span className="text-[11px] font-black text-blue-800 uppercase tracking-wider">Skollagen 6 kap.</span>
                </div>
                <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
                  "Ett uppträdande som kränker ett barns eller en elevs värdighet, men som inte har samband med någon diskrimineringsgrund."
                </p>
              </div>
            )}

            {!hasDiscrimination && !hasBullying && (
               <p className="text-[11px] text-blue-600/60 italic font-medium">
                 Välj kategori ovan för att se juridisk vägledning och definitionsstöd.
               </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-blue-100/50">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:text-blue-800 transition-all px-2 py-1 rounded-lg hover:bg-blue-100/50"
        >
          {isExpanded ? 'Visa färre detaljer' : 'Visa fördjupad information & rättspraxis'}
          <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                <div className="p-5 bg-white/60 rounded-2xl border border-blue-100/50">
                  <p className="text-[11px] text-blue-800 leading-relaxed italic font-medium">
                    Enligt Skolverket och BEO (Barn- och elevombudet) har skolan en absolut utredningsskyldighet vid kännedom. Det spelar ingen roll om kränkningen skett digitalt eller fysiskt – om det påverkar elevens skolgång ska det utredas skyndsamt.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 px-2">
                  <a 
                    href="https://www.skolverket.se/regler-och-ansvar/ansvar-i-skolfragor/krankande-behandling-mobbning-och-diskriminering"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black text-blue-600 flex items-center gap-1.5 hover:text-blue-800 transition-colors uppercase tracking-widest"
                  >
                    Skolverkets vägledning
                    <ExternalLink size={12} />
                  </a>
                  <a 
                    href="https://www.do.se/diskriminering/diskrimineringsgrunder/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black text-blue-600 flex items-center gap-1.5 hover:text-blue-800 transition-colors uppercase tracking-widest"
                  >
                    Diskrimineringsgrunder (DO)
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

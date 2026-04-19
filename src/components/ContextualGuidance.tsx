import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Star, ChevronDown, ExternalLink } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface ContextualGuidanceProps {
  type: 'incident' | 'studentVersion' | 'discrimination' | 'followup';
  onExpand?: () => void;
}

const GUIDANCE_CONTENT = {
  incident: {
    title: 'Beskrivning av händelsen',
    text: 'Beskriv händelsen objektivt. Fokusera på faktiska iakttagelser: Vad hände? Vem sa vad? Kom ihåg: Anmälningsplikten gäller så snart du fått kännedom om en misstänkt kränkning – du behöver inte ha bevis.',
    placeholder: 'Beskriv objektivt vad som hände...',
    moreInfo: 'Rättspraxis visar att skolan inte ska agera domstol. Din uppgift är att säkra informationen så att utredningen kan göras på korrekta grunder.'
  },
  studentVersion: {
    title: 'Elevens version',
    text: 'Dokumentera elevens egna ord. Enligt rättspraxis är det elevens upplevelse av att vara kränkt som styr utredningsskyldigheten.',
    placeholder: 'Elevens egna ord om händelsen...',
    moreInfo: 'BEO betonar vikten av att barnets röst hörs ofiltrerat. Undvik att tolka eller värdera i detta skede.'
  },
  discrimination: {
    title: 'Diskrimineringsgrund',
    text: 'Om händelsen har samband med kön, etnicitet, religion, funktionsnedsättning, sexuell läggning eller ålder, faller den under Diskrimineringslagen. Detta kräver specifika aktiva åtgärder.',
    placeholder: 'Välj relevant grund...',
    moreInfo: 'Vid diskriminering gäller omvänd bevisbörda. Skolan måste kunna visa att diskriminering INTE har förekommit ifall en anmälan görs till DO.'
  },
  followup: {
    title: 'Uppföljning',
    text: 'Har kränkningarna upphört? Utvärderingen måste verifieras genom förnyad kontakt med eleven som upplevde sig kränkt innan ärendet kan avslutas.',
    placeholder: 'Hur har det gått? Har kränkningarna upphört?',
    moreInfo: 'Ett ärende får inte avslutas förrän skolan har säkerställt att åtgärderna haft avsedd effekt och att eleven känner sig trygg.'
  }
};

export const ContextualGuidance: React.FC<ContextualGuidanceProps> = ({ type }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const content = GUIDANCE_CONTENT[type];

  const handleExpand = async () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    if (newState) {
      // Log to AuditLog when user seeks deep legal support
      try {
        await addDoc(collection(db, 'AuditLog'), {
          action: 'LEGAL_SUPPORT_ACCESSED',
          guidanceType: type,
          userId: auth.currentUser?.uid || 'anonymous',
          userName: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown',
          timestamp: serverTimestamp(),
          details: `Användaren öppnade fördjupad vägledning för: ${content.title}`
        });
      } catch (err) {
        console.error("Failed to log legal support access:", err);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0, y: -5 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -5 }}
      className="mt-2 overflow-hidden"
    >
      <div className="bg-[#EBF8FF] rounded-2xl border border-blue-100 p-5 space-y-3 relative overflow-hidden group">
        {/* Danderyd Pattern Background Element */}
        <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <Star size={120} fill="currentColor" className="text-blue-900" />
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-white/80 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <Star size={16} fill="currentColor" className="text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-none">Danderyds-mallen</span>
              <span className="w-1 h-1 bg-blue-200 rounded-full" />
              <span className="text-[10px] font-bold text-blue-600 italic">Vägledning</span>
            </div>
            <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
              {content.text}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={handleExpand}
            className="text-[10px] font-bold text-blue-700/60 hover:text-blue-800 flex items-center gap-1.5 transition-all group/btn"
          >
            <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            {isExpanded ? 'Visa mindre' : 'Se fördjupad information & rättspraxis'}
          </button>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-4 bg-white/50 rounded-xl border border-blue-100/50 space-y-3">
                  <p className="text-[11px] text-blue-800/80 leading-relaxed italic">
                    {content.moreInfo}
                  </p>
                  <div className="flex gap-4">
                    <a href="https://www.skolverket.se" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-blue-600 flex items-center gap-1 hover:underline uppercase tracking-wider">
                      Skolverkets rutin <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

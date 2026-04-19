import { Baby, Users, GraduationCap } from 'lucide-react';
import React from 'react';

export const INCIDENT_CATEGORIES = [
  { id: 'bullying', label: 'Kränkande behandling', color: 'bg-slate-100 text-slate-700' },
  { id: 'sex', label: 'Kön', color: 'bg-pink-100 text-pink-700' },
  { id: 'trans', label: 'Könsöverskridande identitet', color: 'bg-purple-100 text-purple-700' },
  { id: 'ethnicity', label: 'Etnisk tillhörighet', color: 'bg-amber-100 text-amber-700' },
  { id: 'religion', label: 'Religion eller annan trosuppfattning', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'disability', label: 'Funktionsnedsättning', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'orientation', label: 'Sexuell läggning', color: 'bg-blue-100 text-blue-700' },
  { id: 'age', label: 'Ålder', color: 'bg-orange-100 text-orange-700' },
  { id: 'other', label: 'Annan kränkning', color: 'bg-slate-100 text-slate-700' },
];

export const INTERVIEW_TEMPLATES = {
  'F-3': {
    id: 'F-3',
    label: 'Lågstadiet (F–3)',
    purpose: 'Fokus på trygghet och konkreta händelser.',
    questions: [
      "Kan du berätta vad som hände, som om det vore en film?",
      "Vart på skolan var ni? Fanns det någon vuxen i närheten?",
      "Hur kändes det i magen eller kroppen när det hände?",
      "Vad skulle göra att det kändes bättre och tryggare i skolan imorgon?"
    ]
  },
  '4-6': {
    id: '4-6',
    label: 'Mellanstadiet (4–6)',
    purpose: 'Fokus på maktbalans och social kontext.',
    questions: [
      "Beskriv händelseförloppet. Hade det hänt något tidigare under dagen?",
      "Upplever du att du kan säga ifrån, eller känns det svårt? Varför?",
      "Har du pratat med någon hemma eller en kompis om detta?",
      "Vad behöver hända från skolans sida för att du ska känna dig helt trygg igen?"
    ]
  },
  '7-Gy': {
    id: '7-Gy',
    label: 'Högstadiet & Gymnasiet (7–Gy)',
    purpose: 'Fokus på juridik och ansvar.',
    questions: [
      "Upplever du att detta har att göra med t.ex. ditt kön, din bakgrund eller någon annan personlig egenskap?",
      "Hur påverkar detta din skolgång och din studiero?",
      "Vilka åtgärder anser du är rimliga för att stoppa detta beteende permanent?",
      "Finns det något digitalt (sociala medier) kopplat till detta som vi behöver känna till?"
    ]
  }
};

export const LEGAL_HELP_TEXTS = {
  investigation: {
    title: 'Utredningsskyldighet',
    text: 'Utredningen ska utgöra grund för att bedöma om kränkande behandling förekommit. Den ska omfatta både den utsatte och den som utfört handlingen. Syftet är att samla in tillräckligt med information för att kunna bedöma lämpliga åtgärder.',
    bullets: [
      'Fråga alla inblandade parter',
      'Kontrollera sociala medier vid behov',
      'Ta hjälp av elevhälsan vid komplexa fall'
    ]
  },
  actions: {
    title: 'Åtgärdskrav',
    text: 'Åtgärderna ska vara anpassade efter eleven utifrån analysen. Det innebär ofta att åtgärder riktas mot både den utsatte och den som utsätter andra.',
    bullets: [
      'Samtala med elever och vårdnadshavare',
      'Ökad uppsikt på riskfyllda tider/platser',
      'Se över gruppindelningar'
    ]
  },
  assessment: {
    title: 'Bedömning',
    text: 'Skolan måste skaffa sig en egen uppfattning. Det räcker inte att ord står mot ord. Ett tydligt beslut om kränkning skett eller ej måste fattas.',
  }
};

export const INCIDENT_CATEGORIES = [
  { id: 'physical', label: 'Fysisk', description: 'Slag, knuffar, fasthållande, etc.' },
  { id: 'verbal', label: 'Verbal', description: 'Kränkande ord, hot, hån, etc.' },
  { id: 'psychological', label: 'Psykologisk', description: 'Utfrysning, miner, gester, etc.' },
  { id: 'digital', label: 'Nätkränkning', description: 'Sociala medier, SMS, bilder, etc.' },
  { id: 'sexual', label: 'Sexuell', description: 'Kommentarer, beröring, etc.' },
  { id: 'discrimination', label: 'Diskriminering', description: 'Baserat på diskrimineringsgrunder.' }
];

export const LEGAL_HELP_TEXTS = {
  investigation: {
    title: 'Utredningsansvar (Skollagen 6 kap. 10 §)',
    text: 'När en lärare eller annan personal får kännedom om att en elev anser sig ha blivit utsatt för kränkande behandling ska skolan skyndsamt utreda omständigheterna.'
  },
  childVoice: {
    title: 'Elevens rätt att höras',
    text: 'Enligt Barnkonventionen artikel 12 och Skollagen har barnet rätt att uttrycka sina åsikter i alla frågor som rör barnet. Åsikterna ska tillmätas betydelse i förhållande till barnets ålder och mognad.'
  },
  confidentiality: {
    title: 'Sekretess & GDPR',
    text: 'Tänk på att uttrycka dig sakligt och professionellt. Uppgifterna utgör allmänna handlingar men omfattas ofta av sekretess enligt OSL.'
  }
};

export const INTERVIEW_GUIDES = {
  f3: {
    title: 'Samtalsstöd (F-3)',
    questions: [
      'Kan du berätta vad som hände?',
      'Var var ni någonstans?',
      'Fanns det några vuxna i närheten?',
      'Hur kändes det i magen när det hände?',
      'Vad behöver hända nu för att det ska bli bra igen?'
    ]
  },
  middle: {
    title: 'Samtalsstöd (4-6)',
    questions: [
      'Berätta med egna ord om händelsen.',
      'Vilka andra var där och vad gjorde de?',
      'Har det här hänt tidigare eller var det första gången?',
      'Hur mår du nu efter det som hänt?',
      'Finns det något vi på skolan kan göra för att du ska känna dig trygg?'
    ]
  },
  senior: {
    title: 'Samtalsstöd (7-Gy)',
    questions: [
      'Beskriv händelseförloppet så detaljerat du kan.',
      'Hur uppfattade du situationen och stämningen?',
      'Upplever du att detta är en del av ett mönster eller en enskild händelse?',
      'Vilka konsekvenser har detta fått för din skolgång/trygghet?',
      'Vilka åtgärder anser du krävs för att återställa tryggheten?'
    ]
  }
};

export const DISCRIMINATION_GROUNDS = [
  'Kön',
  'Könsöverskridande identitet eller uttryck',
  'Etnisk tillhörighet',
  'Religion eller annan trosuppfattning',
  'Funktionsnedsättning',
  'Sexuell läggning',
  'Ålder'
];

export const ACTION_TEMPLATES = {
  individual: [
    'Särskilt stöd i undervisningen',
    'Samtalskontakt med kurator',
    'Skärpt tillsyn på raster',
    'Schemamässiga förändringar',
    'Disciplinära åtgärder (Skollagen 5 kap.)'
  ],
  structural: [
    'Värdegrundsarbete i hela klassen',
    'Förstärkt personalnärvaro i specifika miljöer',
    'Information till alla vårdnadshavare i gruppen',
    'Utbildningsinsatser för personal'
  ]
};

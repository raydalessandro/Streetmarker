import type { Spot } from '../types/spot';

/**
 * MILANO_SEED_SPOTS - Iconic graffiti/street art locations in Milano
 *
 * Research sources:
 * - Street art blogs and Milano tourism sites
 * - Legal walls initiative "Muri Liberi" by Milano Municipality
 * - Historic halls of fame and social centers
 *
 * IMPORTANT: These are publicly documented, visible spots only.
 * Do not expose active illegal locations.
 */
export const MILANO_SEED_SPOTS: Spot[] = [
  {
    id: crypto.randomUUID(),
    coords: [45.4967, 9.2081], // Leoncavallo
    type: 'wall',
    status: 'protected',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Leoncavallo CSOA',
    notes: 'Muro storico del centro sociale Leoncavallo (Via Watteau 7, zona Greco). Hall of fame del writing milanese, ospita pezzi di crew famose. Graffiti protetti dalla Soprintendenza di Milano, definiti da Sgarbi come "la Cappella Sistina del contemporaneo". Opere di Blu, Ozmo, Atomo, Pao, Mr. Wany, Zed1.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4389, 9.1803], // Cox18
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Cox18 CSOA / Blu',
    notes: 'Centro sociale autogestito Cox18 (Via Conchetta 18, Navigli/Ticinese). Facciata completamente dipinta da Blu nel 2008 con texture densa di personaggi stilizzati. Opera iconica della street art milanese. Sede del Primo Moroni archive e libreria Calusca.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4506, 9.2105], // Via Pontano - NoLo
    type: 'wall',
    status: 'free',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'TDK crew / Comune Milano',
    notes: 'Via Pontano (NoLo district) - "East Side Gallery" milanese con murales numerati come opere museali. Uno dei 100 muri liberi del Comune. Hall of fame TDK crew. Free wall per writers e street artists, si estende quasi senza interruzioni fino alla metro Lambrate. Stretch da Via Padova a Viale Monza.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4618, 9.1893], // Giardino delle Culture
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '08:00', to: '20:00' }],
    securityLevel: 'low',
    owner: 'Millo',
    notes: 'Giardino delle Culture (Via Morosini 8, angolo Via Bezzecca, zona Cinque Giornate). Due muri dedicati all\'amore dipinti da Millo: "Love Seeker" e "Heart Slingshot". Parco pubblico con street art di alta qualità. Uno dei murales più fotografati di Milano.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4264, 9.1812], // Ortica
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Orticanoodles (Walli & Alita)',
    notes: 'Quartiere Ortica - Progetto OR.ME (Ortica Memoria). 20 murales tra i più grandi d\'Italia che raccontano la storia del Novecento milanese. Via Ortica 12 e 16 ospitano opere iconiche. Quartiere trasformato in museo a cielo aperto. Studio degli Orticanoodles in Via San Faustino.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.5130, 9.1589], // Bovisa - Via Schiaffino
    type: 'wall',
    status: 'free',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'medium',
    owner: 'Politecnico / Poli Urban Colors',
    notes: 'Via Privata Simone Schiaffino (Bovisa) - Alcuni dei muri più grandi del quartiere. Ex hall of fame con nuovi pezzi aggiunti. Area Politecnico campus. Festival Poli Urban Colors con opere di Peeta, Zedz, 2501, Rancy, Frah Quintale. "Mutevole" di Elisabetta Mastro (400mq, 23 sezioni).',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4890, 9.2144], // Lambrate - Via Camillo ed Otto Cima
    type: 'wall',
    status: 'free',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'medium',
    owner: 'UK/TGF crew',
    notes: 'Via Camillo ed Otto Cima (Lambrate) - Lunga hall of fame UK/TGF, quartier generale della crew negli anni \'90. Zona industriale con muri ferroviari e siti dismessi. Pezzi di Styng 253, Virus, Ghen, Thero. Piazza Monte Titano vicina con opera di Blu (biciclette giganti vs auto).',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4510, 9.1804], // Darsena/Navigli
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Vari artisti',
    notes: 'Darsena e Navigli - Museo a cielo aperto con murales su ponti e case. Opere lungo tratto tra Darsena e Naviglio Pavese. "Squalo di Milano" sul ponte del Naviglio Pavese. Casa Gorizia occupata (angolo Via Vigevano/Via Gorizia) con stili Tilf e tag Vandalo. Via Magolfa con casa museo Alda Merini.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4896, 9.1900], // Isola - Via Borsieri
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Microbo, Bo130, The Don',
    notes: 'Via Borsieri 5 (Isola) - Angolo Via Sebenico. Uno dei murales più storici di Isola, realizzato da Microbo, Bo130 e The Don. Nel 2021 aggiunto murale dedicato ad Aida Accolla (prima ballerina alla Scala) in tonalità rosa e grigio. Quartiere Isola è la culla della street art milanese.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4902, 9.1910], // Isola - Via Pepe
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: '25 artisti + studenti',
    notes: 'Via Pepe (Isola) - Murale enorme di 250 metri dedicato a Leonardo da Vinci, realizzato per il cinquecentenario della sua morte. 25 artisti tra cui studenti, cittadini e volontari. Area pedonalizzata e depavimentata tra Via Pepe e Via Borsieri.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4620, 9.2098], // NoLo - Via Padova
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'medium',
    owner: 'Robico, Chekos Art, Sef01, Boris Veliz',
    notes: 'Via Padova (NoLo - North of Loreto) - Quartiere multietnico in trasformazione. Murales recenti di Robico (150mq presso sede Fineco) e Chekos Art. Sef01 con Santa Sarita (iconografia sacra/pop per comunità peruviana). Boris Veliz con Dante in poncho ecuadoriano. Specchio della diversità culturale milanese.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4638, 9.1821], // San Lorenzo columns area
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Progetto Milano Street History',
    notes: 'Zona Colonne di San Lorenzo e Basilica - Progetto "Milano Street History" con murales di personaggi storici: Giuseppe Verdi, Napoleone, Attila, Sant\'Ambrogio. Area storica del centro con street art che dialoga con il patrimonio culturale. Zona universitaria e movida.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4850, 9.2050], // Famagosta underpass
    type: 'other',
    status: 'free',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'medium',
    owner: 'Writers vari',
    notes: 'Sottopassaggio pedonale sotto Viale Famagosta (zona Isola borders) - Passaggio per writers interessati a lettering e graffiti writing puro. Sottopasso con forte presenza di tags e throw-ups. Zona di confine tra quartieri, atmosfera underground autentica.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4398, 9.1756], // Via Viotti - Lambrate
    type: 'wall',
    status: 'occupied',
    availability: [{ from: '00:00', to: '23:59' }],
    securityLevel: 'low',
    owner: 'Artista non specificato',
    notes: 'Via Viotti (Lambrate) - Murale anti-smog su larga scala che utilizza la pittura Airlite, in grado di assorbire l\'inquinamento atmosferico e ridurre il biossido di azoto del 90%. Esempio di street art funzionale che unisce arte e sostenibilità ambientale.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    coords: [45.4392, 9.1710], // Porto di Mare - Corsico area
    type: 'train',
    status: 'free',
    availability: [{ from: '22:00', to: '06:00' }],
    securityLevel: 'high',
    owner: 'Hall of Fame Corsico',
    notes: 'Area Porto di Mare / Corsico (sud Milano) - Hall of Fame su muri ferroviari. Zona industriale dismessa. Legal graffiti wall documentata su legal-walls.net. ATTENZIONE: area ferroviaria, alta sicurezza, dipingere solo nelle ore consentite. Tradizione writing old school milanese.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/** Port 1:1 al catalogului din lib/src/models/app_data.dart. */

export interface Subject {
  title: string;
  icon: string;
  accentColor: string;
}

export interface Profile {
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  subjects: Subject[];
}

export interface ExamSession {
  name: string;
  desc: string;
  icon: string;
  color: string;
}

/* Accente — aceleași valori hex ca AppColors. */
export const C = {
  blue: '#007AFF',
  cyan: '#32ADE6',
  indigo: '#5856D6',
  teal: '#30B0C0',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  secondLabel: '#5B6577',
} as const;

const romana: Subject = { title: 'Limba Română', icon: 'book-fill', accentColor: C.blue };
const bio: Subject = { title: 'Biologie', icon: 'leaf', accentColor: C.green };
const chimie: Subject = { title: 'Chimie', icon: 'flask', accentColor: C.purple };
const fizica: Subject = { title: 'Fizică', icon: 'bolt-fill', accentColor: C.orange };
const istorie: Subject = { title: 'Istorie', icon: 'building', accentColor: C.orange };
const geoGreen: Subject = { title: 'Geografie', icon: 'globe', accentColor: C.green };
const logica: Subject = { title: 'Logică', icon: 'lightbulb', accentColor: C.purple };
const psiho: Subject = { title: 'Psihologie', icon: 'person-circle-fill', accentColor: C.indigo };
const econ: Subject = { title: 'Economie', icon: 'chart-pie', accentColor: C.orange };

export const appProfiles: Profile[] = [
  {
    name: 'Mate-Info',
    description: 'Profil Real · Matematică M1',
    icon: 'desktop',
    accentColor: C.blue,
    subjects: [
      romana,
      { title: 'Matematică (M1)', icon: 'function', accentColor: C.indigo },
      { title: 'Informatică', icon: 'code', accentColor: C.teal },
      bio, chimie, fizica,
    ],
  },
  {
    name: 'Științele Naturii',
    description: 'Profil Real · Matematică M2',
    icon: 'leaf',
    accentColor: C.green,
    subjects: [
      romana,
      { title: 'Matematică (M2)', icon: 'function', accentColor: C.indigo },
      { title: 'Informatică (M2)', icon: 'code', accentColor: C.teal },
      bio, chimie, fizica,
    ],
  },
  {
    name: 'Filologie',
    description: 'Profil Uman · Istorie + discipline socio-umane',
    icon: 'book',
    accentColor: C.orange,
    subjects: [
      romana, istorie, geoGreen, logica, psiho, econ,
      { title: 'Sociologie', icon: 'person-2-fill', accentColor: C.teal },
      { title: 'Filosofie', icon: 'book-circle', accentColor: C.blue },
    ],
  },
  {
    name: 'Științe Sociale',
    description: 'Profil Uman · Istorie și Geografie/Logică',
    icon: 'person-2-fill',
    accentColor: C.purple,
    subjects: [romana, istorie, geoGreen, logica, psiho],
  },
  {
    name: 'Tehnologic',
    description: 'Profil Tehnologic · Matematică M2',
    icon: 'gear-fill',
    accentColor: C.teal,
    subjects: [
      romana,
      { title: 'Matematică (M2)', icon: 'function', accentColor: C.indigo },
      bio,
      { title: 'Geografie', icon: 'globe', accentColor: C.teal },
      econ,
    ],
  },
  {
    name: 'Pedagogic',
    description: 'Profil Vocațional · Pedagogie',
    icon: 'person-3-fill',
    accentColor: C.red,
    subjects: [
      romana,
      { title: 'Matematică (M3)', icon: 'function', accentColor: C.indigo },
      istorie,
      { title: 'Pedagogie', icon: 'person-stack', accentColor: C.red },
      psiho,
    ],
  },
  {
    name: 'Economic',
    description: 'Profil Servicii · Matematică M2',
    icon: 'dollar-circle',
    accentColor: C.orange,
    subjects: [
      romana,
      { title: 'Matematică (M2)', icon: 'function', accentColor: C.indigo },
      econ, geoGreen,
    ],
  },
];

export const examSessions: ExamSession[] = [
  { name: 'Sesiunea Iunie', desc: 'Examenul oficial principal', icon: 'sun-fill', color: C.orange },
  { name: 'Sesiunea Aug / Sept', desc: 'A doua sesiune oficială', icon: 'moon-fill', color: C.indigo },
  { name: 'Simulare Națională', desc: 'Testarea din primăvară', icon: 'chart-bar-fill', color: C.teal },
  { name: 'Sesiunea Specială', desc: 'Calendar separat pentru candidați eligibili', icon: 'doc-text-fill', color: C.green },
  { name: 'Model Oficial', desc: 'Modelul de subiect publicat de minister', icon: 'doc-on-doc', color: C.purple },
];

export const examYears = ['2025', '2024', '2023', '2022', '2021', '2020'];

export function profileByName(name: string | null | undefined): Profile {
  if (!name) return appProfiles[0];
  return appProfiles.find((p) => p.name === name) ?? appProfiles[0];
}

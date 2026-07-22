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

/* Accente — neutru gri Cupertino */
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
  gray: '#8E98AC',
} as const;

const romana: Subject = { title: 'Limba Română', icon: 'book-fill', accentColor: C.gray };
const bio: Subject = { title: 'Biologie', icon: 'leaf', accentColor: C.gray };
const chimie: Subject = { title: 'Chimie', icon: 'flask', accentColor: C.gray };
const fizica: Subject = { title: 'Fizică', icon: 'bolt-fill', accentColor: C.gray };
const istorie: Subject = { title: 'Istorie', icon: 'building', accentColor: C.gray };
const geoGreen: Subject = { title: 'Geografie', icon: 'globe', accentColor: C.gray };
const logica: Subject = { title: 'Logică', icon: 'lightbulb', accentColor: C.gray };
const psiho: Subject = { title: 'Psihologie', icon: 'person-circle-fill', accentColor: C.gray };
const econ: Subject = { title: 'Economie', icon: 'chart-pie', accentColor: C.gray };

export const appProfiles: Profile[] = [
  {
    name: 'Mate-Info',
    description: 'Profil Real · Matematică M1',
    icon: 'desktop',
    accentColor: C.gray,
    subjects: [
      romana,
      { title: 'Matematică (M1)', icon: 'function', accentColor: C.gray },
      { title: 'Informatică', icon: 'code', accentColor: C.gray },
      bio, chimie, fizica,
    ],
  },
  {
    name: 'Științele Naturii',
    description: 'Profil Real · Matematică M2',
    icon: 'leaf',
    accentColor: C.gray,
    subjects: [
      romana,
      { title: 'Matematică (M2)', icon: 'function', accentColor: C.gray },
      { title: 'Informatică (M2)', icon: 'code', accentColor: C.gray },
      bio, chimie, fizica,
    ],
  },
  {
    name: 'Filologie',
    description: 'Profil Uman · Istorie + discipline socio-umane',
    icon: 'book',
    accentColor: C.gray,
    subjects: [
      romana, istorie, geoGreen, logica, psiho, econ,
      { title: 'Sociologie', icon: 'person-2-fill', accentColor: C.gray },
      { title: 'Filosofie', icon: 'book-circle', accentColor: C.gray },
    ],
  },
  {
    name: 'Științe Sociale',
    description: 'Profil Uman · Istorie și Geografie/Logică',
    icon: 'person-2-fill',
    accentColor: C.gray,
    subjects: [romana, istorie, geoGreen, logica, psiho],
  },
  {
    name: 'Tehnologic',
    description: 'Profil Tehnologic · Matematică M2',
    icon: 'gear-fill',
    accentColor: C.gray,
    subjects: [
      romana,
      { title: 'Matematică (M2)', icon: 'function', accentColor: C.gray },
      bio,
      { title: 'Geografie', icon: 'globe', accentColor: C.gray },
      econ,
    ],
  },
  {
    name: 'Pedagogic',
    description: 'Profil Vocațional · Pedagogie',
    icon: 'person-3-fill',
    accentColor: C.gray,
    subjects: [
      romana,
      { title: 'Matematică (M3)', icon: 'function', accentColor: C.gray },
      istorie,
      { title: 'Pedagogie', icon: 'person-stack', accentColor: C.gray },
      psiho,
    ],
  },
  {
    name: 'Economic',
    description: 'Profil Servicii · Matematică M2',
    icon: 'dollar-circle',
    accentColor: C.gray,
    subjects: [
      romana,
      { title: 'Matematică (M2)', icon: 'function', accentColor: C.gray },
      econ, geoGreen,
    ],
  },
];

export const examSessions: ExamSession[] = [
  { name: 'Sesiunea Iunie', desc: 'Examenul oficial principal', icon: 'sun-fill', color: C.gray },
  { name: 'Sesiunea Aug / Sept', desc: 'A doua sesiune oficială', icon: 'moon-fill', color: C.gray },
  { name: 'Simulare Națională', desc: 'Testarea din primăvară', icon: 'chart-bar-fill', color: C.gray },
  { name: 'Sesiunea Specială', desc: 'Calendar separat pentru candidați eligibili', icon: 'doc-text-fill', color: C.gray },
  { name: 'Model Oficial', desc: 'Modelul de subiect publicat de minister', icon: 'doc-on-doc', color: C.gray },
];

export const examYears = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

export function profileByName(name: string | null | undefined): Profile {
  if (!name) return appProfiles[0];
  return appProfiles.find((p) => p.name === name) ?? appProfiles[0];
}

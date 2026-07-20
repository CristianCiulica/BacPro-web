/**
 * Port 1:1 al lib/src/services/exam_catalog.dart — catalogul curat de
 * subiecte oficiale BAC găzduite pe e3.ro / profesorjitaruionel.com.
 * Toate URL-urile sunt identice cu cele din aplicația mobilă.
 */
import { ExamPdfAssets } from '../models/profile-data';

interface ExamDoc {
  subject: string;
  barem: string;
}

const BASE = 'https://www.e3.ro/wp-content/uploads';

const std = (folder: string, p: string, year: string, tag: string): ExamDoc => ({
  subject: `${BASE}/${folder}/E_c_matematica_M_${p}_${year}_var_${tag}_LRO.pdf`,
  barem: `${BASE}/${folder}/E_c_matematica_M_${p}_${year}_bar_${tag}_LRO.pdf`,
});

const model = (folder: string, p: string, year: string): ExamDoc => ({
  subject: `${BASE}/${folder}/E_c_matematica_M_${p}_${year}_var_model.pdf`,
  barem: `${BASE}/${folder}/E_c_matematica_M_${p}_${year}_bar_model.pdf`,
});

const s23 = (p: string, sess: string, n: string): ExamDoc => ({
  subject: `${BASE}/2023/11/2023_E_c_Matematica_${sess}_M_${p}_Subiect_${n}_LRO.pdf`,
  barem: `${BASE}/2023/11/2023_E_c_Matematica_${sess}_M_${p}_Barem_${n}_LRO.pdf`,
});

const sim23 = (p: string): ExamDoc => ({
  subject: `${BASE}/2023/11/2023_E_c_Matematica_SM_M_${p}_Simulare_XII_Subiect_LRO.pdf`,
  barem: `${BASE}/2023/11/2023_E_c_Matematica_SM_M_${p}_Simulare_XII_Barem_LRO.pdf`,
});

const short = (folder: string, stem: string): ExamDoc => ({
  subject: `${BASE}/${folder}/${stem}.pdf`,
  barem: `${BASE}/${folder}/${stem}barem.pdf`,
});

type YearMap = Record<string, Record<string, ExamDoc>>;

const MATH: Record<string, YearMap> = {
  'mate-info': {
    '2025': {
      iunie: std('2025/06', 'mate-info', '2025', '01'),
      august: std('2025/08', 'mate-info', '2025', '09'),
      speciala: std('2025/05', 'mate-info', '2025', '03'),
      simulare: std('2025/03', 'mate-info', '2025', 'simulare'),
      model: model('2024/11', 'mate-info', '2025'),
    },
    '2024': {
      iunie: std('2024/07', 'mate-info', '2024', '10'),
      august: std('2024/08', 'mate-info', '2024', '03'),
      speciala: std('2024/05', 'mate-info', '2024', '09'),
      simulare: std('2024/03', 'mate-info', '2024', 'simulare'),
    },
    '2023': {
      iunie: s23('mate-info', 'S1', '01'),
      august: s23('mate-info', 'S2', '07'),
      speciala: s23('mate-info', 'SS', '06'),
      simulare: sim23('mate-info'),
      model: short('2023/12', 'modelBAC2023MI'),
    },
    '2022': {
      iunie: std('2022/06', 'mate-info', '2022', '01'),
      august: short('2023/12', 'exBACaug2022MI'),
      speciala: std('2022/05', 'mate-info', '2022', '03'),
      simulare: short('2023/12', 'simBACmar2022MI'),
      model: model('2021/11', 'mate-info', '2022'),
    },
    '2021': {
      iunie: std('2021/07', 'mate-info', '2021', '02'),
      august: std('2021/08', 'mate-info', '2021', '04'),
      simulare: {
        subject: `${BASE}/2021/12/E_c_matematica_M_mate-info_2021_var_simulare_LRO.pdf`,
        barem: `${BASE}/2021/08/E_c_matematica_M_mate-info_2021_bar_simulare_LRO.pdf`,
      },
      model: model('2020/12', 'mate-info', '2021'),
    },
    '2020': {
      iunie: std('2020/06', 'mate-info', '2020', '06'),
      august: std('2020/10', 'mate-info', '2020', '03'),
    },
  },
  'st-nat': {
    '2025': {
      iunie: std('2025/06', 'st-nat', '2025', '01'),
      august: std('2025/08', 'st-nat', '2025', '09'),
      speciala: std('2025/05', 'st-nat', '2025', '03'),
      simulare: std('2025/03', 'st-nat', '2025', 'simulare'),
      model: model('2024/11', 'st-nat', '2025'),
    },
    '2024': {
      iunie: std('2024/07', 'st-nat', '2024', '10'),
      august: std('2024/08', 'st-nat', '2024', '03'),
      speciala: std('2024/05', 'st-nat', '2024', '09'),
      simulare: std('2024/03', 'st-nat', '2024', 'simulare'),
    },
    '2023': {
      iunie: s23('st-nat', 'S1', '01'),
      august: s23('st-nat', 'S2', '07'),
      speciala: s23('st-nat', 'SS', '06'),
      simulare: sim23('st-nat'),
      model: short('2023/12', 'modelBAC2023SN'),
    },
    '2022': {
      iunie: {
        subject: `${BASE}/2022/06/E_c_matematica_M_st-nat_2022_var_01_LRO.pdf`,
        barem: `${BASE}/2022/09/E_c_matematica_M_st-nat_2022_bar_01_LRO.pdf`,
      },
      august: short('2023/12', 'exBACaug2022SN'),
      speciala: std('2022/05', 'st-nat', '2022', '03'),
      simulare: short('2023/12', 'simBACmar2022SN'),
      model: model('2021/11', 'st-nat', '2022'),
    },
    '2021': {
      iunie: std('2021/07', 'st-nat', '2021', '02'),
      august: std('2021/08', 'st-nat', '2021', '04'),
      simulare: std('2021/03', 'st-nat', '2021', 'simulare'),
      model: model('2020/12', 'st-nat', '2021'),
    },
    '2020': {
      iunie: std('2020/06', 'st-nat', '2020', '06'),
      august: std('2020/10', 'st-nat', '2020', '03'),
    },
  },
  tehnologic: {
    '2025': {
      iunie: std('2025/06', 'tehnologic', '2025', '01'),
      august: std('2025/08', 'tehnologic', '2025', '09'),
      speciala: std('2025/05', 'tehnologic', '2025', '03'),
      simulare: std('2025/03', 'tehnologic', '2025', 'simulare'),
      model: model('2024/11', 'tehnologic', '2025'),
    },
    '2024': {
      iunie: std('2024/07', 'tehnologic', '2024', '10'),
      august: std('2024/08', 'tehnologic', '2024', '03'),
      speciala: std('2024/05', 'tehnologic', '2024', '09'),
      simulare: std('2024/03', 'tehnologic', '2024', 'simulare'),
    },
    '2023': {
      iunie: s23('tehnologic', 'S1', '01'),
      august: s23('tehnologic', 'S2', '07'),
      speciala: s23('tehnologic', 'SS', '06'),
      simulare: sim23('tehnologic'),
      model: short('2023/12', 'modelBAC2023TEHNO'),
    },
    '2022': {
      iunie: std('2022/06', 'tehnologic', '2022', '01'),
      august: short('2023/12', 'exBACaug2022TEHNO'),
      speciala: std('2022/05', 'tehnologic', '2022', '03'),
      simulare: short('2023/12', 'simBACmar2022TEHNO'),
      model: model('2021/11', 'tehnologic', '2022'),
    },
    '2021': {
      iunie: std('2021/07', 'tehnologic', '2021', '02'),
      august: std('2021/08', 'tehnologic', '2021', '04'),
      simulare: std('2021/08', 'tehnologic', '2021', 'simulare'),
      model: model('2020/12', 'tehnologic', '2021'),
    },
    '2020': {
      iunie: std('2020/06', 'tehnologic', '2020', '06'),
      august: std('2020/10', 'tehnologic', '2020', '03'),
    },
  },
  pedagogic: {
    '2025': {
      iunie: std('2025/06', 'pedagogic', '2025', '01'),
      august: std('2025/08', 'pedagogic', '2025', '09'),
      speciala: std('2025/05', 'pedagogic', '2025', '03'),
      simulare: std('2025/03', 'pedagogic', '2025', 'simulare'),
      model: model('2024/11', 'pedagogic', '2025'),
    },
    '2024': {
      iunie: std('2024/07', 'pedagogic', '2024', '10'),
      august: std('2024/08', 'pedagogic', '2024', '03'),
      simulare: std('2024/03', 'pedagogic', '2024', 'simulare'),
      model: model('2023/11', 'pedagogic', '2024'),
    },
    '2023': {
      iunie: s23('pedagogic', 'S1', '01'),
      august: s23('pedagogic', 'S2', '07'),
      simulare: sim23('pedagogic'),
      model: short('2023/12', 'modelBAC2023PEDA'),
    },
    '2022': {
      iunie: {
        subject: `${BASE}/2022/06/E_c_matematica_M_pedagogic_2022_var_01_LRO.pdf`,
        barem: `${BASE}/2022/06/E_c_matematica_M_pedagogic_2022_bar_01.pdf`,
      },
      august: short('2023/12', 'exBACaug2022PEDA'),
      speciala: {
        subject: `${BASE}/2022/05/E_c_matematica_M_pedagogic_2022_var_03.pdf`,
        barem: `${BASE}/2022/05/E_c_matematica_M_pedagogic_2022_bar_03.pdf`,
      },
      simulare: short('2023/12', 'simBACmar2022PEDA'),
      model: {
        subject: `${BASE}/2021/11/E_c_Matematica_M_pedagogic_2022_var_model.pdf`,
        barem: `${BASE}/2021/11/E_c_Matematica_M_pedagogic_2022_bar_model.pdf`,
      },
    },
    '2021': {
      iunie: std('2021/07', 'pedagogic', '2021', '02'),
      august: std('2021/08', 'pedagogic', '2021', '04'),
      simulare: std('2021/08', 'pedagogic', '2021', 'simulare'),
      model: model('2020/12', 'pedagogic', '2021'),
    },
    '2020': {
      iunie: std('2020/06', 'pedagogic', '2020', '06'),
      august: std('2020/10', 'pedagogic', '2020', '03'),
    },
  },
};

const BLOG = 'https://profesorjitaruionel.com/wp-content/uploads';

const b = (folder: string, varName: string, barName: string): ExamDoc => ({
  subject: `${BLOG}/${folder}/${varName}`,
  barem: `${BLOG}/${folder}/${barName}`,
});

const ROMANA: Record<string, Record<string, ExamDoc>> = {
  real: {
    '2025': b('2025/06', 'E_a_romana_real_tehn_2025_var_07.pdf', 'E_a_romana_real_tehn_2025_bar_07.pdf'),
    '2024': b('2024/07', 'E_a_romana_real_tehn_2024_var_02.pdf', 'E_a_romana_real_tehn_2024_bar_02.pdf'),
    '2023': b('2023/06', 'E_a_romana_real_tehn_2023_var_06.pdf', 'E_a_romana_real_tehn_2023_bar_06.pdf'),
  },
  uman: {
    '2025': b('2025/06', 'E_a_romana_uman_ped_2025_var_07.pdf', 'E_a_romana_uman_ped_2025_bar_07.pdf'),
    '2024': b('2024/07', 'E_a_romana_uman_ped_2024_var_02.pdf', 'E_a_romana_uman_ped_2024_bar_02.pdf'),
    '2023': b('2023/06', 'E_a_romana_uman_ped_2023_var_06.pdf', 'E_a_romana_uman_ped_2023_bar_06.pdf'),
  },
};

const OTHER: Record<string, Record<string, ExamDoc>> = {
  istorie: {
    '2025': b('2025/06', 'E_c_istorie_2025_var_01_LRO.pdf', 'E_c_istorie_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_c_istorie_2024_var_10_LRO.pdf', 'E_c_istorie_2024_bar_10_LRO.pdf'),
    '2023': b('2023/06', 'E_c_istorie_2023_var_01_LRO.pdf', 'E_c_istorie_2023_bar_01_LRO.pdf'),
  },
  biologie: {
    '2025': b('2025/06', 'E_d_bio_veg_anim_2025_var_01_LRO.pdf', 'E_d_bio_veg_anim_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_bio_veg_anim_2024_var_03_LRO.pdf', 'E_d_bio_veg_anim_2024_bar_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_bio_veg_anim_2023_var_05_LRO.pdf', 'E_d_bio_veg_anim_2023_bar_05_LRO.pdf'),
  },
  chimie: {
    '2025': b('2025/06', 'E_d_chimie_organica_2025_var_01_LRO.pdf', 'E_d_chimie_organica_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_chimie_organica_2024_var_03_LRO.pdf', 'E_d_chimie_organica_2024_bar_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_chimie_organica_2023_var_05_LRO.pdf', 'E_d_chimie_organica_2023_bar_05_LRO.pdf'),
  },
  fizica: {
    '2025': b('2025/06', 'E_d_fizica_tehnologic_2025_var_01_LRO.pdf', 'E_d_fizica_tehnologic_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_fizica_teoretic-vocational_2024_var_03.pdf', 'E_d_fizica_teoretic-vocational_2024_bar_03.pdf'),
    '2023': b('2023/06', 'E_d_fizica_teoretic_vocational_2023_var_05_LRO.pdf', 'E_d_fizica_teoretic_vocational_2023_bar_05_LRO.pdf'),
  },
  informatica: {
    '2025': b('2025/06', 'E_d_Informatica_2025_sp_MI_C_var_01_LRO.pdf', 'E_d_informatica_2025_sp_MI_bar_01_LRO.pdf'),
    // Baremul 2024 nu e publicat separat pe mirror — refolosim subiectul.
    '2024': b('2024/07', 'E_d_Informatica_2024_sp_MI_C_var_03_LRO.pdf', 'E_d_Informatica_2024_sp_MI_C_var_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_Informatica_2023_sp_MI_C_var_05_LRO.pdf', 'E_d_Informatica_2023_sp_MI_bar_05_LRO.pdf'),
  },
  geografie: {
    '2025': b('2025/06', 'E_d_geografie_2025_var_01_LRO.pdf', 'E_d_geografie_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_geografie_2024_var_03_LRO.pdf', 'E_d_geografie_2024_bar_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_geografie_2023_var_05_LRO.pdf', 'E_d_geografie_2023_bar_05_LRO.pdf'),
  },
  logica: {
    '2025': b('2025/06', 'E_d_logica_2025_var_01_LRO.pdf', 'E_d_logica_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_logica_2024_var_03_LRO.pdf', 'E_d_logica_2024_bar_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_logica_2023_var_05_LRO.pdf', 'E_d_logica_2023_bar_05_LRO.pdf'),
  },
  psihologie: {
    '2025': b('2025/06', 'E_d_psihologie_2025_var_01_LRO.pdf', 'E_d_psihologie_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_psihologie_2024_var_03_LRO.pdf', 'E_d_psihologie_2024_bar_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_psihologie_2023_var_05_LRO.pdf', 'E_d_psihologie_2023_bar_05_LRO.pdf'),
  },
  economie: {
    '2025': b('2025/06', 'E_d_economie_2025_var_01_LRO.pdf', 'E_d_economie_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_economie_2024_var_03_LRO.pdf', 'E_d_economie_2024_bar_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_economie_2023_var_05_LRO.pdf', 'E_d_economie_2023_bar_05_LRO.pdf'),
  },
  sociologie: {
    '2025': b('2025/06', 'E_d_sociologie_2025_var_01_LRO.pdf', 'E_d_sociologie_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_sociologie_2024_var_03_LRO.pdf', 'E_d_sociologie_2024_bar_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_sociologie_2023_var_05_LRO.pdf', 'E_d_sociologie_2023_bar_05_LRO.pdf'),
  },
  filosofie: {
    '2025': b('2025/06', 'E_d_filosofie_2025_var_01_LRO.pdf', 'E_d_filosofie_2025_bar_01_LRO.pdf'),
    '2024': b('2024/07', 'E_d_filosofie_2024_var_03_LRO.pdf', 'E_d_filosofie_2024_bar_03_LRO.pdf'),
    '2023': b('2023/06', 'E_d_filosofie_2023_var_05_LRO.pdf', 'E_d_filosofie_2023_bar_05_LRO.pdf'),
  },
};

export interface ExamSelection {
  profile: string;
  subject: string;
  year: string;
  session: string;
}

export function resolveExamCatalog(sel: ExamSelection): ExamPdfAssets | null {
  // 1. Matematică — acoperire completă per sesiune, pe profiluri.
  const mathProfile = mathProfileFor(sel.profile, sel.subject);
  if (mathProfile !== null) {
    const doc = MATH[mathProfile]?.[sel.year.trim()]?.[sessionKey(sel.session)];
    return doc ? toAssets(doc) : null;
  }

  // 2. Limba Română — filiera reală vs umană.
  if (isRomana(sel.subject)) {
    const track = isUmanProfile(sel.profile) ? 'uman' : 'real';
    const doc = nearestYear(ROMANA[track], sel.year);
    return doc ? toAssets(doc) : null;
  }

  // 3. Celelalte discipline scrise — varianta de referință a anului,
  // folosită pentru orice sesiune aleasă.
  const key = otherKey(sel.subject);
  if (key !== null) {
    const doc = nearestYear(OTHER[key], sel.year);
    return doc ? toAssets(doc) : null;
  }

  return null;
}

function nearestYear(byYear: Record<string, ExamDoc> | undefined, year: string): ExamDoc | null {
  if (!byYear) return null;
  const keys = Object.keys(byYear);
  if (keys.length === 0) return null;
  const exact = byYear[year.trim()];
  if (exact) return exact;
  keys.sort();
  return byYear[keys[keys.length - 1]];
}

const toAssets = (doc: ExamDoc): ExamPdfAssets => ({
  subjectPdfAsset: doc.subject,
  answerPdfAsset: doc.barem,
});

export function catalogCovers(profile: string, subject: string): boolean {
  return mathProfileFor(profile, subject) !== null || isRomana(subject) || otherKey(subject) !== null;
}

const isRomana = (subject: string) => normalize(subject).includes('romana');

function isUmanProfile(profile: string): boolean {
  const p = normalize(profile);
  return p.includes('filologie') || p.includes('stiintesociale') || p.includes('pedagogic');
}

function otherKey(subject: string): string | null {
  const s = normalize(subject);
  if (s.includes('istor')) return 'istorie';
  if (s.includes('biolog')) return 'biologie';
  if (s.includes('chim')) return 'chimie';
  if (s.includes('fizic')) return 'fizica';
  if (s.includes('informat')) return 'informatica';
  if (s.includes('geograf')) return 'geografie';
  if (s.includes('logic')) return 'logica';
  if (s.includes('psiholog')) return 'psihologie';
  if (s.includes('econom')) return 'economie';
  if (s.includes('sociolog')) return 'sociologie';
  if (s.includes('filosof') || s.includes('filozof')) return 'filosofie';
  return null;
}

function mathProfileFor(profile: string, subject: string): string | null {
  const s = normalize(subject);
  const isMath = s.includes('matematic') || s === 'm1' || s === 'm2';
  if (!isMath) return null;

  const p = normalize(profile);
  if (p.includes('mateinfo')) return 'mate-info';
  if (p.includes('stiintelenaturii') || p.includes('stiintenaturii')) return 'st-nat';
  if (p.includes('tehnologic') || p.includes('economic')) return 'tehnologic';
  if (p.includes('pedagogic')) return 'pedagogic';

  // Cade pe eticheta materiei când profilul e ambiguu.
  if (s.includes('m1')) return 'mate-info';
  if (s.includes('m2')) return 'tehnologic';
  if (s.includes('m3')) return 'pedagogic';
  return null;
}

function sessionKey(session: string): string {
  const n = normalize(session);
  if (n.includes('iunie') || n.includes('vara')) return 'iunie';
  if (n.includes('aug') || n.includes('sept') || n.includes('toamna')) return 'august';
  if (n.includes('simulare')) return 'simulare';
  if (n.includes('special')) return 'speciala';
  if (n.includes('model')) return 'model';
  return 'iunie';
}

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replaceAll('ă', 'a')
    .replaceAll('â', 'a')
    .replaceAll('î', 'i')
    .replaceAll('ș', 's')
    .replaceAll('ş', 's')
    .replaceAll('ț', 't')
    .replaceAll('ţ', 't')
    .replace(/[^a-z0-9]/g, '');
}

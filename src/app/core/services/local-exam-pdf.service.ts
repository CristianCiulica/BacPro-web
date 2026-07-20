/**
 * Port al lib/src/services/local_exam_pdf_service.dart.
 * Ordinea de rezolvare: (1) catalogul curat de URL-uri remote →
 * (2) convenția de nume pentru PDF-urile incluse în aplicație
 * (assets/subiecte/{folder}/{Prefix}{An}_{Sesiune}.pdf), verificată cu un
 * request HEAD. Scanarea fuzzy a manifestului de assets din Flutter nu are
 * echivalent pe web (nu există manifest) — convenția directă acoperă
 * fișierele incluse (ex. MateInfo2025_Iunie.pdf).
 */
import { Injectable } from '@angular/core';

import { ExamPdfAssets } from '../models/profile-data';
import { ExamSelection, normalize, resolveExamCatalog } from './exam-catalog';

@Injectable({ providedIn: 'root' })
export class LocalExamPdfService {
  async resolve(sel: ExamSelection): Promise<ExamPdfAssets | null> {
    const curated = resolveExamCatalog(sel);
    if (curated) return curated;
    return this.resolveDirectByConvention(sel);
  }

  private async resolveDirectByConvention(sel: ExamSelection): Promise<ExamPdfAssets | null> {
    const folder = subjectFolder(sel.subject);
    const prefix = subjectPrefixForProfile(sel.profile, sel.subject);
    const suffix = sessionSuffix(sel.session);
    const year = sel.year.trim();

    const candidates = [
      `assets/subiecte/${folder}/${prefix}${year}_${suffix}.pdf`,
      `assets/subiecte/${folder}/${prefix}${year}_${suffix.toLowerCase()}.pdf`,
      `assets/subiecte/${folder}/${prefix}${year}_${sessionSuffixAlt(sel.session)}.pdf`,
    ];

    for (const path of candidates) {
      if (await this.assetExists(path)) {
        return { subjectPdfAsset: path, answerPdfAsset: path };
      }
    }
    return null;
  }

  private async assetExists(path: string): Promise<boolean> {
    try {
      const res = await fetch(path, { method: 'HEAD' });
      const type = res.headers.get('content-type') ?? '';
      // Dev-server-ul răspunde 200 cu index.html pentru orice cale — cerem
      // explicit un content-type de PDF ca să nu raportăm fals că există.
      return res.ok && !type.includes('text/html');
    } catch {
      return false;
    }
  }
}

function subjectFolder(subject: string): string {
  const n = normalize(subject);
  if (n.includes('matematic')) return 'matematica';
  if (n.includes('informat')) return 'informatica';
  if (n.includes('roman')) return 'romana';
  if (n.includes('istor')) return 'istorie';
  if (n.includes('biolog')) return 'biologie';
  if (n.includes('chim')) return 'chimie';
  if (n.includes('fizic')) return 'fizica';
  if (n.includes('geograf')) return 'geografie';
  if (n.includes('logic')) return 'logica';
  if (n.includes('psiholog')) return 'psihologie';
  if (n.includes('econom')) return 'economie';
  if (n.includes('sociolog')) return 'sociologie';
  if (n.includes('filosof')) return 'filosofie';
  return 'matematica';
}

function subjectPrefixForProfile(profile: string, subject: string): string {
  const p = normalize(profile);
  const s = normalize(subject);

  if (s.includes('matematic')) {
    if (p.includes('mateinfo')) return 'MateInfo';
    if (p.includes('tehnologic')) return 'MateTehno';
    if (p.includes('stiintelenaturii') || p.includes('stiintenaturii')) return 'MateSN';
    if (p.includes('economic')) return 'MateEco';
    return 'Mate';
  }

  if (s.includes('informat')) {
    if (p.includes('mateinfo')) return 'InformaticaMI';
    if (p.includes('stiintelenaturii') || p.includes('stiintenaturii')) return 'InformaticaM2';
    return 'Informatica';
  }

  if (s.includes('roman')) return 'Romana';
  if (s.includes('istor')) return 'Istorie';
  if (s.includes('biolog')) return 'Biologie';
  if (s.includes('chim')) return 'Chimie';
  if (s.includes('fizic')) return 'Fizica';
  if (s.includes('geograf')) return 'Geografie';
  if (s.includes('logic')) return 'Logica';
  if (s.includes('psiholog')) return 'Psihologie';
  if (s.includes('econom')) return 'Economie';
  if (s.includes('sociolog')) return 'Sociologie';
  if (s.includes('filosof')) return 'Filosofie';

  return 'Subiect';
}

function sessionSuffix(session: string): string {
  const n = normalize(session);
  if (n.includes('iunie')) return 'Iunie';
  if (n.includes('aug') || n.includes('sept')) return 'August';
  if (n.includes('simulare')) return 'Simulare';
  if (n.includes('special')) return 'Speciala';
  if (n.includes('model')) return 'Model';
  return 'Iunie';
}

function sessionSuffixAlt(session: string): string {
  const n = normalize(session);
  if (n.includes('aug') || n.includes('sept')) return 'AugSept';
  return sessionSuffix(session);
}

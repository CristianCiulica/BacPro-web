/**
 * Port al lib/src/services/pdf_export_service.dart — generează raportul
 * "Bac Pro - raport personal" (antet, date cont, rezumat, tabel istoric),
 * cu diacriticele eliminate exact ca în varianta mobilă. Pe web, fișierul
 * se descarcă direct (bac_pro_raport.pdf).
 */
import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { StudySession, UserProfileData } from '../models/profile-data';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async exportUserData(profile: UserProfileData, sessions: StudySession[]): Promise<string> {
    const totalMinutes = Math.trunc(sessions.reduce((t, s) => t + s.durationSeconds, 0) / 60);
    const averageGrade =
      sessions.length === 0
        ? 0
        : sessions.reduce((t, s) => t + s.estimatedGrade, 0) / sessions.length;

    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(18);
    doc.text('Bac Pro - raport personal', 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Nume: ${pdfText(profile.name)}`, 14, y); y += 6;
    doc.text(`Email: ${pdfText(profile.email)}`, 14, y); y += 6;
    doc.text(`Scoala: ${pdfText(profile.school)}`, 14, y); y += 6;
    doc.text(`Profil: ${pdfText(profile.selectedProfile)}`, 14, y); y += 12;

    doc.setFontSize(14);
    doc.text('Rezumat', 14, y); y += 8;
    doc.setFontSize(11);
    doc.text(`Subiecte rezolvate: ${sessions.length}`, 14, y); y += 6;
    doc.text(`Timp total: ${totalMinutes} minute`, 14, y); y += 6;
    doc.text(
      `Media estimata: ${averageGrade === 0 ? '-' : averageGrade.toFixed(1)}`,
      14, y,
    );
    y += 12;

    doc.setFontSize(14);
    doc.text('Istoric sesiuni', 14, y); y += 6;

    if (sessions.length === 0) {
      doc.setFontSize(11);
      doc.text('Nu exista sesiuni salvate inca.', 14, y + 4);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Subiect', 'An', 'Sesiune', 'Nota', 'Minute']],
        body: sessions.map((s) => [
          pdfText(s.subjectName),
          s.year,
          pdfText(s.sessionName),
          s.estimatedGrade.toFixed(1),
          String(Math.trunc(s.durationSeconds / 60)),
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [10, 132, 255] },
      });
    }

    const fileName = 'bac_pro_raport.pdf';
    doc.save(fileName);
    return fileName;
  }
}

function pdfText(value: string): string {
  return value
    .replaceAll('ă', 'a').replaceAll('â', 'a').replaceAll('î', 'i')
    .replaceAll('ș', 's').replaceAll('ş', 's')
    .replaceAll('ț', 't').replaceAll('ţ', 't')
    .replaceAll('Ă', 'A').replaceAll('Â', 'A').replaceAll('Î', 'I')
    .replaceAll('Ș', 'S').replaceAll('Ş', 'S')
    .replaceAll('Ț', 'T').replaceAll('Ţ', 'T');
}

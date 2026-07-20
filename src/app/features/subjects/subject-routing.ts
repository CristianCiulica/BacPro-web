/**
 * Numele reale ("Matematică (M1)", "Sesiunea Aug / Sept") conțin paranteze și
 * slash-uri care au sens special în URL-urile Angular. Navigarea folosește
 * slug-uri normalizate (fără diacritice/simboluri), iar ecranele rezolvă
 * înapoi numele reale din catalog.
 */
import {
  ExamSession,
  Profile,
  Subject,
  appProfiles,
  examSessions,
} from '../../core/models/catalog';
import { normalize } from '../../core/services/exam-catalog';

export const slug = normalize;

export function findProfile(profileSlug: string): Profile {
  return (
    appProfiles.find((p) => normalize(p.name) === normalize(profileSlug)) ?? appProfiles[0]
  );
}

export function findSubject(profile: Profile, subjectSlug: string): Subject | null {
  return (
    profile.subjects.find((s) => normalize(s.title) === normalize(subjectSlug)) ?? null
  );
}

export function findSession(sessionSlug: string): ExamSession | null {
  return examSessions.find((s) => normalize(s.name) === normalize(sessionSlug)) ?? null;
}

/**
 * Port al lib/src/services/firestore_service.dart.
 *
 * Cu Firebase configurat: users/{uid}, users/{uid}/sessions, exam_pdfs —
 * aceleași colecții/câmpuri ca aplicația mobilă (datele rămân compatibile).
 * Fără config: persistență localStorage cu aceeași structură de date.
 */
import { Injectable, Signal, signal } from '@angular/core';
import {
  Timestamp,
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import {
  AuthUserLike,
  DeveloperMessage,
  ExamPdfAssets,
  StudySession,
  UserProfileData,
  profileDefaults,
  profileFromMap,
} from '../models/profile-data';
import { fbDb } from './firebase';

const LOCAL_PROFILE_KEY = 'bacpro_local_profile_v1:';
const LOCAL_SESSIONS_KEY = 'bacpro_local_sessions_v1:';
const LOCAL_MESSAGES_KEY = 'bacpro_local_dev_messages_v1:';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private profileSignals = new Map<string, ReturnType<typeof signal<UserProfileData>>>();
  private sessionSignals = new Map<string, ReturnType<typeof signal<StudySession[]>>>();
  private messagesSignals = new Map<string, ReturnType<typeof signal<DeveloperMessage[]>>>();

  // ── Profil ────────────────────────────────────────────────
  async ensureUserDocument(user: AuthUserLike): Promise<void> {
    const db = fbDb();
    const defaults = profileDefaults(user) as unknown as Record<string, unknown>;
    if (!db) {
      const key = LOCAL_PROFILE_KEY + user.uid;
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.setItem(key, JSON.stringify(defaults));
        this.profileSignal(user).set(profileFromMap(defaults, user));
      } else {
        const data = JSON.parse(raw) as Record<string, unknown>;
        data['name'] = defaults['name'];
        data['email'] = defaults['email'];
        localStorage.setItem(key, JSON.stringify(data));
        this.profileSignal(user).set(profileFromMap(data, user));
      }
      return;
    }
    const ref = doc(db, 'users', user.uid);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      await setDoc(ref, {
        ...defaults,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }
    await setDoc(
      ref,
      { name: defaults['name'], email: defaults['email'], updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  /** Echivalentul watchProfile — un signal actualizat live. */
  watchProfile(user: AuthUserLike): Signal<UserProfileData> {
    const sig = this.profileSignal(user);
    const db = fbDb();
    if (db && !this.profileWatched.has(user.uid)) {
      this.profileWatched.add(user.uid);
      onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => sig.set(profileFromMap(snap.data(), user)),
        () => {},
      );
    }
    return sig.asReadonly();
  }
  private profileWatched = new Set<string>();

  async fetchProfile(user: AuthUserLike): Promise<UserProfileData> {
    const db = fbDb();
    if (!db) {
      const raw = localStorage.getItem(LOCAL_PROFILE_KEY + user.uid);
      return profileFromMap(raw ? JSON.parse(raw) : undefined, user);
    }
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    return profileFromMap(snapshot.data(), user);
  }

  async updateProfile(
    user: AuthUserLike,
    patch: { name?: string; school?: string; selectedProfile?: string },
  ): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates['name'] = patch.name.trim();
    if (patch.school !== undefined) updates['school'] = patch.school.trim();
    if (patch.selectedProfile !== undefined) updates['selectedProfile'] = patch.selectedProfile;
    await this.mergeUserDoc(user, updates);
  }

  async completeOnboarding(
    user: AuthUserLike,
    name: string,
    selectedProfile: string,
    currentGrade: number,
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      selectedProfile,
      currentGrade,
      onboardingCompleted: true,
    };
    if (name.trim() !== '') updates['name'] = name.trim();
    await this.mergeUserDoc(user, updates);
  }

  async updateSettings(
    user: AuthUserLike,
    patch: Partial<Pick<
      UserProfileData,
      'darkMode' | 'haptics' | 'autoSave' | 'dailyReminder' | 'examAlerts' | 'streakReminder' | 'gradeUpdates'
    >>,
  ): Promise<void> {
    await this.mergeUserDoc(user, { ...patch });
  }

  private async mergeUserDoc(user: AuthUserLike, updates: Record<string, unknown>): Promise<void> {
    const db = fbDb();
    if (!db) {
      const key = LOCAL_PROFILE_KEY + user.uid;
      const data = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
      Object.assign(data, updates);
      localStorage.setItem(key, JSON.stringify(data));
      this.profileSignal(user).set(profileFromMap(data, user));
      return;
    }
    await setDoc(doc(db, 'users', user.uid), { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  }

  // ── Sesiuni ───────────────────────────────────────────────
  watchSessions(user: AuthUserLike): Signal<StudySession[]> {
    const sig = this.sessionsSignal(user);
    const db = fbDb();
    if (db && !this.sessionsWatched.has(user.uid)) {
      this.sessionsWatched.add(user.uid);
      const q = query(
        collection(db, 'users', user.uid, 'sessions'),
        orderBy('completedAt', 'desc'),
      );
      onSnapshot(
        q,
        (snap) => sig.set(snap.docs.map((d) => this.sessionFromDoc(d.id, d.data()))),
        () => {},
      );
    }
    return sig.asReadonly();
  }
  private sessionsWatched = new Set<string>();

  async addSession(user: AuthUserLike, session: Omit<StudySession, 'id'>): Promise<void> {
    const db = fbDb();
    if (!db) {
      const key = LOCAL_SESSIONS_KEY + user.uid;
      const list = this.localSessions(user);
      list.unshift({ ...session, id: 'sess_' + Date.now() });
      list.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      localStorage.setItem(
        key,
        JSON.stringify(list.map((s) => ({ ...s, completedAt: s.completedAt.toISOString() }))),
      );
      this.sessionsSignal(user).set(list);
      return;
    }
    await addDoc(collection(db, 'users', user.uid, 'sessions'), {
      subjectName: session.subjectName,
      year: session.year,
      sessionName: session.sessionName,
      durationSeconds: session.durationSeconds,
      estimatedGrade: session.estimatedGrade,
      notes: session.notes,
      completedAt: Timestamp.fromDate(session.completedAt),
    });
  }

  async deleteAllSessions(user: AuthUserLike): Promise<void> {
    const db = fbDb();
    if (!db) {
      localStorage.removeItem(LOCAL_SESSIONS_KEY + user.uid);
      this.sessionsSignal(user).set([]);
      return;
    }
    const snapshot = await getDocs(collection(db, 'users', user.uid, 'sessions'));
    const batch = writeBatch(db);
    for (const d of snapshot.docs) batch.delete(d.ref);
    await batch.commit();
  }

  /** Șterge TOATE datele utilizatorului: subcolecția sessions + documentul
   *  users/{uid} (mesajele dezvoltator sunt câmp în doc, deci se șterg cu el). */
  async deleteUserData(user: AuthUserLike): Promise<void> {
    const db = fbDb();
    if (!db) {
      localStorage.removeItem(LOCAL_PROFILE_KEY + user.uid);
      localStorage.removeItem(LOCAL_SESSIONS_KEY + user.uid);
      localStorage.removeItem(LOCAL_MESSAGES_KEY + user.uid);
      this.sessionsSignal(user).set([]);
      return;
    }
    const snapshot = await getDocs(collection(db, 'users', user.uid, 'sessions'));
    const batch = writeBatch(db);
    for (const d of snapshot.docs) batch.delete(d.ref);
    batch.delete(doc(db, 'users', user.uid));
    await batch.commit();
  }

  // ── Feedback & mesaje dezvoltator ─────────────────────────
  async submitAppFeedback(user: AuthUserLike, rating: number, message: string): Promise<void> {
    const cleanRating = Math.min(Math.max(rating, 1), 5);
    const cleanMessage = message.trim();
    const entry = {
      rating: cleanRating,
      message: cleanMessage,
      createdAtIso: new Date().toISOString(),
    };
    const db = fbDb();
    if (!db) {
      const key = LOCAL_PROFILE_KEY + user.uid;
      const data = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
      data['lastFeedbackRating'] = cleanRating;
      data['lastFeedbackMessage'] = cleanMessage;
      data['feedbackCount'] = ((data['feedbackCount'] as number) ?? 0) + 1;
      data['feedbackHistory'] = [...((data['feedbackHistory'] as unknown[]) ?? []), entry];
      localStorage.setItem(key, JSON.stringify(data));
      return;
    }
    await setDoc(
      doc(db, 'users', user.uid),
      {
        lastFeedbackRating: cleanRating,
        lastFeedbackMessage: cleanMessage,
        lastFeedbackAt: serverTimestamp(),
        feedbackCount: increment(1),
        feedbackHistory: arrayUnion(entry),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  watchDeveloperMessages(user: AuthUserLike): Signal<DeveloperMessage[]> {
    const sig = this.messagesSignal(user);
    const db = fbDb();
    if (db && !this.messagesWatched.has(user.uid)) {
      this.messagesWatched.add(user.uid);
      onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => sig.set(this.parseMessages(snap.data()?.['developerMessages'])),
        () => {},
      );
    }
    return sig.asReadonly();
  }
  private messagesWatched = new Set<string>();

  async sendDeveloperMessage(user: AuthUserLike, message: string): Promise<void> {
    const cleanMessage = message.trim();
    if (cleanMessage === '') return;
    const now = new Date();
    const entry = {
      id: 'msg_' + now.getTime() * 1000,
      text: cleanMessage,
      status: 'new',
      createdAtIso: now.toISOString(),
    };
    const db = fbDb();
    if (!db) {
      const key = LOCAL_MESSAGES_KEY + user.uid;
      const list = (JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]);
      list.push(entry);
      localStorage.setItem(key, JSON.stringify(list));
      this.messagesSignal(user).set(this.parseMessages(list));
      return;
    }
    await setDoc(
      doc(db, 'users', user.uid),
      {
        developerMessages: arrayUnion(entry),
        developerMessagesCount: increment(1),
        lastDeveloperMessage: cleanMessage,
        lastDeveloperMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  // ── exam_pdfs (interogat, nu scris de aplicație) ──────────
  async fetchExamPdfAssets(sel: {
    profile: string;
    subject: string;
    year: string;
    session: string;
  }): Promise<ExamPdfAssets | null> {
    const db = fbDb();
    if (!db) return null;
    const base = query(
      collection(db, 'exam_pdfs'),
      where('profile', '==', sel.profile),
      where('subject', '==', sel.subject),
      where('session', '==', sel.session),
    );
    let snap = await getDocs(query(base, where('year', '==', sel.year), limit(1)));
    if (snap.empty) {
      const intYear = parseInt(sel.year, 10);
      if (!Number.isNaN(intYear)) {
        snap = await getDocs(query(base, where('year', '==', intYear), limit(1)));
      }
    }
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    const assets: ExamPdfAssets = {
      subjectPdfAsset: ((data['subjectPdfAsset'] as string) ?? '').trim(),
      answerPdfAsset: ((data['answerPdfAsset'] as string) ?? '').trim(),
    };
    return assets.subjectPdfAsset !== '' && assets.answerPdfAsset !== '' ? assets : null;
  }

  // ── intern ────────────────────────────────────────────────
  private profileSignal(user: AuthUserLike) {
    let sig = this.profileSignals.get(user.uid);
    if (!sig) {
      const raw = fbDb() ? null : localStorage.getItem(LOCAL_PROFILE_KEY + user.uid);
      sig = signal(profileFromMap(raw ? JSON.parse(raw) : undefined, user));
      this.profileSignals.set(user.uid, sig);
    }
    return sig;
  }

  private sessionsSignal(user: AuthUserLike) {
    let sig = this.sessionSignals.get(user.uid);
    if (!sig) {
      sig = signal<StudySession[]>(fbDb() ? [] : this.localSessions(user));
      this.sessionSignals.set(user.uid, sig);
    }
    return sig;
  }

  private messagesSignal(user: AuthUserLike) {
    let sig = this.messagesSignals.get(user.uid);
    if (!sig) {
      const raw = fbDb() ? null : localStorage.getItem(LOCAL_MESSAGES_KEY + user.uid);
      sig = signal<DeveloperMessage[]>(this.parseMessages(raw ? JSON.parse(raw) : []));
      this.messagesSignals.set(user.uid, sig);
    }
    return sig;
  }

  private localSessions(user: AuthUserLike): StudySession[] {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY + user.uid);
    if (!raw) return [];
    return (JSON.parse(raw) as Record<string, unknown>[]).map((d) =>
      this.sessionFromDoc((d['id'] as string) ?? '', d),
    );
  }

  private sessionFromDoc(id: string, data: Record<string, unknown>): StudySession {
    const completedAt = data['completedAt'];
    let date: Date;
    if (completedAt instanceof Timestamp) date = completedAt.toDate();
    else if (typeof completedAt === 'string') date = new Date(completedAt);
    else date = new Date(0);
    return {
      id,
      subjectName: (data['subjectName'] as string) ?? 'Subiect',
      year: (data['year'] as string) ?? '',
      sessionName: (data['sessionName'] as string) ?? '',
      durationSeconds: typeof data['durationSeconds'] === 'number' ? Math.trunc(data['durationSeconds'] as number) : 0,
      estimatedGrade: typeof data['estimatedGrade'] === 'number' ? (data['estimatedGrade'] as number) : 0,
      notes: (data['notes'] as string) ?? '',
      completedAt: date,
    };
  }

  private parseMessages(raw: unknown): DeveloperMessage[] {
    const parsed: DeveloperMessage[] = [];
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const d = item as Record<string, unknown>;
        const iso = ((d['createdAtIso'] as string) ?? '').trim();
        let createdAt: Date;
        if (iso !== '') createdAt = new Date(iso);
        else if (d['createdAt'] instanceof Timestamp) createdAt = d['createdAt'].toDate();
        else createdAt = new Date();
        const id = ((d['id'] as string) ?? '').trim();
        const status = ((d['status'] as string) ?? '').trim();
        parsed.push({
          id: id !== '' ? id : 'msg_' + createdAt.getTime(),
          text: ((d['text'] as string) ?? '').trim(),
          createdAt,
          status: status !== '' ? status : 'new',
        });
      }
    }
    parsed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return parsed;
  }
}

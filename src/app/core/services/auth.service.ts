/**
 * Port al lib/src/services/auth_service.dart.
 *
 * Cu Firebase configurat: email/parolă + Google (popup), identic cu mobile.
 * Fără config (placeholder): mod local — contul e simulat în localStorage ca
 * aplicația să fie complet utilizabilă până la lipirea config-ului real.
 */
import { Injectable, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';

import { AuthUserLike } from '../models/profile-data';
import { fbAuth, firebaseConfigured } from './firebase';

const LOCAL_USER_KEY = 'bacpro_local_user_v1';

export class AuthError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUserLike | null>(null);
  readonly ready = signal(false);

  private fbUser: User | null = null;
  private resolveReady!: () => void;
  readonly whenReady = new Promise<void>((resolve) => (this.resolveReady = resolve));

  constructor() {
    const auth = fbAuth();
    if (auth) {
      onAuthStateChanged(auth, (u) => {
        this.fbUser = u;
        this.user.set(u ? this.toLike(u) : null);
        this.ready.set(true);
        this.resolveReady();
      });
    } else {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      this.user.set(raw ? (JSON.parse(raw) as AuthUserLike) : null);
      this.ready.set(true);
      this.resolveReady();
    }
  }

  get currentUser(): AuthUserLike | null {
    return this.user();
  }

  get displayName(): string {
    const user = this.currentUser;
    const name = user?.displayName?.trim();
    if (name) return name;
    const email = user?.email?.trim();
    if (email) return email.split('@')[0];
    return 'Utilizator Bac Pro';
  }

  // ── Email & Parolă ────────────────────────────────────────
  async signInWithEmail(email: string, password: string): Promise<AuthUserLike> {
    const auth = fbAuth();
    if (!auth) return this.localSignIn(email);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return this.toLike(cred.user);
    } catch (e) {
      throw this.wrap(e);
    }
  }

  async registerWithEmail(email: string, password: string): Promise<AuthUserLike> {
    const auth = fbAuth();
    if (!auth) return this.localSignIn(email);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return this.toLike(cred.user);
    } catch (e) {
      throw this.wrap(e);
    }
  }

  async resetPassword(email: string): Promise<void> {
    const auth = fbAuth();
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      throw this.wrap(e);
    }
  }

  async updateDisplayName(name: string): Promise<void> {
    const cleanName = name.trim();
    if (cleanName === '') return;
    const auth = fbAuth();
    if (auth) {
      if (!auth.currentUser) return;
      await updateProfile(auth.currentUser, { displayName: cleanName });
      await auth.currentUser.reload();
      this.fbUser = auth.currentUser;
      this.user.set(this.toLike(auth.currentUser));
    } else {
      const user = this.currentUser;
      if (!user) return;
      const updated = { ...user, displayName: cleanName };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
      this.user.set(updated);
    }
  }

  // ── Google ────────────────────────────────────────────────
  async signInWithGoogle(): Promise<AuthUserLike | null> {
    const auth = fbAuth();
    if (!auth) {
      throw new AuthError('firebase-not-configured');
    }
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      return this.toLike(cred.user);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      // Utilizatorul a închis popup-ul — nu e o eroare (identic cu
      // googleUser == null în aplicația mobilă).
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return null;
      }
      throw this.wrap(e);
    }
  }

  // ── Sign Out ──────────────────────────────────────────────
  async signOut(): Promise<void> {
    const auth = fbAuth();
    if (auth) {
      await fbSignOut(auth);
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
      this.user.set(null);
    }
  }

  private localSignIn(email: string): AuthUserLike {
    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      throw new AuthError('invalid-email');
    }
    const uid = 'local-' + trimmed.toLowerCase();
    // La re-login în modul local, numele afișat vine din profilul salvat —
    // echivalentul displayName-ului persistat de Firebase Auth.
    let displayName: string | null = null;
    try {
      const profileRaw = localStorage.getItem('bacpro_local_profile_v1:' + uid);
      const name = profileRaw ? (JSON.parse(profileRaw) as { name?: string }).name : null;
      displayName = name && name.trim() !== '' ? name : null;
    } catch {
      displayName = null;
    }
    const user: AuthUserLike = {
      uid,
      email: trimmed,
      displayName,
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    this.user.set(user);
    return user;
  }

  private toLike(u: User): AuthUserLike {
    return { uid: u.uid, email: u.email, displayName: u.displayName };
  }

  private wrap(e: unknown): AuthError {
    const code = ((e as { code?: string }).code ?? '').replace('auth/', '');
    return new AuthError(code || 'unknown');
  }

  readonly isConfigured = firebaseConfigured;
}

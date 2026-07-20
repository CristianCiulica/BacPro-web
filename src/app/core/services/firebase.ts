/**
 * Inițializare Firebase (Auth + Firestore) — echivalentul main.dart din
 * aplicația mobilă (persistență offline activată). Inițializarea rulează
 * doar când config-ul web real a fost lipit în firebase-config.ts.
 */
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
} from 'firebase/firestore';

import { firebaseConfig, firebaseConfigured } from '../firebase-config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, { localCache: persistentLocalCache() });
  auth = getAuth(app);
}

export const fbAuth = () => auth;
export const fbDb = () => db;
export { firebaseConfigured };

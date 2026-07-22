/**
 * Config Firebase pentru aplicația Web.
 *
 * Proiectul existent: bacpro-ba190 (același folosit de aplicația mobilă).
 * Proiectul NU are încă o aplicație Web înregistrată — vezi FIREBASE_SETUP.md
 * pentru pașii exacți (2 minute), apoi lipește aici config-ul real.
 *
 * Cât timp config-ul rămâne placeholder, aplicația rulează în MOD LOCAL:
 * autentificarea și datele sunt simulate în localStorage ca să poți folosi și
 * testa întreaga aplicație. La lipirea config-ului real, totul trece automat
 * pe Firebase (Auth + Firestore), compatibil cu datele utilizatorilor din
 * aplicația mobilă.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBLHMYVQcRwqhQQIzHnrOmWPvqj0GqJsEs',
  authDomain: 'bacpro-ba190.firebaseapp.com',
  projectId: 'bacpro-ba190',
  storageBucket: 'bacpro-ba190.firebasestorage.app',
  messagingSenderId: '1083797462241',
  appId: '1:1083797462241:web:63abdb459f57d7e5616ba0',
  measurementId: 'G-ETBMQ277B6',
};

/** Adevărat doar după ce config-ul real a fost lipit mai sus. */
export const firebaseConfigured = !firebaseConfig.apiKey.startsWith('PASTE_');

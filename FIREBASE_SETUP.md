# Configurare Firebase pentru BacPro Web

Aplicația folosește proiectul Firebase existent **bacpro-ba190** (același ca
aplicația mobilă), dar proiectul nu are încă o **aplicație Web** înregistrată.
Până atunci, aplicația rulează în **mod local** (cont și date simulate în
browser). După pașii de mai jos (~2 minute), totul trece automat pe Firebase
real — login email/parolă, Google Sign-In și sincronizare Firestore,
compatibile cu datele utilizatorilor din aplicația mobilă.

## Pași

1. Deschide [Firebase Console](https://console.firebase.google.com/) și
   selectează proiectul **bacpro-ba190**.
2. În pagina principală a proiectului (Project Overview), apasă pe iconița
   **`</>`** (Add app → Web).
3. Dă-i un nume (ex. „BacPro Web"), NU bifa Firebase Hosting, apasă
   **Register app**.
4. Copiază obiectul `firebaseConfig` afișat (apiKey, appId etc.).
5. Deschide fișierul [`src/app/core/firebase-config.ts`](src/app/core/firebase-config.ts)
   și înlocuiește valorile `PASTE_API_KEY_HERE` și `PASTE_WEB_APP_ID_HERE` cu
   cele copiate (celelalte câmpuri sunt deja completate corect).
6. **Google Sign-In pe web**: în Firebase Console → Authentication →
   Settings → **Authorized domains**, asigură-te că domeniul de pe care rulezi
   aplicația e în listă (`localhost` e inclus implicit — pentru producție
   adaugă domeniul tău).
7. Repornește aplicația (`npm start`). Gata — autentificarea și Firestore
   funcționează pe web.

## Note

- Structura datelor din Firestore (colecțiile `users/{uid}`,
  `users/{uid}/sessions`, `exam_pdfs`) este identică cu cea folosită de
  aplicația mobilă — utilizatorii existenți își regăsesc contul și istoricul.
- Datele din modul local (localStorage) NU se migrează automat în Firebase.

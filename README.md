# BacPro Web

**BacPro** — pregătire pentru Bacalaureat: subiecte oficiale, timer de examen,
countdown, progres și gamificare. Rescriere completă în **Angular** (web app
optimizată pentru telefon) a aplicației mobile Flutter, funcțional identică.

## Rulare

```bash
npm install
npm start          # http://localhost:4200
```

Build de producție:

```bash
npx ng build       # rezultatul în dist/bacpro-web
```

## Firebase

Vezi [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Fără config-ul web real,
aplicația rulează în **mod local** (cont + date simulate în localStorage) ca
să poată fi folosită și testată integral; cu config-ul lipit, trece automat pe
Firebase Auth + Firestore (structuri de date identice cu aplicația mobilă).

## Funcționalități (paritate cu aplicația mobilă)

- **Autentificare**: email/parolă, Google Sign-In (popup), resetare parolă;
  mesaje de eroare identice, în română.
- **Onboarding** în 4 pași: nume → profil BAC (7 profiluri) → autoevaluare
  notă (slider 1–10) → plan estimat (aceeași formulă de câștig/țintă/săptămâni).
- **Acasă**: statistici (subiecte rezolvate, obiectiv săptămânal 5 subiecte,
  timp studiu, streak, ultima notă, inel medie), countdown BAC, materiile
  profilului selectat.
- **Subiecte**: materie → an (2020–2025) → sesiune (Iunie / Aug-Sept /
  Simulare / Specială / Model) → ecran subiect cu **timer de examen 3h**,
  documente oficiale **Subiect/Barem** (catalogul complet de PDF-uri de pe
  e3.ro / profesorjitaruionel.com, identic cu aplicația mobilă), viewer PDF
  fullscreen cu bara de timer în modul examen, autoevaluare, note personale,
  „Marchează ca rezolvat" (salvare în istoric + XP).
- **Random**: generator de subiect aleator din profilul tău.
- **Progres**: XP (100/nivel), streak, 7 badge-uri (First Task, 7 Day Streak,
  Exam Warrior, Consistent Student, Bac Machine, Night Owl, Early Bird),
  progres pe materii.
- **Istoric sesiuni**, **profil utilizator** (nume/școală/profil BAC),
  **setări** (haptics, salvare automată, export raport PDF, ștergere istoric),
  **evaluare aplicație**, **mesaje dezvoltator**, **despre**
  (termeni + politică de confidențialitate).
- **PWA**: instalabilă pe telefon (Add to Home Screen), interfață optimizată
  pentru mobil (viewport, safe-area).

## Limitări specifice web

- **Feedback-ul haptic** funcționează unde există `navigator.vibrate`
  (Android); pe iOS e no-op.
- **Export PDF**: raportul se descarcă direct (`bac_pro_raport.pdf`).
- PDF-urile subiectelor se randează în viewerul nativ al browserului (iframe),
  cu buton de deschidere în tab nou.

# BacPro Web — Analiză completă & Plan de implementare

*Actualizat: 20 iulie 2026*

## A. Starea actuală — ce e gata și funcționează

- ✅ Aplicație Angular 20 (zoneless, signals, standalone), build curat 0 erori/0 warninguri
- ✅ Design „Cupertino": paleta oficială Apple, butoane flat iOS, Liquid Glass pe tab bar, iconografie monocromă, View Transitions, layout dedicat desktop
- ✅ Toate fluxurile: auth (email + Google), onboarding 4 pași, dashboard, materie→an→sesiune→subiect cu timer 3h, viewer PDF cu retry automat, random, istoric, progres/XP/badge-uri, profil, setări, export PDF, mesaje dezvoltator, despre/termeni/confidențialitate
- ✅ PWA instalabilă (manifest + service worker + iconițe din logo), favicon BacPro
- ✅ Mod local complet funcțional (localStorage) până la configurarea Firebase
- ✅ Git inițializat, 2 commit-uri

## B. Analiză — ce lipsește, probleme găsite

### Critice (blochează lansarea reală)
| # | Problemă | Detaliu |
|---|---|---|
| B1 | **Firebase e placeholder** | Login/sincronizare reală nu funcționează; totul e în localStorage pe un singur device |
| B2 | **Nicio platformă de hosting** | Aplicația rulează doar local (`ng serve`) |
| B3 | **Reguli de securitate Firestore neverificate** | Proiectul `bacpro-ba190` are reguli scrise pentru aplicația mobilă; web-ul le va folosi pe aceleași — trebuie auditate |
| B4 | **7 fișiere necomise în git** | Risc de pierdere a muncii; lipsă remote (GitHub) |

### Importante (calitate produs)
| # | Problemă | Detaliu |
|---|---|---|
| B5 | **XP/streak/badge-uri doar pe device** | `gamification_model_v1` e în localStorage — nu se sincronizează între telefon și laptop |
| B6 | **Dependență de viewerul Google Docs** | PDF-urile remote se randează prin docs.google.com (rate-limits ocazionale, fără control) — cauza: e3.ro nu trimite CORS |
| B7 | **Fără notificare de update PWA** | Service worker instalat, dar utilizatorii nu află de versiuni noi (SwUpdate nefolosit) |
| B8 | **Note personale volatile** | Se pierd dacă ieși din subiect fără „Marchează ca rezolvat" |
| B9 | **Catalog incomplet la ne-matematică** | Română/istorie/biologie etc. au doar 2023–2025 (fallback pe cel mai recent an); baremul Informatică 2024 e duplicatul subiectului |
| B10 | **Zero teste automate** | Logica de business (catalog URL-uri, XP, streak, countdown, slug-uri) nu are nicio plasă de siguranță |

### Polish rămas (consistență design)
| # | Problemă | Detaliu |
|---|---|---|
| B11 | Gradiente rămase | bara verticală din Istoric + `ProgressBarComponent` (timer subiect) încă folosesc `accentGradient` |
| B12 | `TintedIcon` colorat rămas în 4 ecrane | set-exam-date, selection (sesiuni), subject-detail (timer), onboarding (profiluri) — de decis: gri sau păstrat |
| B13 | Dark mode inexistent | câmpul `darkMode` există în model, dar tema e doar light |
| B14 | Cod mort mărunt | CSS `.btn.lit` orfan, `subjectColor` nefolosit în RandomPick, `StatTileComponent` probabil nefolosit |
| B15 | Accesibilitate parțială | contrastul `t-section` (label-3 pe fundal) e sub AA; focus vizibil pe butoane custom de verificat |
| B16 | „Evaluează pe App Store" e no-op | rând care nu face nimic |

### Funcționalități candidate (valoare nouă)
- **Study Planner** — algoritmul complet există documentat din aplicația Flutter (generare task-uri pe 28 zile, faze foundation/practice/simulation/finalReview, ponderi materii slabe×3) — nu a fost portat (decizie anterioară), dar acum ar fi un diferențiator real
- Istoric: ștergere sesiune individuală, vizualizare note salvate, filtre pe materie/an
- Grafic evoluție note în timp (Progres)
- Căutare/filtru rapid în subiecte

---

## C. Planul detaliat

### FAZA 1 — Lansare reală în producție · **P0, ~½ zi + acțiuni în consolă**

**1.1 Firebase real** *(15 min tu + 15 min integrare)*
- [ ] Firebase Console → proiect `bacpro-ba190` → Add app → Web → copiază config
- [ ] Lipește `apiKey` + `appId` în `src/app/core/firebase-config.ts`
- [ ] Authentication → Sign-in method: verifică Email/Password și Google active
- [ ] Authentication → Settings → Authorized domains: adaugă domeniul de producție
- [ ] Test: login email real, login Google, citire/scriere sesiune, verificare că un cont din aplicația mobilă își vede istoricul
- **Acceptanță:** același cont funcționează pe mobil (Flutter) și web cu date comune

**1.2 Audit reguli Firestore** *(30 min)*
- [ ] Console → Firestore → Rules: confirmă că `users/{uid}` e accesibil doar de `request.auth.uid == uid`, subcolecția `sessions` la fel; `exam_pdfs` read-only
- [ ] Dacă nu există reguli stricte, scriem și publicăm setul minimal
- **Acceptanță:** un utilizator autentificat nu poate citi datele altuia (test cu 2 conturi)

**1.3 Git + GitHub** *(20 min)*
- [ ] Commit pentru cele 7 fișiere modificate (mesaj: design monocrom + favicon)
- [ ] Creează repo GitHub privat, push, protecție pe `main` (opțional)
- **Acceptanță:** `git status` curat, cod pe remote

**1.4 Hosting** *(45 min)*
- [ ] Firebase Hosting (natural, același proiect): `firebase init hosting` → `dist/bacpro-web/browser`, rewrite SPA `** → /index.html`
- [ ] Deploy + verificare pe telefon real: instalare PWA (Add to Home Screen), safe-area, viewer PDF pe Android/iOS real
- **Acceptanță:** aplicația live pe HTTPS, instalabilă, login Google funcțional pe domeniu

**1.5 Update flow PWA** *(30 min)*
- [ ] `SwUpdate.versionUpdates` → la versiune nouă, banner discret „Versiune nouă disponibilă · Actualizează" → `activateUpdate()` + reload
- **Acceptanță:** după un deploy, clientul vechi primește bannerul

### FAZA 2 — Conținut robust (PDF-uri) · **P1, ~1 zi**

**2.1 Proxy PDF propriu** *(½ zi)* — elimină dependența de Google Docs viewer
- [ ] Cloud Function (același proiect Firebase): `GET /pdf?url=<whitelisted>` → fetch server-side de pe e3.ro/profesorjitaruionel.com → răspuns cu `Access-Control-Allow-Origin` + cache CDN (`Cache-Control: public, max-age=86400`)
- [ ] Whitelist strict pe cele 2 domenii (anti-abuz)
- **Acceptanță:** `fetch(proxyUrl)` reușește din browser cu status 200 și content-type PDF

**2.2 Viewer pdf.js intern** *(½ zi)*
- [ ] `pdfjs-dist` bundlat local; `PdfFullscreenComponent` randează prin proxy: pagini canvas, pinch-zoom, „Pagina X din Y" (paritate cu aplicația mobilă), fallback la Google viewer dacă proxy-ul pică
- **Acceptanță:** subiect + barem randate intern pe mobil și desktop, mod examen cu timer peste, fără servicii terțe

**2.3 Completare catalog** *(2–3 h, muncă de verificare link-uri)*
- [ ] Barem corect Informatică 2024 (căutare sursă alternativă)
- [ ] Extindere ani 2020–2022 la ne-matematică unde există pe mirror-uri
- **Acceptanță:** fiecare intrare nouă verificată HTTP 200

### FAZA 3 — Sincronizare & date · **P1, ~1 zi**

**3.1 Gamificare în Firestore** *(½ zi)*
- [ ] Mută `GamificationModel` în `users/{uid}` (câmp `gamification`), cu merge la primul login: `max(xp local, xp cloud)` + uniune badge-uri/date-uri
- [ ] Păstrează localStorage ca și cache offline
- **Acceptanță:** rezolvi un subiect pe laptop → XP-ul apare pe telefon

**3.2 Note personale persistente** *(2 h)*
- [ ] Draft auto-salvat per (materie, an, sesiune) în localStorage la tastare (debounce 500ms); repopulare la revenire
- **Acceptanță:** ieși din subiect fără să salvezi, revii — nota e acolo

**3.3 Istoric îmbunătățit** *(3 h)*
- [ ] Swipe/long-press sau buton ⋯ → „Șterge sesiunea" (cu confirmare)
- [ ] Tap pe sesiune → sheet cu detalii: durată exactă, notă, notele personale salvate
- **Acceptanță:** ștergerea unei sesiuni recalculează live media/streak-ul din dashboard

### FAZA 4 — Study Planner (feature nou major) · **P2, ~2 zile**

Portarea algoritmului existent (documentat complet din Dart):
- [ ] **4.1** Modele: `StudyPlanModel` (examDate, dailyMinutes, availableWeekdays, subjects cu nivel weak/medium/good), `StudyTaskModel` (7 tipuri, 3 dificultăți) *(2 h)*
- [ ] **4.2** Serviciu generare: orizont 28 zile, faze după daysRemaining (>90 foundation / ≥30 practice / ≥7 simulation / else finalReview), 1–4 taskuri după dailyMinutes, weekend +20/+30 min, pool ponderat weak×3/medium×2/good×1, duminică = simulare + lightReview *(½ zi)*
- [ ] **4.3** Ecran setup: nivel pe materie, minute/zi (30/60/90/120), zile disponibile Lu–Du *(3 h)*
- [ ] **4.4** „Planul de azi" pe dashboard: card cu taskurile zilei, bifare → +10 XP/task, +50 XP bonus zi completă, +100 XP simulare (regulile existente din gamificare care azi stau nefolosite: `completedTasks`, `rewardedTaskIds`) *(½ zi)*
- [ ] **4.5** Vedere săptămânală (Lu–Du grupat) *(2 h)*
- [ ] Regenerare automată la schimbarea datei examenului (hook-ul există în SetExamDate din Flutter)
- **Acceptanță:** badge-urile First Task / Consistent Student / Bac Machine devin deblocabile (azi sunt imposibil de obținut — `completedTasks` e mereu 0)

### FAZA 5 — Polish final Apple · **P2, ~1 zi**

- [ ] **5.1 Dark mode** *(½ zi)*: tokens dark (canvas #0A0C12-familia, glass întunecat), comutare `prefers-color-scheme` + toggle în Setări (câmpul `darkMode` există deja în model/Firestore), meta theme-color dinamic
- [ ] **5.2 Uniformizare** *(2 h)*: elimină `accentGradient` din Istoric + ProgressBar (flat), decizie TintedIcon rămase (gri la set-exam-date & sesiuni; păstrat doar semantic la timer roșu/portocaliu/verde), șterge `.btn.lit`, `subjectColor` mort, `StatTileComponent` dacă e nefolosit
- [ ] **5.3 Accesibilitate** *(2 h)*: contrast `t-section` → label-2, `:focus-visible` pe toate controalele custom (tab bar, switch, segmented), aria-label pe butoanele doar-icon, test navigare tastatură
- [ ] **5.4 Detalii delight** *(opțional, 2 h)*: numărătoare animată pe cifra countdown, tranziție hero între tile materie → titlu subiect (View Transitions named), „Evaluează pe App Store" → link real sau ștergere rând

### FAZA 6 — Calitate inginerească · **P3, ~1 zi**

- [ ] **6.1 Teste unitare** pe logica pură *(½ zi)*: `exam-catalog` (rezolvare URL per profil/an/sesiune + excepțiile 2022/2023 + nearestYear), `gamification` (XP o dată/zi, streak gap 0/1/>1, toate condițiile de badge), `countdown` (default 29 iunie, progres), `subject-routing` (slug-uri cu diacritice/paranteze/slash), `progressFromSessions` (streak din sesiuni)
- [ ] **6.2 CI GitHub Actions** *(1 h)*: `npm ci && ng build && ng test --watch=false` pe fiecare push
- [ ] **6.3 Monitoring** *(opțional, 1 h)*: Sentry pentru erori runtime în producție
- [ ] **6.4 Documentație** *(30 min)*: actualizare README (mod local vs Firebase, arhitectură, cum rulezi testele)

---

## D. Ordinea recomandată

```
Săpt. 1:  FAZA 1 (lansare) → FAZA 3.1 (sync gamificare) → FAZA 2 (PDF robust)
Săpt. 2:  FAZA 4 (Study Planner) → FAZA 3.2–3.3
Săpt. 3:  FAZA 5 (dark mode + polish) → FAZA 6 (teste + CI)
```

**Total estimat: ~7 zile de lucru** pentru tot; **prima zi** te duce live în producție.

Singurele acțiuni care îți aparțin exclusiv ție (necesită contul tău): pașii din consola Firebase (1.1, 1.2), crearea repo-ului GitHub (1.3) și alegerea domeniului (1.4).

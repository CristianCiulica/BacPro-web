# BacPro Web

Aplicație web pentru organizarea pregătirii la Bacalaureat. Utilizatorul își alege profilul, poate parcurge subiecte pe ani și sesiuni, își cronometrează rezolvarea și păstrează un istoric al sesiunilor finalizate.

## Functionalitati
- autentificare cu email/parolă și Google, plus recuperarea parolei;
- onboarding cu nume, profil de BAC și o notă estimată;
- pagina principală cu numărul de subiecte rezolvate, obiectivul săptămânal, timpul de studiu, streak, media estimată și countdown până la BAC;
- alegerea unei materii, a anului și a sesiunii de examen;
- alegerea aleatorie a unui subiect pentru profilul selectat;
- timer de 3 ore pentru rezolvarea unui subiect;
- afișarea PDF-ului subiectului și a baremului atunci când fișierele sunt disponibile;
- evaluare proprie prin notă estimată și salvarea sesiunii ca rezolvată;
- istoric al sesiunilor, editarea profilului și alegerea datei examenului;
- setări pentru tema întunecată și feedback haptic;
- exportul istoricului într-un raport PDF;
- trimiterea de mesaje către dezvoltator, pagina Despre, Termeni și Politica de confidențialitate;
- service worker activat în build-ul de producție.


## Materiale de examen
Aplicația oferă fluxul de navigare pentru materiile, anii și sesiunile din catalog. În repository este inclus momentan un singur PDF de subiect: Matematică Mate-Info, Bacalaureat 2025, sesiunea iunie. Pentru celelalte selecții, aplicația poate afișa că materialul nu este disponibil până când PDF-urile sunt adăugate în `public/assets/subiecte/` sau configurate în Firestore.

## Date și autentificare
Aplicația este configurată pentru Firebase Authentication și Firestore. Datele de profil, sesiunile de studiu și mesajele către dezvoltator sunt stocate în Firebase pentru utilizatorul autentificat.

Tema aleasă și data countdown-ului sunt păstrate local în browser. Feedback-ul haptic depinde de suportul browserului pentru `navigator.vibrate`; pe dispozitivele care nu îl suportă nu produce efect.

## Rulare locală

Ai nevoie de Node.js și npm.

```bash
npm install
npm start
```

Aplicația va fi disponibilă la `http://localhost:4200`.

## Build de producție
```bash
npm run build
```

Fișierele generate sunt în `dist/bacpro-web`.


## Teste

```bash
npm test
```

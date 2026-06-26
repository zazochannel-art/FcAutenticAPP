# FC Autentic App

Aplicație Expo / React Native pentru administrarea clubului FC Autentic.

## Ce a fost pregătit

- Structură profesională `src/`:
  - `src/config` – configurare Supabase
  - `src/services` – servicii pentru Supabase și autentificare
  - `src/components` – componente reutilizabile
  - `src/screens` – ecrane viitoare
  - `src/navigation` – navigare viitoare
  - `src/hooks` – hook-uri reutilizabile
  - `src/constants` – culori și constante
  - `src/utils` – utilitare, inclusiv PDF
- Protecție Supabase: aplicația nu mai cade cu eroare neclară dacă lipsesc cheile `.env`.
- `.gitignore` corect pentru Expo, `.env` și `node_modules`.
- `eas.json` pentru build-uri EAS.
- `supabase-schema.sql` corectat pentru eroarea `infinite recursion detected in policy for relation profiles`.
- `authService` pregătit pentru login, register, logout și profil.

## Instalare

```bash
npm install
npm start
```

## Configurare Supabase

Creează fișierul `.env` în rădăcina proiectului:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Apoi repornește Expo cu cache curat:

```bash
npm run clear
```

## Baza de date

Rulează `supabase-schema.sql` în Supabase SQL Editor.

Important: dacă ai deja tabele/politici create, șterge politicile vechi care dădeau recursion sau rulează într-un proiect Supabase curat.

## Build Android / iOS

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

## Observație

`App.js` încă este păstrat ca fișier principal pentru a nu rupe aplicația. Următorul pas recomandat este împărțirea efectivă a lui `App.js` în ecrane separate din `src/screens`.

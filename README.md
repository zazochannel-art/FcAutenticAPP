# FC Autentic

Aplicație mobilă pentru iPhone, Android și Web, realizată cu Expo + React Native.

## Pornire locală

```bash
npm install
npm start
```

Pentru web:

```bash
npm run web
```

Pentru Android/iOS cu Expo Go:

```bash
npm start
```

Apoi scanează codul QR cu Expo Go.

## Conturi demo

- Admin: `admin@fcautentic.md` / `admin123`
- Antrenor: `antrenor@fcautentic.md` / `coach123`
- Jucător: `jucator@fcautentic.md` / `player123`
- Părinte: `parinte@fcautentic.md` / `parent123`

## Supabase

1. Creează proiect Supabase.
2. Copiază conținutul din `supabase-schema.sql` în Supabase SQL Editor și rulează scriptul.
3. Copiază `.env.example` în `.env` și completează:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Scriptul SQL este idempotent și include policy-uri RLS fără recursie pe tabela `profiles`.

## Notă

Aplicația funcționează și în mod demo fără Supabase. Datele demo se păstrează local în AsyncStorage.


## PWA / instalare pe telefon

Aplicația este pregătită pentru PWA. Pentru web/PWA rulează:

```bash
npm install
npm run pwa
```

Apoi publică folderul `dist` pe Vercel/Netlify/GitHub Pages sau orice hosting HTTPS.
Pe telefon deschide linkul în browser și alege:

- iPhone Safari: Share → Add to Home Screen
- Android Chrome: ⋮ → Install app / Add to Home screen

Fișiere PWA adăugate:
- `public/manifest.webmanifest`
- `public/service-worker.js`
- `public/offline.html`
- icon-uri pentru instalare

Important: PWA funcționează complet doar pe HTTPS sau localhost, nu direct din fișier ZIP deschis ca `file://`.

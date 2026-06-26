# FC Autentic App

Aplicație Expo React Native pentru administrarea clubului FC Autentic.

## Ce conține această versiune

- Autentificare Supabase: login/register/logout.
- Navigare cu React Navigation: Dashboard, Jucători, Antrenamente, Meciuri, Documente, Admin.
- Ecrane separate în `src/screens`.
- Servicii separate în `src/services`.
- `AdminRolesScreen`: admin poate schimba roluri și grupe permise.
- `StorageScreen`: încărcare și listare documente în Supabase Storage.
- `notificationService`: notificări locale și pregătire pentru push notifications.
- `tsconfig.json` și tipuri în `src/types` pentru migrare treptată la TypeScript.
- `supabase-schema.sql` cu tabele, RLS, politici și bucket `club-documents`.

## Instalare

```bash
npm install
cp .env.example .env
npm run clear
```

În `.env` adaugă:

```env
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=anon_key
```

## Supabase

1. Deschide Supabase SQL Editor.
2. Rulează complet `supabase-schema.sql`.
3. Creează primul cont din aplicație.
4. În SQL Editor setează primul utilizator admin:

```sql
update public.profiles
set role = 'admin'
where email = 'emailul-tau@example.com';
```

Dacă `profiles` nu are coloana `email`, folosește `id` din Auth Users sau rulează:

```sql
update public.profiles
set role = 'admin'
where full_name = 'Numele tău';
```

## Migrare TypeScript

Proiectul încă acceptă JavaScript (`allowJs: true`). Poți migra treptat fișierele:

- `App.js` → `App.tsx`
- `src/screens/*.js` → `src/screens/*.tsx`
- `src/services/*.js` → `src/services/*.ts`

## Notă

Fișierul vechi mare `App.js` a fost păstrat ca backup în:

`src/screens/LegacyApp.js`

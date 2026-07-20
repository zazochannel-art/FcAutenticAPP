# FC Autentic App

Aplicație Expo (React Native + web) pentru administrarea SaaS a cluburilor de fotbal.

## Ce conține această versiune

- Autentificare Supabase: login / register / reset parolă / logout.
- Multi-tenant: cluburi, membership-uri, abonamente, invitații (`club_id` pe toate tabelele, izolare prin RLS).
- Ecrane funcționale conectate la Supabase: Dashboard, Echipă (jucători + prezență), Antrenamente (programare + prezență), Meciuri (program + scoruri), Calendar (agregat + evenimente), Sarcini (CRUD), Staff (membri, cereri, invitații), Finanțe (tranzacții), Rapoarte AI (edge function pe datele clubului), Abonamente (schimbare plan), Admin SaaS.
- Navigare proprie pe tab-uri (fără React Navigation): `MobileBottomNav` pe mobil, `SaaSAppShell` pe desktop.
- Date prin React Query cu persistare în AsyncStorage și realtime Supabase.
- Servicii separate în `src/services` (`supabaseService`, `authService`, `storageService`, `notificationService`).
- Edge Function `supabase/functions/club-ai-analysis` pentru rapoarte AI pe datele clubului.
- `supabase/schema.sql` — schema completă a bazei de date (tabele, funcții, trigger-e, politici RLS, bucket `club-documents`), generată din baza live.
- `tsconfig.json` și tipuri în `src/types` pentru migrare treptată la TypeScript.

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

`.env` NU se comite în git (este în `.gitignore`).

## Supabase

1. Deschide Supabase SQL Editor.
2. Rulează complet `supabase/schema.sql` (idempotent — poate fi re-rulat).
3. Opțional, pentru date de test: `supabase/seed-demo.sql`.
4. Creează primul cont din aplicație, apoi setează-l super admin:

```sql
update public.profiles
set platform_role = 'super_admin', role = 'admin'
where email = 'EMAILUL_TAU';
```

Detalii în `docs/SUPABASE_SETUP.md`.

## Deploy

- **GitHub Pages** (demo): workflow-ul `.github/workflows/deploy-pages.yml` rulează la push pe `main`. Cheile Supabase se setează în GitHub → Settings → Secrets and variables → Actions: `EXPO_PUBLIC_SUPABASE_URL` și `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **Vercel**: configurat prin `vercel.json`; setează aceleași variabile în Vercel Project Settings → Environment Variables.
- **iOS/Android**: prin Expo EAS (`eas.json`), vezi `docs/IOS_ANDROID.md`.

## Migrare TypeScript

Proiectul încă acceptă JavaScript (`allowJs: true`). Poți migra treptat fișierele:

- `App.js` → `App.tsx`
- `src/screens/*.js` → `src/screens/*.tsx`
- `src/services/*.js` → `src/services/*.ts`

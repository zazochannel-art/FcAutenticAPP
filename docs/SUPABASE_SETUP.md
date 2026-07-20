# Supabase setup pentru FC Autentic SaaS

## 1. Creează proiect Supabase

În Supabase Dashboard creează un proiect nou pentru aplicație.

Ai nevoie de:

- `Project URL`
- `anon / publishable key`

Le pui în `.env.production`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=KEY
EXPO_PUBLIC_ENABLE_DEMO=false
```

Nu publica niciodată `.env.production` pe GitHub.

## 2. Rulează schema

În SQL Editor rulează:

1. `supabase/schema.sql` — schema completă (tabele, funcții, trigger-e, RLS, bucket storage)
2. opțional, pentru test: `supabase/seed-demo.sql`

## 3. Primul super admin real

După ce creezi contul real din aplicație, setează-l ca super admin (folosește emailul tău):

```sql
update public.profiles
set platform_role = 'super_admin', role = 'admin'
where email = 'EMAILUL_TAU';
```

Dacă tabela `profiles` nu are email complet pentru contul creat, caută utilizatorul în Supabase Authentication și folosește `id`.

## 4. Verificări RLS

Verifică obligatoriu:

- un club nu vede jucătorii altui club;
- `player` vede doar profilul propriu;
- `parent` vede doar copilul/copiii lui;
- `coach` vede doar grupele atribuite;
- `club_owner` vede doar clubul său;
- `super_admin` vede toate cluburile.

## 5. Demo vs producție

GitHub Pages rulează demo mode pentru prezentare.

Aplicația reală iOS/Android trebuie să ruleze cu:

```env
EXPO_PUBLIC_ENABLE_DEMO=false
```


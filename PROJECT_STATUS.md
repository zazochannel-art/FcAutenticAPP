# FC Autentic — starea proiectului

Folder oficial de lucru: `C:\Users\Igar1ok\Documents\App\fc-autentic-install-fix`

Repository public: `https://github.com/zazochannel-art/FcAutenticAPP`

Aplicație publicată: `https://zazochannel-art.github.io/FcAutenticAPP/`

## Moduri de lucru

- Demo public: GitHub Pages, cu `EXPO_PUBLIC_ENABLE_DEMO=true`.
- Producție reală: Android/iOS + Supabase real, cu `EXPO_PUBLIC_ENABLE_DEMO=false`.

## Cont demo curent

- Contul de super admin se configurează în Supabase (vezi `docs/SUPABASE_SETUP.md`).
- Credențialele NU se publică în repository — parola veche `super123` a fost expusă public și trebuie schimbată din Supabase Auth.

## Observații importante

- Nu publica arhive `.zip` / `.rar` în GitHub.
- Nu publica `.env` sau chei Supabase private.
- Pentru iOS/Android real se folosește Expo/EAS, nu PWA.
- Pentru date reale trebuie conectat Supabase și rulate migrațiile SQL.

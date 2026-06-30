# Publicare

## GitHub Pages demo

Workflow-ul `.github/workflows/deploy-pages.yml` publică automat la push pe `main`.

Pentru demo public, workflow-ul folosește:

```yaml
EXPO_PUBLIC_ENABLE_DEMO: true
GITHUB_PAGES_BASE_PATH: /FcAutenticAPP
```

Link:

`https://zazochannel-art.github.io/FcAutenticAPP/`

## Producție mobilă

Producția reală se face prin EAS, nu GitHub Pages.

Folosește:

```env
EXPO_PUBLIC_ENABLE_DEMO=false
```

și cheile reale Supabase.

## Verificare înainte de publicare

1. `npm install`
2. `npm run build:demo`
3. `npm run build:production`
4. test login demo
5. test Supabase real, dacă este conectat


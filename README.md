# FC Autentic PWA

Această variantă este pregătită pentru PWA.

## Pornire locală

```bash
npm install
npm run web
```

## Build PWA

```bash
npm run build:web
```

După build, publică folderul `dist` pe un hosting HTTPS: Vercel, Netlify, GitHub Pages etc.

Important: nu deschide `index.html` direct din fișiere (`file://`). PWA funcționează doar prin server/hosting HTTPS.

## Pe telefon

Deschide linkul aplicației în Safari/Chrome și alege:

- iPhone: Share → Add to Home Screen
- Android: menu ⋮ → Add to Home screen / Install app

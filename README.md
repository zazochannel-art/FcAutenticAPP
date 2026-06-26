# FC Autentic — Pure PWA

Această versiune este PWA curat: **React + Vite**, fără Expo și fără React Native.

## Pornire locală

```bash
npm install
npm run dev
```

## Build pentru publicare

```bash
npm run build
```

Publică folderul `dist` pe Vercel, Netlify, GitHub Pages sau alt hosting HTTPS.

## Instalare pe telefon

- iPhone: Safari → Share → Add to Home Screen
- Android: Chrome → ⋮ → Install app / Add to Home screen

## Conturi demo

- Admin: `admin@fcautentic.md` / `admin123`
- Antrenor: `antrenor@fcautentic.md` / `coach123`
- Jucător: `jucator@fcautentic.md` / `player123`
- Părinte: `parinte@fcautentic.md` / `parent123`

## Ce a fost eliminat

- `expo`
- `@expo/vector-icons`
- `react-native`
- `react-native-web`
- `babel-preset-expo`
- `app.json`
- `babel.config.js`

Datele se păstrează în `localStorage`, iar aplicația are `manifest.webmanifest` și `service-worker.js`.

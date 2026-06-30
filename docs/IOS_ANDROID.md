# Testare iOS / Android

Aplicația este Expo React Native. Pentru iOS/Android real nu o tratăm ca PWA.

## Test rapid pe telefon

Varianta recomandată:

```bash
npm run start:tunnel
```

Apoi scanezi QR-ul cu Expo Go.

## Test în aceeași rețea Wi‑Fi

```bash
npm run start:lan
```

Telefonul și calculatorul trebuie să fie în aceeași rețea.

## Build Android / iOS

Cu Expo EAS:

```bash
npx eas login
npx eas build --platform android
npx eas build --platform ios
```

Pentru iOS ai nevoie de cont Apple Developer.

## Important

- GitHub Pages este doar demo/web.
- Aplicația finală pentru club trebuie construită prin EAS.
- Pentru date reale activează Supabase și dezactivează demo mode.


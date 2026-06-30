# Plan de curățare tehnică

## Folder oficial

Lucrăm în:

`C:\Users\Igar1ok\Documents\App\fc-autentic-install-fix`

## Ce nu trebuie urcat în Git

- `node_modules/`
- `.expo/`
- `dist/`
- `.env`
- `.env.production`
- `*.zip`
- `*.rar`
- `*.log`

## Refactor recomandat pentru App.js

`App.js` are peste 4800 linii. Următoarea etapă este să fie împărțit în:

- `src/screens/WelcomeScreen.js`
- `src/screens/LoginScreen.js`
- `src/screens/DashboardScreen.js`
- `src/screens/TeamScreen.js`
- `src/screens/TrainingsScreen.js`
- `src/screens/MatchesScreen.js`
- `src/screens/FinancesScreen.js`
- `src/screens/AdminScreen.js`
- `src/data/demoData.js`
- `src/config/roles.js`
- `src/services/appStorage.js`

Refactorul trebuie făcut treptat, câte un ecran, cu test după fiecare pas.


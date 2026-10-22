# TLB Diamond (MarketingApp)

A React Native app built with Expo for the TLB Diamond marketplace. Users shop
for products, keep a wallet balance in TLB, and earn referral bonuses. The app
also contains device control screens that restrict the phone when a payment is
overdue. The repository includes an Express API in `backend/` and planning
documents.

## What the app does

- Signed-in users get five tabs: Home, Shop (marketplace), Wallet, Community
  and Profile. Extra screens include Device Status, Lock Screen, Blocking Demo
  and Chat.
- Accounts with the `admin` role get the admin navigator instead: Dashboard,
  Users, Products, Devices and Settings tabs, plus order management, financial
  dashboard, system logs, reports and chat management screens.
- Sign-in, the marketplace, the wallet and the community screen call the
  backend API first. When it cannot be reached, they fall back to built-in
  sample data and to accounts and data stored on the device with
  `expo-secure-store` (see `src/services/sharedDataService.js`). The admin
  screens do not call the API; they only use on-device and sample data.
- `src/components/mdm/` holds the device control logic: kiosk mode, staged
  blocking for overdue payments, network and app restrictions, and SIM change
  checks. It is written in JavaScript on top of React Native and Expo APIs
  (for example `expo-navigation-bar` and `expo-keep-awake`). There is no native
  lock-task module, and several parts are simulated, as the comments in those
  files explain.
- For demonstration, `src/navigation/AppNavigator.js` marks the payment as
  overdue 5 seconds after sign-in, which starts the blocking flow.
- `src/services/themeService.js` switches between an adult and an under-18
  color theme based on the user's birthday.

## Tech stack

- App: Expo SDK 54, React Native 0.81, React 19.1, React Navigation 7 (stack
  and bottom tabs), `expo-secure-store` for local storage.
- Backend: Node.js, Express 4, Sequelize 6 with SQLite (development default) or
  PostgreSQL, JWT authentication (`jsonwebtoken`, `bcryptjs`).

## Repository layout

```
index.js               Expo entry point, registers App.js
App.js                 Root component: providers and AppNavigator
app.json               Expo config (name, icons, Android/iOS identifiers)
src/
  navigation/          AppNavigator (auth, user tabs, role switch), AdminNavigator
  screens/             User screens; screens/admin/ holds the admin screens
  components/          mdm/ device control, modals/, admin/, ui/
  services/            api.js (HTTP client), sharedDataService.js (on-device data),
                       authService.js, themeService.js
  hooks/               Alert hooks
assets/                App icon, splash screen and product images
backend/               Express API (see backend/README.md)
api/endpoints.md       Planned API reference (covers more than backend/ implements)
database/schema.sql    PostgreSQL schema design (the backend creates its tables
                       from the Sequelize models instead)
design/, security/, business/
                       Planning documents
NewApp.js, OriginalApp.js
                       Earlier versions of the root component, not used by index.js
```

## Requirements

- Node.js 20.19.4 or newer (required by React Native 0.81 and Metro).
- To run on a phone: the Expo Go app. To build native projects with
  `npm run android` or `npm run ios`: Android Studio or Xcode.

## Run the app

```bash
npm install
npm start
```

`npm start` runs `expo start`. Scan the QR code with Expo Go, or press `a` or
`i` to open an Android emulator or iOS simulator.

Other scripts:

- `npm run android` / `npm run ios` run `expo run:android` / `expo run:ios`,
  which generate the native `android/` and `ios/` folders (both git-ignored) and
  build the app locally.
- `npm run web` starts the web target. `expo-secure-store` has no web
  implementation, so sign-in and stored data do not work in the browser.

### Point the app at your backend

In development builds, `src/services/api.js` sends requests to a hard-coded
remote server in `API_BASE_URL`. To use your own backend, change the
development URL to `http://<your computer's LAN IP>:3000/api/v1`; a phone or
emulator cannot reach `localhost` on your computer. Release builds use the
placeholder `https://your-production-api.com/api/v1`, which must be replaced.

## Run the backend

```bash
cd backend
npm install
npm start          # or: npm run dev (restarts on changes with nodemon)
```

On start, the server connects to the database, creates any missing tables from
the Sequelize models, creates the default admin account if it does not exist
(the credentials are printed to the console), and listens on `PORT`
(default 3000).

- `GET /health` returns the server status.
- `GET /api/v1` lists the API sections.
- Mounted routes: `/api/v1/auth`, `/api/v1/wallet`, `/api/v1/community` and
  `/api/v1/products`.

`npm run setup` runs `scripts/setup-database.js`. It drops and recreates all
tables, so existing data is lost, then adds the admin account, a sample user,
5 categories, 3 products, 3 transactions and 3 bonuses.

### Configuration

The backend loads `.env` from the folder it is started in (`backend/`) with
`dotenv`. These are the variables the code reads:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | Picks the database config; `production` also hides internal error details |
| `API_VERSION` | `v1` | URL prefix `/api/<version>` |
| `DB_DIALECT` | `sqlite` | Database in development (`sqlite` or `postgres`) |
| `DB_STORAGE` | `./database.sqlite` | SQLite file, relative to the folder the server is started from |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | `localhost`, `5432`, `tlb_diamond_db`, `tlb_admin`, built-in password | PostgreSQL connection |
| `JWT_SECRET` | none | Signs login tokens; required for register and login |
| `JWT_EXPIRE` | `7d` | Token lifetime |

With `NODE_ENV=production` the server always uses PostgreSQL, and the `DB_*`
variables have no defaults except `DB_PORT`.

`backend/.env.example` lists more variables (SMTP, uploads, rate limits, MDM,
payments, encryption, refresh tokens, `FRONTEND_URL`) that the current code
does not read. Note that copying it to `.env` sets `DB_DIALECT=postgres`.

## Known gaps

- `src/services/api.js` has methods for `/orders` and `/mdm/...` endpoints,
  but `backend/server.js` does not mount those routes yet (they are marked
  TODO), so those requests would return 404.
- `backend/package.json` defines `npm run seed` and `npm run reset`, but
  `scripts/seed-data.js` and `scripts/reset-database.js` are not in the
  repository.

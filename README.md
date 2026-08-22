# GAMEFOWL — Mobile App

React Native (Expo) client for the GAMEFOWL expert system: early bird disease monitoring and analysis for gamefowl owners. This app is a thin client — all diagnostic logic lives in the Laravel backend.

> ⚠️ Diagnostic output is a *possible condition* based on reported symptoms, never a confirmed veterinary diagnosis.

- **Backend API (this app's server):** https://github.com/rhondelp/Gamefowl-API.git

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React Native + Expo (Expo Go compatible), TypeScript |
| Styling | NativeWind (Tailwind for RN) |
| Navigation | React Navigation (native stack for auth, bottom tabs for main app) |
| Token storage | expo-secure-store (encrypted at rest — never AsyncStorage) |
| Networking | Built-in `fetch` behind a typed client (`services/api/client.ts`) |

## Getting Started

```bash
npm install
cp .env.example .env        # then point EXPO_PUBLIC_API_BASE_URL at your backend
npx expo start
```

Scan the QR code with **Expo Go** (Android/iOS). Which base URL to use:

| Where the app runs | `EXPO_PUBLIC_API_BASE_URL` |
|---|---|
| iOS Simulator | `http://localhost:8000/api/v1` |
| Android Emulator | `http://10.0.2.2:8000/api/v1` |
| Physical device via Expo Go | your PC's LAN IP, e.g. `http://192.168.1.20:8000/api/v1` |

Start the backend alongside it (`php artisan serve` in the Gamefowl-API repo).

## Project Layout

```
components/ui/   shared widgets (Button, TextField, Screen, FormError)
contexts/        AuthContext — token + user state, bootstrap/login/register/logout
navigation/      RootNavigator: Splash -> AuthStack or MainTabs based on auth
screens/auth/    Splash, Login, Register
screens/         Dashboard placeholder (real content: Milestone 10+)
services/api/    typed fetch client + auth endpoints
services/        SecureStore token persistence
types/           backend response contracts
```

## Auth Flow

1. App launch → SecureStore checked for a stored Sanctum token.
2. Token found → validated against `GET /auth/me`; valid goes to Dashboard,
   invalid clears storage and goes to Login.
3. Register/Login receive a bearer token → stored in SecureStore.
4. Logout revokes the token server-side and clears local storage.

## Scripts

```bash
npm run start     # Expo dev server
npm run android   # start + open Android emulator
npm run ios       # start + open iOS simulator
npx tsc --noEmit  # typecheck
```

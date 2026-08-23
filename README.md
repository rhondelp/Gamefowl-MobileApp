# GAMEFOWL — Mobile App

React Native (Expo) client for the GAMEFOWL expert system: early bird disease monitoring and analysis for gamefowl owners. This app is a thin client — all diagnostic logic lives in the Laravel backend.

> ⚠️ Diagnostic output is a *possible condition* based on reported symptoms, never a confirmed veterinary diagnosis.

- **Backend API (this app's server):** https://github.com/rhondelp/Gamefowl-API.git
- **E2E test record:** [`docs/e2e-test-log.md`](docs/e2e-test-log.md)

## Features

**Owners**
- Sanctum token authentication with persistent sessions (SecureStore)
- Gamefowl profile CRUD with native date pickers and soft "retire/reactivate" lifecycle
- Symptom-based health assessments against a weighted rule knowledge base
- Ranked diagnostic results with explainability (matched vs missing symptoms), care guidance, and veterinary warnings
- Merged health-history timeline (assessments + manual logbook records)
- Derived health-status badge computed server-side (`healthy / needs_attention / stale / no_data`)
- Manual health records (vet visit, weight check, vaccination, general note) with backdating
- Self-service profile editing and password change

**Admins** (role-gated tab; owners never see or reach it)
- System dashboard statistics (users, gamefowls, assessments, top symptoms/diseases, recent activity)
- User management: role/status filters, promote/demote, deactivate/restore, self-lockout prevention mirrored in UI
- Knowledge-base management: diseases, symptoms, recommendations CRUD plus weighted rule attach/edit/remove

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React Native + Expo SDK 54 (Expo Go compatible), TypeScript |
| Styling | NativeWind v4 (Tailwind for RN) |
| Navigation | React Navigation 7 (bottom tabs + nested native stacks) |
| Token storage | expo-secure-store (encrypted at rest — never AsyncStorage) |
| Networking | Built-in `fetch` behind a typed client (`services/api/client.ts`) |
| Animation | react-native-reanimated |
| Date input | @react-native-community/datetimepicker |
| Video | expo-video (cold-launch intro) |
| Testing | Jest + jest-expo |

## Getting Started

```bash
npm install
cp .env.example .env        # then point EXPO_PUBLIC_API_BASE_URL at your backend
npx expo start -c
```

Scan the QR code with **Expo Go** (Android/iOS). Which base URL to use:

| Where the app runs | `EXPO_PUBLIC_API_BASE_URL` |
|---|---|
| iOS Simulator | `http://localhost:8000/api/v1` |
| Android Emulator | `http://10.0.2.2:8000/api/v1` |
| Physical device via Expo Go | your PC's LAN IP, e.g. `http://192.168.1.20:8000/api/v1` |

Start the backend alongside it (`php artisan serve --host=0.0.0.0` in the Gamefowl-API repo) so LAN devices can reach it.

### Admin access

Registration always creates an `owner`. To test the admin section, promote an account in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Then log out/in on the device — the Admin tab appears between Dashboard and Profile.

## Architecture

State-driven routing: `RootNavigator` renders Splash → Auth stack or Main tabs purely from auth state. Each tab hosts its own native stack; the Admin tab (and every screen inside it) is registered only when the signed-in user's role is `admin`, so unregistered routes are unreachable rather than merely hidden.

```
App ─ ThemeProvider ─ AuthProvider ─ RootNavigator
                                      ├─ AuthStack          Login · Register
                                      ├─ MainTabs
                                      │   ├─ DashboardTab   Dashboard → flock flows,
                                      │   │                 assessment, history, records
                                      │   ├─ [AdminTab]     stats · users · knowledge base
                                      │   └─ ProfileTab     account · settings · security
                                      └─ ToastHost          global transient feedback
```

All HTTP calls flow through `services/api/client.ts`: one typed `request()` that attaches the bearer token, parses the backend envelope (`{success, message, data?, errors?}`), normalizes failures into `ApiError {status, message, fieldErrors}`, converts network failures into actionable messages, and centrally signs the user out on session-expiring 401s.

Form validators live as pure functions in `utils/validation.ts`, mirroring the backend Form Request rules exactly (unit-tested).

## Project Layout

```
components/ui/         Button, TextField, DatePickerField, ChipGroup, Toast,
                       Screen, EmptyState, ErrorState, EntranceView, ...
components/gamefowl/   GamefowlCard, GamefowlForm
components/assessment/ DiseaseResultCard, MatchScoreBadge, AnimatedScoreBar,
                       SymptomSelectItem, scoreTiers, contextOptions
components/history/    TimelineEntryCard, HealthStatusBadge, HealthRecordForm
components/intro/      IntroVideoScreen (cold-launch animated splash)
screens/auth/          Login, Register
screens/gamefowl/      Dashboard, My Gamefowl list, Details, Add, Edit
screens/assessment/    Symptom selection, Diagnostic Results
screens/history/       Health timeline, Log record, Record detail
screens/profile/       Profile & Settings, Edit profile, Change password
screens/admin/         Dashboard stats, Users (+detail), Diseases (+detail/form),
                       Symptoms (+form), Recommendations (+form)
hooks/                 useGamefowls, useGamefowl, useHealthHistory, useAdminUsers
contexts/              AuthContext (+authState machine), ThemeContext
services/api/          client, auth, gamefowls, symptoms, diseases,
                       healthAssessments, healthHistory, admin
services/storage.ts    SecureStore token persistence
utils/                 format helpers, form validators
types/                 Backend response contracts (api.ts, admin.ts)
__tests__/             Jest unit suites
docs/                  E2E test log, capstone documentation
```

## Auth Flow

1. App launch → optional intro video (skippable) → SecureStore checked for a stored Sanctum token.
2. Token found → validated against `GET /auth/me`; valid goes to Dashboard, invalid clears storage and goes to Login (with an explanatory banner if expiry was forced mid-session).
3. Register/Login receive a bearer token → stored in SecureStore and kept in memory for API calls.
4. Any authenticated request returning 401 triggers a central sign-out back to Login.
5. Logout revokes the token server-side and clears local storage.

## Testing

```bash
npm test            # 49 unit tests across 6 suites
npx tsc --noEmit    # typecheck
```

Unit coverage targets pure client-side logic only (validators, formatters, tier classification, envelope parsing/error normalization, the central 401 hook, and the auth state machine). Diagnostic scoring is deliberately not re-tested here — it belongs to the backend. Full manual end-to-end journeys are recorded in [`docs/e2e-test-log.md`](docs/e2e-test-log.md).

# GAMEFOWL — Capstone Documentation
## Mobile Application (Gamefowl-MobileApp)

Companion to the backend repository's README and MILESTONE_REPORTS. This document covers the mobile application's architecture, features, engineering decisions, security model, testing, and evaluation.

- **Mobile repo:** https://github.com/rhondelp/Gamefowl-MobileApp.git
- **Backend repo:** https://github.com/rhondelp/Gamefowl-API.git (Milestones 1–9, unmodified by this project's mobile sessions except where noted)
- **E2E test record:** [`e2e-test-log.md`](e2e-test-log.md)

---

## 1. System Overview

GAMEFOWL is a mobile-based expert system for early bird disease monitoring in gamefowl. It is a deliberate **knowledge-based (rule-based) expert system**, not machine learning: administrators author a knowledge base of diseases, symptoms, and weighted `(disease, symptom, weight)` rules; the backend's `DiagnosticEngine` scores submitted symptom sets with a transparent formula

```
match_score = round((Σ matched rule weights / Σ all rule weights) × 100)
```

and the mobile app presents ranked *possible conditions* with full explainability. The mobile client is intentionally thin: no scoring logic, no business rules, no local persistence of health data beyond the auth token.

**Division of responsibility**

| Layer | Owns |
|---|---|
| Backend API | Authentication (Sanctum), ownership policies, validation, expert-system engine, immutable assessment snapshots, derived health status |
| Mobile app | Presentation, form UX, client-side mirrors of validation rules for fast feedback, navigation, secure token storage |

---

## 2. Architecture

### 2.1 State-driven routing

`RootNavigator` renders one of three trees purely from auth state — there is no code path where a signed-out user reaches app content:

```
status === 'loading'    → branded splash (session revalidation)
status === 'signedOut'  → AuthStack            Login ⇄ Register
status === 'signedIn'   → MainTabs             Dashboard | [Admin] | Profile
```

Each tab hosts its own native stack (`slide_from_right` pushes). The Admin tab is registered **only** when `user.role === 'admin'`: because unregistered screens cannot be navigated to at all, this single registration point is simultaneously the tab-bar visibility control and the route-level authorization guard. The backend's 403 responses are the second layer; a central 401 handler is the third (§4).

### 2.2 Data flow

All HTTP traffic passes through one typed client (`services/api/client.ts`):

- attaches the bearer token from memory,
- parses the uniform backend envelope `{success, message, data?, errors?}`,
- normalizes every failure into `ApiError {status, message, fieldErrors}` (network failures become status-0 actionable messages),
- fires a registered handler on session-expiring 401s so any screen's failure routes the user to Login app-wide.

Feature hooks (`useGamefowls`, `useGamefowl`, `useHealthHistory`, `useAdminUsers`) wrap list/detail fetching with loading / refreshing / paginated-append states and out-of-order response protection. Screens stay presentation-focused; pure logic (validators, formatters, tier classification) lives in dependency-free modules under `utils/` and `components/assessment/scoreTiers.ts`, all unit-tested.

### 2.3 Screen inventory (26)

| Group | Screens |
|---|---|
| Auth (3) | Splash/session check · Login · Register |
| Flock (5) | Dashboard · My Gamefowl list · Bird Details · Add · Edit |
| Assessment (2) | Symptom selection (+context) · Diagnostic Results |
| History (3) | Health timeline · Log health record · Record detail |
| Account (3) | Profile & Settings · Edit profile · Change password |
| Admin (10) | Dashboard stats · Users list · User detail · Diseases list/detail/form · Symptoms list/form · Recommendations list/form |

---

## 3. Feature Documentation

### 3.1 Authentication (Milestone 9)
Sanctum bearer tokens persisted in SecureStore; validated against `GET /auth/me` at every cold launch. Wrong-password and unknown-email failures are indistinguishable (backend anti-enumeration); login is rate-limited server-side. Mid-session revocation is handled centrally: any tokened request receiving 401 clears storage, flips auth state, and lands the user on Login with an explicit "session expired" banner — while credential-type 401s (login/register) never trigger sign-out.

### 3.2 Gamefowl management (Milestone 10)
Owner-scoped CRUD via policy-protected endpoints. Profiles capture name (required), breed, date of birth/acquired (native date pickers constrained to non-future), sex enum chips, color, weight (0–20 kg), and notes. Deactivation is reversible ("retire") and visually distinct everywhere; soft-deleted rows remain invisible to owners but preserve history integrity server-side.

### 3.3 Diagnostic assessments (Milestones 11 + backend 5–6)
The core flow: Details → symptom checklist grouped by category (searchable) → optional context (duration/appetite/activity enums + notes) → submit → processing overlay → ranked Results. Results show per-condition match bars, severity, expandable plain-language explanations (**matched** symptoms vs **not reported** ones), recommended actions and prevention tips (enriched from the knowledge base), an always-present veterinary disclaimer, a no-match state that still directs to a veterinarian, and prominent vet-warning banners when severity warrants. Assessments are immutable snapshots — historical views are framed as frozen records and can never drift when the knowledge base changes later.

Hand-verifiable example pinned during testing (seeded weights): Bloody droppings (5) + Pale comb (4) + Lethargy (3) → Coccidiosis at exactly **50%** = (5+4+3)/24 × 100.

### 3.4 Health history & status (Milestones 7 + 12)
A merged, newest-first timeline interleaving engine assessments (green) and manual logbook records (amber) with type-specific iconography. Pull-to-refresh plus total-based infinite scroll (this feed exposes no `last_page`). A server-derived status badge (`healthy / needs_attention / stale / no_data`) is displayed verbatim — the client never recomputes it. Manual records support backdating (future dates rejected client- and server-side) and conditionally surface weight input for weight checks.

### 3.5 Admin surfaces (Milestones 14 + backend 4/8)
- **Dashboard stats:** user totals with role/status breakdowns, active gamefowls, total assessments, most-reported symptoms and most-suggested diseases as proportional bar lists, ten most recent assessments.
- **User management:** role/status filters, promote/demote and deactivate/restore behind confirmation dialogs; self-service actions are removed entirely for one's own account, mirroring the backend's 409 self-lockout guard in the UI rather than merely surfacing its error.
- **Knowledge base:** disease/symptom/recommendation CRUD matching backend field rules exactly; per-disease weighted-rule table with 1–5 steppers, attach flows filtered to unlinked items, and duplicate-pair server errors surfaced inline. Deactivation (never hard delete) is used for all KB entities; only rules hard-delete, per documented engine-configuration semantics.

### 3.6 Profile self-service (Milestones 15–16 + backend 9)
Name/email editing (`PATCH /auth/me`) updates cached auth state instantly without re-login; password change (`PUT /auth/me/password`) verifies the current password server-side, keeps this session signed in, and revokes other devices. Validation runs both client-side (pure functions) and server-side, with field-level inline errors.

---

## 4. Security Model

| Concern | Mechanism |
|---|---|
| Token at rest | SecureStore (encrypted); never AsyncStorage/plain logs |
| Transport | Bearer header attached centrally; never logged |
| Session expiry | Central unauthorized-handler → storage cleared → Login with explanation; credential-path 401s exempted |
| Role gating | Conditional navigator registration (route-level) + backend `admin` middleware (defense in depth) |
| Self-lockout | UI removes own-account mutations entirely; backend enforces 409 regardless |
| Anti-enumeration | Uniform 404s for foreign resources surfaced unchanged to the user |
| Input safety | Client validators mirror backend Form Requests; backend remains authoritative |

---

## 5. Testing & Evaluation

### 5.1 Automated unit tests — 49 passing across 6 suites

Scope deliberately limited to pure client-side logic; diagnostic scoring is never re-tested (backend responsibility):

| Suite | Covers |
|---|---|
| scoreTiers | match-tier boundaries (40/70) and colors |
| contextOptions | backend enum → label mapping and fallbacks |
| format | age/date/weight formatting incl. timezone-stable parsing |
| validation | gamefowl, health-record, profile, and password-change rules vs backend Form Requests |
| client | envelope parsing, ApiError normalization, network failures, central 401 hook semantics |
| authState | auth state machine transitions incl. SESSION_EXPIRED |

### 5.2 End-to-end journeys — all Pass

Three scripted journeys (new-user lifecycle, returning-user immutability/lifecycle, error paths) executed on-device against the live backend; full step-by-step record with expected results in [`e2e-test-log.md`](e2e-test-log.md). Highlights:

- Hand-calculated engine agreement: seeded weights produce Coccidiosis at exactly 50% and Newcastle Disease at 46% through the mobile UI.
- Snapshot immutability verified from the phone: oldest assessments render identically after later knowledge-base changes.
- Error paths degrade gracefully: wrong credentials, duplicate email, zero-symptom guard, airplane-mode network failure (retryable), and forced token revocation (automatic bounce to Login with explanation).

### 5.3 Defects found & fixed during integration

| ID | Finding | Resolution |
|---|---|---|
| BUG-1 | Mid-session token revocation stranded users on error screens | Central 401 handler + explanatory banner (mobile fix) |
| BUG-2/3 | Untestable duplicated validators; RN-coupled pure logic | Extracted to tested modules (mobile refactor) |
| BUG-4 | **Backend:** rule IDs serialized as `null`, making rules unaddressable by ANY client (`withPivot('weight')` omitted `'id'`) | Documented; fixed in the backend repo (`bb601b5`) — a cross-repo find that unit tests had missed |

BUG-4 is a notable evaluation artifact: it demonstrates the value of real-client integration testing over resource-level tests alone.

---

## 6. UX Engineering Decisions

- **Thin-client discipline:** status labels, scores, and statistics are rendered verbatim from the API; no derivation logic exists app-side.
- **Explainability first:** every diagnostic claim ships with matched evidence, missing evidence, care guidance, and a persistent disclaimer — aligned with the project's cautious-wording contract (*possible condition*, never *diagnosis*).
- **Destructive-action grammar:** confirmation dialogs exclusively for irreversible/significant actions (deactivate account/bird/disease, remove rule); transient toasts for ordinary success/failure feedback.
- **Validation mirroring:** identical rules client-side and server-side, so users see the same message regardless of where rejection happens.
- **Zero-invention settings:** only preferences the app can honor ship (appearance); placeholders explicitly say so.
- **Native platform behaviors:** platform-specific date pickers, native stack transitions, hardware back respected, keyboard-safe forms.

---

## 7. Limitations & Future Work

1. **Date inputs** use native pickers but no range/dependency logic (e.g., acquired-before-birth cross-check is backend-only).
2. **No offline mode** — connectivity loss yields clear retryable errors; caching/pending-sync would require a storage layer outside current scope.
3. **Admin on mobile is management-focused** — bulk operations and analytics exports remain better suited to web/API tooling.
4. **Single-language UI** (English); localization was out of scope.
5. **Push notifications** do not exist end-to-end, so none are offered in Settings.

---

## 8. Repository Map

```
docs/e2e-test-log.md        scripted journeys, results, defects
README.md                   developer-facing setup and layout
__tests__/                  Jest suites (49 tests)
components/ui/              design-system widgets
services/api/client.ts      single typed network chokepoint
contexts/authState.ts       testable auth state machine
utils/validation.ts         backend-mirroring pure validators
```

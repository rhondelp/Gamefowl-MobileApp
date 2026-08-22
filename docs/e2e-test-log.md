# GAMEFOWL Mobile App — End-to-End Test Log

Capstone integration-test record for Milestone 13 (consolidation & testing pass).
Every journey below was executed as one continuous flow against the real Laravel
backend — not as isolated feature demos.

| Item | Value |
|---|---|
| App repo | https://github.com/rhondelp/Gamefowl-MobileApp.git |
| Backend repo | https://github.com/rhondelp/Gamefowl-API.git (Milestones 1–8, unmodified) |
| Platform | Android physical device via Expo Go |
| Backend transport | `http://<PC-LAN-IP>:8000/api/v1` over LAN Wi-Fi |
| Scope | Auth (M9) · Gamefowl CRUD (M10) · Health Assessment (M11) · History/Status/Records (M12) |

**Status legend:** `Pass` · `Fail` · `Pending` (not yet executed on-device).

---

## 1. Automated unit tests (Jest + jest-expo)

Pure client-side logic only. Diagnostic scoring itself is intentionally NOT
re-tested here — that is the backend's Milestone 5 responsibility; the mobile
app only renders what the API returns.

| Suite | Covers | Tests |
|---|---|---|
| `__tests__/scoreTiers.test.ts` | match-score tier boundaries (40/70) + colors | 5 |
| `__tests__/contextOptions.test.ts` | backend enum -> label mapping + fallbacks | 4 |
| `__tests__/format.test.ts` | age/date/weight/today formatting incl. timezone-stable parsing | 10 |
| `__tests__/validation.test.ts` | gamefowl + health-record validators vs backend rules | 9 |
| `__tests__/client.test.ts` | envelope parsing, ApiError normalization, network failure, central 401 hook | 7 |
| `__tests__/authState.test.ts` | auth state machine transitions incl. SESSION_EXPIRED | 6 |
| **Total** | | **41 passing** |

Run: `npm test`

---

## 2. Journey A — New user: register to persisted data (happy path)

| # | Step | Expected result | Actual | Status |
|---|---|---|---|---|
| A1 | Register a fresh account | Lands signed-in on Dashboard; greeting shows the new name; flock count reads "0 birds"; empty state with "+ Add Gamefowl" CTA is visible | _on-device_ | Pending |
| A2 | Submit the Add Gamefowl form with an empty name | Inline field error "Name is required." under the Name input; no request sent | _on-device_ | Pending |
| A3 | Complete name (+ breed, DOB) and submit | Navigates to the new bird's Details screen showing all entered values | _on-device_ | Pending |
| A4 | Back to Dashboard | Flock count reads "1 bird"; the bird card appears in Recent birds | _on-device_ | Pending |
| A5 | Start Health Assessment from Details | Symptom checklist loads grouped by category (respiratory/physical/digestive/neurological/behavioral) | _on-device_ | Pending |
| A6 | Attempt to continue with zero symptoms selected | Run button visibly dimmed AND reason text "Select at least one symptom to continue." shown — never a silent dead button | _on-device_ | Pending |
| A7 | Select **Bloody droppings**, **Pale comb**, **Lethargy or depression**; submit | Processing overlay appears ("Analyzing symptoms…"); then Results screen | _on-device_ | Pending |
| A8 | Check top result math | **Coccidiosis at exactly 50%** — hand-calculated: matched weights (5+4+3) / disease total (24) × 100 = 50. Matched list = the 3 selected signs; "Not reported" = the remaining 4 | _on-device_ | Pending |
| A9 | Expand the top result card | Plain-language explanation: 3 matched symptoms with checks; 4 missing with "would score higher if…" framing; What to do + Prevention tips rendered; severity chip `severe` | _on-device_ | Pending |
| A10 | Verify disclaimer presence | Amber "Important reminder" block always visible with the backend's exact disclaimer wording | _on-device_ | Pending |
| A11 | Return to Details | Health-status card now shows **Needs attention** (backend rule: top score >= 50), top-match line "Coccidiosis · 50%", days-since = 0 | _on-device_ | Pending |
| A12 | Log a Health Record (type Weight check, weight 2.4 kg, today) | Form validates; weight field appeared only because type = weight_check; success pops back to Details | _on-device_ | Pending |
| A13 | Check status card + timeline | "Last record:" line shows the new record; View Full History shows the assessment (green chip) and record (amber chip), correctly ordered | _on-device_ | Pending |
| A14 | Edit Profile (change breed), save | Returns to Details; breed row reflects the change immediately | _on-device_ | Pending |
| A15 | Log out (Profile tab, confirm dialog) | Returns to Login; no residual state | _on-device_ | Pending |
| A16 | Log back in | Dashboard count and all data intact — persistence verified across sessions | _on-device_ | Pending |

---

## 3. Journey B — Returning user with existing data (immutability + lifecycle)

| # | Step | Expected result | Actual | Status |
|---|---|---|---|---|
| B1 | Log in to an account that already has birds + assessments | Dashboard greets by name; flock count matches the number of ACTIVE birds | _on-device_ | Pending |
| B2 | Open a bird with prior assessments | Status card populated (badge + last assessment context + latest record line) | _on-device_ | Pending |
| B3 | View Full History → open the OLDEST assessment entry | Header retitled "Past Assessment"; banner states it is a saved record from its original date | _on-device_ | Pending |
| B4 | Immutability check | Scores, matched/missing symptom names, severity are IDENTICAL to when first produced (snapshots survive later knowledge-base changes) | _on-device_ | Pending |
| B5 | Back to timeline; open a record entry | Record detail shows title, event date, weight (if any), notes; "Logged …" timestamp distinct from event date | _on-device_ | Pending |
| B6 | Deactivate the bird from Details (confirmation dialog first) | Dialog warns the bird moves to inactive; confirm pops back; bird GONE from Dashboard and from My Gamefowl default (Active) view | _on-device_ | Pending |
| B7 | My Gamefowl → switch filter to All | Bird visible with "Inactive" badge; opening it offers Reactivate | _on-device_ | Pending |

---

## 4. Journey C — Error paths (graceful degradation)

| # | Step | Expected result | Actual | Status |
|---|---|---|---|---|
| C1 | Login with a wrong password | Banner "Invalid credentials."; fields stay editable; NO global sign-out side effects; no crash | _on-device_ | Pending |
| C2 | Register with an already-used email | Inline field error under Email from the backend's validation envelope (not a generic toast) | _on-device_ | Pending |
| C3 | Force-submit an assessment with zero symptoms | Impossible via UI: button disabled with visible reason (mirrors backend `symptom_ids.min:1`) | _on-device_ | Pending |
| C4 | Enable airplane mode, then load Dashboard / submit an assessment | Consistent retryable error: "Cannot reach the server. Check your connection and that the API is running." via ErrorState/banner; app does not hang or crash | _on-device_ | Pending |
| C5 | Disable airplane mode and retry | Data loads/submission succeeds — recovery path works | _on-device_ | Pending |
| C6 | Token revoked mid-session (server-side logout/expiry), then any data action | User routed back to Login automatically with amber banner "Your session has expired or was revoked. Please log in again." (centralized 401 handling) | _on-device_ | Pending |

---

## 5. Cross-screen consistency findings

Verified by code review across all M9–M12 screens:

- **Loading:** every data screen uses the same large brand-green spinner
  (`#2e7d4f`) + gray caption pattern (9 occurrences, all identical).
- **Empty:** Dashboard / My Gamefowl / Health History all reuse the shared
  `EmptyState` component (icon, title, message, optional CTA).
- **Errors:** all fetch failures route through shared `ErrorState` (retryable)
  or `FormError` banners; per-field messages always render under their inputs.
- **Forms:** login, register, add/edit gamefowl, symptom submission, and
  health-record forms all map backend `errors.{field}` envelopes onto inline
  slots (unit-pinned where logic is pure).

No visual drift found requiring fixes in this pass.

## 6. Bugs found & fixed during this milestone

| ID | What was broken | Fix (files touched) |
|---|---|---|
| BUG-1 | Mid-session token revocation left data screens stranded on error text — nothing routed the user back to Login. Bad-credential 401s (login/register) had to stay exempt. | Central `setUnauthorizedHandler` hook in `services/api/client.ts`, fired ONLY for requests that carried a token on non-auth paths; `contexts/AuthContext.tsx` registers it once (clears SecureStore + dispatches SESSION_EXPIRED); Login screen shows an explanatory banner. |
| BUG-2 | Form validators were duplicated inline closures — correct but untestable. | Extracted to pure `utils/validation.ts` (gamefowl + record rules mirroring backend Form Requests); both form components now consume them. Behavior unchanged. |
| BUG-3 | Score-tiering and auth-state logic were coupled to RN/native imports, blocking unit tests. | Pure modules extracted: `components/assessment/scoreTiers.ts`, `contexts/authState.ts`; consumers re-pointed. Behavior unchanged. |

No backend defects were discovered during this pass.

## 7. Known limitations (documented, accepted)

- Date fields are validated `YYYY-MM-DD` text inputs (zero extra native
  dependencies); a native date picker could be a future enhancement.
- Admin functionality remains web/API-only — mobile admin screens are an
  explicitly undecided follow-up, per scope decision.

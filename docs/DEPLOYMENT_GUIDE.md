# GAMEFOWL — Web Deployment Guide (Vercel)

Step-by-step guide for hosting the app on the web so evaluators can open it directly in any browser — no install, no Expo Go. Verified against this repository's current code.

> ⚠️ **Read the HTTPS rule first (§3)** — it determines how your backend must be reachable. A hosted site cannot call an `http://` API such as `http://192.168.x.x:8000`.

---

## 1. What you end up with

| Item | Value |
|---|---|
| Public URL | `https://your-project.vercel.app` (free) |
| Content | The full GAMEFOWL app running in the browser |
| Backend requirement | Any **HTTPS-reachable** Laravel API (tunnel or deployed) |

---

## 2. Prerequisites

- Node.js installed (already required for Expo)
- Free Vercel account (vercel.com — sign in with GitHub is easiest)
- The Laravel backend runnable locally (`php artisan serve`)
- This repository cloned and `npm install` completed

---

## 3. Backend reachability — the HTTPS rule

Browsers block requests from an **HTTPS** page to an **HTTP** API ("mixed content"). Vercel always serves HTTPS, so pick one:

### Option A — Cloudflare quick tunnel (recommended for demos)

Exposes your local Laravel server at a temporary public HTTPS URL:

```bash
# one-time download: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
cloudflared tunnel --url http://localhost:8000
```

Output contains a line like:

```
+------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:          |
|  https://random-words-here.trycloudflare.com               |
+------------------------------------------------------------+
```

That `https://...trycloudflare.com` URL becomes your API base. Notes:

- Works while the command runs and your PC is on — stop it and the URL dies
- The random subdomain changes every run → you must redeploy the web build after each restart (or upgrade to a named tunnel for a stable hostname)
- No CORS certificate hassle; HTTPS is provided by Cloudflare

### Option B — Deployed backend

Host Gamefowl-API (Railway/Render/VPS + managed PostgreSQL). Use its permanent HTTPS URL as the base. Highest effort, most durable.

### Option C — Local network demo (no hosting)

If evaluation happens on your own Wi-Fi, skip web hosting entirely and demo via **Expo Go**, which can talk to plain-http LAN addresses. The HTTPS rule only applies to browser-hosted builds.

---

## 4. One-time web compatibility (already applied)

These changes are already committed; documented for reference:

| Package | Web behavior | Handling in repo |
|---|---|---|
| @react-native-community/datetimepicker | No web implementation | `DatePickerField` is platform-split: `.native.tsx` uses the picker, `.web.tsx` renders a styled `YYYY-MM-DD` input with a live not-in-future hint |
| expo-secure-store | Official web build exists (browser storage) | Works out of the box. **Security note:** tokens live in browser localStorage on web — unencrypted by design; acceptable for a demo, not for real credentials |
| expo-video | Supported (renders `<video>`) | Intro plays and skips normally |
| react-dom / react-native-web | Required runtime | Already added via `npx expo install react-dom react-native-web` |

---

## 5. Build the static web bundle

```bash
npx expo export --platform web
```

Output lands in `dist/`: `index.html` + `_expo/static/js/web/*.js` + CSS. Verified working from this repo.

**Set the API base URL before exporting.** The value is baked into the JS bundle at export time. Either:

```bash
# PowerShell — session variable picked up by Expo
$env:EXPO_PUBLIC_API_BASE_URL = "https://your-tunnel.trycloudflare.com"
npx expo export --platform web
```

or create a `.env.production` file containing `EXPO_PUBLIC_API_BASE_URL=...` and re-run the export.

Quick self-check: search the generated `dist/_expo/static/js/web/*.js` for your URL string to confirm it was baked in.

---

## 6. Deploy to Vercel

### Path A — Drag and drop (zero CLI)

1. Go to vercel.com → sign in → **Add New… → Project**
2. Alternatively use the simpler **Storage/Deploy** flow: vercel.com/new supports dragging a folder via the "Deploy without Git" flow using `vercel` CLI (Path B) or third-party drop tools
3. Easiest no-account-friction variant: install the CLI once (`npm i -g vercel`) then from this folder:
   ```bash
   cd dist
   vercel deploy --prod
   ```
   First run asks to log in and link a project — accept the defaults.
4. Vercel prints your production URL, e.g. `https://gamefowl.vercel.app`

### Path B — Git-integrated (auto-redeploys)

1. Push this repo to GitHub
2. vercel.com → **Add New Project** → import the repo
3. Framework preset: **Other** · Build command: `npx expo export --platform web` · Output dir: `dist`
4. Add env var `EXPO_PUBLIC_API_BASE_URL` in project settings (Vercel runs the build in the cloud)
5. Every future push to `main` redeploys automatically

---

## 7. Cross-origin (CORS) check

The browser will now call your API from a different origin (`vercel.app`). Laravel's default CORS config allows `api/*` routes from all origins, which works unchanged. If requests fail with a CORS error in the console:

```bash
php artisan config:publish cors
```

then in `config/cors.php` set `allowed_origins` to include your Vercel domain (e.g. `https://gamefowl.vercel.app`) and clear config caches. This edit belongs in the **backend** repo.

---

## 8. Evaluator instructions (copy-paste)

> Open **https://your-app.vercel.app** in Chrome or Edge.
> Register a new account (any email/password ≥ 8 characters), add a gamefowl, tick symptoms under *Start Health Assessment*, and review the ranked results. All data is stored against the live demonstration backend.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Console: "Mixed Content: … blocked" | API base URL uses `http://` | Use a Cloudflare tunnel / deployed HTTPS backend (§3) |
| Console: CORS policy error | Origin not allowed | §7 backend `config/cors.php` change |
| Login "Cannot reach the server" | Tunnel stopped, or wrong URL baked in | Restart `cloudflared`, re-export, redeploy (§5) |
| Date fields look like text boxes | Expected on web — platform fallback (§4) | Native app keeps real pickers |
| Stale page after rebuild | Browser cache | Hard reload (Ctrl+F5) |
| SecureStore warning in console | Web storage limitation | Informational only; token persists per-browser profile |

---

## 10. Quick reference — full happy path

```bash
# terminal 1 — backend
cd C:\Users\Rhondel\Gamefowl-API
php artisan serve --host=0.0.0.0

# terminal 2 — public HTTPS tunnel
cloudflared tunnel --url http://localhost:8000
# copy the printed https URL

# terminal 3 — web build + deploy
cd C:\Users\Rhondel\Gamefowl-MobileApp
$env:EXPO_PUBLIC_API_BASE_URL = "<tunnel-url>"
npx expo export --platform web
cd dist && npx vercel deploy --prod
```

Share the resulting Vercel URL.

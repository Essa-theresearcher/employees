# Deploying Coffee & Code (GitHub Pages / Vercel + Supabase + API)

This app is a **monorepo**: a Vite React frontend (`frontend/`), an Express API (`backend/`), and Prisma for PostgreSQL. The static frontend is built for **[GitHub Pages](https://pages.github.com/)** via `.github/workflows/deploy-github-pages.yml` (recommended here), or optionally **Vercel**. **Supabase** provides managed Postgres, optional **Supabase Auth** for organizers, and **Storage** for payment screenshots. The **Express API** must run on a long-lived host (Render, Railway, Fly.io, a VPS, etc.).

## What is already in the repo vs what you do

**Already in the repo (nothing for you to invent):** SPA routing support for GitHub Pages (`404.html` copy in the workflow), `frontend/vite.config.ts` base path from `VITE_BASE_PATH`, API client `VITE_API_ROOT` handling in `frontend/src/lib/api.ts`, Render-ready `PORT` usage, CORS from `CORS_ORIGIN`, SQL under `supabase/`, and **attendee check-in–gated event modules** (`frontend/src/lib/eventModules.ts` + status page sync).

**You — Supabase (dashboard):**

1. Create the project; copy **Database → URI** → you will paste it as **`DATABASE_URL`** on Render.  
2. Run **`supabase/schema.sql`** (SQL Editor) or use **`npm run db:push -w backend`** from your machine once `DATABASE_URL` points at this DB.  
3. Run **`supabase/storage.sql`** if you want registration screenshots in Storage.  
4. Copy **Project URL**, **anon** key, **service_role** key from **Settings → API**.  
5. Optional: **Authentication** → create a user whose email matches your seeded **`Admin`** row if you use Supabase sign-in for admin.

**You — Render (dashboard, your API service):**

1. Set **`DATABASE_URL`**, **`JWT_SECRET`**, **`CORS_ORIGIN`**, **`PUBLIC_APP_URL`**.  
2. Set **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** if you use Storage and/or Supabase Auth on admin routes.  
3. **`CORS_ORIGIN`** must list your **frontend origin(s)** (comma-separated, **no spaces**). The browser sends **`Origin: scheme + host + port` only** (no path). For GitHub **project** Pages at `https://user.github.io/repo/`, that header is still **`https://user.github.io`**. You may list `https://user.github.io` or the full repo URL — the API matches by **origin**. Include `http://localhost:5173` for local dev if needed.  
4. **`PUBLIC_APP_URL`** should be the full URL people use to open the app (can include the repo path), e.g. `https://YOUR_USER.github.io/YOUR_REPO`.

**You — GitHub (dashboard, frontend only):**

1. **Settings → Pages →** source **GitHub Actions** (one-time).  
2. **Settings → Secrets and variables → Actions:** set at least **`VITE_API_ROOT`** to your Render API (e.g. `https://your-service.onrender.com` — the app adds `/api` if missing). Add **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** if you use Supabase admin login in the browser.  
3. Optional **Variables**: **`VITE_BASE_PATH`** if not using the default `/repo-name/` for project Pages (see section 3 below).  
4. Push to **`main`/`master`** or **Actions → Run workflow** to rebuild after any secret change.

**Order that usually works:** Supabase ready → Render env set and service healthy (`GET /health` or `/api/health`) → GitHub secrets set → workflow green → open Pages URL and test register/login.

**Register page / “Event not configured”:** The public `GET /api/event` endpoint reads a single **`EventSettings`** row (`singletonKey: 1`). If you ran **`db:push`** but never **seed**, that row is missing and the API returns **503** with message **`Event not configured`**. Fix: from your machine with `DATABASE_URL` pointing at the same Supabase DB as Render, run **`npm run db:seed -w backend`**, or insert/update **`EventSettings`** in Supabase SQL / Table Editor. If the red text mentions CORS or “could not reach the API”, fix **`VITE_API_ROOT`** on GitHub Actions and **`CORS_ORIGIN`** on Render to match your live site origin.

**HTTP 500 “Internal server error” from the API:** Usually an unhandled exception (often **Prisma / database**). On Render → **Logs** for the service and reproduce the request; stack traces appear there. Common fixes: **`DATABASE_URL`** must match the Supabase project Render uses (add **`?sslmode=require`** if SSL errors appear in logs). After deploying this repo’s latest backend, generic 500 responses may include a **`hint`**; set **`EXPOSE_SERVER_ERRORS=true`** on Render only while debugging to add a **`detail`** field to JSON errors, then remove it.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Database**  
   - Settings → Database → copy the **URI** (port `5432`). Use it as `DATABASE_URL` for Prisma.  
   - Optional: use the **connection pooler** (port `6543`) for the API in production if you add `?pgbouncer=true` and follow Prisma’s pooled connection notes.
3. **SQL schema**  
   - Preferred: from the repo root, with `DATABASE_URL` set in `backend/.env`, run:
     - `npm install` (or `npm ci` on Linux CI)
     - `npm run db:push -w backend`
     - `npm run db:seed -w backend`  
   - Alternative: paste `supabase/schema.sql` into the Supabase SQL Editor and run it on an empty database (then still run the seed with Prisma, or insert `Admin` / `EventSettings` manually).
4. **Storage**  
   - Enable Storage if prompted.  
   - Run `supabase/storage.sql` in the SQL Editor to create the `registration-uploads` bucket and public read policy.  
   - Set backend env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `SUPABASE_STORAGE_BUCKET` (default `registration-uploads`).  
   - With these set, new registration screenshots are uploaded to the bucket and **full public URLs** are stored in `Registration.screenshotPath` (no reliance on the API’s local disk).
5. **Supabase Auth (optional, recommended for production)**  
   - Authentication → add a user with the **same email** as your Prisma `Admin` row (created by seed, e.g. `admin@coffeeandcode.com`).  
   - Set frontend env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.  
   - The admin UI will sign in with Supabase; the API accepts the Supabase **access token** on `Authorization: Bearer …` and checks it with the service role, then ensures that email exists in the `Admin` table.  
   - If you omit Supabase Auth env vars on the frontend, login falls back to `POST /api/admin/login` (bcrypt + JWT).

## 2. API hosting (Express)

1. Build command (example): `npm install && npm run build -w backend` (use `npm ci` on Linux if you prefer a clean lockfile install).  
2. Start command: `npm run start -w backend` (runs `node dist/server.js`).  
3. Set environment variables (see root `.env.example`): at minimum `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PUBLIC_APP_URL`, and for cloud uploads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.  
4. Expose the app at a stable HTTPS URL. If the app is mounted at the root, routes are `/api/...` and `/health` as in `backend/src/app.ts`.  
5. `CORS_ORIGIN` must include your **GitHub Pages** (or Vercel) frontend origin, for example `https://YOUR_USER.github.io` or `https://YOUR_USER.github.io/REPO_NAME` depending on how you host Pages (comma-separated list, no spaces).

## 3. GitHub Pages (frontend)

The workflow **Deploy frontend to GitHub Pages** runs on pushes to **`main`** or **`master`** and on **manual** “Run workflow”.

### One-time GitHub setup

1. Repository → **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions** (not “Deploy from a branch” using `gh-pages` unless you change the workflow).
2. **Actions** tab: confirm the workflow is allowed to run (Settings → Actions → General, if your org restricts workflows).
3. **Secrets and variables** → **Actions**:
   - **Secrets** (recommended for keys and URLs that embed credentials):

     | Name | Purpose |
     |------|---------|
     | `VITE_API_ROOT` | **Required** for GitHub Pages: full Render origin, e.g. `https://your-service.onrender.com` (omit trailing `/api`; the app adds it). If this is missing at build time, the browser calls `/api` on `github.io` and you get **HTML / 404** errors. |
     | `VITE_SUPABASE_URL` | Optional; Supabase project URL |
     | `VITE_SUPABASE_ANON_KEY` | Optional; Supabase anon key |

   - **Variables** (non-sensitive; optional):

     | Name | Purpose |
     |------|---------|
     | `VITE_BASE_PATH` | If unset, the workflow defaults to **`/REPO_NAME/`** for a **project site** (`https://user.github.io/repo/`). Set to **`/`** for a **user/org site** at the domain root or a custom domain at `/`. Must match how the site is served (see `frontend/vite.config.ts` `base`). |
     | `VITE_ASSET_ORIGIN` | Optional legacy asset origin |
     | `VITE_WHATSAPP_URL` | Optional contact link |

4. Push to **`master`** or **`main`**, or run the workflow manually. After the first successful deploy, **Settings → Pages** shows the public URL.

### Behavior

- **Attendee event modules** (teams, Q&amp;A, polls, leaderboard, certificates, display URLs) unlock **in the browser** only after the attendee is **checked in** and opens their **`/status/:registrationId`** page once on that device (`sessionStorage`). **Admins** with a session token bypass the gate; **`/judge`** is always reachable for judges.
- Install uses **`npm install`** (not `npm ci`) on Ubuntu so macOS-generated lockfiles do not hit Rollup **`EBADPLATFORM`** on Linux.
- Build: **`npm run build -w frontend`** from the monorepo root.
- **`404.html`** is a copy of **`index.html`** so client-side routes work when users refresh a deep link (GitHub Pages serves `404.html` for unknown paths).

## 4. Vercel (frontend, optional)

### Vercel project settings

| Setting | Value |
|--------|--------|
| Root Directory | **Repository root (leave empty / default).** If you set this to `frontend`, Vercel uses `frontend/vercel.json` and a **standalone** install/build (no npm workspaces). Do **not** leave the dashboard build command as `npm run build -w frontend` in that case — it will fail with “No workspaces found”. |
| Framework Preset | Other, or Vite if detected |
| Install Command | `npm install --no-audit --no-fund` — see **Troubleshooting** below if the build log still shows `npm ci` |
| Build Command | `npm run build -w frontend` |
| Output Directory | `frontend/dist` |

The repo includes **`vercel.json`** with the same build/output settings and SPA **rewrites** so client-side routes work.

### Troubleshooting: `EBADPLATFORM` / `@rollup/rollup-darwin-x64` / “Command npm ci exited with 1”

1. **Dashboard overrides `vercel.json`.** In Vercel → your project → **Settings** → **General** → **Build & Development Settings**, open **Install Command**. If **Override** is enabled and the field contains `npm ci`, Vercel will keep using `npm ci` even though the repo’s `vercel.json` says `npm install`. Either **turn off** the Install Command override (recommended, so `vercel.json` applies) **or** set the override explicitly to: `npm install --no-audit --no-fund`.
2. **Root Directory** must be the **repository root** (empty / default). If it is set to `frontend`, Vercel may not use the root `vercel.json`, and `npm run build -w frontend` will not match a normal workspace install from this repo.
3. **Why:** `npm ci` installs every entry the lockfile records for Rollup’s platform-specific optional packages. On Linux that can surface `EBADPLATFORM` for macOS-only packages (`@rollup/rollup-darwin-x64`). `npm install` resolves for the current OS and skips incompatible optionals.

`npm ci` is still fine on **Render / Railway / VPS** for the API (Linux-only CI or Linux-generated lockfiles); the pain point here is **Vercel’s Linux builder + a macOS-generated lockfile + `npm ci`**.

### Troubleshooting: “No workspaces found” / `--workspace=frontend`

The root `vercel.json` uses **`npm run build -w frontend`**, which only works when npm’s current directory is the **monorepo root** (the `package.json` that defines `"workspaces"`).

1. In Vercel → **Settings** → **General** → **Root Directory**, clear the field so it is the **repository root** (recommended). Then the root `vercel.json` install/build and `outputDirectory` `frontend/dist` apply correctly.
2. If you **intentionally** set Root Directory to **`frontend`**, use the repo’s **`frontend/vercel.json`**: install `npm install`, build `npm run build`, output **`dist`**. Remove any dashboard **Build Command** override that still says `npm run build -w frontend`.
3. Vercel’s docs note that with a subdirectory root, the build **must not rely on leaving that directory** (e.g. `cd ..`) for app files. Prefer either **repo root** for this monorepo or the standalone **`frontend/vercel.json`** layout above.

### Frontend environment variables (Vercel → Settings → Environment Variables)

| Variable | Example |
|----------|---------|
| `VITE_API_ROOT` | `https://your-api.onrender.com/api` |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` (if using Supabase Auth) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_ASSET_ORIGIN` | Same origin as API if you still serve legacy `/uploads` from disk (optional) |
| `VITE_WHATSAPP_URL` | Optional |

Redeploy after changing any `VITE_*` variable.

## 5. End-to-end checks

- `GET https://your-api/health` → `{ "ok": true }`  
- Open the GitHub Pages (or Vercel) site: home, register, contact, levels.  
- Submit a test registration with an image → row appears in admin, screenshot loads (Supabase public URL or proxied `/uploads` in dev).  
- Admin login (Supabase or legacy) → payments / registrations / teams / judging / Q&A / polls / certificates behave as before.

## 6. Files reference

| File | Purpose |
|------|---------|
| `.github/workflows/deploy-github-pages.yml` | CI: build frontend and deploy to GitHub Pages |
| `.env.example` | Variable list for backend + frontend |
| `vercel.json` | Vercel build/output + SPA rewrites (when **Root Directory** is the repo root) |
| `frontend/vercel.json` | Same for Vercel when **Root Directory** is `frontend` (standalone install/build, output `dist`) |
| `supabase/schema.sql` | Postgres DDL aligned with Prisma |
| `supabase/storage.sql` | Storage bucket + read policy |

## 7. Free tier notes

- **GitHub Pages**: public static hosting; [usage limits](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) apply.  
- **Vercel** Hobby (if used): generous static hosting; watch bandwidth and build minutes.  
- **Supabase** Free: database, auth, and storage limits apply; upgrade if you hit caps.  
- **API host**: pick a free tier that supports a always-on Node process (Render/Railway/etc.).

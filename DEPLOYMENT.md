# Deploying Coffee & Code (Vercel + Supabase + API)

This app is a **monorepo**: a Vite React frontend (`frontend/`), an Express API (`backend/`), and Prisma for PostgreSQL. **Vercel** hosts the static frontend. **Supabase** provides managed Postgres, optional **Supabase Auth** for organizers, and **Storage** for payment screenshots. The **Express API** must run on a long-lived host (Render, Railway, Fly.io, a VPS, etc.) because it is not converted to Vercel serverless functions in this repository.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Database**  
   - Settings → Database → copy the **URI** (port `5432`). Use it as `DATABASE_URL` for Prisma.  
   - Optional: use the **connection pooler** (port `6543`) for the API in production if you add `?pgbouncer=true` and follow Prisma’s pooled connection notes.
3. **SQL schema**  
   - Preferred: from the repo root, with `DATABASE_URL` set in `backend/.env`, run:
     - `npm ci`
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

1. Build command: `npm ci && npm run build -w backend`  
2. Start command: `npm run start -w backend` (runs `node dist/server.js`).  
3. Set environment variables (see root `.env.example`): at minimum `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PUBLIC_APP_URL`, and for cloud uploads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.  
4. Expose the app at a stable HTTPS URL. If the app is mounted at the root, routes are `/api/...` and `/health` as in `backend/src/app.ts`.  
5. `CORS_ORIGIN` must include your **Vercel** frontend origin (comma-separated list, no spaces).

## 3. Vercel (frontend)

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
| `VITE_PUBLIC_EVENT_MODULES_OPEN_AT` | Optional ISO date for locked “levels” UX |
| `VITE_BASE_PATH` | Only if deploying under a subpath |

Redeploy after changing any `VITE_*` variable.

## 4. End-to-end checks

- `GET https://your-api/health` → `{ "ok": true }`  
- Open the Vercel site: home, register, contact, levels.  
- Submit a test registration with an image → row appears in admin, screenshot loads (Supabase public URL or proxied `/uploads` in dev).  
- Admin login (Supabase or legacy) → payments / registrations / teams / judging / Q&A / polls / certificates behave as before.

## 5. Files reference

| File | Purpose |
|------|---------|
| `.env.example` | Variable list for backend + frontend |
| `vercel.json` | Vercel build/output + SPA rewrites (when **Root Directory** is the repo root) |
| `frontend/vercel.json` | Same for Vercel when **Root Directory** is `frontend` (standalone install/build, output `dist`) |
| `supabase/schema.sql` | Postgres DDL aligned with Prisma |
| `supabase/storage.sql` | Storage bucket + read policy |

## 6. Free tier notes

- **Vercel** Hobby: generous static hosting; watch bandwidth and build minutes.  
- **Supabase** Free: database, auth, and storage limits apply; upgrade if you hit caps.  
- **API host**: pick a free tier that supports a always-on Node process (Render/Railway/etc.).

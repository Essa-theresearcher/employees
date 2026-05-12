# Coffee & Code — Event registration & payment verification

Full-stack web app for public registration, manual M-Pesa verification, admin workflow, downloadable attendee badges (PNG/PDF), and public QR verification.

## Stack

- **Frontend:** React + Vite + Tailwind CSS  
- **Backend:** Node.js + Express + Prisma + PostgreSQL  
- **Uploads:** Multer (local disk in dev)  
- **Auth:** JWT (Bearer token for admin APIs)

## Prerequisites

- Node.js **20+**
- PostgreSQL **14+**

## Quick start (local)

From the project root (`coffee-and-code/`):

```bash
npm install
```

This repo uses **npm workspaces** (`backend/` + `frontend/`); one install at the root wires up both packages.

Create a database (example name `coffee_and_code`), then configure the API:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

- `DATABASE_URL` — Postgres connection string  
- `JWT_SECRET` — long random string  
- `PUBLIC_APP_URL` — **important for QR links**, e.g. `http://localhost:5173` in dev  
- `CORS_ORIGIN` — e.g. `http://localhost:5173`  
- `PORT` — default `4000`

Apply schema + seed admin + defaults:

```bash
npm run db:push
npm run db:seed
```

Run API + web together:

```bash
npm run dev
```

- Public registration: `http://localhost:5173/`  
- Badge verification: `http://localhost:5173/verify/CC-0001` (after approval)  
- Admin login: `http://localhost:5173/admin/login`

### Default admin

- **Email:** `admin@coffeeandcode.com`  
- **Password:** `ChangeMe123!`

Change this password immediately for anything beyond local development.

## Project layout

- `backend/` — Express API, Prisma schema, uploads  
- `frontend/` — Vite React app (proxies `/api` and `/uploads` to the API in dev)

## API highlights

Public:

- `GET /api/event` — payment instructions for the registration page  
- `POST /api/registrations` — `multipart/form-data` registration + screenshot  
- `GET /api/verify/:badgeId` — JSON payload used by the verification page  

Admin (Bearer JWT):

- `POST /api/admin/login`  
- `GET /api/admin/metrics`  
- `GET /api/admin/registrations?q=&status=`  
- `PATCH /api/admin/registrations/:id` — `{ "action": "approve" | "reject", "adminNote": "..." }`  
- `GET/PATCH /api/admin/event` — editable amount & M-Pesa instructions  

## Deploy API + database on Railway

Railway runs your **Express API + Postgres**. GitHub Pages (see `.github/workflows/deploy-github-pages.yml`) or any static host can serve the **frontend**; point `VITE_API_ROOT` at your Railway URL.

### One-time setup (Railway dashboard)

1. Push this repo to GitHub.
2. In [Railway](https://railway.app), **New Project → Deploy from GitHub repo**.
3. Add **PostgreSQL** (same project).
4. Open your **API service → Settings → Root Directory** and set **`backend`** (critical — Dockerfile lives there).
5. Connect Postgres to the service: **Variables → Reference** `DATABASE_URL` from the Postgres plugin (Railway fills this automatically when linked).

### Required variables (API service)

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Provided by Railway Postgres when linked |
| `JWT_SECRET` | Long random string (generate locally: `openssl rand -hex 32`) |
| `PUBLIC_APP_URL` | Your **live frontend** URL (`https://you.github.io/repo/` or `https://your-site.pages.dev`) |
| `CORS_ORIGIN` | Same origin(s) as the frontend, comma-separated if needed |
| `PORT` | Leave unset — Railway injects `PORT`; the app reads it |

Optional:

| Variable | Purpose |
|----------|---------|
| `UPLOAD_DIR` | Default `./uploads/screenshots` inside the container (ephemeral unless you add a Railway volume). |

Each deploy runs **`releaseCommand`** from `backend/railway.toml`: `prisma db push` + `prisma db seed` (admin + event defaults). Change the default admin password after first login.

### After the API is live

- Copy the public API URL (e.g. `https://your-service.up.railway.app`).
- Frontend must call **`https://your-service.up.railway.app/api`** → set GitHub secret **`VITE_API_ROOT`** (Pages workflow) or your host’s env to that value **including `/api`**.
- QR codes use **`PUBLIC_APP_URL`** — keep it exactly where attendees open the website.

## Production notes

- Serve `frontend/dist/` as static assets and point `VITE_API_ROOT` at your public API (or same-origin `/api` behind a reverse proxy).  
- Set `PUBLIC_APP_URL` to the **public** site URL so QR codes resolve correctly.  
- Move uploads to object storage (S3/R2) for multi-instance deployments; replace Multer disk storage accordingly. Railway’s default disk is **not durable** across redeploys unless you attach a volume.  
- Integrate a real Safaricom Daraja flow later; until then, verification stays **manual via admin** as designed.

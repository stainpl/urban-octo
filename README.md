# My Blog — Fullstack (Next.js + Node/Express + TypeScript + MongoDB)

> Production-minded blog platform starter. Auth (short-lived JWT + rotated opaque refresh tokens), invite-only admin flow, admin dashboard, post editor (upload + URL images), comments, and basic UI primitives.

This README is a **copy‑paste ready** developer guide to run, develop, and prepare the app for production — no fluff. It’s intended as a commercial foundation: secure secrets, transactional email, storage, and legal checks are required before you ship it to paying clients.

---

## Quick summary

* **Frontend**: Next.js (App Router) + TypeScript + Tailwind
* **Backend**: Node + Express + TypeScript + Mongoose (MongoDB)
* **Auth**: short-lived JWT access tokens + rotated opaque refresh tokens (httpOnly cookies)
* **Key features**: Admin Dashboard, invite-based admin creation, post editor (upload or URL images), responsive image generation (Sharp), email helper (SMTP/SendGrid), basic UI primitives (Toast, Input, RoundLoader)

---

## Table of contents

1. [Getting started (dev)](#getting-started-dev)
2. [Environment variables (.env.example)](#environment-variables-envexample)
3. [Project structure (brief)](#project-structure-brief)
4. [Scripts & commands](#scripts--commands)
5. [API endpoints summary](#api-endpoints-summary)
6. [Auth / token behavior (how it works)](#auth--token-behavior-how-it-works)
7. [Admin features & flows](#admin-features--flows)
8. [Uploads & images (dev vs prod)](#uploads--images-dev-vs-prod)
9. [Security & production checklist (required before selling)](#security--production-checklist-required-before-selling)
10. [Troubleshooting common dev issues (CORS, cookies)](#troubleshooting-common-dev-issues-cors-cookies)
11. [Commercial notes & license suggestions](#commercial-notes--license-suggestions)
12. [Next recommended steps](#next-recommended-steps)

---

## Getting started (dev)

### Prereqs

* Node 18+
* pnpm (recommended) or npm / yarn
* MongoDB (local or Atlas)

### Install

```bash
# from repo root
# install server deps
cd server
pnpm install

# install client deps
cd ../client
pnpm install
```

### Environment

Copy the examples below into `server/.env` and `client/.env` and change values.

### Seed admin (one-time)

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASS` in `server/.env`, then:

```bash
cd server
pnpm run seed:admin
```

### Run dev

Open two terminals:

**Server**

```bash
cd server
pnpm dev
# or: pnpm start (if you built)
```

**Client**

```bash
cd client
pnpm dev
```

Frontend runs at `http://localhost:3000` and backend at `http://localhost:4000` by default.

---

## Environment variables (.env.example)

`server/.env`

```env
# App
PORT=4000
MONGO_URI=mongodb://localhost:27017/my-blog
APP_ORIGIN=http://localhost:3000
NODE_ENV=development

# JWT
ACCESS_TOKEN_SECRET=replace_with_long_random_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_EXPIRES_DAYS=30
REFRESH_COOKIE_NAME=jid

# Reset & invite
RESET_TOKEN_EXPIRES_HOURS=1
INVITE_EXPIRE_HOURS=72

# Email (choose SMTP or SendGrid)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
SMTP_FROM=no-reply@yourdomain.com
# or for SendGrid:
SENDGRID_API_KEY=

# Seed admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASS=ChangeMe123!

# Other
FRONTEND_URL=http://localhost:3000
```

`client/.env`

```env
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
```

---

## Project structure (brief)


```
my-blog/
├─ client/                        # Next.js frontend (app router)
│  ├─ app/
│  │  ├─ admin/
│  │  │  ├─ posts/new/page.tsx
│  │  │  └─ layout.tsx
│  │  ├─ my-blog/
│  │  └─ reset-password/page.tsx
│  ├─ components/
│  │  ├─ admin/
│  │  │  ├─ AdminLayout.tsx
│  │  │  ├─ Sidebar.tsx
│  │  │  └─ NewPostForm.tsx
│  │  └─ ui/
│  │     ├─ ToastProvider.tsx
│  │     ├─ Input.tsx
│  │     └─ RoundLoader.tsx
│  ├─ context/
│  │  └─ AuthContext.tsx
│  └─ public/
└─ server/                        # Express API
   ├─ src/
   │  ├─ controllers/
   │  │  ├─ authController.ts
   │  │  ├─ adminController.ts
   │  │  ├─ adminAuthController.ts
   │  │  ├─ postAdminController.ts
   │  │  └─ adminStatsController.ts
   │  ├─ middleware/
   │  │  └─ auth.ts
   │  ├─ models/
   │  │  ├─ User.ts
   │  │  ├─ Post.ts
   │  │  └─ Invite.ts
   │  ├─ routes/
   │  │  ├─ auth.ts
   │  │  └─ admin.ts
   │  ├─ utils/
   │  │  ├─ jwt.ts
   │  │  ├─ mailHelper.ts
   │  │  └─ upload.ts
   │  └─ index.ts
   └─ uploads/                     # dev uploads
```

---

## Scripts & commands

**Server** (example `server/package.json`)

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "seed:admin": "ts-node ./scripts/seedAdmin.ts"
}
```

**Client**

```bash
pnpm dev        # Next dev
pnpm build      # Next build
pnpm start      # Start built app
```

---

## API endpoints (summary)

**Auth**

* `POST /api/auth/register` — register (user)
* `POST /api/auth/login` — login (user)
* `POST /api/auth/refresh` — rotate refresh token (cookie)
* `POST /api/auth/logout` — logout
* `POST /api/auth/forgot-password` — start reset
* `POST /api/auth/reset-password` — consume reset (single-use)

**Admin**

* `POST /api/admin/login` — admin login (returns access token + sets refresh cookie)
* `POST /api/admin/invite` — invite admin (admin-only)
* `POST /api/admin/accept-invite` — accept invite (public link)
* `GET /api/admin/stats` — totals (admin-only)
* `GET /api/admin/posts?limit=20&page=1` — paginated posts (admin-only)
* `POST /api/admin/posts` — create post (multipart/form-data with field `featured` OR JSON with `featuredUrl`) (admin-only)

> All admin endpoints must be protected server-side with `requireAuth` + `requireRole('admin')`.

---

## Auth — how tokens behave (concise)

* **Access token**: short-lived JWT returned in JSON and stored in memory on the client (do NOT store in `localStorage`).
* **Refresh token**: opaque random string (not JWT), sent as an `httpOnly` cookie (name `jid` by default) and hashed in DB.
* **Rotation**: `/api/auth/refresh` consumes the stored hashed token, verifies, and issues a new refresh token (rotated). The server stores the new hashed token and returns a new cookie. Consumed tokens are immediately unusable — protects against replay.
* **Reset & invite tokens**: plaintext emailed tokens are hashed in DB and consumed via `findOneAndDelete` for single-use. Expire via TTL index.

Why this matters: replay protection and server-side revocation are built-in. Do not store access tokens in `localStorage`.

---

## Admin features & flows (what’s included)

* Admin dashboard with collapsible sidebar (icons-only collapse)
* Posts panel: stat boxes (count-up animation), new post flow, recent posts with server pagination (20/page)
* Invite-only admin creation: admins can invite via email; invite token is one-time and expires
* Seed admin script for initial bootstrapping
* New Post flow: title, HTML body (sanitized), categories (add/select), featured image (upload OR URL), inline image insertion in body, responsive image generation with Sharp

---

## Uploads & images (dev vs prod)

* **Dev**: local `server/uploads` served statically at `/uploads/*`.
* `makeResponsiveImages` creates multiple widths (1200, 800, 400) for `<picture>` support.
* **Prod**: use S3/Cloudinary + CDN. Move image processing to a background worker if you expect heavy uploads or large files.

---

## Troubleshooting — common dev issues

**CORS preflight / credentials error**

* Server must use: `cors({ origin: 'http://localhost:3000', credentials: true })`.
* Do **not** use `origin: '*'` with `credentials: true`.
* Client requests must include `credentials: 'include'`.
* Ensure preflight (`OPTIONS`) is handled — e.g., `app.options('*', cors(corsOptions))`.

**Cookies not set on localhost**

* `cookie.secure = true` blocks cookies on plain `http://localhost`. Use `secure: process.env.NODE_ENV === 'production'`.

**"argument handler must be a function"**

* Usually from `app.use(undefined)` — check router exports/imports. Ensure your routers export `router` (or `module.exports = router`) and you import them correctly.

**ACCESS\_TOKEN\_SECRET error on start**

* Make sure `dotenv.config()` runs before importing `jwt.ts`. A common fix: `import 'dotenv/config'` at the top of `src/index.ts`.

**npm used outer package.json when in subfolder**

* If you run `npm`/`pnpm` from the repo root while targetting a subfolder, the package manager may use the root `package.json`. `cd` into the subfolder first.

---

## Security & production checklist (required before selling)

> This checklist highlights non‑negotiable items you should complete before offering the product to paying clients.

* ✅ Use strong random secrets (use `openssl rand -hex 32` or a secret manager) for `ACCESS_TOKEN_SECRET` and any signing keys.
* ✅ Run the app under HTTPS (TLS) behind a reverse proxy (Cloudflare, Nginx, or platform-managed TLS).
* ✅ Store secrets in a secrets manager (AWS Secrets Manager, Vault, or platform env vars). Do not commit `.env`.
* ✅ Configure transactional email (SendGrid / SMTP) with verified sending domain and proper SPF/DKIM.
* ✅ Use hardened CORS and cookie flags (`SameSite=Strict/Lax` as appropriate, `HttpOnly`, `Secure` in prod).
* ✅ Rate-limit auth endpoints and important write endpoints (signup, login, invite, reset).
* ✅ Limit upload size and validate file types. Scan uploads for malware if required by your client.
* ✅ Add logging & structured error reporting (Sentry / Logflare). Don't leak secrets in logs.
* ✅ Data retention & delete flow: implement account-delete + delete related resources (uploads). Document retention policy for customers.
* ✅ Legal: Terms of Service, Privacy Policy, and Data Processing Agreement if you process EU data.
* ✅ Backups: schedule periodic DB backups and test restores.
* ✅ Compliance: check local/regional regulations for handling personal data (e.g., GDPR) and payment information if you add payments.

---

## Troubleshooting — extra tips

* If tokens not rotating, inspect `refresh` cookie on both request and response. Confirm hashed token in DB matches expected algorithm.
* For file upload errors, check `multer` limits and `content-type` headers sent from the client.
* For CORS cookie issues on hosting platforms, ensure both `APP_ORIGIN` and `FRONTEND_URL` match exactly (including trailing slash) and that `credentials` are forwarded.

---


## Next recommended steps

1. Wire a real transactional email provider (SendGrid or SMTP) and verify a sending domain.
2. Integrate S3/Cloudinary + CDN for images and update upload utils.
3. Add observability: Sentry + request instrumentation and metrics dashboard.
4. Add feature flags for client toggles and an automatic migration strategy for DB schema changes.
5. Prepare a small demo seed and a deploy document for whichever host you prefer (Vercel for frontend, DigitalOcean/AWS/GCP for backend + MongoDB Atlas).

---


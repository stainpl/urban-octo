My Blog — Fullstack (Next.js + Node/Express + TypeScript + MongoDB)

> Production-minded blog platform starter you can sell. Auth (access JWT + rotated opaque refresh tokens), admin invite flow, admin dashboard, post editor (upload + URL images), comments, and basic UI primitives.
This README is a complete, copy-pasteable guide to run, develop, and prepare the app for production.



No fluff. This is a commercial product foundation — secure secrets, transactional email, storage, and legal checks before you ship it to paying clients.


---

Quick summary

Frontend: Next.js (App Router) + TypeScript + Tailwind

Backend: Node + Express + TypeScript + Mongoose (MongoDB)

Auth: JWT access tokens + rotated opaque refresh tokens stored as httpOnly cookies

Features: Admin Dashboard, invite-based admin creation, post editor with image upload/URL, responsive images (Sharp), email helper (SendGrid/SMTP), basic UI primitives (Toast, Input, Loader)



---

Table of contents

1. Getting started (dev)


2. Environment variables (.env.example)


3. Project structure (brief)


4. Scripts & commands


5. API endpoints summary


6. Auth / token behavior (how it works)


7. Admin features & flows


8. Uploads & images (dev vs prod)


9. Security & production checklist (required before selling)


10. Troubleshooting common dev issues (CORS, cookies)


11. Commercial notes & license suggestions


12. Next recommended steps




---

Getting started (dev)

Prereqs

Node 18+

pnpm (recommended) or npm/yarn

MongoDB (local or Atlas)


Install

# from repo root
# install server deps
cd server
pnpm install

# install client deps
cd ../client
pnpm install

Environment

Copy the examples below into server/.env and client/.env and change values.

Seed admin (one-time)

Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASS in server/.env then:

cd server
pnpm run seed:admin

Run dev

Open two terminals:

Server:

cd server
pnpm dev
# or: pnpm start (if you built)

Client:

cd client
pnpm dev

Frontend runs at http://localhost:3000 and backend at http://localhost:4000 by default.


---

Environment variables (.env.example)

server/.env

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

client/.env

NEXT_PUBLIC_API_BASE=http://localhost:4000/api


---

Project structure (brief)

Copy-paste friendly tree (trimmed):

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


---

Scripts & commands

Server

# server/package.json (example)
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "seed:admin": "ts-node ./scripts/seedAdmin.ts"
}

Client

pnpm dev        # Next dev
pnpm build      # Next build
pnpm start      # Start built app


---

API endpoints (summary)

Auth

POST /api/auth/register — register (user)

POST /api/auth/login — login (user)

POST /api/auth/refresh — rotate refresh token (cookie)

POST /api/auth/logout — logout

POST /api/auth/forgot-password — start reset

POST /api/auth/reset-password — consume reset (single-use)


Admin

POST /api/admin/login — admin login (returns access token + sets refresh cookie)

POST /api/admin/invite — invite admin (admin-only)

POST /api/admin/accept-invite — accept invite (public link)

GET /api/admin/stats — totals (admin-only)

GET /api/admin/posts?limit=20&page=1 — paginated posts (admin-only)

POST /api/admin/posts — create post (multipart/form-data with field featured OR JSON with featuredUrl) (admin-only)


All admin endpoints should be protected server-side with requireAuth + requireRole('admin').


---

Auth — how tokens behave (concise)

Access token: short-lived JWT (returned in JSON, stored in memory on client)

Refresh token: opaque random string, sent as httpOnly cookie (name jid), hashed in DB.

Refresh endpoint rotates tokens: consumes stored token, issues new one, stores hashed new token. Old token becomes unusable.

Reset & invite tokens: plaintext emailed, hashed in DB, single-use via findOneAndDelete (atomic). Expire via TTL index.


Why this matters: replay protection and server-side revocation are built-in. Do not store access tokens in localStorage.


---

Admin features & flows (what’s included)

Admin dashboard with collapsible sidebar (icons-only collapse)

Posts panel: stat boxes (count-up), new post flow, recent posts with server pagination (20/page)

Invite-only admin creation: admins can invite via email; invite token is one-time and expires

Seed admin script for initial bootstrapping

New Post flow: title, HTML body (sanitized), categories (add/select), featured image (upload OR URL), inline image insertion in body, responsive image generation with sharp



---

Uploads & images (dev vs prod)

Dev: local server/uploads served statically at /uploads/*

makeResponsiveImages creates multiple widths (1200, 800, 400) for <picture> support

Prod: use S3/Cloudinary + CDN. Move image processing to background worker if you expect heavy uploads.



---

Troubleshooting — common dev issues

CORS preflight / credentials error

Ensure server uses cors({ origin: 'http://localhost:3000', credentials: true }).

Do not use origin: '*' with credentials: true.

In client fetch use credentials: 'include'.

Ensure app.options('*', cors(corsOptions)) or let cors handle preflights.


Cookies not set on localhost

Cookie secure: true will block cookies on http localhost. Use secure: process.env.NODE_ENV === 'production'.


"argument handler must be a function"

Usually from app.use(undefined) — check that your routers export export default router and you imported them correctly.


ACCESS_TOKEN_SECRET error on start

Make sure dotenv.config() runs before importing jwt.ts (do import 'dotenv/config' at top of src/index.ts).



---



Which one do you want now?

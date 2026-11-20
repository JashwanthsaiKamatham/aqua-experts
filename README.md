# 💧 AQUA-EXPERTS — cinematic water purifier store & service platform

A production-ready full-stack app for a Bengaluru water purifier business:
**one continuous WebGL film** behind the marketing page, plus real auth,
CRUD, bookings and a Gemini-powered concierge.

```
client/            React + Vite + Tailwind + Three.js  (only public code)
server/            Express API + Supabase + Gemini      (all secrets live here)
server/db/          schema.sql + auto-migration script
```

---

## 1. What is inside

| Area | Details |
| --- | --- |
| **3D** | Procedural purifier (no model files): glass tank with `MeshPhysicalMaterial` transmission, glowing UV tube, metallic body, LED display, tap. Flowing water shader, caustic floor, floating bubbles/droplets, dust motes, god rays, anamorphic flare, 5-stage fly-through, bloom + depth of field + film grain + vignette + chromatic aberration. |
| **Scroll** | Nine weighted “shots”. One scroll value drives both the DOM and the camera (`client/src/lib/scroll.js`), so picture and copy never drift apart. |
| **Auth** | Email + password, **bcrypt** hashing (server only), JWT session in `localStorage` → works across devices and survives refresh. |
| **CRUD** | Service requests (`items`): create, read, update, delete, plus AI summary — all scoped to the signed-in user. |
| **Bookings** | Public multi-step “Book a Service” form (works signed out) → `bookings` table. |
| **AI** | `POST /api/ai/generate` (modes: `assistant`, `summarize`, `recommend`, `item-summary`). Gemini is called **only** from the server. |
| **A11y** | Semantic landmarks, focus rings, keyboard-traversable carousel/accordion, skip link, `prefers-reduced-motion`, ARIA on dialogs and toggles. |
| **Performance** | Auto low-end tier (no post-processing, fewer particles), `?quality=low|high` override, render loop pauses on hidden tab. |

---

## 2. Local development

```bash
# ── backend ─────────────────────────────────────────────
cd server
cp .env.example .env          # then fill in the values
npm install
npm run db:setup              # creates tables + RLS automatically (needs DATABASE_URL)
npm run dev                   # http://localhost:8080

# ── frontend (second terminal) ──────────────────────────
cd client
npm install
npm run dev                   # http://localhost:5173  (proxies /api → :8080)
```

`client/.env` is optional locally (Vite proxies `/api`). For production set
`VITE_API_BASE_URL` to the Render URL.

---

## 3. Environment variables

### `server/.env` — NEVER exposed to the browser

| Key | Where to get it |
| --- | --- |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_ANON_KEY` | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | same page (**server only**) |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string → URI (pooler) |
| `JWT_SECRET` | any long random string (`openssl rand -hex 32`) |
| `GEMINI_API_KEY` | Google AI Studio |
| `CLIENT_URL` | the Vercel URL (comma-separated list allowed) |
| `PORT` | set automatically by Render |

### `client/.env` (production)

| Key | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<your-api>.onrender.com` |

`.gitignore` already excludes `.env`, `node_modules` and `dist`.

---

## 4. Database

`server/db/schema.sql` is applied by `npm run db:setup` and is idempotent:

* `profiles` — `id uuid pk`, `email unique`, `full_name`, `password_hash` (bcrypt), `created_at`
* `items` — `id`, `user_id → profiles`, `title`, `description`, `ai_summary`, `status`, timestamps
* `bookings` — guest-friendly service bookings
* **RLS enabled** on all three tables with own-row policies (plus `authenticated` grants).
  The API uses `service_role` and *also* filters every query by `user_id`, so ownership is enforced twice.

---

## 5. API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | – | status + which services are configured |
| POST | `/api/auth/signup` | – | create account → `{ token, user }` |
| POST | `/api/auth/login` | – | sign in → `{ token, user }` |
| GET | `/api/auth/me` | Bearer | current profile |
| PATCH | `/api/auth/me` | Bearer | update name |
| GET/POST | `/api/items` | Bearer | list / create requests |
| GET/PATCH/DELETE | `/api/items/:id` | Bearer | single request (ownership checked) |
| POST | `/api/bookings` | optional | public booking form |
| GET | `/api/bookings/mine` | Bearer | own bookings |
| POST | `/api/ai/generate` | optional | Gemini proxy |
| GET | `/api/ai/status` | – | whether the AI key is configured |

---

## 6. Deploy

* **Backend → Render** (Node web service)
  `root dir: server` · `build: npm install` · `start: npm start`
  Env: everything from `server/.env`, plus `CLIENT_URL=<vercel url>`.
* **Frontend → Vercel**
  `root dir: client` · framework **Vite** · output `dist`
  Env: `VITE_API_BASE_URL=<render url>`.

CORS is permissive for `*.vercel.app`, `*.onrender.com` and anything in
`CLIENT_URL`, so previews never break.

---

## 7. Verification

```bash
cd server
API_URL=https://<your-api> node scripts/smoke.js
```

Covers health, signup/login, bcrypt rejection, JWT, full CRUD, cross-user
isolation (RLS), AI generation + summary persistence, and booking validation.

---

## 8. Customisation

1. **Brand & prices** — `client/src/lib/config.js` (CONFIG object at the top: brand, phone, WhatsApp, products, services, FAQs).
2. **Colours** — `client/tailwind.config.js` (`aqua`, `ink`) and the CSS variables at the top of `client/src/index.css`.
3. **Camera shots** — `SHOTS` in `client/src/three/CinematicScene.jsx`; each keyframe is positioned on the weighted timeline from `client/src/lib/scroll.js` (`SECTION_WEIGHTS`).
4. **Products** — add an object to `CONFIG.products`; the showroom carousel and the 3D lineup update automatically.
5. **AI voice** — `AQUA_SYSTEM_PROMPT` in `server/src/gemini.js`.

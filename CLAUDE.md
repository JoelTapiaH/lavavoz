# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

LavoVoz is a voice-based order system for a laundry business. Staff dictate orders by voice; the backend sends the transcript to Claude (Anthropic API) to extract structured data, then saves the result to Supabase. The frontend shows active orders and lets staff change their status.

## Running the backend locally

```bash
cd backend
npm install
cp .env.example .env   # fill in real values
npm run dev            # nodemon, auto-restarts on change
npm start              # production (no auto-restart)
```

Required env vars (see `backend/.env.example`):

| Variable | Source |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role |
| `FRONTEND_URL` | Vercel URL (for CORS) |
| `PORT` | 3001 |

There are no tests and no linter configured.

## Architecture

### Frontend (`frontend/index.html`)

A single self-contained HTML file — no build step, no framework, no bundler. It uses the browser **Web Speech API** for voice capture (Chrome/Edge only, requires HTTPS). The backend URL is at lines 161–163:

```js
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://TU-BACKEND.railway.app/api';  // ← reemplazar
```

Replace `TU-BACKEND.railway.app` with the real Railway URL before deploying. The frontend also has a `<select>` for choosing the `sucursal_id` (branch/location), which is sent as `sucursalId` in the POST body.

### Backend (`backend/src/`)

Express server with two route modules:

- **`routes/pedidos.js`** — `POST /api/pedidos` (create, calls Claude), `PATCH /api/pedidos/:id/estado` (status update), `DELETE /api/pedidos/:id`
- **`routes/historial.js`** — `GET /api/historial` (paginated list with filters), `GET /api/historial/resumen` (day summary counts)

`supabase.js` exports a single Supabase client built from env vars; all routes import it directly.

The `sucursal_id` for a new order is resolved from (in order): `req.body.sucursalId`, `x-sucursal-id` header, fallback `'principal'`.

### How a voice order flows

1. Browser captures speech → raw transcript string
2. Frontend POSTs `{ transcript, sucursalId }` to `/api/pedidos`
3. Backend sends the transcript to Claude (`claude-sonnet-4-20250514`) with a system prompt that forces JSON output; the response is stripped of any markdown fences before `JSON.parse`
4. Backend parses the JSON response and inserts one row into the `pedidos` Supabase table; `transcript_original` stores the raw speech for auditability
5. Response returns the saved row; frontend renders an order card

### Database (`backend/schema.sql`)

Single table `pedidos` in Supabase (PostgreSQL). Run the SQL file once in Supabase → SQL Editor to create the table, indexes, and the `updated_at` trigger. RLS is disabled; the backend uses the `service_role` key. The file includes sample `INSERT` rows at the bottom — remove them before running in production.

Valid `estado` values: `pendiente` → `en_proceso` → `listo` → `entregado`

The `prendas` column is `JSONB`, stored as `[{"tipo": "camisa", "cantidad": 3}]`.

### Deployment

| Layer | Platform | Config file |
|---|---|---|
| Frontend | Vercel | `frontend/vercel.json` |
| Backend | Railway | `backend/railway.toml` |

Health check endpoint: `GET /api/health`

Rate limit: 60 requests / minute per IP (applied globally in `src/index.js`).

CORS origin whitelist: `FRONTEND_URL` env var + `localhost:3000` + `localhost:5500`.

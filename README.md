# ¿quién me tocó?

Amigo secreto (intercambio de regalos anónimo) como PWA. Datos y auth viven en **Neon** (Postgres + Better Auth con Google). El sorteo corre en el servidor con [`lib/draw/assign.ts`](lib/draw/assign.ts).

Hecha por [ear.dev](https://www.instagram.com/ear.dev/).

## Stack

| pieza | servicio | notas |
|-------|----------|--------|
| app | Next.js (App Router) | Vercel / local |
| auth | Neon Managed Better Auth + Google | cookies de sesión |
| datos | Neon Postgres | grupos, miembros, exclusiones, assignments |
| correos | Resend (opcional) | si hay `RESEND_API_KEY` |

No hay Starknet, Cavos ni Upstash.

## Setup local

```bash
pnpm install
cp .env.example .env.local
# pegá DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET
pnpm exec neon neon-auth enable --project-id <id> --branch production   # una vez
# aplicar schema:
# node + @neondatabase/serverless contra db/migrations/001_app.sql
pnpm dev
```

Trusted domain en Neon Auth: `http://localhost:3000` (+ dominio de prod). Google OAuth redirect: `{NEON_AUTH_BASE_URL}/callback/google`.

## Scripts

- `pnpm dev` — desarrollo
- `pnpm build` / `pnpm start`
- `pnpm typecheck`
- `pnpm test` — tests del algoritmo de sorteo

## Flujo

Login Google → dashboard → crear grupo → link `/i/{inviteToken}` → join → wishlists / exclusiones → sorteo (≥3) → cada quien ve solo su slip → reveal el día del evento.

Los grupos se borran tras `purge_after` (evento + 7 días) vía `POST /api/cron/purge`.

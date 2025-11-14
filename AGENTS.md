# Backend Agent Guide

Scope: Applies to everything under `back/`.

## Project Structure
- Keep `src/app.ts` as the single place for global middleware. Maintain the existing order: security (Helmet) → CORS → logging → `/auth` router → body parsers → `attachAuthContext` → app routers → `notFound` → `errorHandler`.
- Place new route definitions in `src/routes`, controller logic in `src/controllers`, and business/domain code in `src/services`. Reuse helpers in `src/utils` instead of duplicating logic.

## Auth & Middleware
- Better Auth is configured in `src/lib/auth.ts` with base path `/auth`. Any route beyond `/health` must protect access by mounting `requireAuth` (or by running behind middleware that sets `req.user`).
- When proxying auth endpoints or forwarding headers, use the helpers in `src/utils/http.ts` to avoid missing cookies or duplicates.

## Validation, Errors, and Responses
- Validate request payloads with `zod` inside each controller and surface issues via `ApiError` so the centralized `errorHandler` formats responses consistently.
- Controllers should stay thin: parse+validate, call a service, and send JSON. Prefer returning `{ data: ... }` or `{ message: ... }` objects rather than raw primitives.

## Data & Configuration
- All database access must go through Prisma clients from `src/lib/prisma.ts`. After editing `prisma/schema.prisma`, run `pnpm prisma:generate` and create a migration with `pnpm prisma:migrate`. Check these artifacts into version control alongside code changes.
- Define every environment variable in `src/config/env.ts` with zod validation. If you add a new variable, update the backend README and sample `.env` files.
- Use the simple logger in `src/utils/logger.ts` for structured messages rather than `console` directly.

## Tooling & Testing
- TypeScript sources compile via `pnpm build`; run it (or `pnpm dev` for smoke testing) before handing off meaningful updates.
- Jest or other test frameworks are not configured—if you add tests, document how to run them.

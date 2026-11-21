# ERP Self-Guide — Rules for Amazon Q

> **Scope:** College ERP (multi-tenant SaaS). Stack: Node.js · Express · TypeScript · Prisma (MongoDB) · React (Vite) · Redis · YN-UDP service. **Audience:** Amazon Q Developer running in this repo. These rules are MANDATORY for every feature, bug fix, or change request.

---

## 0. The Prime Directive — guide BEFORE you code

Whenever the developer asks for ANY feature, fix, or change, you MUST respond in this order:

1. **Locate first.** Read `PROJECT_MAP.md` (repo root) and find the relevant module, route file, controller, and service. If the map looks stale, tell the developer to run `npm run map:update` (in `backend/`) and re-read it.
2. **Report the exact edit points** BEFORE writing code:- Which **file(s)** to change (full path from repo root).

- Which **function(s)** / route handler.
- The approximate **line / section** (from PROJECT_MAP or by reading the file).
- What will be **impacted** downstream (other files using it).

1. **Confirm the plan**, then write the minimal change. Do NOT rewrite whole files — make surgical edits.
2. **State what to verify** after (which command, which screen/endpoint).

> If you cannot find the edit point in PROJECT_MAP or the files, say so — do NOT guess a path.

---

## 1. Actual project structure (follow THIS, not a textbook)

Backend lives in `backend/src/`:

- `app.ts` — all route mounts: `app.use("/api/<x>", [guards], <xRoutes>)`
- `modules/<module>/` — feature code. Real file pattern per module:- `<name>.routes.ts` — `const router = Router()` + `router.METHOD("/path", handlers)` + `export default router`
- `<name>.controller.ts` — request/response handlers (parse req, call service, send json)
- `<name>.service.ts` — business logic + Prisma calls (`import prisma from "../../utils/prisma"`)
- `<name>.types.ts` — types (optional)
- `middleware/` — shared middleware (`auth.middleware.ts`, `tenant.middleware.ts`, `permission.middleware.ts`, `moduleGate.middleware.ts`, etc.)
- `prisma/schema.prisma` — data models (MongoDB via Prisma).

Frontend lives in `frontend/src/` (React + Vite): `pages/`, `components/`, `App.tsx` (routes).

**Reality note:** There is currently NO `.repository.ts`, NO `.manifest.ts`, NO `.test.ts` layer. Services call Prisma directly. Do NOT invent a repository layer unless explicitly asked. When adding a NEW module, match the existing 3-file pattern (`routes` + `controller` + `service`).

---

## 2. Adding a new endpoint to an existing module

1. Add the handler in `<module>/<name>.controller.ts`.
2. Add business logic in `<module>/<name>.service.ts`.
3. Register the route in `<module>/<name>.routes.ts` (`router.METHOD(...)`), importing the new controller fn.
4. If the base path is new, mount it in `backend/src/app.ts`.
5. Run `npm run map:update` so `PROJECT_MAP.md` stays accurate.

Always place static GET routes (e.g. `/search`) BEFORE dynamic ones (e.g. `/:id`) — this repo already relies on that ordering.

---

## 3. Multi-tenant safety (NON-NEGOTIABLE)

- **Never trust client-supplied **`tenantId`**.** Derive it from the authenticated user (`req.user.tenantId`), set by `auth.middleware.ts`.
- Every query on a tenant-owned model MUST be scoped by `tenantId` (except `SUPER_ADMIN` paths). Use the `tenantFilter(req)` helper from `middleware/tenant.middleware.ts` where applicable.
- `enforceTenantIsolation` (tenant.middleware) rejects cross-tenant `tenantId` with 403 — do not bypass it.
- When reading/writing child records (e.g. a student's documents), verify the parent belongs to the same tenant.

## 4. Super Admin / God Mode

- Super Admin routes are mounted under `/api/super-admin/*` in `app.ts`, guarded by `authMiddleware` + `allowRoles("SUPER_ADMIN")`.
- Verify `isSuperAdmin`/role from trusted server state — never from client input alone.
- Super Admin can do privileged actions (gift subscriptions, reset any user's password, manage tenants). Every such action SHOULD write an audit log (`prisma.auditLog.create`) with actor, target, reason — NEVER log passwords, tokens, or OTPs.

## 5. Security defaults (Zero-Trust blueprint)

- **Fail-closed** on security/verification errors for state-changing requests (POST/PUT/PATCH/DELETE). Read-only GET may degrade gracefully. (See `auth.middleware.ts` subscription check.)
- Passwords: hash with `bcrypt` (cost 12). NEVER store or return plaintext/reversible passwords. "Reset", never "reveal".
- Required secrets (`JWT_SECRET`, `DATABASE_URL`, etc.) must come from env; do not hard-code fallbacks.
- Validate input (zod schemas exist in some modules). Reject unexpected fields on sensitive writes.
- Return safe error messages to the client; keep stack traces server-side.

## 6. Prisma / MongoDB gotchas (this repo)

- Enrollment status is lowercase (`"active"`), not uppercase.
- Do NOT use `{ not: null }` in `where` — filter nulls in JS instead.
- Do NOT put both `select` and `include` at the same level.
- Use transactions for multi-step financial/enrollment/result operations.
- AuditLog model has NO `details` field — use `metadata` (Json). Required fields include `tenantId`, `action`, `entity`, `entityId`.

## 7. Change-impact checklist (state this before coding)

- Editing a `*.service.ts` → check its `*.controller.ts` + `*.routes.ts` (same module).
- Editing `app.ts` mount → affects ALL routes under that base path.
- Editing shared `middleware/*` → affects every route using it (high blast radius — call this out).
- Editing `prisma/schema.prisma` → run `npx prisma generate`; may need a migration/ensure-script.
- Frontend calling a backend route → the path in the React page MUST match the `app.ts` mount + route sub-path exactly.

## 8. Workflow after any change

1. `cd backend && npx tsc --noEmit` (and `cd frontend && npx tsc --noEmit`) — no type errors.
2. `npm run map:update` if routes/modules changed.
3. Tell the developer exactly what to test (endpoint/screen) and how to roll back (work happens on the `security-hardening` branch; `main` is the safe baseline).

---

## 9. Response template (use every time)

```
PLAN (before code):
- Module: <module>
- Files to edit: <paths>
- Functions: <names>  (around line <n> per PROJECT_MAP)
- Tenant/security notes: <...>
- Impact: <what else is affected>

Then: minimal edits.

VERIFY: <command + screen/endpoint to check>

```


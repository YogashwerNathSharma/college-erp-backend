# AI HANDOFF — College ERP (READ THIS FIRST)

> **Purpose:** This file tells any AI assistant (Amazon Q, etc.) exactly what this project is, what is DONE, what REMAINS, how branches work, and the hard rules. Read this + `erp-self-guide.md` + `PROJECT_MAP.md` (repo root) BEFORE any change.

---

## 0. OWNER & VISION

- **Owner:** Reyansh (solo developer).
- **Project:** `college-erp-clean` — multi-tenant College ERP SaaS (Node.js, Express, TypeScript, Prisma/MongoDB backend with 57 modules; React + Vite frontend).
- **THE BIG TARGET (never lose sight of this):** Build an ERP that is **self-guiding** and **self-defending**, so that **one single person can run thousands of tenants alone**. Concretely:1. The ERP should **show the Super Admin where/what the problem is** — who did what, when, from where (audit trail), which API, which tenant, which record.

1. Developer tooling (PROJECT_MAP + `.amazonq/rules` + scaffolder + Flow-Guard) makes the AI tell the developer the EXACT file + line to change for any request.
2. Security is centralized (Zero-Trust): fail-closed, tenant isolation, God Mode lock.

- **Reality note:** Never claim the ERP is "100% unbreakable". Security reduces and manages risk; it does not eliminate it.

---

## 1. BRANCH RULES (MANDATORY)

- `main` = DEPLOYED / production branch. Only tested, working code is merged here.
- `eslint-flow-guard` = ACTIVE DEVELOPMENT branch. **ALL new work happens here.**
- Workflow every time:1. Do development work on `eslint-flow-guard`.

1. Type-check: `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`.
2. Commit on `eslint-flow-guard`.
3. When stable: `git checkout main` → `git merge eslint-flow-guard` → `git push origin main`.
4. Return: `git checkout eslint-flow-guard` and keep working.

- If something breaks badly, `git checkout main` restores the last good state.
- **AI: never commit/push on the owner's behalf unless asked.** Give the commands; the owner runs git.

---

## 2. HARD RULES FOR THE AI (DO NOT VIOLATE)

1. **NEVER write the literal placeholder **`[REDACTED`** ... **`]`** into any file.** When editing code that contains sensitive-sounding words (e.g. the p-a-s-s-w-o-r-d field), the display layer can corrupt the written file with a `[REDACTED_...]` marker. After ANY such edit, verify with `verify_code_integrity_after_edit(path, forbidden_markers=("REDACTED",))` or a reversed-string read. If `REDACTED` appears in a source file, FIX it immediately.
2. **Do not use the word "reduct"/redact placeholders in code.** Write the real field names.
3. **Verify before alarming.** Check all relevant subdirectories before reporting a finding (e.g. "no .gitignore", "secrets leaked"). Premature/incorrect alarms waste the owner's time.
4. **Surgical edits only.** Do not rewrite whole files. Keep the owner's working logic intact.
5. `file_edit`** (unified diff) is unreliable here** — it often fails to parse. Prefer `run_python_with_write` with exact old/new string replacement, then verify integrity.
6. **MongoDB soft-delete gotcha:** `isDeleted` was added after records existed, so old docs have NO such field. `where: { isDeleted: false }` silently hides them. For LIST and single-record LOOKUP queries use `OR: [{ isDeleted: false }, { isDeleted: null }]` (matches false OR missing). Do NOT change restore writes (`data: { isDeleted: false }`) or legitimate recycle-bin (`isDeleted: true`) queries. A backfill script exists (see §5) to set the field on old records — running it lets you use clean `isDeleted: false`.
7. **Schema changes require **`npx prisma generate` (owner runs it) before new fields/models are usable in TypeScript. Always remind the owner.
8. **JWT payload only carries **`{ userId, tenantId, role }` — NO name/email. To show a user's name, look it up in the DB by `userId`.
9. **Fail-closed** on security errors for writes; read-only GET may degrade gracefully.

---

## 3. WHAT IS DONE ✅

### Security / hardening

- **Fail-closed subscription check** — `backend/src/middleware/auth.middleware.ts` (error on a write => block 503; GET degrades gracefully).
- **Password reset (full flow)** — Super Admin can reset any user's password (`isFirstLogin: true` forces change on next login) + OTP self-reset via `/forgot-password`. Forced-change screen: `frontend/src/pages/login/ChangePassword.tsx` + `/change-password` route.

### Self-Guiding developer tooling (the vision's dev side)

- `PROJECT_MAP.md` (repo root) — auto map of all routes/modules. Regenerate: `npm run map:update` (`backend/scripts/generate-project-map.js`).
- `.amazonq/rules/erp-self-guide.md` — rulebook forcing the AI to read the map and give EXACT file+line before coding.
- **Scaffolder** — `npm run add-feature` (`backend/scripts/add-feature.js`) creates a new module (routes+controller+service, tenant-safe) and prints where to add logic.
- **Flow-Guard** — `backend/eslint.config.js` + `npm run lint`. Warns on controllers calling Prisma directly and on hard deletes. (Soft/warn mode so old code doesn't block builds.)

### Soft-delete + Recycle Bin (data safety)

Backend done for: **users, student documents, signatures, saved filters, themes, notification templates, KB articles, announcements.** Each has: soft delete (`isDeleted:true`), recycle-bin list endpoint, and restore endpoint.

- Frontend Recycle Bin UI DONE for: **Users** and **Signature Master** (theme-friendly, dark/light).
- 3 previously-missing Prisma models were CREATED: `NotificationTemplate` (collection `notification_center_templates`), `KbArticle`, `Announcement`.

### Audit Center (Super Admin visibility — core of the vision)

- Every write action is logged to `audit_logs` (tenant-scoped) with real user name (resolved from DB), tenant name, entity, record id, IP, timestamp.
- Tabs fixed: Audit / User / Activity / Admin / DB all show correct data.
- **API Logs tab** reads a SEPARATE table `super_admin_audit_logs` (God Mode trail): which API, which module, which record, by whom, from where.
- Login time (`lastLoginAt`), logout time (`lastLogoutAt`), and active session count now tracked. Logout endpoint `POST /api/auth/logout` + shared `frontend/src/utils/logout.ts` (`performLogout`).

### God Mode Lock (Phase 5)

- **P5.1 DONE** — `verifySuperAdmin` middleware (`backend/src/middleware/superAdmin.middleware.ts`): re-checks role + active status from DB on all 16 platform routes (not just JWT claim).
- **P5.4 DONE** — `SuperAdminAuditLog` model + `superAdminAudit` middleware (`backend/src/middleware/superAdminAudit.middleware.ts`) on all platform routes + alert hook.
- **P5.3 DONE** — IP allowlist (`backend/src/middleware/ipAllowlist.middleware.ts`). **OFF by default** (env `SUPER_ADMIN_IP_ALLOWLIST` empty = allow all). Localhost always allowed. Fail-open on error. Lockout-proof by design. Enable later via `.env`.

---

## 4. WHAT REMAINS ⬜ (priority order)

1. **P5.2 — TOTP MFA** (Phase 5 last step). Google Authenticator enroll + verify for Super Admin. HIGH RISK (lockout) — build with recovery codes / emergency bypass. Needs a TOTP library (e.g. otplib) + enroll flow (QR) + verify middleware. Do at/near production, carefully.
2. **Recycle Bin frontend UI** for the remaining 5 modules (backend already done): saved filters, themes, notification templates, KB articles, announcements. Reuse the theme-friendly pattern already built in Signature Master / Users.
3. **Session lifecycle polish** — session "duration" display (login→logout), expire/cleanup of stale sessions, revoke-session UI wired to real data.
4. **Logout audit for old data** — only new logins/logouts are tracked; historical ones are blank.
5. **Flow-Guard cleanup (gradual)** — ~773 lint warnings in old code (mostly controllers calling Prisma directly). Fix opportunistically when touching a module; keep NEW code clean.
6. **Scale hardening for thousands of tenants** (future): tenantId indexes on every tenant-owned model, audit-log retention/archival, connection pooling/caching tuning, consider sharding.
7. **Phase 6/7 (roadmap)** — deepen tenant isolation everywhere; AWS CI/CD zero-downtime deploy with security gates. See `AGENT_FILES ROADMAP` the owner keeps.

---

## 5. KEY SCRIPTS (owner runs these)

- `npm run map:update` — regenerate PROJECT_MAP.md.
- `npm run add-feature` — scaffold a new module.
- `npm run lint` — Flow-Guard checks.
- `node scripts/backfill-soft-delete.js` — set isDeleted=false on old records (soft-delete rollout).
- `node scripts/backfill-audit-usernames.js` — fill real names on old "Unknown" audit rows.
- After any schema change: `npx prisma generate`.

---

## 6. HOW TO START A SESSION (AI checklist)

1. Read this file, then `erp-self-guide.md`, then `PROJECT_MAP.md`.
2. Confirm you are on `eslint-flow-guard` (dev). If map looks stale, ask owner to run `npm run map:update`.
3. For any request: locate exact file(s)+function(s)+line via PROJECT_MAP, state the plan + impact BEFORE coding, make surgical edits, verify integrity (no `REDACTED`), tell the owner what to test and the git commands. Keep the BIG TARGET (§0) in mind.

---

## 7. SETUP ON A NEW COMPUTER / ANOTHER ACCOUNT

When the owner (or AI) starts fresh on a different machine or account, do this:

```bash
# 1. Clone and switch to the DEVELOPMENT branch
git clone https://github.com/YogashwerNathSharma/college-erp-backend.git
cd college-erp-backend
git checkout eslint-flow-guard

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Generate Prisma client (REQUIRED — new models/fields won't work without it)
cd ../backend && npx prisma generate

```

Then:

- **Create **`backend/.env`** manually.** It is intentionally NOT in Git (secure). Copy the keys from `backend/.env.example` and fill real values (DATABASE_URL, JWT_SECRET, CLOUDINARY_*, RAZORPAY_*, etc.). The AI cannot get these from GitHub — ask the owner.
- **Run the backend:** `cd backend && npm run dev` (frontend: `cd frontend && npm run dev`)
- **Tell the AI:** "Read `.amazonq/rules/AI-HANDOFF.md` and continue." It will then know what is done, what remains, which branch to work on (`eslint-flow-guard`), and the vision.

Notes:

- Both branches live on GitHub: `main` (deployed) and `eslint-flow-guard` (development).
- Always develop on `eslint-flow-guard`; merge to `main` only when tested (see §1).
- If `PROJECT_MAP.md` looks stale, run `npm run map:update` in `backend/`.


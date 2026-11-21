# College ERP → Brand ERP: Personalized Roadmap

**Owner:** Reyansh
**Project:** `I:\development\college-erp-clean`
**Stack:** Node.js · Express · TypeScript · Prisma · React (Vite) · YN-UDP service · Redis
**Banaya gaya:** 20 Nov 2026
**Source:** Aapke 3 blueprint docs (Self-Guiding Playbook, Universal SaaS Architecture, Zero-Trust Security) + aapke asli code ka audit

---

## 0. Vision (ek line mein)

> Ek aisa multi-tenant ERP jahan **main (developer/God) jab bhi koi change maangun, Amazon Q khud bataye kis file ki kis line par kya karna hai** — aur system khud galat flow aur security-chook pakad le. Platform ka sarvochch control (God Mode) sirf mere paas, strong lock ke saath.

**Possible? Haan.** Lekin ek-ek step karke, naye code par discipline laga ke, purane 57 modules ko dheere-dheere migrate karke. "Sab tod ke dobara banao" waala raasta NAHI.

**Golden rule:** ERP ko kabhi "100% unbreakable / unhackable" mat kehna. Security = risk kam karna, eliminate karna nahi.

---

## 1. Abhi kahan hain? (Audit ka nichod)

### ✅ Jo already achha hai
- 57 modules ka bada, serious codebase (auth, audit, permissions, super-admin, subscription, tenant, workflow, payment-gateway).
- Tenant isolation ka base: `backend/src/middleware/tenant.middleware.ts` → `enforceTenantIsolation` client-supplied tenantId mismatch par 403 deta hai.
- Subscription grace-period logic maujood.
- Super-admin ke liye alag module tree (audit-center, iam, monitoring, security).

### ⚠️ Gaps (playbook bolta hai ↔ reality)
| Blueprint kehta hai | Reality (aapka code) |
|---|---|
| Module structure: `.manifest.ts`, `.routes.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.test.ts` | ❌ Koi `.manifest.ts` / `.repository.ts` / `.test.ts` nahi. Services seedhe `prisma` import karke call karte hain |
| tenantId `AsyncLocalStorage` se derive ho | ❌ Nahi. tenantId JWT se, har service mein manually lagta hai |
| Super Admin prefix `/api/v1/platform/*` | ❌ Aapke yahan `/api/super-admin`, aur `/api/...` (no `/v1/`) |
| Fail-closed on security error (SEC-009) | ❌ `auth.middleware.ts` subscription check "fail-open" hai: error par request allow |
| No hard-coded/fallback JWT secret (SEC-007) | ⚠️ `jwt.verify(token, process.env.JWT_SECRET!)` — startup validation nahi |
| God Mode: MFA + IP allowlist (Step 5) | ❌ `superAdmin.middleware.ts` + MFA + IP allowlist abhi nahi |
| `.amazonq/rules`, `PROJECT_MAP.md`, Plop, ESLint Flow-Guard, Vitest+Testcontainers | ❌ Inmein se kuch bhi abhi exist nahi karta |

---

## 2. Strategy: Do golden rules

1. **Naye code par rule, purane par migration** — nayi feature strict structure (manifest + repository + test) mein banao. Purane modules ko priority ke hisaab se ek-ek karke migrate karo (critical/financial pehle).
2. **Security pehle, chamak baad mein** — fail-open/JWT jaise bugs pehle, fir self-guiding automation, fir AWS deploy.

---

## 3. Roadmap — Phases (one task at a time)

### 🔴 PHASE 0 — Freeze & Safety Net (1–2 din)
Maqsad: kuch bhi badalne se pehle backup + rollback point.
- [ ] **P0.1** Git: current state tag karo (`v-pre-hardening`), nayi branch `security-hardening` banao.
- [ ] **P0.2** Database ka full backup lo; restore test karo (restore chalta hai ye confirm karo).
- [ ] **P0.3** `.env.example` banao — saare required secrets list (JWT_SECRET, DB_URL, REDIS_URL, etc.).
- **Done when:** baseline restore ho sakta hai; koi production change nahi hua.

### 🔴 PHASE 1 — Critical Security Fixes (3–5 din)
Maqsad: sabse khatarnaak holes band karo. (Blueprint SEC-007, SEC-009)
- [ ] **P1.1 Fail-closed subscription check** — `backend/src/middleware/auth.middleware.ts` ka `catch` block "allow request" se badal ke block karo (sensitive routes par). Billing/renew routes exception rahein.
- [ ] **P1.2 JWT secret startup validation** — ek `config/env.ts` banao jo startup par required secrets check kare; missing hua to server start hi na ho. `JWT_SECRET!` ki jagah validated config use karo.
- [ ] **P1.3 Token purpose split** — access token vs refresh token ke liye alag secret/purpose (abhi ek hi `JWT_SECRET`).
- [ ] **P1.4 Error responses safe karo** — `error.middleware.ts` mein stack trace / DB details client ko na jaayein (prod mode).
- **Done when:** security error = request blocked; secret missing = startup fail; errors leak nahi karte.

### 🟠 PHASE 2 — Self-Guiding Foundation (1–2 hafte)
Maqsad: Amazon Q ko aapke code ka "naksha" do taaki woh khud bataye kahan change karna hai. (Playbook Step 1–2)
- [ ] **P2.1 `.amazonq/rules/erp-self-guide.md`** — rulebook. ADJUSTED aapke asli structure ke hisaab se: real paths (`backend/src/modules/<name>/`), real prefix (`/api/super-admin`), aur "pehle PROJECT_MAP padho, fir exact file+function batao" rule.
- [ ] **P2.2 `PROJECT_MAP.md` generator** — `backend/scripts/generate-project-map.ts` (ts-morph). Scan karega `backend/src/modules`, har endpoint → method → controller/service file path, Prisma models, aur "is file ko badla to yahan asar" warning list. `npm run map:update` script add karo.
- [ ] **P2.3 Pehli baar map generate** karke commit karo.
- **Done when:** `npm run map:update` chalta hai; Q se poochne par woh real file+function bata deta hai.

### 🟠 PHASE 3 — Module Standard + Scaffolder (1–2 hafte)
Maqsad: naya code hamesha ek hi disciplined shape mein bane. (Playbook Step 3)
- [ ] **P3.1 Reference module** — ek chhota naya module strict pattern mein banao (`.manifest.ts` + `.repository.ts` + `.test.ts`) — baaki ke liye template.
- [ ] **P3.2 Repository layer rule** — service seedhe prisma call na kare; `.repository.ts` ke through jaaye (tenant-scoped).
- [ ] **P3.3 Plop scaffolder** — `backend/plopfile.js` + `npm run add-feature`. Vertical + module name + roles poochega, saari files auto-banaega (tenantId check + cross-tenant negative test ke saath), aur terminal par exact file+line batayega jahan custom logic likhni hai.
- **Done when:** `npm run add-feature` ek complete, secure, tested module skeleton bana deta hai.

### 🟡 PHASE 4 — Flow-Guard + Self-Testing (2–4 hafte)
Maqsad: galat flow likhte hi pakda jaaye, exact file+line ke saath. (Playbook Step 4, Blueprint SEC-012)
- [ ] **P4.1 ESLint Flow-Guard** — `eslint-plugin-boundaries` + custom rules: (a) controller seedhe prisma call kare to error, (b) tenant-owned model par query bina `tenantId` ho to error — dono exact file+line ke saath.
- [ ] **P4.2 Vitest + Testcontainers** (Postgres+Redis) `backend/tests/security/`: cross-tenant read/update/delete → 403/404; YN-UDP bina token → 401; non-SuperAdmin `/api/super-admin/*` → 403; published result bina reopen edit → fail.
- [ ] **P4.3 `npm run check:all`** — Flow-Guard + map:update + saare security/workflow tests, ek saaf summary ke saath.
- **Done when:** galti karte hi terminal laal mein exact file+line batata hai.

### 🟡 PHASE 5 — God Mode Lock (1–2 hafte)
Maqsad: platform ka sarvochch control sirf aapke paas. (Playbook Step 5, Blueprint §6)
- [ ] **P5.1 `superAdmin.middleware.ts`** — `isSuperAdmin === true` DB/Redis session se verify (sirf JWT claim par bharosa nahi).
- [ ] **P5.2 TOTP MFA** — super-admin routes par MFA zaroori (`mfaVerifiedAt` last 30 min).
- [ ] **P5.3 IP allowlist** — `SUPER_ADMIN_ALLOWED_IPS` (Secrets Manager/env); match na ho to fail-closed 403.
- [ ] **P5.4 Immutable audit** — har super-admin action ka before/after diff + IP + correlationId append-only log + alert.
- [ ] **P5.5 Tests** — tenant-admin / forged token → 403 proof.
- **Done when:** galat IP ya bina MFA super-admin route block; har action logged.

### 🟢 PHASE 6 — Tenant Isolation Deepening (2–3 hafte)
Maqsad: ek tenant ka data doosre ko kabhi na dikhe — middleware se aage DB level tak. (Blueprint §5, SEC-015 to SEC-020)
- [ ] **P6.1** Prisma extension / repository pattern se har tenant-owned query mein `tenantId` auto-lage.
- [ ] **P6.2** Parent-child ownership checks (student → child records).
- [ ] **P6.3** Background jobs/queues mein tenantId re-verify.
- [ ] **P6.4** Cache keys, search index, exports, file paths — sab mein tenant scope.
- [ ] **P6.5** Cross-tenant negative tests har critical module par.
- **Done when:** koi bhi cross-tenant attempt test mein fail hota hai.

### 🟢 PHASE 7 — AWS CI/CD + Zero-Downtime Deploy (2–3 hafte)
Maqsad: galat code kabhi production par na jaaye. (Playbook Step 6, Blueprint §14)
- [ ] **P7.1** `.github/workflows/...yml`: gitleaks + `npm audit` + Flow-Guard + `check:all`.
- [ ] **P7.2** Koi bhi security/isolation/workflow test fail → deploy block, exact file/line output.
- [ ] **P7.3** Pass hua to Docker build (backend + yn-udp) → ECR → Blue/Green on ECS Fargate, secrets Secrets Manager se.
- **Done when:** red test = no deploy; green = auto live, no downtime.

---

## 4. Timeline (aap akele, part-time)

| Phase | Kaam | Realistic |
|---|---|---|
| 0 | Freeze & backup | 1–2 din |
| 1 | Critical security fixes | 3–5 din |
| 2 | Self-guiding foundation | 1–2 hafte |
| 3 | Module standard + scaffolder | 1–2 hafte |
| 4 | Flow-Guard + tests | 2–4 hafte |
| 5 | God Mode lock | 1–2 hafte |
| 6 | Tenant isolation deepening | 2–3 hafte |
| 7 | AWS CI/CD deploy | 2–3 hafte |

**Total serious version:** ~3–4 mahine disciplined kaam. Har hafte visible progress.

---

## 5. Aapka daily workflow (Phase 2–4 ke baad)

1. **Pucho:** Q se — "fees module mein installment ka naya niyam jodna hai." → `.amazonq/rules` + `PROJECT_MAP.md` ki wajah se Q khud 2–3 files bata dega.
2. **Scaffold:** nayi feature? `npm run add-feature` → files auto.
3. **Test:** `npm run check:all` → galti hui to laal mein exact file+line.
4. **Deploy:** sab green → Git push → AWS khud bina downtime live.

---

## 6. Abhi ka single next step

👉 **Phase 0 + Phase 1.1 (fail-open subscription fix).** Ye sabse zyada risk kam karta hai, aur chhota hai. Iske baad Phase 2 (self-guiding foundation).

---
*Note: Ye roadmap aapke asli code ke audit par bana hai. Jaise-jaise modules migrate honge, "gaps" table update karte rehna.*

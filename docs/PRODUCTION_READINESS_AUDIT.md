# College ERP — Production Readiness Audit & Module Checklist

> Audit date: 2026-11-02 Stack: Node + Express + TypeScript (backend), React + Vite + TS + Tailwind (frontend), **MongoDB** via Prisma, Render hosting, Cloudinary (media), Razorpay (payments), Gemini (AI). Scale: 56 backend modules · ~260 Prisma models · ~395 backend `.ts` files · 50+ frontend page groups · multi-tenant SaaS.

---

## 0. Executive Summary

यह ERP feature-wise बहुत बड़ा और मज़बूत है — multi-tenant isolation, subscription gating, module gating, audit logging, RBAC, strong auth (bcrypt cost 12 + password policy), helmet CSP, rate limiting — ये सब पहले से मौजूद हैं। यह एक genuinely enterprise-grade base है.

Production-ready होने के लिए मुख्य gaps **architecture-level hygiene** में हैं, features में नहीं:

| # | सबसे बड़ा issue | Severity | असर |
| --- | --- | --- | --- |
| 1 | **Ephemeral disk uploads** (QR, signatures, file-manager, + पुराना student photo path) Render पर restart/deploy में मिट जाते हैं | 🔴 Critical | data loss — आज का photo bug इसी का लक्षण था |
| 2 | **कोई automated test नहीं** (0 test files) | 🔴 Critical | हर deploy एक जुआ |
| 3 | **24 files में **`@ts-nocheck` + **695 **`as any` | 🟠 High | type safety off → silent runtime bugs |
| 4 | **AI tool keyword/regex-based** है, सच्चा intelligent नहीं; Gemini सिर्फ fallback | 🟠 High | AI "working" दिखता है पर नाज़ुक |
| 5 | **616 console.log/error** — कोई structured logging/monitoring नहीं | 🟡 Medium | production debugging अंधेरे में |
| 6 | subscription check **fail-open** (error → access दे देता है) | 🟡 Medium | revenue/security leak |
| 7 | `postinstall`/`build` में 12+ ad-hoc `ensure-*.js` migration scripts | 🟡 Medium | nondeterministic deploys |

**निचोड़:** Features production-grade हैं; **operational maturity (tests, storage, observability, type-safety)** नहीं। नीचे हर module का checklist है।

---

## 1. Architecture-Wide Fixes (पहले ये — ये सब modules को छूते हैं)

### 1.1 🔴 Persistent storage — सबसे ज़रूरी

आज का student-photo bug isolated नहीं था। ये pattern इन जगहों पर है:

- `modules/students/upload.service.ts` — ✅ अब Cloudinary (आज fix हुआ)
- `modules/qr-barcode/qr.controller.ts` — ❌ `fs.writeFileSync(.../uploads/qr/...)`
- `modules/digital-signature/signature.controller.ts` — ❌ `/uploads/signatures/...`
- `modules/file-manager/file-manager.controller.ts` — ❌ `/uploads/...`
- `modules/backup/backup.service.ts` — ❌ local backups (Render पर गायब)

**Fix:** सभी persistent assets को **Cloudinary (या S3)** पर भेजें, कभी local disk पर नहीं। `uploadToCloudinary()` पहले से मौजूद है — बस reuse करें। Backups को S3/external पर भेजें।

### 1.2 🔴 Testing

- अभी **0 tests**. कम-से-कम: auth, tenant-isolation, subscription-gate, fees calculation, exam/result calculation, admission counter — इन critical paths पर integration tests लिखें (Vitest/Jest + supertest).
- CI (GitHub Actions) में `tsc --noEmit` + `eslint` + tests gate लगाएँ, तभी Render deploy हो.

### 1.3 🟠 Type safety

- 24 `@ts-nocheck` files और 695 `as any` — धीरे-धीरे हटाएँ. नए code में `@ts-nocheck` ban करें (eslint rule).
- `tsc --noEmit` को build में mandatory बनाएँ.

### 1.4 🟡 Observability

- 616 `console.*` → एक structured logger (pino/winston — `config/logger.ts` मौजूद है, उसे सब जगह use करें).
- Error tracking जोड़ें: **Sentry** (backend + frontend). Render logs काफी नहीं.
- `/api/health` already है — उसमें DB ping + Cloudinary + Razorpay reachability जोड़ें.

### 1.5 🟡 Deploy pipeline

- `postinstall`/`build` के 12+ `ensure-*.js` scripts को proper **Prisma migrations** में consolidate करें. ये scripts nondeterministic हैं और silently fail हो सकते हैं.
- `.env.example` को पूरा करें (Cloudinary, SMTP, Gemini, Firebase, Redis keys उसमें नहीं हैं — नए dev/deploy misconfigure होंगे; यही आज के bug की जड़ थी).

### 1.6 🟡 Security hardening

- `subscriptionCheckMiddleware` **fail-open** है (catch → `next()`). कम-से-कम paid-write routes पर fail-closed करें.
- `enforceTenantIsolation` body में tenantId auto-inject करता है — अच्छा — पर हर **service** query में `tenantId` filter भी होना चाहिए (defence-in-depth). spot-check करें.
- JWT `7d` expiry लंबा है; refresh-token rotation मौजूद है तो access-token को 15–60 min करें.
- Rate limit `100/15min` global है — auth/AI/upload पर अलग सख्त limits (कुछ हद तक already हैं).

---

## 2. AI Tool — "Proper working" के लिए क्या चाहिए

**अभी कैसे काम करता है:**

- Frontend (`ynAiService.ts`): hard-coded keyword lists से intent match (fee/report/attendance/student…), फिर backend endpoint hit.
- Backend (`ai-command.controller.ts`): `text.includes("stats"/"defaulter"/…)` जैसे string checks; match न हो तो **Gemini **`gemini-2.0-flash` fallback (सिर्फ अगर `GEMINI_API_KEY` set हो).
- `ai.controller.ts`: performance/attendance/defaulter predictions **rule-based statistics** हैं (कोई ML नहीं) — ये ठीक है, पर "AI" कहना overstated है.

**समस्याएँ:**

1. Keyword matching भंगुर है — थोड़ा अलग phrasing पर टूटता है; Hinglish synonyms की लंबी manual list maintainable नहीं.
2. Gemini optional है — key न हो तो चुपचाप generic fallback; user को पता ही नहीं चलता AI off है.
3. कोई conversation memory/context नहीं (हर query standalone).
4. AI के पास **structured data access (tools/function-calling)** नहीं — वो DB को सीधे query नहीं कर सकता, सिर्फ pre-coded 5 endpoints.
5. Secrets/PII Gemini को जाते वक्त कोई guardrail नहीं.

**Production के लिए checklist:**

- [ ] `GEMINI_API_KEY` Render env में confirm करें; न हो तो UI में साफ़ "AI unavailable" दिखे (silent fallback नहीं).
- [ ] Keyword-routing → **Gemini function-calling / tool-use** पर shift करें: intents को tools (searchStudent, getFees, getAttendance…) के रूप में define करें, LLM खुद चुने. इससे भंगुर `includes()` chains ख़त्म.
- [ ] हर AI DB query पर **tenantId scope** enforce (अभी controllers tenantId लेते हैं — अच्छा — पर function-calling में भी सख्ती रखें).
- [ ] Conversation history persist करें (schema में `aIConversation` जैसा model है — उसे use करें) ताकि context बने.
- [ ] PII redaction + prompt-injection guard (user input को system prompt से अलग रखें).
- [ ] Rate-limit + cost cap AI endpoints पर (Gemini billing से बचाव).
- [ ] AI responses को stream करें (UX) और errors को gracefully दिखाएँ.
- [ ] Fallback statistical predictions को "AI insights" की जगह "Rule-based insights" label करें (honesty + trust).

---

## 3. Module-wise Production Checklist

> हर module के लिए: इन boxes को tick करने पर वो module production-ready माना जाएगा. **Common (हर module पर लागू):** tenantId scoping ✔ · input validation (zod) ✔ · consistent `{success,data,message}` response ✔ · pagination on list endpoints ✔ · errors logged via logger (console नहीं) ✔ · at least 1 integration test ✔ · no `@ts-nocheck` ✔ · loading/error/empty states on frontend ✔.

### 3.1 Core / Auth / Tenant

- [ ] Access-token expiry घटाएँ (7d→short) + refresh rotation verify
- [ ] Login brute-force lockout (authLimiter है, पर per-account lockout जोड़ें)
- [ ] `isFirstLogin` force-password-change flow test करें
- [ ] Tenant isolation: हर tenant-scoped service में `tenantId` filter audit करें
- [ ] Super-admin bootstrap middleware prod में disable/guard है — confirm करें

### 3.2 Students (40 backend files — सबसे बड़ा)

- [x] Photo upload → Cloudinary (आज fix हुआ)
- [ ] पुरानी `/uploads/...` photoUrl वाली records migrate/clean करें (dead links)
- [ ] Bulk import (`student-import-fast`, `student-import-validation`) — temp files `os.tmpdir()` में हैं ✔ पर error-row reporting robust है verify करें
- [ ] Admission counter race-condition (कई `fix/repair/reset-counter` scripts इशारा हैं कि bug रहा है) — atomic counter (Mongo `findOneAndUpdate $inc`) से fix करें
- [ ] Duplicate-detection service का coverage test
- [ ] Profile/list/print pages पर `getFullUrl` consistent (आज 3 जगह fix हुईं; बाकी audit)

### 3.3 Fees (33 files — business-critical)

- [ ] Fee calculation (discounts, fines, partial, balance) पर unit tests — पैसे का हिसाब, सबसे ज़रूरी
- [ ] Razorpay: payment verification signature server-side verify हो रहा है confirm करें
- [ ] Idempotency on payment webhook (double-charge/double-credit रोकें)
- [ ] Receipt numbering concurrency-safe
- [ ] Refund flow + audit trail

### 3.4 Exams / Grades / Results

- [ ] Result/CGPA calculation (कई `ensure-result-*` scripts) → proper tested logic में लाएँ
- [ ] Report-card generation load पर (bulk) performance test
- [ ] Grade boundary edge-cases (0, max, absent, grace marks)

### 3.5 Attendance

- [ ] Bulk mark concurrency + duplicate-day guard
- [ ] Attendance % calculation consistent across dashboards/AI/reports
- [ ] Alert job (`attendanceAlert.job.ts`) prod schedule verify

### 3.6 Payments / Subscription

- [ ] subscription check fail-open → fail-closed (writes पर)
- [ ] Grace-period (7d read-only) logic test
- [ ] Razorpay keys prod vs test env separation
- [ ] Expiry job (`subscriptionExpiry.job.ts`) idempotent

### 3.7 Media-producing modules (storage fix ज़रूरी)

- [ ] **QR/Barcode** → Cloudinary (अभी `/uploads/qr` disk)
- [ ] **Digital Signature** → Cloudinary (अभी `/uploads/signatures` disk)
- [ ] **File Manager** → Cloudinary/S3 (अभी `/uploads` disk)
- [ ] **Backup** → S3/external (अभी local; Render पर बेकार)
- [ ] ID Cards / Admit Cards / Certificates — photo `getFullUrl` + print assets verify

### 3.8 Communication / Notifications

- [ ] SMTP/SMS/WhatsApp/FCM keys env में present? वरना silent fail — health-check जोड़ें
- [ ] Notification queue retry/backoff (`queue` module) test
- [ ] Template injection/escaping

### 3.9 Transport / Hostel / Library / Inventory / HR

- [ ] हर एक पर common-checklist (tenantId, validation, pagination, tests)
- [ ] Library: fine calculation + issue/return concurrency
- [ ] Transport: route/stop/vehicle assignment integrity
- [ ] HR: salary/payroll calculation tests (पैसा)

### 3.10 Super-Admin (47 files) / Masters / Builders

- [ ] Super-admin routes RBAC-gated ✔ (app.ts में दिखता है) — पर IAM/user-management पर extra audit
- [ ] Form-builder / Report-builder / Dashboard-builder: user-defined queries पर injection guard
- [ ] Masters: `ensure-*` runtime scripts → migrations

### 3.11 Portals (Student / Parent / Teacher)

- [ ] हर portal का auth scope अलग verify (student अपना ही data देखे)
- [ ] Parent portal → सही child mapping (cross-student leak test)
- [ ] Mobile/responsive + offline (sw.js मौजूद है) test

---

## 4. सुझाया गया क्रम (Roadmap)

**Phase 1 — Stop the bleeding (1–2 हफ्ते)**

1. सभी disk-uploads → Cloudinary (QR, signatures, file-manager) — data loss रोकें
2. `.env.example` पूरा + Render env vars audit (Cloudinary/Gemini/SMTP/Razorpay)
3. Sentry + structured logger wire करें
4. subscription fail-open → fail-closed

**Phase 2 — Make it safe to change (2–4 हफ्ते)** 5. Critical-path integration tests (auth, tenant, fees, exam, payment) 6. CI gate (tsc + eslint + tests) 7. `@ts-nocheck`/`as any` top offenders हटाएँ (fees, exams, students पहले)

**Phase 3 — Harden & polish (ongoing)** 8. `ensure-*` scripts → Prisma migrations 9. AI tool → Gemini function-calling + conversation memory + guardrails 10. बाकी modules पर module-checklist पूरा करें

---

## 5. Quick Wins (आज/इस हफ्ते कर सकते हैं)

- [ ] Render env: `CLOUDINARY_*`, `GEMINI_API_KEY`, `RAZORPAY_*`, `SMTP_*` present confirm करें
- [ ] QR + Signature controllers को Cloudinary पर shift (copy-paste `uploadToCloudinary`)
- [ ] `.env.example` complete करें
- [ ] Sentry DSN जोड़ें (10 min, बड़ा payoff)
- [ ] पुरानी dead `/uploads/...` photoUrl records को null करें (broken-image की जगह placeholder)


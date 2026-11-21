// ESLint flat config (ESLint v9/v10) — Backend Flow-Guard
// ─────────────────────────────────────────────────────────────
// Self-Guiding ERP, Phase 4. Starts SOFT: tenant-safety checks are
// "warn" (not "error") so the 57 existing modules don't block builds.
// Tighten to "error" later, module-by-module, as the codebase is cleaned.
//
// Run:  npm run lint        (report)
//       npm run lint:fix    (auto-fix the safe stuff)

const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  // Ignore build output, deps, and legacy folders (excluded in tsconfig too)
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "scripts/**",
      "prisma/**",
      "src/modules/fees old/**",
      "src/modules/examold/**",
    ],
  },

  // Base: all backend TypeScript
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2020, sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      // keep it light for now — just surface obvious issues
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
    },
  },

  // ── FLOW-GUARD: Controllers must NOT call Prisma directly ──
  // Controllers should delegate to a *.service.ts. Direct prisma access
  // in a controller skips the service layer (and its tenant scoping).
  {
    files: ["src/**/*.controller.ts"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "MemberExpression[object.name='prisma']",
          message:
            "FLOW-GUARD: Controller should not call `prisma.*` directly. Move DB access into the matching *.service.ts (keeps tenant scoping in one place).",
        },
      ],
    },
  },

  // ── FLOW-GUARD: Services — flag Prisma writes without an obvious tenant scope ──
  // This is a heuristic reminder, NOT a hard proof. It warns on delete/deleteMany
  // which are high-risk (prefer soft-delete + tenant scope). Review each hit.
  {
    files: ["src/**/*.service.ts"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.property.name='deleteMany']",
          message:
            "FLOW-GUARD: `deleteMany` is high-risk. Confirm it is tenant-scoped (where includes tenantId) and consider soft-delete (isDeleted:true) instead of hard delete.",
        },
        {
          selector:
            "CallExpression[callee.property.name='delete'][callee.object.property.name]",
          message:
            "FLOW-GUARD: hard `delete` detected. Prefer soft-delete (isDeleted:true) + tenant scope, per the recycle-bin pattern.",
        },
      ],
    },
  },
];

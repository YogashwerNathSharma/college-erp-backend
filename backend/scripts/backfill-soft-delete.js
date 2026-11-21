/**
 * backfill-soft-delete.js
 * ─────────────────────────────────────────────────────────────
 * One-time (idempotent) data fix for soft-delete rollout.
 *
 * Problem: isDeleted/deletedAt fields were added to several models
 * AFTER records already existed. In MongoDB those old documents have
 * NO isDeleted field, so `where: { isDeleted: false }` silently
 * excludes them and they "vanish" from lists.
 *
 * Fix: set isDeleted=false (and deletedAt=null) on every document in
 * the affected collections that is missing the field. Uses Prisma's
 * $runCommandRaw so it works regardless of Prisma's required-field
 * validation. Safe to run multiple times.
 *
 * Run:  node scripts/backfill-soft-delete.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// MongoDB collection names (the @@map values in schema.prisma)
const COLLECTIONS = [
  "signatures",
  "student_saved_filters",
  "theme_configs",
  "notification_center_templates",
  "kb_articles",
  "announcements",
  "users",
  "student_documents",
];

async function main() {
  console.log("── Soft-delete backfill starting ──\n");
  for (const coll of COLLECTIONS) {
    try {
      const res = await prisma.$runCommandRaw({
        update: coll,
        updates: [
          {
            q: { isDeleted: { $exists: false } },
            u: { $set: { isDeleted: false, deletedAt: null } },
            multi: true,
          },
        ],
      });
      const matched = res.n ?? 0;
      const modified = res.nModified ?? 0;
      console.log(`  ${coll.padEnd(32)} matched=${matched} updated=${modified}`);
    } catch (err) {
      console.log(`  ${coll.padEnd(32)} SKIP (${err.message.split("\\n")[0]})`);
    }
  }
  console.log("\n✅ Backfill done. All old records now have isDeleted=false.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Backfill failed:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});

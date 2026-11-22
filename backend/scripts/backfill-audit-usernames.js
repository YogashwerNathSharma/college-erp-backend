/**
 * backfill-audit-usernames.js
 * ─────────────────────────────────────────────────────────────
 * Fixes OLD audit_logs rows that show "Unknown"/"System" as the user.
 *
 * Reason: before the audit fix, the JWT carried no name/email, so
 * userName was saved as "Unknown". This script looks each row's
 * userId up in the users collection and fills the real name/email.
 *
 * - If userId exists and user found  -> set userName = name/email
 * - If userId missing/not found      -> leave as-is (can't recover)
 *
 * Idempotent & safe to run multiple times.
 * Run:  node scripts/backfill-audit-usernames.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("── Audit username backfill starting ──\n");

  // Pull rows that currently have no real userName (Unknown / empty / System)
  const rows = await prisma.auditLog.findMany({
    where: {
      OR: [
        { userName: "Unknown" },
        { userName: null },
        { userName: "System" },
        { userName: "" },
      ],
    },
    select: { id: true, userId: true, userName: true },
  });

  console.log(`Found ${rows.length} rows needing a username.\n`);

  // Cache user lookups so we don't hit DB repeatedly for the same user
  const cache = new Map();
  let fixed = 0;
  let skippedNoUser = 0;

  for (const row of rows) {
    const uid = row.userId;
    if (!uid) { skippedNoUser++; continue; }

    let info = cache.get(uid);
    if (info === undefined) {
      try {
        const u = await prisma.user.findUnique({
          where: { id: uid },
          select: { name: true, email: true },
        });
        info = u ? (u.name || u.email || null) : null;
      } catch {
        info = null; // invalid ObjectId etc.
      }
      cache.set(uid, info);
    }

    if (info) {
      await prisma.auditLog.update({
        where: { id: row.id },
        data: { userName: info },
      });
      fixed++;
    } else {
      skippedNoUser++;
    }
  }

  console.log(`✅ Updated:        ${fixed}`);
  console.log(`⏭️  Left as-is:     ${skippedNoUser} (no recoverable userId)`);
  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Backfill failed:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});

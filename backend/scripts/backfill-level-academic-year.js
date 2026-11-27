// backfill-level-academic-year.js
// One-time migration: sets academicYearId on existing Level documents that were
// created before Level became academic-year wise.
//
// Rules (so nothing else breaks):
//  - Dry run by default. Nothing is written unless --apply is passed.
//  - Only documents where academicYearId is MISSING are touched.
//  - Each tenant's records are assigned to that tenant's CURRENT academic year
//    (isCurrent = true). Tenants without a current year are skipped and reported.
//  - No documents are deleted. Existing tenantId and code values are not changed.
//
// Usage (from backend folder):
//   node scripts/backfill-level-academic-year.js           -> dry run, shows counts
//   node scripts/backfill-level-academic-year.js --apply   -> writes changes

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// MongoDB returns ObjectIds as { $oid: "..." } in raw commands.
const oidOf = (v) => (v && typeof v === "object" && v.$oid ? v.$oid : String(v));

(async () => {
  console.log(APPLY ? "MODE: APPLY (writing changes)" : "MODE: DRY RUN (no changes)");

  const raw = await prisma.$runCommandRaw({
    find: "Level",
    filter: { academicYearId: { $exists: false } },
    projection: { _id: 1, tenantId: 1, name: 1, code: 1 },
  });
  const docs = (raw && raw.cursor && raw.cursor.firstBatch) || [];

  console.log(`Level records without academicYearId: ${docs.length}`);
  if (docs.length === 0) {
    console.log("Nothing to migrate. Done.");
    await prisma.$disconnect();
    return;
  }

  // Group counts per tenant
  const perTenant = {};
  for (const d of docs) {
    const tid = oidOf(d.tenantId);
    perTenant[tid] = (perTenant[tid] || 0) + 1;
  }

  let migrated = 0;
  let skipped = 0;

  for (const [tid, count] of Object.entries(perTenant)) {
    const currentYear = await prisma.academicYear.findFirst({
      where: { tenantId: tid, isCurrent: true },
      select: { id: true, name: true },
    });

    if (!currentYear) {
      console.log(`  SKIP tenant ${tid}: no current academic year (${count} records left as-is)`);
      skipped += count;
      continue;
    }

    console.log(`  tenant ${tid}: ${count} records -> academic year "${currentYear.name}" (${currentYear.id})`);

    if (APPLY) {
      await prisma.$runCommandRaw({
        update: "Level",
        updates: [
          {
            q: { tenantId: { $oid: tid }, academicYearId: { $exists: false } },
            u: { $set: { academicYearId: { $oid: currentYear.id } } },
            multi: true,
          },
        ],
      });
    }
    migrated += count;
  }

  console.log("");
  console.log(`Summary: ${APPLY ? "migrated" : "would migrate"} ${migrated}, skipped ${skipped}`);

  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to write changes.");
  } else {
    const left = await prisma.$runCommandRaw({
      count: "Level",
      query: { academicYearId: { $exists: false } },
    });
    console.log(`Records still without academicYearId after apply: ${left.n ?? "unknown"}`);
  }

  await prisma.$disconnect();
})().catch(async (err) => {
  console.error("Migration failed. No further changes were made by this run:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});

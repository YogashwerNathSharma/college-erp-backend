// @ts-nocheck
// ══════════════════════════════════════════════════════════════
// FIX: Remove orphaned sections — step by step cascade
// ══════════════════════════════════════════════════════════════
// RUN: npx tsx prisma/fix-orphan-sections.ts
// ══════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("\n🔧 FIX: Cleaning orphaned sections\n");

  // Get all valid class IDs
  const allClasses = await prisma.class.findMany({ select: { id: true } });
  const validClassIds = new Set(allClasses.map(c => c.id));
  console.log(`Valid classes in DB: ${validClassIds.size}`);

  // Find orphaned sections
  const allSections = await prisma.section.findMany({ select: { id: true, classId: true } });
  const orphanedSectionIds = allSections.filter(s => !validClassIds.has(s.classId)).map(s => s.id);
  console.log(`Orphaned sections: ${orphanedSectionIds.length}`);

  if (orphanedSectionIds.length === 0) {
    console.log("✅ Nothing to fix!");
    return;
  }

  // Find orphaned enrollments
  const orphanedEnrollments = await prisma.enrollment.findMany({
    where: { sectionId: { in: orphanedSectionIds } },
    select: { id: true },
  });
  const enrollmentIds = orphanedEnrollments.map(e => e.id);
  console.log(`Orphaned enrollments: ${enrollmentIds.length}`);

  // Find studentFee records linked to these enrollments
  let studentFeeIds: string[] = [];
  if (enrollmentIds.length > 0) {
    const fees = await prisma.studentFee.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
      select: { id: true },
    });
    studentFeeIds = fees.map(f => f.id);
    console.log(`Orphaned studentFees: ${studentFeeIds.length}`);
  }

  // ─── DELETE IN CORRECT ORDER ───────────────────────────────────────

  // Level 1: Delete deepest — things that reference studentFee
  if (studentFeeIds.length > 0) {
    // payment references studentFee
    try {
      const r = await prisma.payment.deleteMany({ where: { studentFeeId: { in: studentFeeIds } } });
      if (r.count) console.log(`  🗑️  ${r.count} payments`);
    } catch {}

    // studentFeeDiscount references studentFee
    try {
      const r = await prisma.studentFeeDiscount.deleteMany({ where: { studentFeeId: { in: studentFeeIds } } });
      if (r.count) console.log(`  🗑️  ${r.count} studentFeeDiscounts`);
    } catch {}

    // studentFeeItem references studentFee
    try {
      const r = await prisma.studentFeeItem.deleteMany({ where: { studentFeeId: { in: studentFeeIds } } });
      if (r.count) console.log(`  🗑️  ${r.count} studentFeeItems`);
    } catch {}

    // Now delete studentFee itself
    try {
      const r = await prisma.studentFee.deleteMany({ where: { id: { in: studentFeeIds } } });
      if (r.count) console.log(`  🗑️  ${r.count} studentFees`);
    } catch (e: any) {
      console.log(`  ⚠️  studentFee still blocked: ${e.message?.slice(0, 120)}`);
    }
  }

  // Level 2: Delete things that reference enrollment
  if (enrollmentIds.length > 0) {
    // attendance might reference enrollment
    try {
      const r = await prisma.attendance.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      if (r.count) console.log(`  🗑️  ${r.count} attendance records`);
    } catch {}

    // Now delete enrollments
    try {
      const r = await prisma.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
      console.log(`  🗑️  ${r.count} enrollments`);
    } catch (e: any) {
      console.log(`  ⚠️  enrollment still blocked: ${e.message?.slice(0, 120)}`);
      console.log(`  Trying one-by-one...`);
      let deleted = 0;
      for (const id of enrollmentIds) {
        try {
          await prisma.enrollment.delete({ where: { id } });
          deleted++;
        } catch {}
      }
      console.log(`  🗑️  ${deleted}/${enrollmentIds.length} enrollments deleted one-by-one`);
    }
  }

  // Level 3: Delete things that reference section
  try {
    const r = await prisma.timetable.deleteMany({ where: { sectionId: { in: orphanedSectionIds } } });
    if (r.count) console.log(`  🗑️  ${r.count} timetables`);
  } catch {}

  // Level 4: Finally delete orphaned sections
  try {
    const r = await prisma.section.deleteMany({ where: { id: { in: orphanedSectionIds } } });
    console.log(`  🗑️  ${r.count} orphaned sections`);
  } catch (e: any) {
    console.log(`  ⚠️  section delete blocked: ${e.message?.slice(0, 120)}`);
    // Try one by one
    let deleted = 0;
    for (const id of orphanedSectionIds) {
      try {
        await prisma.section.delete({ where: { id } });
        deleted++;
      } catch {}
    }
    console.log(`  🗑️  ${deleted}/${orphanedSectionIds.length} sections deleted one-by-one`);
  }

  // Verify
  const remaining = await prisma.section.findMany({ select: { id: true, classId: true } });
  const stillOrphaned = remaining.filter(s => !validClassIds.has(s.classId));
  console.log(`\n${stillOrphaned.length === 0 ? "✅" : "⚠️"} Orphaned sections remaining: ${stillOrphaned.length}`);
  console.log("\n✅ Done! Restart server and refresh dashboard.\n");
}

main()
  .catch((e) => { console.error("❌ Failed:", e.message?.slice(0, 200)); process.exit(1); })
  .finally(() => prisma.$disconnect());

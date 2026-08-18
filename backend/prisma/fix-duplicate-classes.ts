// @ts-nocheck
// ══════════════════════════════════════════════════════════════
// FIX: Remove duplicate classes (keep one per name per academic year)
// ══════════════════════════════════════════════════════════════
// RUN: npx tsx prisma/fix-duplicate-classes.ts
// ══════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("\n🔧 FIX: Removing duplicate classes\n");

  const tenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });
  if (!tenant) { console.error("❌ No tenant"); process.exit(1); }

  // Get all classes grouped by name + academicYearId
  const allClasses = await prisma.class.findMany({
    where: { tenantId: tenant.id, isDeleted: false },
    include: { sections: true, enrollments: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total classes: ${allClasses.length}`);

  // Group by name + academicYearId
  const groups = new Map<string, typeof allClasses>();
  for (const cls of allClasses) {
    const key = `${cls.name.toLowerCase()}|${cls.academicYearId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(cls);
  }

  let duplicatesRemoved = 0;
  let sectionsReassigned = 0;
  let enrollmentsReassigned = 0;

  for (const [key, classes] of groups) {
    if (classes.length <= 1) continue;

    // Keep the one with MORE enrollments (or the first one if equal)
    classes.sort((a, b) => b.enrollments.length - a.enrollments.length);
    const keep = classes[0];
    const duplicates = classes.slice(1);

    console.log(`\n  📋 "${keep.name}" (year: ${keep.academicYearId}): ${classes.length} copies → keeping ID ${keep.id} (${keep.enrollments.length} enrollments)`);

    for (const dup of duplicates) {
      // Reassign sections from duplicate to the kept class
      if (dup.sections.length > 0) {
        for (const section of dup.sections) {
          // Check if kept class already has this section name
          const existsInKept = await prisma.section.findFirst({
            where: { classId: keep.id, name: section.name, tenantId: tenant.id },
          });
          if (existsInKept) {
            // Reassign enrollments from this section to the existing one
            const reassigned = await prisma.enrollment.updateMany({
              where: { sectionId: section.id },
              data: { sectionId: existsInKept.id, classId: keep.id },
            });
            enrollmentsReassigned += reassigned.count;
            // Delete the duplicate section
            try { await prisma.section.delete({ where: { id: section.id } }); } catch {}
          } else {
            // Move section to kept class
            await prisma.section.update({
              where: { id: section.id },
              data: { classId: keep.id },
            });
            sectionsReassigned++;
          }
        }
      }

      // Reassign any remaining enrollments from duplicate class to kept class
      const reassigned = await prisma.enrollment.updateMany({
        where: { classId: dup.id },
        data: { classId: keep.id },
      });
      enrollmentsReassigned += reassigned.count;

      // Delete duplicate class
      try {
        await prisma.class.delete({ where: { id: dup.id } });
        duplicatesRemoved++;
        console.log(`    🗑️  Deleted duplicate: ${dup.id}`);
      } catch (e: any) {
        // If can't delete, soft-delete
        try {
          await prisma.class.update({ where: { id: dup.id }, data: { isDeleted: true } });
          duplicatesRemoved++;
          console.log(`    🗑️  Soft-deleted duplicate: ${dup.id}`);
        } catch {}
      }
    }
  }

  console.log("\n" + "═".repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Duplicate classes removed: ${duplicatesRemoved}`);
  console.log(`   Sections reassigned: ${sectionsReassigned}`);
  console.log(`   Enrollments reassigned: ${enrollmentsReassigned}`);
  console.log("═".repeat(50));

  // Final count
  const finalClasses = await prisma.class.findMany({
    where: { tenantId: tenant.id, isDeleted: false },
  });
  console.log(`\n✅ Done! Classes remaining: ${finalClasses.length}`);
  console.log("   Refresh the Fee Structure page — no more duplicates.\n");
}

main()
  .catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

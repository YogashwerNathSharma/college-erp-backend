// @ts-nocheck
// ══════════════════════════════════════════════════════════════
// SEED: Create Classes & Sections for Academic Year 2026-27
// Only creates classes/sections — touches NOTHING else.
// ══════════════════════════════════════════════════════════════
// RUN: npx tsx prisma/seed-classes-2026-27.ts
// ══════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Exact class-section mapping from your Excel file
const CLASS_SECTIONS: Record<string, string[]> = {
  "PNC":  ["A", "B", "C", "D", "E"],
  "LKG":  ["A", "B", "C", "D", "E", "F"],
  "UKG":  ["A", "B", "C", "D", "E"],
  "I":    ["A", "B", "C", "D", "E", "F", "G"],
  "II":   ["A", "B", "C", "D", "E", "F", "G"],
  "III":  ["A", "B", "C", "D", "E"],
  "IV":   ["A", "B", "C", "D", "E"],
  "V":    ["A", "B", "C", "D", "E"],
  "VI":   ["A", "B", "C", "D"],
  "VII":  ["A", "B", "C", "D"],
  "VIII": ["A", "B", "C", "D"],
  "IX":   ["A", "B", "C", "D"],
};

const ACADEMIC_YEAR_NAME = "2026-27";
const ACADEMIC_YEAR_START = new Date("2026-04-01");
const ACADEMIC_YEAR_END = new Date("2027-03-31");

async function main() {
  console.log(`\n🚀 SEED: Creating Classes & Sections for ${ACADEMIC_YEAR_NAME}\n`);

  // ─── Step 1: Find tenant ─────────────────────────────────────────
  const tenants = await prisma.tenant.findMany({ where: { isDeleted: false } });
  if (!tenants.length) {
    console.error("❌ No tenant found in database!");
    process.exit(1);
  }
  const tenant = tenants[0];
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── Step 2: Find or Create Academic Year 2026-27 ─────────────────
  let academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: tenant.id, name: ACADEMIC_YEAR_NAME },
  });

  if (!academicYear) {
    console.log(`  ⚠️  Academic Year "${ACADEMIC_YEAR_NAME}" not found. Creating...`);
    academicYear = await prisma.academicYear.create({
      data: {
        name: ACADEMIC_YEAR_NAME,
        startDate: ACADEMIC_YEAR_START,
        endDate: ACADEMIC_YEAR_END,
        isActive: true,
        isCurrent: true,
        tenantId: tenant.id,
      },
    });
    console.log(`  ✅ Created Academic Year: ${ACADEMIC_YEAR_NAME}`);

    // Deactivate other academic years
    await prisma.academicYear.updateMany({
      where: { tenantId: tenant.id, id: { not: academicYear.id } },
      data: { isActive: false, isCurrent: false },
    });
    console.log(`  ✅ Deactivated previous academic years`);
  }

  console.log(`✅ Academic Year: ${academicYear.name} (${academicYear.id})\n`);

  // ─── Step 3: Create Classes & Sections ──────────────────────────────
  let classesCreated = 0;
  let sectionsCreated = 0;
  let classesSkipped = 0;
  let sectionsSkipped = 0;

  for (const [className, sections] of Object.entries(CLASS_SECTIONS)) {
    // Check if class already exists
    let cls = await prisma.class.findFirst({
      where: {
        tenantId: tenant.id,
        academicYearId: academicYear.id,
        name: className,
        isDeleted: false,
      },
    });

    if (!cls) {
      cls = await prisma.class.findFirst({
        where: {
          tenantId: tenant.id,
          academicYearId: academicYear.id,
          name: { equals: className, mode: "insensitive" } as any,
          isDeleted: false,
        },
      });
    }

    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name: className,
          tenantId: tenant.id,
          academicYearId: academicYear.id,
        },
      });
      classesCreated++;
      console.log(`  ✅ Created class: ${className}`);
    } else {
      classesSkipped++;
      console.log(`  ⏭️  Class exists: ${className}`);
    }

    // Create sections
    for (const sectionName of sections) {
      let section = await prisma.section.findFirst({
        where: {
          tenantId: tenant.id,
          academicYearId: academicYear.id,
          classId: cls.id,
          name: sectionName,
        },
      });

      if (!section) {
        section = await prisma.section.findFirst({
          where: {
            tenantId: tenant.id,
            academicYearId: academicYear.id,
            classId: cls.id,
            name: { equals: sectionName, mode: "insensitive" } as any,
          },
        });
      }

      if (!section) {
        await prisma.section.create({
          data: {
            name: sectionName,
            classId: cls.id,
            tenantId: tenant.id,
            academicYearId: academicYear.id,
          },
        });
        sectionsCreated++;
      } else {
        sectionsSkipped++;
      }
    }
    console.log(`       Sections: ${sections.join(", ")}`);
  }

  console.log("\n" + "═".repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Academic Year: ${ACADEMIC_YEAR_NAME}`);
  console.log(`   Classes created: ${classesCreated} | skipped: ${classesSkipped}`);
  console.log(`   Sections created: ${sectionsCreated} | skipped: ${sectionsSkipped}`);
  console.log("═".repeat(50));
  console.log(`\n✅ Done! Now select "${ACADEMIC_YEAR_NAME}" in Bulk Import and upload your Excel.\n`);
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

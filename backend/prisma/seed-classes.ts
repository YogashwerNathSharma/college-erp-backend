// @ts-nocheck
// ══════════════════════════════════════════════════════════════
// SEED: Create Classes with exact Sections from Excel
// Only creates classes/sections — touches NOTHING else.
// ══════════════════════════════════════════════════════════════
// RUN: npx tsx prisma/seed-classes.ts
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

async function main() {
  console.log("\n🚀 SEED: Creating Classes & Sections\n");

  // ─── Step 1: Find tenant ─────────────────────────────────────────
  const tenants = await prisma.tenant.findMany({ where: { isDeleted: false } });
  if (!tenants.length) {
    console.error("❌ No tenant found in database! Run seed-superadmin.ts first.");
    process.exit(1);
  }
  // Use first tenant
  const tenant = tenants[0];
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── Step 2: Find or Create Academic Year 2025-26 ─────────────────
  let academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: tenant.id, isActive: true },
  });

  if (!academicYear) {
    // Try finding any academic year for this tenant
    academicYear = await prisma.academicYear.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!academicYear) {
    // Create one if none exists
    console.log("  ⚠️  No academic year found. Creating 2025-26...");
    academicYear = await prisma.academicYear.create({
      data: {
        name: "2025-26",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31"),
        isActive: true,
        isCurrent: true,
        tenantId: tenant.id,
      },
    });
    console.log(`  ✅ Created Academic Year: 2025-26`);
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
      // Also try case-insensitive match
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
      console.log(`  ⏭️  Class exists: ${className} (${cls.id})`);
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
        // Also try case-insensitive
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
  console.log(`   Classes created: ${classesCreated} | skipped: ${classesSkipped}`);
  console.log(`   Sections created: ${sectionsCreated} | skipped: ${sectionsSkipped}`);
  console.log(`   Academic Year: ${academicYear.name} (${academicYear.id})`);
  console.log(`   Tenant: ${tenant.name} (${tenant.id})`);
  console.log("═".repeat(50));
  console.log("\n✅ Done! Now upload the Excel file with SEPARATE Class + Section columns.\n");
  console.log("⚠️  IMPORTANT: Use the file 'ALL_CLASS_STUDENT_DATA_IMPORT_READY_CLASS_SECTION.xlsx'");
  console.log("    (the one with separate 'Class' and 'Section' columns)\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e.message);
    console.error("Stack:", e.stack);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

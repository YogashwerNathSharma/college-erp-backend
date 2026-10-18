/**
 * 🔧 REPAIR: Create missing admission counters
 */

import prisma from "../src/utils/prisma";

async function repairCounters() {
  try {
    console.log("🔧 Repairing admission counters...\n");

    const tenantId = "6a20567f17915b09d64bc57a";

    // Get all academic years
    const years = await prisma.academicYear.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });

    for (const year of years) {
      // Check if counter exists
      const counter = await prisma.admissionCounter.findFirst({
        where: { tenantId, academicYearId: year.id },
      });

      if (!counter) {
        // Count students for this year
        const studentCount = await prisma.student.count({
          where: { tenantId, academicYearId: year.id },
        });

        // ✅ Create counter - use relation objects, NOT direct IDs
        await prisma.admissionCounter.create({
          data: {
            prefix: "ADM",
            lastNumber: studentCount,
            tenant: { connect: { id: tenantId } },
            academicYear: { connect: { id: year.id } },
          },
        });

        console.log(`✅ Created counter for ${year.name}`);
        console.log(`   Students: ${studentCount}`);
        console.log(`   Next ADM#: ADM/${year.name.split("-")[0]}/${String(studentCount + 1).padStart(3, "0")}\n`);
      } else {
        console.log(`✅ Counter exists for ${year.name}`);
        console.log(`   Current: ${counter.lastNumber}\n`);
      }
    }

    console.log("✅ All counters repaired!");
    console.log("\n🚀 Now try creating admission!");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

repairCounters();

/**
 * 🔧 DIRECT FIX: Delete all stale admission counters and recreate them
 * This forces a clean slate
 */

import prisma from "../src/utils/prisma";

async function fixAdmissionNow() {
  try {
    console.log("🔧 Starting direct admission counter fix...");

    // Step 1: Delete ALL stale admission counters
    const deleted = await prisma.admissionCounter.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} stale counter(s)`);

    // Step 2: Get specific tenant and academic year
    const tenantId = "6a20567f17915b09d64bc57a"; // Your tenant from error message
    
    const academicYears = await prisma.academicYear.findMany({
      where: { tenantId },
    });

    console.log(`📊 Found ${academicYears.length} academic year(s) for your tenant`);

    // Step 3: For each academic year, count students and create correct counter
    for (const year of academicYears) {
      const studentCount = await prisma.student.count({
        where: {
          tenantId,
          academicYearId: year.id,
        },
      });

      if (studentCount > 0) {
        // Create counter with correct lastNumber
        await prisma.admissionCounter.create({
          data: {
            tenantId,
            academicYearId: year.id,
            prefix: "ADM",
            lastNumber: studentCount + 1, // Next number to generate
            tenant: { connect: { id: tenantId } },
            academicYear: { connect: { id: year.id } },
          },
        });

        console.log(
          `✅ Year: ${year.name} | Students: ${studentCount} | Next ADM number: ${studentCount + 1}`
        );
      }
    }

    console.log("✅ Admission counter fix complete!");
    console.log("🚀 Try creating admission now - should work!");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmissionNow();

/**
 * CHECK: What's the current counter vs actual students?
 */

import prisma from "../src/utils/prisma";

async function checkStatus() {
  try {
    console.log("📊 Checking admission counter status...\n");

    const tenantId = "6a20567f17915b09d64bc57a";

    // Get all academic years
    const years = await prisma.academicYear.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });

    for (const year of years) {
      console.log(`\n📅 Academic Year: ${year.name}`);
      console.log("─".repeat(60));

      // Count actual students
      const studentCount = await prisma.student.count({
        where: {
          tenantId,
          academicYearId: year.id,
        },
      });

      // Get counter value
      const counter = await prisma.admissionCounter.findFirst({
        where: { tenantId, academicYearId: year.id },
      });

      console.log(`  Actual students: ${studentCount}`);
      console.log(`  Counter lastNumber: ${counter?.lastNumber || 'NOT SET'}`);

      if (counter) {
        const nextNum = counter.lastNumber + 1;
        const nextAdmNo = `ADM/${year.name.split("-")[0]}/${String(nextNum).padStart(3, "0")}`;
        console.log(`  Next admission number would be: ${nextAdmNo}`);

        if (counter.lastNumber < studentCount) {
          console.log(`  ⚠️  PROBLEM: Counter is behind! (${counter.lastNumber} < ${studentCount})`);
          console.log(`  📌 Fix: Update counter to ${studentCount}`);
        } else if (counter.lastNumber >= studentCount) {
          console.log(`  ✅ Counter looks good`);
        }
      } else {
        console.log(`  ❌ NO COUNTER SET!`);
        console.log(`  📌 Fix: Create counter with lastNumber = ${studentCount}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("To fix: run scripts/repair-counter.ts");
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();

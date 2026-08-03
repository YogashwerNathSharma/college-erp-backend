/**
 * 🔨 FORCE: Create counter directly with correct fields
 */

import prisma from "../src/utils/prisma";

async function forceCreateCounter() {
  try {
    console.log("🔨 Force creating counter for 2026-27...\n");

    const tenantId = "6a20567f17915b09d64bc57a";
    const academicYearId = "6a4a47b0fdcb4986aea9ed49";

    // First delete any existing
    await prisma.admissionCounter.deleteMany({
      where: { tenantId, academicYearId },
    });
    console.log("✅ Cleared old counter");

    // Create fresh counter
    const counter = await prisma.admissionCounter.create({
      data: {
        prefix: "ADM",
        lastNumber: 0,
        format: "PREFIX/YEAR/SERIAL",
        tenant: { connect: { id: tenantId } },
        academicYear: { connect: { id: academicYearId } },
      },
    });

    console.log("✅ Created new counter!");
    console.log(`   ID: ${counter.id}`);
    console.log(`   lastNumber: ${counter.lastNumber}`);
    console.log(`   Next ADM#: ADM/2026/001`);

    // Verify
    const verify = await prisma.admissionCounter.findFirst({
      where: { tenantId, academicYearId },
    });

    console.log(`\n✅ Verification: ${verify ? "EXISTS" : "MISSING"}`);
    console.log(`\n🚀 Try creating admission now!`);
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

forceCreateCounter();

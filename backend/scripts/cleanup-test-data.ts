import prisma from "../src/utils/prisma";

async function cleanup() {
  try {
    const tenantId = "6a20567f17915b09d64bc57a";
    const academicYearId = "6a4a47b0fdcb4986aea9ed49";

    console.log("🗑️  Cleaning up test data...");

    const deleted = await prisma.student.deleteMany({
      where: { tenantId, academicYearId }
    });

    console.log(`✅ Deleted ${deleted.count} test students`);

    await prisma.admissionCounter.updateMany({
      where: { tenantId, academicYearId },
      data: { lastNumber: 0 }
    });

    console.log("✅ Counter reset to 0");
    console.log("✅ Ready for fresh admissions!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

cleanup();

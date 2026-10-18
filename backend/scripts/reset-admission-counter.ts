/**
 * 🔧 CLEANUP SCRIPT: Reset Admission Counter
 * 
 * Use this if you get "Unique constraint failed" errors on admission
 * This syncs the counter to match existing students in the database
 */

import prisma from "../src/utils/prisma";

async function resetAdmissionCounter() {
  try {
    console.log("🔧 Starting admission counter reset...");

    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`📊 Found ${tenants.length} tenant(s)`);

    for (const tenant of tenants) {
      // Get all academic years
      const academicYears = await prisma.academicYear.findMany({
        where: { tenantId: tenant.id },
      });

      for (const year of academicYears) {
        // Count existing students
        const existingCount = await prisma.student.count({
          where: {
            tenantId: tenant.id,
            academicYearId: year.id,
          },
        });

        // Get current counter
        const counter = await prisma.admissionCounter.findFirst({
          where: {
            tenantId: tenant.id,
            academicYearId: year.id,
          },
        });

        const oldValue = counter?.lastNumber || 0;

        // Update counter to match existing count
        if (existingCount > 0) {
          await prisma.admissionCounter.upsert({
            where: {
              tenantId_academicYearId: {
                tenantId: tenant.id,
                academicYearId: year.id,
              },
            },
            update: {
              lastNumber: existingCount,
            },
            create: {
              prefix: "ADM",
              lastNumber: existingCount,
              tenant: { connect: { id: tenant.id } },
              academicYear: { connect: { id: year.id } },
            },
          });

          console.log(
            `✅ Tenant: ${tenant.name} | Year: ${year.name} | Updated counter: ${oldValue} → ${existingCount}`
          );
        }
      }
    }

    console.log("✅ Admission counter reset complete!");
    console.log("🚀 You can now create new admissions without duplicate errors");
  } catch (err: any) {
    console.error("❌ Error resetting counter:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmissionCounter();

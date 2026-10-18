/**
 * 📋 LIST: All admission numbers for debugging
 */

import prisma from "../src/utils/prisma";

async function listAdmissions() {
  try {
    console.log("📋 All students in 2026-27:\n");

    const tenantId = "6a20567f17915b09d64bc57a";
    const academicYearId = "6a4a47b0fdcb4986aea9ed49";

    const students = await prisma.student.findMany({
      where: {
        tenantId,
        academicYearId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        isDeleted: true,
      },
      orderBy: { admissionNo: "asc" },
    });

    if (students.length === 0) {
      console.log("✅ NO students found - should be able to create!");
    } else {
      console.log(`Found ${students.length} student(s):\n`);
      students.forEach((s) => {
        console.log(
          `  ${s.admissionNo.padEnd(15)} | ${s.firstName} ${s.lastName}${s.isDeleted ? " (DELETED)" : ""}`
        );
      });
    }

    // Check counter
    const counter = await prisma.admissionCounter.findFirst({
      where: { tenantId, academicYearId },
    });

    console.log(`\nCounter lastNumber: ${counter?.lastNumber || "NOT SET"}`);
    console.log(`Next would be: ADM/2026/${String((counter?.lastNumber || 0) + 1).padStart(3, "0")}`);
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmissions();

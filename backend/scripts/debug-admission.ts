/**
 * 🔍 DEBUG: What admission number is being generated?
 */

import prisma from "../src/utils/prisma";
import { generateAdmissionNumber } from "../src/modules/students/admission-number.service";

async function debugAdmission() {
  try {
    console.log("🔍 Testing admission number generation...\n");

    const tenantId = "6a20567f17915b09d64bc57a";
    const academicYearId = "6a4a47b0fdcb4986aea9ed49"; // 2026-27

    // Generate admission number
    const admNo = await generateAdmissionNumber(tenantId, academicYearId);
    console.log(`✅ Generated: ${admNo}`);

    // Check if it already exists
    const existing = await prisma.student.findFirst({
      where: {
        admissionNo: admNo,
        tenantId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
      },
    });

    if (existing) {
      console.log(`\n❌ PROBLEM: ${admNo} already exists!`);
      console.log(`   Student: ${existing.firstName} ${existing.lastName}`);
      console.log(`   ID: ${existing.id}`);
    } else {
      console.log(`\n✅ ${admNo} is available - should work!`);
    }

    // Check counter
    const counter = await prisma.admissionCounter.findFirst({
      where: { tenantId, academicYearId },
    });

    console.log(`\nCounter status:`);
    console.log(`  lastNumber: ${counter?.lastNumber}`);

    // Count students
    const studentCount = await prisma.student.count({
      where: { tenantId, academicYearId },
    });

    console.log(`  actual students: ${studentCount}`);

    if (counter && counter.lastNumber <= studentCount) {
      console.log(`  ⚠️  Counter is TOO LOW!`);
      console.log(`  📌 Fix: Update counter to ${studentCount + 1}`);
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdmission();

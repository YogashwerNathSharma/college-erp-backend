/**
 * FIND & CLEAN: Identify duplicate admission numbers
 */

import prisma from "../src/utils/prisma";

async function findDuplicates() {
  try {
    console.log("🔍 Searching for duplicate admission numbers...\n");

    // ✅ Correct: use _count in having
    const duplicates = await prisma.student.groupBy({
      by: ["admissionNo", "tenantId"],
      _count: {
        id: true,
      },
      having: {
        id: {
          gt: 1,  // ✅ Compare the count
        },
      },
    });

    if (duplicates.length === 0) {
      console.log("✅ No duplicates found!");
      console.log("\nℹ️  Admission number should work now.");
      console.log("If still failing:");
      console.log("   - Restart backend: npm run dev");
      console.log("   - Try creating admission again");
    } else {
      console.log(`❌ Found ${duplicates.length} duplicate admission numbers:\n`);
      
      // Detailed report
      for (const dup of duplicates) {
        const students = await prisma.student.findMany({
          where: {
            admissionNo: dup.admissionNo,
            tenantId: dup.tenantId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        console.log(`  📌 ${dup.admissionNo}: ${dup._count?.id || 0} students`);
        students.forEach((s, idx) => {
          console.log(
            `     ${idx === 0 ? "✅ KEEP" : "❌ DELETE"}: ${s.firstName} ${s.lastName} (${s.createdAt})`
          );
        });

        // Soft-delete duplicates (keep the latest)
        for (let i = 1; i < students.length; i++) {
          await prisma.student.update({
            where: { id: students[i].id },
            data: { isDeleted: true },
          });
          console.log(`     ✓ Soft-deleted: ${students[i].id}`);
        }
      }

      console.log("\n✅ Duplicates cleaned!");
    }
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    console.error("\nTrying alternative approach...");
    
    // Fallback: manual loop
    try {
      const allStudents = await prisma.student.findMany({
        where: { isDeleted: false },
        select: { id: true, admissionNo: true, tenantId: true, firstName: true, lastName: true, createdAt: true },
      });

      const grouped: { [key: string]: typeof allStudents } = {};
      allStudents.forEach((s) => {
        const key = `${s.admissionNo}|${s.tenantId}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      });

      let hasDuplicates = false;
      for (const [key, students] of Object.entries(grouped)) {
        if (students.length > 1) {
          hasDuplicates = true;
          console.log(`  📌 ${key}: ${students.length} students`);
          
          // Sort by createdAt, keep latest
          const sorted = students.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          for (let i = 1; i < sorted.length; i++) {
            await prisma.student.update({
              where: { id: sorted[i].id },
              data: { isDeleted: true },
            });
            console.log(`     ✓ Soft-deleted: ${sorted[i].id}`);
          }
        }
      }

      if (!hasDuplicates) {
        console.log("✅ No duplicates found!");
      } else {
        console.log("\n✅ Duplicates cleaned!");
      }
    } catch (fallbackErr: any) {
      console.error("❌ Fallback also failed:", fallbackErr.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicates();

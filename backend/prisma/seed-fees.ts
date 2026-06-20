// @ts-nocheck
/**
 * 💰 FEE SEED SCRIPT
 * Creates Fee Heads + Fee Structures for all classes (1-10)
 * Run: npx ts-node prisma/seed-fees.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("💰 Starting Fee Seed...\n");

  // Find tenant
  const tenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });
  if (!tenant) {
    console.error("❌ No tenant found!");
    process.exit(1);
  }
  console.log(`✅ Tenant: ${tenant.name}\n`);

  const tenantId = tenant.id;

  // Find academic year
  const academicYear = await prisma.academicYear.findFirst({
    where: { tenantId, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  if (!academicYear) {
    console.error("❌ No academic year found!");
    process.exit(1);
  }
  console.log(`✅ Academic Year: ${academicYear.name}\n`);

  const academicYearId = academicYear.id;

  // ─── Step 1: Create Fee Heads ───
  console.log("📋 Creating Fee Heads...");
  const feeHeadData = [
    { name: "Tuition Fee", code: "TF", type: "RECURRING", description: "Monthly tuition fee" },
    { name: "Admission Fee", code: "AF", type: "ONE_TIME", description: "One-time admission fee" },
    { name: "Sports Fee", code: "SF", type: "RECURRING", description: "Sports and games fee" },
    { name: "Library Fee", code: "LF", type: "RECURRING", description: "Library maintenance fee" },
    { name: "Computer Fee", code: "CF", type: "RECURRING", description: "Computer lab fee" },
    { name: "Exam Fee", code: "EF", type: "RECURRING", description: "Examination fee" },
    { name: "Development Fee", code: "DF", type: "RECURRING", description: "School development fee" },
  ];

  const feeHeads: any[] = [];
  for (const head of feeHeadData) {
    try {
      const existing = await prisma.feeHead.findFirst({
        where: { tenantId, name: head.name },
      });
      if (existing) {
        feeHeads.push(existing);
      } else {
        const created = await prisma.feeHead.create({
          data: { tenantId, ...head },
        });
        feeHeads.push(created);
      }
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`✅ ${feeHeads.length} Fee Heads ready\n`);

  // ─── Step 2: Create Fee Structures for each class ───
  console.log("🏗️ Creating Fee Structures for all classes...");

  // Find all classes
  const classes = await prisma.class.findMany({
    where: { tenantId, academicYearId, isDeleted: false },
    orderBy: { name: "asc" },
  });

  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  if (classes.length === 0) {
    console.error("❌ No classes found! Run seed-demo.ts first.");
    process.exit(1);
  }

  // Fee amounts per class (higher classes = higher fees)
  const classFeeMap: Record<string, number> = {
    "Class I": 1500, "Class II": 1600, "Class III": 1700, "Class IV": 1800, "Class V": 1900,
    "Class VI": 2000, "Class VII": 2200, "Class VIII": 2400, "Class IX": 2800, "Class X": 3200,
  };

  let structureCount = 0;

  for (const cls of classes) {
    const baseAmount = classFeeMap[cls.name] || 2000;
    const totalAmount = baseAmount; // per month

    // Check if structure already exists
    const existing = await prisma.feeStructure.findFirst({
      where: { tenantId, classId: cls.id, academicYearId },
    });

    if (existing) {
      console.log(`  ⏭️ ${cls.name} - already exists`);
      continue;
    }

    try {
      // Create fee structure
      const structure = await prisma.feeStructure.create({
        data: {
          tenantId,
          academicYearId,
          classId: cls.id,
          name: `${cls.name} Fee ${academicYear.name}`,
          totalAmount: totalAmount,
          installmentType: "MONTHLY",
          totalInstallments: 12,
          dueDay: 10,
          isActive: true,
        },
      });

      // Create fee structure items (breakdown by fee heads)
      const itemBreakdown = [
        { feeHeadId: feeHeads[0]?.id, amount: Math.round(baseAmount * 0.50) }, // Tuition 50%
        { feeHeadId: feeHeads[2]?.id, amount: Math.round(baseAmount * 0.10) }, // Sports 10%
        { feeHeadId: feeHeads[3]?.id, amount: Math.round(baseAmount * 0.10) }, // Library 10%
        { feeHeadId: feeHeads[4]?.id, amount: Math.round(baseAmount * 0.15) }, // Computer 15%
        { feeHeadId: feeHeads[5]?.id, amount: Math.round(baseAmount * 0.08) }, // Exam 8%
        { feeHeadId: feeHeads[6]?.id, amount: Math.round(baseAmount * 0.07) }, // Development 7%
      ];

      for (const item of itemBreakdown) {
        if (item.feeHeadId) {
          await prisma.feeStructureItem.create({
            data: {
              feeStructureId: structure.id,
              feeHeadId: item.feeHeadId,
              amount: item.amount,
              frequency: "PER_INSTALLMENT",
            },
          });
        }
      }

      structureCount++;
      console.log(`  ✅ ${cls.name} - ₹${totalAmount}/month (12 installments)`);
    } catch (e: any) {
      console.log(`  ❌ ${cls.name} - ${e.message}`);
    }
  }

  console.log(`\n✅ ${structureCount} Fee Structures created!`);

  // ─── Summary ───
  console.log("\n" + "═".repeat(50));
  console.log("💰 FEE SEED COMPLETE!");
  console.log("═".repeat(50));
  console.log(`  Fee Heads:      ${feeHeads.length}`);
  console.log(`  Fee Structures: ${structureCount} (for ${classes.length} classes)`);
  console.log(`  Installments:   Monthly (12 per year)`);
  console.log(`  Due Day:        10th of every month`);
  console.log("\n  Now go to Fee Collection → Search student → Assign Fees ✅");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Fee seed failed:", e);
  prisma.$disconnect();
  process.exit(1);
});

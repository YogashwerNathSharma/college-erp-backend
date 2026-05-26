import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // ==============================
  // SUPER ADMIN (GLOBAL)
  // ==============================
  const superAdminEmail = "superadmin@gmail.com";

  const superAdminExists = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!superAdminExists) {
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: superAdminEmail,
        password: await bcrypt.hash("123456", 10),
        role: "SUPER_ADMIN",
        tenantId: null,
      },
    });
    console.log("✅ Super Admin created");
  }

  // ==============================
  // TENANT
  // ==============================
  let tenant = await prisma.tenant.findFirst({
    where: { name: "RMS ACADEMY" },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "RMS ACADEMY",
        type: "SCHOOL",
        logoUrl: "http://localhost:5000/uploads/rmslogo.jpg",
        backgroundUrl: "http://localhost:5000/uploads/myimage.png",
      },
    });
    console.log("✅ Tenant created");
  }

  // ==============================
  // ADMIN USER
  // ==============================
  const adminEmail = "admin@gmail.com";

  const adminExists = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password: await bcrypt.hash("123456", 10),
        role: "ADMIN",
        tenantId: tenant.id,
      },
    });
    console.log("✅ Admin created");
  }

  // ==============================
  // ACADEMIC YEAR
  // ==============================
  let academicYear = await prisma.academicYear.findFirst({
    where: {
      name: "2025-26",
      tenantId: tenant.id,
    },
  });

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: "2025-26",
        tenantId: tenant.id,
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31"),
      },
    });
    console.log("✅ Academic Year created");
  }

  // ==============================
  // CLASSES + SECTION + FEE
  // ==============================
  for (let i = 1; i <= 10; i++) {
    const className = `Class ${i}`;

    let cls = await prisma.class.findFirst({
      where: {
        name: className,
        tenantId: tenant.id,
      },
    });

    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name: className,
          tenantId: tenant.id,
          academicYearId: academicYear.id,
        },
      });
    }

    let section = await prisma.section.findFirst({
      where: {
        name: "A",
        classId: cls.id,
      },
    });

    if (!section) {
      section = await prisma.section.create({
        data: {
          name: "A",
          classId: cls.id,
          tenantId: tenant.id,
          academicYearId: academicYear.id,
        },
      });
    }

    let feeStructure = await prisma.feeStructure.findFirst({
      where: {
        classId: cls.id,
      },
    });

    if (!feeStructure) {
      feeStructure = await prisma.feeStructure.create({
        data: {
          name: "Annual Fee",
          amount: 10000,
          frequency: "YEARLY",
          classId: cls.id,
          tenantId: tenant.id,
          academicYearId: academicYear.id,
        },
      });
    }

    // ==============================
    // STUDENTS + FEES
    // ==============================
    for (let j = 1; j <= 10; j++) {
      const email = `student${i}_${j}@test.com`;

      const existingStudent = await prisma.student.findFirst({
        where: { email },
      });

      if (existingStudent) continue;

      const student = await prisma.student.create({
        data: {
          firstName: "Student",
          lastName: `${i}-${j}`,
          gender: "MALE",
          dob: new Date("2010-01-01"),

          email,
          phone: `9999999${j}${i}`,
          address: "Demo Address",

          admissionNo: `ADM-${i}-${j}`,
          fatherName: "Father",
          motherName: "Mother",
          parentPhone: "9999999999",

          tenantId: tenant.id,
          academicYearId: academicYear.id,
        },
      });

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: cls.id,
          sectionId: section.id,
          academicYearId: academicYear.id,
          tenantId: tenant.id,
        },
      });

      let total = 10000;
      let paid = 0;
      let pending = total;
      let status = "UNPAID";

      if (j % 2 === 0) {
        paid = total / 2;
        pending = total / 2;
        status = "PARTIAL";
      }

      if (j % 3 === 0) {
        paid = total;
        pending = 0;
        status = "PAID";
      }

      await prisma.studentFee.create({
        data: {
          enrollmentId: enrollment.id,
          feeStructureId: feeStructure.id,
          tenantId: tenant.id,

          totalAmount: total,
          paidAmount: paid,
          pendingAmount: pending,
          status,
          dueDate: new Date(),
        },
      });
    }

    console.log(`✅ Data seeded for ${className}`);
  }

  console.log("🌱 Seeding completed 🚀");
}

main()
  .catch((e) => {
    console.error("❌ SEED ERROR:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
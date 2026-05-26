import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

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

      // 🔥 IMPORTANT (same as your upload system)
      logoUrl: "http://localhost:5000/uploads/rmslogo.jpg",
      backgroundUrl: "http://localhost:5000/uploads/myimage.png",
    },
  });

  console.log("✅ RMS tenant created with logo");
} else {
  // 🔥 update bhi kar do (agar pehle se hai)
  tenant = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      logoUrl: "http://localhost:5000/uploads/rmslogo.jpg",
      backgroundUrl: "http://localhost:5000/uploads/myimage.png",
    },
  });

  console.log("✅ RMS tenant updated with logo");
}

  // ==============================
  // ADMIN
  // ==============================
  const existingUser = await prisma.user.findUnique({
    where: {
      email_tenantId: {
        email: "admin@gmail.com",
        tenantId: tenant.id,
      },
    },
  });

  if (!existingUser) {
    const hashed = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@gmail.com",
        password: hashed,
        role: "ADMIN",
        tenantId: tenant.id,
      },
    });
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
  }

  // ==============================
  // CLASSES + SECTION + FEE STRUCTURE
  // ==============================
  const classes = [];

  for (let i = 1; i <= 10; i++) {
    const className = `Class ${i}`;

    const cls = await prisma.class.create({
      data: {
        name: className,
        tenantId: tenant.id,
        academicYearId: academicYear.id,
      },
    });

    const section = await prisma.section.create({
      data: {
        name: "A",
        classId: cls.id,
        tenantId: tenant.id,
        academicYearId: academicYear.id,
      },
    });

    const feeStructure = await prisma.feeStructure.create({
      data: {
        name: "Annual Fee",
        amount: 10000,
        frequency: "YEARLY",
        classId: cls.id,
        tenantId: tenant.id,
        academicYearId: academicYear.id,
      },
    });

    classes.push({ cls, section, feeStructure });
  }

  // ==============================
  // STUDENTS + ENROLLMENT + FEES
  // ==============================
  for (const item of classes) {
    for (let i = 1; i <= 10; i++) {
      const student = await prisma.student.create({
        data: {
          firstName: "Student",
          lastName: `${item.cls.name}-${i}`,
          gender: "MALE",
          dob: new Date("2010-01-01"),

          email: `student${item.cls.name}${i}@test.com`,
          phone: `99999999${i}`,
          address: "Demo Address",

          admissionNo: `${item.cls.name}-${i}`,
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
          classId: item.cls.id,
          sectionId: item.section.id,
          academicYearId: academicYear.id,
          tenantId: tenant.id,
        },
      });

      const total = 10000;
      let paid = 0;
      let pending = total;
      let status = "UNPAID";

      if (i % 2 === 0) {
        paid = total / 2;
        pending = total / 2;
        status = "PARTIAL";
      }

      if (i % 3 === 0) {
        paid = total;
        pending = 0;
        status = "PAID";
      }

      await prisma.studentFee.create({
        data: {
          enrollmentId: enrollment.id,
          feeStructureId: item.feeStructure.id,
          tenantId: tenant.id,

          totalAmount: total,
          paidAmount: paid,
          pendingAmount: pending,
          status,
          dueDate: new Date(),
        },
      });
    }

    console.log(`✅ 10 students added for ${item.cls.name}`);
  }

  console.log("🌱 Seeding completed 🚀");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
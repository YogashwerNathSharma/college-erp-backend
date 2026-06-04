import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding academic data (SuperAdmin & Tenant already exist)...\n");

  // ==============================
  // FIND EXISTING TENANT
  // ==============================
  const tenant = await prisma.tenant.findFirst({
    where: { isDeleted: false },
    orderBy: { createdAt: "asc" },
  });

  if (!tenant) {
    console.log("❌ No tenant found! Please create a tenant first via SuperAdmin.");
    return;
  }

  console.log(`📌 Using Tenant: ${tenant.name} (${tenant.id})\n`);

  // ==============================
  // ACADEMIC YEARS
  // ==============================
  let ay2025 = await prisma.academicYear.findFirst({
    where: { name: "2025-26", tenantId: tenant.id },
  });

  if (!ay2025) {
    ay2025 = await prisma.academicYear.create({
      data: {
        name: "2025-26",
        tenantId: tenant.id,
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31"),
      },
    });
    console.log("✅ Academic Year 2025-26 created");
  } else {
    console.log("⚠️ Academic Year 2025-26 already exists");
  }

  let ay2026 = await prisma.academicYear.findFirst({
    where: { name: "2026-27", tenantId: tenant.id },
  });

  if (!ay2026) {
    ay2026 = await prisma.academicYear.create({
      data: {
        name: "2026-27",
        tenantId: tenant.id,
        startDate: new Date("2026-04-01"),
        endDate: new Date("2027-03-31"),
      },
    });
    console.log("✅ Academic Year 2026-27 created");
  }

  // ==============================
  // SUBJECTS
  // ==============================
  const subjectNames = [
    "Hindi", "English", "Mathematics", "Science",
    "Social Science", "Computer", "Sanskrit", "Drawing",
    "Physical Education", "General Knowledge",
  ];

  for (const subName of subjectNames) {
    const exists = await prisma.subject.findFirst({
      where: { name: subName, tenantId: tenant.id },
    });
    if (!exists) {
      await prisma.subject.create({
        data: { name: subName, tenantId: tenant.id },
      });
    }
  }
  console.log("✅ Subjects created (10)");

  // ==============================
  // TEACHERS
  // ==============================
  const teacherData = [
    { name: "Rajesh Kumar", email: "rajesh.teacher@school.com", phone: "9111111111", subject: "Mathematics", gender: "MALE", qualification: "M.Sc. Mathematics" },
    { name: "Priya Sharma", email: "priya.teacher@school.com", phone: "9222222222", subject: "Science", gender: "FEMALE", qualification: "M.Sc. Physics" },
    { name: "Amit Verma", email: "amit.teacher@school.com", phone: "9333333333", subject: "Hindi", gender: "MALE", qualification: "M.A. Hindi" },
    { name: "Sunita Devi", email: "sunita.teacher@school.com", phone: "9444444444", subject: "English", gender: "FEMALE", qualification: "M.A. English" },
    { name: "Mohit Singh", email: "mohit.teacher@school.com", phone: "9555555555", subject: "Social Science", gender: "MALE", qualification: "M.A. History" },
    { name: "Neha Gupta", email: "neha.teacher@school.com", phone: "9666666666", subject: "Computer", gender: "FEMALE", qualification: "B.Tech CS" },
    { name: "Suresh Yadav", email: "suresh.teacher@school.com", phone: "9777777777", subject: "Sanskrit", gender: "MALE", qualification: "M.A. Sanskrit" },
    { name: "Kavita Mishra", email: "kavita.teacher@school.com", phone: "9888888888", subject: "Drawing", gender: "FEMALE", qualification: "B.F.A." },
  ];

  for (const t of teacherData) {
    const exists = await prisma.teacher.findFirst({
      where: { email: t.email, tenantId: tenant.id },
    });
    if (!exists) {
      await prisma.teacher.create({
        data: {
          name: t.name,
          email: t.email,
          phone: t.phone,
          gender: t.gender,
          subject: t.subject,
          tenantId: tenant.id,
          isDeleted: false,
        },
      });
    }
  }
  console.log("✅ Teachers created (8)");

  // ==============================
  // CLASSES + SECTIONS + FEE STRUCTURES + STUDENTS
  // ==============================
  const classNames = [
    "Nursery", "LKG", "UKG",
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  ];

  const sectionNames = ["A", "B"];

  const feeAmounts: Record<string, number> = {
    "Nursery": 6000, "LKG": 7000, "UKG": 7500,
    "Class 1": 8000, "Class 2": 8500, "Class 3": 9000,
    "Class 4": 9500, "Class 5": 10000, "Class 6": 10500,
    "Class 7": 11000, "Class 8": 11500, "Class 9": 12000,
    "Class 10": 13000,
  };

  const firstNames = ["Aarav", "Vivaan", "Ishika", "Ananya", "Rohan", "Kavya", "Arjun", "Diya"];
  const lastNames = ["Sharma", "Verma", "Singh", "Gupta", "Patel", "Yadav", "Mishra", "Kumar"];
  const genders = ["MALE", "MALE", "FEMALE", "FEMALE", "MALE", "FEMALE", "MALE", "FEMALE"];
  const bloodGroups = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
  const categories = ["General", "OBC", "SC", "ST", "General", "OBC", "SC", "General"];
  const religions = ["Hindu", "Hindu", "Muslim", "Hindu", "Sikh", "Hindu", "Christian", "Hindu"];

  let totalStudents = 0;
  let serialCounter = 0;

  for (let ci = 0; ci < classNames.length; ci++) {
    const className = classNames[ci];

    // CREATE CLASS
    let cls = await prisma.class.findFirst({
      where: { name: className, tenantId: tenant.id },
    });

    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name: className,
          tenantId: tenant.id,
          academicYearId: ay2025.id,
        },
      });
    }

    // CREATE SECTIONS (A & B)
    const sections: any[] = [];
    for (const secName of sectionNames) {
      let section = await prisma.section.findFirst({
        where: { name: secName, classId: cls.id, tenantId: tenant.id },
      });

      if (!section) {
        section = await prisma.section.create({
          data: {
            name: secName,
            classId: cls.id,
            tenantId: tenant.id,
            academicYearId: ay2025.id,
          },
        });
      }
      sections.push(section);
    }

    // CREATE FEE STRUCTURE
    let feeStructure = await prisma.feeStructure.findFirst({
      where: { classId: cls.id, tenantId: tenant.id },
    });

    if (!feeStructure) {
      feeStructure = await prisma.feeStructure.create({
        data: {
          name: `${className} Annual Fee`,
          amount: feeAmounts[className] || 10000,
          frequency: "YEARLY",
          classId: cls.id,
          tenantId: tenant.id,
          academicYearId: ay2025.id,
        },
      });
    }

    // CREATE STUDENTS (8 per class — 4 in Section A, 4 in Section B)
    for (let j = 0; j < 8; j++) {
      serialCounter++;
      const sectionIndex = j < 4 ? 0 : 1; // first 4 in A, next 4 in B
      const section = sections[sectionIndex];

      const admNo = `ADM/2025/${String(serialCounter).padStart(4, "0")}`;
      const email = `student.${ci + 1}.${j + 1}@test.com`;

      const existingStudent = await prisma.student.findFirst({
        where: { admissionNo: admNo, tenantId: tenant.id },
      });

      if (existingStudent) continue;

      const fname = firstNames[j % firstNames.length];
      const lname = lastNames[(ci + j) % lastNames.length];
      const gender = genders[j % genders.length];

      // Realistic DOB based on class
      const birthYear = 2019 - ci; // Nursery = 2019, Class 10 = 2006
      const birthMonth = ((j + 1) * 2) % 12 || 1;

      const student = await prisma.student.create({
        data: {
          firstName: fname,
          lastName: lname,
          gender,
          dob: new Date(`${birthYear}-${String(birthMonth).padStart(2, "0")}-15`),
          email,
          phone: `98${String(ci + 1).padStart(2, "0")}${String(j + 1).padStart(2, "0")}${String(serialCounter).padStart(4, "0")}`,
          address: `Ward ${j + 1}, Bareilly, UP 243001`,
          admissionNo: admNo,
          fatherName: `${fname}'s Father`,
          fatherPhone: `97${ci}${j}1110${serialCounter}`,
          motherName: `${fname}'s Mother`,
          motherPhone: `96${ci}${j}2220${serialCounter}`,
          bloodGroup: bloodGroups[j % bloodGroups.length],
          religion: religions[j % religions.length],
          category: categories[j % categories.length],
          tenantId: tenant.id,
          academicYearId: ay2025.id,
          isDeleted: false,
          status: "active",
        },
      });

      // ENROLLMENT
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: cls.id,
          sectionId: section.id,
          academicYearId: ay2025.id,
          tenantId: tenant.id,
        },
      });

      // STUDENT FEE (varied statuses)
      const totalAmount = feeAmounts[className] || 10000;
      let paidAmount = 0;
      let pendingAmount = totalAmount;
      let status = "UNPAID";

      if (j === 0 || j === 4) {
        // Fully paid
        paidAmount = totalAmount;
        pendingAmount = 0;
        status = "PAID";
      } else if (j === 1 || j === 5) {
        // Half paid
        paidAmount = Math.round(totalAmount / 2);
        pendingAmount = totalAmount - paidAmount;
        status = "PARTIAL";
      } else if (j === 2 || j === 6) {
        // 75% paid
        paidAmount = Math.round(totalAmount * 0.75);
        pendingAmount = totalAmount - paidAmount;
        status = "PARTIAL";
      }
      // j === 3, 7 → UNPAID

      await prisma.studentFee.create({
        data: {
          enrollmentId: enrollment.id,
          feeStructureId: feeStructure.id,
          tenantId: tenant.id,
          totalAmount,
          paidAmount,
          pendingAmount,
          status,
          dueDate: new Date("2025-07-15"),
        },
      });

      totalStudents++;
    }

    console.log(`✅ ${className} — 2 sections, fee structure, 8 students seeded`);
  }

  // ==============================
  // ADMISSION COUNTER
  // ==============================
  const counterExists = await prisma.admissionCounter.findFirst({
    where: { tenantId: tenant.id, academicYear: "2025" },
  });

  if (!counterExists) {
    await prisma.admissionCounter.create({
      data: {
        tenantId: tenant.id,
        academicYear: "2025",
        lastSerial: serialCounter,
      },
    });
  } else {
    await prisma.admissionCounter.update({
      where: { id: counterExists.id },
      data: { lastSerial: serialCounter },
    });
  }

  // ==============================
  // PLATFORM SETTINGS
  // ==============================
  const platformExists = await prisma.platformSettings.findFirst();
  if (!platformExists) {
    await prisma.platformSettings.create({
      data: {
        appName: "College ERP",
        tagline: "Complete School Management System",
        primaryColor: "#4f46e5",
      },
    });
    console.log("✅ Platform Settings created");
  }

  // ==============================
  // SUMMARY
  // ==============================
  console.log("\n=====================================");
  console.log("🌱 SEEDING COMPLETE!");
  console.log("=====================================");
  console.log(`📌 Tenant: ${tenant.name}`);
  console.log(`📚 Academic Years: 2025-26, 2026-27`);
  console.log(`📖 Subjects: 10`);
  console.log(`👨‍🏫 Teachers: 8`);
  console.log(`🏫 Classes: 13 (Nursery → Class 10)`);
  console.log(`📋 Sections: 26 (A + B per class)`);
  console.log(`💰 Fee Structures: 13`);
  console.log(`👨‍🎓 Students: ${totalStudents}`);
  console.log(`📝 Enrollments: ${totalStudents}`);
  console.log(`💳 Student Fees: ${totalStudents} (PAID/PARTIAL/UNPAID mixed)`);
  console.log(`🔢 Admission Counter: ${serialCounter}`);
  console.log("=====================================\n");
}

main()
  .catch((e) => {
    console.error("❌ SEED ERROR:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
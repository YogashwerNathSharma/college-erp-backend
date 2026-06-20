import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 CLEANING DATABASE (keeping SuperAdmin + Tenant)...\n");

  // Delete in reverse dependency order
  // ═══════════ TRANSPORT ═══════════
  await prisma.transportAttendance.deleteMany({});
  await prisma.transportAssignment.deleteMany({});
  await prisma.routeStop.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.transportSetting.deleteMany({});
  console.log("  ✅ Transport cleaned");

  // ═══════════ LIBRARY ═══════════
  await prisma.bookIssue.deleteMany({});
  await prisma.libraryMember.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.bookCategory.deleteMany({});
  await prisma.librarySetting.deleteMany({});
  console.log("  ✅ Library cleaned");

  // ═══════════ EXAM ═══════════
  await prisma.invigilatorAssignment.deleteMany({});
  await prisma.seatingArrangement.deleteMany({});
  await prisma.admitCard.deleteMany({});
  await prisma.questionPaper.deleteMany({});
  await prisma.examSchedule.deleteMany({});
  await prisma.resultSummary.deleteMany({});
  await prisma.marksEntry.deleteMany({});
  await prisma.gradeSetting.deleteMany({});
  await prisma.examSubject.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.room.deleteMany({});
  console.log("  ✅ Exam cleaned");

  // ═══════════ FEE ═══════════
  await prisma.payment.deleteMany({});
  await prisma.studentFeeDiscount.deleteMany({});
  await prisma.studentFee.deleteMany({});
  await prisma.feeStructureItem.deleteMany({});
  await prisma.feeStructure.deleteMany({});
  await prisma.fineRule.deleteMany({});
  await prisma.feeDiscount.deleteMany({});
  await prisma.feeHead.deleteMany({});
  console.log("  ✅ Fee cleaned");

  // ═══════════ ATTENDANCE ═══════════
  await prisma.attendance.deleteMany({});
  console.log("  ✅ Attendance cleaned");

  // ═══════════ TEACHER ═══════════
  await prisma.teacherSettings.deleteMany({});
  await prisma.communication.deleteMany({});
  await prisma.teacherDocument.deleteMany({});
  await prisma.teacherPerformance.deleteMany({});
  await prisma.teacherSalary.deleteMany({});
  await prisma.teacherLeave.deleteMany({});
  await prisma.timetable.deleteMany({});
  await prisma.teacherSubject.deleteMany({});
  await prisma.teacherClass.deleteMany({});
  await prisma.teacher.deleteMany({});
  console.log("  ✅ Teacher cleaned");

  // ═══════════ STUDENT ═══════════
  await prisma.promotion.deleteMany({});
  await prisma.studentHistory.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.student.deleteMany({});
  console.log("  ✅ Student cleaned");

  // ═══════════ ACADEMIC STRUCTURE ═══════════
  await prisma.classAgeConfig.deleteMany({});
  await prisma.admissionCounter.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.academicYear.deleteMany({});
  console.log("  ✅ Academic structure cleaned");

  // ═══════════ SUBSCRIPTION (keep plans, clear tenant subs) ═══════════
  await prisma.subscriptionPayment.deleteMany({});
  await prisma.tenantSubscription.deleteMany({});
  await prisma.freeTrialRecord.deleteMany({});
  console.log("  ✅ Subscriptions cleaned");

  // ═══════════ AUDIT & MISC ═══════════
  await prisma.auditLog.deleteMany({});
  console.log("  ✅ Audit logs cleaned");

  // ═══════════ USERS (keep SUPER_ADMIN only) ═══════════
  await prisma.user.deleteMany({
    where: { role: { not: "SUPER_ADMIN" } },
  });
  console.log("  ✅ Non-SuperAdmin users cleaned");

  console.log("\n✅ DATABASE CLEAN COMPLETE!\n");
}

async function seedDatabase() {
  console.log("🌱 SEEDING FRESH DATA (250 Students + Full ERP Data)...\n");

  // ══════════════════════════════════════════
  // FIND EXISTING TENANT
  // ══════════════════════════════════════════
  const tenant = await prisma.tenant.findFirst({
    where: { isDeleted: false },
    orderBy: { createdAt: "asc" },
  });

  if (!tenant) {
    console.log("❌ No tenant found! Please create a tenant first.");
    return;
  }
  console.log(`📌 Using Tenant: ${tenant.name} (${tenant.id})\n`);

  // ══════════════════════════════════════════
  // ACADEMIC YEAR
  // ══════════════════════════════════════════
  const ay = await prisma.academicYear.create({
    data: {
      name: "2025-26",
      tenantId: tenant.id,
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isActive: true,
      isCurrent: true,
    },
  });
  console.log("✅ Academic Year 2025-26 created");

  // ══════════════════════════════════════════
  // ADMIN USER (Tenant Admin)
  // ══════════════════════════════════════════
  const adminPass = await bcrypt.hash("Admin@123", 10);
  
  await prisma.user.create({
    data: {
      name: "School Admin",
      email: "admin@school.com",
      password: adminPass,
      role: "ADMIN",
      tenantId: tenant.id,
      isFirstLogin: false,
    },
  });
  console.log("✅ Admin user created (admin@school.com / Admin@123)");

  // ══════════════════════════════════════════
  // CLASSES (Nursery to Class 12)
  // ══════════════════════════════════════════
  const classNames = [
    "Nursery", "LKG", "UKG",
    "I", "II", "III", "IV", "V",
    "VI", "VII", "VIII", "IX", "X",
    "XI", "XII",
  ];

  const classes: any[] = [];
  for (const name of classNames) {
    const cls = await prisma.class.create({
      data: { name, tenantId: tenant.id, academicYearId: ay.id },
    });
    classes.push(cls);
  }
  console.log(`✅ ${classes.length} Classes created (Nursery → XII)`);

  // ══════════════════════════════════════════
  // SECTIONS (A, B per class)
  // ══════════════════════════════════════════
  const sectionNames = ["A", "B"];
  const sectionsMap: Record<string, any[]> = {};

  for (const cls of classes) {
    sectionsMap[cls.id] = [];
    for (const secName of sectionNames) {
      const sec = await prisma.section.create({
        data: {
          name: secName,
          classId: cls.id,
          tenantId: tenant.id,
          academicYearId: ay.id,
        },
      });
      sectionsMap[cls.id].push(sec);
    }
  }
  console.log(`✅ ${classes.length * 2} Sections created`);

  // ══════════════════════════════════════════
  // SUBJECTS (per class)
  // ══════════════════════════════════════════
  const subjectsByLevel: Record<string, string[]> = {
    primary: ["Hindi", "English", "Mathematics", "EVS", "Drawing", "GK"],
    middle: ["Hindi", "English", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer"],
    high: ["Hindi", "English", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer", "Physical Education"],
  };

  const allSubjects: any[] = [];
  for (let i = 0; i < classes.length; i++) {
    let subjects: string[];
    if (i <= 4) subjects = subjectsByLevel.primary;        // Nursery-Class II
    else if (i <= 9) subjects = subjectsByLevel.middle;    // Class III-VII
    else subjects = subjectsByLevel.high;                  // Class VIII-XII

    for (const subName of subjects) {
      const sub = await prisma.subject.create({
        data: {
          name: subName,
          classId: classes[i].id,
          tenantId: tenant.id,
          academicYearId: ay.id,
        },
      });
      allSubjects.push(sub);
    }
  }
  console.log(`✅ ${allSubjects.length} Subjects created`);

  // ══════════════════════════════════════════
  // TEACHERS (15 teachers)
  // ══════════════════════════════════════════
  const teacherData = [
    { firstName: "Rajesh", lastName: "Kumar", email: "rajesh.k@school.com", phone: "9111111111", gender: "MALE" },
    { firstName: "Priya", lastName: "Sharma", email: "priya.s@school.com", phone: "9222222222", gender: "FEMALE" },
    { firstName: "Amit", lastName: "Verma", email: "amit.v@school.com", phone: "9333333333", gender: "MALE" },
    { firstName: "Sunita", lastName: "Devi", email: "sunita.d@school.com", phone: "9444444444", gender: "FEMALE" },
    { firstName: "Mohit", lastName: "Singh", email: "mohit.s@school.com", phone: "9555555555", gender: "MALE" },
    { firstName: "Neha", lastName: "Gupta", email: "neha.g@school.com", phone: "9666666666", gender: "FEMALE" },
    { firstName: "Suresh", lastName: "Yadav", email: "suresh.y@school.com", phone: "9777777777", gender: "MALE" },
    { firstName: "Kavita", lastName: "Mishra", email: "kavita.m@school.com", phone: "9888888888", gender: "FEMALE" },
    { firstName: "Ravi", lastName: "Tiwari", email: "ravi.t@school.com", phone: "9999911111", gender: "MALE" },
    { firstName: "Pooja", lastName: "Pandey", email: "pooja.p@school.com", phone: "9999922222", gender: "FEMALE" },
    { firstName: "Deepak", lastName: "Chauhan", email: "deepak.c@school.com", phone: "9999933333", gender: "MALE" },
    { firstName: "Anita", lastName: "Jaiswal", email: "anita.j@school.com", phone: "9999944444", gender: "FEMALE" },
    { firstName: "Vinod", lastName: "Patel", email: "vinod.p@school.com", phone: "9999955555", gender: "MALE" },
    { firstName: "Meera", lastName: "Saxena", email: "meera.s@school.com", phone: "9999966666", gender: "FEMALE" },
    { firstName: "Arun", lastName: "Dubey", email: "arun.d@school.com", phone: "9999977777", gender: "MALE" },
  ];

  const teachers: any[] = [];
  for (let i = 0; i < teacherData.length; i++) {
    const t = teacherData[i];
    const teacher = await prisma.teacher.create({
      data: {
        firstName: t.firstName,
        lastName: t.lastName,
        name: `${t.firstName} ${t.lastName}`,
        email: t.email,
        phone: t.phone,
        gender: t.gender,
        employeeId: `TCH${String(i + 1).padStart(3, "0")}`,
        tenantId: tenant.id,
        academicYearId: ay.id,
      },
    });
    teachers.push(teacher);
  }
  console.log(`✅ ${teachers.length} Teachers created`);

  // ══════════════════════════════════════════
  // ROOMS (for exam)
  // ══════════════════════════════════════════
  const rooms: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const room = await prisma.room.create({
      data: {
        name: `Room ${i}`,
        capacity: 30,
        location: `Block A, Floor ${Math.ceil(i / 3)}`,
        tenantId: tenant.id,
      },
    });
    rooms.push(room);
  }
  console.log(`✅ ${rooms.length} Rooms created`);

  // ══════════════════════════════════════════
  // FEE HEADS
  // ══════════════════════════════════════════
  const feeHeadNames = [
    { name: "Tuition Fee", code: "TF", type: "RECURRING" as const },
    { name: "Admission Fee", code: "AF", type: "ONE_TIME" as const },
    { name: "Lab Fee", code: "LF", type: "RECURRING" as const },
    { name: "Library Fee", code: "LIB", type: "RECURRING" as const },
    { name: "Transport Fee", code: "TR", type: "RECURRING" as const },
    { name: "Sports Fee", code: "SF", type: "RECURRING" as const },
  ];

  const feeHeads: any[] = [];
  for (const fh of feeHeadNames) {
    const head = await prisma.feeHead.create({
      data: { name: fh.name, code: fh.code, type: fh.type, tenantId: tenant.id },
    });
    feeHeads.push(head);
  }
  console.log(`✅ ${feeHeads.length} Fee Heads created`);

  // ══════════════════════════════════════════
  // FEE STRUCTURES (per class)
  // ══════════════════════════════════════════
  const baseFeeByClass: number[] = [
    3000, 3500, 4000, // Nursery, LKG, UKG
    5000, 5500, 6000, 6500, 7000, // I-V
    8000, 8500, 9000, 9500, 10000, // VI-X
    11000, 12000, // XI-XII
  ];

  const feeStructures: any[] = [];
  for (let i = 0; i < classes.length; i++) {
    const totalAmount = baseFeeByClass[i] || 10000;
    const fs = await prisma.feeStructure.create({
      data: {
        name: `${classNames[i]} Fee 2025-26`,
        totalAmount,
        installmentType: "MONTHLY",
        totalInstallments: 12,
        dueDay: 10,
        tenantId: tenant.id,
        academicYearId: ay.id,
        classId: classes[i].id,
      },
    });
    feeStructures.push(fs);

    // Fee Structure Items
    await prisma.feeStructureItem.create({
      data: {
        feeStructureId: fs.id,
        feeHeadId: feeHeads[0].id, // Tuition
        amount: Math.round(totalAmount * 0.6),
      },
    });
    await prisma.feeStructureItem.create({
      data: {
        feeStructureId: fs.id,
        feeHeadId: feeHeads[2].id, // Lab
        amount: Math.round(totalAmount * 0.15),
      },
    });
    await prisma.feeStructureItem.create({
      data: {
        feeStructureId: fs.id,
        feeHeadId: feeHeads[3].id, // Library
        amount: Math.round(totalAmount * 0.1),
      },
    });
    await prisma.feeStructureItem.create({
      data: {
        feeStructureId: fs.id,
        feeHeadId: feeHeads[5].id, // Sports
        amount: Math.round(totalAmount * 0.15),
      },
    });
  }
  console.log(`✅ ${feeStructures.length} Fee Structures created`);

  // ══════════════════════════════════════════
  // GRADE SETTINGS
  // ══════════════════════════════════════════
  const grades = [
    { grade: "A+", minPercent: 90, maxPercent: 100, gradePoint: 10, remarks: "Outstanding" },
    { grade: "A", minPercent: 80, maxPercent: 89.99, gradePoint: 9, remarks: "Excellent" },
    { grade: "B+", minPercent: 70, maxPercent: 79.99, gradePoint: 8, remarks: "Very Good" },
    { grade: "B", minPercent: 60, maxPercent: 69.99, gradePoint: 7, remarks: "Good" },
    { grade: "C", minPercent: 50, maxPercent: 59.99, gradePoint: 6, remarks: "Average" },
    { grade: "D", minPercent: 33, maxPercent: 49.99, gradePoint: 5, remarks: "Below Average" },
    { grade: "F", minPercent: 0, maxPercent: 32.99, gradePoint: 0, remarks: "Fail" },
  ];

  for (const g of grades) {
    await prisma.gradeSetting.create({
      data: { ...g, tenantId: tenant.id },
    });
  }
  console.log("✅ Grade Settings created");

  // ══════════════════════════════════════════
  // 250 STUDENTS + ENROLLMENT + FEES + ATTENDANCE
  // ══════════════════════════════════════════
  const firstNames = ["Aarav", "Vivaan", "Ishika", "Ananya", "Rohan", "Kavya", "Arjun", "Diya", "Vihaan", "Aisha", "Reyansh", "Saanvi", "Krishna", "Myra", "Atharv", "Anvi", "Aditya", "Pari", "Sai", "Riya"];
  const lastNames = ["Sharma", "Verma", "Singh", "Gupta", "Patel", "Yadav", "Mishra", "Kumar", "Tiwari", "Pandey", "Chauhan", "Jaiswal", "Saxena", "Dubey", "Srivastava"];
  const genders = ["MALE", "FEMALE"];
  const bloodGroups = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
  const categories = ["General", "OBC", "SC", "ST"];
  const religions = ["Hindu", "Muslim", "Sikh", "Christian", "Jain"];

  // Distribute 250 students across 15 classes
  // ~17 per class (some get 16, some 17)
  const studentsPerClass = Array(15).fill(16);
  // Add remaining students
  let remaining = 250 - 15 * 16; // 250 - 240 = 10
  for (let i = 0; i < remaining; i++) {
    studentsPerClass[i]++;
  }

  let totalStudents = 0;
  let serialCounter = 0;
  const allStudentIds: string[] = [];
  const allEnrollmentIds: string[] = [];

  for (let ci = 0; ci < classes.length; ci++) {
    const cls = classes[ci];
    const sections = sectionsMap[cls.id];
    const numStudents = studentsPerClass[ci];

    for (let j = 0; j < numStudents; j++) {
      serialCounter++;
      const sectionIndex = j % 2; // alternate between A and B
      const section = sections[sectionIndex];

      const fname = firstNames[(ci * 20 + j) % firstNames.length];
      const lname = lastNames[(ci * 15 + j) % lastNames.length];
      const gender = genders[j % 2];
      const birthYear = 2019 - ci;
      const birthMonth = (j % 12) + 1;
      const birthDay = (j % 28) + 1;

      const admNo = `ADM/2025/${String(serialCounter).padStart(4, "0")}`;

      const student = await prisma.student.create({
        data: {
          firstName: fname,
          lastName: lname,
          gender,
          dob: new Date(`${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`),
          email: `student${serialCounter}@school.com`,
          phone: `98${String(serialCounter).padStart(8, "0")}`,
          address: `Ward ${(j % 20) + 1}, Bareilly, UP 243001`,
          admissionNo: admNo,
          srNo: `SR/${String(serialCounter).padStart(5, "0")}`,
          rollNumber: String(j + 1),
          fatherName: `${fname} Father`,
          fatherPhone: `97${String(serialCounter).padStart(8, "0")}`,
          motherName: `${fname} Mother`,
          motherPhone: `96${String(serialCounter).padStart(8, "0")}`,
          bloodGroup: bloodGroups[j % bloodGroups.length],
          religion: religions[j % religions.length],
          category: categories[j % categories.length],
          tenantId: tenant.id,
          academicYearId: ay.id,
          status: "active",
        },
      });
      allStudentIds.push(student.id);

      // Enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: cls.id,
          sectionId: section.id,
          academicYearId: ay.id,
          tenantId: tenant.id,
          rollNumber: String(j + 1),
        },
      });
      allEnrollmentIds.push(enrollment.id);

      // Student Fees (3 months: April, May, June)
      for (let month = 1; month <= 3; month++) {
        const totalAmount = Math.round((baseFeeByClass[ci] || 10000) / 12);
        let paidAmount = 0;
        let status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" = "PENDING";

        if (month === 1) {
          // April - most paid
          if (j % 4 === 0) { paidAmount = totalAmount; status = "PAID"; }
          else if (j % 4 === 1) { paidAmount = Math.round(totalAmount * 0.5); status = "PARTIAL"; }
          else if (j % 4 === 2) { paidAmount = Math.round(totalAmount * 0.75); status = "PARTIAL"; }
          else { paidAmount = 0; status = "OVERDUE"; }
        } else if (month === 2) {
          // May - mixed
          if (j % 3 === 0) { paidAmount = totalAmount; status = "PAID"; }
          else if (j % 3 === 1) { paidAmount = Math.round(totalAmount * 0.5); status = "PARTIAL"; }
          else { paidAmount = 0; status = "PENDING"; }
        } else {
          // June - mostly pending
          if (j % 5 === 0) { paidAmount = totalAmount; status = "PAID"; }
          else { paidAmount = 0; status = "PENDING"; }
        }

        const netAmount = totalAmount;
        const balanceAmount = netAmount - paidAmount;

        await prisma.studentFee.create({
          data: {
            tenantId: tenant.id,
            enrollmentId: enrollment.id,
            feeStructureId: feeStructures[ci].id,
            totalAmount,
            netAmount,
            paidAmount,
            balanceAmount,
            installmentNo: month,
            dueDate: new Date(`2025-${String(month + 3).padStart(2, "0")}-10`),
            status,
          },
        });
      }

      totalStudents++;
    }

    console.log(`  📝 ${classNames[ci]}: ${numStudents} students seeded`);
  }
  console.log(`\n✅ ${totalStudents} Students + Enrollments + Fees created`);

  // ══════════════════════════════════════════
  // ATTENDANCE (last 30 days for all students)
  // ══════════════════════════════════════════
  console.log("\n⏳ Seeding Attendance (30 days)...");
  const today = new Date();
  let attendanceCount = 0;

  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    
    // Skip Sundays
    if (date.getDay() === 0) continue;

    // Pick random subset of students (batch by class)
    for (let ci = 0; ci < classes.length; ci++) {
      const cls = classes[ci];
      const sections = sectionsMap[cls.id];
      
      // Get students of this class from allStudentIds
      const startIdx = studentsPerClass.slice(0, ci).reduce((a, b) => a + b, 0);
      const endIdx = startIdx + studentsPerClass[ci];

      for (let si = startIdx; si < endIdx; si++) {
        // 85% present rate
        const status = Math.random() < 0.85 ? "PRESENT" : "ABSENT";
        
        await prisma.attendance.create({
          data: {
            studentId: allStudentIds[si],
            classId: cls.id,
            sectionId: sections[si % 2].id,
            tenantId: tenant.id,
            academicYearId: ay.id,
            date,
            status: status as any,
          },
        });
        attendanceCount++;
      }
    }
  }
  console.log(`✅ ${attendanceCount} Attendance records created`);

  // ══════════════════════════════════════════
  // EXAMS (2 exams: Unit Test 1 + Half Yearly)
  // ══════════════════════════════════════════
  console.log("\n⏳ Seeding Exams...");
  
  const examNames = [
    { name: "Unit Test 1", type: "UNIT_TEST", start: "2025-06-15", end: "2025-06-20" },
    { name: "Half Yearly", type: "HALF_YEARLY", start: "2025-09-10", end: "2025-09-20" },
  ];

  let examCount = 0;
  let marksCount = 0;

  for (let ci = 3; ci < classes.length; ci++) { // Exams from Class I onwards
    const cls = classes[ci];

    for (const examData of examNames) {
      const exam = await prisma.exam.create({
        data: {
          name: examData.name,
          type: examData.type,
          classId: cls.id,
          academicYearId: ay.id,
          tenantId: tenant.id,
          startDate: new Date(examData.start),
          endDate: new Date(examData.end),
          isPublished: examData.name === "Unit Test 1", // First exam published
        },
      });
      examCount++;

      // Get subjects for this class
      const classSubjects = allSubjects.filter(s => s.classId === cls.id);
      
      // Exam Subjects
      for (const sub of classSubjects) {
        await prisma.examSubject.create({
          data: {
            examId: exam.id,
            subjectId: sub.id,
            tenantId: tenant.id,
            maxMarks: 100,
            passingMarks: 33,
          },
        });

        // Exam Schedule
        await prisma.examSchedule.create({
          data: {
            examId: exam.id,
            subjectId: sub.id,
            tenantId: tenant.id,
            examDate: new Date(examData.start),
            startTime: "09:00",
            endTime: "12:00",
            roomId: rooms[ci % rooms.length].id,
          },
        });
      }

      // Marks Entry (only for Unit Test 1 - published)
      if (examData.name === "Unit Test 1") {
        const startIdx = studentsPerClass.slice(0, ci).reduce((a, b) => a + b, 0);
        const endIdx = startIdx + studentsPerClass[ci];

        for (let si = startIdx; si < endIdx; si++) {
          for (const sub of classSubjects) {
            const marks = Math.floor(Math.random() * 60) + 35; // 35-95 range
            await prisma.marksEntry.create({
              data: {
                examId: exam.id,
                studentId: allStudentIds[si],
                subjectId: sub.id,
                tenantId: tenant.id,
                marksObtained: Math.min(marks, 100),
                isAbsent: Math.random() < 0.03, // 3% absent
              },
            });
            marksCount++;
          }
        }
      }
    }
  }
  console.log(`✅ ${examCount} Exams created`);
  console.log(`✅ ${marksCount} Marks Entries created`);

  // ══════════════════════════════════════════
  // ADMISSION COUNTER
  // ══════════════════════════════════════════
  await prisma.admissionCounter.create({
    data: {
      tenantId: tenant.id,
      academicYearId: ay.id,
      prefix: "ADM",
      lastNumber: serialCounter,
      format: "PREFIX/YEAR/SERIAL",
    },
  });
  console.log("✅ Admission Counter set");

  // ══════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════
  console.log("\n═══════════════════════════════════════");
  console.log("🌱 SEEDING COMPLETE!");
  console.log("═══════════════════════════════════════");
  console.log(`📌 Tenant: ${tenant.name}`);
  console.log(`📚 Academic Year: 2025-26`);
  console.log(`🏫 Classes: ${classes.length} (Nursery → XII)`);
  console.log(`📋 Sections: ${classes.length * 2}`);
  console.log(`📖 Subjects: ${allSubjects.length}`);
  console.log(`👨‍🏫 Teachers: ${teachers.length}`);
  console.log(`🚪 Rooms: ${rooms.length}`);
  console.log(`👨‍🎓 Students: ${totalStudents}`);
  console.log(`📝 Enrollments: ${totalStudents}`);
  console.log(`💰 Fee Structures: ${feeStructures.length}`);
  console.log(`💳 Student Fees: ${totalStudents * 3} (3 months)`);
  console.log(`📅 Attendance: ${attendanceCount} records`);
  console.log(`📝 Exams: ${examCount}`);
  console.log(`📊 Marks: ${marksCount}`);
  console.log(`🎓 Grade Settings: ${grades.length}`);
  console.log("═══════════════════════════════════════\n");
}

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  🔄 COLLEGE ERP - FRESH SEED SCRIPT     ║");
  console.log("║  ⚠️  Cleans ALL data except SuperAdmin  ║");
  console.log("║      & Tenant, then seeds 250 students  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  await cleanDatabase();
  await seedDatabase();
}

main()
  .catch((e) => {
    console.error("❌ SEED ERROR:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE ERP SEED — Academic Year 2025-26
// ═══════════════════════════════════════════════════════════════════════════
// RUN: npx ts-node prisma/seed.ts
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ═══════════════ HELPERS ═══════════════════════════════════
const MALE_NAMES = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Krishna","Ishaan","Shaurya","Atharva","Advik","Pranav","Advait","Dhruv","Kabir","Ritvik","Aarush","Kian","Darsh","Viraj","Abhinav","Rajveer","Arnav","Lakshya","Dev","Aryan","Rohan","Ansh","Siddharth","Rudra","Ved","Parth","Shreyas","Yash","Tanmay","Mohit","Kunal","Ishan","Kartik","Harsh","Nikhil","Aman","Gaurav","Rahul","Varun","Tejas","Nishant","Akash","Manav","Samar","Rishabh","Ojas","Avi","Krish","Hardik","Prateek","Tushar","Vikram"];
const FEMALE_NAMES = ["Aanya","Diya","Saanvi","Ananya","Pari","Aadya","Myra","Sara","Ira","Ahana","Navya","Avni","Kiara","Prisha","Shanaya","Ishita","Tara","Anika","Kavya","Siya","Riya","Meera","Zara","Nisha","Pooja","Priya","Shreya","Anushka","Mahika","Pihu","Lavanya","Tanvi","Aarohi","Trisha","Vanya","Nandini","Pallavi","Kritika","Bhavya","Aisha","Ritika","Swara","Mahi","Aditi","Gauri","Radhika","Sneha","Divya","Khushi","Neha","Simran","Jiya","Sakshi","Drishti","Ruhi","Charvi","Aadhya","Anvi","Mira","Aarna"];
const LAST_NAMES = ["Sharma","Verma","Singh","Gupta","Kumar","Patel","Joshi","Mishra","Pandey","Dubey","Yadav","Chauhan","Rajput","Tiwari","Srivastava","Agarwal","Saxena","Malhotra","Kapoor","Khanna","Bansal","Garg","Mehta","Shah","Desai","Bose","Roy","Das","Bhatt","Thakur","Arora","Sethi","Dhawan","Bhatia","Oberoi","Ahuja","Kohli","Sood","Dutta","Iyer"];
const AREAS = ["Civil Lines","Gomti Nagar","Hazratganj","Alambagh","Aliganj","Mahanagar","Rajajipuram","Vikas Nagar","Chinhat","Ashiana","Jankipuram","Faizabad Road","Cantt Area","Subhash Nagar","Prem Nagar"];
const OCCUPATIONS = ["Business","Service","Doctor","Teacher","Engineer","Farmer","Lawyer","Army","Police","Shopkeeper"];

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPhone(): string { return "9" + String(randomInt(100000000, 999999999)); }
function randomDate(start: Date, end: Date): Date { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }
function padNum(n: number, len: number): string { return String(n).padStart(len, "0"); }

// ═══════════════ MAIN ═══════════════════════════════════
async function main() {
  console.log("\n🚀 COMPLETE ERP SEED — Academic Year 2025-26\n");
  console.log("━".repeat(60));

  // ═══ STEP 1: Find Tenant & Admin (DO NOT DELETE THESE) ═══
  const tenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });
  if (!tenant) { console.error("❌ No tenant found! Run seed-superadmin.ts first."); process.exit(1); }
  const tenantId = tenant.id;
  console.log(`✅ Tenant: ${tenant.name} (${tenantId})`);

  const superAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!superAdmin) { console.error("❌ No SuperAdmin!"); process.exit(1); }
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN", tenantId } });
  console.log(`✅ SuperAdmin: ${superAdmin.email}`);
  if (adminUser) console.log(`✅ Admin: ${adminUser.email}`);

  // ═══ STEP 2: CLEAN OLD DATA (preserve superadmin + admin) ═══
  console.log("\n🗑️  Cleaning old data...");
  const deleteModels = [
    "marksEntry","examSubject","exam",
    "payment","studentFeeDiscount","studentFeeItem","studentFee",
    "feeStructureItem","feeStructure","feeDiscount","fineRule","feeHead",
    "admitCard","resultSummary","attendance",
    "bookIssue","libraryMember","book","bookCategory",
    "transportAttendance","transportAssignment","routeStop","route","vehicle",
    "hostelAllocation","hostelRoom","messMenu","hostel",
    "notice","staffAttendance",
    "teacherSalary","teacherPerformance","teacherDocument",
    "timetable","teacherSubject","teacherClass",
    "enrollment","studentDocument","studentHistory","promotion",
    "student","teacher","subject","section",
    "admissionCounter","classAgeConfig","gradeSetting","signature",
    "designerSettings","backupSettings","teacherSettings",
  ];
  for (const m of deleteModels) {
    try { await (prisma as any)[m].deleteMany({ where: { tenantId } }); } catch(e) {}
  }
  try { await prisma.class.deleteMany({ where: { tenantId } }); } catch(e) {}
  try { await prisma.academicYear.deleteMany({ where: { tenantId } }); } catch(e) {}

  // Delete masters (but NOT tenant/user)
  const masterModels = [
    "school","branch","campus","shift","workingDay","holiday",
    "period","department","designation","leaveType",
    "feeType","paymentMode","examType","role",
  ];
  for (const m of masterModels) {
    try { await (prisma as any)[m].deleteMany({ where: { tenantId } }); } catch(e) {}
  }
  console.log("  ✅ All old data cleaned\n");

  // ══════════════════════════════════════════════════════════════════
  // PART A: MASTERS
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART A: MASTERS ═══");

  await prisma.school.create({ data: { tenantId, name: "RMS Academy", code: "RMS001" } });
  await prisma.branch.create({ data: { tenantId, name: "Main Branch", code: "BR001" } });
  await prisma.campus.create({ data: { tenantId, name: "Main Campus", code: "MC001" } });

  await prisma.shift.create({ data: { tenantId, name: "Morning Shift", startTime: "07:30", endTime: "13:30" } });

  await prisma.workingDay.createMany({ data: [
    { tenantId, dayOfWeek: 1, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 2, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 3, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 4, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 5, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 6, isWorking: true, halfDay: true, startTime: "07:30", endTime: "11:30" },
    { tenantId, dayOfWeek: 0, isWorking: false, halfDay: false },
  ]});

  await prisma.holiday.createMany({ data: [
    { tenantId, name: "Independence Day", date: new Date("2025-08-15"), type: "NATIONAL" },
    { tenantId, name: "Gandhi Jayanti", date: new Date("2025-10-02"), type: "NATIONAL" },
    { tenantId, name: "Diwali", date: new Date("2025-10-20"), type: "FESTIVAL" },
    { tenantId, name: "Christmas", date: new Date("2025-12-25"), type: "FESTIVAL" },
    { tenantId, name: "Republic Day", date: new Date("2026-01-26"), type: "NATIONAL" },
    { tenantId, name: "Holi", date: new Date("2026-03-14"), type: "FESTIVAL" },
  ]});

  await prisma.period.createMany({ data: [
    { tenantId, name: "Period 1", number: 1, startTime: "07:30", endTime: "08:10", duration: 40, type: "REGULAR" },
    { tenantId, name: "Period 2", number: 2, startTime: "08:10", endTime: "08:50", duration: 40, type: "REGULAR" },
    { tenantId, name: "Period 3", number: 3, startTime: "08:50", endTime: "09:30", duration: 40, type: "REGULAR" },
    { tenantId, name: "Break", number: 4, startTime: "09:30", endTime: "09:50", duration: 20, type: "BREAK" },
    { tenantId, name: "Period 4", number: 5, startTime: "09:50", endTime: "10:30", duration: 40, type: "REGULAR" },
    { tenantId, name: "Period 5", number: 6, startTime: "10:30", endTime: "11:10", duration: 40, type: "REGULAR" },
    { tenantId, name: "Period 6", number: 7, startTime: "11:10", endTime: "11:50", duration: 40, type: "REGULAR" },
    { tenantId, name: "Lunch", number: 8, startTime: "11:50", endTime: "12:20", duration: 30, type: "BREAK" },
    { tenantId, name: "Period 7", number: 9, startTime: "12:20", endTime: "13:00", duration: 40, type: "REGULAR" },
    { tenantId, name: "Period 8", number: 10, startTime: "13:00", endTime: "13:30", duration: 30, type: "REGULAR" },
  ]});

  await prisma.department.createMany({ data: [
    { tenantId, name: "Academic", code: "ACA" },
    { tenantId, name: "Administration", code: "ADM" },
    { tenantId, name: "Accounts", code: "ACC" },
    { tenantId, name: "Sports", code: "SPR" },
  ]});
  await prisma.designation.createMany({ data: [
    { tenantId, name: "Principal", code: "PRIN" },
    { tenantId, name: "PGT", code: "PGT" },
    { tenantId, name: "TGT", code: "TGT" },
    { tenantId, name: "PRT", code: "PRT" },
    { tenantId, name: "Librarian", code: "LIB" },
  ]});
  await prisma.leaveType.createMany({ data: [
    { tenantId, name: "Casual Leave", code: "CL", maxDays: 12 },
    { tenantId, name: "Sick Leave", code: "SL", maxDays: 10 },
    { tenantId, name: "Earned Leave", code: "EL", maxDays: 15 },
  ]});
  await prisma.feeType.createMany({ data: [
    { tenantId, name: "Monthly Fee", code: "MONTHLY" },
    { tenantId, name: "Annual Fee", code: "ANNUAL" },
    { tenantId, name: "One Time Fee", code: "ONETIME" },
  ]});
  await prisma.paymentMode.createMany({ data: [
    { tenantId, name: "Cash", code: "CASH" },
    { tenantId, name: "UPI", code: "UPI" },
    { tenantId, name: "Bank Transfer", code: "BANK" },
    { tenantId, name: "Online", code: "ONLINE" },
  ]});
  await prisma.examType.createMany({ data: [
    { tenantId, name: "Unit Test", weightage: 20 },
    { tenantId, name: "Half Yearly", weightage: 30 },
    { tenantId, name: "Annual Exam", weightage: 50 },
  ]});
  await prisma.gradeSetting.createMany({ data: [
    { tenantId, grade: "A+", minPercent: 90, maxPercent: 100, gradePoint: 10, remarks: "Outstanding" },
    { tenantId, grade: "A", minPercent: 80, maxPercent: 89.99, gradePoint: 9, remarks: "Excellent" },
    { tenantId, grade: "B+", minPercent: 70, maxPercent: 79.99, gradePoint: 8, remarks: "Very Good" },
    { tenantId, grade: "B", minPercent: 60, maxPercent: 69.99, gradePoint: 7, remarks: "Good" },
    { tenantId, grade: "C", minPercent: 50, maxPercent: 59.99, gradePoint: 6, remarks: "Average" },
    { tenantId, grade: "D", minPercent: 33, maxPercent: 49.99, gradePoint: 5, remarks: "Below Average" },
    { tenantId, grade: "F", minPercent: 0, maxPercent: 32.99, gradePoint: 0, remarks: "Fail" },
  ]});
  await prisma.role.createMany({ data: [
    { tenantId, name: "Teacher", code: "TEACHER", level: 3 },
    { tenantId, name: "Accountant", code: "ACCOUNTANT", level: 4 },
    { tenantId, name: "Librarian", code: "LIBRARIAN", level: 4 },
  ]});

  console.log("  ✅ All Masters seeded\n");

  // ══════════════════════════════════════════════════════════════════
  // PART B: ACADEMIC STRUCTURE
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART B: ACADEMIC YEAR 2025-26 ═══");

  const academicYear = await prisma.academicYear.create({
    data: { tenantId, name: "2025-26", startDate: new Date("2025-04-01"), endDate: new Date("2026-03-31"), isCurrent: true, isActive: true },
  });
  const ayId = academicYear.id;
  console.log(`  ✅ Academic Year: 2025-26`);

  // 15 Classes: Nursery to Class 12
  const CLASS_NAMES = ["Nursery","LKG","UKG","Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];
  const classRecords: any[] = [];
  for (const cn of CLASS_NAMES) {
    const c = await prisma.class.create({ data: { tenantId, academicYearId: ayId, name: cn } });
    classRecords.push(c);
  }
  console.log(`  ✅ ${classRecords.length} Classes`);

  // Sections A & B
  const sectionRecords: any[] = [];
  for (const cls of classRecords) {
    for (const sec of ["A", "B"]) {
      const s = await prisma.section.create({ data: { tenantId, classId: cls.id, academicYearId: ayId, name: sec } });
      sectionRecords.push({ ...s, classId: cls.id });
    }
  }
  console.log(`  ✅ ${sectionRecords.length} Sections`);

  // 8 Subjects per class
  const PRE_PRIMARY = ["English","Hindi","Mathematics","EVS","Drawing","Rhymes","Games","Story Time"];
  const PRIMARY = ["English","Hindi","Mathematics","EVS","Computer","Drawing","Moral Science","GK"];
  const MIDDLE = ["English","Hindi","Mathematics","Science","Social Studies","Computer","Sanskrit","Physical Education"];
  const SENIOR = ["English","Hindi","Mathematics","Physics","Chemistry","Biology","Computer Science","Physical Education"];

  const subjectRecords: any[] = [];
  for (const cls of classRecords) {
    const idx = CLASS_NAMES.indexOf(cls.name);
    let subjects: string[];
    if (idx <= 2) subjects = PRE_PRIMARY;
    else if (idx <= 7) subjects = PRIMARY;
    else if (idx <= 12) subjects = MIDDLE;
    else subjects = SENIOR;
    for (const subName of subjects) {
      const sub = await prisma.subject.create({ data: { tenantId, classId: cls.id, academicYearId: ayId, name: subName } });
      subjectRecords.push({ ...sub, classId: cls.id });
    }
  }
  console.log(`  ✅ ${subjectRecords.length} Subjects (8 per class)\n`);

  // ══════════════════════════════════════════════════════════════════
  // PART C: TEACHERS (50)
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART C: TEACHERS ═══");
  const teacherRecords: any[] = [];
  for (let i = 1; i <= 50; i++) {
    const gender = i <= 30 ? "MALE" : "FEMALE";
    const firstName = gender === "MALE" ? randomItem(MALE_NAMES) : randomItem(FEMALE_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const t = await prisma.teacher.create({
      data: {
        tenantId, academicYearId: ayId,
        firstName, lastName, name: `${firstName} ${lastName}`,
        email: `teacher${padNum(i, 3)}@rmsacademy.edu`,
        phone: randomPhone(), gender, employeeId: `TCH${padNum(i, 3)}`,
        dob: randomDate(new Date("1970-01-01"), new Date("1995-12-31")),
      },
    });
    teacherRecords.push(t);
  }
  // Assign to classes & subjects
  for (let i = 0; i < teacherRecords.length; i++) {
    const cls = classRecords[i % classRecords.length];
    await prisma.teacherClass.create({ data: { teacherId: teacherRecords[i].id, classId: cls.id } });
    const classSubs = subjectRecords.filter(s => s.classId === cls.id);
    if (classSubs.length > 0) {
      await prisma.teacherSubject.create({ data: { teacherId: teacherRecords[i].id, subjectId: classSubs[i % classSubs.length].id } });
    }
  }
  console.log(`  ✅ 50 Teachers + Assignments\n`);

  // ══════════════════════════════════════════════════════════════════
  // PART D: 300 STUDENTS + ENROLLMENTS
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART D: 300 STUDENTS ═══");
  const studentRecords: any[] = [];
  const enrollmentRecords: any[] = [];
  let studentIdx = 0;

  for (const cls of classRecords) {
    const classSections = sectionRecords.filter(s => s.classId === cls.id);
    for (let i = 0; i < 20; i++) { // 20 per class = 300 total
      studentIdx++;
      const gender = i % 2 === 0 ? "MALE" : "FEMALE";
      const firstName = gender === "MALE" ? randomItem(MALE_NAMES) : randomItem(FEMALE_NAMES);
      const lastName = randomItem(LAST_NAMES);
      const section = classSections[i % classSections.length];
      const classIdx = CLASS_NAMES.indexOf(cls.name);
      const birthYear = 2022 - classIdx - randomInt(3, 5);

      const student = await prisma.student.create({
        data: {
          tenantId, academicYearId: ayId,
          firstName, lastName, fullName: `${firstName} ${lastName}`,
          gender, dob: randomDate(new Date(`${birthYear}-01-01`), new Date(`${birthYear}-12-31`)),
          address: `${randomInt(1, 500)}, ${randomItem(AREAS)}, Bareilly`,
          admissionNo: `RMS/2025/${padNum(studentIdx, 4)}`,
          srNo: `SR${padNum(studentIdx, 5)}`,
          fatherName: `Mr. ${randomItem(MALE_NAMES)} ${lastName}`,
          motherName: `Mrs. ${randomItem(FEMALE_NAMES)} ${lastName}`,
          fatherPhone: randomPhone(),
          fatherOccupation: randomItem(OCCUPATIONS),
          medicalConditions: [],
          allergies: [],
          medications: [],
        },
      });
      studentRecords.push(student);

      const enrollment = await prisma.enrollment.create({
        data: { tenantId, studentId: student.id, classId: cls.id, sectionId: section.id, academicYearId: ayId, rollNumber: padNum(i + 1, 2), status: "active" },
      });
      enrollmentRecords.push({ ...enrollment, studentId: student.id, classId: cls.id, sectionId: section.id });
    }
  }
  console.log(`  ✅ ${studentRecords.length} Students + Enrollments`);

  await prisma.admissionCounter.create({ data: { tenantId, academicYearId: ayId, lastNumber: studentIdx, prefix: "RMS" } });
  console.log("  ✅ Admission Counter set\n");

  // ══════════════════════════════════════════════════════════════════
  // PART E: FEES
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART E: FEES ═══");
  await Promise.all([
    prisma.feeHead.create({ data: { tenantId, name: "Tuition Fee" } }),
    prisma.feeHead.create({ data: { tenantId, name: "Transport Fee" } }),
    prisma.feeHead.create({ data: { tenantId, name: "Lab Fee" } }),
    prisma.feeHead.create({ data: { tenantId, name: "Library Fee" } }),
    prisma.feeHead.create({ data: { tenantId, name: "Sports Fee" } }),
  ]);

  const feeStructures: any[] = [];
  for (const cls of classRecords) {
    const idx = CLASS_NAMES.indexOf(cls.name);
    const baseAmount = 1500 + (idx * 400);
    const fs = await prisma.feeStructure.create({
      data: { tenantId, academicYearId: ayId, classId: cls.id, name: `Fee ${cls.name} 2025-26`, totalAmount: baseAmount },
    });
    feeStructures.push({ ...fs, classId: cls.id });
  }

  let paymentCount = 0;
  let receiptNo = 1000;
  for (const enr of enrollmentRecords) {
    const fs = feeStructures.find(f => f.classId === enr.classId);
    if (!fs) continue;
    const monthlyAmount = Math.round(fs.totalAmount / 12);
    for (let m = 1; m <= 3; m++) {
      const dueDate = new Date(2025, 2 + m, 10); // Apr, May, Jun 2025
      const isPaid = Math.random() < 0.65;
      const sf = await prisma.studentFee.create({
        data: {
          tenantId, enrollmentId: enr.id, feeStructureId: fs.id,
          totalAmount: monthlyAmount, netAmount: monthlyAmount,
          paidAmount: isPaid ? monthlyAmount : 0,
          balanceAmount: isPaid ? 0 : monthlyAmount,
          installmentNo: m, dueDate, status: isPaid ? "PAID" : "PENDING",
        },
      });
      if (isPaid) {
        receiptNo++;
        await prisma.payment.create({
          data: { tenantId, studentFeeId: sf.id, amount: monthlyAmount, method: "CASH", receiptNo: `RMS/FEE/${receiptNo}`, paymentDate: dueDate },
        });
        paymentCount++;
      }
    }
  }
  console.log(`  ✅ Fees + ${paymentCount} Payments\n`);

  // ══════════════════════════════════════════════════════════════════
  // PART F: ATTENDANCE (May 2025)
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART F: ATTENDANCE ═══");
  const attendanceData: any[] = [];
  for (const enr of enrollmentRecords) {
    for (let d = 1; d <= 30; d++) {
      const date = new Date(2025, 4, d);
      if (date.getDay() === 0) continue;
      const rand = Math.random();
      const status = rand < 0.88 ? "PRESENT" : rand < 0.96 ? "ABSENT" : "LATE";
      attendanceData.push({ tenantId, studentId: enr.studentId, classId: enr.classId, sectionId: enr.sectionId, academicYearId: ayId, date, status });
    }
  }
  for (let i = 0; i < attendanceData.length; i += 500) {
    await prisma.attendance.createMany({ data: attendanceData.slice(i, i + 500) });
  }
  console.log(`  ✅ ${attendanceData.length} Attendance records\n`);

  // ══════════════════════════════════════════════════════════════════
  // PART G: EXAMS + MARKS
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART G: EXAMS ═══");
  for (const examName of ["Unit Test 1", "Half Yearly"]) {
    for (const cls of classRecords) {
      const exam = await prisma.exam.create({
        data: { tenantId, name: examName, type: examName === "Half Yearly" ? "HALF_YEARLY" : "UNIT_TEST", classId: cls.id, academicYearId: ayId, isPublished: true },
      });
      const classSubs = subjectRecords.filter(s => s.classId === cls.id);
      for (const sub of classSubs) {
        await prisma.examSubject.create({ data: { tenantId, examId: exam.id, subjectId: sub.id, maxMarks: 100, passingMarks: 33 } });
      }
      const classEnrs = enrollmentRecords.filter(e => e.classId === cls.id);
      const marksData: any[] = [];
      for (const enr of classEnrs) {
        for (const sub of classSubs) {
          marksData.push({ tenantId, examId: exam.id, studentId: enr.studentId, subjectId: sub.id, marksObtained: randomInt(28, 98) });
        }
      }
      if (marksData.length > 0) await prisma.marksEntry.createMany({ data: marksData });
    }
  }
  console.log("  ✅ 2 Exams with marks\n");

  // ══════════════════════════════════════════════════════════════════
  // PART H: LIBRARY
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART H: LIBRARY ═══");
  const bookCats: any[] = [];
  for (const cat of ["Fiction","Non-Fiction","Academic","Reference","Science","Hindi","Mathematics","Computer"]) {
    const bc = await prisma.bookCategory.create({ data: { tenantId, name: cat } });
    bookCats.push(bc);
  }
  const AUTHORS = ["R.D. Sharma","H.C. Verma","Premchand","Ruskin Bond","R.S. Aggarwal","Lakhmir Singh","Sumita Arora"];
  const PUBLISHERS = ["NCERT","S.Chand","Arihant","Oxford","Pearson","Navneet"];
  for (let i = 1; i <= 300; i++) {
    await prisma.book.create({
      data: { tenantId, title: `Book ${i}`, author: randomItem(AUTHORS), categoryId: randomItem(bookCats).id },
    });
  }
  console.log("  ✅ 300 Books\n");

  // ══════════════════════════════════════════════════════════════════
  // PART I: TRANSPORT
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART I: TRANSPORT ═══");
  const vehicles: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const v = await prisma.vehicle.create({
      data: { tenantId, vehicleNo: `UP25 AB ${padNum(i * 100 + randomInt(1, 99), 4)}`, type: i <= 7 ? "BUS" : "VAN", capacity: i <= 7 ? 45 : 15, driverName: `${randomItem(MALE_NAMES)} ${randomItem(LAST_NAMES)}`, driverPhone: randomPhone(), driverLicense: `UP25${randomInt(20200000, 20260000)}`, fuelType: i <= 7 ? "DIESEL" : "CNG", insuranceExpiry: new Date("2026-12-31"), fitnessExpiry: new Date("2026-06-30"), permitExpiry: new Date("2027-03-31") },
    });
    vehicles.push(v);
  }
  const ROUTE_NAMES = ["Civil Lines","Cantt Area","Prem Nagar","Subhash Nagar","Faizabad Road","Aliganj"];
  const routes: any[] = [];
  for (let i = 0; i < ROUTE_NAMES.length; i++) {
    const r = await prisma.route.create({
      data: { tenantId, name: `${ROUTE_NAMES[i]} Route`, code: `R${padNum(i + 1, 2)}`, startLocation: "RMS Academy", endLocation: ROUTE_NAMES[i], distance: randomInt(5, 15), estimatedTime: randomInt(25, 45), monthlyFee: randomInt(1500, 2500) },
    });
    routes.push(r);
    for (let s = 1; s <= 4; s++) {
      await prisma.routeStop.create({ data: { tenantId, routeId: r.id, name: `Stop ${s}`, pickupTime: `07:${padNum(s * 6, 2)}`, dropTime: `13:${padNum(30 + s * 5, 2)}`, sequence: s } });
    }
  }
  for (let i = 0; i < 60; i++) {
    await prisma.transportAssignment.create({
      data: { tenantId, studentId: studentRecords[i].id, studentName: studentRecords[i].fullName || `${studentRecords[i].firstName} ${studentRecords[i].lastName}`, classInfo: CLASS_NAMES[Math.floor(i / 20)], routeId: routes[i % routes.length].id, vehicleId: vehicles[i % vehicles.length].id, monthlyFee: 2000, startDate: new Date("2025-04-01") },
    });
  }
  console.log("  ✅ 10 Vehicles + 6 Routes + 60 Assignments\n");

  // ══════════════════════════════════════════════════════════════════
  // PART J: HOSTEL
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART J: HOSTEL ═══");
  const hostels: any[] = [];
  for (let i = 1; i <= 3; i++) {
    const h = await prisma.hostel.create({
      data: { tenantId, name: `${i <= 2 ? "Boys" : "Girls"} Hostel ${i}`, type: i <= 2 ? "BOYS" : "GIRLS", totalRooms: 10 },
    });
    hostels.push(h);
  }
  const hostelRooms: any[] = [];
  for (const hostel of hostels) {
    for (let r = 1; r <= 5; r++) {
      const hr = await prisma.hostelRoom.create({
        data: { tenantId, hostelId: hostel.id, roomNumber: `${hostel.name.charAt(0)}${padNum(r, 2)}`, capacity: 4, floor: Math.ceil(r / 3), type: "TRIPLE" },
      });
      hostelRooms.push(hr);
    }
  }
  for (let i = 0; i < 30; i++) {
    const hostel = hostels[Math.floor(i / 10)];
    await prisma.hostelAllocation.create({
      data: { tenantId, studentId: studentRecords[200 + i].id, hostelId: hostel.id, roomId: hostelRooms[i % hostelRooms.length].id, academicYearId: ayId, checkInDate: new Date("2025-04-01") },
    });
  }
  console.log("  ✅ 3 Hostels + 15 Rooms + 30 Allocations\n");

  // ══════════════════════════════════════════════════════════════════
  // PART K: NOTICES
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART K: NOTICES ═══");
  const noticeData = [
    { title: "Fee Submission Last Date - June 10" },
    { title: "Half Yearly Exam Schedule" },
    { title: "Parent-Teacher Meeting July 15" },
    { title: "Independence Day Celebration" },
    { title: "Summer Vacation Notice" },
  ];
  for (const n of noticeData) {
    await prisma.notice.create({
      data: { tenantId, title: n.title, content: `Details regarding ${n.title.toLowerCase()}.`, publishedBy: adminUser?.id || superAdmin.id, publishDate: randomDate(new Date("2025-04-01"), new Date("2025-07-01")) },
    });
  }
  console.log("  ✅ 5 Notices\n");

  // ══════════════════════════════════════════════════════════════════
  // PART L: SETTINGS
  // ══════════════════════════════════════════════════════════════════
  console.log("═══ PART L: SETTINGS ═══");
  await prisma.signature.createMany({ data: [
    { tenantId, title: "Principal", personName: "Dr. R.K. Sharma", designation: "Principal", imageUrl: "/signatures/principal.png" },
    { tenantId, title: "Director", personName: "Mr. Anil Verma", designation: "Director", imageUrl: "/signatures/director.png" },
  ]});
  await prisma.designerSettings.createMany({ data: [
    { tenantId, type: "certificate", settings: { paperSize: "A4", orientation: "landscape" } },
    { tenantId, type: "report-card", settings: { paperSize: "A4", orientation: "portrait", showPhoto: true } },
    { tenantId, type: "id-card", settings: { cardSize: "CR80", orientation: "portrait" } },
  ]});
  await prisma.backupSettings.create({
    data: { tenantId, dailyEnabled: true, weeklyEnabled: true, monthlyEnabled: true },
  });
  await prisma.teacherSettings.create({
    data: { tenantId, academicYearId: ayId },
  });
  console.log("  ✅ Settings done\n");

  // ══════════════════════════════════════════════════════════════════
  console.log("━".repeat(60));
  console.log("🎉 SEED COMPLETE!");
  console.log("━".repeat(60));
  console.log("\n📊 Summary:");
  console.log("  • Academic Year: 2025-26");
  console.log("  • Classes: 15 (Nursery → 12) | Sections: 30 | Subjects: 120");
  console.log("  • Teachers: 50 | Students: 300 | Enrollments: 300");
  console.log("  • Fees: 5 heads + structures + 3 months payments");
  console.log(`  • Attendance: ${attendanceData.length} records`);
  console.log("  • Exams: 2 with full marks");
  console.log("  • Library: 300 books | Transport: 10+6+60 | Hostel: 3+15+30");
  console.log("\n✅ Ready! SuperAdmin & Admin are SAFE.\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

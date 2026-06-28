// @ts-nocheck
// prisma/seed-enterprise.ts
// ==============================================
// ENTERPRISE SEED FILE - Full ERP Data
// 300 Students, 50 Teachers, 600 Books, 20 Vehicles
// Fees, Attendance, Exams, Hostel, Transport, etc.
// ==============================================
// RUN: npx ts-node prisma/seed-enterprise.ts
// ==============================================

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PASSWORD_HASH = "$2a$10$X7UrE7G5Xr8pF5Yt1Rz5R.VY5VvY5PbR5nR5vR5XY5Pb5nR5vR5X";

const MALE_FIRST_NAMES = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Krishna","Ishaan","Shaurya","Atharva","Advik","Pranav","Advait","Dhruv","Kabir","Ritvik","Aarush","Kian","Darsh","Viraj","Abhinav","Rajveer","Arnav","Lakshya","Dev","Aryan","Rohan","Ansh","Siddharth","Rudra","Ved","Parth","Shreyas","Yash","Tanmay","Mohit","Kunal","Ishan","Kartik","Harsh","Nikhil","Aman","Gaurav","Rahul","Varun","Tejas","Nishant","Akash","Manav","Samar","Rishabh","Ojas","Avi","Krish","Hardik","Prateek","Tushar","Vikram"];
const FEMALE_FIRST_NAMES = ["Aanya","Diya","Saanvi","Ananya","Pari","Aadya","Myra","Sara","Ira","Ahana","Navya","Avni","Kiara","Prisha","Shanaya","Ishita","Tara","Anika","Kavya","Siya","Riya","Meera","Zara","Nisha","Pooja","Priya","Shreya","Anushka","Mahika","Pihu","Lavanya","Tanvi","Aarohi","Trisha","Vanya","Nandini","Pallavi","Kritika","Bhavya","Aisha","Ritika","Swara","Mahi","Aditi","Gauri","Radhika","Sneha","Divya","Khushi","Neha","Simran","Jiya","Sakshi","Drishti","Ruhi","Charvi","Aadhya","Anvi","Mira","Aarna"];
const LAST_NAMES = ["Sharma","Verma","Singh","Gupta","Kumar","Patel","Joshi","Mishra","Pandey","Dubey","Yadav","Chauhan","Rajput","Tiwari","Srivastava","Agarwal","Saxena","Malhotra","Kapoor","Khanna","Bansal","Garg","Mehta","Shah","Desai","Nair","Menon","Pillai","Reddy","Rao","Bose","Sen","Roy","Das","Ghosh","Chatterjee","Mukherjee","Bhatt","Thakur","Chandra","Arora","Sethi","Dhawan","Bhatia","Oberoi","Ahuja","Kohli","Sood","Dutta","Iyer"];
const CITIES = ["Lucknow","Kanpur","Varanasi","Agra","Prayagraj","Bareilly","Meerut","Ghaziabad","Noida","Gorakhpur"];
const AREAS = ["Civil Lines","Gomti Nagar","Hazratganj","Alambagh","Indira Nagar","Aliganj","Mahanagar","Rajajipuram","Vikas Nagar","Chinhat","Ashiana","Jankipuram","Faizabad Road","Sitapur Road","Amausi"];

const BOOK_CATEGORIES = ["Fiction","Non-Fiction","Academic","Reference","Science","Hindi Literature","English Literature","Mathematics","History","General Knowledge"];
const PUBLISHERS = ["NCERT","S.Chand","Arihant","Dhanpat Rai","Oxford University Press","Pearson","McGraw Hill","Navneet","Frank Bros","Goyal Brothers","Ratna Sagar","Pitambar Publishing","Laxmi Publications","CBS Publishers","Orient BlackSwan"];
const AUTHORS_FICTION = ["Premchand","R.K. Narayan","Ruskin Bond","Sudha Murty","Rabindranath Tagore","Munshi Premchand","Harivansh Rai Bachchan","Amrita Pritam","Chetan Bhagat","Devdutt Pattanaik"];
const AUTHORS_ACADEMIC = ["R.D. Sharma","H.C. Verma","S.L. Loney","R.S. Aggarwal","T.R. Jain","V.K. Ohri","Lakhmir Singh","P.S. Verma","D.K. Goel","Sumita Arora"];

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPhone(): string { return "9" + String(randomInt(100000000, 999999999)); }
function randomDate(start: Date, end: Date): Date { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }
function padNum(n: number, len: number): string { return String(n).padStart(len, "0"); }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN SEED FUNCTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log("\n🚀 ENTERPRISE SEED STARTING...\n");
  console.log("━".repeat(60));

  // ═══════════════════════════════════════════════════
  // STEP 1: FIND EXISTING TENANT & SUPER ADMIN
  // ═══════════════════════════════════════════════════
  const tenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });
  if (!tenant) { console.error("❌ No tenant found!"); process.exit(1); }
  const tenantId = tenant.id;
  console.log(`✅ Tenant: ${tenant.name} (${tenantId})`);

  const superAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!superAdmin) { console.error("❌ No SuperAdmin found!"); process.exit(1); }
  console.log(`✅ SuperAdmin: ${superAdmin.name} (${superAdmin.email})`);

  // Also preserve admin user
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN", tenantId } });

  // ═══════════════════════════════════════════════════
  // STEP 2: DELETE ALL DATA (preserve tenant + super admin + admin)
  // ═══════════════════════════════════════════════════
  console.log("\n🗑️  NUCLEAR CLEANUP via raw MongoDB...");

  // Use $runCommandRaw to drop collections directly - BYPASSES Prisma relations
  const collectionsToDelete = [
    "MarksEntry", "ResultSummary", "ExamSubject", "ExamSchedule",
    "SeatingArrangement", "AdmitCard", "QuestionPaper", "InvigilatorAssignment",
    "Exam", "GradeSetting", "Attendance", "Payment", "StudentFeeDiscount",
    "StudentFee", "FeeStructureItem", "FeeStructure", "FeeHead", "FeeDiscount",
    "FineRule", "BookIssue", "LibraryMember", "Book", "BookCategory",
    "LibrarySetting", "TransportAssignment", "TransportAttendance",
    "RouteStop", "Route", "Vehicle", "VehicleLocation", "TripLog",
    "GeofenceAlert", "StudentPickupDrop", "TransportSetting",
    "HostelAllocation", "HostelRoom", "MessMenu", "Hostel",
    "Notice", "SMSLog", "WhatsAppLog", "PushNotification",
    "TeacherLeave", "TeacherSalary", "TeacherPerformance",
    "TeacherDocument", "TeacherSettings", "Communication",
    "StaffAttendance", "Leave", "Payroll",
    "Asset", "AssetIssue", "Certificate", "AuditLog",
    "Timetable", "TeacherSubject", "TeacherClass",
    "Enrollment", "StudentDocument", "StudentHistory", "Promotion",
    "Student", "Teacher", "Subject", "Section", "Class",
    "Room", "AdmissionCounter", "ClassAgeConfig",
    "EmergencyContact", "RolePermission", "Signature",
    "Backup", "BackupSettings", "DesignerSettings",
    "AcademicYear",
  ];

  for (const col of collectionsToDelete) {
    try {
      await prisma.$runCommandRaw({ drop: col });
    } catch (e: any) {
      // Collection doesn't exist - fine
    }
  }

  // Delete non-superadmin users
  const preserveUserIds = [superAdmin.id];
  if (adminUser) preserveUserIds.push(adminUser.id);
  try {
    await prisma.user.deleteMany({ where: { tenantId, id: { notIn: preserveUserIds } } });
  } catch(e) {}

  console.log("  ✅ ALL data nuked (tenant + superadmin + subscription safe)");

  // ═══════════════════════════════════════════════════
  // STEP 3: ACADEMIC YEAR
  // ═══════════════════════════════════════════════════
  console.log("\n📅 Creating Academic Year...");
  const academicYear = await prisma.academicYear.create({
    data: {
      name: "2025-26",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isActive: true,
      isCurrent: true,
      tenantId,
    },
  });
  const ayId = academicYear.id;
  console.log(`✅ Academic Year: ${academicYear.name}`);

  // ═══════════════════════════════════════════════════
  // STEP 4: CLASSES (15)
  // ═══════════════════════════════════════════════════
  console.log("\n🏫 Creating Classes...");
  const classNames = ["Nursery","LKG","UKG","1","2","3","4","5","6","7","8","9","10","11","12"];
  const classRecords: any[] = [];
  for (const name of classNames) {
    const cls = await prisma.class.create({
      data: { name, tenantId, academicYearId: ayId },
    });
    classRecords.push(cls);
  }
  console.log(`✅ ${classRecords.length} Classes created`);

  // ═══════════════════════════════════════════════════
  // STEP 5: SECTIONS (30 - A,B per class)
  // ═══════════════════════════════════════════════════
  console.log("\n📋 Creating Sections...");
  const sectionRecords: any[] = [];
  for (const cls of classRecords) {
    for (const secName of ["A", "B"]) {
      const sec = await prisma.section.create({
        data: { name: secName, classId: cls.id, tenantId, academicYearId: ayId },
      });
      sectionRecords.push({ ...sec, classId: cls.id, className: cls.name });
    }
  }
  console.log(`✅ ${sectionRecords.length} Sections created`);

  // ═══════════════════════════════════════════════════
  // STEP 6: SUBJECTS (per class)
  // ═══════════════════════════════════════════════════
  console.log("\n📚 Creating Subjects...");
  const subjectsMap: Record<string, string[]> = {
    "Nursery": ["English","Hindi","Maths","EVS","Drawing"],
    "LKG": ["English","Hindi","Maths","EVS","Drawing"],
    "UKG": ["English","Hindi","Maths","EVS","Drawing","GK"],
    "1": ["English","Hindi","Maths","EVS","Drawing","GK"],
    "2": ["English","Hindi","Maths","EVS","Drawing","GK","Moral Science"],
    "3": ["English","Hindi","Maths","EVS","Drawing","GK","Computer"],
    "4": ["English","Hindi","Maths","Science","Social Studies","Drawing","Computer"],
    "5": ["English","Hindi","Maths","Science","Social Studies","Drawing","Computer","GK"],
    "6": ["English","Hindi","Maths","Science","Social Studies","Sanskrit","Computer"],
    "7": ["English","Hindi","Maths","Science","Social Studies","Sanskrit","Computer"],
    "8": ["English","Hindi","Maths","Science","Social Studies","Sanskrit","Computer","Physical Education"],
    "9": ["English","Hindi","Maths","Science","Social Studies","Sanskrit","Computer","Physical Education"],
    "10": ["English","Hindi","Maths","Science","Social Studies","Sanskrit","Computer","Physical Education"],
    "11": ["English","Physics","Chemistry","Maths","Biology","Computer Science","Physical Education"],
    "12": ["English","Physics","Chemistry","Maths","Biology","Computer Science","Physical Education"],
  };

  const subjectRecords: any[] = [];
  for (const cls of classRecords) {
    const subs = subjectsMap[cls.name] || [];
    for (const subName of subs) {
      const sub = await prisma.subject.create({
        data: { name: subName, classId: cls.id, tenantId, academicYearId: ayId },
      });
      subjectRecords.push({ ...sub, className: cls.name });
    }
  }
  console.log(`✅ ${subjectRecords.length} Subjects created`);

  // ═══════════════════════════════════════════════════
  // STEP 7: ROOMS (45)
  // ═══════════════════════════════════════════════════
  console.log("\n🚪 Creating Rooms...");
  const roomRecords: any[] = [];
  for (let i = 1; i <= 45; i++) {
    const room = await prisma.room.create({
      data: {
        name: `Room ${100 + i}`,
        capacity: randomInt(30, 50),
        // floor removed
        tenantId,
      },
    });
    roomRecords.push(room);
  }
  console.log(`✅ ${roomRecords.length} Rooms created`);

  // ═══════════════════════════════════════════════════
  // STEP 8: TEACHERS (50)
  // ═══════════════════════════════════════════════════
  console.log("\n👨‍🏫 Creating Teachers...");
  const qualifications = ["B.Ed","M.Ed","M.A. B.Ed","M.Sc. B.Ed","PhD","B.Sc. B.Ed","M.A.","M.Sc.","MCA","B.Tech B.Ed"];
  const departments = ["Science","Mathematics","English","Hindi","Social Studies","Computer","Physical Education","Sanskrit","Art","Music"];

  const teacherRecords: any[] = [];
  for (let i = 0; i < 50; i++) {
    const gender = i < 25 ? "Male" : "Female";
    const firstName = gender === "Male" ? MALE_FIRST_NAMES[i % MALE_FIRST_NAMES.length] : FEMALE_FIRST_NAMES[i % FEMALE_FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];

    const teacher = await prisma.teacher.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@rmsacademy.edu`,
        phone: randomPhone(),
        gender,
        employeeId: `EMP${padNum(i + 1, 3)}`,
        tenantId,
        academicYearId: ayId,
      },
    });
    teacherRecords.push(teacher);
  }
  console.log(`✅ ${teacherRecords.length} Teachers created`);

  // ═══════════════════════════════════════════════════
  // STEP 9: STUDENTS (300)
  // ═══════════════════════════════════════════════════
  console.log("\n🎓 Creating 300 Students...");
  const studentRecords: any[] = [];
  const studentsPerSection = Math.ceil(300 / sectionRecords.length); // ~10 per section

  let studentCounter = 0;
  for (const section of sectionRecords) {
    const count = Math.min(studentsPerSection, 300 - studentCounter);
    for (let i = 0; i < count && studentCounter < 300; i++) {
      studentCounter++;
      const gender = studentCounter % 3 === 0 ? "Female" : "Male"; // ~33% female
      const firstName = gender === "Male"
        ? MALE_FIRST_NAMES[studentCounter % MALE_FIRST_NAMES.length]
        : FEMALE_FIRST_NAMES[studentCounter % FEMALE_FIRST_NAMES.length];
      const lastName = LAST_NAMES[studentCounter % LAST_NAMES.length];
      const fatherFirstName = MALE_FIRST_NAMES[(studentCounter + 20) % MALE_FIRST_NAMES.length];
      const motherFirstName = FEMALE_FIRST_NAMES[(studentCounter + 10) % FEMALE_FIRST_NAMES.length];

      const student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          admissionNo: `RMS/2025/${padNum(studentCounter, 3)}`,
          rollNumber: String(i + 1),
          gender,
          dob: randomDate(new Date("2008-01-01"), new Date("2019-12-31")),
          tenantId,
          academicYearId: ayId,
          status: "active",
          admissionDate: randomDate(new Date("2023-04-01"), new Date("2025-04-30")),
          fatherName: `${fatherFirstName} ${lastName}`,
          motherName: `${motherFirstName} ${lastName}`,
          fatherPhone: randomPhone(),
          motherPhone: randomPhone(),
          fatherOccupation: randomItem(["Business","Govt. Service","Private Job","Farming","Doctor","Engineer","Teacher","Advocate"]),
          address: `${randomInt(1, 500)}, ${randomItem(["Sitapur Road", "Civil Lines", "Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Mahanagar", "Alambagh"])}, ${randomItem(["Lucknow", "Kanpur", "Varanasi", "Agra", "Allahabad", "Meerut", "Bareilly", "Gorakhpur"])}, UP`,
          bloodGroup: randomItem(["A+","A-","B+","B-","O+","O-","AB+","AB-"]),
          religion: randomItem(["Hindu","Muslim","Christian","Sikh","Buddhist"]),
          category: randomItem(["General","OBC","SC","ST","EWS"]),
          nationality: "Indian",
          aadharNo: `${randomInt(1000, 9999)} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`,
        },
      });
      studentRecords.push({ ...student, classId: section.classId, sectionId: section.id, className: section.className });
    }
  }
  console.log(`✅ ${studentRecords.length} Students created`);

  // ═══════════════════════════════════════════════════
  // STEP 10: GRADE SETTINGS
  // ═══════════════════════════════════════════════════
  console.log("\n📊 Creating Grade Settings...");
  const grades = [
    { grade: "A+", minPercent: 90, maxPercent: 100, gradePoint: 10 },
    { grade: "A", minPercent: 80, maxPercent: 89, gradePoint: 9 },
    { grade: "B+", minPercent: 70, maxPercent: 79, gradePoint: 8 },
    { grade: "B", minPercent: 60, maxPercent: 69, gradePoint: 7 },
    { grade: "C+", minPercent: 50, maxPercent: 59, gradePoint: 6 },
    { grade: "C", minPercent: 40, maxPercent: 49, gradePoint: 5 },
    { grade: "D", minPercent: 33, maxPercent: 39, gradePoint: 4 },
    { grade: "F", minPercent: 0, maxPercent: 32, gradePoint: 0 },
  ];
  for (const g of grades) {
    await prisma.gradeSetting.create({ data: { ...g, tenantId } });
  }
  console.log(`✅ ${grades.length} Grade Settings created`);

  // ═══════════════════════════════════════════════════
  // STEP 11: FEE HEADS & STRUCTURE
  // ═══════════════════════════════════════════════════
  console.log("\n💰 Creating Fee Structure...");
  const feeHeadData = [
    { name: "Tuition Fee", amount: 2500 },
    { name: "Transport Fee", amount: 1500 },
    { name: "Lab Fee", amount: 500 },
    { name: "Library Fee", amount: 300 },
  ];

  const feeHeadRecords: any[] = [];
  for (const fh of feeHeadData) {
    const head = await prisma.feeHead.create({
      data: { name: fh.name, type: "RECURRING", tenantId },
    });
    feeHeadRecords.push({ ...head, amount: fh.amount });
  }

  // Create fee structure for each class
  const feeStructureRecords: any[] = [];
  for (const cls of classRecords) {
    const structure = await prisma.feeStructure.create({
      data: {
        name: `${cls.name} Fee Structure 2025-26`,
        classId: cls.id,
        academicYearId: ayId,
        tenantId,
        totalAmount: feeHeadData.reduce((sum, fh) => sum + fh.amount, 0),
        items: {
          create: feeHeadRecords.map(fh => ({
            feeHeadId: fh.id,
            amount: fh.amount,
          })),
        },
      },
    });
    feeStructureRecords.push({ ...structure, classId: cls.id });
  }

  // Create Enrollments, StudentFee & Payments
  console.log("   Creating fee records for students...");

  // First create enrollments for all students
  const enrollmentRecords: any[] = [];
  for (const student of studentRecords) {
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: student.classId,
        sectionId: student.sectionId,
        academicYearId: ayId,
        tenantId,
        status: "active",
      },
    });
    enrollmentRecords.push({ ...enrollment, classId: student.classId });
  }

  const totalFee = feeHeadData.reduce((s, f) => s + f.amount, 0) * 12; // Annual
  for (let i = 0; i < enrollmentRecords.length; i++) {
    const enrollment = enrollmentRecords[i];
    const status = i < 180 ? "PAID" : i < 240 ? "PARTIAL" : "PENDING";
    const paidAmount = status === "PAID" ? totalFee : status === "PARTIAL" ? Math.round(totalFee * 0.5) : 0;
    const feeStructure = feeStructureRecords.find(fs => fs.classId === enrollment.classId) || feeStructureRecords[0];

    const fee = await prisma.studentFee.create({
      data: {
        enrollmentId: enrollment.id,
        feeStructureId: feeStructure.id,
        totalAmount: totalFee,
        discountAmount: 0,
        fineAmount: 0,
        netAmount: totalFee,
        paidAmount,
        balanceAmount: totalFee - paidAmount,
        installmentNo: 1,
        dueDate: new Date("2025-07-15"),
        status,
        tenantId,
      },
    });

    if (paidAmount > 0) {
      await prisma.payment.create({
        data: {
          studentFeeId: fee.id,
          amount: paidAmount,
          method: randomItem(["CASH","ONLINE","UPI","CHEQUE"]) as any,
          receiptNo: `RCP/${padNum(i + 1, 4)}`,
          paymentDate: randomDate(new Date("2025-04-01"), new Date("2025-06-25")),
          tenantId,
        },
      });
    }
  }
  console.log(`✅ Fee structure + ${studentRecords.length} student fee records created`);

  // ═══════════════════════════════════════════════════
  // STEP 12: ATTENDANCE (30 days for all students)
  // ═══════════════════════════════════════════════════
  console.log("\n📋 Creating Attendance (30 days × 300 students)...");
  const today = new Date();
  const attendanceData: any[] = [];

  for (let day = 1; day <= 30; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() - day);
    if (date.getDay() === 0) continue; // Skip Sundays

    for (const student of studentRecords) {
      const rand = Math.random();
      const status = rand < 0.85 ? "PRESENT" : rand < 0.92 ? "ABSENT" : "LATE";
      attendanceData.push({
        studentId: student.id,
        classId: student.classId,
        sectionId: student.sectionId,
        date,
        status,
        tenantId,
        academicYearId: ayId,
      });
    }
  }

  // Batch insert attendance (createMany)
  const BATCH_SIZE = 500;
  for (let i = 0; i < attendanceData.length; i += BATCH_SIZE) {
    const batch = attendanceData.slice(i, i + BATCH_SIZE);
    await prisma.attendance.createMany({ data: batch });
  }
  console.log(`✅ ${attendanceData.length} Attendance records created`);

  // ═══════════════════════════════════════════════════
  // STEP 13: EXAMS (3 exams with marks)
  // ═══════════════════════════════════════════════════
  console.log("\n📝 Creating Exams & Marks...");
  const examData = [
    { name: "Unit Test 1", startDate: new Date("2025-05-15"), endDate: new Date("2025-05-20"), status: "COMPLETED" },
    { name: "Mid Term", startDate: new Date("2025-07-10"), endDate: new Date("2025-07-18"), status: "COMPLETED" },
    { name: "Unit Test 2", startDate: new Date("2025-09-15"), endDate: new Date("2025-09-20"), status: "UPCOMING" },
  ];

  for (const examInfo of examData) {
    for (const cls of classRecords) {
      const exam = await prisma.exam.create({
        data: {
          name: examInfo.name,
          startDate: examInfo.startDate,
          endDate: examInfo.endDate,
          classId: cls.id,
          tenantId,
          academicYearId: ayId,
        },
      });

      // Create ExamSubjects for this class
      if (examInfo.status === "COMPLETED") {
        const classSubjects = subjectRecords.filter(s => s.className === cls.name);
        const classStudents = studentRecords.filter(s => s.classId === cls.id);

        for (const sub of classSubjects) {
          const examSubject = await prisma.examSubject.create({
            data: {
              examId: exam.id,
              subjectId: sub.id,
              maxMarks: 100,
              passingMarks: 33,
              tenantId,
            },
          });

          // Create marks for each student in this class
          const marksData = classStudents.map(student => ({
            examId: exam.id,
            studentId: student.id,
            subjectId: sub.id,
            marksObtained: Math.min(100, Math.max(15, Math.round(65 + (Math.random() - 0.5) * 50))),
            isAbsent: Math.random() < 0.05,
            tenantId,
          }));

          if (marksData.length > 0) {
            await prisma.marksEntry.createMany({ data: marksData });
          }
        }
      }
    }
  }
  console.log(`✅ 3 Exams created with marks for completed exams`);

  // ═══════════════════════════════════════════════════
  // STEP 14: LIBRARY (600 Books)
  // ═══════════════════════════════════════════════════
  console.log("\n📖 Creating Library (600 books)...");

  // Create categories first
  const categoryRecords: any[] = [];
  for (const catName of BOOK_CATEGORIES) {
    const cat = await prisma.bookCategory.create({
      data: { name: catName, tenantId },
    });
    categoryRecords.push(cat);
  }

  // Create 600 books
  const bookTitles = ["Advanced Mathematics","Introduction to Physics","Organic Chemistry","World History","Indian Constitution","Computer Programming","English Grammar","Hindi Sahitya","Environmental Science","Biology Fundamentals","Geometry & Trigonometry","Modern India","Ancient Civilizations","Data Structures","Web Development","Algebra","Calculus","Optics","Thermodynamics","Mechanics","Electromagnetics","Genetics","Ecology","Microprocessors","Networking","Vedic Mathematics","Sanskrit Grammar","Physical Education","Art & Craft","Music Theory","Economics","Political Science","Psychology","Sociology","Statistics","Probability","Quantum Physics","Biochemistry","Zoology","Botany"];

  const booksData: any[] = [];
  for (let i = 0; i < 600; i++) {
    const category = categoryRecords[i % categoryRecords.length];
    const titleBase = bookTitles[i % bookTitles.length];
    booksData.push({
      title: i < 40 ? titleBase : `${titleBase} Vol. ${Math.ceil((i - 39) / 40)}`,
      isbn: `978-${randomInt(10, 99)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}-${randomInt(0, 9)}`,
      author: i % 2 === 0 ? randomItem(AUTHORS_ACADEMIC) : randomItem(AUTHORS_FICTION),
      publisher: randomItem(PUBLISHERS),
      categoryId: category.id,
      totalCopies: randomInt(3, 10),
      availableCopies: randomInt(1, 8),
      shelfLocation: `R${padNum(Math.ceil((i + 1) / 20), 2)}-S${((i % 5) + 1)}`,
      price: randomInt(150, 800),
      edition: `${randomInt(1, 5)}th Edition`,
      publishYear: randomInt(2015, 2024),
      tenantId,
    });
  }

  for (let i = 0; i < booksData.length; i += BATCH_SIZE) {
    await prisma.book.createMany({ data: booksData.slice(i, i + BATCH_SIZE) });
  }
  console.log(`✅ 600 Books + ${categoryRecords.length} Categories created`);

  // ═══════════════════════════════════════════════════
  // STEP 15: TRANSPORT (20 vehicles, 10 routes)
  // ═══════════════════════════════════════════════════
  console.log("\n🚌 Creating Transport...");
  const driverNames = ["Ram Prasad","Shiv Kumar","Mohan Lal","Dinesh Yadav","Rajesh Singh","Amar Nath","Vijay Pal","Suresh Chandra","Manoj Kumar","Balram","Santosh Verma","Hari Om","Guddu","Pappu Yadav","Raju Chauhan","Kamlesh","Ashok Kumar","Vipin","Deepak","Sanjay"];
  const conductorNames = ["Babu Lal","Chhotu","Munna","Ramu","Shyam","Gopal","Hari","Mohan","Kalu","Birju","Guddu","Pappu","Tinku","Rinku","Sonu","Monu","Bablu","Dablu","Chintu","Pintu"];

  const vehicleRecords: any[] = [];
  for (let i = 0; i < 20; i++) {
    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNo: `UP32 ${String.fromCharCode(65 + Math.floor(i / 10))}${String.fromCharCode(65 + (i % 10))} ${randomInt(1000, 9999)}`,
        type: i < 15 ? "BUS" : "VAN",
        capacity: i < 15 ? randomInt(40, 55) : randomInt(12, 20),
        driverName: driverNames[i],
        driverPhone: randomPhone(),
        driverLicense: `DL${randomInt(1000000000, 9999999999)}`,
        conductorName: conductorNames[i],
        conductorPhone: randomPhone(),
        insuranceExpiry: new Date("2026-03-31"),
        fitnessExpiry: new Date("2026-03-31"),
        permitExpiry: new Date("2026-06-30"),
        fuelType: i < 15 ? "DIESEL" : "CNG",
        tenantId,
      },
    });
    vehicleRecords.push(vehicle);
  }

  // Create 10 routes
  const routeNames = ["Gomti Nagar Route","Indira Nagar Route","Aliganj Route","Mahanagar Route","Rajajipuram Route","Alambagh Route","Chinhat Route","Jankipuram Route","Ashiana Route","Vikas Nagar Route"];
  for (let i = 0; i < 10; i++) {
    const route = await prisma.route.create({
      data: {
        name: routeNames[i],
        code: `RT${padNum(i + 1, 2)}`,
        startLocation: "R.M.S. Academy",
        endLocation: routeNames[i].replace(" Route", ""),
        distance: randomInt(5, 20),
        estimatedTime: randomInt(20, 45),
        monthlyFee: 1500,
        tenantId,
      },
    });

    // Add 5 stops per route
    const stopAreas = AREAS.sort(() => Math.random() - 0.5).slice(0, 5);
    for (let j = 0; j < 5; j++) {
      await prisma.routeStop.create({
        data: {
          routeId: route.id,
          name: stopAreas[j],
          sequence: j + 1,
          pickupTime: `07:${padNum(15 + j * 8, 2)}`,
          dropTime: `14:${padNum(30 - j * 5, 2)}`,
          tenantId,
        },
      });
    }
  }
  console.log(`✅ ${vehicleRecords.length} Vehicles + 10 Routes created`);

  // ═══════════════════════════════════════════════════
  // STEP 16: HOSTEL (5 hostels)
  // ═══════════════════════════════════════════════════
  console.log("\n🏨 Creating Hostels...");
  const hostelNames = [
    { name: "Vivekananda Boys Hostel", type: "BOYS" },
    { name: "Saraswati Girls Hostel", type: "GIRLS" },
    { name: "Tagore Boys Hostel", type: "BOYS" },
    { name: "Kalpana Girls Hostel", type: "GIRLS" },
    { name: "APJ Co-Ed Hostel", type: "CO_ED" },
  ];

  for (const h of hostelNames) {
    const hostel = await prisma.hostel.create({
      data: {
        name: h.name,
        type: h.type as any,
        totalRooms: 20,
        wardenName: `${randomItem(h.type === "GIRLS" ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
        wardenPhone: randomPhone(),
        tenantId,
      },
    });

    // Create 20 rooms per hostel
    for (let r = 1; r <= 20; r++) {
      await prisma.hostelRoom.create({
        data: {
          roomNumber: `${h.name.charAt(0)}${padNum(r, 3)}`,
          floor: Math.ceil(r / 5),
          capacity: randomInt(2, 4),
          currentOccupancy: randomInt(0, 3),
          type: randomItem(["SINGLE","DOUBLE","TRIPLE"]) as any,
          hostelId: hostel.id,
          tenantId,
        },
      });
    }
  }
  console.log(`✅ 5 Hostels with 100 rooms created`);

  // ═══════════════════════════════════════════════════
  // STEP 17: NOTICES (10)
  // ═══════════════════════════════════════════════════
  console.log("\n📢 Creating Notices...");
  const notices = [
    { title: "Summer Vacation Notice", content: "School will remain closed from 15th May to 30th June 2025 for summer vacation.", priority: "HIGH" },
    { title: "Annual Day Celebration", content: "Annual Day will be celebrated on 20th December 2025. Parents are cordially invited.", priority: "MEDIUM" },
    { title: "Fee Payment Reminder", content: "Parents are requested to deposit pending fees by 15th of every month.", priority: "HIGH" },
    { title: "Parent Teacher Meeting", content: "PTM will be held on 25th July 2025 from 9 AM to 1 PM.", priority: "MEDIUM" },
    { title: "Sports Day", content: "Annual Sports Day on 10th November 2025. Students must wear sports uniform.", priority: "LOW" },
    { title: "New Library Books", content: "500 new books have been added to the library. Students can issue from Monday.", priority: "LOW" },
    { title: "Exam Schedule Released", content: "Mid Term exam schedule has been uploaded. Check exam section for details.", priority: "HIGH" },
    { title: "Republic Day Celebration", content: "Republic Day will be celebrated on 26th January. Flag hoisting at 8 AM.", priority: "MEDIUM" },
    { title: "Transport Fee Revision", content: "Transport fee revised from ₹1500 to ₹1800 from next session.", priority: "MEDIUM" },
    { title: "COVID-19 Guidelines", content: "All students must follow COVID protocols. Masks mandatory in common areas.", priority: "HIGH" },
  ];

  for (const notice of notices) {
    await prisma.notice.create({
      data: {
        title: notice.title,
        content: notice.content,
        type: "GENERAL",
        audience: "ALL",
        publishedBy: superAdmin.id,
        tenantId,
      },
    });
  }
  console.log(`✅ ${notices.length} Notices created`);

  // ═══════════════════════════════════════════════════
  // STEP 18: STAFF ATTENDANCE (15 days for teachers)
  // ═══════════════════════════════════════════════════
  console.log("\n📋 Creating Staff Attendance...");
  const staffAttData: any[] = [];
  for (let day = 1; day <= 15; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() - day);
    if (date.getDay() === 0) continue;

    for (const teacher of teacherRecords) {
      const rand = Math.random();
      staffAttData.push({
        userId: teacher.id,
        date,
        status: rand < 0.90 ? "PRESENT" : rand < 0.95 ? "LEAVE" : "ABSENT",
        checkInTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0),
        checkOutTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 15, 30),
        tenantId,
      });
    }
  }

  for (let i = 0; i < staffAttData.length; i += BATCH_SIZE) {
    await prisma.staffAttendance.createMany({ data: staffAttData.slice(i, i + BATCH_SIZE) });
  }
  console.log(`✅ ${staffAttData.length} Staff Attendance records created`);

  // ═══════════════════════════════════════════════════
  // DONE!
  // ═══════════════════════════════════════════════════
  console.log("\n" + "━".repeat(60));
  console.log("🎉 ENTERPRISE SEED COMPLETE!");
  console.log("━".repeat(60));
  console.log(`
📊 Summary:
  • Academic Year: 2025-26
  • Classes: 15 (Nursery to 12th)
  • Sections: 30 (A, B per class)
  • Subjects: ${subjectRecords.length}
  • Rooms: 45
  • Teachers: 50
  • Students: 300
  • Books: 600 (10 categories)
  • Vehicles: 20
  • Routes: 10
  • Hostels: 5 (100 rooms)
  • Exams: 3 (2 completed with marks)
  • Attendance: ${attendanceData.length} records (30 days)
  • Staff Attendance: ${staffAttData.length} records
  • Fee Records: 300
  • Payments: ~240
  • Notices: 10
  • Grade Settings: 8
  `);
}

main()
  .catch((e) => {
    console.error("❌ SEED ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

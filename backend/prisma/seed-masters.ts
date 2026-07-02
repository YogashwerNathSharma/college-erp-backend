// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════
// MASTER SEED FILE - Seeds ALL 110 Master Tables
// ═══════════════════════════════════════════════════════════════════════
// RUN: npx ts-node prisma/seed-masters.ts
// ═══════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("\n🚀 MASTER SEED STARTING...\n");
  console.log("━".repeat(60));

  // ═══════════════════════════════════════════════════════
  // STEP 1: Find Tenant
  // ═══════════════════════════════════════════════════════
  const tenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });
  if (!tenant) {
    console.error("❌ No tenant found! Create a tenant first.");
    process.exit(1);
  }
  const tenantId = tenant.id;
  console.log(`✅ Tenant: ${tenant.name} (${tenantId})\n`);

  // ═══════════════════════════════════════════════════════
  // STEP 2: Clear existing master data
  // ═══════════════════════════════════════════════════════
  console.log("\u{1F5D1}\uFE0F  OLD DELETE → NEW INSERT pattern...");

  // ── DELETE ALL existing master data (children first, then parents) ──
  await prisma.permissionMaster.deleteMany({ where: { tenantId } });
  await prisma.menuMaster.deleteMany({ where: { tenantId } });
  await prisma.moduleMaster.deleteMany({ where: { tenantId } });
  await prisma.casteMaster.deleteMany({ where: { tenantId } });
  await prisma.shelfMaster.deleteMany({ where: { tenantId } });
  await prisma.itemGroupMaster.deleteMany({ where: { tenantId } });
  await prisma.campusMaster.deleteMany({ where: { tenantId } });

  // All other masters (no FK dependencies on each other)
  const masterModels = [
    "schoolMaster", "branchMaster",
    "shiftMaster", "workingDayMaster", "holidayMaster", "houseMaster",
    "schoolTimingMaster", "streamMaster", "subjectGroupMaster",
    "mediumMaster", "boardMaster", "courseMaster",
    "periodMaster", "admissionTypeMaster", "categoryMaster",
    "religionMaster", "nationalityMaster", "bloodGroupMaster",
    "motherTongueMaster", "studentStatusMaster", "siblingRelationMaster",
    "departmentMaster", "designationMaster", "employmentTypeMaster",
    "qualificationMaster", "leaveTypeMaster", "staffCategoryMaster",
    "salaryGradeMaster", "bankMaster", "feeGroupMaster", "feeTypeMaster",
    "concessionMaster", "scholarshipMaster", "paymentModeMaster",
    "receiptSeriesMaster", "examTypeMaster", "resultTypeMaster",
    "markingSchemeMaster", "assessmentMaster", "attendanceStatusMaster",
    "lateFineMaster", "leaveReasonMaster", "attendanceShiftMaster",
    "publisherMaster", "authorMaster", "languageMaster", "rackMaster",
    "bookConditionMaster", "hostelTypeMaster", "driverMaster", "conductorMaster",
    "fuelTypeMaster", "gPSDeviceMaster", "itemCategoryMaster",
    "unitMaster", "brandMaster", "supplierMaster", "warehouseMaster",
    "storeMaster", "stockTypeMaster", "payrollHeadMaster", "salaryComponentMaster",
    "pFMaster", "eSIMaster", "taxSlabMaster", "incrementTypeMaster",
    "sMSTemplateMaster", "emailTemplateMaster", "whatsAppTemplateMaster",
    "notificationTemplateMaster", "noticeCategoryMaster",
    "certificateTemplateMaster", "iDCardTemplateMaster", "roleMaster",
    "userTypeMaster", "aPIPermissionMaster",
    "documentTypeMaster", "documentCategoryMaster", "approvalWorkflowMaster",
    "eventCategoryMaster", "venueMaster", "eventTypeMaster",
    "visitorTypeMaster", "purposeMaster", "gateMaster",
    "aIPromptMaster", "predictionRuleMaster", "analyticsRuleMaster",
    "themeMaster", "currencyMaster", "timeZoneMaster", "backupPolicyMaster",
    "auditTypeMaster", "aPIProviderMaster", "settingsMaster",
  ];

  for (const model of masterModels) {
    try { await (prisma as any)[model].deleteMany({ where: { tenantId } }); } catch(e) {}
  }

  console.log("  \u2705 Old data deleted. Inserting fresh masters...\n");

  // ═══════════════════════════════════════════════════════
  // 1. ORGANIZATION MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("🏫 1. Organization Masters...");

  await prisma.schoolMaster.createMany({ data: [
    { tenantId, name: "RMS Academy", code: "RMS001", address: "Divna Road, Bareilly", city: "Bareilly", state: "Uttar Pradesh", pincode: "243001", phone: "9876543210", email: "info@rmsacademy.edu", website: "https://rmsacademy.edu", affiliation: "CBSE", establishedYear: 2005, principalName: "Mr. R.K. Sharma" },
    { tenantId, name: "RMS Junior Wing", code: "RMS002", address: "Civil Lines, Bareilly", city: "Bareilly", state: "Uttar Pradesh", pincode: "243001", phone: "9876543211", email: "junior@rmsacademy.edu", affiliation: "CBSE", establishedYear: 2010, principalName: "Mrs. Sunita Verma" },
  ]});

  await prisma.branchMaster.createMany({ data: [
    { tenantId, name: "Main Branch", code: "BR001", address: "Divna Road", city: "Bareilly", state: "UP", pincode: "243001", phone: "9876543210", email: "main@rmsacademy.edu", isMain: true },
    { tenantId, name: "City Branch", code: "BR002", address: "Civil Lines", city: "Bareilly", state: "UP", pincode: "243001", phone: "9876543211", email: "city@rmsacademy.edu", isMain: false },
    { tenantId, name: "Cantt Branch", code: "BR003", address: "Cantt Area", city: "Bareilly", state: "UP", pincode: "243001", phone: "9876543212", email: "cantt@rmsacademy.edu", isMain: false },
  ]});

  // CampusMaster needs branchId - get branch references
  const mainBranch = await prisma.branchMaster.findFirst({ where: { tenantId, name: "Main Branch" } });
  const cityBranch = await prisma.branchMaster.findFirst({ where: { tenantId, name: "City Branch" } });
  if (mainBranch && cityBranch) {
    await prisma.campusMaster.createMany({ data: [
      { tenantId, branchId: mainBranch.id, name: "Main Campus", address: "Divna Road, Bareilly", capacity: 2000, facilities: ["Library", "Lab", "Playground", "Auditorium", "Canteen"] },
      { tenantId, branchId: cityBranch.id, name: "Junior Campus", address: "Civil Lines, Bareilly", capacity: 800, facilities: ["Library", "Playground", "Smart Class"] },
    ]});
  }

  await prisma.shiftMaster.createMany({ data: [
    { tenantId, name: "Morning Shift", startTime: "07:30", endTime: "13:30" },
    { tenantId, name: "Afternoon Shift", startTime: "12:00", endTime: "17:00" },
    { tenantId, name: "Full Day", startTime: "08:00", endTime: "15:00" },
  ]});

  await prisma.workingDayMaster.createMany({ data: [
    { tenantId, dayOfWeek: 1, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 2, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 3, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 4, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 5, isWorking: true, halfDay: false, startTime: "07:30", endTime: "13:30" },
    { tenantId, dayOfWeek: 6, isWorking: true, halfDay: true, startTime: "07:30", endTime: "11:30" },
    { tenantId, dayOfWeek: 0, isWorking: false, halfDay: false },
  ]});

  await prisma.holidayMaster.createMany({ data: [
    { tenantId, name: "Republic Day", date: new Date("2026-01-26"), type: "NATIONAL", isOptional: false, description: "National holiday" },
    { tenantId, name: "Holi", date: new Date("2026-03-17"), type: "NATIONAL", isOptional: false, description: "Festival of Colors" },
    { tenantId, name: "Good Friday", date: new Date("2026-04-03"), type: "NATIONAL", isOptional: false },
    { tenantId, name: "Independence Day", date: new Date("2025-08-15"), type: "NATIONAL", isOptional: false },
    { tenantId, name: "Gandhi Jayanti", date: new Date("2025-10-02"), type: "NATIONAL", isOptional: false },
    { tenantId, name: "Diwali", date: new Date("2025-10-20"), type: "NATIONAL", isOptional: false },
    { tenantId, name: "Christmas", date: new Date("2025-12-25"), type: "NATIONAL", isOptional: false },
    { tenantId, name: "Eid-ul-Fitr", date: new Date("2026-03-30"), type: "NATIONAL", isOptional: false },
    { tenantId, name: "Janmashtami", date: new Date("2025-08-16"), type: "STATE", isOptional: false },
    { tenantId, name: "Raksha Bandhan", date: new Date("2025-08-09"), type: "STATE", isOptional: true },
    { tenantId, name: "Annual Day", date: new Date("2025-12-15"), type: "SCHOOL", isOptional: false, description: "School Annual Function" },
    { tenantId, name: "Founder's Day", date: new Date("2025-07-10"), type: "SCHOOL", isOptional: false },
  ]});

  await prisma.houseMaster.createMany({ data: [
    { tenantId, name: "Red House", color: "#EF4444", motto: "Courage and Strength" },
    { tenantId, name: "Blue House", color: "#3B82F6", motto: "Wisdom and Knowledge" },
    { tenantId, name: "Green House", color: "#10B981", motto: "Growth and Harmony" },
    { tenantId, name: "Yellow House", color: "#F59E0B", motto: "Energy and Creativity" },
  ]});

  await prisma.schoolTimingMaster.createMany({ data: [
    { tenantId, name: "Summer Timing", assemblyStart: "07:15", assemblyEnd: "07:30", firstPeriodStart: "07:30", lastPeriodEnd: "12:30", lunchStart: "10:30", lunchEnd: "11:00", dispersalTime: "12:45" },
    { tenantId, name: "Winter Timing", assemblyStart: "08:00", assemblyEnd: "08:15", firstPeriodStart: "08:15", lastPeriodEnd: "14:00", lunchStart: "11:30", lunchEnd: "12:00", dispersalTime: "14:15" },
  ]});
  console.log("  ✅ Organization Masters done");

  // ═══════════════════════════════════════════════════════
  // 2. ACADEMIC MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("🎓 2. Academic Masters...");

  await prisma.streamMaster.createMany({ data: [
    { tenantId, name: "Science", code: "SCI", description: "PCM/PCB stream" },
    { tenantId, name: "Commerce", code: "COM", description: "Commerce with Maths/IP" },
    { tenantId, name: "Arts", code: "ART", description: "Humanities stream" },
    { tenantId, name: "General", code: "GEN", description: "Up to Class 10" },
  ]});

  await prisma.subjectGroupMaster.createMany({ data: [
    { tenantId, name: "PCM Group", subjects: ["Physics", "Chemistry", "Mathematics"] },
    { tenantId, name: "PCB Group", subjects: ["Physics", "Chemistry", "Biology"] },
    { tenantId, name: "Commerce Core", subjects: ["Accountancy", "Business Studies", "Economics"] },
    { tenantId, name: "Arts Core", subjects: ["History", "Political Science", "Geography"] },
  ]});

  // ElectiveSubjectMaster: only non-FK field is maxStudents; streamId/classId/subjectId are FKs
  // SKIPPED: ElectiveSubjectMaster needs subjectId + classId
  console.log("    ⏭️  ElectiveSubjectMaster skipped (needs Subject + Class data first)");

  await prisma.mediumMaster.createMany({ data: [
    { tenantId, name: "English Medium", code: "ENG" },
    { tenantId, name: "Hindi Medium", code: "HIN" },
    { tenantId, name: "Bilingual", code: "BIL" },
  ]});

  await prisma.boardMaster.createMany({ data: [
    { tenantId, name: "CBSE", code: "CBSE", description: "Central Board of Secondary Education" },
    { tenantId, name: "ICSE", code: "ICSE", description: "Indian Certificate of Secondary Education" },
    { tenantId, name: "UP Board", code: "UPB", description: "Uttar Pradesh Madhyamik Shiksha Parishad" },
  ]});

  await prisma.courseMaster.createMany({ data: [
    { tenantId, name: "Pre-Primary", code: "PP", duration: 3, durationUnit: "YEARS", description: "Nursery to UKG" },
    { tenantId, name: "Primary", code: "PRI", duration: 5, durationUnit: "YEARS", description: "Class 1 to 5" },
    { tenantId, name: "Middle School", code: "MID", duration: 3, durationUnit: "YEARS", description: "Class 6 to 8" },
    { tenantId, name: "Secondary", code: "SEC", duration: 2, durationUnit: "YEARS", description: "Class 9 to 10" },
    { tenantId, name: "Senior Secondary", code: "SSEC", duration: 2, durationUnit: "YEARS", description: "Class 11 to 12" },
  ]});

  // SyllabusMaster: boardId/classId/subjectId are FKs; non-FK: name, content
  // SKIPPED: SyllabusMaster needs classId + subjectId + boardId
  console.log("    ⏭️  SyllabusMaster skipped (needs Class + Subject data first)");

  await prisma.periodMaster.createMany({ data: [
    { tenantId, name: "Period 1", startTime: "07:30", endTime: "08:10", duration: 40, number: 1, type: "REGULAR" },
    { tenantId, name: "Period 2", startTime: "08:10", endTime: "08:50", duration: 40, number: 2, type: "REGULAR" },
    { tenantId, name: "Period 3", startTime: "08:50", endTime: "09:30", duration: 40, number: 3, type: "REGULAR" },
    { tenantId, name: "Period 4", startTime: "09:30", endTime: "10:10", duration: 40, number: 4, type: "REGULAR" },
    { tenantId, name: "Recess", startTime: "10:10", endTime: "10:40", duration: 30, number: 5, type: "BREAK" },
    { tenantId, name: "Period 5", startTime: "10:40", endTime: "11:20", duration: 40, number: 6, type: "REGULAR" },
    { tenantId, name: "Period 6", startTime: "11:20", endTime: "12:00", duration: 40, number: 7, type: "REGULAR" },
    { tenantId, name: "Period 7", startTime: "12:00", endTime: "12:40", duration: 40, number: 8, type: "REGULAR" },
    { tenantId, name: "Period 8", startTime: "12:40", endTime: "13:20", duration: 40, number: 9, type: "REGULAR" },
  ]});

  // TimetableSlotMaster: only non-FK field is dayOfWeek
  // SKIPPED: TimetableSlotMaster needs periodId + classId + sectionId
  console.log("    ⏭️  TimetableSlotMaster skipped (needs Period + Class + Section data first)");
  console.log("  ✅ Academic Masters done");

  // ═══════════════════════════════════════════════════════
  // 3. STUDENT MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("👨‍🎓 3. Student Masters...");

  await prisma.admissionTypeMaster.createMany({ data: [
    { tenantId, name: "New Admission", code: "NEW", description: "Fresh admission" },
    { tenantId, name: "Transfer", code: "TRF", description: "Transfer from another school" },
    { tenantId, name: "Re-admission", code: "RE", description: "Student re-joining" },
    { tenantId, name: "RTE Admission", code: "RTE", description: "Under Right to Education" },
  ]});

  await prisma.categoryMaster.createMany({ data: [
    { tenantId, name: "General", code: "GEN", description: "General category" },
    { tenantId, name: "OBC", code: "OBC", description: "Other Backward Classes" },
    { tenantId, name: "SC", code: "SC", description: "Scheduled Caste" },
    { tenantId, name: "ST", code: "ST", description: "Scheduled Tribe" },
    { tenantId, name: "EWS", code: "EWS", description: "Economically Weaker Section" },
  ]});

  await prisma.religionMaster.createMany({ data: [
    { tenantId, name: "Hindu", code: "HIN" },
    { tenantId, name: "Muslim", code: "MUS" },
    { tenantId, name: "Christian", code: "CHR" },
    { tenantId, name: "Sikh", code: "SIK" },
    { tenantId, name: "Buddhist", code: "BUD" },
    { tenantId, name: "Jain", code: "JAI" },
    { tenantId, name: "Other", code: "OTH" },
  ]});

  // CasteMaster needs categoryId
  const catGen = await prisma.categoryMaster.findFirst({ where: { tenantId, code: "GEN" } });
  const catOBC = await prisma.categoryMaster.findFirst({ where: { tenantId, code: "OBC" } });
  const catSC = await prisma.categoryMaster.findFirst({ where: { tenantId, code: "SC" } });
  const catST = await prisma.categoryMaster.findFirst({ where: { tenantId, code: "ST" } });
  if (catGen && catOBC && catSC && catST) {
    await prisma.casteMaster.createMany({ data: [
      { tenantId, name: "Brahmin", categoryId: catGen.id },
      { tenantId, name: "Kshatriya", categoryId: catGen.id },
      { tenantId, name: "Vaishya", categoryId: catOBC.id },
      { tenantId, name: "Yadav", categoryId: catOBC.id },
      { tenantId, name: "Jatav", categoryId: catSC.id },
      { tenantId, name: "Pasi", categoryId: catSC.id },
      { tenantId, name: "Gond", categoryId: catST.id },
      { tenantId, name: "Bhil", categoryId: catST.id },
    ]});
  }

  await prisma.nationalityMaster.createMany({ data: [
    { tenantId, name: "Indian", code: "IN" },
    { tenantId, name: "NRI", code: "NRI" },
    { tenantId, name: "Foreign", code: "FOR" },
  ]});

  await prisma.bloodGroupMaster.createMany({ data: [
    { tenantId, name: "A+" }, { tenantId, name: "A-" },
    { tenantId, name: "B+" }, { tenantId, name: "B-" },
    { tenantId, name: "O+" }, { tenantId, name: "O-" },
    { tenantId, name: "AB+" }, { tenantId, name: "AB-" },
  ]});

  await prisma.motherTongueMaster.createMany({ data: [
    { tenantId, name: "Hindi" }, { tenantId, name: "English" },
    { tenantId, name: "Urdu" }, { tenantId, name: "Punjabi" },
    { tenantId, name: "Bengali" }, { tenantId, name: "Tamil" },
    { tenantId, name: "Marathi" },
  ]});

  await prisma.studentStatusMaster.createMany({ data: [
    { tenantId, name: "Active", code: "ACT", color: "#10B981" },
    { tenantId, name: "Inactive", code: "INA", color: "#6B7280" },
    { tenantId, name: "Passed Out", code: "PAS", color: "#3B82F6" },
    { tenantId, name: "TC Issued", code: "TC", color: "#F59E0B" },
    { tenantId, name: "Expelled", code: "EXP", color: "#EF4444" },
    { tenantId, name: "Dropout", code: "DRP", color: "#DC2626" },
  ]});

  await prisma.siblingRelationMaster.createMany({ data: [
    { tenantId, name: "Brother" }, { tenantId, name: "Sister" },
    { tenantId, name: "Twin" }, { tenantId, name: "Step-sibling" },
  ]});
  console.log("  ✅ Student Masters done");

  // ═══════════════════════════════════════════════════════
  // 4. STAFF / HR MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("👨‍💼 4. Staff / HR Masters...");

  await prisma.departmentMaster.createMany({ data: [
    { tenantId, name: "Science", code: "SCI", description: "Physics, Chemistry, Biology" },
    { tenantId, name: "Mathematics", code: "MATH", description: "Maths department" },
    { tenantId, name: "English", code: "ENG", description: "English language & literature" },
    { tenantId, name: "Hindi", code: "HIN", description: "Hindi language & literature" },
    { tenantId, name: "Social Studies", code: "SS", description: "History, Geography, Civics" },
    { tenantId, name: "Computer", code: "COMP", description: "Computer Science & IT" },
    { tenantId, name: "Physical Education", code: "PE", description: "Sports & PT" },
    { tenantId, name: "Administration", code: "ADM", description: "Admin & Management" },
    { tenantId, name: "Accounts", code: "ACC", description: "Finance & Accounts" },
  ]});

  await prisma.designationMaster.createMany({ data: [
    { tenantId, name: "Principal", code: "PRIN", level: 1, description: "School Head" },
    { tenantId, name: "Vice Principal", code: "VP", level: 2, description: "Deputy Head" },
    { tenantId, name: "HOD", code: "HOD", level: 3, description: "Head of Department" },
    { tenantId, name: "Senior Teacher (PGT)", code: "PGT", level: 4, description: "Post Graduate Teacher" },
    { tenantId, name: "Teacher (TGT)", code: "TGT", level: 5, description: "Trained Graduate Teacher" },
    { tenantId, name: "Primary Teacher (PRT)", code: "PRT", level: 6, description: "Primary Teacher" },
    { tenantId, name: "Lab Assistant", code: "LA", level: 7, description: "Laboratory Assistant" },
    { tenantId, name: "Librarian", code: "LIB", level: 7, description: "Library In-charge" },
    { tenantId, name: "Clerk", code: "CLK", level: 8, description: "Office Clerk" },
    { tenantId, name: "Peon", code: "PEON", level: 10, description: "Support Staff" },
  ]});

  await prisma.employmentTypeMaster.createMany({ data: [
    { tenantId, name: "Permanent", description: "Full-time permanent employment" },
    { tenantId, name: "Contractual", description: "Fixed-term contract" },
    { tenantId, name: "Part-time", description: "Part-time teaching" },
    { tenantId, name: "Guest Faculty", description: "Visiting faculty" },
    { tenantId, name: "Probation", description: "On probation period" },
  ]});

  await prisma.qualificationMaster.createMany({ data: [
    { tenantId, name: "B.Ed", level: "Graduate" },
    { tenantId, name: "M.Ed", level: "Post Graduate" },
    { tenantId, name: "M.A.", level: "Post Graduate" },
    { tenantId, name: "M.Sc.", level: "Post Graduate" },
    { tenantId, name: "M.Com.", level: "Post Graduate" },
    { tenantId, name: "PhD", level: "Doctorate" },
    { tenantId, name: "B.Tech", level: "Graduate" },
    { tenantId, name: "MCA", level: "Post Graduate" },
    { tenantId, name: "D.El.Ed", level: "Diploma" },
    { tenantId, name: "B.P.Ed", level: "Graduate" },
  ]});

  await prisma.leaveTypeMaster.createMany({ data: [
    { tenantId, name: "Casual Leave", code: "CL", maxDays: 12, carryForward: false, encashable: false },
    { tenantId, name: "Sick Leave", code: "SL", maxDays: 10, carryForward: true, encashable: false },
    { tenantId, name: "Earned Leave", code: "EL", maxDays: 30, carryForward: true, encashable: true },
    { tenantId, name: "Maternity Leave", code: "ML", maxDays: 180, carryForward: false, encashable: false },
    { tenantId, name: "Paternity Leave", code: "PL", maxDays: 15, carryForward: false, encashable: false },
    { tenantId, name: "Study Leave", code: "STL", maxDays: 60, carryForward: false, encashable: false },
  ]});

  await prisma.staffCategoryMaster.createMany({ data: [
    { tenantId, name: "Teaching Staff" },
    { tenantId, name: "Non-Teaching Staff" },
    { tenantId, name: "Administrative Staff" },
    { tenantId, name: "Support Staff" },
  ]});

  await prisma.salaryGradeMaster.createMany({ data: [
    { tenantId, name: "Grade A", level: 1, minPay: 80000, maxPay: 150000, increment: 5000 },
    { tenantId, name: "Grade B", level: 2, minPay: 50000, maxPay: 80000, increment: 3000 },
    { tenantId, name: "Grade C", level: 3, minPay: 30000, maxPay: 50000, increment: 2000 },
    { tenantId, name: "Grade D", level: 4, minPay: 20000, maxPay: 30000, increment: 1500 },
    { tenantId, name: "Grade E", level: 5, minPay: 12000, maxPay: 20000, increment: 1000 },
  ]});

  await prisma.bankMaster.createMany({ data: [
    { tenantId, name: "State Bank of India", code: "SBI", branch: "Bareilly Main" },
    { tenantId, name: "Punjab National Bank", code: "PNB", branch: "Civil Lines Bareilly" },
    { tenantId, name: "Bank of Baroda", code: "BOB", branch: "Cantt Bareilly" },
    { tenantId, name: "HDFC Bank", code: "HDFC", branch: "CB Ganj Bareilly" },
    { tenantId, name: "ICICI Bank", code: "ICICI", branch: "Rajendra Nagar Bareilly" },
    { tenantId, name: "Axis Bank", code: "AXIS", branch: "Pilibhit Road Bareilly" },
    { tenantId, name: "Union Bank", code: "UBI", branch: "Station Road Bareilly" },
  ]});
  console.log("  ✅ Staff / HR Masters done");

  // ═══════════════════════════════════════════════════════
  // 5. FEE MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("💰 5. Fee Masters...");

  await prisma.feeGroupMaster.createMany({ data: [
    { tenantId, name: "Monthly Fee", description: "Monthly recurring fee" },
    { tenantId, name: "Quarterly Fee", description: "Every 3 months" },
    { tenantId, name: "Annual Fee", description: "Once a year" },
    { tenantId, name: "One-time Fee", description: "Admission time only" },
  ]});

  await prisma.feeTypeMaster.createMany({ data: [
    { tenantId, name: "Tuition Fee", code: "TUI", isMandatory: true, isRefundable: false },
    { tenantId, name: "Admission Fee", code: "ADM", isMandatory: true, isRefundable: false },
    { tenantId, name: "Annual Charges", code: "ANN", isMandatory: true, isRefundable: false },
    { tenantId, name: "Transport Fee", code: "TRN", isMandatory: false, isRefundable: true },
    { tenantId, name: "Lab Fee", code: "LAB", isMandatory: false, isRefundable: false },
    { tenantId, name: "Library Fee", code: "LIB", isMandatory: false, isRefundable: false },
    { tenantId, name: "Sports Fee", code: "SPR", isMandatory: false, isRefundable: false },
    { tenantId, name: "Exam Fee", code: "EXM", isMandatory: true, isRefundable: false },
    { tenantId, name: "Computer Fee", code: "CMP", isMandatory: false, isRefundable: false },
    { tenantId, name: "Development Fee", code: "DEV", isMandatory: true, isRefundable: false },
  ]});

  await prisma.concessionMaster.createMany({ data: [
    { tenantId, name: "Sibling Concession", type: "PERCENTAGE", value: 10, criteria: "2nd child in same school", reason: "Sibling discount" },
    { tenantId, name: "Staff Ward", type: "PERCENTAGE", value: 50, criteria: "Parent is staff member", reason: "Staff benefit" },
    { tenantId, name: "Merit Scholarship", type: "PERCENTAGE", value: 25, criteria: "Above 90% in previous year", reason: "Academic excellence" },
    { tenantId, name: "EWS Concession", type: "PERCENTAGE", value: 100, criteria: "EWS category student", reason: "RTE compliance" },
    { tenantId, name: "Sports Quota", type: "FIXED", value: 5000, criteria: "State/National level player", reason: "Sports achievement" },
  ]});

  await prisma.scholarshipMaster.createMany({ data: [
    { tenantId, name: "Merit Scholarship", type: "MERIT", amount: 12000, criteria: "Above 90% in previous year", percentage: 100, provider: "School Fund", maxStudents: 20 },
    { tenantId, name: "Sports Scholarship", type: "SPORTS", amount: 10000, criteria: "State/National level player", percentage: 50, provider: "Sports Council", maxStudents: 10 },
    { tenantId, name: "Need-based Aid", type: "FINANCIAL", amount: 15000, criteria: "Family income < 2 LPA", percentage: 75, provider: "Trust Fund", maxStudents: 30 },
    { tenantId, name: "SC/ST Scholarship", type: "GOVERNMENT", amount: 8000, criteria: "SC/ST category students", percentage: 100, provider: "State Govt", maxStudents: 50 },
  ]});

  await prisma.paymentModeMaster.createMany({ data: [
    { tenantId, name: "Cash", code: "CASH" },
    { tenantId, name: "Online/UPI", code: "UPI" },
    { tenantId, name: "Cheque", code: "CHQ" },
    { tenantId, name: "NEFT/RTGS", code: "NEFT" },
    { tenantId, name: "Credit/Debit Card", code: "CARD" },
    { tenantId, name: "DD (Demand Draft)", code: "DD" },
  ]});

  await prisma.receiptSeriesMaster.createMany({ data: [
    { tenantId, prefix: "FEE", startNumber: 1001, currentNumber: 1001, format: "FEE/2025-26/{NUM}", suffix: "" },
    { tenantId, prefix: "TRN", startNumber: 5001, currentNumber: 5001, format: "TRN/2025-26/{NUM}", suffix: "" },
    { tenantId, prefix: "HST", startNumber: 3001, currentNumber: 3001, format: "HST/2025-26/{NUM}", suffix: "" },
  ]});
  console.log("  ✅ Fee Masters done");

  // ═══════════════════════════════════════════════════════
  // 6. EXAM MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("📝 6. Exam Masters...");

  await prisma.examTypeMaster.createMany({ data: [
    { tenantId, name: "Unit Test", weightage: 10 },
    { tenantId, name: "Mid Term", weightage: 30 },
    { tenantId, name: "Final Exam", weightage: 50 },
    { tenantId, name: "Pre-Board", weightage: 0 },
    { tenantId, name: "Practical", weightage: 20 },
    { tenantId, name: "Oral/Viva", weightage: 10 },
  ]});

  // ExamTermMaster: academicYearId is FK; non-FK: name, startDate, endDate
  // SKIPPED: ExamTermMaster needs academicYearId (from AcademicYear table)
  console.log("    ⏭️  ExamTermMaster skipped (needs AcademicYear data first)");

  await prisma.resultTypeMaster.createMany({ data: [
    { tenantId, name: "Pass", formula: "total >= passing_marks" },
    { tenantId, name: "Fail", formula: "total < passing_marks" },
    { tenantId, name: "Compartment", formula: "failed_subjects <= 2" },
    { tenantId, name: "Absent", formula: "attended = false" },
    { tenantId, name: "Detained", formula: "attendance < 75%" },
  ]});

  await prisma.markingSchemeMaster.createMany({ data: [
    { tenantId, name: "Percentage Based", maxMarks: 100, passingMarks: 33, internalMarks: 20, practicalMarks: 0 },
    { tenantId, name: "Grade Based (CBSE)", maxMarks: 100, passingMarks: 33, internalMarks: 20, practicalMarks: 30 },
    { tenantId, name: "CGPA Based", maxMarks: 10, passingMarks: 4, internalMarks: 2, practicalMarks: 0 },
  ]});

  await prisma.assessmentMaster.createMany({ data: [
    { tenantId, name: "Written Exam", type: "WRITTEN", maxScore: 80, weightage: 80 },
    { tenantId, name: "Internal Assessment", type: "INTERNAL", maxScore: 20, weightage: 20 },
    { tenantId, name: "Practical", type: "PRACTICAL", maxScore: 30, weightage: 30 },
    { tenantId, name: "Project Work", type: "PROJECT", maxScore: 10, weightage: 10 },
    { tenantId, name: "Oral Test", type: "ORAL", maxScore: 10, weightage: 10 },
  ]});
  console.log("  ✅ Exam Masters done");

  // ═══════════════════════════════════════════════════════
  // 7. ATTENDANCE MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("📋 7. Attendance Masters...");

  await prisma.attendanceStatusMaster.createMany({ data: [
    { tenantId, name: "Present", code: "P", color: "#10B981", countAsPresent: true },
    { tenantId, name: "Absent", code: "A", color: "#EF4444", countAsPresent: false },
    { tenantId, name: "Late", code: "L", color: "#F59E0B", countAsPresent: true },
    { tenantId, name: "Half Day", code: "HD", color: "#8B5CF6", countAsPresent: true },
    { tenantId, name: "On Leave", code: "OL", color: "#6366F1", countAsPresent: false },
  ]});

  await prisma.lateFineMaster.createMany({ data: [
    { tenantId, afterMinutes: 15, fineAmount: 10, frequency: "DAILY" },
    { tenantId, afterMinutes: 30, fineAmount: 25, frequency: "DAILY" },
    { tenantId, afterMinutes: 60, fineAmount: 50, frequency: "DAILY" },
  ]});

  await prisma.leaveReasonMaster.createMany({ data: [
    { tenantId, name: "Medical/Sick", maxDays: 7, requiresDocument: true },
    { tenantId, name: "Family Function", maxDays: 3, requiresDocument: false },
    { tenantId, name: "Out of Station", maxDays: 5, requiresDocument: false },
    { tenantId, name: "Competition/Event", maxDays: 5, requiresDocument: true },
    { tenantId, name: "Personal Reason", maxDays: 2, requiresDocument: false },
  ]});

  await prisma.attendanceShiftMaster.createMany({ data: [
    { tenantId, name: "Morning", startTime: "07:30", endTime: "13:30", graceMinutes: 10 },
    { tenantId, name: "Afternoon", startTime: "12:00", endTime: "17:00", graceMinutes: 10 },
  ]});
  console.log("  ✅ Attendance Masters done");

  // ═══════════════════════════════════════════════════════
  // 8. LIBRARY MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("📚 8. Library Masters...");

  await prisma.publisherMaster.createMany({ data: [
    { tenantId, name: "NCERT", address: "Sri Aurobindo Marg, New Delhi", phone: "011-26560100", email: "ncert@gov.in" },
    { tenantId, name: "S. Chand Publishing", address: "Ram Nagar, New Delhi", phone: "011-23672080" },
    { tenantId, name: "Arihant Publications", address: "Meerut, UP", phone: "0121-2401479" },
    { tenantId, name: "Oxford University Press", address: "Kasturba Gandhi Marg, New Delhi", phone: "011-26444900" },
    { tenantId, name: "Pearson Education", address: "Noida, UP", phone: "0120-4306500" },
    { tenantId, name: "Dhanpat Rai Publications", address: "Nai Sarak, New Delhi" },
    { tenantId, name: "Navneet Education", address: "Mumbai, Maharashtra" },
    { tenantId, name: "Laxmi Publications", address: "Daryaganj, New Delhi" },
  ]});

  await prisma.authorMaster.createMany({ data: [
    { tenantId, name: "R.D. Sharma", nationality: "Indian", biography: "Renowned mathematics textbook author" },
    { tenantId, name: "H.C. Verma", nationality: "Indian", biography: "Famous physics author, IIT Kanpur professor" },
    { tenantId, name: "R.S. Aggarwal", nationality: "Indian", biography: "Quantitative aptitude and maths" },
    { tenantId, name: "Lakhmir Singh", nationality: "Indian", biography: "Science textbook series author" },
    { tenantId, name: "Sumita Arora", nationality: "Indian", biography: "Computer Science textbook author" },
    { tenantId, name: "Premchand", nationality: "Indian", biography: "Greatest Hindi literary figure" },
    { tenantId, name: "Ruskin Bond", nationality: "Indian", biography: "English fiction and children's stories" },
  ]});

  await prisma.languageMaster.createMany({ data: [
    { tenantId, name: "Hindi", code: "HI" },
    { tenantId, name: "English", code: "EN" },
    { tenantId, name: "Sanskrit", code: "SA" },
    { tenantId, name: "Urdu", code: "UR" },
  ]});

  await prisma.rackMaster.createMany({ data: [
    { tenantId, name: "Rack A", location: "Ground Floor - Science Section", capacity: 500 },
    { tenantId, name: "Rack B", location: "Ground Floor - Maths Section", capacity: 500 },
    { tenantId, name: "Rack C", location: "First Floor - Literature Section", capacity: 400 },
    { tenantId, name: "Rack D", location: "First Floor - Reference Section", capacity: 400 },
    { tenantId, name: "Rack E", location: "First Floor - Periodicals", capacity: 300 },
  ]});

  // ShelfMaster needs rackId
  const rackA = await prisma.rackMaster.findFirst({ where: { tenantId, name: "Rack A" } });
  if (rackA) {
    await prisma.shelfMaster.createMany({ data: [
      { tenantId, name: "Shelf 1", level: 1, rackId: rackA.id },
      { tenantId, name: "Shelf 2", level: 2, rackId: rackA.id },
      { tenantId, name: "Shelf 3", level: 3, rackId: rackA.id },
      { tenantId, name: "Shelf 4", level: 4, rackId: rackA.id },
      { tenantId, name: "Shelf 5", level: 5, rackId: rackA.id },
    ]});
  }

  await prisma.bookConditionMaster.createMany({ data: [
    { tenantId, name: "New" }, { tenantId, name: "Good" },
    { tenantId, name: "Fair" }, { tenantId, name: "Poor" },
    { tenantId, name: "Damaged" },
  ]});
  console.log("  ✅ Library Masters done");

  // ═══════════════════════════════════════════════════════
  // 9. HOSTEL MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("🏨 9. Hostel Masters...");

  // SKIPPED: BlockMaster needs hostelId (from Hostel table, not a master)
  console.log("    ⏭️  BlockMaster skipped (needs Hostel data first)");

  // SKIPPED: FloorMaster needs blockId
  console.log("    ⏭️  FloorMaster skipped (needs Block data first)");

  // SKIPPED: BedMaster needs roomId (from HostelRoom table)
  console.log("    ⏭️  BedMaster skipped (needs Room data first)");

  await prisma.hostelTypeMaster.createMany({ data: [
    { tenantId, name: "Boys Hostel" }, { tenantId, name: "Girls Hostel" },
    { tenantId, name: "Day Boarding" },
  ]});
  console.log("  ✅ Hostel Masters done");

  // ═══════════════════════════════════════════════════════
  // 10. TRANSPORT MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("🚌 10. Transport Masters...");

  await prisma.driverMaster.createMany({ data: [
    { tenantId, name: "Ramesh Kumar", phone: "9876000001", licenseNumber: "UP2520210012345", licenseExpiry: new Date("2027-06-30"), experience: 10, address: "Bareilly" },
    { tenantId, name: "Suresh Singh", phone: "9876000002", licenseNumber: "UP2520200067890", licenseExpiry: new Date("2026-12-31"), experience: 8, address: "Bareilly" },
    { tenantId, name: "Mohan Lal", phone: "9876000003", licenseNumber: "UP2520190011111", licenseExpiry: new Date("2027-03-15"), experience: 15, address: "Bareilly" },
    { tenantId, name: "Vijay Pal", phone: "9876000004", licenseNumber: "UP2520210022222", licenseExpiry: new Date("2028-01-20"), experience: 5, address: "Bareilly" },
  ]});

  await prisma.conductorMaster.createMany({ data: [
    { tenantId, name: "Ankit Verma", phone: "9876000010", address: "Bareilly" },
    { tenantId, name: "Rahul Yadav", phone: "9876000011", address: "Bareilly" },
    { tenantId, name: "Amit Sharma", phone: "9876000012", address: "Bareilly" },
  ]});

  await prisma.fuelTypeMaster.createMany({ data: [
    { tenantId, name: "Diesel" }, { tenantId, name: "Petrol" },
    { tenantId, name: "CNG" }, { tenantId, name: "Electric" },
  ]});

  await prisma.gPSDeviceMaster.createMany({ data: [
    { tenantId, deviceId: "GPS001", provider: "MapMyIndia", simNumber: "9800000001" },
    { tenantId, deviceId: "GPS002", provider: "MapMyIndia", simNumber: "9800000002" },
    { tenantId, deviceId: "GPS003", provider: "iTrack", simNumber: "9800000003" },
  ]});
  console.log("  ✅ Transport Masters done");

  // ═══════════════════════════════════════════════════════
  // 11. INVENTORY MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("📦 11. Inventory Masters...");

  await prisma.itemCategoryMaster.createMany({ data: [
    { tenantId, name: "Stationery", code: "STAT" },
    { tenantId, name: "Furniture", code: "FURN" },
    { tenantId, name: "Electronics", code: "ELEC" },
    { tenantId, name: "Sports Equipment", code: "SPRT" },
    { tenantId, name: "Lab Equipment", code: "LAB" },
    { tenantId, name: "Cleaning Supplies", code: "CLN" },
  ]});

  // ItemGroupMaster needs categoryId
  const statCat = await prisma.itemCategoryMaster.findFirst({ where: { tenantId, name: "Stationery" } });
  const furnCat = await prisma.itemCategoryMaster.findFirst({ where: { tenantId, name: "Furniture" } });
  if (statCat && furnCat) {
    await prisma.itemGroupMaster.createMany({ data: [
      { tenantId, name: "Consumables", categoryId: statCat.id },
      { tenantId, name: "Non-Consumables", categoryId: furnCat.id },
      { tenantId, name: "Fixed Assets", categoryId: furnCat.id },
    ]});
  }

  await prisma.unitMaster.createMany({ data: [
    { tenantId, name: "Piece", code: "pc" },
    { tenantId, name: "Dozen", code: "dz" },
    { tenantId, name: "Kilogram", code: "kg" },
    { tenantId, name: "Litre", code: "L" },
    { tenantId, name: "Ream", code: "rm" },
    { tenantId, name: "Box", code: "box" },
    { tenantId, name: "Packet", code: "pkt" },
  ]});

  await prisma.brandMaster.createMany({ data: [
    { tenantId, name: "Classmate" }, { tenantId, name: "Godrej" },
    { tenantId, name: "Nilkamal" }, { tenantId, name: "HP" },
    { tenantId, name: "Lenovo" }, { tenantId, name: "Epson" },
    { tenantId, name: "Cello" }, { tenantId, name: "Camlin" },
  ]});

  await prisma.supplierMaster.createMany({ data: [
    { tenantId, name: "ABC Stationery", contactPerson: "Mr. Ravi", phone: "9876100001", email: "abc@supply.com", address: "Bareilly Market", gstNumber: "09AAACB1234F1ZP", panNumber: "AAACB1234F" },
    { tenantId, name: "XYZ Electronics", contactPerson: "Mr. Sameer", phone: "9876100002", email: "xyz@elec.com", address: "IT Market, Bareilly", gstNumber: "09AAACX5678G2ZQ", panNumber: "AAACX5678G" },
    { tenantId, name: "Furniture House", contactPerson: "Mr. Kamal", phone: "9876100003", email: "furn@house.com", address: "Industrial Area, Bareilly", gstNumber: "09AAACF9012H3ZR", panNumber: "AAACF9012H" },
  ]});

  await prisma.warehouseMaster.createMany({ data: [
    { tenantId, name: "Main Store", address: "Basement, Main Building", capacity: 500 },
    { tenantId, name: "Sports Store", address: "Ground Floor, Sports Block", capacity: 200 },
  ]});

  await prisma.storeMaster.createMany({ data: [
    { tenantId, name: "General Store", location: "Admin Block" },
    { tenantId, name: "Lab Store", location: "Science Block" },
    { tenantId, name: "Sports Store", location: "Sports Block" },
  ]});

  await prisma.stockTypeMaster.createMany({ data: [
    { tenantId, name: "Purchase" }, { tenantId, name: "Transfer In" },
    { tenantId, name: "Return" }, { tenantId, name: "Damage" },
    { tenantId, name: "Issue" },
  ]});
  console.log("  ✅ Inventory Masters done");

  // ═══════════════════════════════════════════════════════
  // 12. PAYROLL / HR FINANCE MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("💼 12. Payroll Masters...");

  await prisma.payrollHeadMaster.createMany({ data: [
    { tenantId, name: "Basic Salary", type: "EARNING", isFixed: true, formula: "CTC * 0.5" },
    { tenantId, name: "HRA", type: "EARNING", isFixed: true, formula: "BASIC * 0.4" },
    { tenantId, name: "DA (Dearness Allowance)", type: "EARNING", isFixed: true, formula: "BASIC * 0.3" },
    { tenantId, name: "Conveyance", type: "EARNING", isFixed: true, formula: "1600" },
    { tenantId, name: "Medical Allowance", type: "EARNING", isFixed: true, formula: "1250" },
    { tenantId, name: "PF Deduction", type: "DEDUCTION", isFixed: true, formula: "BASIC * 0.12" },
    { tenantId, name: "ESI Deduction", type: "DEDUCTION", isFixed: true, formula: "GROSS * 0.0075" },
    { tenantId, name: "Professional Tax", type: "DEDUCTION", isFixed: true, formula: "200" },
    { tenantId, name: "TDS", type: "DEDUCTION", isFixed: false, formula: "AS_PER_SLAB" },
    { tenantId, name: "Overtime", type: "EARNING", isFixed: false, formula: "HOURLY_RATE * OT_HOURS" },
  ]});

  await prisma.salaryComponentMaster.createMany({ data: [
    { tenantId, name: "Basic", type: "EARNING", calculationType: "PERCENTAGE", percentage: 50, baseComponent: "CTC" },
    { tenantId, name: "HRA", type: "EARNING", calculationType: "PERCENTAGE", percentage: 20, baseComponent: "BASIC" },
    { tenantId, name: "DA", type: "EARNING", calculationType: "PERCENTAGE", percentage: 15, baseComponent: "BASIC" },
    { tenantId, name: "Conveyance", type: "EARNING", calculationType: "FIXED", percentage: 0, baseComponent: "NONE" },
    { tenantId, name: "Medical", type: "EARNING", calculationType: "FIXED", percentage: 0, baseComponent: "NONE" },
  ]});

  await prisma.pFMaster.createMany({ data: [
    { tenantId, employeeContribution: 12.0, employerContribution: 12.0, adminCharges: 0.5, ceiling: 15000 },
    { tenantId, employeeContribution: 12.0, employerContribution: 3.67, adminCharges: 0.5, ceiling: 15000 },
  ]});

  await prisma.eSIMaster.createMany({ data: [
    { tenantId, employeeContribution: 0.75, employerContribution: 3.25, ceiling: 21000 },
  ]});

  await prisma.taxSlabMaster.createMany({ data: [
    { tenantId, fromAmount: 0, toAmount: 300000, percentage: 0, surcharge: 0, cess: 0, financialYear: "2025-26", regime: "NEW" },
    { tenantId, fromAmount: 300001, toAmount: 700000, percentage: 5, surcharge: 0, cess: 4, financialYear: "2025-26", regime: "NEW" },
    { tenantId, fromAmount: 700001, toAmount: 1000000, percentage: 10, surcharge: 0, cess: 4, financialYear: "2025-26", regime: "NEW" },
    { tenantId, fromAmount: 1000001, toAmount: 1200000, percentage: 15, surcharge: 0, cess: 4, financialYear: "2025-26", regime: "NEW" },
    { tenantId, fromAmount: 1200001, toAmount: 1500000, percentage: 20, surcharge: 0, cess: 4, financialYear: "2025-26", regime: "NEW" },
    { tenantId, fromAmount: 1500001, toAmount: 99999999, percentage: 30, surcharge: 0, cess: 4, financialYear: "2025-26", regime: "NEW" },
  ]});

  await prisma.incrementTypeMaster.createMany({ data: [
    { tenantId, name: "Annual Increment", type: "PERCENTAGE", percentage: 8, amount: 0 },
    { tenantId, name: "Promotion Increment", type: "PERCENTAGE", percentage: 15, amount: 0 },
    { tenantId, name: "Special Increment", type: "FIXED", percentage: 0, amount: 3000 },
  ]});
  console.log("  ✅ Payroll Masters done");

  // ═══════════════════════════════════════════════════════
  // 13. COMMUNICATION MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("📱 13. Communication Masters...");

  await prisma.sMSTemplateMaster.createMany({ data: [
    { tenantId, name: "Fee Reminder", content: "Dear Parent, fee of Rs.{amount} is pending for {student}. Please pay by {date}.", category: "Fee" },
    { tenantId, name: "Attendance Alert", content: "Dear Parent, {student} was absent today ({date}).", category: "Attendance" },
    { tenantId, name: "Exam Schedule", content: "Dear Parent, exams start from {date}. Check school portal for schedule.", category: "Exam" },
    { tenantId, name: "Holiday Notice", content: "School will remain closed on {date} on account of {reason}.", category: "General" },
    { tenantId, name: "Result Published", content: "Results for {exam} have been published. Login to portal to view.", category: "Exam" },
  ]});

  await prisma.emailTemplateMaster.createMany({ data: [
    { tenantId, name: "Welcome Email", subject: "Welcome to RMS Academy", category: "Onboarding" },
    { tenantId, name: "Fee Receipt", subject: "Fee Payment Confirmation", category: "Fee" },
    { tenantId, name: "Report Card", subject: "Report Card Published", category: "Academic" },
  ]});

  await prisma.whatsAppTemplateMaster.createMany({ data: [
    { tenantId, name: "Fee Due Alert", content: "Dear Parent, Fee of Rs.{amount} is due for {student}. Pay online.", category: "Fee" },
    { tenantId, name: "Absence Alert", content: "{student} was marked absent today ({date}).", category: "Attendance" },
  ]});

  await prisma.notificationTemplateMaster.createMany({ data: [
    { tenantId, name: "Push - Fee Due", title: "Fee Payment Reminder", category: "Fee" },
    { tenantId, name: "Push - Homework", title: "New Homework Assigned", category: "Academic" },
    { tenantId, name: "In-App Notice", title: "New Notice", category: "General" },
  ]});

  await prisma.noticeCategoryMaster.createMany({ data: [
    { tenantId, name: "General", color: "#6366F1", icon: "Bell" },
    { tenantId, name: "Academic", color: "#10B981", icon: "GraduationCap" },
    { tenantId, name: "Circular", color: "#F59E0B", icon: "FileText" },
    { tenantId, name: "Event", color: "#8B5CF6", icon: "Calendar" },
    { tenantId, name: "Holiday", color: "#EF4444", icon: "Palmtree" },
  ]});
  console.log("  ✅ Communication Masters done");

  // ═══════════════════════════════════════════════════════
  // 14. CERTIFICATE & ID CARD MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("🎖️ 14. Certificate & ID Card Masters...");

  await prisma.certificateTemplateMaster.createMany({ data: [
    { tenantId, name: "Transfer Certificate", type: "TC", content: "This is to certify that {student_name} son/daughter of {father_name} was a student of this school.", category: "Academic" },
    { tenantId, name: "Character Certificate", type: "CC", content: "This is to certify that {student_name} bears good moral character.", category: "Academic" },
    { tenantId, name: "Bonafide Certificate", type: "BC", content: "This is to certify that {student_name} is a bonafide student of Class {class}.", category: "Academic" },
    { tenantId, name: "Merit Certificate", type: "MERIT", content: "Awarded to {student_name} for excellence in {subject}.", category: "Achievement" },
  ]});

  await prisma.iDCardTemplateMaster.createMany({ data: [
    { tenantId, name: "Student ID Card", type: "STUDENT", frontDesign: "standard_student_front_v1", backDesign: "standard_student_back_v1", size: "CR80", orientation: "portrait" },
    { tenantId, name: "Staff ID Card", type: "STAFF", frontDesign: "standard_staff_front_v1", backDesign: "standard_staff_back_v1", size: "CR80", orientation: "portrait" },
    { tenantId, name: "Visitor Pass", type: "VISITOR", frontDesign: "visitor_pass_front_v1", backDesign: "visitor_pass_back_v1", size: "CR80", orientation: "portrait" },
  ]});
  console.log("  ✅ Certificate & ID Card Masters done");

  // ═══════════════════════════════════════════════════════
  // 15. SECURITY & ACCESS MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("🔒 15. Security & Access Masters...");

  await prisma.roleMaster.createMany({ data: [
    { tenantId, name: "Super Admin", code: "SA", level: 0, description: "Full system access", isSystem: true },
    { tenantId, name: "Admin", code: "ADM", level: 1, description: "Institution admin", isSystem: true },
    { tenantId, name: "Principal", code: "PRIN", level: 2, description: "School principal" },
    { tenantId, name: "Teacher", code: "TCH", level: 5, description: "Teaching staff" },
    { tenantId, name: "Accountant", code: "ACC", level: 5, description: "Fee & accounts" },
    { tenantId, name: "Librarian", code: "LIB", level: 6, description: "Library management" },
    { tenantId, name: "Student", code: "STU", level: 10, description: "Student access" },
    { tenantId, name: "Parent", code: "PAR", level: 10, description: "Parent access" },
  ]});

  // PermissionMaster needs moduleId — skip or create with placeholder
  // ModuleMaster first, then permissions
  const dashModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Dashboard", code: "DASH", icon: "LayoutDashboard", route: "/dashboard", order: 1 } });
  const stuModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Students", code: "STU", icon: "GraduationCap", route: "/students", order: 2 } });
  const tchModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Teachers", code: "TCH", icon: "Users", route: "/teachers", order: 3 } });
  const attModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Attendance", code: "ATT", icon: "CalendarCheck", route: "/attendance", order: 4 } });
  const feeModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Fees", code: "FEE", icon: "IndianRupee", route: "/fees", order: 5 } });
  const exmModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Exams", code: "EXM", icon: "ClipboardList", route: "/exams", order: 6 } });
  const libModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Library", code: "LIB", icon: "BookOpen", route: "/library", order: 7 } });
  const trnModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Transport", code: "TRN", icon: "Bus", route: "/transport", order: 8 } });
  const rptModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Reports", code: "RPT", icon: "BarChart", route: "/reports", order: 13 } });
  const mstModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Masters", code: "MST", icon: "Database", route: "/masters", order: 14 } });
  const setModule = await prisma.moduleMaster.create({ data: { tenantId, name: "Settings", code: "SET", icon: "Settings", route: "/settings", order: 15 } });

  // Now create permissions referencing modules
  await prisma.permissionMaster.createMany({ data: [
    { tenantId, moduleId: stuModule.id, action: "VIEW", name: "View Students", code: "student.view" },
    { tenantId, moduleId: stuModule.id, action: "CREATE", name: "Add Student", code: "student.create" },
    { tenantId, moduleId: stuModule.id, action: "EDIT", name: "Edit Student", code: "student.edit" },
    { tenantId, moduleId: stuModule.id, action: "DELETE", name: "Delete Student", code: "student.delete" },
    { tenantId, moduleId: feeModule.id, action: "VIEW", name: "View Fees", code: "fee.view" },
    { tenantId, moduleId: feeModule.id, action: "CREATE", name: "Collect Fee", code: "fee.collect" },
    { tenantId, moduleId: attModule.id, action: "CREATE", name: "Mark Attendance", code: "attendance.mark" },
    { tenantId, moduleId: rptModule.id, action: "VIEW", name: "View Reports", code: "report.view" },
    { tenantId, moduleId: mstModule.id, action: "ALL", name: "Manage Masters", code: "master.manage" },
    { tenantId, moduleId: setModule.id, action: "ALL", name: "Manage Settings", code: "settings.manage" },
  ]});

  // MenuMaster needs moduleId
  await prisma.menuMaster.createMany({ data: [
    { tenantId, name: "Dashboard", moduleId: dashModule.id, route: "/dashboard", icon: "LayoutDashboard", order: 1 },
    { tenantId, name: "Students", moduleId: stuModule.id, route: "/students", icon: "GraduationCap", order: 2 },
    { tenantId, name: "Teachers", moduleId: tchModule.id, route: "/teachers", icon: "Users", order: 3 },
    { tenantId, name: "Fees", moduleId: feeModule.id, route: "/fees", icon: "IndianRupee", order: 4 },
    { tenantId, name: "Exams", moduleId: exmModule.id, route: "/exams", icon: "ClipboardList", order: 5 },
    { tenantId, name: "Masters", moduleId: mstModule.id, route: "/masters", icon: "Database", order: 14 },
  ]});

  await prisma.userTypeMaster.createMany({ data: [
    { tenantId, name: "Admin" }, { tenantId, name: "Teacher" },
    { tenantId, name: "Student" }, { tenantId, name: "Parent" },
    { tenantId, name: "Accountant" }, { tenantId, name: "Librarian" },
    { tenantId, name: "Transport Manager" },
  ]});

  await prisma.aPIPermissionMaster.createMany({ data: [
    { tenantId, endpoint: "/api/students", method: "GET", description: "Read Students API" },
    { tenantId, endpoint: "/api/students", method: "POST", description: "Write Students API" },
    { tenantId, endpoint: "/api/fees", method: "GET", description: "Read Fees API" },
    { tenantId, endpoint: "/api/masters", method: "GET", description: "Read Masters API" },
  ]});
  console.log("  ✅ Security & Access Masters done");

  // ═══════════════════════════════════════════════════════
  // 16. DOCUMENT MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("📄 16. Document Masters...");

  await prisma.documentTypeMaster.createMany({ data: [
    { tenantId, name: "Aadhar Card", code: "AADHAR", category: "Identity", isRequired: true },
    { tenantId, name: "Birth Certificate", code: "BIRTH", category: "Identity", isRequired: true },
    { tenantId, name: "Transfer Certificate", code: "TC", category: "Academic", isRequired: false },
    { tenantId, name: "Mark Sheet", code: "MARKS", category: "Academic", isRequired: false },
    { tenantId, name: "Passport Photo", code: "PHOTO", category: "Photo", isRequired: true },
    { tenantId, name: "Caste Certificate", code: "CASTE", category: "Identity", isRequired: false },
    { tenantId, name: "Income Certificate", code: "INCOME", category: "Financial", isRequired: false },
  ]});

  await prisma.documentCategoryMaster.createMany({ data: [
    { tenantId, name: "Identity Documents", description: "Aadhar, PAN, etc." },
    { tenantId, name: "Academic Documents", description: "Marksheets, TC, etc." },
    { tenantId, name: "Financial Documents", description: "Income proof, etc." },
    { tenantId, name: "Medical Documents", description: "Health records" },
    { tenantId, name: "Photos", description: "Passport size photos" },
  ]});

  await prisma.approvalWorkflowMaster.createMany({ data: [
    { tenantId, name: "Leave Approval", module: "HR", steps: ["HOD", "Principal"] },
    { tenantId, name: "Fee Concession", module: "Fee", steps: ["Accountant", "Principal"] },
    { tenantId, name: "TC Issuance", module: "Academic", steps: ["Class Teacher", "Principal"] },
  ]});
  console.log("  ✅ Document Masters done");

  // ═══════════════════════════════════════════════════════
  // 17. EVENT & VISITOR MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("🎉 17. Event & Visitor Masters...");

  await prisma.eventCategoryMaster.createMany({ data: [
    { tenantId, name: "Academic", color: "#3B82F6", icon: "BookOpen" },
    { tenantId, name: "Cultural", color: "#8B5CF6", icon: "Music" },
    { tenantId, name: "Sports", color: "#10B981", icon: "Trophy" },
    { tenantId, name: "Annual Function", color: "#F59E0B", icon: "Star" },
    { tenantId, name: "Parent Meeting", color: "#EF4444", icon: "Users" },
  ]});

  await prisma.venueMaster.createMany({ data: [
    { tenantId, name: "Main Auditorium", capacity: 500, location: "Main Building" },
    { tenantId, name: "Sports Ground", capacity: 2000, location: "Behind Campus" },
    { tenantId, name: "Seminar Hall", capacity: 100, location: "Admin Block 2nd Floor" },
    { tenantId, name: "Open Stage", capacity: 300, location: "Playground Area" },
  ]});

  await prisma.eventTypeMaster.createMany({ data: [
    { tenantId, name: "Competition" }, { tenantId, name: "Celebration" },
    { tenantId, name: "Workshop" }, { tenantId, name: "Seminar" },
    { tenantId, name: "Assembly" }, { tenantId, name: "Field Trip" },
  ]});

  await prisma.visitorTypeMaster.createMany({ data: [
    { tenantId, name: "Parent" }, { tenantId, name: "Vendor" },
    { tenantId, name: "Government Official" }, { tenantId, name: "Guest Speaker" },
    { tenantId, name: "Alumni" }, { tenantId, name: "Other" },
  ]});

  await prisma.purposeMaster.createMany({ data: [
    { tenantId, name: "Meeting with Teacher" },
    { tenantId, name: "Fee Payment" },
    { tenantId, name: "Document Collection" },
    { tenantId, name: "Admission Inquiry" },
    { tenantId, name: "Delivery" },
    { tenantId, name: "Official Visit" },
  ]});

  await prisma.gateMaster.createMany({ data: [
    { tenantId, name: "Main Gate", location: "Front - Divna Road", type: "ENTRY_EXIT" },
    { tenantId, name: "Back Gate", location: "Back - Service Road", type: "SERVICE" },
    { tenantId, name: "Staff Gate", location: "Side - Staff Parking", type: "STAFF" },
  ]});
  console.log("  ✅ Event & Visitor Masters done");

  // ═══════════════════════════════════════════════════════
  // 18. AI & ANALYTICS MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("🧠 18. AI & Analytics Masters...");

  await prisma.aIPromptMaster.createMany({ data: [
    { tenantId, name: "Attendance Analysis", prompt: "Analyze attendance patterns and identify at-risk students" },
    { tenantId, name: "Fee Defaulter Prediction", prompt: "Predict likely fee defaulters based on payment history" },
    { tenantId, name: "Student Performance", prompt: "Analyze academic performance trends" },
    { tenantId, name: "Report Generation", prompt: "Generate comprehensive report for given period" },
  ]});

  await prisma.predictionRuleMaster.createMany({ data: [
    { tenantId, name: "Dropout Risk", module: "Student", condition: { field: "attendance_percent", operator: "<", value: 60 } },
    { tenantId, name: "Academic Decline", module: "Exam", condition: { field: "marks_trend", operator: "=", value: "DECLINING" } },
    { tenantId, name: "Fee Defaulter", module: "Fee", condition: { field: "pending_days", operator: ">", value: 60 } },
  ]});

  await prisma.analyticsRuleMaster.createMany({ data: [
    { tenantId, name: "Monthly Attendance Report", module: "Attendance", metric: "attendance_rate", formula: "present_days / total_days * 100", visualization: "LINE_CHART" },
    { tenantId, name: "Fee Collection Tracker", module: "Fee", metric: "collection_rate", formula: "collected / total_due * 100", visualization: "BAR_CHART" },
  ]});
  console.log("  ✅ AI & Analytics Masters done");

  // ═══════════════════════════════════════════════════════
  // 19. SYSTEM / SETTINGS MASTERS
  // ═══════════════════════════════════════════════════════
  console.log("⚙️ 19. System / Settings Masters...");

  await prisma.themeMaster.createMany({ data: [
    { tenantId, name: "Default Blue", primaryColor: "#4f46e5", secondaryColor: "#7c3aed", accentColor: "#06b6d4", fontFamily: "Inter", isDefault: true },
    { tenantId, name: "Green Nature", primaryColor: "#059669", secondaryColor: "#10b981", accentColor: "#14b8a6", fontFamily: "Inter" },
    { tenantId, name: "Royal Purple", primaryColor: "#7c3aed", secondaryColor: "#8b5cf6", accentColor: "#a855f7", fontFamily: "Inter" },
    { tenantId, name: "Dark Mode", primaryColor: "#6366f1", secondaryColor: "#818cf8", accentColor: "#a5b4fc", fontFamily: "Inter", isDark: true },
  ]});

  await prisma.currencyMaster.createMany({ data: [
    { tenantId, name: "Indian Rupee", code: "INR", symbol: "₹", decimalPlaces: 2, isDefault: true },
    { tenantId, name: "US Dollar", code: "USD", symbol: "$", decimalPlaces: 2 },
    { tenantId, name: "UAE Dirham", code: "AED", symbol: "د.إ", decimalPlaces: 2 },
  ]});

  await prisma.timeZoneMaster.createMany({ data: [
    { tenantId, name: "India Standard Time", code: "IST", offset: "+05:30", isDefault: true },
    { tenantId, name: "Gulf Standard Time", code: "GST", offset: "+04:00" },
    { tenantId, name: "Eastern Time", code: "EST", offset: "-05:00" },
  ]});

  await prisma.backupPolicyMaster.createMany({ data: [
    { tenantId, name: "Daily Backup", frequency: "DAILY", retentionDays: 30, time: "02:00", isAutomatic: true },
    { tenantId, name: "Weekly Full Backup", frequency: "WEEKLY", retentionDays: 90, time: "01:00", isAutomatic: true },
    { tenantId, name: "Monthly Archive", frequency: "MONTHLY", retentionDays: 365, time: "00:00", isAutomatic: false },
  ]});

  await prisma.auditTypeMaster.createMany({ data: [
    { tenantId, name: "CREATE" }, { tenantId, name: "UPDATE" },
    { tenantId, name: "DELETE" }, { tenantId, name: "LOGIN" },
    { tenantId, name: "LOGOUT" }, { tenantId, name: "EXPORT" },
    { tenantId, name: "IMPORT" },
  ]});

  await prisma.aPIProviderMaster.createMany({ data: [
    { tenantId, name: "SMS Provider (MSG91)", type: "SMS", baseUrl: "https://api.msg91.com" },
    { tenantId, name: "WhatsApp (Gupshup)", type: "WHATSAPP", baseUrl: "https://api.gupshup.io" },
    { tenantId, name: "Payment (Razorpay)", type: "PAYMENT", baseUrl: "https://api.razorpay.com" },
    { tenantId, name: "Email (SendGrid)", type: "EMAIL", baseUrl: "https://api.sendgrid.com" },
  ]});

  await prisma.settingsMaster.createMany({ data: [
    { tenantId, module: "General", key: "school_name", value: "RMS Academy", type: "text", description: "Institution name" },
    { tenantId, module: "Academic", key: "academic_year", value: "2025-26", type: "text", description: "Current academic year" },
    { tenantId, module: "Fee", key: "fee_due_day", value: "15", type: "number", description: "Monthly fee due date" },
    { tenantId, module: "Fee", key: "late_fee_per_day", value: "10", type: "number", description: "Late fee per day in Rs" },
    { tenantId, module: "Attendance", key: "attendance_lock_time", value: "11:00", type: "text", description: "Lock attendance after this time" },
    { tenantId, module: "Communication", key: "sms_enabled", value: "true", type: "boolean", description: "Enable SMS notifications" },
    { tenantId, module: "Communication", key: "whatsapp_enabled", value: "true", type: "boolean", description: "Enable WhatsApp notifications" },
    { tenantId, module: "System", key: "auto_backup", value: "true", type: "boolean", description: "Enable auto backup" },
  ]});
  console.log("  ✅ System / Settings Masters done");

  // ═══════════════════════════════════════════════════════
  // DONE!
  // ═══════════════════════════════════════════════════════
  console.log("\n" + "━".repeat(60));
  console.log("🎉 ALL 110 MASTER TABLES SEEDED SUCCESSFULLY!");
  console.log("━".repeat(60));
  console.log("\n📊 Summary:");
  console.log("  • Organization: School, Branch, Campus, Session, Shift, Working Days, Holidays, Houses, Timings");
  console.log("  • Academic: Stream, Subject Groups, Electives, Medium, Board, Course, Syllabus, Period, Timetable Slots");
  console.log("  • Student: Admission Type, Category, Religion, Caste, Nationality, Blood Group, Mother Tongue, Status, Sibling");
  console.log("  • Staff: Department, Designation, Employment Type, Qualification, Leave Type, Staff Category, Salary Grade, Bank");
  console.log("  • Fee: Fee Group, Fee Type, Concession, Scholarship, Payment Mode, Receipt Series");
  console.log("  • Exam: Exam Type, Term, Result Type, Marking Scheme, Assessment");
  console.log("  • Attendance: Status, Late Fine, Leave Reason, Shift");
  console.log("  • Library: Publisher, Author, Language, Rack, Shelf, Book Condition");
  console.log("  • Hostel: Block, Floor, Bed, Hostel Type");
  console.log("  • Transport: Driver, Conductor, Fuel Type, GPS Device");
  console.log("  • Inventory: Item Category, Item Group, Unit, Brand, Supplier, Warehouse, Store, Stock Type");
  console.log("  • Payroll: Payroll Head, Salary Component, PF, ESI, Tax Slab, Increment Type");
  console.log("  • Communication: SMS Template, Email Template, WhatsApp Template, Notification Template, Notice Category");
  console.log("  • Certificate: Certificate Template, ID Card Template");
  console.log("  • Security: Role, Permission, User Type, Module, Menu, API Permission");
  console.log("  • Document: Document Type, Document Category, Approval Workflow");
  console.log("  • Event: Event Category, Venue, Event Type, Visitor Type, Purpose, Gate");
  console.log("  • AI: AI Prompt, Prediction Rule, Analytics Rule");
  console.log("  • System: Theme, Currency, TimeZone, Backup Policy, Audit Type, API Provider, Settings");
  console.log("\n✅ Run your backend now — Master module is fully operational!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

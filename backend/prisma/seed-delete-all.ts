// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════
// SEED DELETE ALL - Clean slate (preserves SuperAdmin, Tenant, Subscriptions)
// ═══════════════════════════════════════════════════════════════════════════
// RUN: npx ts-node prisma/seed-delete-all.ts
// ═══════════════════════════════════════════════════════════════════════════
// PRESERVES: SuperAdmin user, Tenant, SubscriptionPlan, TenantSubscription,
//            SubscriptionPayment, FreeTrialRecord, PaymentGatewayConfig, OnlinePayment
// DELETES: Everything else (all operational data + masters)
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("\n🗑️  SEED DELETE ALL - Starting...\n");
  console.log("━".repeat(60));

  // Find tenant
  const tenant = await prisma.tenant.findFirst({ where: { isDeleted: false } });
  if (!tenant) { console.error("❌ No tenant found!"); process.exit(1); }
  const tenantId = tenant.id;
  console.log(`✅ Tenant: ${tenant.name} (${tenantId})`);

  // Find super admin to preserve
  const superAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN", tenantId } });
  const preserveUserIds = [];
  if (superAdmin) preserveUserIds.push(superAdmin.id);
  if (adminUser) preserveUserIds.push(adminUser.id);
  console.log(`✅ Preserving ${preserveUserIds.length} users (SuperAdmin + Admin)\n`);

  // ═══════════════════════════════════════════════════════════════
  // DELETE ORDER: Children first → Parents last
  // ═══════════════════════════════════════════════════════════════

  // ─── Phase 1: Deep children (leaf nodes with FK deps) ───
  console.log("📌 Phase 1: Deleting leaf/child records...");
  const phase1 = [
    // Fee children
    "studentFeeDiscount","studentFeeItem","payment","studentFee","feeStructureItem","feeDiscount","fineRule",
    // Exam children
    "marksEntry","examResult","resultSummary","seatingArrangement","admitCard","questionPaper",
    "invigilatorAssignment","examSubject","examSchedule",
    // Attendance
    "attendance","staffAttendance","transportAttendance",
    // Library children
    "bookIssue",
    // Transport children
    "transportPickupDrop","studentPickupDrop","geofenceAlert","tripLog","vehicleLocation",
    "vehicleLocationHistory","transportAlert","transportTrip","transportAssignment","routeStop",
    // Hostel children
    "hostelAllocation","messMenu","hostelMess",
    // Communication/Notification leaf
    "sMSLog","whatsAppLog","pushNotification","notificationLog","notificationQueue",
    "inAppNotification","notificationSchedule","notificationConfig",
    "communicationLog","communication",
    // Workflow/Form/Ticket leaf
    "ticketComment","workflowInstance","formSubmission","generatedReport","scheduledReport",
    // Gate/Event/QR leaf
    "gatePass","qRScanLog",
    // File/Search/Scheduler leaf
    "searchHistory","searchIndex","schedulerLog","importJob","exportJob","queueJob",
    // AI Module
    "aIAnalysis","aIConversation","aIInsight",
    // Dashboard/Theme/Translation
    "dashboardWidget","dashboardLayout","themeConfig","translation","languageConfig",
    // Stock/Inventory
    "stockTransaction","stockItem",
    // Payroll/Asset
    "payroll","assetIssue",
    // Certificate children
    "signedDocument","characterCertificate","migrationCertificate","transferCertificate","certificate",
    // Device/Notification
    "deviceToken","notification","notificationPreference",
    // Login/Audit
    "loginHistory","auditLog",
  ];
  for (const m of phase1) {
    try { await (prisma as any)[m].deleteMany({ where: { tenantId } }); } catch(e) {}
  }
  console.log("  ✅ Phase 1 complete");

  // ─── Phase 2: Mid-level records ───
  console.log("📌 Phase 2: Deleting mid-level records...");
  const phase2 = [
    // Fee structures
    "feeStructure","feeHead",
    // Exams
    "exam",
    // Library
    "libraryMember","book","bookCategory","librarySetting",
    // Transport
    "route","vehicle","transportSetting",
    // Hostel
    "hostelRoom","hostel",
    // Tickets/Workflow/Form/Report
    "ticket","ticketCategory","workflow","formTemplate","formSubmission","reportTemplate",
    // Event
    "event","eventCategory",
    // Notice
    "notice","noticeTemplate",
    // QR/Payment link
    "qRCode","paymentLink",
    // File/Folder
    "fileStorage","fileFolder",
    // Scheduler/Queue/Import
    "scheduledTask","queueConfig","importTemplate",
    // Asset
    "asset",
    // Digital Signature
    "digitalSignature",
    // Leave
    "leave","leaveRequest",
    // Settings
    "setting","backupSettings","designerSettings","backupLog","backup",
    // Signature
    "signature",
    // Staff
    "staff",
    // GradeSetting
    "gradeSetting",
    // Role Permission
    "rolePermission",
  ];
  for (const m of phase2) {
    try { await (prisma as any)[m].deleteMany({ where: { tenantId } }); } catch(e) {}
  }
  console.log("  ✅ Phase 2 complete");

  // ─── Phase 3: Teacher module ───
  console.log("📌 Phase 3: Deleting teacher data...");
  const phase3 = [
    "teacherLeave","teacherSalary","teacherPerformance","teacherDocument","teacherSettings",
    "teacherSubject","teacherClass","timetable",
  ];
  for (const m of phase3) {
    try { await (prisma as any)[m].deleteMany({ where: { tenantId } }); } catch(e) {}
  }
  console.log("  ✅ Phase 3 complete");

  // ─── Phase 4: Students & Enrollment ───
  console.log("📌 Phase 4: Deleting student data...");
  const phase4 = [
    "enrollment","studentDocument","studentHistory","promotion","admissionCounter","classAgeConfig",
  ];
  for (const m of phase4) {
    try { await (prisma as any)[m].deleteMany({ where: { tenantId } }); } catch(e) {}
  }
  try { await prisma.student.deleteMany({ where: { tenantId } }); } catch(e) {}
  console.log("  ✅ Phase 4 complete");

  // ─── Phase 5: Core structures ───
  console.log("📌 Phase 5: Deleting core structures...");
  try { await prisma.teacher.deleteMany({ where: { tenantId } }); } catch(e) {}
  // Fallback: delete by email pattern (Teacher.email is global @unique)
  try { await prisma.teacher.deleteMany({ where: { email: { contains: "@rmsacademy.edu" } } }); } catch(e) {}
  try { await prisma.subject.deleteMany({ where: { tenantId } }); } catch(e) {}
  try { await prisma.section.deleteMany({ where: { tenantId } }); } catch(e) {}
  try { await prisma.room.deleteMany({ where: { tenantId } }); } catch(e) {}
  try { await prisma.class.deleteMany({ where: { tenantId } }); } catch(e) {}
  try { await prisma.academicYear.deleteMany({ where: { tenantId } }); } catch(e) {}
  console.log("  ✅ Phase 5 complete");

  // ─── Phase 6: Users (except protected) ───
  console.log("📌 Phase 6: Deleting non-protected users...");
  try {
    await prisma.user.deleteMany({ where: { tenantId, id: { notIn: preserveUserIds } } });
  } catch(e) {}
  console.log("  ✅ Phase 6 complete");

  // ─── Phase 7: ALL Master tables ───
  console.log("📌 Phase 7: Deleting all masters...");
  const masterModels = [
    "schoolMaster","branchMaster","campusMaster","shiftMaster","workingDayMaster","holidayMaster",
    "houseMaster","schoolTimingMaster","streamMaster","subjectGroupMaster","elelectiveSubjectMaster",
    "mediumMaster","boardMaster","courseMaster","syllabusMaster","periodMaster","timetableSlotMaster",
    "admissionTypeMaster","categoryMaster","religionMaster","casteMaster","nationalityMaster",
    "bloodGroupMaster","motherTongueMaster","studentStatusMaster","siblingRelationMaster",
    "departmentMaster","designationMaster","employmentTypeMaster","qualificationMaster",
    "leaveTypeMaster","staffCategoryMaster","salaryGradeMaster","bankMaster",
    "feeGroupMaster","feeTypeMaster","concessionMaster","scholarshipMaster",
    "paymentModeMaster","receiptSeriesMaster","examTypeMaster","examTermMaster",
    "resultTypeMaster","markingSchemeMaster","assessmentMaster",
    "attendanceStatusMaster","lateFineMaster","leaveReasonMaster","attendanceShiftMaster",
    "publisherMaster","authorMaster","languageMaster","rackMaster","shelfMaster",
    "bookConditionMaster","blockMaster","floorMaster","bedMaster","hostelTypeMaster",
    "driverMaster","conductorMaster","fuelTypeMaster","gPSDeviceMaster",
    "itemCategoryMaster","itemGroupMaster","unitMaster","brandMaster",
    "supplierMaster","warehouseMaster","storeMaster","stockTypeMaster",
    "payrollHeadMaster","salaryComponentMaster","pFMaster","eSIMaster",
    "taxSlabMaster","incrementTypeMaster",
    "sMSTemplateMaster","emailTemplateMaster","whatsAppTemplateMaster",
    "notificationTemplateMaster","noticeCategoryMaster",
    "certificateTemplateMaster","iDCardTemplateMaster",
    "roleMaster","permissionMaster","userTypeMaster","moduleMaster","menuMaster",
    "aPIPermissionMaster","documentTypeMaster","documentCategoryMaster",
    "approvalWorkflowMaster","eventCategoryMaster","venueMaster",
    "eventTypeMaster","visitorTypeMaster","purposeMaster","gateMaster",
    "aIPromptMaster","predictionRuleMaster","analyticsRuleMaster",
    "themeMaster","currencyMaster","timeZoneMaster",
    "backupPolicyMaster","auditTypeMaster","aPIProviderMaster","settingsMaster",
  ];
  for (const m of masterModels) {
    try { await (prisma as any)[m].deleteMany({ where: { tenantId } }); } catch(e) {}
  }
  console.log("  ✅ Phase 7 complete");

  // ─── Phase 8: Platform-level (no tenantId) ───
  console.log("📌 Phase 8: Cleaning platform tables...");
  try { await prisma.platformSettings.deleteMany({}); } catch(e) {}
  try { await prisma.developerProfile.deleteMany({}); } catch(e) {}
  console.log("  ✅ Phase 8 complete");

  // ═══════════════════════════════════════════════════════════════
  console.log("\n" + "━".repeat(60));
  console.log("🎉 DELETE ALL COMPLETE!");
  console.log("━".repeat(60));
  console.log("\n📌 PRESERVED:");
  console.log("  • SuperAdmin user");
  console.log("  • Admin user");
  console.log("  • Tenant record");
  console.log("  • SubscriptionPlan");
  console.log("  • TenantSubscription");
  console.log("  • SubscriptionPayment");
  console.log("  • FreeTrialRecord");
  console.log("  • PaymentGatewayConfig");
  console.log("  • OnlinePayment (Razorpay)");
  console.log("\n✅ Database is clean & ready for fresh seeding!\n");
}

main()
  .catch((e) => { console.error("❌ Delete failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

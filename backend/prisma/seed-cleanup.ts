// prisma/seed-cleanup.ts
// ==============================================
// SEED FILE 1: DELETE ALL DATA (except SuperAdmin, Tenant, User)
// ==============================================
import { PrismaClient } from "@prisma/client";
declare const process: any;

const prisma = new PrismaClient();

async function cleanup() {
  console.log("[CLEANUP] Starting - Deleting all data except SuperAdmin, Tenant, User...");

  // Delete in reverse dependency order to avoid foreign key issues

  // Transport Module
  await prisma.transportAttendance.deleteMany({});
  console.log("[OK] TransportAttendance deleted");

  await prisma.transportAssignment.deleteMany({});
  console.log("[OK] TransportAssignment deleted");

  await prisma.routeStop.deleteMany({});
  console.log("[OK] RouteStop deleted");

  await prisma.route.deleteMany({});
  console.log("[OK] Route deleted");

  await prisma.vehicle.deleteMany({});
  console.log("[OK] Vehicle deleted");

  await prisma.transportSetting.deleteMany({});
  console.log("[OK] TransportSetting deleted");

  // Library Module
  await prisma.bookIssue.deleteMany({});
  console.log("[OK] BookIssue deleted");

  await prisma.libraryMember.deleteMany({});
  console.log("[OK] LibraryMember deleted");

  await prisma.book.deleteMany({});
  console.log("[OK] Book deleted");

  await prisma.bookCategory.deleteMany({});
  console.log("[OK] BookCategory deleted");

  await prisma.librarySetting.deleteMany({});
  console.log("[OK] LibrarySetting deleted");

  // Exam Module
  await prisma.invigilatorAssignment.deleteMany({});
  console.log("[OK] InvigilatorAssignment deleted");

  await prisma.questionPaper.deleteMany({});
  console.log("[OK] QuestionPaper deleted");

  await prisma.admitCard.deleteMany({});
  console.log("[OK] AdmitCard deleted");

  await prisma.seatingArrangement.deleteMany({});
  console.log("[OK] SeatingArrangement deleted");

  await prisma.examSchedule.deleteMany({});
  console.log("[OK] ExamSchedule deleted");

  await prisma.resultSummary.deleteMany({});
  console.log("[OK] ResultSummary deleted");

  await prisma.marksEntry.deleteMany({});
  console.log("[OK] MarksEntry deleted");

  await prisma.gradeSetting.deleteMany({});
  console.log("[OK] GradeSetting deleted");

  await prisma.examSubject.deleteMany({});
  console.log("[OK] ExamSubject deleted");

  await prisma.exam.deleteMany({});
  console.log("[OK] Exam deleted");

  await prisma.room.deleteMany({});
  console.log("[OK] Room deleted");

  // Fee Module
  await prisma.studentFeeDiscount.deleteMany({});
  console.log("[OK] StudentFeeDiscount deleted");

  await prisma.payment.deleteMany({});
  console.log("[OK] Payment deleted");

  await prisma.studentFee.deleteMany({});
  console.log("[OK] StudentFee deleted");

  await prisma.fineRule.deleteMany({});
  console.log("[OK] FineRule deleted");

  await prisma.feeDiscount.deleteMany({});
  console.log("[OK] FeeDiscount deleted");

  await prisma.feeStructureItem.deleteMany({});
  console.log("[OK] FeeStructureItem deleted");

  await prisma.feeStructure.deleteMany({});
  console.log("[OK] FeeStructure deleted");

  await prisma.feeHead.deleteMany({});
  console.log("[OK] FeeHead deleted");

  // Teacher Module
  await prisma.communication.deleteMany({});
  console.log("[OK] Communication deleted");

  await prisma.teacherDocument.deleteMany({});
  console.log("[OK] TeacherDocument deleted");

  await prisma.teacherPerformance.deleteMany({});
  console.log("[OK] TeacherPerformance deleted");

  await prisma.teacherSalary.deleteMany({});
  console.log("[OK] TeacherSalary deleted");

  await prisma.teacherLeave.deleteMany({});
  console.log("[OK] TeacherLeave deleted");

  await prisma.teacherSettings.deleteMany({});
  console.log("[OK] TeacherSettings deleted");

  // Timetable
  await prisma.timetable.deleteMany({});
  console.log("[OK] Timetable deleted");

  // Student Module
  await prisma.studentDocument.deleteMany({});
  console.log("[OK] StudentDocument deleted");

  await prisma.promotion.deleteMany({});
  console.log("[OK] Promotion deleted");

  await prisma.studentHistory.deleteMany({});
  console.log("[OK] StudentHistory deleted");

  await prisma.attendance.deleteMany({});
  console.log("[OK] Attendance deleted");

  // Enrollment
  await prisma.enrollment.deleteMany({});
  console.log("[OK] Enrollment deleted");

  // Students
  await prisma.student.deleteMany({});
  console.log("[OK] Student deleted");

  // Teacher Relations
  await prisma.teacherSubject.deleteMany({});
  console.log("[OK] TeacherSubject deleted");

  await prisma.teacherClass.deleteMany({});
  console.log("[OK] TeacherClass deleted");

  // Teachers
  await prisma.teacher.deleteMany({});
  console.log("[OK] Teacher deleted");

  // Core Academic
  await prisma.subject.deleteMany({});
  console.log("[OK] Subject deleted");

  await prisma.section.deleteMany({});
  console.log("[OK] Section deleted");

  await prisma.classAgeConfig.deleteMany({});
  console.log("[OK] ClassAgeConfig deleted");

  await prisma.admissionCounter.deleteMany({});
  console.log("[OK] AdmissionCounter deleted");

  await prisma.class.deleteMany({});
  console.log("[OK] Class deleted");

  await prisma.academicYear.deleteMany({});
  console.log("[OK] AcademicYear deleted");

  // Subscription
  await prisma.subscriptionPayment.deleteMany({});
  console.log("[OK] SubscriptionPayment deleted");

  await prisma.tenantSubscription.deleteMany({});
  console.log("[OK] TenantSubscription deleted");

  await prisma.freeTrialRecord.deleteMany({});
  console.log("[OK] FreeTrialRecord deleted");

  // Audit
  await prisma.auditLog.deleteMany({});
  console.log("[OK] AuditLog deleted");

  console.log("\n[DONE] Cleanup complete! SuperAdmin, Tenant, and User records preserved.");
}

cleanup()
  .catch((e) => {
    console.error("[ERROR] Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import express from "express";

// ENTERPRISE MODULES
import gatePassRoutes from "./modules/gate-pass/gatepass.routes";
import eventRoutes from "./modules/events/event.routes";
import helpdeskRoutes from "./modules/helpdesk/helpdesk.routes";
import workflowRoutes from "./modules/workflow/workflow.routes";
import approvalRoutes from "./modules/workflow/approval.routes";
import formBuilderRoutes from "./modules/form-builder/form-builder.routes";
import reportBuilderRoutes from "./modules/report-builder/report-builder.routes";
import auditRoutes from "./modules/audit/audit.routes";
import schedulerRoutes from "./modules/scheduler/scheduler.routes";
import dashboardBuilderRoutes from "./modules/dashboard-builder/dashboard-builder.routes";
import themeRoutes from "./modules/theme/theme.routes";
import qrRoutes from "./modules/qr-barcode/qr.routes";
import paymentGatewayRoutes from "./modules/payment-gateway/payment.routes";
import fileManagerRoutes from "./modules/file-manager/file-manager.routes";
import importExportRoutes from "./modules/import-export/import-export.routes";
import queueRoutes from "./modules/queue/queue.routes";
import masterRoutes from "./modules/masters/master.routes";

import compression from "compression";
import cors from "cors";
import { autoCacheMiddleware } from "./middleware/autoCache.middleware";
import { timingMiddleware } from "./middleware/timing.middleware";
import swaggerUi from "swagger-ui-express";
import path from "path";
import settingsRoutes from "./modules/settings/settings.routes";

import { securityHeaders, corsConfig } from "./middleware/security.middleware";
import { sanitizeInput } from "./middleware/sanitize.middleware";
import { swaggerSpec } from "./config/swagger";
import { requestLogger } from "./middleware/requestLogger.middleware";
import healthRoutes from "./routes/health.routes";
import { rateLimiter, authLimiter, uploadLimiter } from "./middleware/rateLimit";
import { subscriptionCheckMiddleware } from "./middleware/auth.middleware";
import { authMiddleware } from "./middleware/auth.middleware";
import { allowRoles } from "./middleware/role.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { moduleGate } from "./middleware/moduleGate.middleware";
import tenantModuleRoutes from "./modules/modules/tenant-modules.routes";
import { auditMiddleware } from "./middleware/auditMiddleware";
import { enforceTenantIsolation } from "./middleware/tenant.middleware";

//////////////////////////////////////////////////////
// ROUTES
//////////////////////////////////////////////////////

// CORE
import siteRoutes from "./routes/site.routes";
import authRoutes from "./modules/auth/auth.routes";
import tenantRoutes from "./modules/tenant/tenant.routes";
import academicRoutes from "./modules/academic/academic.routes";

// DASHBOARD
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

// ACADEMIC
import classRoutes from "./modules/class/class.routes";
import sectionRoutes from "./modules/Section/section.routes";
import studentRoutes from "./modules/students/student.routes";
import teacherRoutes from "./modules/teacher/teacher.routes";
import subjectRoutes from "./modules/subject/subject.routes";

// STUDENT MODULE - ENTERPRISE ENHANCED ROUTES
import studentDashboardRoutes from "./modules/students/student-dashboard.routes";
import studentSearchRoutes from "./modules/students/student-search.routes";
import studentCommunicationRoutes from "./modules/students/student-communication.routes";
import studentOperationsRoutes from "./modules/students/student-operations.routes";
import studentReportsRoutes from "./modules/students/student-reports.routes";

import attendanceRoutes from "./modules/attendance/attendance.routes";
import attendanceReportRoutes from "./modules/attendance/attendance-report.routes";
import timetableRoutes from "./modules/timetable/timetable.routes";

// TEACHER MODULE
import teacherDashboardRoutes from "./modules/teacher/dashboard.routes";
import teacherLeaveRoutes from "./modules/teacher/leave.routes";
import teacherSalaryRoutes from "./modules/teacher/salary.routes";
import teacherPerformanceRoutes from "./modules/teacher/performance.routes";
import teacherDocumentRoutes from "./modules/teacher/document.routes";
import communicationRoutes from "./modules/teacher/communication.routes";
import teacherReportRoutes from "./modules/teacher/report.routes";
import teacherSettingsRoutes from "./modules/teacher/settings.routes";

// ADMISSION
import admissionRoutes from "./modules/admission/admission.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";

// FEES
import feesRoutes from "./modules/fees/fees.routes";

// SUPER ADMIN
import superAdminRoutes from "./modules/super-admin/superAdmin.routes";
import superadminreportsRoutes from "./modules/super-admin/reports.routes";
import securityRoutes from "./modules/super-admin/security.routes";
import databaseRoutes from "./modules/super-admin/database.routes";
import monitoringRoutes from "./modules/super-admin/monitoring.routes";
import moduleManagementRoutes from "./modules/super-admin/module-management.routes";
import pluginManagementRoutes from "./modules/super-admin/plugin-management.routes";
import themeManagementRoutes from "./modules/super-admin/theme-management.routes";
import systemSettingsRoutes from "./modules/super-admin/system-settings.routes";
import auditCenterRoutes from "./modules/super-admin/audit-center.routes";
import notificationCenterRoutes from "./modules/super-admin/notification-center.routes";
import reportCenterRoutes from "./modules/super-admin/report-center.routes";
import supportCenterRoutes from "./modules/super-admin/support-center.routes";
import subscriptionMgmtRoutes from "./modules/super-admin/subscription-management.routes";
import userManagementRoutes from "./modules/super-admin/user-management.routes";
import iamRoutes from "./modules/super-admin/iam.routes";

// SUBSCRIPTIONS
import subscriptionRoutes from "./modules/subscription/subscription.routes";
import subscriptionPaymentRoutes from "./modules/subscription-payment/subscriptionPayment.routes";

// EXAM MODULE
import examRoutes from "./modules/exam/exam.routes";
import gradeRoutes from "./modules/grade/grade.routes";
import roomRoutes from "./modules/room/room.routes";

import libraryRoutes from "./modules/libraryManagement/library.routes";
import transportRoutes from "./modules/transport/transport.routes";
import studentPortalRoutes from "./modules/student-portal/studentPortal.routes";
import signatureRoutes from "./modules/signature/signature.routes";
import backupRoutes from "./modules/backup/backup.routes";
import permissionsRoutes from "./modules/permissions/permissions.routes";
import aiAssistantRoutes from "./modules/ai-assistant/ai.routes";
import hostelRoutes from "./modules/hostel/hostel.routes";
import communicationNewRoutes from "./modules/communication/communication.routes";
import hrRoutes from "./modules/hr/hr.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import certificateRoutes from "./modules/certificate/certificate.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import reportRoutes from "./modules/reports/report.routes";
import parentRoutes from "./modules/parent/parent.routes";

const app = express();

//////////////////////////////////////////////////////
// ⚡ P6: REQUEST TIMING (must be first — measures total response time)
//////////////////////////////////////////////////////
app.use(timingMiddleware);

//////////////////////////////////////////////////////
// GZIP COMPRESSION
//////////////////////////////////////////////////////
app.use(compression());

//////////////////////////////////////////////////////
// CORS
//////////////////////////////////////////////////////
app.use(corsConfig);

//////////////////////////////////////////////////////
// BODY PARSER
//////////////////////////////////////////////////////
app.use(express.json({ limit: "1mb" }));

//////////////////////////////////////////////////////
// SECURITY HEADERS
//////////////////////////////////////////////////////
app.use(securityHeaders);

//////////////////////////////////////////////////////
// INPUT SANITIZATION
//////////////////////////////////////////////////////
app.use(sanitizeInput);

//////////////////////////////////////////////////////
// RATE LIMITER
//////////////////////////////////////////////////////
app.use(rateLimiter);

//////////////////////////////////////////////////////
// FILE UPLOAD RATE LIMITER
//////////////////////////////////////////////////////
app.use(uploadLimiter);

//////////////////////////////////////////////////////
// REQUEST LOGGER
//////////////////////////////////////////////////////
app.use(requestLogger);

//////////////////////////////////////////////////////
// STATIC FILES
//////////////////////////////////////////////////////
app.use(
  "/uploads",
  authMiddleware,
  express.static(path.join(__dirname, "../uploads"))
);

//////////////////////////////////////////////////////
// ROUTES THAT SKIP SUBSCRIPTION CHECK
//////////////////////////////////////////////////////
app.use("/api", healthRoutes);
app.use("/api", siteRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/super-admin", authMiddleware, allowRoles("SUPER_ADMIN"), superAdminRoutes);
app.use("/api/reports", authMiddleware, allowRoles("SUPER_ADMIN"), superadminreportsRoutes);
app.use("/api/super-admin/system-settings", authMiddleware, allowRoles("SUPER_ADMIN"), systemSettingsRoutes);
app.use("/api/security", authMiddleware, allowRoles("SUPER_ADMIN"), securityRoutes);
app.use("/api/database", authMiddleware, allowRoles("SUPER_ADMIN"), databaseRoutes);
app.use("/api/monitoring", authMiddleware, allowRoles("SUPER_ADMIN"), monitoringRoutes);
app.use("/api/super-admin/modules", authMiddleware, allowRoles("SUPER_ADMIN"), moduleManagementRoutes);
app.use("/api/super-admin/plugins", authMiddleware, allowRoles("SUPER_ADMIN"), pluginManagementRoutes);
app.use("/api/super-admin/themes", authMiddleware, allowRoles("SUPER_ADMIN"), themeManagementRoutes);
app.use("/api/super-admin/audit-center", authMiddleware, allowRoles("SUPER_ADMIN"), auditCenterRoutes);
app.use("/api/super-admin/notification-center", authMiddleware, allowRoles("SUPER_ADMIN"), notificationCenterRoutes);
app.use("/api/super-admin/report-center", authMiddleware, allowRoles("SUPER_ADMIN"), reportCenterRoutes);
app.use("/api/super-admin/support-center", authMiddleware, allowRoles("SUPER_ADMIN"), supportCenterRoutes);
app.use("/api/super-admin/subscription-management", authMiddleware, allowRoles("SUPER_ADMIN"), subscriptionMgmtRoutes);
app.use("/api/super-admin/user-management", authMiddleware, allowRoles("SUPER_ADMIN"), userManagementRoutes);
app.use("/api/super-admin/iam", authMiddleware, allowRoles("SUPER_ADMIN"), iamRoutes);
app.use("/api/subscriptions", authMiddleware, subscriptionRoutes);
app.use("/api/subscription-payments", authMiddleware, subscriptionPaymentRoutes);
app.use("/api/modules", tenantModuleRoutes);

//////////////////////////////////////////////////////
// SUBSCRIPTION CHECK
//////////////////////////////////////////////////////
app.use(subscriptionCheckMiddleware);

//////////////////////////////////////////////////////
// AUDIT LOGGING (after auth + subscription — captures all write ops)
//////////////////////////////////////////////////////
app.use(auditMiddleware);

//////////////////////////////////////////////////////
// TENANT ISOLATION (prevents cross-tenant data access)
//////////////////////////////////////////////////////
app.use(enforceTenantIsolation);

//////////////////////////////////////////////////////
// AUTO-CACHE
//////////////////////////////////////////////////////
app.use(autoCacheMiddleware);

//////////////////////////////////////////////////////
// DASHBOARD
//////////////////////////////////////////////////////
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "TENANT_ADMIN"), settingsRoutes);

//////////////////////////////////////////////////////
// ACADEMIC
//////////////////////////////////////////////////////
app.use("/api/academic", academicRoutes);
app.use("/api/class", classRoutes);
app.use("/api/section", sectionRoutes);
// Register under both singular and plural — different frontend pages use
// "/api/subject" (teachers, masters) and "/api/subjects" (SubjectsPage, timetable, exams).
app.use("/api/subject", subjectRoutes);
app.use("/api/subjects", subjectRoutes);

//////////////////////////////////////////////////////
// STUDENTS
// IMPORTANT: Enterprise student routes MUST be mounted before the CRUD
// router because student.routes.ts ends with /:id, which otherwise captures
// /full and returns the student-by-id response instead of dashboard data.
//////////////////////////////////////////////////////
app.use("/api/students", moduleGate("students"), studentDashboardRoutes);
app.use("/api/students", moduleGate("students"), studentSearchRoutes);
app.use("/api/students", moduleGate("students"), studentCommunicationRoutes);
app.use("/api/students", moduleGate("students"), studentOperationsRoutes);
app.use("/api/students", moduleGate("students"), studentReportsRoutes);
app.use("/api/students", moduleGate("students"), studentRoutes);

//////////////////////////////////////////////////////
// TEACHERS
//////////////////////////////////////////////////////
app.use("/api/teacher", moduleGate("teachers"), teacherRoutes);
app.use("/api/teacher", moduleGate("teachers"), teacherDashboardRoutes);
app.use("/api/teacher", moduleGate("teachers"), teacherLeaveRoutes);
app.use("/api/teacher", moduleGate("teachers"), teacherSalaryRoutes);
app.use("/api/teacher", moduleGate("teachers"), teacherPerformanceRoutes);
app.use("/api/teacher", moduleGate("teachers"), teacherDocumentRoutes);
app.use("/api/teacher", moduleGate("teachers"), communicationRoutes);
app.use("/api/teacher", moduleGate("teachers"), teacherReportRoutes);
app.use("/api/teacher", moduleGate("teachers"), teacherSettingsRoutes);

//////////////////////////////////////////////////////
// ATTENDANCE
//////////////////////////////////////////////////////
app.use("/api/attendance", moduleGate("attendance"), attendanceRoutes);
app.use("/api/attendance", moduleGate("attendance"), attendanceReportRoutes);

//////////////////////////////////////////////////////
// TIMETABLE
//////////////////////////////////////////////////////
app.use("/api/timetable", moduleGate("timetable"), timetableRoutes);

//////////////////////////////////////////////////////
// ADMISSION
//////////////////////////////////////////////////////
app.use("/api/admission", moduleGate("students"), admissionRoutes);
app.use("/api/enrollment", moduleGate("students"), enrollmentRoutes);

//////////////////////////////////////////////////////
// FEES
//////////////////////////////////////////////////////
app.use("/api/fees", moduleGate("fees"), feesRoutes);

//////////////////////////////////////////////////////
// EXAMS
//////////////////////////////////////////////////////
app.use("/api/exam", moduleGate("exams"), examRoutes);
app.use("/api/grade", moduleGate("exams"), gradeRoutes);
app.use("/api/room", moduleGate("exams"), roomRoutes);

//////////////////////////////////////////////////////
// LIBRARY
//////////////////////////////////////////////////////
app.use("/api/library", moduleGate("library"), libraryRoutes);

//////////////////////////////////////////////////////
// TRANSPORT
//////////////////////////////////////////////////////
app.use("/api/transport", moduleGate("transport"), transportRoutes);

//////////////////////////////////////////////////////
// STUDENT PORTAL
//////////////////////////////////////////////////////
app.use("/api/student-portal", studentPortalRoutes);

//////////////////////////////////////////////////////
// PARENT PORTAL
//////////////////////////////////////////////////////
app.use("/api/parent", authMiddleware, parentRoutes);

//////////////////////////////////////////////////////
// SIGNATURE
//////////////////////////////////////////////////////
app.use("/api/signature", signatureRoutes);

//////////////////////////////////////////////////////
// BACKUP
//////////////////////////////////////////////////////
app.use("/api/backup", backupRoutes);

//////////////////////////////////////////////////////
// PERMISSIONS
//////////////////////////////////////////////////////
app.use("/api/permissions", permissionsRoutes);

//////////////////////////////////////////////////////
// AI ASSISTANT
//////////////////////////////////////////////////////
app.use("/api/ai", aiAssistantRoutes);

//////////////////////////////////////////////////////
// MASTERS
//////////////////////////////////////////////////////
app.use("/api/masters", masterRoutes);

//////////////////////////////////////////////////////
// ENTERPRISE MODULES
//////////////////////////////////////////////////////
app.use("/api/hostel", moduleGate("hostel"), hostelRoutes);
app.use("/api/communication", moduleGate("communication"), communicationNewRoutes);
app.use("/api/hr", moduleGate("hr"), hrRoutes);
app.use("/api/inventory", moduleGate("inventory"), inventoryRoutes);
app.use("/api/certificate", moduleGate("certificates"), certificateRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/gate-pass", moduleGate("gate-pass"), gatePassRoutes);
app.use("/api/events", moduleGate("events"), eventRoutes);

app.use("/api/workflow", moduleGate("workflow"), workflowRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/form-builder", moduleGate("form-builder"), formBuilderRoutes);
app.use("/api/report-builder", moduleGate("report-builder"), reportBuilderRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/scheduler", moduleGate("scheduler"), schedulerRoutes);
app.use("/api/dashboard-builder", moduleGate("dashboard-builder"), dashboardBuilderRoutes);
app.use("/api/theme", themeRoutes);
app.use("/api/qr", moduleGate("id-cards"), qrRoutes);
app.use("/api/payment-gateway", moduleGate("fees"), paymentGatewayRoutes);
app.use("/api/file-manager", moduleGate("file-manager"), fileManagerRoutes);
app.use("/api/import-export", moduleGate("import-export"), importExportRoutes);
app.use("/api/queue", queueRoutes);

//////////////////////////////////////////////////////
// SWAGGER
//////////////////////////////////////////////////////
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//////////////////////////////////////////////////////
// ERROR HANDLING
//////////////////////////////////////////////////////
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

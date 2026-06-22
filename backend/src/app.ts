
import express from "express";

import compression from "compression";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import path from "path";
// Other route imports ke saath:
import settingsRoutes from "./modules/settings/settings.routes";

import { securityHeaders, corsConfig } from "./middleware/security.middleware";
import { sanitizeInput } from "./middleware/sanitize.middleware";
import { swaggerSpec } from "./config/swagger";
import { rateLimiter } from "./middleware/rateLimit";
import { authLimiter } from "./middleware/rateLimit";
import { subscriptionCheckMiddleware } from "./middleware/auth.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

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

// SUBSCRIPTIONS
import subscriptionRoutes from "./modules/subscription/subscription.routes";
import subscriptionPaymentRoutes from "./modules/subscription-payment/subscriptionPayment.routes";

// EXAM MODULE
import examRoutes from "./modules/exam/exam.routes";
import gradeRoutes from "./modules/grade/grade.routes";
import roomRoutes from "./modules/room/room.routes";

// libraray
// app.ts mein — routes register karo
import libraryRoutes from "./modules/libraryManagement/library.routes";
///transport
// Import (top of file, with other imports)
import transportRoutes from "./modules/transport/transport.routes";

// SIGNATURE
import signatureRoutes from "./modules/signature/signature.routes";

// BACKUP
import backupRoutes from "./modules/backup/backup.routes";




const app = express();

//////////////////////////////////////////////////////
// GZIP COMPRESSION (reduces API response size by 60-80%)
//////////////////////////////////////////////////////

app.use(compression());

//////////////////////////////////////////////////////
// CORS
//////////////////////////////////////////////////////

app.use(corsConfig);

//////////////////////////////////////////////////////
// BODY PARSER
//////////////////////////////////////////////////////

app.use(express.json());

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
// STATIC FILES
//////////////////////////////////////////////////////

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

//////////////////////////////////////////////////////
// 🔓 ROUTES THAT SKIP SUBSCRIPTION CHECK
// (Auth, Subscriptions, Payments, Settings, SuperAdmin)
//////////////////////////////////////////////////////

app.use("/api", siteRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/reports", superadminreportsRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/subscription-payments", subscriptionPaymentRoutes);

//////////////////////////////////////////////////////
// 🔥 SUBSCRIPTION CHECK MIDDLEWARE
// All routes BELOW this will be blocked if expired
//////////////////////////////////////////////////////

app.use(subscriptionCheckMiddleware);

//////////////////////////////////////////////////////
// DASHBOARD
//////////////////////////////////////////////////////

app.use("/api/dashboard", dashboardRoutes);
// Other app.use ke saath:
app.use("/api/settings", settingsRoutes);
//////////////////////////////////////////////////////
// ACADEMIC FLOW
//////////////////////////////////////////////////////

app.use("/api/academic", academicRoutes);
app.use("/api/class", classRoutes);
app.use("/api/section", sectionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance/report", attendanceReportRoutes);

//////////////////////////////////////////////////////
// TEACHER MODULE (Extended)
//////////////////////////////////////////////////////

app.use("/api/teacher-dashboard", teacherDashboardRoutes);
app.use("/api/teacher-leave", teacherLeaveRoutes);
app.use("/api/teacher-salary", teacherSalaryRoutes);
app.use("/api/teacher-performance", teacherPerformanceRoutes);
app.use("/api/teacher-document", teacherDocumentRoutes);
app.use("/api/communication", communicationRoutes);
app.use("/api/teacher-report", teacherReportRoutes);
app.use("/api/teacher-settings", teacherSettingsRoutes);

//////////////////////////////////////////////////////
// TIMETABLE
//////////////////////////////////////////////////////

app.use("/api/timetable", timetableRoutes);
//////////////////
// library management
/////////////////////////

// Route registration (subscription check ke NEECHE)
app.use("/api/transport", transportRoutes);
app.use("/api/library", libraryRoutes);
//////////////////////////////////////////////////////
// ADMISSION FLOW
//////////////////////////////////////////////////////

app.use("/api/admission", admissionRoutes);
app.use("/api/enrollment", enrollmentRoutes);

//////////////////////////////////////////////////////
// FEES MODULE
//////////////////////////////////////////////////////

app.use("/api/fees", feesRoutes);


//////////////////////////////////////////////////////
// EXAM MODULE
//////////////////////////////////////////////////////

app.use("/api/exam", examRoutes);
app.use("/api/grade", gradeRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/signature", signatureRoutes);
app.use("/api/backup", backupRoutes);

//////////////////////////////////////////////////////
// SWAGGER DOCS
//////////////////////////////////////////////////////

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//////////////////////////////////////////////////////
// ERROR HANDLING
//////////////////////////////////////////////////////

app.use(notFoundHandler);
app.use(errorHandler);

export default app;


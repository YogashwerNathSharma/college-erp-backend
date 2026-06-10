import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import path from "path";

import { swaggerSpec } from "./config/swagger";
import { rateLimiter } from "./middleware/rateLimit";

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


// ADMISSION
import admissionRoutes from "./modules/admission/admission.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";

// FEES
// ✅ KEEP only this:
import feesRoutes from "./modules/fees/fees.routes";


// SUPER ADMIN
import superAdminRoutes from "./modules/super-admin/superAdmin.routes";
import superadminreportsRoutes from "./modules/super-admin/reports.routes";
//import settingsRoutes from "./modules/super-admin/settings.routes";


// SUBSCRIPTIONS
import subscriptionRoutes from "./modules/subscription/subscription.routes";
import subscriptionPaymentRoutes from "./modules/subscription-payment/subscriptionPayment.routes";

//exam module 
import examRoutes from "./modules/exam/exam.routes";
import gradeRoutes from "./modules/grade/grade.routes";




const app = express();

//////////////////////////////////////////////////////
// CORS
//////////////////////////////////////////////////////

app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

//////////////////////////////////////////////////////
// BODY PARSER
//////////////////////////////////////////////////////

app.use(express.json());

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
// CORE ROUTES
//////////////////////////////////////////////////////

app.use("/api", siteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/academic", academicRoutes);

//////////////////////////////////////////////////////
// DASHBOARD
//////////////////////////////////////////////////////

app.use("/api/dashboard", dashboardRoutes);

//////////////////////////////////////////////////////
// ACADEMIC FLOW
//////////////////////////////////////////////////////

app.use("/api/class", classRoutes);
app.use("/api/section", sectionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance/report", attendanceReportRoutes);
app.use("/api/exam", examRoutes);

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
// SUPER ADMIN
//////////////////////////////////////////////////////

app.use("/api/reports", superadminreportsRoutes);
app.use("/api/super-admin", superAdminRoutes);
//app.use("/api/settings", settingsRoutes);

//////////////////////////////////////////////////////
// SUBSCRIPTIONS
//////////////////////////////////////////////////////

app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/subscription-payments", subscriptionPaymentRoutes);
///////////////////////////////
/////time table 
////////////////////////
app.use("/api/timetable", timetableRoutes);

//////////////////
//exam module
/////////////////////////
app.use("/api/exam", examRoutes);
app.use("/api/grade", gradeRoutes);
//////////////////////////////////////////////////////
// SWAGGER DOCS
//////////////////////////////////////////////////////

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
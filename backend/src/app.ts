import express from "express";
import cors from "cors";
import prisma from "./utils/prisma";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import siteRoutes from "./routes/site.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import path from "path"; // 🔥 ADD THIS

// 🔹 MODULE ROUTES
import authRoutes from "./modules/auth/auth.routes";
import superAdminRoutes from "./modules/super-admin/superAdmin.routes";
import studentRoutes from "./modules/students/student.routes";
import teacherRoutes from "./modules/teacher/teacher.routes";
import subjectRoutes from "./modules/subject/subject.routes";
import classRoutes from "./modules/class/class.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import tenantRoutes from "./modules/tenant/tenant.routes";
import academicRoutes from "./modules/academic/academic.routes";
import examRoutes from "./modules/exam/exam.routes";
import timetableRoutes from "./modules/timetable/timetable.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";
import admissionRoutes from "./modules/admission/admission.routes";
import promotionRoutes from "./modules/students/submodules/promotion/promotion.routes";
import sectionRoutes from "./modules/Section/section.routes";

// 🔹 FEES MODULE
import feeStructureRoutes from "./modules/fees/feeStructure/feeStructure.routes";
import paymentRoutes from "./modules/fees/payment/payment.routes";
import studentFeeRoutes from "./modules/fees/studentFee/studentFee.routes";
import defaulterRoutes from "./modules/fees/defaulters/defaulters.routes";
import feesRoutes from "./modules/fees/fees.routes";

import reportsRoutes from "./modules/fees/reports/reports.routes";

// 🔹 MIDDLEWARE
import { rateLimiter } from "./middleware/rateLimit";

const app = express();

//////////////////////////////////////////////////////
// 🔥 CORS (improved)
//////////////////////////////////////////////////////
app.use(cors({
  origin: "http://localhost:5174",
  credentials: true
}));

app.use(express.json());

//////////////////////////////////////////////////////
// 🔥 STATIC FILES (IMPORTANT FIX FOR LOGO)
//////////////////////////////////////////////////////
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

//////////////////////////////
// 🔐 CORE MODULES
//////////////////////////////
app.use("/api/auth", authRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api", siteRoutes);

//////////////////////////////
// 🎓 ACADEMIC FLOW
//////////////////////////////
app.use("/api/class", classRoutes);
app.use("/api/section", sectionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/exam", examRoutes);

//////////////////////////////
// 🧾 ADMISSION FLOW
//////////////////////////////
app.use("/api/admission", admissionRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api/dashboard", dashboardRoutes);

//////////////////////////////
// 💰 FEES MODULE
//////////////////////////////
app.use("/api/reports", reportsRoutes);

app.use("/api/fees/fee-structure", feeStructureRoutes);
app.use("/api/fees/student-fee", studentFeeRoutes);
app.use("/api/fees/payment", paymentRoutes);
app.use("/api/fees/defaulters", defaulterRoutes);

app.use("/api/fees", feesRoutes);

//////////////////////////////
// ⚡ GLOBAL MIDDLEWARE
//////////////////////////////
app.use(rateLimiter);

//////////////////////////////
// SUPER ADMIN
//////////////////////////////
app.use("/api/super-admin", superAdminRoutes);

//////////////////////////////
// 📄 DOCS
//////////////////////////////
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
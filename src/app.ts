import express from "express";
import prisma from "./utils/prisma";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// 🔹 MODULE ROUTES
import authRoutes from "./modules/auth/auth.routes";
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
///pdf,excel
import reportsRoutes from "./modules/fees/reports/reports.routes";
// 🔹 MIDDLEWARE
import { rateLimiter } from "./middleware/rateLimit";

const app = express();

app.use(express.json());

//////////////////////////////
// TEMP TENANT
//////////////////////////////
/*app.post("/create-tenant", async (req, res) => {
  const tenant = await prisma.tenant.create({
    data: {
      name: "My College",
      type: "SCHOOL",
    },
  });

  res.json(tenant);
});*/

//////////////////////////////
// 🔐 CORE MODULES
//////////////////////////////
app.use("/api/auth", authRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/academic", academicRoutes);

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

//////////////////////////////
// 💰 FEES MODULE (IMPORTANT ORDER)
//////////////////////////////
//// pdf execel
///////////////////////////////
app.use("/api/reports", reportsRoutes);
// 🔥 specific routes first
app.use("/api/fees/fee-structure", feeStructureRoutes);
app.use("/api/fees/student-fee", studentFeeRoutes);
app.use("/api/fees/payment", paymentRoutes);
app.use("/api/fees/defaulters", defaulterRoutes);
//app.use("/api/fees/reports", reportRoutes);

// ❗ generic LAST
app.use("/api/fees", feesRoutes);
app.use("/uploads", express.static("uploads"));
//////////////////////////////
// ⚡ GLOBAL MIDDLEWARE
//////////////////////////////
app.use(rateLimiter);

//////////////////////////////
// 📄 DOCS
//////////////////////////////
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
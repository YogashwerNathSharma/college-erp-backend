import { Router } from "express";
import { getStudentTimeline } from "./student.controller";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  restoreStudent,
} from "./student.controller";
import { getDeletedStudents } from "./student.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createStudentSchema,
  updateStudentSchema,
} from "./student.validation";
import { getCurrent } from "./submodules/currentStatus/currentStatus.controller";
import { resolveTenant } from "../../middleware/tenant.middleware"; // 🔥 ADD

const router = Router();

/////////////////////////
// CURRENT STATUS
/////////////////////////
router.get(
  "/:studentId/current",
  authMiddleware,
  resolveTenant, // 🔥 FIX
  getCurrent
);

/////////////////////////
// RESTORE STUDENT
/////////////////////////
router.patch(
  "/:id/restore",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant, // 🔥 FIX
  restoreStudent
);

/////////////////////////
// TEST
/////////////////////////
router.get("/test", (req, res) => {
  res.send("student route working");
});

/////////////////////////
// CREATE STUDENT
/////////////////////////
router.post(
  "/",
  authMiddleware,
  allowRoles("ADMIN", "STAFF"),
  resolveTenant, // 🔥 FIX
  validate(createStudentSchema),
  createStudent
);

/////////////////////////
// GET ALL STUDENTS
/////////////////////////
router.get(
  "/",
  authMiddleware,
  resolveTenant, // 🔥 FIX
  getStudents
);

/////////////////////////
// GET DELETED STUDENTS
/////////////////////////
router.get(
  "/deleted",
  authMiddleware,
  resolveTenant, // 🔥 FIX
  getDeletedStudents
);

/////////////////////////
// STUDENT TIMELINE
/////////////////////////
router.get(
  "/:id/timeline",
  authMiddleware,
  resolveTenant, // 🔥 FIX
  getStudentTimeline
);

/////////////////////////
// GET SINGLE STUDENT
/////////////////////////
router.get(
  "/:id",
  authMiddleware,
  resolveTenant, // 🔥 FIX
  getStudentById
);

/////////////////////////
// UPDATE STUDENT
/////////////////////////
router.put(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN", "STAFF"),
  resolveTenant, // 🔥 FIX
  validate(updateStudentSchema),
  updateStudent
);

/////////////////////////
// DELETE STUDENT
/////////////////////////
router.delete(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  resolveTenant, // 🔥 FIX
  deleteStudent
);

export default router;
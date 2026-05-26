import { Router } from "express";
import { getStudentTimeline } from "./student.controller";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  restoreStudent, // 🔥 ADD
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


const router = Router();
router.get(
  "/:studentId/current",
  authMiddleware,
  getCurrent
);

router.patch(
  "/:id/restore",
  authMiddleware,
  allowRoles("ADMIN"),
  restoreStudent
);
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
  validate(createStudentSchema),
  createStudent
);

/////////////////////////
// GET ALL STUDENTS
/////////////////////////
router.get("/", authMiddleware, getStudents);

/////////////////////////
// GET SINGLE STUDENT
/////////////////////////
router.get("/deleted", authMiddleware, getDeletedStudents); // 🔥 FIRST

router.get("/:id/timeline", authMiddleware, getStudentTimeline); // 🔥 ADD THIS

router.get("/:id", authMiddleware, getStudentById); // 🔥 LAST
/////////////////////////
// UPDATE STUDENT
/////////////////////////
router.put(
  "/:id",
  authMiddleware,
  allowRoles("ADMIN", "STAFF"),
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
  deleteStudent
);

export default router;
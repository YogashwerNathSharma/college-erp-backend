import express from "express";
import {
  createExam,
  addExamSubject,
  enterMarks,
  getResult,
} from "./exam.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, createExam);
router.post("/subject", authMiddleware, addExamSubject);
router.post("/marks", authMiddleware, enterMarks);
router.get("/result", authMiddleware, getResult);

export default router;
import express from "express";
import {
  createTimetable,
  getTimetable,
} from "./timetable.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, createTimetable);
router.get("/", authMiddleware, getTimetable);

export default router;
import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { createEnrollment, getEnrollments } from "./enrollment.controller";

const router = express.Router();

router.post("/", authMiddleware, createEnrollment);
router.get("/", authMiddleware, getEnrollments);

export default router;
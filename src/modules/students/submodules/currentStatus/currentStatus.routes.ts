import express from "express";
import { getCurrent } from "./currentStatus.controller";
import { authMiddleware } from "../../../../middleware/auth.middleware";

const router = express.Router();

router.get("/:studentId/current", authMiddleware, getCurrent);

export default router;
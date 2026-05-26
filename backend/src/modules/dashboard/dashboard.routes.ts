import express from "express";
import { getDashboard } from "./dashboard.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authMiddleware, getDashboard);

export default router;
import express from "express";
import { create, getAll } from "./teacher.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, create);
router.get("/", authMiddleware, getAll);

export default router;
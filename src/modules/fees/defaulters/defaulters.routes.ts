import express from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { getDefaultersController } from "./defaulters.controller";

const router = express.Router();

router.get("/", authMiddleware, getDefaultersController);

export default router;
import express from "express";
import { promote } from "./promotion.controller";
import { authMiddleware } from "../../../../middleware/auth.middleware";

const router = express.Router();

router.post("/promote", authMiddleware, promote);

export default router;
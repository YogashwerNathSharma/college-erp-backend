import { Router } from "express";
import { getAll, getOne, create } from "./tenant.controller";
import { upload } from "../../middleware/upload.middleware";

const router = Router();

// ✅ Tenant create with logo + background
router.post(
  "/create",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  create   // ✅ YE MISSING THA
);

router.get("/", getAll);
router.get("/:id", getOne);

export default router;
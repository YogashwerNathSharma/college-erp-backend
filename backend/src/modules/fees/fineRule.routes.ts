
import { Router } from "express";
import { fineRuleController } from "./fineRule.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", fineRuleController.getAll);
router.get("/:id", fineRuleController.getById);
router.post("/", fineRuleController.create);
router.put("/:id", fineRuleController.update);
router.delete("/:id", fineRuleController.delete);

export default router;

import { Router } from "express";
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  renderTemplate,
} from "../controllers/template.controller";

const router = Router();

router.get("/", getTemplates);
router.get("/:id", getTemplate);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);
router.post("/:id/duplicate", duplicateTemplate);
router.post("/:id/render", renderTemplate);

export default router;

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { uploadDocument } from "../../utils/upload";
import { importRealRmsExcel } from "./real-excel-import.service";

const router = Router();
router.use(authMiddleware, resolveTenant);

router.post("/import", allowRoles("ADMIN"), (req: any, res: any) => {
  uploadDocument(req, res, async (err: any) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No Excel file uploaded" });

    try {
      const { academicYearId } = req.body;
      if (!academicYearId) return res.status(400).json({ success: false, message: "academicYearId is required" });
      const result = await importRealRmsExcel(req.tenantId, req.file.path, academicYearId, req.user.userId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error?.message || "Real Excel import failed" });
    }
  });
});

export default router;

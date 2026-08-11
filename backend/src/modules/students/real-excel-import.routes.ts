import { Router } from "express";
import fs from "fs";
import os from "os";
import { authMiddleware } from "../../middleware/auth.middleware";
import { resolveTenant } from "../../middleware/tenant.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import { uploadDocument } from "../../utils/upload";
import { importRealRmsExcel } from "./real-excel-import.service";

const router = Router();
router.use(authMiddleware, resolveTenant);

router.post("/import", allowRoles("ADMIN", "SUPER_ADMIN", "TENANT_ADMIN"), (req: any, res: any) => {
  uploadDocument(req, res, async (err: any) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No Excel file uploaded" });

    try {
      const { academicYearId } = req.body;
      if (!academicYearId) return res.status(400).json({ success: false, message: "academicYearId is required" });

      // Pass buffer directly if available (more reliable on cloud)
      let fileInput: string | Buffer;
      if (req.file.buffer) {
        fileInput = req.file.buffer;
      } else if (req.file.path && fs.existsSync(req.file.path)) {
        fileInput = req.file.path;
      } else {
        return res.status(400).json({ success: false, message: "File upload failed: no buffer or valid path" });
      }

      const result = await importRealRmsExcel(req.tenantId, fileInput, academicYearId, req.user.userId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error?.message || "Real Excel import failed" });
    }
  });
});

export default router;

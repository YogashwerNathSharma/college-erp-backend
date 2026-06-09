
import feeStructureService from "./feeStructure.service";

const getAll = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const filters = {
      academicYearId: req.query.academicYearId as string | undefined,
      classId: req.query.classId as string | undefined,
    };

    const feeStructures = await feeStructureService.getAll(tenantId, filters);
    return res.status(200).json({ success: true, data: feeStructures });
  } catch (error: any) {
    console.error("Error fetching fee structures:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const getById = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const feeStructure = await feeStructureService.getById(id, tenantId);

    if (!feeStructure) {
      return res.status(404).json({ success: false, message: "Fee structure not found" });
    }

    return res.status(200).json({ success: true, data: feeStructure });
  } catch (error: any) {
    console.error("Error fetching fee structure:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const getByClass = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { classId } = req.params;
    const academicYearId = req.query.academicYearId as string;

    if (!academicYearId) {
      return res.status(400).json({ success: false, message: "academicYearId query parameter is required" });
    }

    const feeStructure = await feeStructureService.getByClass(classId, academicYearId, tenantId);

    if (!feeStructure) {
      return res.status(404).json({ success: false, message: "Fee structure not found for this class and academic year" });
    }

    return res.status(200).json({ success: true, data: feeStructure });
  } catch (error: any) {
    console.error("Error fetching fee structure by class:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const create = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, classId, academicYearId, installmentType, totalInstallments, dueDay, items } = req.body;

    if (!name || !classId || !academicYearId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "name, classId, academicYearId, and items are required",
      });
    }

    const feeStructure = await feeStructureService.create({
      tenantId,
      name,
      classId,
      academicYearId,
      installmentType,
      totalInstallments,
      dueDay,
      items,
    });

    return res.status(201).json({ success: true, data: feeStructure });
  } catch (error: any) {
    console.error("Error creating fee structure:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A fee structure already exists for this class and academic year",
      });
    }

    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const update = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const { name, classId, academicYearId, installmentType, totalInstallments, dueDay, isActive, items } = req.body;

    const feeStructure = await feeStructureService.update(
      id,
      { name, classId, academicYearId, installmentType, totalInstallments, dueDay, isActive, items },
      tenantId
    );

    return res.status(200).json({ success: true, data: feeStructure });
  } catch (error: any) {
    console.error("Error updating fee structure:", error);

    if (error.message === "Fee structure not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A fee structure already exists for this class and academic year",
      });
    }

    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

const softDelete = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    await feeStructureService.softDelete(id, tenantId);

    return res.status(200).json({ success: true, message: "Fee structure deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting fee structure:", error);

    if (error.message === "Fee structure not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export default {
  getAll,
  getById,
  getByClass,
  create,
  update,
  softDelete,
};


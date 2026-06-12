

import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} from "./teacher.service";

//////////////////////////////////////////////////////
// MULTER CONFIG (photo upload)
//////////////////////////////////////////////////////
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads/teachers"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `teacher-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, png, webp) are allowed"));
    }
  },
});

//////////////////////////////////////////////////////
// ✅ CREATE
//////////////////////////////////////////////////////
export const create = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Handle photo URL
    const data = { ...req.body };
    if (req.file) {
      data.photoUrl = `/uploads/teachers/${req.file.filename}`;
    }

    // Parse array fields from FormData
    if (typeof data["subjectIds[]"] === "string") {
      data.subjectIds = [data["subjectIds[]"]];
    } else if (Array.isArray(data["subjectIds[]"])) {
      data.subjectIds = data["subjectIds[]"];
    }

    if (typeof data["classIds[]"] === "string") {
      data.classIds = [data["classIds[]"]];
    } else if (Array.isArray(data["classIds[]"])) {
      data.classIds = data["classIds[]"];
    }

    const teacher = await createTeacher(data, tenantId);

    return res.status(201).json({
      success: true,
      data: teacher,
    });
  } catch (e: any) {
    console.error("CREATE TEACHER ERROR:", e);

    return res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};

//////////////////////////////////////////////////////
// ✅ GET ALL
//////////////////////////////////////////////////////
export const getAll = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await getTeachers(req.query, tenantId);

    return res.json({
      success: true,
      data,
    });
  } catch (e: any) {
    console.error("GET TEACHERS ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

//////////////////////////////////////////////////////
// ✅ GET BY ID
//////////////////////////////////////////////////////
export const getById = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const teacher = await getTeacherById(id, tenantId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.json({
      success: true,
      data: teacher,
    });
  } catch (e: any) {
    console.error("GET TEACHER BY ID ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

//////////////////////////////////////////////////////
// ✅ UPDATE
//////////////////////////////////////////////////////
export const update = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Handle photo URL
    const data = { ...req.body };
    if (req.file) {
      data.photoUrl = `/uploads/teachers/${req.file.filename}`;
    }

    // Parse array fields from FormData
    if (typeof data["subjectIds[]"] === "string") {
      data.subjectIds = [data["subjectIds[]"]];
    } else if (Array.isArray(data["subjectIds[]"])) {
      data.subjectIds = data["subjectIds[]"];
    }

    if (typeof data["classIds[]"] === "string") {
      data.classIds = [data["classIds[]"]];
    } else if (Array.isArray(data["classIds[]"])) {
      data.classIds = data["classIds[]"];
    }

    const teacher = await updateTeacher(id, data, tenantId);

    return res.json({
      success: true,
      data: teacher,
    });
  } catch (e: any) {
    console.error("UPDATE TEACHER ERROR:", e);

    return res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};

//////////////////////////////////////////////////////
// ✅ DELETE (soft)
//////////////////////////////////////////////////////
export const remove = async (req: any, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await deleteTeacher(id, tenantId);

    return res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (e: any) {
    console.error("DELETE TEACHER ERROR:", e);

    return res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};


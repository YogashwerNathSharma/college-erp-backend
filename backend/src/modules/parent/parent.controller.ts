/**
 * 👨👩👧 Parent Portal — Controller
 *
 * All controller functions use `req: any` to avoid TypeScript
 * conflicts with req.user and req.params.
 */

import * as parentService from "./parent.service";

// ─────────────────────────────────────────────────────
// POST /register — Parent self-registration
// ─────────────────────────────────────────────────────
export const register = async (req: any, res: any) => {
  try {
    const { name, email, phone, password, studentAdmissionNo, relation, tenantId } = req.body;

    if (!name || !email || !phone || !password || !studentAdmissionNo || !relation || !tenantId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, email, phone, password, studentAdmissionNo, relation, tenantId",
      });
    }

    const validRelations = ["FATHER", "MOTHER", "GUARDIAN"];
    if (!validRelations.includes(relation)) {
      return res.status(400).json({
        success: false,
        message: "Invalid relation. Must be FATHER, MOTHER, or GUARDIAN.",
      });
    }

    const result = await parentService.registerParent({
      name,
      email,
      phone,
      password,
      studentAdmissionNo,
      relation,
      tenantId,
    });

    return res.status(201).json({
      success: true,
      message: result.isExisting
        ? "Student linked to your existing account successfully."
        : "Parent account created and linked to student successfully.",
      data: {
        userId: result.user.id,
        studentName: `${result.student.firstName} ${result.student.lastName}`,
        admissionNo: result.student.admissionNo,
      },
    });
  } catch (error: any) {
    console.error("Parent Register Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to register parent.",
    });
  }
};

// ─────────────────────────────────────────────────────
// GET /my-children — Get linked students
// ─────────────────────────────────────────────────────
export const getMyChildren = async (req: any, res: any) => {
  try {
    const parentId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!parentId || !tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const children = await parentService.getMyChildren(parentId, tenantId);

    return res.json({
      success: true,
      data: children,
    });
  } catch (error: any) {
    console.error("Get My Children Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch children.",
    });
  }
};

// ─────────────────────────────────────────────────────
// GET /child/:studentId/attendance — Child's attendance
// ─────────────────────────────────────────────────────
export const getChildAttendance = async (req: any, res: any) => {
  try {
    const parentId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const { studentId } = req.params;
    const { month, year } = req.query;

    if (!parentId || !tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await parentService.getChildAttendance(
      parentId,
      studentId,
      tenantId,
      month !== undefined ? parseInt(month) : undefined,
      year !== undefined ? parseInt(year) : undefined
    );

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Get Child Attendance Error:", error);
    const status = error.message?.includes("not authorized") ? 403 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch attendance.",
    });
  }
};

// ─────────────────────────────────────────────────────
// GET /child/:studentId/results — Child's exam results
// ─────────────────────────────────────────────────────
export const getChildResults = async (req: any, res: any) => {
  try {
    const parentId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const { studentId } = req.params;

    if (!parentId || !tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await parentService.getChildResults(parentId, studentId, tenantId);

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Get Child Results Error:", error);
    const status = error.message?.includes("not authorized") ? 403 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch results.",
    });
  }
};

// ─────────────────────────────────────────────────────
// GET /child/:studentId/fees — Child's fee dues
// ─────────────────────────────────────────────────────
export const getChildFees = async (req: any, res: any) => {
  try {
    const parentId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const { studentId } = req.params;

    if (!parentId || !tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await parentService.getChildFees(parentId, studentId, tenantId);

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Get Child Fees Error:", error);
    const status = error.message?.includes("not authorized") ? 403 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch fees.",
    });
  }
};

// ─────────────────────────────────────────────────────
// GET /notices — School notices
// ─────────────────────────────────────────────────────
export const getNotices = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");

    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await parentService.getNotices(tenantId, page, limit);

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Get Notices Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notices.",
    });
  }
};

// ─────────────────────────────────────────────────────
// GET /profile — Parent's own profile
// ─────────────────────────────────────────────────────
export const getProfile = async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const profile = await parentService.getParentProfile(userId);

    return res.json({ success: true, data: profile });
  } catch (error: any) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile.",
    });
  }
};

// ─────────────────────────────────────────────────────
// PUT /profile — Update parent profile
// ─────────────────────────────────────────────────────
export const updateProfile = async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;
    const { name, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updated = await parentService.updateParentProfile(userId, { name, phone });

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

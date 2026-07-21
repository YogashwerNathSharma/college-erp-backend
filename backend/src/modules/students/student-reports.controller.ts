import { Response } from "express";
import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════════════════
// STUDENT REPORTS CONTROLLER
// ══════════════════════════════════════════════════════════════════

/**
 * GET /api/students/reports/admission
 * Query params: ?startDate=&endDate=&classId=&academicYearId=
 */
export const getAdmissionReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, endDate, classId, academicYearId } = req.query;

    const where: any = { tenantId, isDeleted: false };
    if (startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };
    if (academicYearId) where.academicYearId = academicYearId;

    const enrollmentFilter: any = {};
    if (classId) enrollmentFilter.classId = classId;

    if (Object.keys(enrollmentFilter).length > 0) {
      where.enrollments = { some: { ...enrollmentFilter, isDeleted: false } };
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        fullName: true,
        gender: true,
        dob: true,
        fatherName: true,
        fatherPhone: true,
        category: true,
        status: true,
        createdAt: true,
        admissionDate: true,
        enrollments: {
          where: { isDeleted: false, status: "active" },
          select: {
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const report = students.map((s: any) => ({
      admissionNo: s.admissionNo,
      name: s.fullName || `${s.firstName} ${s.lastName}`,
      gender: s.gender,
      dob: s.dob,
      fatherName: s.fatherName,
      fatherPhone: s.fatherPhone,
      category: s.category || "General",
      class: s.enrollments?.[0]?.class?.name || "-",
      section: s.enrollments?.[0]?.section?.name || "-",
      admissionDate: s.admissionDate || s.createdAt,
      status: s.status,
    }));

    res.json({
      success: true,
      data: { report, total: report.length },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/strength
 * Query params: ?academicYearId=
 */
export const getStrengthReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { academicYearId } = req.query;

    const classes = await prisma.class.findMany({
      where: { tenantId, isDeleted: false },
      select: {
        id: true,
        name: true,
        sections: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            enrollments: {
              where: {
                isDeleted: false,
                status: "active",
                ...(academicYearId && { academicYearId }),
              },
              select: {
                student: { select: { gender: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const report = classes.map((c: any) => {
      const sections = c.sections.map((s: any) => {
        const boys = s.enrollments.filter((e: any) =>
          ["Male", "male", "M", "MALE"].includes(e.student?.gender)
        ).length;
        const girls = s.enrollments.filter((e: any) =>
          ["Female", "female", "F", "FEMALE"].includes(e.student?.gender)
        ).length;
        return {
          sectionName: s.name,
          boys,
          girls,
          total: s.enrollments.length,
        };
      });

      const totalBoys = sections.reduce((sum: number, s: any) => sum + s.boys, 0);
      const totalGirls = sections.reduce((sum: number, s: any) => sum + s.girls, 0);
      const totalStudents = sections.reduce((sum: number, s: any) => sum + s.total, 0);

      return {
        className: c.name,
        classId: c.id,
        sections,
        totalBoys,
        totalGirls,
        totalStudents,
      };
    });

    const grandTotal = {
      boys: report.reduce((sum, r) => sum + r.totalBoys, 0),
      girls: report.reduce((sum, r) => sum + r.totalGirls, 0),
      total: report.reduce((sum, r) => sum + r.totalStudents, 0),
    };

    res.json({ success: true, data: { report, grandTotal } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/gender
 * Query params: ?classId=&academicYearId=
 */
export const getGenderReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { classId, academicYearId } = req.query;

    const where: any = { tenantId, isDeleted: false, status: "active" };
    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.enrollments = { some: { classId, isDeleted: false, status: "active" } };

    const students = await prisma.student.findMany({
      where,
      select: { gender: true },
    });

    const genderCount: Record<string, number> = {};
    students.forEach((s: any) => {
      const gender = s.gender || "Unknown";
      genderCount[gender] = (genderCount[gender] || 0) + 1;
    });

    const total = students.length;
    const report = Object.entries(genderCount).map(([gender, count]) => ({
      gender,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    res.json({ success: true, data: { report, total } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/category
 * Query params: ?classId=&academicYearId=
 */
export const getCategoryReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { classId, academicYearId } = req.query;

    const where: any = { tenantId, isDeleted: false, status: "active" };
    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.enrollments = { some: { classId, isDeleted: false, status: "active" } };

    const students = await prisma.student.findMany({
      where,
      select: {
        category: true,
        gender: true,
        enrollments: {
          where: { isDeleted: false, status: "active" },
          select: { class: { select: { name: true } } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const categoryMap: Record<string, { male: number; female: number; other: number; total: number }> = {};
    students.forEach((s: any) => {
      const cat = s.category || "General";
      if (!categoryMap[cat]) categoryMap[cat] = { male: 0, female: 0, other: 0, total: 0 };
      categoryMap[cat].total++;
      if (["Male", "male", "M", "MALE"].includes(s.gender)) categoryMap[cat].male++;
      else if (["Female", "female", "F", "FEMALE"].includes(s.gender)) categoryMap[cat].female++;
      else categoryMap[cat].other++;
    });

    const total = students.length;
    const report = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      ...data,
      percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
    }));

    res.json({ success: true, data: { report, total } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/religion
 * Query params: ?classId=&academicYearId=
 */
export const getReligionReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { classId, academicYearId } = req.query;

    const where: any = { tenantId, isDeleted: false, status: "active" };
    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.enrollments = { some: { classId, isDeleted: false, status: "active" } };

    const students = await prisma.student.findMany({
      where,
      select: { religion: true, gender: true },
    });

    const religionMap: Record<string, { male: number; female: number; total: number }> = {};
    students.forEach((s: any) => {
      const rel = s.religion || "Not Specified";
      if (!religionMap[rel]) religionMap[rel] = { male: 0, female: 0, total: 0 };
      religionMap[rel].total++;
      if (["Male", "male", "M", "MALE"].includes(s.gender)) religionMap[rel].male++;
      else religionMap[rel].female++;
    });

    const total = students.length;
    const report = Object.entries(religionMap).map(([religion, data]) => ({
      religion,
      ...data,
      percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
    }));

    res.json({ success: true, data: { report, total } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/transport
 */
export const getTransportReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;

    const assignments = await prisma.transportAssignment.findMany({
      where: { tenantId, isActive: true },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, fullName: true,
            admissionNo: true, phone: true, fatherName: true, fatherPhone: true,
            enrollments: {
              where: { isDeleted: false, status: "active" },
              select: { class: { select: { name: true } }, section: { select: { name: true } } },
              take: 1, orderBy: { createdAt: "desc" },
            },
          },
        },
        route: { select: { name: true, routeNo: true } },
        vehicle: { select: { vehicleNo: true, type: true } },
        stop: { select: { name: true, pickupTime: true, dropTime: true } },
      },
    }).catch(() => []);

    const report = (assignments as any[]).map((a: any) => ({
      studentName: a.student?.fullName || `${a.student?.firstName} ${a.student?.lastName}`,
      admissionNo: a.student?.admissionNo,
      class: a.student?.enrollments?.[0]?.class?.name || "-",
      section: a.student?.enrollments?.[0]?.section?.name || "-",
      fatherName: a.student?.fatherName,
      fatherPhone: a.student?.fatherPhone,
      route: a.route?.name || "-",
      routeNo: a.route?.routeNo || "-",
      vehicle: a.vehicle?.vehicleNo || "-",
      stop: a.stop?.name || "-",
      pickupTime: a.stop?.pickupTime || "-",
      dropTime: a.stop?.dropTime || "-",
    }));

    res.json({ success: true, data: { report, total: report.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/hostel
 */
export const getHostelReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;

    const allocations = await prisma.hostelAllocation.findMany({
      where: { tenantId, status: "active" },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, fullName: true,
            admissionNo: true, phone: true, fatherName: true, fatherPhone: true,
            enrollments: {
              where: { isDeleted: false, status: "active" },
              select: { class: { select: { name: true } }, section: { select: { name: true } } },
              take: 1, orderBy: { createdAt: "desc" },
            },
          },
        },
        hostel: { select: { name: true } },
        room: { select: { roomNo: true, floor: true } },
      },
    }).catch(() => []);

    const report = (allocations as any[]).map((a: any) => ({
      studentName: a.student?.fullName || `${a.student?.firstName} ${a.student?.lastName}`,
      admissionNo: a.student?.admissionNo,
      class: a.student?.enrollments?.[0]?.class?.name || "-",
      section: a.student?.enrollments?.[0]?.section?.name || "-",
      fatherName: a.student?.fatherName,
      fatherPhone: a.student?.fatherPhone,
      hostel: a.hostel?.name || "-",
      roomNo: a.room?.roomNo || "-",
      floor: a.room?.floor || "-",
    }));

    res.json({ success: true, data: { report, total: report.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/scholarship
 */
export const getScholarshipReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;

    const discounts = await prisma.feeDiscount.findMany({
      where: { tenantId, isDeleted: false, type: "scholarship" },
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true, firstName: true, lastName: true, fullName: true,
                admissionNo: true, category: true, fatherName: true,
              },
            },
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
    }).catch(() => []);

    const report = (discounts as any[]).map((d: any) => ({
      studentName: d.enrollment?.student?.fullName || `${d.enrollment?.student?.firstName} ${d.enrollment?.student?.lastName}`,
      admissionNo: d.enrollment?.student?.admissionNo,
      class: d.enrollment?.class?.name || "-",
      section: d.enrollment?.section?.name || "-",
      category: d.enrollment?.student?.category || "General",
      fatherName: d.enrollment?.student?.fatherName,
      scholarshipName: d.name || d.description || "Scholarship",
      amount: d.amount || 0,
      percentage: d.percentage || 0,
    }));

    res.json({ success: true, data: { report, total: report.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/medical
 */
export const getMedicalReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { condition, academicYearId } = req.query;

    const where: any = { tenantId, isDeleted: false, status: "active" };
    if (academicYearId) where.academicYearId = academicYearId;

    // Get students with medical conditions
    if (condition) {
      where.OR = [
        { medicalConditions: { has: condition } },
        { allergies: { has: condition } },
      ];
    } else {
      where.OR = [
        { medicalConditions: { isEmpty: false } },
        { allergies: { isEmpty: false } },
        { medications: { isEmpty: false } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, fullName: true,
        admissionNo: true, bloodGroup: true, medicalConditions: true,
        allergies: true, medications: true, emergencyContact: true,
        emergencyPhone: true, insuranceId: true,
        enrollments: {
          where: { isDeleted: false, status: "active" },
          select: { class: { select: { name: true } }, section: { select: { name: true } } },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
    });

    const report = students.map((s: any) => ({
      name: s.fullName || `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      class: s.enrollments?.[0]?.class?.name || "-",
      section: s.enrollments?.[0]?.section?.name || "-",
      bloodGroup: s.bloodGroup || "-",
      medicalConditions: s.medicalConditions || [],
      allergies: s.allergies || [],
      medications: s.medications || [],
      emergencyContact: s.emergencyContact,
      emergencyPhone: s.emergencyPhone,
      insuranceId: s.insuranceId,
    }));

    res.json({ success: true, data: { report, total: report.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/birthday
 * Query params: ?month= (1-12)
 */
export const getBirthdayReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { month } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const students = await prisma.student.findMany({
      where: { tenantId, isDeleted: false, status: "active" },
      select: {
        id: true, firstName: true, lastName: true, fullName: true,
        admissionNo: true, dob: true, phone: true, fatherPhone: true,
        enrollments: {
          where: { isDeleted: false, status: "active" },
          select: { class: { select: { name: true } }, section: { select: { name: true } } },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
    });

    // Filter by month
    const birthdayStudents = students.filter((s: any) => {
      const dob = new Date(s.dob);
      return dob.getMonth() + 1 === targetMonth;
    });

    // Sort by day
    birthdayStudents.sort((a: any, b: any) => {
      return new Date(a.dob).getDate() - new Date(b.dob).getDate();
    });

    const report = birthdayStudents.map((s: any) => ({
      name: s.fullName || `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      class: s.enrollments?.[0]?.class?.name || "-",
      section: s.enrollments?.[0]?.section?.name || "-",
      dob: s.dob,
      day: new Date(s.dob).getDate(),
      phone: s.phone || s.fatherPhone || "-",
    }));

    res.json({
      success: true,
      data: {
        report,
        total: report.length,
        month: targetMonth,
        monthName: new Date(2000, targetMonth - 1).toLocaleString("en", { month: "long" }),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/inactive
 */
export const getInactiveReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { reason } = req.query;

    const where: any = { tenantId, isDeleted: false, status: { not: "active" } };
    if (reason) where.status = reason;

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, fullName: true,
        admissionNo: true, status: true, phone: true, fatherName: true,
        fatherPhone: true, statusChangedAt: true, statusReason: true,
        enrollments: {
          where: { isDeleted: false },
          select: { class: { select: { name: true } }, section: { select: { name: true } } },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const report = students.map((s: any) => ({
      name: s.fullName || `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      class: s.enrollments?.[0]?.class?.name || "-",
      section: s.enrollments?.[0]?.section?.name || "-",
      status: s.status,
      reason: (s as any).statusReason || "-",
      inactiveSince: (s as any).statusChangedAt || s.updatedAt,
      fatherName: s.fatherName,
      fatherPhone: s.fatherPhone,
    }));

    res.json({ success: true, data: { report, total: report.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/transfer
 * Query params: ?startDate=&endDate=
 */
export const getTransferReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, endDate } = req.query;

    const where: any = { tenantId, isDeleted: false, status: "transferred" };
    if (startDate || endDate) {
      where.statusChangedAt = {};
      if (startDate) where.statusChangedAt.gte = new Date(startDate);
      if (endDate) where.statusChangedAt.lte = new Date(endDate);
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, fullName: true,
        admissionNo: true, phone: true, fatherName: true, fatherPhone: true,
        statusChangedAt: true, statusReason: true, status: true,
        enrollments: {
          where: { isDeleted: false },
          select: {
            class: { select: { name: true } },
            section: { select: { name: true } },
            academicYear: { select: { name: true } },
          },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const report = students.map((s: any) => ({
      name: s.fullName || `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo,
      class: s.enrollments?.[0]?.class?.name || "-",
      section: s.enrollments?.[0]?.section?.name || "-",
      academicYear: s.enrollments?.[0]?.academicYear?.name || "-",
      transferDate: (s as any).statusChangedAt,
      reason: (s as any).statusReason || "-",
      fatherName: s.fatherName,
      contact: s.phone || s.fatherPhone || "-",
    }));

    res.json({ success: true, data: { report, total: report.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/promotion
 * Query params: ?academicYearId=&classId=
 */
export const getPromotionReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { academicYearId, classId } = req.query;

    const where: any = { tenantId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.fromClassId = classId;

    const promotions = await prisma.promotion.findMany({
      where,
      include: {
        student: {
          select: { firstName: true, lastName: true, fullName: true, admissionNo: true },
        },
        fromClass: { select: { name: true } },
        toClass: { select: { name: true } },
        fromSection: { select: { name: true } },
        toSection: { select: { name: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const report = promotions.map((p: any) => ({
      studentName: p.student?.fullName || `${p.student?.firstName} ${p.student?.lastName}`,
      admissionNo: p.student?.admissionNo,
      fromClass: p.fromClass?.name || "-",
      fromSection: p.fromSection?.name || "-",
      toClass: p.toClass?.name || "-",
      toSection: p.toSection?.name || "-",
      academicYear: p.academicYear?.name || "-",
      promotionType: p.type || "promotion",
      date: p.createdAt,
    }));

    res.json({ success: true, data: { report, total: report.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/reports/document
 * Query params: ?status= (pending|verified|missing)
 */
export const getDocumentReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { status: docStatus } = req.query;

    const students = await prisma.student.findMany({
      where: { tenantId, isDeleted: false, status: "active" },
      select: {
        id: true, firstName: true, lastName: true, fullName: true, admissionNo: true,
        documents: {
          select: {
            id: true, type: true, name: true, url: true,
            verificationStatus: true, expiryDate: true, documentCategory: true,
          },
        },
        enrollments: {
          where: { isDeleted: false, status: "active" },
          select: { class: { select: { name: true } }, section: { select: { name: true } } },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
    });

    let report = students.map((s: any) => {
      const docs = s.documents || [];
      const verified = docs.filter((d: any) => d.verificationStatus === "verified").length;
      const pending = docs.filter((d: any) => d.verificationStatus === "pending" || !d.verificationStatus).length;
      const expired = docs.filter((d: any) => d.expiryDate && new Date(d.expiryDate) < new Date()).length;

      return {
        name: s.fullName || `${s.firstName} ${s.lastName}`,
        admissionNo: s.admissionNo,
        class: s.enrollments?.[0]?.class?.name || "-",
        section: s.enrollments?.[0]?.section?.name || "-",
        totalDocuments: docs.length,
        verified,
        pending,
        expired,
        documents: docs,
      };
    });

    // Filter by document status if requested
    if (docStatus === "pending") {
      report = report.filter((r) => r.pending > 0);
    } else if (docStatus === "verified") {
      report = report.filter((r) => r.verified === r.totalDocuments && r.totalDocuments > 0);
    } else if (docStatus === "missing") {
      report = report.filter((r) => r.totalDocuments === 0);
    }

    res.json({ success: true, data: { report, total: report.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/reports/custom
 * Body: { fields: string[], filters: object, groupBy?: string, sortBy?: string, sortOrder?: string }
 */
export const getCustomReportHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { fields, filters, groupBy, sortBy, sortOrder } = req.body;

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ success: false, message: "fields array is required" });
    }

    // Build select from requested fields
    const allowedFields = [
      "id", "admissionNo", "srNo", "rollNumber", "firstName", "lastName", "fullName",
      "gender", "dob", "bloodGroup", "religion", "caste", "category", "nationality",
      "aadharNo", "email", "phone", "address", "fatherName", "motherName",
      "fatherPhone", "motherPhone", "fatherOccupation", "motherOccupation",
      "guardianName", "guardianPhone", "status", "admissionDate", "createdAt",
      "medicalConditions", "allergies", "emergencyContact", "emergencyPhone",
    ];

    const select: Record<string, boolean> = {};
    fields.forEach((f: string) => {
      if (allowedFields.includes(f)) select[f] = true;
    });
    // Always include id
    select.id = true;

    // Build where from filters
    const where: any = { tenantId, isDeleted: false };
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.gender) where.gender = { in: [filters.gender, filters.gender.toLowerCase()] };
      if (filters.category) where.category = filters.category;
      if (filters.religion) where.religion = filters.religion;
      if (filters.bloodGroup) where.bloodGroup = filters.bloodGroup;
      if (filters.academicYearId) where.academicYearId = filters.academicYearId;
      if (filters.classId) {
        where.enrollments = { some: { classId: filters.classId, isDeleted: false, status: "active" } };
      }
      if (filters.sectionId) {
        where.enrollments = { some: { sectionId: filters.sectionId, isDeleted: false, status: "active" } };
      }
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy && allowedFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "desc" ? "desc" : "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Include enrollment info if class/section fields are requested
    const includeEnrollment = fields.includes("class") || fields.includes("section");

    const students = await prisma.student.findMany({
      where,
      select: {
        ...select,
        ...(includeEnrollment && {
          enrollments: {
            where: { isDeleted: false, status: "active" },
            select: { class: { select: { name: true } }, section: { select: { name: true } } },
            take: 1, orderBy: { createdAt: "desc" },
          },
        }),
      },
      orderBy,
      take: 5000, // Max records for custom report
    });

    // Apply groupBy if requested
    let result: any;
    if (groupBy && allowedFields.includes(groupBy)) {
      const groups: Record<string, any[]> = {};
      students.forEach((s: any) => {
        const key = s[groupBy] || "Not Specified";
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });
      result = { grouped: true, groups };
    } else {
      result = { grouped: false, records: students };
    }

    res.json({
      success: true,
      data: { ...result, total: students.length, fields },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

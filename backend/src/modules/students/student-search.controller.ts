import { Response } from "express";
import prisma from "../../utils/prisma";

// ══════════════════════════════════════════════════════════════════
// STUDENT SEARCH & FILTER CONTROLLER
// ══════════════════════════════════════════════════════════════════

/**
 * POST /api/students/search/advanced-search
 * Body: {
 *   admissionNo?, rollNo?, name?, fatherName?, motherName?,
 *   mobile?, aadhaar?, classId?, sectionId?, academicYearId?,
 *   houseId?, category?, religion?, transport?, hostel?,
 *   status?, gender?, bloodGroup?,
 *   page?, limit?, sortBy?, sortOrder?
 * }
 */
export const advancedSearchHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const {
      admissionNo, rollNo, name, fatherName, motherName,
      mobile, aadhaar, classId, sectionId, academicYearId,
      houseId, category, religion, transport, hostel,
      status, gender, bloodGroup,
      page = 1, limit = 50, sortBy = "createdAt", sortOrder = "desc",
    } = req.body;

    const where: any = { tenantId, isDeleted: false };

    // Direct field filters
    if (status) where.status = status;
    if (category) where.category = category;
    if (religion) where.religion = religion;
    if (bloodGroup) where.bloodGroup = bloodGroup;
    if (academicYearId) where.academicYearId = academicYearId;
    if (houseId) where.houseId = houseId;

    // Gender normalization
    if (gender) {
      const genderMap: Record<string, string[]> = {
        Male: ["Male", "male", "M", "MALE"],
        Female: ["Female", "female", "F", "FEMALE"],
        Other: ["Other", "other", "O", "OTHER"],
      };
      where.gender = { in: genderMap[gender] || [gender] };
    }

    // Text search fields (case-insensitive contains)
    if (admissionNo) where.admissionNo = { contains: admissionNo, mode: "insensitive" };
    if (aadhaar) where.aadharNo = { contains: aadhaar, mode: "insensitive" };

    // Name search (across firstName, lastName, fullName)
    if (name) {
      where.OR = [
        ...(where.OR || []),
        { firstName: { contains: name, mode: "insensitive" } },
        { lastName: { contains: name, mode: "insensitive" } },
        { fullName: { contains: name, mode: "insensitive" } },
      ];
    }

    // Father/Mother name search
    if (fatherName) {
      where.fatherName = { contains: fatherName, mode: "insensitive" };
    }
    if (motherName) {
      where.motherName = { contains: motherName, mode: "insensitive" };
    }

    // Mobile search (student phone or father phone)
    if (mobile) {
      const mobileOR = [
        { phone: { contains: mobile } },
        { fatherPhone: { contains: mobile } },
        { motherPhone: { contains: mobile } },
      ];
      if (where.OR) {
        // Combine with AND logic
        where.AND = [{ OR: where.OR }, { OR: mobileOR }];
        delete where.OR;
      } else {
        where.OR = mobileOR;
      }
    }

    // Roll number search
    if (rollNo) {
      where.rollNumber = { contains: rollNo, mode: "insensitive" };
    }

    // Enrollment-based filters (class, section)
    const enrollmentFilter: any = { isDeleted: false, status: "active" };
    let hasEnrollmentFilter = false;

    if (classId) { enrollmentFilter.classId = classId; hasEnrollmentFilter = true; }
    if (sectionId) { enrollmentFilter.sectionId = sectionId; hasEnrollmentFilter = true; }
    if (academicYearId) { enrollmentFilter.academicYearId = academicYearId; hasEnrollmentFilter = true; }

    if (hasEnrollmentFilter) {
      where.enrollments = { some: enrollmentFilter };
    }

    // Transport filter
    if (transport === true || transport === "true") {
      // Students who have active transport assignment
      const transportStudentIds = await prisma.transportAssignment.findMany({
        where: { tenantId, status: "ACTIVE", isDeleted: false },
        select: { studentId: true },
      }).then(results => results.map((r: any) => r.studentId)).catch(() => []);

      if (transportStudentIds.length > 0) {
        where.id = { ...(where.id || {}), in: transportStudentIds };
      } else {
        // No transport students, return empty
        return res.json({ success: true, data: { students: [], total: 0, page, limit, totalPages: 0 } });
      }
    }

    // Hostel filter
    if (hostel === true || hostel === "true") {
      const hostelStudentIds = await prisma.hostelAllocation.findMany({
        where: { tenantId, status: "ACTIVE" },
        select: { studentId: true },
      }).then(results => results.map((r: any) => r.studentId)).catch(() => []);

      if (hostelStudentIds.length > 0) {
        if ((where as any).id?.in) {
          (where as any).id.in = (where as any).id.in.filter((id: string) => hostelStudentIds.includes(id));
        } else {
          (where as any).id = { ...((where as any).id || {}), in: hostelStudentIds };
        }
      } else {
        return res.json({ success: true, data: { students: [], total: 0, page, limit, totalPages: 0 } });
      }
    }

    // Build sort
    const allowedSortFields = ["createdAt", "firstName", "lastName", "admissionNo", "dob", "rollNumber", "status"];
    const orderBy: any = {};
    if (allowedSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            where: { status: "active", isDeleted: false },
            include: {
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
              academicYear: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        students,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/search/saved-filters
 */
export const getSavedFiltersHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;

    const filters = await prisma.studentSavedFilter.findMany({
      where: { tenantId, userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }).catch(() => []);

    res.json({ success: true, data: filters });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students/search/saved-filters
 * Body: { name: string, filters: object, isDefault?: boolean }
 */
export const createSavedFilterHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;
    const { name, filters, isDefault } = req.body;

    if (!name || !filters) {
      return res.status(400).json({ success: false, message: "Name and filters are required" });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.studentSavedFilter.updateMany({
        where: { tenantId, userId, isDefault: true },
        data: { isDefault: false },
      }).catch(() => null);
    }

    const saved = await prisma.studentSavedFilter.create({
      data: {
        tenantId,
        userId,
        name,
        filters,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/students/search/saved-filters/:id
 */
export const deleteSavedFilterHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const filterId = req.params.id;

    await prisma.studentSavedFilter.deleteMany({
      where: { id: filterId, tenantId },
    });

    res.json({ success: true, message: "Filter deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/search/check-duplicate
 * Query: ?aadharNo=&phone=&email=&admissionNo=
 */
export const checkDuplicateHandler = async (req: any, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { aadharNo, phone, email, admissionNo } = req.query;

    if (!aadharNo && !phone && !email && !admissionNo) {
      return res.status(400).json({
        success: false,
        message: "At least one search parameter is required (aadharNo, phone, email, or admissionNo)",
      });
    }

    const duplicates: {
      field: string;
      value: string;
      student: { id: string; name: string; admissionNo: string; class: string; status: string };
    }[] = [];

    // Check Aadhaar
    if (aadharNo) {
      const existing = await prisma.student.findFirst({
        where: { tenantId, aadharNo, isDeleted: false },
        select: {
          id: true, firstName: true, lastName: true, fullName: true, admissionNo: true, status: true,
          enrollments: {
            where: { isDeleted: false, status: "active" },
            select: { class: { select: { name: true } } },
            take: 1, orderBy: { createdAt: "desc" },
          },
        },
      });
      if (existing) {
        duplicates.push({
          field: "aadharNo",
          value: aadharNo,
          student: {
            id: existing.id,
            name: existing.fullName || `${existing.firstName} ${existing.lastName}`,
            admissionNo: existing.admissionNo,
            class: existing.enrollments?.[0]?.class?.name || "-",
            status: existing.status,
          },
        });
      }
    }

    // Check Phone
    if (phone) {
      const existing = await prisma.student.findFirst({
        where: { tenantId, phone, isDeleted: false },
        select: {
          id: true, firstName: true, lastName: true, fullName: true, admissionNo: true, status: true,
          enrollments: {
            where: { isDeleted: false, status: "active" },
            select: { class: { select: { name: true } } },
            take: 1, orderBy: { createdAt: "desc" },
          },
        },
      });
      if (existing) {
        duplicates.push({
          field: "phone",
          value: phone,
          student: {
            id: existing.id,
            name: existing.fullName || `${existing.firstName} ${existing.lastName}`,
            admissionNo: existing.admissionNo,
            class: existing.enrollments?.[0]?.class?.name || "-",
            status: existing.status,
          },
        });
      }
    }

    // Check Email
    if (email) {
      const existing = await prisma.student.findFirst({
        where: { tenantId, email, isDeleted: false },
        select: {
          id: true, firstName: true, lastName: true, fullName: true, admissionNo: true, status: true,
          enrollments: {
            where: { isDeleted: false, status: "active" },
            select: { class: { select: { name: true } } },
            take: 1, orderBy: { createdAt: "desc" },
          },
        },
      });
      if (existing) {
        duplicates.push({
          field: "email",
          value: email,
          student: {
            id: existing.id,
            name: existing.fullName || `${existing.firstName} ${existing.lastName}`,
            admissionNo: existing.admissionNo,
            class: existing.enrollments?.[0]?.class?.name || "-",
            status: existing.status,
          },
        });
      }
    }

    // Check Admission No
    if (admissionNo) {
      const existing = await prisma.student.findFirst({
        where: { tenantId, admissionNo, isDeleted: false },
        select: {
          id: true, firstName: true, lastName: true, fullName: true, admissionNo: true, status: true,
          enrollments: {
            where: { isDeleted: false, status: "active" },
            select: { class: { select: { name: true } } },
            take: 1, orderBy: { createdAt: "desc" },
          },
        },
      });
      if (existing) {
        duplicates.push({
          field: "admissionNo",
          value: admissionNo,
          student: {
            id: existing.id,
            name: existing.fullName || `${existing.firstName} ${existing.lastName}`,
            admissionNo: existing.admissionNo,
            class: existing.enrollments?.[0]?.class?.name || "-",
            status: existing.status,
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        hasDuplicates: duplicates.length > 0,
        duplicates,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

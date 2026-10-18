// SIMPLE STUDENT LIST WITH ACADEMIC YEAR + CLASS/SECTION SUPPORT
import prisma from "../../utils/prisma";

export const getStudentsSimple = async (
  tenantId: string,
  limit: number = 50,
  page: number = 1,
  academicYearId?: string,
  classId?: string,
  sectionId?: string
) => {
  try {
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      isDeleted: false,
      status: { in: ["active", "pending", "verified"] },
    };

    // Build enrollment filter if any enrollment-related filter is provided
    const enrollmentFilter: any = {
      status: { in: ["active", "pending", "verified"] },
      isDeleted: false,
    };
    let hasEnrollmentFilter = false;

    if (academicYearId) {
      enrollmentFilter.academicYearId = academicYearId;
      hasEnrollmentFilter = true;
    }
    if (classId) {
      enrollmentFilter.classId = classId;
      hasEnrollmentFilter = true;
    }
    if (sectionId) {
      enrollmentFilter.sectionId = sectionId;
      hasEnrollmentFilter = true;
    }

    if (hasEnrollmentFilter) {
      where.enrollments = { some: enrollmentFilter };
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        admissionNo: true,
        srNo: true,
        rollNumber: true,
        gender: true,
        dob: true,
        status: true,
        phone: true,
        email: true,
        fatherName: true,
        fatherPhone: true,
        motherName: true,
        photoUrl: true,
        bloodGroup: true,
        admissionDate: true,
        createdAt: true,
        enrollments: {
          where: {
            status: { in: ["active", "pending", "verified"] },
            isDeleted: false,
            ...(academicYearId ? { academicYearId } : {}),
          },
          select: {
            id: true,
            rollNumber: true,
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            academicYear: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { firstName: "asc" },
      skip,
      take: limit,
    });

    const total = await prisma.student.count({ where });

    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("❌ getStudentsSimple error:", error.message);
    throw error;
  }
};

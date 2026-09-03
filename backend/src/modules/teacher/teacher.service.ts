import { getPagination } from "../../utils/pagination";
import prisma from "../../utils/prisma";
import { buildPaginationMeta } from "../../utils/pagination";

// Build TeacherSubject rows from the database subject -> class relation.
// The frontend may send unique classIds, but subjectIds must never be paired
// with classIds by array position because a teacher can teach different
// subjects in different classes.
const resolveTeacherSubjectRows = async (
  db: any,
  teacherId: string,
  subjectIds: string[],
  classIds: string[],
  tenantId: string,
  academicYearId?: string
) => {
  const uniqueSubjectIds = [...new Set((subjectIds || []).filter(Boolean))];
  const selectedClassIds = new Set((classIds || []).filter(Boolean));
  if (!uniqueSubjectIds.length) return [];

  const subjects = await db.subject.findMany({
    where: {
      id: { in: uniqueSubjectIds },
      tenantId,
      ...(academicYearId ? { academicYearId } : {}),
    },
    select: { id: true, classId: true, academicYearId: true },
  });

  if (subjects.length !== uniqueSubjectIds.length) {
    throw new Error("One or more selected subjects do not belong to the selected academic year");
  }

  for (const subject of subjects) {
    if (selectedClassIds.size && !selectedClassIds.has(subject.classId)) {
      throw new Error("Selected subject and class do not match");
    }
  }

  return subjects.map((subject: any) => ({
    teacherId,
    subjectId: subject.id,
    classId: subject.classId,
  }));
};

//////////////////////////////////////////////////////
// CREATE TEACHER
//////////////////////////////////////////////////////
export const createTeacher = async (data: any, tenantId: string) => {
  const existing = await prisma.teacher.findFirst({
    where: {
      email: data.email,
      tenantId,
      isDeleted: false,
      ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}),
    },
  });

  if (existing) throw new Error("Teacher already exists with this email");
  if (!data.academicYearId) throw new Error("Academic year is required");

  const year = await prisma.academicYear.findFirst({ where: { id: data.academicYearId, tenantId } });
  if (!year) throw new Error("Invalid academic year");

  if (data.subjectIds?.length) {
    const subjects = await prisma.subject.findMany({
      where: { id: { in: data.subjectIds }, tenantId, academicYearId: data.academicYearId },
    });
    if (subjects.length !== [...new Set(data.subjectIds)].length) {
      throw new Error("Invalid subject(s) for selected academic year");
    }
  }

  if (data.classIds?.length) {
    const classes = await prisma.class.findMany({
      where: { id: { in: data.classIds }, tenantId, academicYearId: data.academicYearId },
    });
    if (classes.length !== [...new Set(data.classIds)].length) {
      throw new Error("Invalid class(es) for selected academic year");
    }
  }

  return await prisma.$transaction(async (tx) => {
    const teacher = await tx.teacher.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        gender: data.gender || null,
        dob: data.dob ? new Date(data.dob) : null,
        employeeId: data.employeeId || null,
        maritalStatus: data.maritalStatus || null,
        photoUrl: data.photoUrl || null,
        tenantId,
        academicYearId: data.academicYearId,
      },
    });

    if (data.subjectIds?.length) {
      const rows = await resolveTeacherSubjectRows(
        tx, teacher.id, data.subjectIds, data.classIds || [], tenantId, data.academicYearId
      );
      if (rows.length) await tx.teacherSubject.createMany({ data: rows });
    }

    if (data.classIds?.length) {
      await tx.teacherClass.createMany({
        data: [...new Set(data.classIds)].map((id: string) => ({ teacherId: teacher.id, classId: id })),
      });
    }

    return teacher;
  });
};

//////////////////////////////////////////////////////
// GET TEACHERS
//////////////////////////////////////////////////////
export const getTeachers = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query);
  const search = query.search?.trim() || "";
  const whereClause: any = { tenantId, isDeleted: false };
  if (query.academicYearId) whereClause.academicYearId = query.academicYearId;

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { employeeId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rawTeachers, total] = await Promise.all([
    (prisma.teacher.findMany as any)({
      where: whereClause,
      include: {
        subjects: { where: { isDeleted: false }, include: { subject: true } },
        classes: { where: { isDeleted: false }, include: { class: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }).catch(async () => prisma.teacher.findMany({ where: whereClause, orderBy: { createdAt: "desc" }, skip, take: limit })),
    prisma.teacher.count({ where: whereClause }),
  ]);

  const data = rawTeachers.map((t: any) => ({
    ...t,
    subjects: (t.subjects || []).filter((s: any) => s?.subject != null).map((s: any) => ({
      ...s.subject,
      classId: s.classId,
    })),
    classes: (t.classes || []).filter((c: any) => c?.class != null).map((c: any) => c.class),
  }));

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

//////////////////////////////////////////////////////
// GET TEACHER BY ID
//////////////////////////////////////////////////////
export const getTeacherById = async (id: string, tenantId: string, academicYearId?: string) => {
  const teacher = await (prisma.teacher.findFirst as any)({
    where: { id, tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}) },
    include: {
      subjects: { where: { isDeleted: false }, include: { subject: true } },
      classes: { where: { isDeleted: false }, include: { class: true } },
    },
  }).catch(async () => prisma.teacher.findFirst({ where: { id, tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}) } }));

  if (!teacher) return null;

  return {
    ...teacher,
    // Keep classId from TeacherSubject. It is the authoritative class for
    // this exact teacher-subject assignment.
    subjects: (teacher.subjects || [])
      .filter((s: any) => s?.subject != null)
      .map((s: any) => ({ ...s.subject, classId: s.classId })),
    classes: (teacher.classes || []).filter((c: any) => c?.class != null).map((c: any) => c.class),
  };
};

//////////////////////////////////////////////////////
// UPDATE TEACHER
//////////////////////////////////////////////////////
export const updateTeacher = async (id: string, data: any, tenantId: string) => {
  const existing = await prisma.teacher.findFirst({
    where: { id, tenantId, isDeleted: false, ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}) },
  });
  if (!existing) throw new Error("Teacher not found");

  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.teacher.findFirst({
      where: { email: data.email, tenantId, isDeleted: false, id: { not: id }, ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}) },
    });
    if (emailExists) throw new Error("Email already in use by another teacher");
  }

  if (data.academicYearId) {
    const year = await prisma.academicYear.findFirst({ where: { id: data.academicYearId, tenantId } });
    if (!year) throw new Error("Invalid academic year");
  }

  if (data.subjectIds?.length) {
    const subjects = await prisma.subject.findMany({
      where: { id: { in: data.subjectIds }, tenantId, ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}) },
    });
    if (subjects.length !== [...new Set(data.subjectIds)].length) throw new Error("Invalid subject(s) for selected academic year");
  }

  if (data.classIds?.length) {
    const classes = await prisma.class.findMany({
      where: { id: { in: data.classIds }, tenantId, ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}) },
    });
    if (classes.length !== [...new Set(data.classIds)].length) throw new Error("Invalid class(es) for selected academic year");
  }

  return await prisma.$transaction(async (tx) => {
    const teacher = await tx.teacher.update({
      where: { id },
      data: {
        firstName: data.firstName || existing.firstName,
        lastName: data.lastName || existing.lastName,
        name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : existing.name,
        email: data.email || existing.email,
        phone: data.phone || existing.phone,
        gender: data.gender !== undefined ? data.gender : existing.gender,
        dob: data.dob ? new Date(data.dob) : existing.dob,
        employeeId: data.employeeId !== undefined ? data.employeeId : existing.employeeId,
        maritalStatus: data.maritalStatus !== undefined ? data.maritalStatus : existing.maritalStatus,
        photoUrl: data.photoUrl !== undefined ? data.photoUrl : existing.photoUrl,
        academicYearId: data.academicYearId || existing.academicYearId,
      },
    });

    if (data.subjectIds !== undefined) {
      await tx.teacherSubject.updateMany({ where: { teacherId: id, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
      if (data.subjectIds.length > 0) {
        const rows = await resolveTeacherSubjectRows(
          tx, id, data.subjectIds, data.classIds || [], tenantId, data.academicYearId || existing.academicYearId
        );
        if (rows.length) await tx.teacherSubject.createMany({ data: rows });
      }
    }

    if (data.classIds !== undefined) {
      await tx.teacherClass.updateMany({ where: { teacherId: id, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
      if (data.classIds.length > 0) {
        await tx.teacherClass.createMany({
          data: [...new Set(data.classIds)].map((clsId: string) => ({ teacherId: id, classId: clsId })),
        });
      }
    }

    return teacher;
  });
};

//////////////////////////////////////////////////////
// DELETE TEACHER (soft)
//////////////////////////////////////////////////////
export const deleteTeacher = async (id: string, tenantId: string, academicYearId?: string) => {
  const existing = await prisma.teacher.findFirst({ where: { id, tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}) } });
  if (!existing) throw new Error("Teacher not found");

  await prisma.$transaction(async (tx) => {
    await tx.teacher.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    await tx.teacherSubject.updateMany({ where: { teacherId: id, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
    await tx.teacherClass.updateMany({ where: { teacherId: id, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
  });
};

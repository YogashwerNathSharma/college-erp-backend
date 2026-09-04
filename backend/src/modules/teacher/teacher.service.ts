import { getPagination } from "../../utils/pagination";
import prisma from "../../utils/prisma";
import { buildPaginationMeta } from "../../utils/pagination";

const resolveTeacherSubjectRows = async (
  db: any, teacherId: string, subjectIds: string[], classIds: string[], tenantId: string,
  academicYearId?: string, assignments?: Array<{ subjectId: string; classId: string }>
) => {
  const pairs = Array.isArray(assignments) && assignments.length
    ? assignments.map(a => ({ subjectId: a.subjectId, classId: a.classId })).filter(a => a.subjectId && a.classId)
    : [...new Set((subjectIds || []).filter(Boolean))].map(subjectId => ({ subjectId, classId: "" }));
  if (!pairs.length) return [];
  const uniqueSubjectIds = [...new Set(pairs.map(p => p.subjectId))];
  const selectedClassIds = new Set((classIds || []).filter(Boolean));
  const subjects = await db.subject.findMany({
    where: { id: { in: uniqueSubjectIds }, tenantId, ...(academicYearId ? { academicYearId } : {}) },
    select: { id: true, classId: true, academicYearId: true },
  });
  if (subjects.length !== uniqueSubjectIds.length) throw new Error("One or more selected subjects do not belong to the selected academic year");
  const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
  const seen = new Set<string>();
  return pairs.map(pair => {
    const subject: any = subjectMap.get(pair.subjectId);
    if (!subject) throw new Error("Invalid subject assignment");
    if (pair.classId && pair.classId !== subject.classId) throw new Error("Selected subject does not belong to the selected class");
    if (selectedClassIds.size && !selectedClassIds.has(subject.classId)) throw new Error("Selected subject and class do not match");
    const key = `${teacherId}:${subject.id}`;
    if (seen.has(key)) throw new Error("Duplicate subject assignment");
    seen.add(key);
    // Persist the exact class/subject pair. TeacherSubject has a required classId.
    return { teacherId, subjectId: subject.id, classId: subject.classId };
  });
};

const assignmentSubjectIds = (data: any): string[] =>
  Array.isArray(data.assignments) ? Array.from(new Set<string>(data.assignments.map((a: any) => a?.subjectId).filter((id: unknown): id is string => typeof id === "string" && id.length > 0))) : [];
const assignmentClassIds = (data: any): string[] =>
  Array.isArray(data.assignments) ? Array.from(new Set<string>(data.assignments.map((a: any) => a?.classId).filter((id: unknown): id is string => typeof id === "string" && id.length > 0))) : [];

export const createTeacher = async (data: any, tenantId: string) => {
  const assignmentIds = assignmentSubjectIds(data), assignmentClasses = assignmentClassIds(data);
  const subjectIds = data.subjectIds?.length ? data.subjectIds : assignmentIds;
  const classIds = data.classIds?.length ? data.classIds : assignmentClasses;
  const existing = await prisma.teacher.findFirst({ where: { email: data.email, tenantId, isDeleted: false, ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}) } });
  if (existing) throw new Error("Teacher already exists with this email");
  if (!data.academicYearId) throw new Error("Academic year is required");
  const year = await prisma.academicYear.findFirst({ where: { id: data.academicYearId, tenantId } });
  if (!year) throw new Error("Invalid academic year");
  if (subjectIds.length) {
    const subjects = await prisma.subject.findMany({ where: { id: { in: [...new Set(subjectIds)] }, tenantId, academicYearId: data.academicYearId } });
    if (subjects.length !== [...new Set(subjectIds)].length) throw new Error("Invalid subject(s) for selected academic year");
  }
  if (classIds.length) {
    const classes = await prisma.class.findMany({ where: { id: { in: [...new Set(classIds)] }, tenantId, academicYearId: data.academicYearId } });
    if (classes.length !== [...new Set(classIds)].length) throw new Error("Invalid class(es) for selected academic year");
  }
  return prisma.$transaction(async tx => {
    const teacher = await tx.teacher.create({ data: {
      firstName: data.firstName, lastName: data.lastName, name: `${data.firstName} ${data.lastName}`,
      email: data.email, phone: data.phone, gender: data.gender || null, dob: data.dob ? new Date(data.dob) : null,
      employeeId: data.employeeId || null, maritalStatus: data.maritalStatus || null, photoUrl: data.photoUrl || null,
      tenantId, academicYearId: data.academicYearId,
    } });
    if (subjectIds.length) {
      const rows = await resolveTeacherSubjectRows(tx, teacher.id, subjectIds, classIds, tenantId, data.academicYearId, data.assignments);
      if (rows.length) await tx.teacherSubject.createMany({ data: rows });
    }
    if (classIds.length) await tx.teacherClass.createMany({ data: [...new Set(classIds)].map((classId: string) => ({ teacherId: teacher.id, classId })) });
    return teacher;
  });
};

export const getTeachers = async (query: any, tenantId: string) => {
  const { skip, limit, page } = getPagination(query), search = query.search?.trim() || "";
  const whereClause: any = { tenantId, isDeleted: false };
  if (query.academicYearId) whereClause.academicYearId = query.academicYearId;
  if (search) whereClause.OR = [
    { name: { contains: search, mode: "insensitive" } }, { firstName: { contains: search, mode: "insensitive" } },
    { lastName: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } },
    { phone: { contains: search, mode: "insensitive" } }, { employeeId: { contains: search, mode: "insensitive" } },
  ];
  const [rawTeachers, total] = await Promise.all([
    prisma.teacher.findMany({ where: whereClause, include: { subjects: { where: { isDeleted: false }, include: { subject: true } }, classes: { where: { isDeleted: false }, include: { class: true } } }, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.teacher.count({ where: whereClause }),
  ]);
  const data = rawTeachers.map((t: any) => ({ ...t, subjects: (t.subjects || []).filter((s: any) => s?.subject).map((s: any) => ({ ...s.subject, classId: s.subject.classId })), classes: (t.classes || []).filter((c: any) => c?.class).map((c: any) => c.class) }));
  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getTeacherById = async (id: string, tenantId: string, academicYearId?: string) => {
  const teacher = await prisma.teacher.findFirst({ where: { id, tenantId, isDeleted: false }, include: { subjects: { where: { isDeleted: false }, include: { subject: true } }, classes: { where: { isDeleted: false }, include: { class: true } } } });
  if (!teacher) return null;
  return {
    ...teacher,
    subjects: (teacher.subjects || []).filter((s: any) => s?.subject && (!academicYearId || s.subject.academicYearId === academicYearId)).map((s: any) => ({ ...s.subject, classId: s.subject.classId })),
    classes: (teacher.classes || []).filter((c: any) => c?.class && (!academicYearId || c.class.academicYearId === academicYearId)).map((c: any) => c.class),
  };
};

export const updateTeacher = async (id: string, data: any, tenantId: string) => {
  const existing = await prisma.teacher.findFirst({ where: { id, tenantId, isDeleted: false } });
  if (!existing) throw new Error("Teacher not found");
  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.teacher.findFirst({ where: { email: data.email, tenantId, isDeleted: false, id: { not: id }, ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}) } });
    if (emailExists) throw new Error("Email already in use by another teacher");
  }
  const yearId = data.academicYearId || existing.academicYearId;
  const year = await prisma.academicYear.findFirst({ where: { id: yearId, tenantId } });
  if (!year) throw new Error("Invalid academic year");
  const assignmentIds = assignmentSubjectIds(data), assignmentClasses = assignmentClassIds(data);
  const hasExactAssignments = Array.isArray(data.assignments);
  const subjectIds = data.subjectIds?.length ? data.subjectIds : assignmentIds;
  const classIds = data.classIds?.length ? data.classIds : assignmentClasses;
  if (subjectIds.length) {
    const subjects = await prisma.subject.findMany({ where: { id: { in: [...new Set(subjectIds)] }, tenantId, academicYearId: yearId }, select: { id: true, classId: true, academicYearId: true } });
    if (subjects.length !== [...new Set(subjectIds)].length) throw new Error("Invalid subject(s) for selected academic year");
  }
  if (classIds.length) {
    const classes = await prisma.class.findMany({ where: { id: { in: [...new Set(classIds)] }, tenantId, academicYearId: yearId }, select: { id: true } });
    if (classes.length !== [...new Set(classIds)].length) throw new Error("Invalid class(es) for selected academic year");
  }
  return prisma.$transaction(async tx => {
    const teacher = await tx.teacher.update({ where: { id }, data: {
      firstName: data.firstName || existing.firstName, lastName: data.lastName || existing.lastName,
      name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : existing.name,
      email: data.email || existing.email, phone: data.phone || existing.phone,
      gender: data.gender !== undefined ? data.gender : existing.gender, dob: data.dob ? new Date(data.dob) : existing.dob,
      employeeId: data.employeeId !== undefined ? data.employeeId : existing.employeeId,
      maritalStatus: data.maritalStatus !== undefined ? data.maritalStatus : existing.maritalStatus,
      photoUrl: data.photoUrl !== undefined ? data.photoUrl : existing.photoUrl, academicYearId: yearId,
    } });
    if (hasExactAssignments || data.subjectIds !== undefined) {
      const rows = (hasExactAssignments || data.subjectIds !== undefined)
        ? await resolveTeacherSubjectRows(tx, id, subjectIds, classIds, tenantId, yearId, data.assignments)
        : [];
      const desiredSubjectIds = new Set(rows.map((r: any) => r.subjectId));
      const current = await tx.teacherSubject.findMany({ where: { teacherId: id, isDeleted: false }, include: { subject: { select: { academicYearId: true } } } });
      for (const rel of current) {
        if (rel.subject?.academicYearId === yearId && !desiredSubjectIds.has(rel.subjectId)) await tx.teacherSubject.update({ where: { id: rel.id }, data: { isDeleted: true, deletedAt: new Date() } });
      }
      for (const row of rows) {
        const existingRel = await tx.teacherSubject.findFirst({ where: { teacherId: id, subjectId: row.subjectId } });
        if (existingRel) await tx.teacherSubject.update({ where: { id: existingRel.id }, data: { isDeleted: false, deletedAt: null, classId: row.classId } });
        else await tx.teacherSubject.create({ data: row });
      }
    }
    if (hasExactAssignments || data.classIds !== undefined) {
      const currentClasses = await tx.teacherClass.findMany({ where: { teacherId: id, isDeleted: false }, include: { class: { select: { academicYearId: true } } } });
      const desiredClassIds = new Set(classIds);
      for (const rel of currentClasses) if (rel.class?.academicYearId === yearId && !desiredClassIds.has(rel.classId)) await tx.teacherClass.update({ where: { id: rel.id }, data: { isDeleted: true, deletedAt: new Date() } });
      for (const classId of desiredClassIds) {
        const existingRel = await tx.teacherClass.findFirst({ where: { teacherId: id, classId } });
        if (existingRel) await tx.teacherClass.update({ where: { id: existingRel.id }, data: { isDeleted: false, deletedAt: null } });
        else await tx.teacherClass.create({ data: { teacherId: id, classId } });
      }
    }
    return teacher;
  });
};

export const deleteTeacher = async (id: string, tenantId: string, academicYearId?: string) => {
  const existing = await prisma.teacher.findFirst({ where: { id, tenantId, isDeleted: false, ...(academicYearId ? { academicYearId } : {}) } });
  if (!existing) throw new Error("Teacher not found");
  await prisma.$transaction(async tx => {
    await tx.teacher.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    await tx.teacherSubject.updateMany({ where: { teacherId: id, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
    await tx.teacherClass.updateMany({ where: { teacherId: id, isDeleted: false }, data: { isDeleted: true, deletedAt: new Date() } });
  });
};

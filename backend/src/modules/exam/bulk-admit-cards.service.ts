// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════
// bulk-admit-cards.service.ts — Fast bulk admit card fetch (all in one query)
// ═══════════════════════════════════════════════════════════════════════════

import prisma from '../../utils/prisma';

// ─────────────────────────────────────────────────
// SERVICE: Get all admit cards for an exam term (bulk)
// classId optional → filter by class
// Returns array of fully populated admit card objects
// ─────────────────────────────────────────────────
export const getBulkAdmitCardsService = async (data: {
  examName: string;
  classId?: string;
  tenantId: string;
}) => {
  const { examName, classId, tenantId } = data;

  // 1. Find all exams with this name for this tenant
  const exams = await prisma.exam.findMany({
    where: {
      name: examName,
      tenantId,
      isDeleted: false,
      ...(classId ? { classId } : {}),
    },
  });

  if (exams.length === 0) return [];
  const examIds = exams.map(e => e.id);

  // 2. Get all admit cards
  const admitCards = await prisma.admitCard.findMany({
    where: { examId: { in: examIds }, tenantId },
  });

  if (admitCards.length === 0) return [];

  const studentIds = [...new Set(admitCards.map(ac => ac.studentId))];

  // 3. Batch fetch all students. NOTE: class/section live on ENROLLMENT, not on
  // the Student model (Student has no classId/sectionId column). We pull the
  // student's active enrollment (with class + section) so the admit card shows
  // the correct class & section.
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNo: true,
      fatherName: true,
      motherName: true,
      dob: true,
      photoUrl: true,
      rollNumber: true,
      enrollments: {
        where: { isDeleted: false, status: "active" },
        select: {
          classId: true,
          sectionId: true,
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Build quick lookup: studentId -> { class, section } from active enrollment.
  const enrollmentByStudent: Record<string, { className: string; sectionName: string }> = {};
  for (const st of students as any[]) {
    const en = st.enrollments?.[0];
    enrollmentByStudent[st.id] = {
      className: en?.class?.name || "",
      sectionName: en?.section?.name || "",
    };
  }

  // 5. Batch fetch schedules for all exams
  const allSchedules = await prisma.examSchedule.findMany({
    where: { examId: { in: examIds }, tenantId },
    orderBy: { examDate: 'asc' },
  });

  const subjectIds = [...new Set(allSchedules.map(s => s.subjectId).filter(Boolean))];
  const roomIds = [...new Set(allSchedules.map(s => s.roomId).filter(Boolean))];

  const [subjects, rooms] = await Promise.all([
    prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } }),
    prisma.examRoom.findMany({ where: { id: { in: roomIds } }, select: { id: true, name: true } }),
  ]);

  // 6. Fetch tenant info once
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId },
    select: { name: true, address: true, phone: true, email: true, logoUrl: true },
  });

  // 7. Build schedule map per examId
  const schedulesByExam: Record<string, typeof allSchedules> = {};
  allSchedules.forEach(sch => {
    if (!schedulesByExam[sch.examId]) schedulesByExam[sch.examId] = [];
    schedulesByExam[sch.examId].push(sch);
  });

  // 7b. Batch fetch seating arrangements for all students across all schedules
  const allScheduleIds = allSchedules.map(s => s.id);
  const seatings = allScheduleIds.length > 0 && studentIds.length > 0
    ? await prisma.seatingArrangement.findMany({
        where: { examScheduleId: { in: allScheduleIds }, studentId: { in: studentIds }, tenantId, isDeleted: false },
      })
    : [];
  // Fetch seating room names
  const seatingRoomIds = [...new Set(seatings.map(s => s.roomId).filter(Boolean))];
  const seatingRooms = seatingRoomIds.length > 0
    ? await prisma.examRoom.findMany({ where: { id: { in: seatingRoomIds } }, select: { id: true, name: true } })
    : [];

  // 8. Assemble result
  return admitCards.map(ac => {
    const student = students.find(s => s.id === ac.studentId);
    const exam = exams.find(e => e.id === ac.examId);
    const enr = enrollmentByStudent[ac.studentId] || { className: "", sectionName: "" };
    const cls = enr.className ? { name: enr.className } : null;
    const sec = enr.sectionName ? { name: enr.sectionName } : null;
    const examSchedules = schedulesByExam[ac.examId] || [];

    // Find seating for this student (from any schedule of this exam)
    const examScheduleIds = examSchedules.map(s => s.id);
    const studentSeating = seatings.find(s => s.studentId === ac.studentId && examScheduleIds.includes(s.examScheduleId));
    const seatingRoom = studentSeating ? seatingRooms.find(r => r.id === studentSeating.roomId) : null;

    const schedule = examSchedules.map(sch => ({
      examDate: sch.examDate?.toISOString() || '',
      startTime: sch.startTime || '',
      endTime: sch.endTime || '',
      subject: subjects.find(s => s.id === sch.subjectId) || { name: '' },
      room: rooms.find(r => r.id === sch.roomId) || { name: '' },
    }));

    return {
      admitCard: ac,
      allottedRoom: seatingRoom?.name || '',
      seatNo: studentSeating?.seatNo || '',
      student: {
        name: student ? `${student.firstName} ${student.lastName}` : '',
        fatherName: student?.fatherName || '',
        motherName: student?.motherName || '',
        rollNo: (student as any)?.rollNumber || student?.admissionNo || '',
        admissionNo: student?.admissionNo || '',
        dob: student?.dob ? new Date(student.dob).toISOString() : '',
        photoUrl: student?.photoUrl || '',
        class: cls ? { name: cls.name } : null,
        section: sec ? { name: sec.name } : null,
      },
      exam: {
        name: exam?.name || '',
        type: exam?.type || '',
        class: cls ? { name: cls.name } : null,
        section: sec ? { name: sec.name } : null,
      },
      tenant: {
        name: tenant?.name || '',
        address: tenant?.address || '',
        phone: tenant?.phone || '',
        email: tenant?.email || '',
        logoUrl: tenant?.logoUrl || '',
      },
      schedule,
    };
  });
};

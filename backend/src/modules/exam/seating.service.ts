// @ts-nocheck
// seating.service.ts — Production Seating Engine

import prisma from '../../utils/prisma';

export interface BenchPatternEntry {
  benchSlot: number;
  classIds: string[];
}

export interface RoomConfig {
  roomId: string;
  rows: number;
  benches: number;
}

function sortStudentsByRollNo(students: { id: string; admissionNo?: string | null }[]) {
  return [...students].sort((a, b) => {
    const an = a.admissionNo || '';
    const bn = b.admissionNo || '';
    const na = parseInt(an.replace(/\D/g, ''), 10);
    const nb = parseInt(bn.replace(/\D/g, ''), 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return an.localeCompare(bn);
  });
}

export const generateInterleavedSeatingService = async (data: any) => {
  console.log('[SEATING] generateInterleavedSeatingService called', JSON.stringify({
    examScheduleId: data.examScheduleId,
    classIds: data.classIds,
    roomConfigs: data.roomConfigs,
    benchPattern: data.benchPattern,
    tenantId: data.tenantId,
  }, null, 2));

  const { examScheduleId, classIds, tenantId } = data;

  if (!examScheduleId) throw new Error('examScheduleId is required');
  if (!classIds || classIds.length === 0) throw new Error('No classes selected');
  if (!tenantId) throw new Error('tenantId is missing — auth issue');

  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId },
  });
  console.log('[SEATING] schedule:', schedule?.id || 'NOT FOUND');
  if (!schedule) throw new Error(`Exam schedule not found. ID: ${examScheduleId}, tenantId: ${tenantId}`);

  const exam = await prisma.exam.findFirst({
    where: { id: schedule.examId, tenantId },
  });
  console.log('[SEATING] exam:', exam?.id || 'NOT FOUND');
  if (!exam) throw new Error(`Exam not found for schedule: ${examScheduleId}`);

  const academicYearId = data.academicYearId || exam.academicYearId;

  // ─ Normalize room configs
  let roomConfigs: RoomConfig[] = [];
  if (data.roomConfigs && data.roomConfigs.length > 0) {
    roomConfigs = data.roomConfigs;
  } else if (data.roomIds && data.roomIds.length > 0) {
    roomConfigs = data.roomIds.map((id: string) => ({
      roomId: id, rows: data.rows || 5, benches: data.benchesPerRow || 10,
    }));
  }
  if (roomConfigs.length === 0) throw new Error('No rooms configured');

  // ─ Normalize bench pattern
  let benchPattern: BenchPatternEntry[] = [];
  if (data.benchPattern && data.benchPattern.length > 0) {
    benchPattern = data.benchPattern.filter((b: any) => b.classIds && b.classIds.length > 0);
  }
  if (benchPattern.length === 0) {
    for (let i = 0; i < classIds.length; i += 3)
      benchPattern.push({ benchSlot: Math.floor(i / 3) + 1, classIds: classIds.slice(i, i + 3) });
  }
  if (benchPattern.length === 0) throw new Error('Bench pattern is empty');

  // ─ Fetch rooms
  const roomIds = roomConfigs.map((r) => r.roomId);
  const rooms = await prisma.examRoom.findMany({ where: { id: { in: roomIds }, tenantId } });

  // ─ Fetch students per class
  const classQueues = new Map();

  for (const classId of classIds) {
    let studentIds: string[] = [];

    try {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          classId,
          ...(academicYearId ? { academicYearId } : {}),
          tenantId,
          isDeleted: false,
        },
        select: { studentId: true },
      });
      studentIds = enrollments.map((e: any) => e.studentId).filter(Boolean);
    } catch (e: any) {
      console.warn('[SEATING] Enrollment query failed:', e.message);
    }

    if (studentIds.length === 0) {
      try {
        const students = await prisma.student.findMany({
          where: { classId, tenantId, isDeleted: false },
          select: { id: true },
        });
        studentIds = students.map((s: any) => s.id);
      } catch (e: any) {
        console.warn('[SEATING] Student direct query failed:', e.message);
      }
    }

    if (studentIds.length > 0) {
      const studentData = await prisma.student.findMany({
        where: { id: { in: studentIds }, isDeleted: false },
        select: { id: true, admissionNo: true },
      });
      const sorted = sortStudentsByRollNo(
        studentIds.map((id: string) => ({
          id,
          admissionNo: studentData.find((s: any) => s.id === id)?.admissionNo || '',
        }))
      );
      classQueues.set(classId, sorted.map((s: any) => s.id));
    }
  }

  const totalStudents = Array.from(classQueues.values()).reduce((acc: number, q: any) => acc + q.length, 0);

  if (classQueues.size === 0)
    throw new Error(
      `No students found for any selected class. Classes checked: ${classIds.join(', ')}. ` +
      `Make sure students are enrolled in these classes (academicYearId: ${academicYearId}).`
    );

  const deleted = await prisma.seatingArrangement.deleteMany({ where: { examScheduleId, tenantId } });
  console.log('[SEATING] deleted old records:', deleted.count);

  const toCreate: any[] = [];

  for (const roomConfig of roomConfigs) {
    let patternIdx = 0;

    for (let row = 1; row <= roomConfig.rows; row++) {
      for (let bench = 1; bench <= roomConfig.benches; bench++) {
        const entry = benchPattern[patternIdx % benchPattern.length];
        patternIdx++;

        for (let sp = 0; sp < entry.classIds.length; sp++) {
          const classId = entry.classIds[sp];
          const queue = classQueues.get(classId);
          if (!queue || queue.length === 0) continue;

          const studentId = queue.shift();
          const seatCode = `R${row}-B${bench}-S${sp + 1}`;

          toCreate.push({
            examScheduleId,
            studentId,
            seatNo: seatCode,
            roomId: roomConfig.roomId,
            tenantId,
            isDeleted: false,
          });
        }
      }
    }
  }

  console.log('[SEATING] seats to create:', toCreate.length);

  if (toCreate.length === 0)
    throw new Error(
      `Seats created = 0. Students found: ${totalStudents}, Rooms: ${roomConfigs.length}. ` +
      `Check bench pattern classIds match selected classIds.`
    );

  await prisma.seatingArrangement.createMany({ data: toCreate });
  console.log('[SEATING] createMany done');

  const unassignedCount = Array.from(classQueues.values()).reduce((acc: number, q: any) => acc + q.length, 0);

  return {
    message: unassignedCount > 0
      ? `${toCreate.length} students assigned. ${unassignedCount} remaining — add more rooms/benches.`
      : `All ${toCreate.length} students assigned successfully!`,
    totalAssigned: toCreate.length,
    totalStudents,
    unassignedCount,
    rooms: roomConfigs.length,
  };
};

/**
 * Generate the same seating arrangement for ALL schedules of an exam at once.
 * The seating plan (rooms + bench pattern) is identical for every subject date.
 */
export const generateWholeExamSeatingService = async (data: any) => {
  const { examId, classIds, benchPattern, roomConfigs, tenantId } = data;

  if (!examId) throw new Error('examId is required');
  if (!classIds || classIds.length === 0) throw new Error('No classes selected');
  if (!tenantId) throw new Error('tenantId is missing');
  if (!roomConfigs || roomConfigs.length === 0) throw new Error('No rooms configured');
  if (!benchPattern || benchPattern.length === 0) throw new Error('Bench pattern is empty');

  const exam = await prisma.exam.findFirst({ where: { id: examId, tenantId, isDeleted: false } });
  if (!exam) throw new Error('Exam not found');

  const schedules = await prisma.examSchedule.findMany({
    where: { examId, tenantId, isDeleted: false },
  });
  if (schedules.length === 0) throw new Error('No schedules found for this exam');

  // Generate seating for the first schedule to get the seat plan
  const firstResult = await generateInterleavedSeatingService({
    examScheduleId: schedules[0].id,
    classIds,
    benchPattern,
    roomConfigs,
    tenantId,
    academicYearId: exam.academicYearId,
  });

  // Fetch the created seats for schedule[0] and clone them for remaining schedules
  const templateSeats = await prisma.seatingArrangement.findMany({
    where: { examScheduleId: schedules[0].id, tenantId, isDeleted: false },
  });

  let totalCreated = firstResult.totalAssigned;

  for (let i = 1; i < schedules.length; i++) {
    const scheduleId = schedules[i].id;

    await prisma.seatingArrangement.deleteMany({ where: { examScheduleId: scheduleId, tenantId } });

    const cloned = templateSeats.map((s: any) => ({
      examScheduleId: scheduleId,
      studentId: s.studentId,
      seatNo: s.seatNo,
      roomId: s.roomId,
      tenantId,
      isDeleted: false,
    }));

    await prisma.seatingArrangement.createMany({ data: cloned });
    totalCreated += cloned.length;
  }

  return {
    message: `Seating generated for all ${schedules.length} subject schedules!`,
    totalAssigned: firstResult.totalAssigned,
    schedulesProcessed: schedules.length,
    totalRecordsCreated: totalCreated,
    unassignedCount: firstResult.unassignedCount,
  };
};

/**
 * Get seating details enriched with studentName, fatherName, rollNo,
 * className, sectionName, roomName — for print use.
 */
export const getSeatingWithDetailsService = async (examScheduleId: string, tenantId: string) => {
  const seats = await prisma.seatingArrangement.findMany({ where: { examScheduleId, tenantId } });
  if (seats.length === 0) return [];

  const studentIds = [...new Set(seats.map((s: any) => s.studentId).filter(Boolean))];
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, admissionNo: true, fatherName: true },
  });

  // Fetch enrollment for className + sectionName
  const enrollments = studentIds.length > 0
    ? await prisma.enrollment.findMany({
        where: { studentId: { in: studentIds }, tenantId, isDeleted: false, status: 'active' },
        select: { studentId: true, classId: true, sectionId: true },
      })
    : [];

  const classIds = [...new Set(enrollments.map((e: any) => e.classId).filter(Boolean))];
  const clsList = classIds.length > 0
    ? await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
    : [];

  const sectionIds = [...new Set(enrollments.map((e: any) => e.sectionId).filter(Boolean))];
  const sectionList = sectionIds.length > 0
    ? await prisma.section.findMany({ where: { id: { in: sectionIds } }, select: { id: true, name: true } })
    : [];

  // Fetch room names
  const roomIds = [...new Set(seats.map((s: any) => s.roomId).filter(Boolean))];
  const roomsList = roomIds.length > 0
    ? await prisma.examRoom.findMany({ where: { id: { in: roomIds } }, select: { id: true, name: true } })
    : [];

  return seats.map((seat: any) => {
    const student = students.find((s: any) => s.id === seat.studentId);
    const enrollment = enrollments.find((e: any) => e.studentId === seat.studentId);
    const cls = clsList.find((c: any) => c.id === enrollment?.classId);
    const section = sectionList.find((sec: any) => sec.id === enrollment?.sectionId);
    const room = roomsList.find((r: any) => r.id === seat.roomId);
    return {
      ...seat,
      seatNumber: seat.seatNo,
      studentName: student ? `${student.firstName} ${student.lastName}` : null,
      fatherName: student?.fatherName || null,
      rollNo: student?.admissionNo || null,
      className: cls?.name || null,
      sectionName: section?.name || null,
      roomName: room?.name || null,
      roomId: seat.roomId,
      assigned: true,
    };
  });
};

/**
 * Get attendance register for a whole exam — all students assigned seats,
 * with all subject dates as columns.
 * Returns: { schedules: [{id, subjectName, examDate}], rooms: [{roomName, students: [...]}] }
 */
export const getAttendanceRegisterService = async (examId: string, tenantId: string) => {
  const exam = await prisma.exam.findFirst({ where: { id: examId, tenantId, isDeleted: false } });
  if (!exam) throw new Error('Exam not found');

  const schedules = await prisma.examSchedule.findMany({
    where: { examId, tenantId, isDeleted: false },
    orderBy: { examDate: 'asc' },
  });
  if (schedules.length === 0) throw new Error('No schedules for this exam');

  const subjectIds = [...new Set(schedules.map((s: any) => s.subjectId))];
  const subjects = await prisma.subject.findMany({ where: { id: { in: subjectIds } } });

  // Use first schedule's seating as the base room plan
  const firstScheduleId = schedules[0].id;
  const seats = await prisma.seatingArrangement.findMany({
    where: { examScheduleId: firstScheduleId, tenantId, isDeleted: false },
  });
  if (seats.length === 0) throw new Error('No seating found. Generate seating first.');

  const studentIds = [...new Set(seats.map((s: any) => s.studentId).filter(Boolean))];
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, admissionNo: true, fatherName: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: { in: studentIds }, tenantId, isDeleted: false, status: 'active' },
    select: { studentId: true, classId: true, sectionId: true },
  });

  const classIds = [...new Set(enrollments.map((e: any) => e.classId).filter(Boolean))];
  const clsList = classIds.length > 0
    ? await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
    : [];

  const sectionIds = [...new Set(enrollments.map((e: any) => e.sectionId).filter(Boolean))];
  const sectionList = sectionIds.length > 0
    ? await prisma.section.findMany({ where: { id: { in: sectionIds } }, select: { id: true, name: true } })
    : [];

  const roomIds = [...new Set(seats.map((s: any) => s.roomId).filter(Boolean))];
  const roomsList = await prisma.examRoom.findMany({ where: { id: { in: roomIds } }, select: { id: true, name: true } });

  // Group seats by room
  const roomMap: Record<string, any[]> = {};
  for (const seat of seats) {
    const rid = seat.roomId;
    if (!roomMap[rid]) roomMap[rid] = [];
    const student = students.find((s: any) => s.id === seat.studentId);
    const enrollment = enrollments.find((e: any) => e.studentId === seat.studentId);
    const cls = clsList.find((c: any) => c.id === enrollment?.classId);
    const section = sectionList.find((sec: any) => sec.id === enrollment?.sectionId);
    roomMap[rid].push({
      seatNo: seat.seatNo,
      studentId: seat.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : '',
      fatherName: student?.fatherName || '',
      rollNo: student?.admissionNo || '',
      className: cls?.name || '',
      sectionName: section?.name || '',
    });
  }

  const scheduleInfo = schedules.map((sch: any) => {
    const sub = subjects.find((s: any) => s.id === sch.subjectId);
    return {
      id: sch.id,
      subjectName: (sub as any)?.name || 'Unknown',
      examDate: sch.examDate,
    };
  });

  const rooms = roomIds.map(rid => {
    const room = roomsList.find((r: any) => r.id === rid);
    const students = (roomMap[rid] || []).sort((a: any, b: any) => {
      // Sort by seatNo string numerically
      return a.seatNo.localeCompare(b.seatNo, undefined, { numeric: true });
    });
    return { roomId: rid, roomName: room?.name || rid, students };
  });

  return { exam: { id: exam.id, name: exam.name }, schedules: scheduleInfo, rooms };
};

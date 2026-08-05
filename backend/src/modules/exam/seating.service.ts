// @ts-nocheck
// seating.service.ts — Production Seating Engine (DEBUG + FIXED)

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
  console.log('[SEATING] roomConfigs:', roomConfigs.length);

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
  console.log('[SEATING] benchPattern:', benchPattern.length, 'slots');

  // ─ Fetch rooms
  const roomIds = roomConfigs.map((r) => r.roomId);
  const rooms = await prisma.examRoom.findMany({ where: { id: { in: roomIds }, tenantId } });
  console.log('[SEATING] rooms found:', rooms.length, '/', roomIds.length);

  // ─ Fetch students per class
  const classQueues = new Map();

  for (const classId of classIds) {
    let studentIds: string[] = [];

    // Try 1: Enrollment model
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
      console.log(`[SEATING] classId ${classId}: ${studentIds.length} via Enrollment`);
    } catch (e: any) {
      console.warn('[SEATING] Enrollment query failed:', e.message);
    }

    // Try 2: Direct Student model
    if (studentIds.length === 0) {
      try {
        const students = await prisma.student.findMany({
          where: { classId, tenantId, isDeleted: false },
          select: { id: true },
        });
        studentIds = students.map((s: any) => s.id);
        console.log(`[SEATING] classId ${classId}: ${studentIds.length} via Student model`);
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
  console.log('[SEATING] total students across all classes:', totalStudents);

  if (classQueues.size === 0)
    throw new Error(
      `No students found for any selected class. Classes checked: ${classIds.join(', ')}. ` +
      `Make sure students are enrolled in these classes (academicYearId: ${academicYearId}).`
    );

  // ─ Delete old seating
  const deleted = await prisma.seatingArrangement.deleteMany({ where: { examScheduleId, tenantId } });
  console.log('[SEATING] deleted old records:', deleted.count);

  // ─ Generate seats
  // NOTE: Only include fields that exist in the SeatingArrangement Prisma schema.
  // Extra fields (seatNumber, roomName, classId, assigned, rowNo, benchNo, seatInBench, benchSlot)
  // were causing Prisma createMany() to fail silently with a validation error.
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

          // ✅ FIXED: Only valid Prisma schema fields — removed seatNumber, roomName,
          // classId, assigned, rowNo, benchNo, seatInBench, benchSlot
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

export const getSeatingWithDetailsService = async (examScheduleId: string, tenantId: string) => {
  const seats = await prisma.seatingArrangement.findMany({ where: { examScheduleId, tenantId } });
  if (seats.length === 0) return [];

  const studentIds = [...new Set(seats.map((s: any) => s.studentId).filter(Boolean))];
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, admissionNo: true },
  });

  // Fetch class info from enrollments since classId is no longer stored on the seat
  const enrollments = studentIds.length > 0
    ? await prisma.enrollment.findMany({
        where: { studentId: { in: studentIds }, tenantId, isDeleted: false, status: 'active' },
        select: { studentId: true, classId: true },
      })
    : [];

  const classIds = [...new Set(enrollments.map((e: any) => e.classId).filter(Boolean))];
  const clsList = classIds.length > 0
    ? await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
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
    const room = roomsList.find((r: any) => r.id === seat.roomId);
    return {
      ...seat,
      seatNumber: seat.seatNo,
      studentName: student ? `${student.firstName} ${student.lastName}` : null,
      rollNo: student?.admissionNo || null,
      className: cls?.name || null,
      roomName: room?.name || null,
      assigned: true,
    };
  });
};

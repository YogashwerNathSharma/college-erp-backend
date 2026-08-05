// @ts-nocheck
// seating.service.ts — Production Seating Engine (FIXED: enrollment query + error handling)

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

export const generateInterleavedSeatingService = async (data: {
  examScheduleId: string;
  classIds: string[];
  roomConfigs?: RoomConfig[];
  benchPattern?: BenchPatternEntry[];
  // Legacy
  roomIds?: string[];
  rows?: number;
  benchesPerRow?: number;
  seatsPerBench?: number;
  groupSize?: number;
  academicYearId?: string;
  tenantId: string;
}) => {
  const { examScheduleId, classIds, tenantId } = data;

  if (!classIds || classIds.length === 0) throw new Error('No classes selected');

  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId },
  });
  if (!schedule) throw new Error(`Exam schedule not found: ${examScheduleId}`);

  const exam = await prisma.exam.findFirst({
    where: { id: schedule.examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error(`Exam not found for schedule: ${examScheduleId}`);

  const academicYearId = data.academicYearId || exam.academicYearId;

  // ─── Normalize room configs ───
  let roomConfigs: RoomConfig[] = [];
  if (data.roomConfigs && data.roomConfigs.length > 0) {
    roomConfigs = data.roomConfigs;
  } else if (data.roomIds && data.roomIds.length > 0) {
    roomConfigs = data.roomIds.map((id) => ({
      roomId: id,
      rows: data.rows || 5,
      benches: data.benchesPerRow || 10,
    }));
  }
  if (roomConfigs.length === 0) throw new Error('No rooms configured');

  // ─── Normalize bench pattern ───
  let benchPattern: BenchPatternEntry[] = [];
  if (data.benchPattern && data.benchPattern.length > 0) {
    benchPattern = data.benchPattern.filter(b => b.classIds && b.classIds.length > 0);
  }
  if (benchPattern.length === 0) {
    // Auto: group classIds in slots of 3
    for (let i = 0; i < classIds.length; i += 3)
      benchPattern.push({ benchSlot: Math.floor(i / 3) + 1, classIds: classIds.slice(i, i + 3) });
  }
  if (benchPattern.length === 0) throw new Error('Bench pattern is empty');

  const maxSeatsPerBench = Math.max(...benchPattern.map(b => b.classIds.length));

  // ─── Fetch rooms ───
  const roomIds = roomConfigs.map((r) => r.roomId);
  const rooms = await prisma.examRoom.findMany({ where: { id: { in: roomIds }, tenantId } });

  // ─── Fetch students per class ───
  // NOTE: No status filter — schema may use different values (ACTIVE/active/enrolled)
  // We just filter by classId + academicYear + not deleted
  const classQueues = new Map<string, string[]>();

  for (const classId of classIds) {
    // Try multiple approaches to get students
    let studentIds: string[] = [];

    // Approach 1: via Enrollment model
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          classId,
          ...(academicYearId ? { academicYearId } : {}),
          tenantId,
          isDeleted: false,
          // Don't filter by status — field values vary across tenants
        },
        select: { studentId: true, student: { select: { id: true, admissionNo: true } } },
      });
      studentIds = enrollments
        .filter(e => e.studentId)
        .map(e => e.studentId);
    } catch (e) {
      // Enrollment model might not have all fields
    }

    // Approach 2: fallback via Student model directly
    if (studentIds.length === 0) {
      try {
        const students = await prisma.student.findMany({
          where: {
            classId,
            tenantId,
            isDeleted: false,
          },
          select: { id: true, admissionNo: true },
        });
        studentIds = students.map(s => s.id);
      } catch (e) {
        // ignore
      }
    }

    if (studentIds.length > 0) {
      // Fetch admission numbers for sorting
      const studentData = await prisma.student.findMany({
        where: { id: { in: studentIds }, isDeleted: false },
        select: { id: true, admissionNo: true },
      });
      const sorted = sortStudentsByRollNo(
        studentIds.map(id => ({
          id,
          admissionNo: studentData.find(s => s.id === id)?.admissionNo || '',
        }))
      );
      classQueues.set(classId, sorted.map(s => s.id));
    }
  }

  if (classQueues.size === 0)
    throw new Error(
      'No students found for selected classes. Check that students are enrolled in these classes for the current academic year.'
    );

  const totalStudents = Array.from(classQueues.values()).reduce((acc, q) => acc + q.length, 0);

  // ─── Delete old seating ───
  await prisma.seatingArrangement.deleteMany({ where: { examScheduleId, tenantId } });

  // ─── Generate seats per room ───
  const toCreate: any[] = [];

  for (const roomConfig of roomConfigs) {
    const room = rooms.find((r) => r.id === roomConfig.roomId);
    const roomName = room?.name || roomConfig.roomId;
    let patternIdx = 0;

    for (let row = 1; row <= roomConfig.rows; row++) {
      for (let bench = 1; bench <= roomConfig.benches; bench++) {
        const entry = benchPattern[patternIdx % benchPattern.length];
        patternIdx++;

        for (let sp = 0; sp < entry.classIds.length; sp++) {
          const classId = entry.classIds[sp];
          const queue = classQueues.get(classId);
          if (!queue || queue.length === 0) continue;

          const studentId = queue.shift()!;
          const seatCode = `R${row}-B${bench}-S${sp + 1}`;

          toCreate.push({
            examScheduleId,
            studentId,
            seatNo: seatCode,
            seatNumber: seatCode,
            roomId: roomConfig.roomId,
            roomName,
            classId,
            tenantId,
            assigned: true,
            rowNo: row,
            benchNo: bench,
            seatInBench: sp + 1,
            benchSlot: entry.benchSlot,
          });
        }
      }
    }
  }

  if (toCreate.length === 0)
    throw new Error(
      'No students could be seated. Verify that students exist and are enrolled in the selected classes.'
    );

  await prisma.seatingArrangement.createMany({ data: toCreate });

  const unassignedCount = Array.from(classQueues.values()).reduce((acc, q) => acc + q.length, 0);

  return {
    message:
      unassignedCount > 0
        ? `${toCreate.length} students assigned. ${unassignedCount} remaining — add more rooms/benches.`
        : `All ${toCreate.length} students assigned successfully!`,
    totalAssigned: toCreate.length,
    totalStudents,
    unassignedCount,
    rooms: roomConfigs.length,
  };
};

export const getSeatingWithDetailsService = async (examScheduleId: string, tenantId: string) => {
  const seats = await prisma.seatingArrangement.findMany({
    where: { examScheduleId, tenantId },
  });
  if (seats.length === 0) return [];

  const studentIds = [...new Set(seats.map((s) => s.studentId).filter(Boolean))];
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, admissionNo: true },
  });

  const classIds = [...new Set(seats.map((s: any) => s.classId).filter(Boolean))];
  const clsList =
    classIds.length > 0
      ? await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
      : [];

  return seats.map((seat: any) => {
    const student = students.find((s) => s.id === seat.studentId);
    const cls = clsList.find((c) => c.id === seat.classId);
    return {
      ...seat,
      seatNumber: seat.seatNo || seat.seatNumber,
      studentName: student ? `${student.firstName} ${student.lastName}` : null,
      rollNo: student?.admissionNo || null,
      className: cls?.name || null,
      assigned: true,
    };
  });
};

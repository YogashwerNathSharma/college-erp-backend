// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════
// seating.service.ts — FIXED Interleaved Seating
// Pattern: Class 1,2,3 → Bench 1 | Class 4,5,6 → Bench 2 | repeat
// ═══════════════════════════════════════════════════════════════════════════

import prisma from '../../utils/prisma';

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build interleaved assignments:
// group[0] = [Cls1, Cls2, Cls3] → Bench offset 0, 2, 4...
// group[1] = [Cls4, Cls5, Cls6] → Bench offset 1, 3, 5...
function buildInterleavedSeats(
  studentsByClass: Map<string, string[]>,
  totalRows: number,
  benchesPerRow: number,
  seatsPerBench: number,
  groupSize: number
) {
  const classOrder = Array.from(studentsByClass.keys());
  const ptrs: Record<string, number> = {};
  classOrder.forEach(c => (ptrs[c] = 0));
  const totalClasses = classOrder.length;
  const numGroups = Math.ceil(totalClasses / groupSize);

  const result: {
    seatNo: string;
    studentId: string;
    classId: string;
    rowNo: number;
    benchNo: number;
    seatInBench: number;
  }[] = [];

  let globalBench = 0;
  for (let row = 1; row <= totalRows; row++) {
    for (let bench = 1; bench <= benchesPerRow; bench++, globalBench++) {
      const groupIdx = globalBench % numGroups;
      const startCls = (groupIdx * groupSize) % totalClasses;
      const benchClasses: string[] = [];
      for (let k = 0; k < seatsPerBench; k++) {
        benchClasses.push(classOrder[(startCls + k) % totalClasses]);
      }
      for (let s = 0; s < seatsPerBench; s++) {
        const classId = benchClasses[s % benchClasses.length];
        const students = studentsByClass.get(classId) || [];
        const ptr = ptrs[classId];
        if (ptr >= students.length) continue;
        const studentId = students[ptr];
        ptrs[classId] = ptr + 1;
        result.push({
          seatNo: `R${row}-B${bench}-S${s + 1}`,
          studentId,
          classId,
          rowNo: row,
          benchNo: bench,
          seatInBench: s + 1,
        });
      }
    }
  }
  return result;
}

export const generateInterleavedSeatingService = async (data: {
  examScheduleId: string;
  roomIds: string[];
  classIds: string[];
  rows: number;
  benchesPerRow: number;
  seatsPerBench?: number;
  groupSize?: number;
  academicYearId?: string;
  tenantId: string;
}) => {
  const {
    examScheduleId,
    roomIds,
    classIds,
    rows,
    benchesPerRow,
    seatsPerBench = 3,
    groupSize = 3,
    tenantId,
  } = data;

  const schedule = await prisma.examSchedule.findFirst({ where: { id: examScheduleId, tenantId } });
  if (!schedule) throw new Error('Exam schedule not found');

  const exam = await prisma.exam.findFirst({ where: { id: schedule.examId, tenantId, isDeleted: false } });
  if (!exam) throw new Error('Exam not found');

  const academicYearId = data.academicYearId || exam.academicYearId;

  const rooms = await prisma.examRoom.findMany({ where: { id: { in: roomIds }, tenantId } });

  // Fetch enrolled students per class
  const studentsByClass: Map<string, string[]> = new Map();
  for (const classId of classIds) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId,
        ...(academicYearId ? { academicYearId } : {}),
        tenantId,
        status: 'active',
        isDeleted: false,
      },
      select: { studentId: true },
    });
    const ids = enrollments.map(e => e.studentId);
    if (ids.length > 0) studentsByClass.set(classId, shuffle(ids));
  }

  if (studentsByClass.size === 0) throw new Error('No enrolled students found for selected classes');

  // Delete old seating
  await prisma.seatingArrangement.deleteMany({ where: { examScheduleId, tenantId } });

  // Build assignments across all rooms combined
  const totalRows = rows * roomIds.length;
  const allAssignments = buildInterleavedSeats(studentsByClass, totalRows, benchesPerRow, seatsPerBench, groupSize);

  // Distribute to rooms
  const seatsPerRoom = rows * benchesPerRow * seatsPerBench;
  const toCreate: any[] = [];
  let ai = 0;

  for (let ri = 0; ri < roomIds.length; ri++) {
    const roomId = roomIds[ri];
    const room = rooms.find(r => r.id === roomId);
    const roomName = room?.name || `Room ${ri + 1}`;

    for (let i = 0; i < seatsPerRoom && ai < allAssignments.length; i++, ai++) {
      const a = allAssignments[ai];
      const localRow = Math.floor(i / (benchesPerRow * seatsPerBench)) + 1;
      const localBench = Math.floor((i % (benchesPerRow * seatsPerBench)) / seatsPerBench) + 1;
      const localSeat = (i % seatsPerBench) + 1;

      toCreate.push({
        examScheduleId,
        studentId: a.studentId,
        // MongoDB is flexible — write both field names for compatibility
        seatNo: `R${localRow}-B${localBench}-S${localSeat}`,
        seatNumber: `R${localRow}-B${localBench}-S${localSeat}`,
        roomId,
        roomName,
        classId: a.classId,
        tenantId,
        assigned: true,
        rowNo: localRow,
        benchNo: localBench,
        seatInBench: localSeat,
      });
    }
  }

  if (toCreate.length > 0) {
    await prisma.seatingArrangement.createMany({ data: toCreate });
  }

  return {
    message: 'Seating generated successfully',
    totalAssigned: toCreate.length,
    rooms: roomIds.length,
    rows,
    benchesPerRow,
    seatsPerBench,
  };
};

export const getSeatingWithDetailsService = async (examScheduleId: string, tenantId: string) => {
  const seats = await prisma.seatingArrangement.findMany({
    where: { examScheduleId, tenantId },
  });

  if (seats.length === 0) return [];

  const studentIds = seats.map(s => s.studentId).filter(Boolean);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, admissionNo: true },
  });

  const classIds = [...new Set(seats.map(s => s.classId).filter(Boolean))];
  const classes = classIds.length > 0 ? await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: { id: true, name: true },
  }) : [];

  return seats.map(seat => {
    const student = students.find(s => s.id === seat.studentId);
    const cls = classes.find(c => c.id === (seat as any).classId);
    return {
      ...seat,
      seatNumber: (seat as any).seatNo || (seat as any).seatNumber || seat.seatNo,
      studentName: student ? `${student.firstName} ${student.lastName}` : null,
      rollNo: student?.admissionNo || null,
      className: cls?.name || null,
      assigned: true,
    };
  });
};

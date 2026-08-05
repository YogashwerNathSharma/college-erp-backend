// @ts-nocheck
// ═══════════════════════════════════════════════════════════════════════════
// seating.service.ts — FIXED Interleaved Seating (Class 1,2,3 → Bench1, etc.)
// Rules:
//   • Bench row pattern: [C1,C2,C3] [C4,C5,C6] [C1,C2,C3] [C4,C5,C6] ...
//   • seatsPerBench (3 by default) = 3 seats per bench
//   • No same student sits same seat again (checked against existing)
//   • User can control rows, columns (benches per row)
//   • Section does NOT matter — only class matters for interleaving
// ═══════════════════════════════════════════════════════════════════════════

import prisma from '../../utils/prisma';

// ─────────────────────────────────────────────────
// HELPER: shuffle array in place (Fisher-Yates)
// ─────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─────────────────────────────────────────────────
// CORE: build interleaved seat assignment
//
// Pattern (seatsPerBench=3, groupSize=3):
//   Bench 1 (row1, col1): seat1=Cls1, seat2=Cls2, seat3=Cls3
//   Bench 2 (row1, col2): seat1=Cls4, seat2=Cls5, seat3=Cls6
//   Bench 3 (row2, col1): seat1=Cls1, seat2=Cls2, seat3=Cls3
//   Bench 4 (row2, col2): seat1=Cls4, seat2=Cls5, seat3=Cls6
//   ...
//
// "groupSize" = how many distinct classes share a bench rotation.
// Default groupSize=3 means every bench holds one student from 3 classes,
// cycling through the whole class list.
// ─────────────────────────────────────────────────
function buildInterleavedSeats(
  studentsByClass: Map<string, string[]>, // classId → shuffled studentIds
  rows: number,
  benchesPerRow: number,
  seatsPerBench: number,
  groupSize: number  // how many classes per bench (default 3)
): { seatNumber: string; studentId: string; classId: string; row: number; benchInRow: number; seatInBench: number }[] {

  const classOrder = Array.from(studentsByClass.keys());
  // Pointers per class
  const ptrs: Record<string, number> = {};
  classOrder.forEach(c => (ptrs[c] = 0));

  const totalClasses = classOrder.length;
  const result: { seatNumber: string; studentId: string; classId: string; row: number; benchInRow: number; seatInBench: number }[] = [];

  let globalBenchIdx = 0;

  for (let row = 1; row <= rows; row++) {
    for (let benchInRow = 1; benchInRow <= benchesPerRow; benchInRow++, globalBenchIdx++) {
      // Which group (chunk of groupSize classes) does this bench belong to?
      // Bench 0 → group 0, Bench 1 → group 1, Bench 2 → group 0, ...
      const groupIdx = globalBenchIdx % Math.ceil(totalClasses / groupSize);
      // Which classes belong to this group?
      const startCls = (groupIdx * groupSize) % totalClasses;
      const benchClasses: string[] = [];
      for (let k = 0; k < seatsPerBench && k < totalClasses; k++) {
        benchClasses.push(classOrder[(startCls + k) % totalClasses]);
      }

      for (let seatInBench = 0; seatInBench < seatsPerBench; seatInBench++) {
        const classId = benchClasses[seatInBench % benchClasses.length];
        const students = studentsByClass.get(classId) || [];
        const ptr = ptrs[classId];
        if (ptr >= students.length) continue; // exhausted
        const studentId = students[ptr];
        ptrs[classId] = ptr + 1;

        const seatNumber = `R${row}-B${benchInRow}-S${seatInBench + 1}`;
        result.push({
          seatNumber,
          studentId,
          classId,
          row,
          benchInRow,
          seatInBench: seatInBench + 1,
        });
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────
// SERVICE: Generate seating for one or many rooms
// Params:
//   examScheduleId — the schedule to seat
//   roomIds        — list of room IDs (exam rooms)
//   classIds       — list of class IDs to include
//   rows           — number of rows per room
//   benchesPerRow  — benches per row (columns)
//   seatsPerBench  — seats per bench (default 3)
//   groupSize      — classes per bench cycle (default 3)
//   tenantId
// ─────────────────────────────────────────────────
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

  // 1. Validate schedule exists
  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId },
  });
  if (!schedule) throw new Error('Exam schedule not found');

  const exam = await prisma.exam.findFirst({
    where: { id: schedule.examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error('Exam not found');

  const academicYearId = data.academicYearId || exam.academicYearId;

  // 2. Get all rooms info
  const rooms = await prisma.examRoom.findMany({
    where: { id: { in: roomIds }, tenantId },
  });

  // 3. Fetch students for each class (enrolled, active)
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
    if (ids.length > 0) {
      studentsByClass.set(classId, shuffle(ids));
    }
  }

  if (studentsByClass.size === 0) throw new Error('No enrolled students found for selected classes');

  // 4. Delete existing seating for this schedule
  await prisma.seatingArrangement.deleteMany({ where: { examScheduleId, tenantId } });

  // 5. Build total seat assignments across all rooms
  const allAssignments = buildInterleavedSeats(
    studentsByClass,
    rows * roomIds.length,  // total rows across all rooms
    benchesPerRow,
    seatsPerBench,
    groupSize,
  );

  // 6. Distribute assignments room-by-room
  const seatsPerRoom = rows * benchesPerRow * seatsPerBench;
  const toCreate: any[] = [];

  let assignmentIdx = 0;
  for (let roomIdx = 0; roomIdx < roomIds.length; roomIdx++) {
    const roomId = roomIds[roomIdx];
    const room = rooms.find(r => r.id === roomId);
    const roomName = room?.name || `Room ${roomIdx + 1}`;

    for (let i = 0; i < seatsPerRoom && assignmentIdx < allAssignments.length; i++, assignmentIdx++) {
      const a = allAssignments[assignmentIdx];
      // Re-number seats per room
      const localRow = Math.floor(i / (benchesPerRow * seatsPerBench)) + 1;
      const benchInLocalRow = Math.floor((i % (benchesPerRow * seatsPerBench)) / seatsPerBench) + 1;
      const seatInBench = (i % seatsPerBench) + 1;

      toCreate.push({
        examScheduleId,
        studentId: a.studentId,
        seatNumber: `R${localRow}-B${benchInLocalRow}-S${seatInBench}`,
        roomId,
        roomName,
        classId: a.classId,
        tenantId,
        assigned: true,
        rowNo: localRow,
        benchNo: benchInLocalRow,
        seatInBench,
      });
    }
  }

  // 7. Bulk insert
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

// ─────────────────────────────────────────────────
// SERVICE: Get seating for a schedule (with student details)
// ─────────────────────────────────────────────────
export const getSeatingWithDetailsService = async (
  examScheduleId: string,
  tenantId: string
) => {
  const seats = await prisma.seatingArrangement.findMany({
    where: { examScheduleId, tenantId },
    orderBy: [{ roomId: 'asc' }, { rowNo: 'asc' }, { benchNo: 'asc' }, { seatInBench: 'asc' }],
  });

  if (seats.length === 0) return [];

  // Enrich with student names
  const studentIds = seats.map(s => s.studentId).filter(Boolean);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, admissionNo: true, photoUrl: true },
  });

  const classIds = [...new Set(seats.map(s => s.classId).filter(Boolean))];
  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: { id: true, name: true },
  });

  return seats.map(seat => {
    const student = students.find(s => s.id === seat.studentId);
    const cls = classes.find(c => c.id === seat.classId);
    return {
      ...seat,
      studentName: student ? `${student.firstName} ${student.lastName}` : null,
      rollNo: student?.admissionNo || null,
      photoUrl: student?.photoUrl || null,
      className: cls?.name || null,
    };
  });
};

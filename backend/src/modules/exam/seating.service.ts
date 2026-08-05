// @ts-nocheck
// seating.service.ts — Interleaved Seating (FIXED)
// Pattern per room: Bench1→[Cls1,Cls2,Cls3] | Bench2→[Cls4,Cls5,Cls6] | Bench3→[Cls1,Cls2,Cls3] ...

import prisma from '../../utils/prisma';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId },
  });
  if (!schedule) throw new Error('Exam schedule not found');

  const exam = await prisma.exam.findFirst({
    where: { id: schedule.examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error('Exam not found');

  const academicYearId = data.academicYearId || exam.academicYearId;

  const rooms = await prisma.examRoom.findMany({
    where: { id: { in: roomIds }, tenantId },
  });

  // ─── Fetch enrolled students per class (shuffled) ───
  const studentQueues: Map<string, string[]> = new Map();
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
    const ids = shuffle(enrollments.map((e) => e.studentId));
    if (ids.length > 0) studentQueues.set(classId, ids);
  }

  const classOrder = classIds.filter((id) => studentQueues.has(id));
  if (classOrder.length === 0)
    throw new Error('No enrolled students found for selected classes');

  const numGroups = Math.ceil(classOrder.length / groupSize);

  // ─── Delete old seating ───
  await prisma.seatingArrangement.deleteMany({
    where: { examScheduleId, tenantId },
  });

  // ─── Assign per-room independently ───
  // Shared queues across rooms so students aren't duplicated
  const toCreate: any[] = [];

  for (let ri = 0; ri < roomIds.length; ri++) {
    const roomId = roomIds[ri];
    const room = rooms.find((r) => r.id === roomId);
    const roomName = room?.name || `Room ${ri + 1}`;

    for (let row = 1; row <= rows; row++) {
      for (let bench = 1; bench <= benchesPerRow; bench++) {
        // Determine which group this bench belongs to (0-indexed)
        const groupIdx = (bench - 1) % numGroups;
        const startCls = groupIdx * groupSize;

        for (let seat = 1; seat <= seatsPerBench; seat++) {
          // Class index for this seat position
          const clsIdx = (startCls + seat - 1) % classOrder.length;
          const classId = classOrder[clsIdx];
          const queue = studentQueues.get(classId);
          if (!queue || queue.length === 0) continue;

          const studentId = queue.shift()!;
          const seatLabel = `R${row}-B${bench}-S${seat}`;

          toCreate.push({
            examScheduleId,
            studentId,
            seatNo: seatLabel,
            seatNumber: seatLabel,
            roomId,
            roomName,
            classId,
            tenantId,
            assigned: true,
            rowNo: row,
            benchNo: bench,
            seatInBench: seat,
          });
        }
      }
    }
  }

  if (toCreate.length === 0) throw new Error('No students could be assigned');

  await prisma.seatingArrangement.createMany({ data: toCreate });

  return {
    message: 'Seating generated successfully',
    totalAssigned: toCreate.length,
    rooms: roomIds.length,
    rows,
    benchesPerRow,
    seatsPerBench,
  };
};

export const getSeatingWithDetailsService = async (
  examScheduleId: string,
  tenantId: string
) => {
  const seats = await prisma.seatingArrangement.findMany({
    where: { examScheduleId, tenantId },
  });
  if (seats.length === 0) return [];

  const studentIds = seats.map((s) => s.studentId).filter(Boolean);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, admissionNo: true },
  });

  const classIds = [...new Set(seats.map((s: any) => s.classId).filter(Boolean))];
  const classes =
    classIds.length > 0
      ? await prisma.class.findMany({
          where: { id: { in: classIds } },
          select: { id: true, name: true },
        })
      : [];

  return seats.map((seat: any) => {
    const student = students.find((s) => s.id === seat.studentId);
    const cls = classes.find((c) => c.id === seat.classId);
    return {
      ...seat,
      seatNumber: seat.seatNo || seat.seatNumber,
      studentName: student
        ? `${student.firstName} ${student.lastName}`
        : null,
      rollNo: student?.admissionNo || null,
      className: cls?.name || null,
      assigned: true,
    };
  });
};

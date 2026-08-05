import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("exams").order("desc").collect(),
});

export const getById = query({
  args: { id: v.id("exams") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const create = mutation({
  args: {
    name: v.string(),
    date: v.string(),
    academicYear: v.string(),
    classes: v.array(v.string()),
    studentsPerSeat: v.number(),
    totalHalls: v.number(),
    seatsPerRow: v.number(),
    rowsPerHall: v.number(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("exams", { ...args, status: "draft", createdAt: new Date().toISOString() }),
});

export const update = mutation({
  args: {
    id: v.id("exams"),
    name: v.optional(v.string()),
    date: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    classes: v.optional(v.array(v.string())),
    studentsPerSeat: v.optional(v.number()),
    totalHalls: v.optional(v.number()),
    seatsPerRow: v.optional(v.number()),
    rowsPerHall: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("exams") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam", (q) => q.eq("examId", args.id))
      .take(500);
    for (const alloc of allocations) await ctx.db.delete(alloc._id);
    const remaining = await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam", (q) => q.eq("examId", args.id))
      .first();
    if (!remaining) await ctx.db.delete(args.id);
  },
});

export const generateSeating = mutation({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("Exam not found");

    const existing = await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .take(500);
    for (const alloc of existing) await ctx.db.delete(alloc._id);

    type StudentRow = {
      _id: Id<"students">;
      admissionNo: string;
      firstName: string;
      lastName: string;
      className: string;
      section?: string;
      rollNo?: string;
    };

    const allStudents = await ctx.db
      .query("students")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const studentsByClass: Record<string, StudentRow[]> = {};
    for (const className of exam.classes) {
      studentsByClass[className] = allStudents
        .filter((s) => s.className === className)
        .map((s) => ({
          _id: s._id,
          admissionNo: s.admissionNo,
          firstName: s.firstName,
          lastName: s.lastName,
          className: s.className ?? className,
          section: s.section,
          rollNo: s.rollNo,
        }));
    }

    const queues = exam.classes.map((c) => [...(studentsByClass[c] ?? [])]);
    const interleaved: StudentRow[] = [];
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (const queue of queues) {
        if (queue.length > 0) { interleaved.push(queue.shift()!); hasMore = true; }
      }
    }

    if (interleaved.length === 0) {
      await ctx.db.patch(args.examId, { status: "draft" });
      return { allocated: 0 };
    }

    let studentIndex = 0;
    for (let hall = 1; hall <= exam.totalHalls; hall++) {
      let globalSeat = 1;
      for (let row = 1; row <= exam.rowsPerHall; row++) {
        for (let seat = 1; seat <= exam.seatsPerRow; seat++) {
          for (let sp = 0; sp < exam.studentsPerSeat; sp++) {
            if (studentIndex >= interleaved.length) break;
            const s = interleaved[studentIndex++];
            await ctx.db.insert("seatAllocations", {
              examId: args.examId, studentId: s._id,
              hallNo: hall, rowNo: row, seatNo: seat, globalSeatNo: globalSeat,
              admissionNo: s.admissionNo,
              studentName: `${s.firstName} ${s.lastName}`,
              className: s.className, section: s.section, rollNo: s.rollNo,
            });
          }
          globalSeat++;
          if (studentIndex >= interleaved.length) break;
        }
        if (studentIndex >= interleaved.length) break;
      }
      if (studentIndex >= interleaved.length) break;
    }

    await ctx.db.patch(args.examId, { status: "published" });
    return { allocated: studentIndex };
  },
});

export const getAllocations = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) =>
    ctx.db.query("seatAllocations").withIndex("by_exam", (q) => q.eq("examId", args.examId)).collect(),
});

export const getAllocationsByHall = query({
  args: { examId: v.id("exams"), hallNo: v.number() },
  handler: async (ctx, args) =>
    ctx.db.query("seatAllocations")
      .withIndex("by_exam_hall", (q) => q.eq("examId", args.examId).eq("hallNo", args.hallNo))
      .collect(),
});

export const getStudentSeat = query({
  args: { examId: v.id("exams"), studentId: v.id("students") },
  handler: async (ctx, args) =>
    ctx.db.query("seatAllocations")
      .withIndex("by_exam_student", (q) => q.eq("examId", args.examId).eq("studentId", args.studentId))
      .first(),
});

export const getAllocationsByClass = query({
  args: { examId: v.id("exams"), className: v.string() },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();
    return allocations.filter((a) => a.className === args.className);
  },
});

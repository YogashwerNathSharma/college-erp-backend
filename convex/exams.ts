import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// List all exams
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("exams").order("desc").collect();
  },
});

// Get single exam
export const getById = query({
  args: { id: v.id("exams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create exam
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
  handler: async (ctx, args) => {
    return await ctx.db.insert("exams", {
      ...args,
      status: "draft",
      createdAt: new Date().toISOString(),
    });
  },
});

// Update exam
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

// Delete exam and all its allocations
export const remove = mutation({
  args: { id: v.id("exams") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam", (q) => q.eq("examId", args.id))
      .collect();
    for (const alloc of allocations) {
      await ctx.db.delete(alloc._id);
    }
    await ctx.db.delete(args.id);
  },
});

// Generate seating plan: interleave students so same class doesn't share a seat number
export const generateSeating = mutation({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("Exam not found");

    // Delete existing allocations
    const existing = await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();
    for (const alloc of existing) {
      await ctx.db.delete(alloc._id);
    }

    // Fetch students for each class
    const studentsByClass: Record<string, Array<{
      _id: Id<"students">;
      admissionNo: string;
      firstName: string;
      lastName: string;
      className: string;
      section?: string;
      rollNo?: string;
    }>> = {};

    for (const className of exam.classes) {
      const students = await ctx.db
        .query("students")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .filter((q) =>
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.eq(q.field("className"), className)
          )
        )
        .collect();
      studentsByClass[className] = students.map((s) => ({
        _id: s._id,
        admissionNo: s.admissionNo,
        firstName: s.firstName,
        lastName: s.lastName,
        className: s.className ?? className,
        section: s.section,
        rollNo: s.rollNo,
      }));
    }

    // Interleave students from different classes
    // Round-robin across classes to ensure no two consecutive seats are same class
    const queues = exam.classes.map((c) => [...(studentsByClass[c] ?? [])]);
    const interleaved: Array<{
      _id: Id<"students">;
      admissionNo: string;
      firstName: string;
      lastName: string;
      className: string;
      section?: string;
      rollNo?: string;
    }> = [];

    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (const queue of queues) {
        if (queue.length > 0) {
          interleaved.push(queue.shift()!);
          hasMore = true;
        }
      }
    }

    // Distribute interleaved students across halls
    const seatsPerHall = exam.seatsPerRow * exam.rowsPerHall;
    let studentIndex = 0;

    for (let hall = 1; hall <= exam.totalHalls; hall++) {
      let globalSeat = 1;

      for (let row = 1; row <= exam.rowsPerHall; row++) {
        for (let seat = 1; seat <= exam.seatsPerRow; seat++) {
          // Place studentsPerSeat students at this bench position
          for (let sp = 0; sp < exam.studentsPerSeat; sp++) {
            if (studentIndex >= interleaved.length) break;
            const s = interleaved[studentIndex++];
            await ctx.db.insert("seatAllocations", {
              examId: args.examId,
              studentId: s._id,
              hallNo: hall,
              rowNo: row,
              seatNo: seat,
              globalSeatNo: globalSeat,
              admissionNo: s.admissionNo,
              studentName: `${s.firstName} ${s.lastName}`,
              className: s.className,
              section: s.section,
              rollNo: s.rollNo,
            });
          }
          globalSeat++;
          if (studentIndex >= interleaved.length) break;
        }
        if (studentIndex >= interleaved.length) break;
      }

      if (studentIndex >= interleaved.length) break;
      void seatsPerHall; // used for capacity awareness
    }

    // Mark exam as published
    await ctx.db.patch(args.examId, { status: "published" });

    return { allocated: studentIndex };
  },
});

// Get all allocations for an exam
export const getAllocations = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();
  },
});

// Get allocations for a specific hall
export const getAllocationsByHall = query({
  args: { examId: v.id("exams"), hallNo: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam_hall", (q) =>
        q.eq("examId", args.examId).eq("hallNo", args.hallNo)
      )
      .collect();
  },
});

// Get a student's seat for an exam (for admit card)
export const getStudentSeat = query({
  args: { examId: v.id("exams"), studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seatAllocations")
      .withIndex("by_exam_student", (q) =>
        q.eq("examId", args.examId).eq("studentId", args.studentId)
      )
      .first();
  },
});

// Get all seats for students of a specific class in an exam
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

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// List students with pagination and search
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    classId: v.optional(v.string()),
    approvalStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("students");

    if (args.status) {
      return await q
        .withIndex("by_status", (qi) => qi.eq("status", args.status!))
        .filter((qi) => qi.neq(qi.field("isDeleted"), true))
        .paginate(args.paginationOpts);
    }

    if (args.approvalStatus) {
      return await q
        .withIndex("by_approval_status", (qi) => qi.eq("approvalStatus", args.approvalStatus!))
        .filter((qi) => qi.neq(qi.field("isDeleted"), true))
        .paginate(args.paginationOpts);
    }

    return await q
      .filter((qi) => qi.neq(qi.field("isDeleted"), true))
      .paginate(args.paginationOpts);
  },
});

// Get dashboard stats
export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allStudents = await ctx.db
      .query("students")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const total = allStudents.length;
    const active = allStudents.filter((s) => s.status === "active").length;
    const pending = allStudents.filter((s) => s.approvalStatus === "pending").length;
    const transferred = allStudents.filter((s) => s.status === "transferred").length;

    // Gender breakdown
    const male = allStudents.filter((s) => s.gender === "Male").length;
    const female = allStudents.filter((s) => s.gender === "Female").length;

    // Class-wise count
    const classCounts: Record<string, number> = {};
    for (const s of allStudents) {
      if (s.className) {
        classCounts[s.className] = (classCounts[s.className] ?? 0) + 1;
      }
    }

    // Recent admissions (last 5)
    const recent = allStudents
      .filter((s) => s.admissionDate)
      .sort((a, b) => (b.admissionDate ?? "").localeCompare(a.admissionDate ?? ""))
      .slice(0, 5);

    return {
      total,
      active,
      pending,
      transferred,
      male,
      female,
      classCounts,
      recent,
    };
  },
});

// Get single student
export const getById = query({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create student
export const create = mutation({
  args: {
    admissionNo: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    religion: v.optional(v.string()),
    caste: v.optional(v.string()),
    nationality: v.optional(v.string()),
    motherTongue: v.optional(v.string()),
    classId: v.optional(v.string()),
    className: v.optional(v.string()),
    section: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    admissionDate: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    fatherName: v.optional(v.string()),
    fatherPhone: v.optional(v.string()),
    fatherOccupation: v.optional(v.string()),
    motherName: v.optional(v.string()),
    motherPhone: v.optional(v.string()),
    motherOccupation: v.optional(v.string()),
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianRelation: v.optional(v.string()),
    status: v.string(),
    approvalStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("students", {
      ...args,
      isDeleted: false,
    });
  },
});

// Update student
export const update = mutation({
  args: {
    id: v.id("students"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    className: v.optional(v.string()),
    section: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    fatherName: v.optional(v.string()),
    fatherPhone: v.optional(v.string()),
    motherName: v.optional(v.string()),
    motherPhone: v.optional(v.string()),
    status: v.optional(v.string()),
    approvalStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

// Soft delete
export const softDelete = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      status: "deleted",
    });
  },
});

// Restore from recycle bin
export const restore = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isDeleted: false,
      deletedAt: undefined,
      status: "active",
    });
  },
});

// Promote students (update class)
export const promote = mutation({
  args: {
    studentIds: v.array(v.id("students")),
    newClassName: v.string(),
    newSection: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    for (const id of args.studentIds) {
      await ctx.db.patch(id, {
        className: args.newClassName,
        section: args.newSection,
        academicYear: args.academicYear,
      });
    }
    return { promoted: args.studentIds.length };
  },
});

// Get deleted students
export const getDeleted = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("isDeleted"), true))
      .paginate(args.paginationOpts);
  },
});

// Approve/reject admission
export const updateApproval = mutation({
  args: {
    id: v.id("students"),
    approvalStatus: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      approvalStatus: args.approvalStatus,
      ...(args.status ? { status: args.status } : {}),
    });
  },
});

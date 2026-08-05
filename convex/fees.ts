import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { MutationCtx } from "./_generated/server";

// ─── FEE STRUCTURE ──────────────────────────────────────────────

export const listStructures = query({
  args: {
    academicYear: v.optional(v.string()),
    className: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.academicYear && args.className) {
      return await ctx.db
        .query("feeStructures")
        .withIndex("by_class_year", (q) =>
          q.eq("className", args.className!).eq("academicYear", args.academicYear!)
        )
        .collect();
    }
    if (args.academicYear) {
      return await ctx.db
        .query("feeStructures")
        .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear!))
        .collect();
    }
    return await ctx.db.query("feeStructures").collect();
  },
});

export const createStructure = mutation({
  args: {
    className: v.string(),
    academicYear: v.string(),
    feeType: v.string(),
    amount: v.number(),
    frequency: v.string(),
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("feeStructures", { ...args, isActive: true });
  },
});

export const updateStructure = mutation({
  args: {
    id: v.id("feeStructures"),
    feeType: v.optional(v.string()),
    amount: v.optional(v.number()),
    frequency: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteStructure = mutation({
  args: { id: v.id("feeStructures") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── FEE PAYMENTS ───────────────────────────────────────────────

async function nextReceiptNo(ctx: MutationCtx): Promise<string> {
  const all = await ctx.db.query("feePayments").order("desc").take(1);
  if (all.length === 0) return "REC-0001";
  const last = all[0].receiptNo;
  const num = parseInt(last.replace(/\D/g, ""), 10) || 0;
  return `REC-${String(num + 1).padStart(4, "0")}`;
}

export const collectFee = mutation({
  args: {
    studentId: v.id("students"),
    feeType: v.string(),
    amount: v.number(),
    discount: v.optional(v.number()),
    fine: v.optional(v.number()),
    amountPaid: v.number(),
    paymentDate: v.string(),
    paymentMode: v.string(),
    month: v.optional(v.string()),
    chequeNo: v.optional(v.string()),
    bankName: v.optional(v.string()),
    remarks: v.optional(v.string()),
    collectedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const discount = args.discount ?? 0;
    const fine = args.fine ?? 0;
    const totalAmount = args.amount - discount + fine;
    const balance = totalAmount - args.amountPaid;
    const status = balance <= 0 ? "paid" : args.amountPaid > 0 ? "partial" : "due";
    const receiptNo = await nextReceiptNo(ctx);

    return await ctx.db.insert("feePayments", {
      studentId: args.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      className: student.className ?? "",
      academicYear: student.academicYear ?? new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      feeType: args.feeType,
      amount: args.amount,
      discount,
      fine,
      totalAmount,
      amountPaid: args.amountPaid,
      balance: Math.max(0, balance),
      paymentDate: args.paymentDate,
      paymentMode: args.paymentMode,
      receiptNo,
      month: args.month,
      chequeNo: args.chequeNo,
      bankName: args.bankName,
      remarks: args.remarks,
      status,
      collectedBy: args.collectedBy,
    });
  },
});

export const listPayments = query({
  args: {
    paginationOpts: paginationOptsValidator,
    studentId: v.optional(v.id("students")),
    status: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.studentId) {
      return await ctx.db
        .query("feePayments")
        .withIndex("by_student", (q) => q.eq("studentId", args.studentId!))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    if (args.status && args.status !== "all") {
      return await ctx.db
        .query("feePayments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    if (args.academicYear) {
      return await ctx.db
        .query("feePayments")
        .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear!))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("feePayments").order("desc").paginate(args.paginationOpts);
  },
});

export const getPaymentByReceipt = query({
  args: { receiptNo: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("feePayments")
      .withIndex("by_receipt", (q) => q.eq("receiptNo", args.receiptNo))
      .unique();
  },
});

export const getStudentFeeHistory = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("feePayments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
  },
});

export const feeStats = query({
  args: { academicYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = args.academicYear
      ? await ctx.db
          .query("feePayments")
          .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear!))
          .collect()
      : await ctx.db.query("feePayments").collect();

    const totalCollected = all.reduce((s, p) => s + p.amountPaid, 0);
    const totalDue = all.reduce((s, p) => s + p.balance, 0);
    const totalFine = all.reduce((s, p) => s + (p.fine ?? 0), 0);
    const totalDiscount = all.reduce((s, p) => s + (p.discount ?? 0), 0);
    const paidCount = all.filter((p) => p.status === "paid").length;
    const partialCount = all.filter((p) => p.status === "partial").length;
    const dueCount = all.filter((p) => p.status === "due").length;

    const byMode: Record<string, number> = {};
    for (const p of all) {
      byMode[p.paymentMode] = (byMode[p.paymentMode] ?? 0) + p.amountPaid;
    }

    const byFeeType: Record<string, number> = {};
    for (const p of all) {
      byFeeType[p.feeType] = (byFeeType[p.feeType] ?? 0) + p.amountPaid;
    }

    return {
      totalCollected, totalDue, totalFine, totalDiscount,
      paidCount, partialCount, dueCount, total: all.length,
      byMode, byFeeType,
    };
  },
});

export const deletePayment = mutation({
  args: { id: v.id("feePayments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

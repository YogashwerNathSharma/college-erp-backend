import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  students: defineTable({
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
    photoUrl: v.optional(v.string()),
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
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_class", ["classId"])
    .index("by_admission_no", ["admissionNo"])
    .index("by_approval_status", ["approvalStatus"]),

  // Fee structure per class + academic year
  feeStructures: defineTable({
    className: v.string(),
    academicYear: v.string(),
    feeType: v.string(),
    amount: v.number(),
    frequency: v.string(),
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_class_year", ["className", "academicYear"])
    .index("by_academic_year", ["academicYear"]),

  // Individual fee payments per student
  feePayments: defineTable({
    studentId: v.id("students"),
    studentName: v.string(),
    admissionNo: v.string(),
    className: v.string(),
    academicYear: v.string(),
    feeType: v.string(),
    amount: v.number(),
    discount: v.optional(v.number()),
    fine: v.optional(v.number()),
    totalAmount: v.number(),
    amountPaid: v.number(),
    balance: v.number(),
    paymentDate: v.string(),
    paymentMode: v.string(),
    receiptNo: v.string(),
    month: v.optional(v.string()),
    chequeNo: v.optional(v.string()),
    bankName: v.optional(v.string()),
    remarks: v.optional(v.string()),
    status: v.string(),
    collectedBy: v.optional(v.string()),
  })
    .index("by_student", ["studentId"])
    .index("by_receipt", ["receiptNo"])
    .index("by_status", ["status"])
    .index("by_academic_year", ["academicYear"])
    .index("by_class_year", ["className", "academicYear"]),
});

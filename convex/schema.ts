import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  students: defineTable({
    // Basic Info
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
    // Academic
    classId: v.optional(v.string()),
    className: v.optional(v.string()),
    section: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    admissionDate: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    // Contact
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    // Parents
    fatherName: v.optional(v.string()),
    fatherPhone: v.optional(v.string()),
    fatherOccupation: v.optional(v.string()),
    motherName: v.optional(v.string()),
    motherPhone: v.optional(v.string()),
    motherOccupation: v.optional(v.string()),
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianRelation: v.optional(v.string()),
    // Status
    status: v.string(), // active | inactive | transferred | passed_out | deleted
    approvalStatus: v.optional(v.string()), // pending | approved | rejected
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_class", ["classId"])
    .index("by_admission_no", ["admissionNo"])
    .index("by_approval_status", ["approvalStatus"]),
});

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

  exams: defineTable({
    name: v.string(),
    date: v.string(),
    academicYear: v.string(),
    classes: v.array(v.string()),
    studentsPerSeat: v.number(),
    totalHalls: v.number(),
    seatsPerRow: v.number(),
    rowsPerHall: v.number(),
    status: v.string(),
    createdAt: v.string(),
  }).index("by_status", ["status"]),

  seatAllocations: defineTable({
    examId: v.id("exams"),
    studentId: v.id("students"),
    hallNo: v.number(),
    rowNo: v.number(),
    seatNo: v.number(),
    globalSeatNo: v.number(),
    admissionNo: v.string(),
    studentName: v.string(),
    className: v.string(),
    section: v.optional(v.string()),
    rollNo: v.optional(v.string()),
  })
    .index("by_exam", ["examId"])
    .index("by_exam_hall", ["examId", "hallNo"])
    .index("by_exam_student", ["examId", "studentId"]),
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  pageQuery,
  facultySchema,
  programSchema,
  semesterSchema,
  batchSchema,
  courseSchema,
  curriculumSchema,
  enrollmentSchema,
} from "./university-academic.routes";

describe("University academic input validation", () => {
  it("applies safe pagination defaults and rejects oversized pages", () => {
    assert.deepEqual(pageQuery.parse({}), { page: 1, limit: 50 });
    assert.equal(pageQuery.safeParse({ limit: 101 }).success, false);
    assert.equal(pageQuery.safeParse({ page: 0 }).success, false);
  });

  it("requires valid faculty identity fields", () => {
    assert.equal(facultySchema.safeParse({ name: "Science", code: "SCI" }).success, true);
    assert.equal(facultySchema.safeParse({ name: "", code: "SCI" }).success, false);
    assert.equal(facultySchema.safeParse({ name: "Science", code: "" }).success, false);
  });

  it("requires program identity and validates duration", () => {
    assert.equal(programSchema.safeParse({ name: "B.Tech", code: "BT" }).success, true);
    assert.equal(programSchema.safeParse({ name: "B.Tech", code: "BT", durationYears: 0 }).success, false);
  });

  it("requires semester program and valid number", () => {
    assert.equal(semesterSchema.safeParse({ programId: "p1", name: "Semester 1", number: 1 }).success, true);
    assert.equal(semesterSchema.safeParse({ programId: "p1", name: "Semester 1", number: 0 }).success, false);
  });

  it("requires batch program and code", () => {
    assert.equal(batchSchema.safeParse({ programId: "p1", name: "2026", code: "B26" }).success, true);
    assert.equal(batchSchema.safeParse({ programId: "p1", name: "2026", code: "" }).success, false);
    assert.equal(batchSchema.safeParse({
      programId: "p1",
      name: "2026",
      code: "B26",
      startDate: "2026-08-01",
      endDate: "2026-07-31",
    }).success, false);
  });

  it("requires course identity and keeps credits non-negative", () => {
    assert.equal(courseSchema.safeParse({ name: "DBMS", code: "CS101" }).success, true);
    assert.equal(courseSchema.safeParse({ name: "DBMS", code: "CS101", credits: -1 }).success, false);
  });

  it("requires both sides of a curriculum mapping", () => {
    assert.equal(curriculumSchema.safeParse({ semesterId: "s1", courseId: "c1" }).success, true);
    assert.equal(curriculumSchema.safeParse({ semesterId: "s1" }).success, false);
  });

  it("keeps enrollment identity requirements explicit", () => {
    assert.equal(enrollmentSchema.safeParse({
      studentId: "st1",
      programId: "p1",
      batchId: "b1",
      status: "ACTIVE",
    }).success, false);
  });

  it("requires student, program and batch for enrollment", () => {
    assert.equal(enrollmentSchema.safeParse({
      studentId: "st1",
      programId: "p1",
      batchId: "b1",
    }).success, true);
    assert.equal(enrollmentSchema.safeParse({
      studentId: "st1",
      programId: "p1",
    }).success, false);
  });
});

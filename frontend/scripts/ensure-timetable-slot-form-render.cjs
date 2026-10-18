const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
const source = fs.readFileSync(filePath, "utf8");

// Verification-only guard. Timetable Slot relation dropdown behavior lives in
// MasterForm.tsx and must not be injected repeatedly during Render builds.
const required = [
  'const isTimetableSlotForm = fields.some((item) => item.name === "dayOfWeek") && fields.some((item) => item.name === "periodId");',
  'periodId: { label: "Period", type: "lookup", lookupUrl: "/api/masters/period-master/dropdown"',
  'classId: { label: "Class", type: "lookup", lookupUrl: "/api/class"',
  'sectionId: { label: "Section", type: "lookup", lookupUrl: "/api/section"',
  'subjectId: { label: "Subject", type: "lookup", lookupUrl: "/api/subject"',
  'teacherId: { label: "Teacher", type: "lookup", lookupUrl: "/api/teacher"',
  'roomId: { label: "Room", type: "lookup", lookupUrl: "/api/room"',
  'case "lookup": return <LookupField',
];

for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`Timetable Slot form implementation verification failed: ${marker}`);
  }
}

process.stdout.write("Timetable Slot form relation dropdown implementation verified.\n");

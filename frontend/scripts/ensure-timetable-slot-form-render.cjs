const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
let source = fs.readFileSync(filePath, "utf8");

// Final UI guard for Timetable Slot Master. The master resolver can be correct
// while an older/cached config still marks relation IDs as plain text. Detect
// the Timetable Slot field set itself and force only its relation fields to the
// existing generic LookupField component.
const marker = "// TIMETABLE_SLOT_RELATION_LOOKUP_GUARD";
if (!source.includes(marker)) {
  const anchor = '  const renderField = (field: FieldConfig) => {\n';
  if (!source.includes(anchor)) {
    throw new Error("Timetable Slot form render anchor not found; refusing unrelated changes.");
  }

  const injection = `  const renderField = (field: FieldConfig) => {\n    ${marker}\n    const isTimetableSlot = fields.some((item) => item.name === "dayOfWeek") && fields.some((item) => item.name === "periodId");\n    if (isTimetableSlot) {\n      const timetableLookup: Record<string, Partial<FieldConfig>> = {\n        periodId: { label: "Period", type: "lookup", lookupUrl: "/api/masters/period-master/dropdown", lookupLabelField: "name", lookupValueField: "id" },\n        classId: { label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id" },\n        sectionId: { label: "Section", type: "lookup", lookupUrl: "/api/section", lookupLabelField: "name", lookupValueField: "id" },\n        subjectId: { label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id" },\n        teacherId: { label: "Teacher", type: "lookup", lookupUrl: "/api/teacher", lookupLabelField: "name", lookupValueField: "id" },\n        roomId: { label: "Room", type: "lookup", lookupUrl: "/api/room", lookupLabelField: "name", lookupValueField: "id" },\n      };\n      const relation = timetableLookup[field.name];\n      if (relation) field = { ...field, ...relation };\n    }\n`;

  source = source.replace(anchor, injection);
}

fs.writeFileSync(filePath, source, "utf8");
const verify = fs.readFileSync(filePath, "utf8");
for (const marker of [
  "TIMETABLE_SLOT_RELATION_LOOKUP_GUARD",
  'lookupUrl: "/api/section"',
  'lookupUrl: "/api/subject"',
  'lookupUrl: "/api/teacher"',
  'lookupUrl: "/api/room"',
]) {
  if (!verify.includes(marker)) {
    throw new Error(`Timetable Slot form lookup guard verification failed: ${marker}`);
  }
}
process.stdout.write("Timetable Slot form relation lookup guard verified.\n");

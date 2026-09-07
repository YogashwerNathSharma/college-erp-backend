const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
let source = fs.readFileSync(filePath, "utf8");

// Final UI guard for Timetable Slot Master. The master resolver can be correct
// while an older/generated config still marks relation IDs as plain text.
const marker = "// TIMETABLE_SLOT_RELATION_LOOKUP_GUARD";
const existingGuard = 'const isTimetableSlot = fields.some((item) => item.name === "dayOfWeek") && fields.some((item) => item.name === "periodId");';

// The guard may already be present in source from an earlier safe fix. In that
// case only mark it; never inject a second declaration (which breaks esbuild).
if (!source.includes(marker) && source.includes(existingGuard)) {
  source = source.replace(
    '    // Timetable Slot Master must always render every relation as a real dropdown,',
    `    ${marker}\n    // Timetable Slot Master must always render every relation as a real dropdown,`
  );
} else if (!source.includes(marker)) {
  const anchor = '  const renderField = (field: FieldConfig) => {\n';
  if (!source.includes(anchor)) {
    throw new Error("Timetable Slot form render anchor not found; refusing unrelated changes.");
  }

  const injection = `  const renderField = (field: FieldConfig) => {\n    ${marker}\n    ${existingGuard}\n    if (isTimetableSlot) {\n      const timetableLookup: Record<string, Partial<FieldConfig>> = {\n        periodId: { label: "Period", type: "lookup", lookupUrl: "/api/masters/period-master/dropdown", lookupLabelField: "name", lookupValueField: "id" },\n        classId: { label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id" },\n        sectionId: { label: "Section", type: "lookup", lookupUrl: "/api/section", lookupLabelField: "name", lookupValueField: "id" },\n        subjectId: { label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id" },\n        teacherId: { label: "Teacher", type: "lookup", lookupUrl: "/api/teacher", lookupLabelField: "name", lookupValueField: "id" },\n        roomId: { label: "Room", type: "lookup", lookupUrl: "/api/room", lookupLabelField: "name", lookupValueField: "id" },\n      };\n      const relation = timetableLookup[field.name];\n      if (relation) field = { ...field, ...relation };\n    }\n`;
  source = source.replace(anchor, injection);
}

fs.writeFileSync(filePath, source, "utf8");
const verify = fs.readFileSync(filePath, "utf8");
for (const required of [
  marker,
  'lookupUrl: "/api/section"',
  'lookupUrl: "/api/subject"',
  'lookupUrl: "/api/teacher"',
  'lookupUrl: "/api/room"',
]) {
  if (!verify.includes(required)) {
    throw new Error(`Timetable Slot form lookup guard verification failed: ${required}`);
  }
}
process.stdout.write("Timetable Slot form relation lookup guard verified.\n");

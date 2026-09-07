const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

const modelMarker = 'if (modelKey === "timetable-slot-master") {';
const start = source.indexOf(modelMarker);
if (start !== -1) {
  let depth = 0;
  let end = -1;
  for (let i = source.indexOf("{", start); i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end !== -1) source = source.slice(0, start) + source.slice(end);
}

const markerBlock = `    if (modelKey === "timetable-slot-master") {
      const timetableFields: FieldConfig[] = [
        { name: "dayOfWeek", label: "Day", type: "select", required: true, options: [
          { label: "Monday", value: "1" }, { label: "Tuesday", value: "2" }, { label: "Wednesday", value: "3" },
          { label: "Thursday", value: "4" }, { label: "Friday", value: "5" }, { label: "Saturday", value: "6" }, { label: "Sunday", value: "0" },
        ] },
        { name: "periodId", label: "Period", type: "lookup", lookupUrl: "/api/masters/period-master/dropdown", lookupLabelField: "name", lookupValueField: "id", required: true },
        { name: "classId", label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id", required: true },
        { name: "sectionId", label: "Section", type: "lookup", lookupUrl: "/api/section", lookupLabelField: "name", lookupValueField: "id" },
        { name: "subjectId", label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id" },
        { name: "teacherId", label: "Teacher", type: "lookup", lookupUrl: "/api/teacher", lookupLabelField: "name", lookupValueField: "id" },
        { name: "roomId", label: "Room", type: "lookup", lookupUrl: "/api/room", lookupLabelField: "name", lookupValueField: "id" },
      ];
      return timetableFields.map((fallback) => {
        const configured = configuredFields.find((field) => field.name === fallback.name);
        return configured ? { ...configured, ...fallback } : fallback;
      });
    }
`;
const anchor = "  return configuredFields;\n";
if (!source.includes(anchor)) throw new Error("Timetable Slot resolver anchor not found; refusing unrelated changes.");
source = source.replace(anchor, markerBlock + anchor);

fs.writeFileSync(filePath, source, "utf8");
const verify = fs.readFileSync(filePath, "utf8");
for (const marker of [
  modelMarker,
  'name: "dayOfWeek"',
  'name: "periodId"',
  'name: "classId"',
  'name: "sectionId"',
  'name: "subjectId"',
  'name: "teacherId"',
  'name: "roomId"',
]) {
  if (!verify.includes(marker)) throw new Error(`Timetable Slot Master verification failed: ${marker}`);
}
process.stdout.write("Timetable Slot Master fields verified.\n");

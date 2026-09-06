const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

// Timetable Slot Master relations must use real records, not ObjectId text inputs.
// Keep this scoped to the Master module; no timetable/ERP business logic is changed.
const block = `  if (modelKey === "timetable-slot-master") {
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

if (!source.includes('modelKey === "timetable-slot-master"')) {
  // Do not depend on the exact formatting or ordering produced by other
  // Organization Master patch scripts. Insert immediately before getEntryId.
  const entryMarker = "function getEntryId";
  const entryIndex = source.indexOf(entryMarker);
  if (entryIndex < 0 || source.indexOf("function getEffectiveFields") < 0 || entryIndex < source.indexOf("function getEffectiveFields")) {
    throw new Error("MasterModule field resolver anchor not found; refusing to modify unrelated code.");
  }
  source = source.slice(0, entryIndex) + block + source.slice(entryIndex);
}

const verify = fs.readFileSync(filePath, "utf8");
const requiredMarkers = [
  'modelKey === "timetable-slot-master"',
  'lookupUrl: "/api/masters/period-master/dropdown"',
  'lookupUrl: "/api/class"',
  'lookupUrl: "/api/section"',
  'lookupUrl: "/api/subject"',
  'lookupUrl: "/api/teacher"',
  'lookupUrl: "/api/room"',
];
for (const required of requiredMarkers) {
  if (!verify.includes(required)) {
    throw new Error(`Timetable Slot Master dropdown verification failed: ${required}`);
  }
}

fs.writeFileSync(filePath, source, "utf8");
process.stdout.write("Timetable Slot Master relation dropdowns verified.\n");

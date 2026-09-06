const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

// Elective Subject Master must use real tenant-scoped records for Subject,
// Class and Stream. Never expose Mongo/ObjectId text inputs for these relations.
const marker = "  return configuredFields;\n}\n\nfunction getEntryId";
const replacement = `  if (modelKey === "elective-subject-master") {
    const electiveFields: FieldConfig[] = [
      { name: "subjectId", label: "Subject", type: "lookup", lookupUrl: "/api/subject", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "classId", label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id", required: true },
      { name: "streamId", label: "Stream", type: "lookup", lookupUrl: "/api/masters/stream-master/dropdown", lookupLabelField: "name", lookupValueField: "id" },
      { name: "maxStudents", label: "Max Students", type: "number" },
    ];
    return electiveFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...configured, ...fallback } : fallback;
    });
  }

  return configuredFields;
}

function getEntryId`;

if (source.includes('modelKey === "elective-subject-master"')) {
  process.stdout.write("Elective Subject Master dropdowns already enabled.\n");
} else {
  if (!source.includes(marker)) {
    throw new Error("MasterModule getEffectiveFields marker not found; refusing to modify unrelated code.");
  }
  source = source.replace(marker, replacement);
  fs.writeFileSync(filePath, source, "utf8");
}

const verify = fs.readFileSync(filePath, "utf8");
const requiredMarkers = [
  'modelKey === "elective-subject-master"',
  'lookupUrl: "/api/subject"',
  'lookupUrl: "/api/class"',
  'lookupUrl: "/api/masters/stream-master/dropdown"',
  '{ name: "subjectId", label: "Subject", type: "lookup"',
  '{ name: "classId", label: "Class", type: "lookup"',
];
for (const required of requiredMarkers) {
  if (!verify.includes(required)) {
    throw new Error(`Elective Subject Master dropdown verification failed: ${required}`);
  }
}

process.stdout.write("Elective Subject Master Subject/Class/Stream dropdowns verified.\n");

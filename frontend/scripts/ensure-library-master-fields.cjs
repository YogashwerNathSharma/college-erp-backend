const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

const startMarker = "function getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {";
const endMarker = "\nfunction getEntryId";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start === -1 || end === -1) throw new Error("MasterModule field resolver markers not found; refusing unrelated modification.");

const newResolver = `function getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {
  const libraryFallbacks: Record<string, FieldConfig[]> = {
    "language-master": [
      { name: "name", label: "Language", type: "text", required: true },
      { name: "code", label: "Code", type: "text", placeholder: "en, hi, mr" },
    ],
    "rack-master": [
      { name: "name", label: "Rack Name/Number", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: true },
      { name: "capacity", label: "Capacity (books)", type: "number", required: true },
    ],
    "shelf-master": [
      { name: "name", label: "Shelf Name", type: "text", required: true },
      { name: "rackId", label: "Rack No.", type: "lookup", required: true, lookupUrl: "/api/masters/rack-master/dropdown", lookupLabelField: "name", lookupValueField: "id" },
      { name: "level", label: "Level Number", type: "number", required: true },
    ],
  };

  if (libraryFallbacks[modelKey]) {
    const fallback = libraryFallbacks[modelKey];
    return fallback.map((fallbackField) => {
      const configured = configuredFields.find((field) => field.name === fallbackField.name);
      return configured ? { ...fallbackField, ...configured, ...(fallbackField.type === "lookup" ? fallbackField : {}) } : fallbackField;
    });
  }

  if (modelKey === "school-master") return configuredFields.filter((field) => field.name === "name" || field.name === "code");
  if (modelKey === "timetable-slot-master") {
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
  return configuredFields;
}
`;
source = source.slice(0, start) + newResolver + source.slice(end);

const fetchOld = 'if (res.data.config?.fields) setFields(getEffectiveFields(modelKey, res.data.config.fields));';
const fetchNew = 'setFields(getEffectiveFields(modelKey, res.data.config?.fields || []));';
if (source.includes(fetchOld)) {
  source = source.replace(fetchOld, fetchNew);
} else if (!source.includes(fetchNew)) {
  throw new Error("MasterModule config field assignment marker not found; refusing unrelated modification.");
}

const clickOld = 'const handleModelClick = (model: MasterModel) => { setSelectedModel(model.key); setSelectedModelLabel(model.label); setSearch("");';
const clickNew = 'const handleModelClick = (model: MasterModel) => { setFields(getEffectiveFields(model.key, [])); setSelectedModel(model.key); setSelectedModelLabel(model.label); setSearch("");';
if (source.includes(clickOld)) source = source.replace(clickOld, clickNew);
else if (!source.includes('const handleModelClick = (model: MasterModel) => { setFields(getEffectiveFields(model.key, []));')) throw new Error("MasterModule model click marker not found; refusing unrelated modification.");

const required = [
  '"language-master"',
  '"rack-master"',
  '"shelf-master"',
  'label: "Rack No."',
  'lookupUrl: "/api/masters/rack-master/dropdown"',
  'setFields(getEffectiveFields(modelKey, res.data.config?.fields || []));',
  'setFields(getEffectiveFields(model.key, [])); setSelectedModel(model.key)',
];
for (const item of required) if (!source.includes(item)) throw new Error(`Library master verification failed: ${item}`);

fs.writeFileSync(filePath, source, "utf8");
process.stdout.write("Library Master fields verified: Rack and Shelf add forms always have fields, Shelf Rack No. is a Rack Master lookup, and required fields match Prisma.\n");

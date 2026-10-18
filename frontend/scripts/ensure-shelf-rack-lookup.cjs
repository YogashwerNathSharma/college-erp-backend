const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
let source = fs.readFileSync(filePath, "utf8");

const marker = "  const effectiveFields = isTimetableSlot";
if (!source.includes(marker)) {
  throw new Error("MasterForm effectiveFields marker not found; refusing unrelated modification.");
}

const lookupBlock = `  const shelfRackFields: FieldConfig[] = modelKey === "shelf-master"
    ? (fields.length > 0
      ? fields.map(field => field.name === "rackId"
        ? { ...field, label: "Rack No.", type: "lookup", lookupUrl: "/api/masters/rack-master/dropdown", lookupLabelField: "name", lookupValueField: "id" }
        : field)
      : [
        { name: "name", label: "Shelf Name", type: "text", required: true },
        { name: "rackId", label: "Rack No.", type: "lookup", required: true, lookupUrl: "/api/masters/rack-master/dropdown", lookupLabelField: "name", lookupValueField: "id" },
      ])
    : fields;
`;

const blockStart = "  const shelfRackFields: FieldConfig[] =";
if (!source.includes(blockStart)) {
  source = source.replace(marker, lookupBlock + marker);
} else {
  const start = source.indexOf(blockStart);
  const end = source.indexOf(marker, start);
  if (end === -1) throw new Error("Existing shelfRackFields block could not be bounded.");
  source = source.slice(0, start) + lookupBlock + source.slice(end);
}

const oldFinal = `      : modelKey === "assessment-master"
        ? assessmentFields
        : fields;`;
const newFinal = `      : modelKey === "assessment-master"
        ? assessmentFields
        : shelfRackFields;`;
if (source.includes(oldFinal)) {
  source = source.replace(oldFinal, newFinal);
} else if (!source.includes(": shelfRackFields;")) {
  throw new Error("MasterForm final field selection marker not found; refusing unrelated modification.");
}

// Keep labels clearly visible on the dark ERP modal as well.
source = source.replace(
  'className="block text-sm font-medium mb-1.5"',
  'className="block text-sm font-medium mb-1.5 text-gray-800 dark:text-gray-100"'
);

const required = [
  'modelKey === "shelf-master"',
  'field.name === "rackId"',
  'label: "Rack No."',
  'type: "lookup"',
  'lookupUrl: "/api/masters/rack-master/dropdown"',
  'lookupLabelField: "name"',
  'lookupValueField: "id"',
  'name: "Shelf Name"',
  ': shelfRackFields;',
];
for (const item of required) {
  if (!source.includes(item)) throw new Error(`Shelf Rack form verification failed: ${item}`);
}

fs.writeFileSync(filePath, source, "utf8");
process.stdout.write("Shelf Master form verified: Shelf Name is visible and Rack No. is a Rack Master dropdown.\n");

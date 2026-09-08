const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
let source = fs.readFileSync(filePath, "utf8");

const marker = "  const effectiveFields = isTimetableSlot";
if (!source.includes(marker)) {
  throw new Error("MasterForm effectiveFields marker not found; refusing unrelated modification.");
}

const lookupBlock = `  const shelfRackFields: FieldConfig[] = modelKey === "shelf-master"
    ? fields.map(field => field.name === "rackId"
      ? { ...field, label: "Rack No.", type: "lookup", lookupUrl: "/api/masters/rack-master/dropdown", lookupLabelField: "name", lookupValueField: "id" }
      : field)
    : fields;
`;

if (!source.includes("const shelfRackFields: FieldConfig[]")) {
  source = source.replace(marker, lookupBlock + marker);
}

const oldFinal = `      : modelKey === "assessment-master"
        ? assessmentFields
        : fields;`;
const newFinal = `      : modelKey === "assessment-master"
        ? assessmentFields
        : shelfRackFields;`;

if (source.includes(oldFinal)) {
  source = source.replace(oldFinal, newFinal);
} else if (!source.includes("? shelfRackFields") && !source.includes(": shelfRackFields;")) {
  throw new Error("MasterForm final field selection marker not found; refusing unrelated modification.");
}

const required = [
  'modelKey === "shelf-master"',
  'field.name === "rackId"',
  'lookupUrl: "/api/masters/rack-master/dropdown"',
  'lookupLabelField: "name"',
  'lookupValueField: "id"',
  ': shelfRackFields;',
];
for (const item of required) {
  if (!source.includes(item)) throw new Error(`Shelf Rack lookup verification failed: ${item}`);
}

fs.writeFileSync(filePath, source, "utf8");
process.stdout.write("Shelf Master Rack No. dropdown verified in MasterForm.\n");

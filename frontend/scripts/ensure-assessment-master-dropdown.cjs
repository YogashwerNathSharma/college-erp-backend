const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
if (!fs.existsSync(filePath)) process.exit(0);

let content = fs.readFileSync(filePath, "utf8");
const start = "  const assessmentNameOptions: SelectOption[] = [";
const end = "  const effectiveFields = isTimetableSlot";
const startIndex = content.indexOf(start);
const endIndex = content.indexOf(end, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `  const assessmentFields: FieldConfig[] = modelKey === \"assessment-master\"\n    ? fields.map(field => field.name === \"name\"\n      ? { ...field, type: \"lookup\", lookupUrl: \"/api/masters/assessment-master/dropdown\", lookupLabelField: \"name\", lookupValueField: \"id\" }\n      : field)\n    : [];\n`;
  const block = content.slice(startIndex, endIndex);
  if (!block.includes("const assessmentFields")) {
    content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  } else {
    content = content.slice(0, startIndex) + block.replace(/const assessmentFields[\s\S]*?\n(?=  const effectiveFields)/, replacement) + content.slice(endIndex);
  }
}

content = content.replace(
  `      : modelKey === "assessment-master"\n        ? assessmentFields\n        : fields;`,
  `      : modelKey === "assessment-master"\n        ? assessmentFields\n        : fields;`
);

fs.writeFileSync(filePath, content, "utf8");
if (!content.includes("lookupUrl: \"/api/masters/assessment-master/dropdown\"")) {
  throw new Error("Assessment Master dropdown verification failed");
}
process.stdout.write("Assessment Master dropdown verified: options come from AssessmentMaster records.\n");

const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

// School Master must always expose the complete institution profile even when
// an older backend deployment returns a partial field configuration.
const replacement = `// School Master exposes the complete institution profile.\nfunction getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {\n  if (modelKey !== "school-master") return configuredFields;\n\n  const schoolFields: FieldConfig[] = [\n    { name: "name", label: "School Name", type: "text", required: true },\n    { name: "code", label: "School Code", type: "text" },\n    { name: "address", label: "Address", type: "textarea" },\n    { name: "city", label: "City", type: "text" },\n    { name: "state", label: "State", type: "text" },\n    { name: "pincode", label: "Pincode", type: "text" },\n    { name: "phone", label: "Phone", type: "phone" },\n    { name: "email", label: "Email", type: "email" },\n    { name: "website", label: "Website", type: "url" },\n    { name: "logo", label: "Logo", type: "url" },\n    { name: "affiliation", label: "Affiliation", type: "text" },\n    { name: "establishedYear", label: "Established Year", type: "number", min: 1800, max: 2100 },\n    { name: "principalName", label: "Principal Name", type: "text" },\n  ];\n\n  return schoolFields.map((fallback) => {\n    const configured = configuredFields.find((field) => field.name === fallback.name);\n    return configured ? { ...fallback, ...configured } : fallback;\n  });\n}`;

const functionPattern = /(?:\/\/[^\n]*School Master[^\n]*\n(?:\/\/[^\n]*\n)?)?function getEffectiveFields\([^)]*\): FieldConfig\[\] \{[\s\S]*?\n\}/;

if (functionPattern.test(source)) {
  source = source.replace(functionPattern, replacement);
  fs.writeFileSync(filePath, source, "utf8");
  process.stdout.write("Complete School Master fields enabled.\n");
} else {
  throw new Error("School Master field selector was not found; refusing to modify unrelated frontend code.");
}

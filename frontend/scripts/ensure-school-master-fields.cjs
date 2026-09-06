const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

const oldBlock = `// Keep the existing generic master engine intact, but only expose fields that\n// are actually persisted by the current SSOT model for School Master.\nfunction getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {\n  if (modelKey === "school-master") {\n    return configuredFields.filter((field) => field.name === "name" || field.name === "code");\n  }\n  return configuredFields;\n}`;

const newBlock = `// Keep the generic master engine intact. School Master exposes all\n// configured profile fields because they are persisted by its SSOT model.\nfunction getEffectiveFields(_modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {\n  return configuredFields;\n}`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, source, "utf8");
  process.stdout.write("School Master frontend fields enabled.\\n");
} else if (source.includes(newBlock)) {
  process.stdout.write("School Master frontend fields already enabled.\\n");
} else {
  throw new Error("Expected School Master field filter was not found in MasterModule.tsx");
}

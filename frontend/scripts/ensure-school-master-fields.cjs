const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

// School Master must use every field declared by master.config.ts.
// Replace only the field-selector function; leave the generic master engine intact.
const replacement = `// School Master exposes every configured profile field.
function getEffectiveFields(_modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {
  return configuredFields;
}`;

const functionPattern = /(?:\/\/[^\n]*School Master[^\n]*\n(?:\/\/[^\n]*\n)?)?function getEffectiveFields\([^)]*\): FieldConfig\[\] \{[\s\S]*?\n\}/;

if (functionPattern.test(source)) {
  source = source.replace(functionPattern, replacement);
  fs.writeFileSync(filePath, source, "utf8");
  process.stdout.write("School Master frontend fields enabled.\n");
} else {
  throw new Error("School Master field selector was not found; refusing to modify unrelated frontend code.");
}

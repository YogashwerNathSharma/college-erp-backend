const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

// Always normalize the School Master field selector during both postinstall
// and build. This prevents an old cached source copy from hiding the configured
// School profile fields in production.
const replacement = `// School Master exposes every configured profile field.\nfunction getEffectiveFields(_modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {\n  return configuredFields;\n}`;

const blockPattern = /\/\/ Keep the existing generic master engine intact, but only expose fields that[\\s\\S]*?function getEffectiveFields\(modelKey: string, configuredFields: FieldConfig\[\]\): FieldConfig\[\] \{[\\s\\S]*?\n\}/;
const newBlockPattern = /\/\/ School Master exposes every configured profile field\.[\\s\\S]*?function getEffectiveFields\(_modelKey: string, configuredFields: FieldConfig\[\]\): FieldConfig\[\] \{[\\s\\S]*?\n\}/;

if (newBlockPattern.test(source)) {
  process.stdout.write("School Master frontend fields already enabled.\n");
} else if (blockPattern.test(source)) {
  source = source.replace(blockPattern, replacement);
  fs.writeFileSync(filePath, source, "utf8");
  process.stdout.write("School Master frontend fields enabled.\n");
} else {
  throw new Error("School Master field selector was not found; refusing to modify unrelated frontend code.");
}

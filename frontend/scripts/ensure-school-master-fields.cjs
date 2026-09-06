const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

// School Master must always expose the complete institution profile even when
// an older backend deployment returns a partial field configuration.
const newFunction = `function getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {
  if (modelKey !== "school-master") return configuredFields;

  const schoolFields: FieldConfig[] = [
    { name: "name", label: "School Name", type: "text", required: true },
    { name: "code", label: "School Code", type: "text" },
    { name: "address", label: "Address", type: "textarea" },
    { name: "city", label: "City", type: "text" },
    { name: "state", label: "State", type: "text" },
    { name: "pincode", label: "Pincode", type: "text" },
    { name: "phone", label: "Phone", type: "phone" },
    { name: "email", label: "Email", type: "email" },
    { name: "website", label: "Website", type: "url" },
    { name: "logo", label: "Logo", type: "url" },
    { name: "affiliation", label: "Affiliation", type: "text" },
    { name: "establishedYear", label: "Established Year", type: "number", min: 1800, max: 2100 },
    { name: "principalName", label: "Principal Name", type: "text" },
  ];

  return schoolFields.map((fallback) => {
    const configured = configuredFields.find((field) => field.name === fallback.name);
    return configured ? { ...fallback, ...configured } : fallback;
  });
}`;

// Replace only the School Master field-selector function. This is deliberately
// regex-based so the build does not depend on whitespace/comment formatting.
const functionPattern = /function getEffectiveFields\(modelKey: string, configuredFields: FieldConfig\[\]\): FieldConfig\[\] \{[\s\S]*?\n\}/;

if (source.includes("const schoolFields: FieldConfig[] = [") && source.includes('{ name: "address", label: "Address"')) {
  process.stdout.write("Complete School Master fields already enabled.\n");
} else if (functionPattern.test(source)) {
  source = source.replace(functionPattern, newFunction);
  fs.writeFileSync(filePath, source, "utf8");
  process.stdout.write("Complete School Master fields enabled.\n");
} else {
  throw new Error("School Master field selector was not found; refusing to modify unrelated frontend code.");
}

const verify = fs.readFileSync(filePath, "utf8");
if (!verify.includes('{ name: "address", label: "Address"') || !verify.includes('{ name: "principalName", label: "Principal Name"')) {
  throw new Error("School Master field patch verification failed.");
}

const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterModule.tsx");
let source = fs.readFileSync(filePath, "utf8");

// Organization Masters must expose the complete configured field set even when
// an older backend deployment returns a partial field configuration.
const newFunction = `function getEffectiveFields(modelKey: string, configuredFields: FieldConfig[]): FieldConfig[] {
  if (modelKey === "school-master") {
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
  }

  if (modelKey === "branch-master") {
    const branchFields: FieldConfig[] = [
      { name: "name", label: "Branch Name", type: "text", required: true },
      { name: "code", label: "Branch Code", type: "text" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "city", label: "City", type: "text" },
      { name: "state", label: "State", type: "text" },
      { name: "pincode", label: "Pincode", type: "text" },
      { name: "phone", label: "Phone", type: "phone" },
      { name: "email", label: "Email", type: "email" },
      { name: "isMain", label: "Is Main Branch", type: "boolean", defaultValue: false },
    ];

    return branchFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...fallback, ...configured } : fallback;
    });
  }

  if (modelKey === "campus-master") {
    const campusFields: FieldConfig[] = [
      { name: "name", label: "Campus Name", type: "text", required: true },
      { name: "branchId", label: "Branch", type: "text" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "capacity", label: "Capacity", type: "number" },
      { name: "facilities", label: "Facilities (comma-separated)", type: "text" },
    ];

    return campusFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...fallback, ...configured } : fallback;
    });
  }

  return configuredFields;
}`;

// Replace only the existing field selector, bounded by the next function
// declaration so nested braces cannot cause a partial replacement.
const functionPattern = /function getEffectiveFields\(modelKey: string, configuredFields: FieldConfig\[\]\): FieldConfig\[\] \{[\s\S]*?\n\}\n\nfunction getEntryId/;

if (source.includes('modelKey === "campus-master"') && source.includes('{ name: "branchId", label: "Branch"')) {
  process.stdout.write("Complete Organization Master fields already enabled.\n");
} else if (functionPattern.test(source)) {
  source = source.replace(functionPattern, `${newFunction}\n\nfunction getEntryId`);
  fs.writeFileSync(filePath, source, "utf8");
  process.stdout.write("Complete Organization Master fields enabled.\n");
} else {
  throw new Error("Organization Master field selector was not found; refusing to modify unrelated frontend code.");
}

const verify = fs.readFileSync(filePath, "utf8");
const requiredMarkers = [
  '{ name: "address", label: "Address"',
  '{ name: "principalName", label: "Principal Name"',
  'modelKey === "branch-master"',
  'modelKey === "campus-master"',
  '{ name: "branchId", label: "Branch"',
  '{ name: "facilities", label: "Facilities (comma-separated)"',
];

for (const marker of requiredMarkers) {
  if (!verify.includes(marker)) {
    throw new Error(`Organization Master field patch verification failed: ${marker}`);
  }
}

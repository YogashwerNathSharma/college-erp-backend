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
      { name: "facilities", label: "Facilities (comma-separated)", type: "array", defaultValue: [] },
    ];
    return campusFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...fallback, ...configured } : fallback;
    });
  }

  return configuredFields;
}`;

const functionPattern = /function getEffectiveFields\(modelKey: string, configuredFields: FieldConfig\[\]\): FieldConfig\[\] \{[\s\S]*?\n\}\n\nfunction getEntryId/;

if (source.includes('modelKey === "campus-master"') && source.includes('{ name: "branchId", label: "Branch"')) {
  source = source.replace('{ name: "facilities", label: "Facilities (comma-separated)", type: "text" },', '{ name: "facilities", label: "Facilities (comma-separated)", type: "array", defaultValue: [] },');
  if (functionPattern.test(source)) source = source.replace(functionPattern, `${newFunction}\n\nfunction getEntryId`);
  fs.writeFileSync(filePath, source, "utf8");
  process.stdout.write("Complete Organization Master fields already enabled; Campus facilities normalized.\n");
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
  '{ name: "facilities", label: "Facilities (comma-separated)", type: "array"',
];
for (const marker of requiredMarkers) {
  if (!verify.includes(marker)) throw new Error(`Organization Master field patch verification failed: ${marker}`);
}

// Normalize configured select values in the table when the API returns numbers.
const tablePath = path.resolve(__dirname, "../src/pages/masters/MasterTable.tsx");
let tableSource = fs.readFileSync(tablePath, "utf8");
const oldSelectLookup = 'const opt = field.options.find(o => o.value === value);';
const newSelectLookup = 'const opt = field.options.find(o => String(o.value) === String(value));';
if (tableSource.includes(oldSelectLookup)) {
  tableSource = tableSource.replace(oldSelectLookup, newSelectLookup);
  fs.writeFileSync(tablePath, tableSource, "utf8");
}
const tableVerify = fs.readFileSync(tablePath, "utf8");
if (!tableVerify.includes(newSelectLookup)) {
  throw new Error("Master table select-value normalization patch verification failed.");
}
process.stdout.write("Master table select labels verified with numeric/string normalization.\n");

// Subject Group uses a Prisma String[] field. The generic form must render a
// dedicated comma-separated array input and normalize it back to String[].
const formPath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
let formSource = fs.readFileSync(formPath, "utf8");
const arrayCase = `      case "array":
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(", ") : value}
            onChange={(e) => handleChange(field.name, e.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
            placeholder={field.placeholder || "id1, id2, id3"}
            className={baseClasses}
          />
        );

`;
const jsonCaseMarker = '      case "json":';
if (!formSource.includes('case "array":')) {
  if (!formSource.includes(jsonCaseMarker)) throw new Error("Master form JSON field case not found; refusing to modify unrelated frontend code.");
  formSource = formSource.replace(jsonCaseMarker, `${arrayCase}${jsonCaseMarker}`);
  fs.writeFileSync(formPath, formSource, "utf8");
}
const formVerify = fs.readFileSync(formPath, "utf8");
if (!formVerify.includes('case "array":') || !formVerify.includes('value.split(",").map((item) => item.trim()).filter(Boolean)')) {
  throw new Error("Subject Group array input patch verification failed.");
}
process.stdout.write("Subject Group array input verified.\n");

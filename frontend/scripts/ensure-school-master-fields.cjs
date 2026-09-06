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

  // Subject Group references real Class/Stream/Subject records. Users must
  // select records from the tenant-scoped dropdowns instead of typing IDs.
  if (modelKey === "subject-group-master") {
    const subjectGroupFields: FieldConfig[] = [
      { name: "name", label: "Group Name", type: "text", required: true },
      { name: "classId", label: "Class", type: "lookup", lookupUrl: "/api/class", lookupLabelField: "name", lookupValueField: "id" },
      { name: "streamId", label: "Stream", type: "lookup", lookupUrl: "/api/masters/stream-master/dropdown", lookupLabelField: "name", lookupValueField: "id" },
      { name: "subjects", label: "Subjects", type: "array", lookupUrl: "/api/subjects", lookupLabelField: "name", lookupValueField: "id", defaultValue: [] },
    ];
    // Fallback must win for these relation fields so an older backend config
    // cannot turn the UI back into manual ID text boxes.
    return subjectGroupFields.map((fallback) => {
      const configured = configuredFields.find((field) => field.name === fallback.name);
      return configured ? { ...configured, ...fallback } : fallback;
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
  'modelKey === "subject-group-master"',
  'lookupUrl: "/api/class"',
  'lookupUrl: "/api/masters/stream-master/dropdown"',
  'lookupUrl: "/api/subjects"',
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

// Subject Group relations use real lookup dropdowns. Subjects use a multi-select
// dropdown but are submitted as the Prisma String[] value expected by the API.
const formPath = path.resolve(__dirname, "../src/pages/masters/MasterForm.tsx");
let formSource = fs.readFileSync(formPath, "utf8");
const oldArrayCase = /      case "array":\n        return \([\s\S]*?        \);\n\n      case "json":/;
const newArrayCase = `      case "array":
        if (field.lookupUrl) {
          return <MultiLookupField field={field} value={Array.isArray(value) ? value : []} onChange={(nextValue) => handleChange(field.name, nextValue)} />;
        }
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(", ") : value}
            onChange={(e) => handleChange(field.name, e.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
            placeholder={field.placeholder || "id1, id2, id3"}
            className={baseClasses}
          />
        );

      case "json":`;
if (oldArrayCase.test(formSource)) {
  formSource = formSource.replace(oldArrayCase, newArrayCase);
} else if (!formSource.includes('case "array":')) {
  const jsonCaseMarker = '      case "json":';
  if (!formSource.includes(jsonCaseMarker)) throw new Error("Master form JSON field case not found; refusing to modify unrelated frontend code.");
  formSource = formSource.replace(jsonCaseMarker, newArrayCase);
}

const lookupCases = `      case "lookup":
        return <LookupField field={field} value={value} onChange={(nextValue) => handleChange(field.name, nextValue)} />;

`;
if (!formSource.includes('case "lookup":')) {
  if (!formSource.includes('case "textarea":')) throw new Error("Master form render switch not found; refusing to modify unrelated frontend code.");
  formSource = formSource.replace('      case "textarea":', `${lookupCases}      case "textarea":`);
}

const multiLookupComponent = `
// ─── Multi Lookup Field (fetches selectable records from API) ────────────────
function MultiLookupField({ field, value, onChange }: { field: FieldConfig; value: string[]; onChange: (val: string[]) => void }) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(getFullUrl(field.lookupUrl || ""), {
          headers: token ? { Authorization: \`Bearer \${token}\` } : undefined,
        });
        const data = res.data?.data || res.data?.subjects || res.data || [];
        const labelField = field.lookupLabelField || "name";
        const valueField = field.lookupValueField || "id";
        setOptions((Array.isArray(data) ? data : []).map((item: any) => ({
          label: item[labelField] || item.name || item.id,
          value: String(item[valueField] || item.id),
        })));
      } catch (err) {
        console.error("Multi-lookup fetch failed:", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    if (field.lookupUrl) fetchOptions();
  }, [field.lookupUrl, field.lookupLabelField, field.lookupValueField]);

  if (loading) {
    return <select multiple disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm"><option>Loading...</option></select>;
  }

  return (
    <select
      multiple
      value={value.map(String)}
      onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((option) => option.value))}
      className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[120px]"
    >
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}
`;
if (!formSource.includes('function MultiLookupField')) {
  const masterFormMarker = 'export default function MasterForm';
  if (!formSource.includes(masterFormMarker)) throw new Error("Master form component marker not found; refusing to modify unrelated frontend code.");
  formSource = formSource.replace(masterFormMarker, `${multiLookupComponent}\n${masterFormMarker}`);
}

fs.writeFileSync(formPath, formSource, "utf8");
const formVerify = fs.readFileSync(formPath, "utf8");
if (!formVerify.includes('case "array":') || !formVerify.includes('field.lookupUrl')) {
  throw new Error("Subject Group lookup-array input patch verification failed.");
}
if (!formVerify.includes('case "lookup":') || !formVerify.includes('function MultiLookupField')) {
  throw new Error("Subject Group relational dropdown rendering patch verification failed.");
}
process.stdout.write("Subject Group Class/Stream/Subject dropdowns verified.\n");

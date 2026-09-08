const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../src/pages/masters/MasterTable.tsx");
let source = fs.readFileSync(filePath, "utf8");

// Keep relation fields visible in master tables. They are stored as IDs, but
// lookup fields are rendered with their human-readable labels.
if (!source.includes('lookupUrl?: string;')) {
  source = source.replace(
    '  options?: { label: string; value: string }[];\n}',
    '  options?: { label: string; value: string }[];\n  lookupUrl?: string;\n  lookupLabelField?: string;\n  lookupValueField?: string;\n}'
  );
}

if (!source.includes('from "axios"')) {
  source = source.replace(
    'import { useState, useRef, useEffect } from "react";\n',
    'import { useState, useRef, useEffect } from "react";\nimport axios from "axios";\nimport { getFullUrl } from "../../utils/url";\n'
  );
}

source = source.replace(
`  // Check if field should be hidden (ID fields, relations, internal fields)\n  const isHiddenField = (fieldName: string): boolean => {\n    const hiddenPatterns = [\n      /^(id|_id)$/i,                  // id, _id (MongoDB ID)\n      /Id$/,                           // ending with Id (categoryId, tenantId, etc.)\n      /^(tenantId|createdAt|updatedAt|deletedAt|isDeleted|isActive)$/,  // System fields\n    ];\n    return hiddenPatterns.some(pattern => pattern.test(fieldName));\n  };`,
`  // Hide only internal/system columns. Relation fields such as subjectId and\n  // classId are real master fields and must remain visible in the data table.\n  const isHiddenField = (fieldName: string): boolean => {\n    const hiddenPatterns = [\n      /^(id|_id|tenantId|createdAt|updatedAt|deletedAt|isDeleted|isActive)$/i,\n    ];\n    return hiddenPatterns.some(pattern => pattern.test(fieldName));\n  };`
);

if (!source.includes('const [lookupLabels, setLookupLabels]')) {
  source = source.replace(
    '  const menuRef = useRef<HTMLDivElement>(null);\n',
    `  const menuRef = useRef<HTMLDivElement>(null);\n  const [lookupLabels, setLookupLabels] = useState<Record<string, Record<string, string>>>({});\n\n  useEffect(() => {\n    let cancelled = false;\n    const loadLookups = async () => {\n      const lookupFields = fields.filter((field) => field.type === "lookup" && field.lookupUrl);\n      if (lookupFields.length === 0) {\n        setLookupLabels({});\n        return;\n      }\n      const next: Record<string, Record<string, string>> = {};\n      await Promise.all(lookupFields.map(async (field) => {\n        try {\n          const token = localStorage.getItem("token");\n          const response = await axios.get(getFullUrl(field.lookupUrl || ""), {\n            headers: token ? { Authorization: \`Bearer \${token}\` } : undefined,\n          });\n          const rows = response.data?.data?.data || response.data?.data || response.data || [];\n          const labelField = field.lookupLabelField || "name";\n          const valueField = field.lookupValueField || "id";\n          const map: Record<string, string> = {};\n          if (Array.isArray(rows)) {\n            rows.forEach((row: any) => {\n              const value = row?.[valueField] ?? row?.id;\n              const label = row?.[labelField] ?? row?.name ?? value;\n              if (value !== undefined && value !== null) map[String(value)] = String(label);\n            });\n          }\n          next[field.name] = map;\n        } catch (error) {\n          console.error("Master table lookup failed:", field.name, error);\n          next[field.name] = {};\n        }\n      }));\n      if (!cancelled) setLookupLabels(next);\n    };\n    loadLookups();\n    return () => { cancelled = true; };\n  }, [fields]);\n`
  );
}

// Fee Group stores Applicable Classes as an array of class IDs. Resolve each
// ID independently so the table shows class names instead of a comma-joined
// list of raw IDs. This is intentionally generic for any multi-value lookup.
const arrayLookupMarker = 'if (Array.isArray(value)) {\\n        const labels = value.map';
if (!source.includes(arrayLookupMarker)) {
  source = source.replace(
`    if (field.type === "lookup") {\n      const relation = entry?.[field.name.replace(/Id$/, "")];`,
`    if (field.type === "lookup") {\n      if (Array.isArray(value)) {\n        const labels = value.map((item: any) => lookupMaps[field.name]?.[String(item)] || lookupLabels[field.name]?.[String(item)] || String(item));\n        return labels.join(", ");\n      }\n      const relation = entry?.[field.name.replace(/Id$/, "")];`
  );
}

const required = [
  'lookupUrl?: string;',
  'const [lookupLabels, setLookupLabels]',
  'response.data?.data?.data || response.data?.data || response.data || []',
  'field.type === "lookup"',
  'if (Array.isArray(value))',
  'subjectId',
  'classId',
];
for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`MasterTable relation-field fix verification failed: ${marker}`);
  }
}

fs.writeFileSync(filePath, source, "utf8");
process.stdout.write("Master relation fields remain visible with normalized lookup labels.\n");

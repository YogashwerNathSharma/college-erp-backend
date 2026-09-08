const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../src/pages/masters/MasterForm.tsx');
const content = fs.readFileSync(file, 'utf8');

const marker = '    const error = errors[field.name];\n    const cls = `w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${error ? "border-red-400" : "border-gray-300 dark:border-slate-600"} bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200`;';
const insertion = `${marker}\n    const resultTypeOptions = modelKey === "result-type-master" && field.name === "name" && field.type === "select"\n      ? [\n          ...(field.options || []),\n          { label: "Marks + Grade", value: "BOTH" },\n          { label: "Marks + Grade + CGPA", value: "MARKS_GRADE_CGPA" },\n        ].filter((option, index, list) => list.findIndex(item => item.value === option.value) === index)\n      : field.options || [];`;

if (!content.includes('const resultTypeOptions = modelKey === "result-type-master"')) {
  if (!content.includes(marker)) throw new Error('MasterForm renderField marker not found');
  let updated = content.replace(marker, insertion);
  const oldSelect = 'field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)';
  if (!updated.includes(oldSelect)) throw new Error('MasterForm select options marker not found');
  updated = updated.replace(oldSelect, 'resultTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)');
  fs.writeFileSync(file, updated, 'utf8');
  console.log('Added combined Result Type options to MasterForm.tsx');
}

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  path.join(root, 'src/modules/masters/master.config.ts'),
  path.join(root, 'dist/modules/masters/master.config.js'),
];

const oldBlock = "{ name: 'name', label: 'Result Type', type: 'select', required: true, options: [\n            { label: 'Marks', value: 'MARKS' }, { label: 'Grade', value: 'GRADE' }, { label: 'CGPA', value: 'CGPA' },\n          ]},";

const newBlock = "{ name: 'name', label: 'Result Type', type: 'select', required: true, options: [\n            { label: 'Marks', value: 'MARKS' },\n            { label: 'Grade', value: 'GRADE' },\n            { label: 'CGPA', value: 'CGPA' },\n            { label: 'Marks + Grade', value: 'BOTH' },\n            { label: 'Marks + Grade + CGPA', value: 'MARKS_GRADE_CGPA' },\n          ]},";

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(newBlock)) continue;
  if (!content.includes(oldBlock)) {
    throw new Error(`Result Type options block not found in ${file}`);
  }
  fs.writeFileSync(file, content.replace(oldBlock, newBlock), 'utf8');
  console.log(`Updated Result Type options in ${file}`);
}

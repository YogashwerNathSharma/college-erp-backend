const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  path.join(root, 'src/modules/masters/master.config.ts'),
  path.join(root, 'dist/modules/masters/master.config.js'),
];

const oldBlock = "{ name: 'name', label: 'Result Type', type: 'select', required: true, options: [\n            { label: 'Marks', value: 'MARKS' }, { label: 'Grade', value: 'GRADE' }, { label: 'CGPA', value: 'CGPA' },\n          ]},";

const optionsBlock = "{ name: 'name', label: 'Result Type', type: 'select', required: true, options: [\n            { label: 'Marks', value: 'MARKS' },\n            { label: 'Grade', value: 'GRADE' },\n            { label: 'CGPA', value: 'CGPA' },\n            { label: 'Marks + Grade', value: 'BOTH' },\n            { label: 'Marks + Grade + CGPA', value: 'MARKS_GRADE_CGPA' },\n          ]},";
const calculationModeField = "          { name: 'calculationMode', label: 'Calculation Mode', type: 'select', options: [\n            { label: 'Automatic', value: 'AUTOMATIC' },\n            { label: 'Manual Formula', value: 'MANUAL' },\n          ]},";
const formulaField = "          { name: 'formula', label: 'Formula (optional for Manual mode)', type: 'textarea', placeholder: 'Example: percentage=(totalObtained/totalMaxMarks)*100; cgpa=averageGradePoint' },";

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(optionsBlock)) {
    if (!content.includes("name: 'calculationMode'")) {
      content = content.replace(optionsBlock, `${optionsBlock}\n${calculationModeField}`);
    }
    if (!content.includes("name: 'formula'")) {
      content = content.replace(calculationModeField, `${calculationModeField}\n${formulaField}`);
    }
  } else {
    if (!content.includes(oldBlock)) {
      throw new Error(`Result Type options block not found in ${file}`);
    }
    content = content.replace(oldBlock, `${optionsBlock}\n${calculationModeField}\n${formulaField}`);
  }
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated Result Type calculation configuration in ${file}`);
}

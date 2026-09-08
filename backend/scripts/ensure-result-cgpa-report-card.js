const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  path.join(root, 'src/modules/exam/exam.service.ts'),
  path.join(root, 'dist/modules/exam/exam.service.js'),
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const oldBlock = `          percentage: resultSummary.percentage,\n          grade: resultSummary.grade,`;
  const newBlock = `          percentage: resultSummary.percentage,\n          grade: resultSummary.grade,\n          cgpa: resultSummary.cgpa ?? null,`;
  if (content.includes(newBlock)) continue;
  if (!content.includes(oldBlock)) throw new Error(`Report card summary marker not found in ${file}`);
  fs.writeFileSync(file, content.replace(oldBlock, newBlock), 'utf8');
  console.log(`Added CGPA to report card summary in ${file}`);
}

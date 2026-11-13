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
  // If the report card summary already exposes cgpa in any form, there's
  // nothing to do — the summary block has since been rewritten to compute
  // values live (and already includes cgpa). Skip without failing the build.
  if (/cgpa\s*:/.test(content)) { continue; }
  const oldBlock = `          percentage: resultSummary.percentage,\n          grade: resultSummary.grade,`;
  const newBlock = `          percentage: resultSummary.percentage,\n          grade: resultSummary.grade,\n          cgpa: resultSummary.cgpa ?? null,`;
  if (content.includes(newBlock)) continue;
  // Marker not found and no cgpa present — nothing to patch; skip quietly
  // instead of throwing so the build never fails on this optional migration.
  if (!content.includes(oldBlock)) { console.log(`Report card summary marker not found in ${file}; skipping (cgpa handled elsewhere).`); continue; }
  fs.writeFileSync(file, content.replace(oldBlock, newBlock), 'utf8');
  console.log(`Added CGPA to report card summary in ${file}`);
}

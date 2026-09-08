const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function patch(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    if (content.includes(to)) continue;
    if (!content.includes(from)) throw new Error(`Result calculation UI marker not found in ${filePath}: ${from.slice(0, 80)}`);
    content = content.replace(from, to);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated result calculation UI: ${filePath}`);
}

patch(path.join(root, 'src/pages/exams/CreateEditExam.tsx'), [
  [
    '                  <option value="BOTH">Both (Marks + Grade)</option>\n                </select>',
    '                  <option value="BOTH">Both (Marks + Grade)</option>\n                  <option value="CGPA">CGPA Only</option>\n                  <option value="MARKS_GRADE_CGPA">Marks + Grade + CGPA</option>\n                </select>',
  ],
]);

patch(path.join(root, 'src/pages/exams/ReportCard.tsx'), [
  ['    grade: string;\n    rank: number;', '    grade: string;\n    cgpa?: number | null;\n    rank: number;'],
  [
    '              grade: raw.summary.grade || "-",\n              rank: raw.summary.rank,',
    '              grade: raw.summary.grade || "-",\n              cgpa: raw.summary.cgpa ?? null,\n              rank: raw.summary.rank,',
  ],
  [
    '      grade: "-",\n      rank: 0,',
    '      grade: "-",\n      cgpa: null,\n      rank: 0,',
  ],
  [
    '      grade: data.summary.grade || "",\n      division: data.summary.division || "",',
    '      grade: data.summary.grade || "",\n      cgpa: data.summary.cgpa != null ? String(data.summary.cgpa) : "",\n      division: data.summary.division || "",',
  ],
]);

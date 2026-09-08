const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function patch(filePath, updater) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, 'utf8');
  const updated = updater(original);
  if (updated === original) {
    console.log(`Result calculation UI already present: ${filePath}`);
    return;
  }
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`Updated result calculation UI: ${filePath}`);
}

patch(path.join(root, 'src/pages/exams/CreateEditExam.tsx'), (content) => {
  if (content.includes('value="MARKS_GRADE_CGPA"')) return content;
  const marker = '                  <option value="BOTH">Both (Marks + Grade)</option>';
  if (!content.includes(marker)) throw new Error(`Result calculation UI marker not found in CreateEditExam.tsx`);
  return content.replace(marker, `${marker}\n                  <option value="CGPA">CGPA Only</option>\n                  <option value="MARKS_GRADE_CGPA">Marks + Grade + CGPA</option>`);
});

patch(path.join(root, 'src/pages/exams/ReportCard.tsx'), (content) => {
  let updated = content;

  if (!updated.includes('cgpa?: number | null;')) {
    const summaryGrade = /summary:\s*\{[\s\S]*?percentage:\s*number;\s*grade:\s*string;/;
    if (!summaryGrade.test(updated)) throw new Error('ReportCard summary interface marker not found');
    updated = updated.replace(summaryGrade, (m) => `${m}\n    cgpa?: number | null;`);
  }

  if (!updated.includes('cgpa: raw.summary.cgpa ?? null,')) {
    const mappedGrade = '              grade: raw.summary.grade || "-",';
    if (!updated.includes(mappedGrade)) throw new Error('ReportCard mapped summary marker not found');
    updated = updated.replace(mappedGrade, `${mappedGrade}\n              cgpa: raw.summary.cgpa ?? null,`);
  }

  if (!updated.includes('cgpa: null,')) {
    const fallbackGrade = '              grade: "-",';
    if (!updated.includes(fallbackGrade)) throw new Error('ReportCard fallback summary marker not found');
    updated = updated.replace(fallbackGrade, `${fallbackGrade}\n              cgpa: null,`);
  }

  if (!updated.includes('cgpa: data.summary.cgpa != null ? String(data.summary.cgpa) : "",')) {
    const placeholderGrade = '      grade: data.summary.grade || "",';
    if (!updated.includes(placeholderGrade)) throw new Error('ReportCard placeholder map marker not found');
    updated = updated.replace(placeholderGrade, `${placeholderGrade}\n      cgpa: data.summary.cgpa != null ? String(data.summary.cgpa) : "",`);
  }

  return updated;
});

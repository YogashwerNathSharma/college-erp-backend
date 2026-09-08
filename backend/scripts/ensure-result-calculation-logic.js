const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  path.join(root, 'src/modules/exam/exam.service.ts'),
  path.join(root, 'dist/modules/exam/exam.service.js'),
];

const helperBlock = `// ─────────────────────────────────────────────────────
// RESULT CALCULATION ENGINE
// Automatic mode uses Grade Settings. Manual mode accepts safe arithmetic
// assignments such as: percentage=(totalObtained/totalMaxMarks)*100; cgpa=averageGradePoint
// ─────────────────────────────────────────────────────
function calculateGrade(
  percentage: number,
  gradeSettings: { grade: string; minPercent: number; maxPercent: number }[]
): string | null {
  if (!gradeSettings || gradeSettings.length === 0) return null;
  for (const gs of gradeSettings) {
    if (percentage >= gs.minPercent && percentage <= gs.maxPercent) return gs.grade;
  }
  return null;
}

function calculateGradePoint(
  percentage: number,
  gradeSettings: { grade: string; minPercent: number; maxPercent: number; gradePoint?: number | null }[]
): number | null {
  if (!gradeSettings || gradeSettings.length === 0) return null;
  for (const gs of gradeSettings) {
    if (percentage >= gs.minPercent && percentage <= gs.maxPercent) {
      return gs.gradePoint == null ? null : Number(gs.gradePoint);
    }
  }
  return null;
}

function evaluateFormulaExpression(expression: string, variables: Record<string, number>): number {
  const trimmed = expression.trim();
  if (!trimmed || !/^[0-9A-Za-z_+\\-*/().,%\\s]+$/.test(trimmed)) {
    throw new Error('Invalid formula. Use numbers, variables and + - * / ( ) only.');
  }
  const names = Object.keys(variables);
  const values = names.map((name) => variables[name]);
  const evaluator = Function(...names, '"use strict"; return (' + trimmed + ');');
  const result = Number(evaluator(...values));
  if (!Number.isFinite(result)) throw new Error('Formula returned a non-finite value.');
  return result;
}

function applyManualFormula(formula: string | null | undefined, context: Record<string, number>) {
  const output: { percentage?: number; cgpa?: number } = {};
  if (!formula || !formula.trim()) return output;

  const variables = {
    ...context,
    round: (value: number) => Math.round(value),
    min: Math.min,
    max: Math.max,
    abs: Math.abs,
  } as any;

  for (const statement of formula.split(';').map((s) => s.trim()).filter(Boolean)) {
    const equals = statement.indexOf('=');
    if (equals < 0) {
      output.percentage = evaluateFormulaExpression(statement, variables);
      variables.percentage = output.percentage;
      continue;
    }
    const key = statement.slice(0, equals).trim();
    const expression = statement.slice(equals + 1).trim();
    if (!['percentage', 'cgpa'].includes(key)) {
      throw new Error('Manual formula can set only percentage and cgpa.');
    }
    const value = evaluateFormulaExpression(expression, variables);
    output[key] = value;
    variables[key] = value;
  }
  return output;
}
`;

const generateFunction = `export const generateResultService = async (
  examId: string,
  tenantId: string
) => {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isDeleted: false },
  });
  if (!exam) throw new Error("Exam not found");

  const examSubjects = await prisma.examSubject.findMany({
    where: { examId, tenantId, isDeleted: false },
  });
  const totalMaxMarks = examSubjects.reduce((sum, es) => sum + es.maxMarks, 0);

  const allMarks = await prisma.marksEntry.findMany({
    where: { examId, tenantId, isDeleted: false },
  });

  const studentMarksMap: Record<string, typeof allMarks> = {};
  allMarks.forEach((m) => {
    if (!studentMarksMap[m.studentId]) studentMarksMap[m.studentId] = [];
    studentMarksMap[m.studentId].push(m);
  });

  const gradeSettings = await prisma.gradeSetting.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { minPercent: "desc" },
  });

  const resultTypeConfig = await prisma.resultType.findFirst({
    where: { tenantId, name: exam.resultType, isDeleted: false },
  });
  const resultType = String(exam.resultType || "BOTH").toUpperCase();
  const calculationMode = String(resultTypeConfig?.calculationMode || "AUTOMATIC").toUpperCase();
  const manualFormula = resultTypeConfig?.formula || null;

  const results: any[] = [];

  for (const [studentId, marks] of Object.entries(studentMarksMap)) {
    const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    let percentage = totalMaxMarks > 0 ? (totalObtained / totalMaxMarks) * 100 : 0;

    let passedSubjects = 0;
    let failedSubjects = 0;
    const subjectGradePoints: number[] = [];

    marks.forEach((m) => {
      const examSubject = examSubjects.find((es) => es.subjectId === m.subjectId);
      if (!examSubject) return;
      if (m.marksObtained >= examSubject.passingMarks && !m.isAbsent) passedSubjects++;
      else if (!m.isAbsent) failedSubjects++;

      if (!m.isAbsent && examSubject.maxMarks > 0) {
        const subjectPercentage = (m.marksObtained / examSubject.maxMarks) * 100;
        const point = calculateGradePoint(subjectPercentage, gradeSettings);
        if (point != null) subjectGradePoints.push(point);
      }
    });

    const averageGradePoint = subjectGradePoints.length
      ? subjectGradePoints.reduce((sum, point) => sum + point, 0) / subjectGradePoints.length
      : null;

    if (calculationMode === "MANUAL" && manualFormula) {
      const manual = applyManualFormula(manualFormula, {
        totalObtained,
        totalMaxMarks,
        percentage,
        averageGradePoint: averageGradePoint ?? 0,
        subjectCount: examSubjects.length,
        passedSubjects,
        failedSubjects,
      });
      if (manual.percentage != null) percentage = manual.percentage;
    }

    const grade = calculateGrade(percentage, gradeSettings);
    let cgpa = averageGradePoint;
    if (calculationMode === "MANUAL" && manualFormula) {
      const manual = applyManualFormula(manualFormula, {
        totalObtained,
        totalMaxMarks,
        percentage,
        averageGradePoint: averageGradePoint ?? 0,
        subjectCount: examSubjects.length,
        passedSubjects,
        failedSubjects,
      });
      if (manual.cgpa != null) cgpa = manual.cgpa;
    }

    const status = failedSubjects === 0 ? "PASS" : "FAIL";
    let division = null;
    if (status === "PASS") {
      if (percentage >= 60) division = "First";
      else if (percentage >= 45) division = "Second";
      else division = "Third";
    }

    const includeMarks = ["MARKS", "BOTH", "MARKS_GRADE_CGPA"].includes(resultType);
    const includeGrade = ["GRADE", "BOTH", "MARKS_GRADE_CGPA"].includes(resultType);
    const includeCgpa = ["CGPA", "MARKS_GRADE_CGPA"].includes(resultType);

    results.push({
      studentId,
      totalMarks: includeMarks ? Math.round(totalObtained * 100) / 100 : 0,
      totalMaxMarks,
      percentage: Math.round(percentage * 100) / 100,
      grade: includeGrade ? grade : null,
      cgpa: includeCgpa && cgpa != null ? Math.round(cgpa * 100) / 100 : null,
      division,
      status,
      totalSubjects: examSubjects.length,
      passedSubjects,
      failedSubjects,
    });
  }

  results.sort((a, b) => b.percentage - a.percentage);
  results.forEach((r, idx) => { r.rank = idx + 1; });

  await prisma.resultSummary.updateMany({
    where: { examId, tenantId },
    data: { isDeleted: true },
  });

  for (const r of results) {
    await prisma.resultSummary.create({
      data: {
        examId,
        studentId: r.studentId,
        tenantId,
        totalMarks: r.totalMarks,
        totalMaxMarks: r.totalMaxMarks,
        percentage: r.percentage,
        grade: r.grade,
        cgpa: r.cgpa,
        rank: r.rank,
        division: r.division,
        status: r.status,
        totalSubjects: r.totalSubjects,
        passedSubjects: r.passedSubjects,
        failedSubjects: r.failedSubjects,
      },
    });
  }

  await prisma.exam.update({
    where: { id: examId },
    data: { isPublished: true },
  });

  return {
    message: "Results generated successfully",
    totalStudents: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
  };
};`;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const helperRegex = /\/\/ ─+\n\/\/ HELPER: Calculate grade from percentage[\s\S]*?(?=\/\/ ─+\n\/\/ 1\. CREATE EXAM)/;
  if (helperRegex.test(content)) content = content.replace(helperRegex, helperBlock + '\n\n');
  else if (!content.includes('function applyManualFormula(')) throw new Error(`Result calculation helper block not found in ${file}`);

  const functionRegex = /export const generateResultService = async \([\s\S]*?\n\};\n\n(?=\/\/ ─+\n\/\/ 11\. GET RESULTS)/;
  if (functionRegex.test(content)) content = content.replace(functionRegex, generateFunction + '\n\n');
  else if (!content.includes('const resultTypeConfig = await prisma.resultType.findFirst')) throw new Error(`generateResultService block not found in ${file}`);

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated configurable result calculation logic in ${file}`);
}

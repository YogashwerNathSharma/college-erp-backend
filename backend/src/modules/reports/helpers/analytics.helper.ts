interface ExamResult {
  id: string;
  enrollment?: any;
  subject?: any;
  marksObtained: number;
  totalMarks: number;
  grade?: string;
}

interface StudentAnalytics {
  admissionNo: string;
  name: string;
  class: string;
  section: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  rank: number;
}

interface SubjectAnalytics {
  subject: string;
  totalStudents: number;
  highestMarks: number;
  lowestMarks: number;
  averageMarks: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
}

interface AnalyticsResult {
  studentResults: StudentAnalytics[];
  subjectAnalytics: SubjectAnalytics[];
  overallStats: {
    totalStudents: number;
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
    passCount: number;
    failCount: number;
    passPercentage: number;
    gradeDistribution: Record<string, number>;
  };
}

export const computeAnalytics = (results: ExamResult[]): AnalyticsResult => {
  // Group by student
  const studentMap: Record<string, { name: string; admissionNo: string; class: string; section: string; total: number; obtained: number; subjects: number }> = {};

  for (const r of results) {
    const studentId = r.enrollment?.student?.admissionNo || "unknown";
    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        name: `${r.enrollment?.student?.firstName || ""} ${r.enrollment?.student?.lastName || ""}`.trim(),
        admissionNo: studentId,
        class: r.enrollment?.class?.name || "N/A",
        section: r.enrollment?.section?.name || "N/A",
        total: 0,
        obtained: 0,
        subjects: 0,
      };
    }
    studentMap[studentId].total += r.totalMarks;
    studentMap[studentId].obtained += r.marksObtained;
    studentMap[studentId].subjects++;
  }

  // Student results with percentages and grades
  let studentResults: StudentAnalytics[] = Object.values(studentMap).map((s) => ({
    admissionNo: s.admissionNo,
    name: s.name,
    class: s.class,
    section: s.section,
    totalMarks: s.total,
    obtainedMarks: s.obtained,
    percentage: s.total > 0 ? Math.round((s.obtained / s.total) * 100 * 10) / 10 : 0,
    grade: calculateGrade(s.total > 0 ? (s.obtained / s.total) * 100 : 0),
    rank: 0,
  }));

  // Sort by percentage descending and assign ranks
  studentResults.sort((a, b) => b.percentage - a.percentage);
  studentResults.forEach((s, i) => { s.rank = i + 1; });

  // Subject analytics
  const subjectMap: Record<string, { marks: number[]; total: number }> = {};
  for (const r of results) {
    const subjectName = r.subject?.name || "Unknown";
    if (!subjectMap[subjectName]) {
      subjectMap[subjectName] = { marks: [], total: r.totalMarks };
    }
    subjectMap[subjectName].marks.push(r.marksObtained);
  }

  const subjectAnalytics: SubjectAnalytics[] = Object.entries(subjectMap).map(([subject, data]) => {
    const { marks, total } = data;
    const passMarks = total * 0.33;
    const passCount = marks.filter((m) => m >= passMarks).length;

    return {
      subject,
      totalStudents: marks.length,
      highestMarks: Math.max(...marks),
      lowestMarks: Math.min(...marks),
      averageMarks: Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10,
      passCount,
      failCount: marks.length - passCount,
      passPercentage: Math.round((passCount / marks.length) * 100),
    };
  });

  // Overall stats
  const percentages = studentResults.map((s) => s.percentage);
  const gradeDistribution: Record<string, number> = {};
  studentResults.forEach((s) => {
    gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
  });

  const passCount = studentResults.filter((s) => s.percentage >= 33).length;

  const overallStats = {
    totalStudents: studentResults.length,
    averagePercentage: percentages.length > 0 ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10) / 10 : 0,
    highestPercentage: percentages.length > 0 ? Math.max(...percentages) : 0,
    lowestPercentage: percentages.length > 0 ? Math.min(...percentages) : 0,
    passCount,
    failCount: studentResults.length - passCount,
    passPercentage: studentResults.length > 0 ? Math.round((passCount / studentResults.length) * 100) : 0,
    gradeDistribution,
  };

  return { studentResults, subjectAnalytics, overallStats };
};

function calculateGrade(percentage: number): string {
  if (percentage >= 91) return "A1";
  if (percentage >= 81) return "A2";
  if (percentage >= 71) return "B1";
  if (percentage >= 61) return "B2";
  if (percentage >= 51) return "C1";
  if (percentage >= 41) return "C2";
  if (percentage >= 33) return "D";
  return "E"; // Fail
}

export const getToppers = (results: ExamResult[], count: number = 5) => {
  const analytics = computeAnalytics(results);
  return analytics.studentResults.slice(0, count);
};

export const getSubjectWisePerformance = (results: ExamResult[]) => {
  const analytics = computeAnalytics(results);
  return analytics.subjectAnalytics;
};

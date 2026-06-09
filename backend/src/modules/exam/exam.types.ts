// ═══════════════════════════════════════════════════════
// exam.types.ts
// ═══════════════════════════════════════════════════════

export interface CreateExamInput {
  name: string;
  type?: string;
  classId: string;
  sectionId?: string;
  academicYearId: string;
  startDate?: string;
  endDate?: string;
  resultType?: string; // "MARKS" | "GRADE" | "BOTH"
}

export interface UpdateExamInput {
  name?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  resultType?: string;
}

export interface AddExamSubjectInput {
  examId: string;
  subjects: {
    subjectId: string;
    maxMarks: number;
    passingMarks: number;
  }[];
}

export interface MarksInput {
  studentId: string;
  subjectId: string;
  marksObtained: number;
  isAbsent?: boolean;
}

export interface EnterMarksInput {
  examId: string;
  marks: MarksInput[];
}

export interface GenerateResultInput {
  examId: string;
}

// ═══════════════════════════════════════════════════════
// exam.types.ts — Original + New Feature Types
// ═══════════════════════════════════════════════════════

// ─────────────── ORIGINAL TYPES (UNTOUCHED) ───────────────

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

// ─────────────── NEW TYPES (ADDED) ───────────────

export interface ExamScheduleInput {
  examId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  roomId: string;
}

export interface UpdateExamScheduleInput {
  examDate?: string;
  startTime?: string;
  endTime?: string;
  roomId?: string;
}

export interface SeatingInput {
  examScheduleId: string;
  roomId: string;
}

export interface AdmitCardInput {
  examId: string;
  studentIds?: string[];
}

export interface QuestionPaperInput {
  examId: string;
  subjectId: string;
  title: string;
  fileUrl: string;
}

export interface InvigilatorInput {
  examScheduleId: string;
  teacherId: string;
  role: "Chief" | "Assistant";
}

export interface GradeSettingInput {
  grade: string;
  minPercent: number;
  maxPercent: number;
  gradePoint: number;
  remarks?: string;
}


//////////////////////////////////////////////////////
// 📝 EXAM TYPES
//////////////////////////////////////////////////////

export type ExamType = "UNIT_TEST" | "HALF_YEARLY" | "ANNUAL" | "PRACTICE" | "COMPETITIVE" | "INTERNAL";

export type GradeSystem = "PERCENTAGE" | "GRADE" | "CGPA";

export type ResultStatus = "PASS" | "FAIL" | "ABSENT" | "WITHHELD" | "COMPARTMENT";

export interface Exam {
  id: string;
  tenantId: string;
  name: string;
  academicYearId: string;
  examType: ExamType;
  startDate: Date;
  endDate: Date;
  classes: string[];
  maxMarks: number;
  passingMarks: number;
  gradeSystem: GradeSystem;
  isPublished: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  subjectName: string;
  date: Date;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  room?: string;
  invigilator?: string;
}

export interface MarksEntry {
  id: string;
  examId: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
  isAbsent: boolean;
}

export interface StudentResult {
  studentId: string;
  studentName: string;
  admissionNo: string;
  examId: string;
  examName: string;
  subjects: SubjectResult[];
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  status: ResultStatus;
  remarks?: string;
}

export interface SubjectResult {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  status: ResultStatus;
}

export interface GradeConfig {
  id: string;
  tenantId: string;
  name: string;
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  gradePoint: number;
  remarks: string;
}

export interface ExamCreateInput {
  name: string;
  examType: ExamType;
  academicYearId: string;
  startDate: string;
  endDate: string;
  classes: string[];
  maxMarks: number;
  passingMarks: number;
  gradeSystem?: GradeSystem;
}

export interface MarksEntryInput {
  examId: string;
  examSubjectId: string;
  entries: {
    studentId: string;
    marksObtained: number;
    isAbsent?: boolean;
    remarks?: string;
  }[];
}

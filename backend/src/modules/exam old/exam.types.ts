export interface CreateExamInput {
  name: string;
  type?: string;
  classId: string;
}

export interface AddExamSubjectInput {
  examId: string;
  subjectId: string;
  maxMarks: number;
}

export interface MarksInput {
  studentId: string;
  subjectId: string;
  marksObtained: number;
}

export interface EnterMarksInput {
  examId: string;
  marks: MarksInput[];
}
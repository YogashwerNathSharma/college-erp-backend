
export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
}

export interface StudentAttendanceInput {
  studentId: string;
  status: AttendanceStatus;
}

export interface MarkAttendanceBody {
  classId: string;
  sectionId: string;
  academicYearId: string; // ← NEW
  date: string;
  students: StudentAttendanceInput[];
}

export interface UpdateAttendanceBody {
  classId: string;
  sectionId: string;
  date: string;
  students: StudentAttendanceInput[];
}


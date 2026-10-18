

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
  academicYearId: string;
  date: string;
  students: StudentAttendanceInput[];
}

export interface UpdateAttendanceBody {
  classId: string;
  sectionId: string;
  academicYearId: string;
  date: string;
  students: StudentAttendanceInput[];
}

// Dashboard stats
export interface AttendanceDashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendancePercentage: string;
  monthlyTrend: { date: string; present: number; absent: number }[];
}


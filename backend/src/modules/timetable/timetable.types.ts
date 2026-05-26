import { DayOfWeek } from "@prisma/client";

export interface CreateTimetableInput {
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  day: DayOfWeek;
  period: number;

  // 🔥 optional (service inject करेगा)
  tenantId?: string;
}
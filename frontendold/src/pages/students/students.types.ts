export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Section {
  id: string;
  name: string;
  classId: string;
}

export interface Class {
  id: string;
  name: string;
  sections: Section[];
}

export interface Enrollment {
  id: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  class: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  email: string;
  phone: string;
  address: string;
  admissionNo: string;
  rollNumber?: string | null;
  fatherName: string;
  motherName: string;
  parentPhone: string;
  academicYearId: string;
  enrollments: Enrollment[];
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFormData {
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  email: string;
  phone: string;
  address: string;
  admissionNo: string;
  rollNumber?: string;
  classId: string;
  sectionId: string;
  fatherName: string;
  motherName: string;
  parentPhone: string;
  academicYearId?: string;
}

export interface StudentFilters {
  search: string;
  classId: string;
  sectionId: string;
  gender: string;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}

export interface StudentStats {
  total: number;
  male: number;
  female: number;
  newThisMonth: number;
}
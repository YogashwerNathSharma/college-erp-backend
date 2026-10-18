import { Gender, BloodGroup, Address, ContactInfo } from "./common.types";

//////////////////////////////////////////////////////
// 👨‍🏫 TEACHER TYPES
//////////////////////////////////////////////////////

export type TeacherDesignation =
  | "PRINCIPAL"
  | "VICE_PRINCIPAL"
  | "HOD"
  | "SENIOR_TEACHER"
  | "TEACHER"
  | "ASSISTANT_TEACHER"
  | "PET"
  | "LIBRARIAN"
  | "LAB_ASSISTANT"
  | "COUNSELOR";

export type EmploymentType = "PERMANENT" | "CONTRACT" | "PART_TIME" | "VISITING";

export type TeacherStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export interface TeacherBase {
  id: string;
  tenantId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  dateOfBirth: Date;
  bloodGroup?: BloodGroup;
  phone: string;
  email: string;
  photo?: string;
  aadharNo?: string;
  panNo?: string;
}

export interface TeacherProfessional {
  designation: TeacherDesignation;
  department?: string;
  employmentType: EmploymentType;
  joiningDate: Date;
  qualification: string;
  specialization?: string;
  experience: number;
  subjects: string[];
}

export interface TeacherSalary {
  basicPay: number;
  hra: number;
  da: number;
  ta: number;
  otherAllowances: number;
  pf: number;
  tax: number;
  otherDeductions: number;
  netSalary: number;
}

export interface Teacher extends TeacherBase, TeacherProfessional {
  address: Address;
  salary: TeacherSalary;
  status: TeacherStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherCreateInput {
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  phone: string;
  email: string;
  designation: TeacherDesignation;
  employmentType: EmploymentType;
  joiningDate: string;
  qualification: string;
  subjects: string[];
  address: Address;
  basicPay: number;
}

export interface TeacherFilter {
  designation?: TeacherDesignation;
  department?: string;
  employmentType?: EmploymentType;
  status?: TeacherStatus;
  search?: string;
}

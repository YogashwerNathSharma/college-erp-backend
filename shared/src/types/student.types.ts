import { Gender, BloodGroup, Religion, Category, Address, ContactInfo } from "./common.types";

//////////////////////////////////////////////////////
// 🎓 STUDENT TYPES
//////////////////////////////////////////////////////

export interface StudentBase {
  id: string;
  tenantId: string;
  admissionNo: string;
  rollNo?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  dateOfBirth: Date;
  bloodGroup?: BloodGroup;
  religion?: Religion;
  category?: Category;
  nationality: string;
  motherTongue?: string;
  aadharNo?: string;
  photo?: string;
}

export interface StudentAcademic {
  classId: string;
  sectionId: string;
  academicYearId: string;
  admissionDate: Date;
  previousSchool?: string;
  previousClass?: string;
  tcNo?: string;
}

export interface StudentParent {
  fatherName: string;
  fatherPhone: string;
  fatherOccupation?: string;
  fatherEmail?: string;
  motherName: string;
  motherPhone?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
}

export interface StudentAddress {
  currentAddress: Address;
  permanentAddress: Address;
  isSameAddress: boolean;
}

export interface StudentTransport {
  isTransportUser: boolean;
  routeId?: string;
  stopId?: string;
  pickupPoint?: string;
}

export interface StudentHostel {
  isHostelResident: boolean;
  hostelId?: string;
  roomId?: string;
  bedNo?: string;
}

export interface Student extends StudentBase, StudentAcademic, StudentParent {
  address: StudentAddress;
  transport: StudentTransport;
  hostel: StudentHostel;
  status: StudentStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StudentStatus = "ACTIVE" | "INACTIVE" | "LEFT" | "PASSED_OUT" | "EXPELLED" | "SUSPENDED";

export interface StudentCreateInput {
  admissionNo: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  dateOfBirth: string;
  bloodGroup?: BloodGroup;
  religion?: Religion;
  category?: Category;
  nationality?: string;
  motherTongue?: string;
  aadharNo?: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  admissionDate: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  currentAddress: Address;
  permanentAddress?: Address;
  isSameAddress?: boolean;
}

export interface StudentUpdateInput extends Partial<StudentCreateInput> {
  status?: StudentStatus;
  isActive?: boolean;
}

export interface StudentFilter {
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
  status?: StudentStatus;
  gender?: Gender;
  category?: Category;
  search?: string;
}

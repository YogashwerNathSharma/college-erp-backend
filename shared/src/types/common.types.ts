//////////////////////////////////////////////////////
// 🌐 COMMON TYPES
//////////////////////////////////////////////////////

export type Role = "SUPER_ADMIN" | "TENANT_ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type Religion = "HINDU" | "MUSLIM" | "CHRISTIAN" | "SIKH" | "BUDDHIST" | "JAIN" | "OTHER";

export type Category = "GENERAL" | "OBC" | "SC" | "ST" | "EWS" | "OTHER";

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface ContactInfo {
  phone: string;
  altPhone?: string;
  email?: string;
}

export interface TenantBase {
  id: string;
  name: string;
  code: string;
  domain?: string;
  logo?: string;
  primaryColor?: string;
  address: Address;
  contact: ContactInfo;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

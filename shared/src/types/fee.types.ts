//////////////////////////////////////////////////////
// 💰 FEE TYPES
//////////////////////////////////////////////////////

export type FeeFrequency = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

export type PaymentMode = "CASH" | "CHEQUE" | "ONLINE" | "UPI" | "BANK_TRANSFER" | "DD";

export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE" | "WAIVED";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface FeeHead {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  isOptional: boolean;
  isRefundable: boolean;
  isActive: boolean;
}

export interface FeeStructure {
  id: string;
  tenantId: string;
  name: string;
  academicYearId: string;
  classId: string;
  frequency: FeeFrequency;
  dueDate: Date;
  items: FeeStructureItem[];
  totalAmount: number;
  isActive: boolean;
}

export interface FeeStructureItem {
  feeHeadId: string;
  feeHeadName: string;
  amount: number;
}

export interface FeePayment {
  id: string;
  tenantId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  receiptNo: string;
  feeStructureId: string;
  paidAmount: number;
  totalAmount: number;
  discountAmount: number;
  fineAmount: number;
  paymentMode: PaymentMode;
  paymentDate: Date;
  status: PaymentStatus;
  remarks?: string;
  collectedBy: string;
  items: FeePaymentItem[];
}

export interface FeePaymentItem {
  feeHeadId: string;
  feeHeadName: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
}

export interface FeeDiscount {
  id: string;
  tenantId: string;
  name: string;
  type: DiscountType;
  value: number;
  applicableTo: "ALL" | "CLASS" | "CATEGORY" | "INDIVIDUAL";
  criteria?: string;
  isActive: boolean;
}

export interface FeeCollectionInput {
  studentId: string;
  feeStructureId: string;
  paidAmount: number;
  paymentMode: PaymentMode;
  discountId?: string;
  remarks?: string;
  items: { feeHeadId: string; amount: number }[];
}

export interface FeeDefaulter {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  totalDue: number;
  monthsOverdue: number;
  fatherPhone: string;
}

export interface FeeSummary {
  totalCollected: number;
  totalPending: number;
  totalDiscount: number;
  totalFine: number;
  totalStudents: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

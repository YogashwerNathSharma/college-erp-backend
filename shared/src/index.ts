// Types
export * from "./types/common.types";
export * from "./types/student.types";
export * from "./types/teacher.types";
export * from "./types/fee.types";
export * from "./types/exam.types";

// Validators
// Export schemas explicitly so validator-inferred input type aliases do not
// collide with the canonical public input interfaces exported above.
export {
  addressSchema,
  studentCreateSchema,
  studentUpdateSchema,
  studentFilterSchema,
} from "./validators/student.validator";
export {
  feeHeadCreateSchema,
  feeStructureCreateSchema,
  feeCollectionSchema,
  feeDiscountCreateSchema,
} from "./validators/fee.validator";
export * from "./validators/common.validator";

// Constants
export * from "./constants/roles";
export * from "./constants/permissions";
export * from "./constants/indianStates";

// Utils
export * from "./utils/dateFormat";
export * from "./utils/currencyFormat";

//////////////////////////////////////////////////////
// 🖨️ PRINT SYSTEM — Barrel Exports
// Complete production-ready print system with YN-UDP integration.
//////////////////////////////////////////////////////

// ─── Components ───────────────────────────────────────────────────────────────
export { default as PrintLayout } from './PrintLayout';
export { default as AdmitCardPrint } from './AdmitCardPrint';
export { default as ReportCardPrint } from './ReportCardPrint';
export { default as FeeReceiptPrint } from './FeeReceiptPrint';
export { default as TCPrint } from './TCPrint';
export { default as CharacterCertPrint } from './CharacterCertPrint';
export { default as IDCardPrint } from './IDCardPrint';
export { default as AttendanceSheetPrint } from './AttendanceSheetPrint';
export { default as SeatingPrint } from './SeatingPrint';
export { default as BonafidePrint } from './BonafidePrint';

// ─── Types ────────────────────────────────────────────────────────────────────
export type { PrintLayoutProps } from './PrintLayout';
export type { AdmitCardData, AdmitCardSubject } from './AdmitCardPrint';
export type { ReportCardData, ReportCardSubject } from './ReportCardPrint';
export type { FeeReceiptData, FeeItem } from './FeeReceiptPrint';
export type { TCData } from './TCPrint';
export type { CharacterCertData } from './CharacterCertPrint';
export type { IDCardData } from './IDCardPrint';
export type { AttendanceSheetData, AttendanceStudent } from './AttendanceSheetPrint';
export type { SeatingData, RoomSeating, SeatPosition } from './SeatingPrint';
export type { BonafideCertData } from './BonafidePrint';

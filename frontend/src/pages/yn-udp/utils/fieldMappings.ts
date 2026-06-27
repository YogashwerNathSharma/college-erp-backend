// ══════════════════════════════════════════════════════
// YN-UDP — Database Field Mappings
// These are the placeholders users can drag onto canvas
// At print time, {{field_key}} gets replaced with real data
// ══════════════════════════════════════════════════════

import { FieldMapping } from "./templateTypes";

export const FIELD_MAPPINGS: FieldMapping[] = [
  // ─── STUDENT FIELDS ───
  { key: "student_name", label: "Student Full Name", category: "student", type: "text" },
  { key: "first_name", label: "First Name", category: "student", type: "text" },
  { key: "last_name", label: "Last Name", category: "student", type: "text" },
  { key: "father_name", label: "Father's Name", category: "student", type: "text" },
  { key: "mother_name", label: "Mother's Name", category: "student", type: "text" },
  { key: "guardian_name", label: "Guardian Name", category: "student", type: "text" },
  { key: "dob", label: "Date of Birth", category: "student", type: "date" },
  { key: "gender", label: "Gender", category: "student", type: "text" },
  { key: "class", label: "Class", category: "student", type: "text" },
  { key: "section", label: "Section", category: "student", type: "text" },
  { key: "roll_number", label: "Roll Number", category: "student", type: "text" },
  { key: "admission_no", label: "Admission No", category: "student", type: "text" },
  { key: "sr_no", label: "SR Number", category: "student", type: "text" },
  { key: "address", label: "Address", category: "student", type: "text" },
  { key: "phone", label: "Phone", category: "student", type: "text" },
  { key: "email", label: "Email", category: "student", type: "text" },
  { key: "photo", label: "Student Photo", category: "student", type: "image" },
  { key: "blood_group", label: "Blood Group", category: "student", type: "text" },
  { key: "category", label: "Category", category: "student", type: "text" },
  { key: "religion", label: "Religion", category: "student", type: "text" },
  { key: "nationality", label: "Nationality", category: "student", type: "text" },
  { key: "aadhar_no", label: "Aadhar Number", category: "student", type: "text" },
  { key: "admission_date", label: "Admission Date", category: "student", type: "date" },

  // ─── SCHOOL FIELDS ───
  { key: "school_name", label: "School Name", category: "school", type: "text" },
  { key: "school_logo", label: "School Logo", category: "school", type: "image" },
  { key: "school_address", label: "School Address", category: "school", type: "text" },
  { key: "school_phone", label: "School Phone", category: "school", type: "text" },
  { key: "school_email", label: "School Email", category: "school", type: "text" },
  { key: "principal_name", label: "Principal Name", category: "school", type: "text" },
  { key: "principal_signature", label: "Principal Signature", category: "school", type: "image" },
  { key: "school_stamp", label: "School Stamp", category: "school", type: "image" },
  { key: "affiliation_no", label: "Affiliation No", category: "school", type: "text" },

  // ─── EXAM FIELDS ───
  { key: "exam_name", label: "Exam Name", category: "exam", type: "text" },
  { key: "exam_type", label: "Exam Type", category: "exam", type: "text" },
  { key: "subject_name", label: "Subject Name", category: "exam", type: "text" },
  { key: "marks_obtained", label: "Marks Obtained", category: "exam", type: "number" },
  { key: "max_marks", label: "Max Marks", category: "exam", type: "number" },
  { key: "grade", label: "Grade", category: "exam", type: "text" },
  { key: "percentage", label: "Percentage", category: "exam", type: "number" },
  { key: "rank", label: "Rank", category: "exam", type: "number" },
  { key: "result", label: "Result (Pass/Fail)", category: "exam", type: "text" },
  { key: "exam_date", label: "Exam Date", category: "exam", type: "date" },
  { key: "total_marks", label: "Total Marks", category: "exam", type: "number" },
  { key: "grade_point", label: "Grade Point", category: "exam", type: "number" },

  // ─── FEE FIELDS ───
  { key: "total_fee", label: "Total Fee", category: "fee", type: "number" },
  { key: "paid_amount", label: "Paid Amount", category: "fee", type: "number" },
  { key: "balance_amount", label: "Balance Amount", category: "fee", type: "number" },
  { key: "payment_date", label: "Payment Date", category: "fee", type: "date" },
  { key: "receipt_no", label: "Receipt Number", category: "fee", type: "text" },
  { key: "fee_month", label: "Fee Month", category: "fee", type: "text" },
  { key: "payment_mode", label: "Payment Mode", category: "fee", type: "text" },

  // ─── GENERAL FIELDS ───
  { key: "current_date", label: "Current Date", category: "general", type: "date" },
  { key: "academic_year", label: "Academic Year", category: "general", type: "text" },
  { key: "serial_number", label: "Serial Number", category: "general", type: "text" },
  { key: "qr_code", label: "QR Code", category: "general", type: "image" },
  { key: "issue_date", label: "Issue Date", category: "general", type: "date" },
  { key: "certificate_no", label: "Certificate Number", category: "general", type: "text" },
];

export const FIELD_CATEGORIES = [
  { key: "student", label: "📚 Student", color: "#3b82f6" },
  { key: "school", label: "🏫 School", color: "#10b981" },
  { key: "exam", label: "📝 Exam", color: "#f59e0b" },
  { key: "fee", label: "💰 Fee", color: "#ef4444" },
  { key: "general", label: "⚙️ General", color: "#8b5cf6" },
] as const;

export function getFieldsByCategory(category: string): FieldMapping[] {
  return FIELD_MAPPINGS.filter((f) => f.category === category);
}

export function getFieldByKey(key: string): FieldMapping | undefined {
  return FIELD_MAPPINGS.find((f) => f.key === key);
}

export interface FieldMapping {
  key: string;
  label: string;
  category: FieldCategory;
}

export type FieldCategory = "Student" | "School" | "Exam" | "Fee" | "General";

export const FIELD_CATEGORIES: { name: FieldCategory; color: string; icon: string }[] = [
  { name: "Student", color: "#3b82f6", icon: "👨‍🎓" },
  { name: "School", color: "#10b981", icon: "🏫" },
  { name: "Exam", color: "#f59e0b", icon: "📝" },
  { name: "Fee", color: "#ef4444", icon: "💰" },
  { name: "General", color: "#8b5cf6", icon: "📋" },
];

export const FIELD_MAPPINGS: FieldMapping[] = [
  // Student Fields
  { key: "student_name", label: "Student Full Name", category: "Student" },
  { key: "first_name", label: "First Name", category: "Student" },
  { key: "last_name", label: "Last Name", category: "Student" },
  { key: "father_name", label: "Father's Name", category: "Student" },
  { key: "mother_name", label: "Mother's Name", category: "Student" },
  { key: "father_phone", label: "Father's Phone", category: "Student" },
  { key: "dob", label: "Date of Birth", category: "Student" },
  { key: "gender", label: "Gender", category: "Student" },
  { key: "class_name", label: "Class", category: "Student" },
  { key: "section_name", label: "Section", category: "Student" },
  { key: "roll_number", label: "Roll Number", category: "Student" },
  { key: "admission_no", label: "Admission No", category: "Student" },
  { key: "sr_no", label: "SR Number", category: "Student" },
  { key: "address", label: "Address", category: "Student" },
  { key: "phone", label: "Phone", category: "Student" },
  { key: "photo", label: "Photo", category: "Student" },
  { key: "blood_group", label: "Blood Group", category: "Student" },
  { key: "category", label: "Category", category: "Student" },
  { key: "religion", label: "Religion", category: "Student" },
  { key: "aadhar_no", label: "Aadhar No", category: "Student" },

  // School Fields
  { key: "school_name", label: "School Name", category: "School" },
  { key: "school_logo", label: "School Logo", category: "School" },
  { key: "school_address", label: "School Address", category: "School" },
  { key: "school_phone", label: "School Phone", category: "School" },
  { key: "school_email", label: "School Email", category: "School" },
  { key: "principal_name", label: "Principal Name", category: "School" },
  { key: "principal_signature", label: "Principal Signature", category: "School" },

  // Exam Fields
  { key: "exam_name", label: "Exam Name", category: "Exam" },
  { key: "exam_type", label: "Exam Type", category: "Exam" },
  { key: "subject_name", label: "Subject Name", category: "Exam" },
  { key: "marks_obtained", label: "Marks Obtained", category: "Exam" },
  { key: "max_marks", label: "Maximum Marks", category: "Exam" },
  { key: "grade", label: "Grade", category: "Exam" },
  { key: "percentage", label: "Percentage", category: "Exam" },
  { key: "rank", label: "Rank", category: "Exam" },
  { key: "result_status", label: "Result Status", category: "Exam" },
  { key: "exam_date", label: "Exam Date", category: "Exam" },

  // Fee Fields
  { key: "total_fee", label: "Total Fee", category: "Fee" },
  { key: "paid_amount", label: "Paid Amount", category: "Fee" },
  { key: "balance_amount", label: "Balance Amount", category: "Fee" },
  { key: "due_date", label: "Due Date", category: "Fee" },
  { key: "payment_date", label: "Payment Date", category: "Fee" },
  { key: "receipt_no", label: "Receipt No", category: "Fee" },
  { key: "fee_structure_name", label: "Fee Structure Name", category: "Fee" },

  // General Fields
  { key: "current_date", label: "Current Date", category: "General" },
  { key: "academic_year", label: "Academic Year", category: "General" },
  { key: "serial_number", label: "Serial Number", category: "General" },
  { key: "qr_code", label: "QR Code", category: "General" },
  { key: "barcode", label: "Barcode", category: "General" },
];

export const getFieldsByCategory = (category: FieldCategory): FieldMapping[] => {
  return FIELD_MAPPINGS.filter((f) => f.category === category);
};

export const getCategoryColor = (category: FieldCategory): string => {
  return FIELD_CATEGORIES.find((c) => c.name === category)?.color || "#6b7280";
};

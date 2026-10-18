// ══════════════════════════════════════════════════════
// YN-UDP — Sample Data for Preview
// Used to show live preview of templates with dummy data
// ══════════════════════════════════════════════════════

export const SAMPLE_DATA: Record<string, string> = {
  // Student
  student_name: "Aarav Sharma",
  first_name: "Aarav",
  last_name: "Sharma",
  father_name: "Rajesh Sharma",
  mother_name: "Sunita Sharma",
  guardian_name: "Rajesh Sharma",
  dob: "15-03-2012",
  gender: "Male",
  class: "VIII",
  section: "A",
  roll_number: "12",
  admission_no: "ADM/2025/0001",
  sr_no: "SR/00001",
  address: "Ward 5, Bareilly, UP 243001",
  phone: "9876543210",
  email: "aarav.sharma@school.com",
  photo: "/api/placeholder/photo",
  blood_group: "B+",
  category: "General",
  religion: "Hindu",
  nationality: "Indian",
  aadhar_no: "1234-5678-9012",
  admission_date: "01-04-2020",

  // School
  school_name: "Delhi Public School",
  school_logo: "/api/placeholder/logo",
  school_address: "Civil Lines, Bareilly, UP 243001",
  school_phone: "0581-2345678",
  school_email: "info@dps-bareilly.edu",
  principal_name: "Dr. Anita Verma",
  principal_signature: "/api/placeholder/signature",
  school_stamp: "/api/placeholder/stamp",
  affiliation_no: "2131456",

  // Exam
  exam_name: "Unit Test 1",
  exam_type: "UNIT_TEST",
  subject_name: "Mathematics",
  marks_obtained: "87",
  max_marks: "100",
  grade: "A",
  percentage: "87%",
  rank: "3",
  result: "Pass",
  exam_date: "15-06-2025",
  total_marks: "524",
  grade_point: "9.2",

  // Fee
  total_fee: "₹10,000",
  paid_amount: "₹7,500",
  balance_amount: "₹2,500",
  payment_date: "10-04-2025",
  receipt_no: "RCP/2025/001",
  fee_month: "April 2025",
  payment_mode: "Cash",

  // General
  current_date: "19-06-2026",
  academic_year: "2025-26",
  serial_number: "001",
  qr_code: "/api/placeholder/qr",
  issue_date: "19-06-2026",
  certificate_no: "CERT/2025/001",
};

export function replacePlaceholders(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return SAMPLE_DATA[key] || match;
  });
}

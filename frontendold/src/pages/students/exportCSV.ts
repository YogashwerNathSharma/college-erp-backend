import type { Student } from "./students.types";

/**
 * Converts an array of students to CSV format and triggers a download.
 */
export function exportStudentsCSV(students: Student[], filename?: string): void {
  if (!students.length) return;

  const headers = [
    "Admission No",
    "First Name",
    "Last Name",
    "Gender",
    "Date of Birth",
    "Email",
    "Phone",
    "Address",
    "Class",
    "Section",
    "Roll Number",
    "Father Name",
    "Mother Name",
    "Parent Phone",
    "Created At",
  ];

  const rows = students.map((student) => {
    const enrollment = student.enrollments?.[0];
    return [
      escapeCSV(student.admissionNo),
      escapeCSV(student.firstName),
      escapeCSV(student.lastName),
      student.gender,
      formatDate(student.dob),
      escapeCSV(student.email),
      escapeCSV(student.phone),
      escapeCSV(student.address),
      escapeCSV(enrollment?.class?.name || "N/A"),
      escapeCSV(enrollment?.section?.name || "N/A"),
      escapeCSV(student.rollNumber || ""),
      escapeCSV(student.fatherName),
      escapeCSV(student.motherName),
      escapeCSV(student.parentPhone),
      formatDate(student.createdAt),
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `students_export_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
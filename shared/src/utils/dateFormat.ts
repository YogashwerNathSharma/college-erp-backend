//////////////////////////////////////////////////////
// 📅 DATE FORMATTING UTILITIES
//////////////////////////////////////////////////////

/**
 * Format date to DD/MM/YYYY (Indian format)
 */
export function formatDateDMY(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date to YYYY-MM-DD (ISO format for inputs)
 */
export function formatDateISO(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Format date to readable string: "15 Jan 2024"
 */
export function formatDateReadable(date: Date | string): string {
  const d = new Date(date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format date with time: "15 Jan 2024, 2:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  const dateStr = formatDateReadable(d);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${dateStr}, ${hour12}:${minutes} ${ampm}`;
}

/**
 * Get relative time: "2 hours ago", "3 days ago"
 */
export function getRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return formatDateReadable(d);
}

/**
 * Get academic year string: "2024-25"
 */
export function getAcademicYear(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  // Academic year starts in April (month 3)
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(2)}`;
  }
  return `${year - 1}-${year.toString().slice(2)}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: Date | string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

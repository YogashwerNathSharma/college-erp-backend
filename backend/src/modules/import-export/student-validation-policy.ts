// Student imports are intentionally permissive at preview time.
// The fast processor is responsible for row-level database errors.
// Optional contact/date fields should not block importing an otherwise usable student.
export function validateStudentImportRow(row: Record<string, any>, mapping: Record<string, string>) {
  const valueFor = (target: string) => {
    const source = Object.keys(mapping || {}).find((key) => mapping[key] === target);
    return source ? row[source] : undefined;
  };
  const clean = (value: any) => value == null ? "" : String(value).trim();

  const admissionNo = clean(valueFor("admissionNo"));
  let firstName = clean(valueFor("firstName"));
  const fullName = clean(valueFor("fullName"));
  const lastName = clean(valueFor("lastName"));

  if (!firstName && fullName) firstName = fullName.split(/\s+/).filter(Boolean)[0] || "";
  if (!firstName && lastName) firstName = lastName;

  const errors: string[] = [];
  if (!admissionNo) errors.push("Admission Number is required");
  if (!firstName) errors.push("Name or First Name is required");

  return { isValid: errors.length === 0, errors };
}

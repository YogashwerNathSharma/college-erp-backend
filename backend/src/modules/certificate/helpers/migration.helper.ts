interface MigrationCertData {
  studentName: string;
  fatherName: string;
  className: string;
  board: string;
  migratingTo: string;
  issueDate: Date;
}

export const generateMigrationCertData = (
  student: any,
  migratingTo: string,
  purpose: string
): MigrationCertData => {
  return {
    studentName: `${student.firstName} ${student.lastName}`,
    fatherName: student.fatherName || "",
    className: "", // Populated from enrollment
    board: "CBSE", // From tenant settings
    migratingTo,
    issueDate: new Date(),
  };
};

export const getMigrationCertTemplate = (tenantName: string) => ({
  headerText: "MIGRATION CERTIFICATE",
  bodyTemplate: `This is to certify that {{studentName}}, son/daughter of {{fatherName}}, ` +
    `bearing Registration No. {{regNo}}, was a student of this institution affiliated to {{board}}. ` +
    `The student is migrating to {{migratingTo}}.`,
  conditions: [
    "No dues are pending against the student.",
    "The student has submitted all library books.",
    "This certificate is valid for one year from the date of issue.",
  ],
  footerText: "Issued for the purpose of admission.",
  signatureFields: ["Principal", "Registrar"],
});

export const validateMigrationEligibility = async (
  studentId: string,
  tenantId: string
): Promise<{ eligible: boolean; reason?: string }> => {
  // Similar to TC eligibility — check for pending dues, books, etc.
  return { eligible: true };
};

export const formatMigrationCertForPrint = (cert: any, template: any): string => {
  let body = template.bodyTemplate;
  body = body.replace("{{studentName}}", cert.studentName);
  body = body.replace("{{fatherName}}", cert.fatherName);
  body = body.replace("{{regNo}}", cert.admissionNo || "N/A");
  body = body.replace("{{board}}", cert.board || "N/A");
  body = body.replace("{{migratingTo}}", cert.migratingTo || "N/A");

  return `
    <div class="certificate">
      <h1>${template.headerText}</h1>
      <p>${body}</p>
      <ul>
        ${template.conditions.map((c: string) => `<li>${c}</li>`).join("")}
      </ul>
      <p>Date: ${new Date(cert.issueDate).toLocaleDateString("en-IN")}</p>
      <div class="signatures">
        ${template.signatureFields.map((s: string) => `<div class="sig-block">${s}</div>`).join("")}
      </div>
    </div>
  `;
};

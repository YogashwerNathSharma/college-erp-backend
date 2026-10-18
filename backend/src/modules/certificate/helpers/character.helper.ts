interface CharacterCertData {
  studentName: string;
  fatherName: string;
  className: string;
  conduct: string;
  character: string;
  issueDate: Date;
}

export const generateCharacterCertData = (student: any, purpose: string): CharacterCertData => {
  return {
    studentName: `${student.firstName} ${student.lastName}`,
    fatherName: student.fatherName || "",
    className: "", // Will be populated from enrollment
    conduct: "Good",
    character: "Good",
    issueDate: new Date(),
  };
};

export const getCharacterCertTemplate = (tenantName: string) => ({
  headerText: "CHARACTER CERTIFICATE",
  bodyTemplate: `This is to certify that {{studentName}}, son/daughter of {{fatherName}}, ` +
    `was a bonafide student of this institution. During their stay in this institution, ` +
    `their conduct and character were found to be {{character}}.`,
  footerText: `This certificate is issued on request for ${tenantName} purposes.`,
  signatureFields: ["Principal"],
});

export const formatCharacterCertForPrint = (cert: any, template: any): string => {
  let body = template.bodyTemplate;
  body = body.replace("{{studentName}}", cert.studentName);
  body = body.replace("{{fatherName}}", cert.fatherName);
  body = body.replace("{{character}}", cert.character || "Good");

  return `
    <div class="certificate">
      <h1>${template.headerText}</h1>
      <p>${body}</p>
      <p>Date: ${new Date(cert.issueDate).toLocaleDateString("en-IN")}</p>
      <div class="signatures">
        ${template.signatureFields.map((s: string) => `<div class="sig-block">${s}</div>`).join("")}
      </div>
    </div>
  `;
};

/**
 * 📜 Migration Certificate — HTML Template
 *
 * Professional A4 layout with formal structure for board migration.
 */

export interface MigrationCertTemplateData {
  schoolName: string;
  schoolAddress: string;
  schoolLogo?: string;
  affiliationNo?: string;
  certificateNo: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  admissionNo: string;
  registrationNo?: string;
  className: string;
  sectionName?: string;
  board: string;
  migratingTo: string;
  academicYear: string;
  issueDate: string;
  reason?: string;
  lastExamPassed?: string;
  division?: string;
  yearOfPassing?: string;
}

export function generateMigrationCertHTML(data: MigrationCertTemplateData): string {
  const classInfo = data.sectionName
    ? `${data.className} - ${data.sectionName}`
    : data.className;

  const rows = [
    ["1.", "Name of the Student", data.studentName],
    ["2.", "Father's Name", data.fatherName],
    ["3.", "Mother's Name", data.motherName],
    ["4.", "Date of Birth", data.dob],
    ["5.", "Admission No.", data.admissionNo],
    ["6.", "Registration No.", data.registrationNo || "—"],
    ["7.", "Class last attended", classInfo],
    ["8.", "Board / University", data.board],
    ["9.", "Last Examination Passed", data.lastExamPassed || "—"],
    ["10.", "Division / Grade", data.division || "—"],
    ["11.", "Year of Passing", data.yearOfPassing || "—"],
    ["12.", "Migrating to", data.migratingTo],
    ["13.", "Reason for Migration", data.reason || "For higher studies"],
    ["14.", "Academic Year", data.academicYear],
  ];

  const tableRows = rows
    .map(
      ([num, label, value]) => `
      <tr>
        <td style="width:30px;text-align:center;padding:6px 4px;border:1px solid #333;font-size:10px;">${num}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:10px;font-weight:600;width:200px;">${label}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:10px;">${value}</td>
      </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; color: #000; background: #fff; }
    .cert-page {
      width: 210mm; min-height: 297mm; padding: 12mm;
      border: 3px double #333; position: relative;
    }
    .cert-page::before {
      content: ''; position: absolute; inset: 4px;
      border: 1px solid #999;
    }
    .header { text-align: center; margin-bottom: 12px; position: relative; z-index: 1; }
    .school-name { font-size: 22px; font-weight: 700; text-transform: uppercase; color: #1a365d; letter-spacing: 1px; }
    .school-addr { font-size: 10px; color: #555; margin-top: 3px; }
    .cert-title {
      font-size: 18px; font-weight: 700; text-align: center;
      margin: 15px 0; text-decoration: underline; letter-spacing: 2px;
    }
    .cert-meta { display: flex; justify-content: space-between; font-size: 10px; margin: 8px 0 15px; position: relative; z-index: 1; }
    table { width: 100%; border-collapse: collapse; position: relative; z-index: 1; }
    .conditions {
      margin: 20px 15px; font-size: 10px; position: relative; z-index: 1;
    }
    .conditions li { margin-bottom: 4px; }
    .sig-section {
      display: flex; justify-content: space-between; margin-top: 50px;
      padding: 0 20px; position: relative; z-index: 1;
    }
    .sig-block { text-align: center; font-size: 10px; }
    .sig-line { border-top: 1px solid #000; width: 120px; margin: 0 auto 4px; }
    .footer-note { text-align: center; font-size: 8px; color: #888; margin-top: 25px; position: relative; z-index: 1; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="cert-page">
    <div class="header">
      ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="Logo" style="width:60px;height:60px;object-fit:contain;margin-bottom:4px;">` : ""}
      <div class="school-name">${data.schoolName}</div>
      ${data.schoolAddress ? `<div class="school-addr">${data.schoolAddress}</div>` : ""}
      ${data.affiliationNo ? `<div style="font-size:9px;color:#777;">Affiliation No: ${data.affiliationNo}</div>` : ""}
    </div>

    <div class="cert-title">MIGRATION CERTIFICATE</div>

    <div class="cert-meta">
      <span><strong>Certificate No:</strong> ${data.certificateNo}</span>
      <span><strong>Date of Issue:</strong> ${data.issueDate}</span>
    </div>

    <table>${tableRows}</table>

    <div class="conditions">
      <p style="font-weight:600;margin-bottom:6px;">Terms & Conditions:</p>
      <ol style="padding-left:20px;">
        <li>No dues are pending against the student in this institution.</li>
        <li>All library books have been returned.</li>
        <li>This certificate is valid for one year from the date of issue.</li>
        <li>This certificate is non-transferable.</li>
      </ol>
    </div>

    <div class="sig-section">
      <div class="sig-block">
        <div class="sig-line"></div>
        Office Superintendent
      </div>
      <div class="sig-block" style="text-align:center;">
        <div style="font-size:9px;color:#888;margin-bottom:4px;">(School Seal)</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        Principal / Registrar
      </div>
    </div>

    <div class="footer-note">
      This certificate is issued for the purpose of admission to another institution / board.<br>
      No correction or alteration is valid unless authenticated by the Principal.
    </div>
  </div>
</body>
</html>`;
}

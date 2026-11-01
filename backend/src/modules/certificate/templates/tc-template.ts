/**
 * 📜 Transfer Certificate — HTML Template
 *
 * Professional A4 layout with school header, student details,
 * TC fields, and signature blocks.
 */

export interface TCTemplateData {
  schoolName: string;
  schoolAddress: string;
  schoolLogo?: string;
  affiliationNo?: string;
  tcNumber: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  admissionNo: string;
  admissionDate: string;
  classAtAdmission?: string;
  classAtLeaving: string;
  dateOfLeaving: string;
  lastAttendanceDate: string;
  reason: string;
  conduct: string;
  character: string;
  remarks?: string;
  issueDate: string;
  qualifiedForPromotion?: string;
  feesPaidUpTo?: string;
  totalWorkingDays?: number;
  totalPresent?: number;
  whetherFailed?: string;
  subjectsStudied?: string;
  gamesPlayed?: string;
  extraCurricular?: string;
}

export function generateTCHTML(data: TCTemplateData): string {
  const rows = [
    ["1.", "Name of the Pupil", data.studentName],
    ["2.", "Father's Name", data.fatherName],
    ["3.", "Mother's Name", data.motherName],
    ["4.", "Date of Birth (in figures & words)", data.dob],
    ["5.", "Admission No.", data.admissionNo],
    ["6.", "Date of Admission", data.admissionDate],
    ["7.", "Class in which admitted", data.classAtAdmission || "—"],
    ["8.", "Class in which studying at the time of leaving", data.classAtLeaving],
    ["9.", "Whether qualified for promotion to higher class", data.qualifiedForPromotion || "Yes"],
    ["10.", "Whether the pupil has paid all fees due", data.feesPaidUpTo || "Yes"],
    ["11.", "Total working days", data.totalWorkingDays != null ? String(data.totalWorkingDays) : "—"],
    ["12.", "Total days present", data.totalPresent != null ? String(data.totalPresent) : "—"],
    ["13.", "Whether failed, if so in which class", data.whetherFailed || "No"],
    ["14.", "Subjects studied", data.subjectsStudied || "—"],
    ["15.", "Games played / Extra-curricular activities", [data.gamesPlayed, data.extraCurricular].filter(Boolean).join(", ") || "—"],
    ["16.", "Date of leaving the school", data.dateOfLeaving],
    ["17.", "Date of last attendance", data.lastAttendanceDate],
    ["18.", "Reason for leaving", data.reason],
    ["19.", "Conduct and Character", `${data.conduct} / ${data.character}`],
    ["20.", "General Remarks", data.remarks || "—"],
  ];

  const tableRows = rows
    .map(
      ([num, label, value]) => `
      <tr>
        <td style="width:30px;text-align:center;padding:6px 4px;border:1px solid #333;font-size:10px;">${num}</td>
        <td style="padding:6px 8px;border:1px solid #333;font-size:10px;font-weight:600;">${label}</td>
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
    .tc-page {
      width: 210mm; min-height: 297mm; padding: 12mm;
      border: 3px double #333; position: relative;
    }
    .tc-page::before {
      content: ''; position: absolute; inset: 4px;
      border: 1px solid #666;
    }
    .header { text-align: center; margin-bottom: 10px; position: relative; z-index: 1; }
    .school-name { font-size: 22px; font-weight: 700; text-transform: uppercase; color: #1a365d; letter-spacing: 1px; }
    .school-addr { font-size: 10px; color: #555; margin-top: 2px; }
    .affiliation { font-size: 9px; color: #777; }
    .tc-title {
      font-size: 18px; font-weight: 700; text-align: center;
      margin: 12px 0; text-decoration: underline; letter-spacing: 2px;
    }
    .tc-meta { display: flex; justify-content: space-between; font-size: 10px; margin: 8px 0 12px; }
    table { width: 100%; border-collapse: collapse; position: relative; z-index: 1; }
    .sig-section {
      display: flex; justify-content: space-between; margin-top: 40px;
      padding: 0 20px; position: relative; z-index: 1;
    }
    .sig-block { text-align: center; font-size: 10px; }
    .sig-line { border-top: 1px solid #000; width: 120px; margin: 0 auto 4px; }
    .footer-note { text-align: center; font-size: 8px; color: #888; margin-top: 20px; position: relative; z-index: 1; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .tc-page { border: 3px double #333; }
    }
  </style>
</head>
<body>
  <div class="tc-page">
    <div class="header">
      ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="Logo" style="width:60px;height:60px;object-fit:contain;margin-bottom:4px;">` : ""}
      <div class="school-name">${data.schoolName}</div>
      ${data.schoolAddress ? `<div class="school-addr">${data.schoolAddress}</div>` : ""}
      ${data.affiliationNo ? `<div class="affiliation">Affiliation No: ${data.affiliationNo}</div>` : ""}
    </div>

    <div class="tc-title">TRANSFER CERTIFICATE</div>

    <div class="tc-meta">
      <span><strong>TC No:</strong> ${data.tcNumber}</span>
      <span><strong>Date of Issue:</strong> ${data.issueDate}</span>
    </div>

    <table>${tableRows}</table>

    <div class="sig-section">
      <div class="sig-block">
        <div class="sig-line"></div>
        Class Teacher
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        Office Superintendent
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        Principal
      </div>
    </div>

    <div class="footer-note">
      This certificate is issued on the request of the parent/guardian.<br>
      No correction/alteration is valid unless authenticated by the Principal.
    </div>
  </div>
</body>
</html>`;
}

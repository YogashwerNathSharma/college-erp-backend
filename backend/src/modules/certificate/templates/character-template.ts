/**
 * 📜 Character Certificate — HTML Template
 *
 * Professional A4 layout with formal letter format.
 */

export interface CharacterCertTemplateData {
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
  className: string;
  sectionName?: string;
  academicYear: string;
  conduct: string;
  character: string;
  issueDate: string;
  purpose?: string;
}

export function generateCharacterCertHTML(data: CharacterCertTemplateData): string {
  const classInfo = data.sectionName
    ? `${data.className} - ${data.sectionName}`
    : data.className;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; color: #000; background: #fff; }
    .cert-page {
      width: 210mm; min-height: 297mm; padding: 15mm;
      border: 3px double #333; position: relative;
    }
    .cert-page::before {
      content: ''; position: absolute; inset: 4px;
      border: 1px solid #999;
    }
    .header { text-align: center; margin-bottom: 15px; position: relative; z-index: 1; }
    .school-name { font-size: 22px; font-weight: 700; text-transform: uppercase; color: #1a365d; letter-spacing: 1px; }
    .school-addr { font-size: 10px; color: #555; margin-top: 3px; }
    .cert-title {
      font-size: 20px; font-weight: 700; text-align: center;
      margin: 20px 0; text-decoration: underline; letter-spacing: 3px;
    }
    .cert-meta { display: flex; justify-content: space-between; font-size: 10px; margin: 10px 0 20px; position: relative; z-index: 1; }
    .cert-body {
      font-size: 13px; line-height: 2; text-align: justify;
      margin: 20px 15px; position: relative; z-index: 1;
    }
    .cert-body strong { color: #1a365d; }
    .sig-section {
      display: flex; justify-content: space-between; margin-top: 60px;
      padding: 0 20px; position: relative; z-index: 1;
    }
    .sig-block { text-align: center; font-size: 11px; }
    .sig-line { border-top: 1px solid #000; width: 130px; margin: 0 auto 4px; }
    .footer-note { text-align: center; font-size: 8px; color: #888; margin-top: 30px; position: relative; z-index: 1; }
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

    <div class="cert-title">CHARACTER CERTIFICATE</div>

    <div class="cert-meta">
      <span><strong>Certificate No:</strong> ${data.certificateNo}</span>
      <span><strong>Date:</strong> ${data.issueDate}</span>
    </div>

    <div class="cert-body">
      <p>This is to certify that <strong>${data.studentName}</strong>,
      Son/Daughter of <strong>Shri ${data.fatherName}</strong>
      and <strong>Smt. ${data.motherName}</strong>,
      Date of Birth <strong>${data.dob}</strong>,
      bearing Admission No. <strong>${data.admissionNo}</strong>,
      was a bonafide student of this institution and was studying in
      Class <strong>${classInfo}</strong> during the Academic Year
      <strong>${data.academicYear}</strong>.</p>

      <p style="margin-top:15px;">During the period of study in this institution, their
      moral character was found to be <strong>${data.character}</strong>
      and overall conduct was <strong>${data.conduct}</strong>.</p>

      <p style="margin-top:15px;">We wish the student all the best for their future endeavours.</p>

      ${data.purpose ? `<p style="margin-top:15px;font-size:11px;color:#555;">This certificate is issued for the purpose of <strong>${data.purpose}</strong>.</p>` : ""}
    </div>

    <div class="sig-section">
      <div class="sig-block">
        <div class="sig-line"></div>
        Class Teacher
      </div>
      <div class="sig-block" style="text-align:center;">
        <div style="font-size:9px;color:#888;margin-bottom:4px;">(School Seal)</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        Principal
      </div>
    </div>

    <div class="footer-note">
      This is a computer-generated certificate. Valid without signature if digitally verified.
    </div>
  </div>
</body>
</html>`;
}

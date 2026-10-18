import PrintLayout from './PrintLayout';
import { formatIndianDateLong } from '../../utils/printHelper';

//////////////////////////////////////////////////////
// 📄 BONAFIDE CERTIFICATE PRINT
// Student enrollment verification certificate.
// States class, academic year, and purpose.
// YN-UDP template slot: "bonafide-certificate"
//////////////////////////////////////////////////////

export interface BonafideCertData {
  /** Student details */
  studentName: string;
  fatherName: string;
  motherName?: string;
  class: string;
  section?: string;
  admissionNo: string;
  rollNo?: string;
  dob?: string;
  /** Academic year / session */
  academicYear: string;
  /** Purpose (e.g., "Railway Concession", "Bank Account Opening") */
  purpose: string;
  /** Date of issue */
  issueDate: string;
  /** Serial / reference number */
  serialNo?: string;
  /** Additional fields */
  address?: string;
  phone?: string;
}

interface BonafidePrintProps {
  data: BonafideCertData;
  showControls?: boolean;
  mode?: 'preview' | 'print';
  templateId?: string;
}

export default function BonafidePrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
}: BonafidePrintProps) {
  const templateData = {
    student_name: data.studentName,
    father_name: data.fatherName,
    class_name: data.class,
    section: data.section || '',
    admission_no: data.admissionNo,
    academic_year: data.academicYear,
    purpose: data.purpose,
    issue_date: data.issueDate,
  };

  return (
    <PrintLayout
      title="Bonafide Certificate"
      templateSlot="bonafide-certificate"
      templateId={templateId}
      templateData={templateData}
      orientation="portrait"
      showControls={showControls}
      mode={mode}
      showFooter={true}
      qrData={`BF:${data.serialNo || ''}|${data.studentName}|${data.admissionNo}`}
    >
      <div style={{
        fontFamily: "'Times New Roman', Georgia, serif",
        fontSize: '12pt',
        lineHeight: 1.8,
        padding: '5mm 8mm',
      }}>
        {/* Reference & Date */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8mm',
          fontSize: '10pt',
        }}>
          {data.serialNo && <div><strong>Ref. No.:</strong> {data.serialNo}</div>}
          <div><strong>Date:</strong> {formatIndianDateLong(data.issueDate)}</div>
        </div>

        {/* "To Whom It May Concern" */}
        <div style={{
          textAlign: 'center',
          marginBottom: '10mm',
        }}>
          <div style={{
            fontSize: '14pt',
            fontWeight: 700,
            textDecoration: 'underline',
            textTransform: 'uppercase',
            letterSpacing: '1.5pt',
            marginBottom: '6mm',
          }}>
            Bonafide Certificate
          </div>
          <div style={{ fontSize: '11pt', fontStyle: 'italic', color: '#444' }}>
            — To Whom It May Concern —
          </div>
        </div>

        {/* Certificate Body */}
        <div style={{ textAlign: 'justify', textIndent: '15mm' }}>
          <p style={{ marginBottom: '5mm' }}>
            This is to certify that <strong style={{ textDecoration: 'underline' }}>{data.studentName}</strong>,
            Son/Daughter of <strong>Shri {data.fatherName}</strong>
            {data.motherName && <> and <strong>Smt. {data.motherName}</strong></>}
            {data.dob && <>, Date of Birth: <strong>{formatIndianDateLong(data.dob)}</strong></>}
            , is a bonafide student of this institution, currently studying in Class{' '}
            <strong>{data.class}{data.section ? ` (Section: ${data.section})` : ''}</strong>
            {' '}bearing Admission Number <strong>{data.admissionNo}</strong>
            {data.rollNo && <> and Roll Number <strong>{data.rollNo}</strong></>}
            {' '}during the Academic Session <strong>{data.academicYear}</strong>.
          </p>

          <p style={{ marginBottom: '5mm' }}>
            His/Her character and conduct is satisfactory as per the school records.
          </p>

          {data.address && (
            <p style={{ marginBottom: '5mm' }}>
              His/Her residential address as per our records is:{' '}
              <strong>{data.address}</strong>.
            </p>
          )}

          <p style={{ marginBottom: '5mm' }}>
            This certificate is being issued on the request of the student/parent for the purpose of{' '}
            <strong style={{ textDecoration: 'underline' }}>{data.purpose}</strong>.
          </p>

          <p>
            We wish him/her all the best.
          </p>
        </div>

        {/* Place & Date */}
        <div style={{ marginTop: '10mm', fontSize: '10pt' }}>
          <div><strong>Place:</strong> _________________</div>
          <div style={{ marginTop: '2mm' }}><strong>Date:</strong> {formatIndianDateLong(data.issueDate)}</div>
        </div>

        {/* Signatures */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '18mm',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '10pt', fontWeight: 500 }}>Office Superintendent</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '22mm', height: '22mm',
              border: '1pt dashed #aaa',
              margin: '0 auto 3mm',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '7pt', color: '#999', borderRadius: '50%',
            }}>
              School<br/>Seal
            </div>
            <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '10pt', fontWeight: 600 }}>Principal</div>
            <div style={{ fontSize: '8pt', color: '#666' }}>(Authorized Signatory)</div>
          </div>
        </div>

        {/* Note */}
        <div style={{
          marginTop: '10mm',
          fontSize: '8.5pt',
          color: '#555',
          fontStyle: 'italic',
          borderTop: '0.5pt solid #ddd',
          paddingTop: '3mm',
        }}>
          <strong>Note:</strong> This certificate is issued for the sole purpose mentioned above and
          shall not be used for any other purpose. It is valid for a period of six months from
          the date of issue.
        </div>
      </div>
    </PrintLayout>
  );
}

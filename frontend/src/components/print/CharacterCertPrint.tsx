import PrintLayout from './PrintLayout';
import { formatIndianDateLong } from '../../utils/printHelper';

//////////////////////////////////////////////////////
// 📋 CHARACTER CERTIFICATE PRINT
// Formal character certificate for students.
// YN-UDP template slot: "character-certificate"
//////////////////////////////////////////////////////

export interface CharacterCertData {
  /** Student details */
  studentName: string;
  fatherName: string;
  motherName?: string;
  class: string;
  section?: string;
  admissionNo: string;
  rollNo?: string;
  /** Period of study */
  fromDate: string;
  toDate: string;
  /** Character/conduct assessment */
  character: string;
  /** Academic year */
  academicYear?: string;
  /** Date of birth */
  dob?: string;
  /** Additional info */
  address?: string;
  /** Serial number of certificate */
  serialNo?: string;
  /** Date of issue */
  issueDate: string;
}

interface CharacterCertPrintProps {
  data: CharacterCertData;
  showControls?: boolean;
  mode?: 'preview' | 'print';
  templateId?: string;
}

export default function CharacterCertPrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
}: CharacterCertPrintProps) {
  const templateData = {
    student_name: data.studentName,
    father_name: data.fatherName,
    class_name: data.class,
    section: data.section || '',
    admission_no: data.admissionNo,
    character: data.character,
    from_date: data.fromDate,
    to_date: data.toDate,
    issue_date: data.issueDate,
  };

  return (
    <PrintLayout
      title="Character Certificate"
      templateSlot="character-certificate"
      templateId={templateId}
      templateData={templateData}
      orientation="portrait"
      showControls={showControls}
      mode={mode}
      showFooter={true}
      qrData={`CC:${data.serialNo || ''}|${data.studentName}|${data.admissionNo}`}
    >
      <div style={{
        fontFamily: "'Times New Roman', Georgia, serif",
        fontSize: '12pt',
        lineHeight: 1.8,
        padding: '5mm 8mm',
      }}>
        {/* Serial & Date */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8mm',
          fontSize: '10pt',
        }}>
          {data.serialNo && <div><strong>Ref. No.:</strong> {data.serialNo}</div>}
          <div><strong>Date:</strong> {formatIndianDateLong(data.issueDate)}</div>
        </div>

        {/* Heading */}
        <div style={{
          textAlign: 'center',
          marginBottom: '10mm',
        }}>
          <div style={{
            fontSize: '16pt',
            fontWeight: 700,
            textDecoration: 'underline',
            textTransform: 'uppercase',
            letterSpacing: '2pt',
          }}>
            Character Certificate
          </div>
        </div>

        {/* Body Text */}
        <div style={{ textAlign: 'justify', textIndent: '15mm' }}>
          <p style={{ marginBottom: '4mm' }}>
            This is to certify that <strong style={{ textDecoration: 'underline' }}>{data.studentName}</strong>,
            {data.dob && <> Date of Birth: <strong>{formatIndianDateLong(data.dob)}</strong>,</>}
            {' '}Son/Daughter of <strong>Shri {data.fatherName}</strong>
            {data.motherName && <> and <strong>Smt. {data.motherName}</strong></>}
            {' '}is/was a bonafide student of this institution. He/She was studying in Class{' '}
            <strong>{data.class}{data.section ? ` (${data.section})` : ''}</strong>
            {' '}bearing Admission No. <strong>{data.admissionNo}</strong>
            {data.rollNo && <> and Roll No. <strong>{data.rollNo}</strong></>}
            {' '}during the academic session{' '}
            <strong>{data.academicYear || `${data.fromDate} to ${data.toDate}`}</strong>.
          </p>

          <p style={{ marginBottom: '4mm' }}>
            During his/her stay in this institution from{' '}
            <strong>{formatIndianDateLong(data.fromDate)}</strong> to{' '}
            <strong>{formatIndianDateLong(data.toDate)}</strong>,
            {' '}his/her character and conduct has been found to be{' '}
            <strong style={{ textDecoration: 'underline', fontSize: '13pt' }}>{data.character}</strong>.
          </p>

          <p style={{ marginBottom: '4mm' }}>
            To the best of my knowledge, he/she bears a good moral character and has not been
            involved in any kind of ragging, indiscipline, or anti-social activities during
            his/her period of study in this institution.
          </p>

          <p>
            I wish him/her all the best for his/her future endeavours.
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
          justifyContent: 'flex-end',
          marginTop: '18mm',
        }}>
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
            <div style={{ borderTop: '1pt solid #333', width: '40mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '10pt', fontWeight: 600 }}>Principal</div>
            <div style={{ fontSize: '8pt', color: '#666' }}>(Authorized Signatory)</div>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
}

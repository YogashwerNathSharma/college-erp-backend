import PrintLayout from './PrintLayout';
import { formatIndianDate, formatIndianDateLong, dateToWords } from '../../utils/printHelper';

//////////////////////////////////////////////////////
// 📜 TRANSFER CERTIFICATE PRINT
// Government-prescribed TC format (UP Board / CBSE).
// Serial number, full student history, principal signature.
// YN-UDP template slot: "transfer-certificate"
//////////////////////////////////////////////////////

export interface TCData {
  /** TC serial number */
  tcNo: string;
  /** Book/register number */
  bookNo?: string;
  /** Date of issue */
  date: string;
  /** Student details */
  studentName: string;
  fatherName: string;
  motherName: string;
  /** Date of birth */
  dob: string;
  /** Date of birth in words (auto-generated if not provided) */
  dobInWords?: string;
  /** Nationality */
  nationality?: string;
  /** Religion / Caste */
  religion?: string;
  caste?: string;
  category?: string;
  /** Aadhar number (optional) */
  aadharNo?: string;
  /** Admission details */
  admissionNo: string;
  admissionDate: string;
  admissionClass?: string;
  /** Class at time of leaving */
  class: string;
  /** Whether promoted to next class */
  promotedTo?: string;
  /** Academic info */
  academicYear?: string;
  lastExamPassed?: string;
  examYear?: string;
  /** Attendance dates */
  lastAttendance: string;
  /** Behavior */
  conduct: string;
  character?: string;
  /** Reason */
  reason: string;
  /** Fee status */
  feePaidTill: string;
  /** Concession / Scholarship */
  concession?: string;
  /** Games / Extra-curricular */
  games?: string;
  /** NCC / Scouts */
  ncc?: string;
  /** General remarks */
  remarks: string;
  /** Whether student belongs to BPL */
  bpl?: string;
  /** Migration status */
  migrationCert?: string;
}

interface TCPrintProps {
  data: TCData;
  showControls?: boolean;
  mode?: 'preview' | 'print';
  templateId?: string;
  /** School affiliation number */
  affiliationNo?: string;
  /** Board name (e.g., 'U.P. Board' or 'CBSE') */
  boardName?: string;
}

export default function TCPrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
  affiliationNo,
  boardName = 'CBSE',
}: TCPrintProps) {
  const dobWords = data.dobInWords || dateToWords(data.dob);

  const templateData = {
    tc_no: data.tcNo,
    book_no: data.bookNo || '',
    student_name: data.studentName,
    father_name: data.fatherName,
    mother_name: data.motherName,
    dob: data.dob,
    dob_in_words: dobWords,
    admission_no: data.admissionNo,
    class_name: data.class,
    conduct: data.conduct,
    reason: data.reason,
    date: data.date,
  };

  // Numbered rows data
  const tcRows: Array<{ label: string; value: string }> = [
    { label: 'Name of the Student (In full)', value: data.studentName },
    { label: "Father's Name / Guardian's Name", value: data.fatherName },
    { label: "Mother's Name", value: data.motherName },
    { label: 'Nationality', value: data.nationality || 'Indian' },
    { label: 'Religion / Caste / Category', value: [data.religion, data.caste, data.category].filter(Boolean).join(' / ') || '—' },
    { label: 'Date of Birth (in figures)', value: formatIndianDate(data.dob) },
    { label: 'Date of Birth (in words)', value: dobWords },
    { label: 'Admission No. & Date', value: `${data.admissionNo} / ${formatIndianDate(data.admissionDate)}` },
    { label: 'Class in which admitted', value: data.admissionClass || '—' },
    { label: 'Class studying at time of leaving', value: data.class },
    { label: 'Whether promoted to higher class', value: data.promotedTo || '—' },
    { label: 'Last examination passed with year', value: data.lastExamPassed ? `${data.lastExamPassed} (${data.examYear || ''})` : '—' },
    { label: 'Whether qualified for promotion', value: data.promotedTo ? 'Yes' : '—' },
    { label: 'Subject studied (last exam)', value: '—' },
    { label: 'Date of last attendance in the school', value: formatIndianDate(data.lastAttendance) },
    { label: 'Whether school leaving certificate fee paid', value: data.feePaidTill ? `Yes (Up to: ${data.feePaidTill})` : 'Yes' },
    { label: 'Any concession / scholarship', value: data.concession || 'Nil' },
    { label: 'Character & Conduct', value: `${data.character || data.conduct}` },
    { label: 'Games played / Extra-curricular activities', value: data.games || '—' },
    { label: 'NCC / Scout / Guide', value: data.ncc || '—' },
    { label: 'Reason for leaving the school', value: data.reason },
    { label: 'General Remarks', value: data.remarks || 'None' },
  ];

  return (
    <PrintLayout
      title="Transfer Certificate"
      subtitle={boardName ? `(Affiliated to ${boardName})` : undefined}
      templateSlot="transfer-certificate"
      templateId={templateId}
      templateData={templateData}
      orientation="portrait"
      showControls={showControls}
      mode={mode}
      showFooter={true}
      affiliationNo={affiliationNo}
      qrData={`TC:${data.tcNo}|${data.studentName}|${data.admissionNo}`}
    >
      <div style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: '10.5pt', lineHeight: 1.5 }}>
        {/* TC & Book Numbers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4mm', fontSize: '9.5pt' }}>
          <div><strong>TC No.:</strong> {data.tcNo}</div>
          {data.bookNo && <div><strong>Book No.:</strong> {data.bookNo}</div>}
          <div><strong>Date:</strong> {formatIndianDateLong(data.date)}</div>
        </div>

        {/* Admission Number Highlight */}
        <div style={{
          textAlign: 'center',
          marginBottom: '4mm',
          fontSize: '10pt',
          fontWeight: 600,
        }}>
          Admission No.: {data.admissionNo}
        </div>

        {/* TC Details — Numbered Rows */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
          <tbody>
            {tcRows.map((row, idx) => (
              <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                <td style={{
                  border: '0.5pt solid #666',
                  padding: '3pt 6pt',
                  width: '6%',
                  textAlign: 'center',
                  verticalAlign: 'top',
                  fontSize: '9pt',
                }}>
                  {idx + 1}.
                </td>
                <td style={{
                  border: '0.5pt solid #666',
                  padding: '3pt 6pt',
                  width: '44%',
                  fontWeight: 500,
                  verticalAlign: 'top',
                }}>
                  {row.label}
                </td>
                <td style={{
                  border: '0.5pt solid #666',
                  padding: '3pt 6pt',
                  width: '50%',
                  verticalAlign: 'top',
                }}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Certification */}
        <div style={{
          marginTop: '6mm',
          padding: '3mm',
          fontSize: '9.5pt',
          fontStyle: 'italic',
          borderTop: '0.5pt solid #999',
        }}>
          Certified that the above information is in accordance with the School Register and the student
          bears a good moral character as per our records. This certificate is being issued on the
          request of the {data.reason ? 'student/parent' : 'parent/guardian'} for the purpose of{' '}
          {data.reason || 'further studies'}.
        </div>

        {/* Note */}
        <div style={{ marginTop: '3mm', fontSize: '8.5pt', color: '#555' }}>
          <strong>Note:</strong> This TC is valid for two years from the date of issue. Any correction/overwriting will render it invalid.
        </div>

        {/* Signatures */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '15mm',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '9pt', fontWeight: 500 }}>Prepared By</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '9pt', fontWeight: 500 }}>Checked By</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '25mm', height: '25mm',
              border: '1pt dashed #999',
              margin: '0 auto 2pt',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '7pt', color: '#999',
            }}>
              School<br/>Seal
            </div>
            <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '9pt', fontWeight: 600 }}>Principal</div>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
}

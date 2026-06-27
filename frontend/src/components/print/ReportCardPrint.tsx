import PrintLayout from './PrintLayout';

//////////////////////////////////////////////////////
// 📊 REPORT CARD PRINT — Student Progress Report
// Subject-wise marks, grades, attendance, remarks.
// Supports single and bulk print.
// YN-UDP template slot: "report-card"
//////////////////////////////////////////////////////

export interface ReportCardSubject {
  name: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  remarks?: string;
  theoryMax?: number;
  theoryObtained?: number;
  practicalMax?: number;
  practicalObtained?: number;
}

export interface ReportCardData {
  studentName: string;
  admissionNo: string;
  rollNo: string;
  class: string;
  section: string;
  examName: string;
  academicYear?: string;
  photo?: string;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  subjects: ReportCardSubject[];
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  division?: string;
  attendance: { present: number; total: number; percentage?: number };
  remarks?: string;
  result?: 'PASS' | 'FAIL' | 'COMPARTMENT';
  coScholastic?: Array<{ activity: string; grade: string }>;
}

interface ReportCardPrintProps {
  data: ReportCardData | ReportCardData[];
  showControls?: boolean;
  mode?: 'preview' | 'print';
  templateId?: string;
  /** Show grade scale legend */
  showGradeScale?: boolean;
}

// Grade scale for CBSE pattern
const GRADE_SCALE = [
  { range: '91-100', grade: 'A1', points: 10 },
  { range: '81-90', grade: 'A2', points: 9 },
  { range: '71-80', grade: 'B1', points: 8 },
  { range: '61-70', grade: 'B2', points: 7 },
  { range: '51-60', grade: 'C1', points: 6 },
  { range: '41-50', grade: 'C2', points: 5 },
  { range: '33-40', grade: 'D', points: 4 },
  { range: 'Below 33', grade: 'E', points: 0 },
];

export default function ReportCardPrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
  showGradeScale = true,
}: ReportCardPrintProps) {
  const students = Array.isArray(data) ? data : [data];

  return (
    <>
      {students.map((student, pageIdx) => (
        <div key={pageIdx} style={pageIdx > 0 ? { pageBreakBefore: 'always' } : {}}>
          <PrintLayout
            title="Progress Report"
            subtitle={student.examName}
            templateSlot="report-card"
            templateId={templateId}
            templateData={{
              student_name: student.studentName,
              admission_no: student.admissionNo,
              roll_number: student.rollNo,
              class_name: student.class,
              section: student.section,
              exam_name: student.examName,
              percentage: String(student.percentage),
              grade: student.grade,
              rank: String(student.rank || ''),
              result: student.result || '',
            }}
            orientation="portrait"
            showControls={pageIdx === 0 && showControls}
            mode={mode}
            showFooter={true}
          >
            <SingleReportCard student={student} showGradeScale={showGradeScale} />
          </PrintLayout>
        </div>
      ))}
    </>
  );
}

function SingleReportCard({ student, showGradeScale }: { student: ReportCardData; showGradeScale: boolean }) {
  const resultColor = student.result === 'PASS' ? '#22543d' :
    student.result === 'FAIL' ? '#c53030' : '#b7791f';

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '10pt' }}>
      {/* Student Info Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '5mm',
        gap: '4mm',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm 4mm', fontSize: '9.5pt' }}>
            <div><strong>Name:</strong> {student.studentName}</div>
            <div><strong>Roll No:</strong> {student.rollNo}</div>
            <div><strong>Admission No:</strong> {student.admissionNo}</div>
            <div><strong>Class:</strong> {student.class} - {student.section}</div>
            {student.fatherName && <div><strong>Father:</strong> {student.fatherName}</div>}
            {student.motherName && <div><strong>Mother:</strong> {student.motherName}</div>}
            {student.dob && <div><strong>DOB:</strong> {student.dob}</div>}
            {student.academicYear && <div><strong>Session:</strong> {student.academicYear}</div>}
          </div>
        </div>
        {student.photo && (
          <div style={{
            width: '25mm', height: '30mm', border: '1pt solid #333',
            flexShrink: 0, overflow: 'hidden',
          }}>
            <img src={student.photo} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* Scholastic Area — Marks Table */}
      <div style={{ marginBottom: '5mm' }}>
        <div style={{ fontSize: '10pt', fontWeight: 700, marginBottom: '2mm', background: '#f0f4f8', padding: '2pt 6pt' }}>
          Scholastic Area
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center', width: '6%' }}>S.No</th>
              <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'left' }}>Subject</th>
              <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center', width: '12%' }}>Max Marks</th>
              <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center', width: '12%' }}>Marks Obtained</th>
              <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center', width: '10%' }}>Percentage</th>
              <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center', width: '8%' }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {student.subjects.map((sub, idx) => {
              const pct = sub.maxMarks > 0 ? ((sub.marksObtained / sub.maxMarks) * 100).toFixed(1) : '0';
              const isFail = sub.maxMarks > 0 && (sub.marksObtained / sub.maxMarks) * 100 < 33;
              return (
                <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1pt solid #333', padding: '3pt 6pt' }}>{sub.name}</td>
                  <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center' }}>{sub.maxMarks}</td>
                  <td style={{
                    border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center',
                    color: isFail ? '#c53030' : 'inherit', fontWeight: isFail ? 700 : 400,
                  }}>{sub.marksObtained}</td>
                  <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center' }}>{pct}%</td>
                  <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center', fontWeight: 600 }}>{sub.grade}</td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr style={{ fontWeight: 700, background: '#f8f9fa' }}>
              <td colSpan={2} style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'right' }}>Grand Total</td>
              <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{student.maxTotalMarks}</td>
              <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{student.totalMarks}</td>
              <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{student.percentage}%</td>
              <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{student.grade}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Co-Scholastic Area */}
      {student.coScholastic && student.coScholastic.length > 0 && (
        <div style={{ marginBottom: '5mm' }}>
          <div style={{ fontSize: '10pt', fontWeight: 700, marginBottom: '2mm', background: '#f0f4f8', padding: '2pt 6pt' }}>
            Co-Scholastic Area
          </div>
          <table style={{ width: '60%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'left' }}>Activity</th>
                <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center', width: '20%' }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {student.coScholastic.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1pt solid #333', padding: '3pt 6pt' }}>{item.activity}</td>
                  <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center' }}>{item.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: '3mm',
        marginBottom: '4mm',
        padding: '3mm',
        border: '1pt solid #e2e8f0',
        borderRadius: '2pt',
        background: '#fafbfc',
        fontSize: '9.5pt',
      }}>
        <div><strong>Percentage:</strong> {student.percentage}%</div>
        {student.rank && <div><strong>Class Rank:</strong> {student.rank}</div>}
        {student.division && <div><strong>Division:</strong> {student.division}</div>}
        <div><strong>Attendance:</strong> {student.attendance.present}/{student.attendance.total} days</div>
        {student.result && (
          <div>
            <strong>Result: </strong>
            <span style={{ color: resultColor, fontWeight: 700 }}>{student.result}</span>
          </div>
        )}
      </div>

      {/* Remarks */}
      {student.remarks && (
        <div style={{ marginBottom: '4mm', fontSize: '9.5pt' }}>
          <strong>Teacher's Remarks:</strong> {student.remarks}
        </div>
      )}

      {/* Grade Scale Legend */}
      {showGradeScale && (
        <div style={{ marginBottom: '5mm' }}>
          <div style={{ fontSize: '8pt', fontWeight: 600, marginBottom: '1mm' }}>Grading Scale:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm', fontSize: '7.5pt' }}>
            {GRADE_SCALE.map((g, idx) => (
              <span key={idx} style={{ padding: '1pt 4pt', background: '#f7fafc', border: '0.5pt solid #e2e8f0', borderRadius: '2pt' }}>
                {g.grade} ({g.range})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12mm',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
          <div style={{ fontSize: '9pt', fontWeight: 500 }}>Class Teacher</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
          <div style={{ fontSize: '9pt', fontWeight: 500 }}>Principal</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
          <div style={{ fontSize: '9pt', fontWeight: 500 }}>Parent/Guardian</div>
        </div>
      </div>
    </div>
  );
}

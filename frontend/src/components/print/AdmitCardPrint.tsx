import PrintLayout from './PrintLayout';
import { formatIndianDate } from '../../utils/printHelper';

//////////////////////////////////////////////////////
// 🎫 ADMIT CARD PRINT — Exam Admit Card
// Student exam admit card with photo, schedule table,
// instructions, and principal signature.
// YN-UDP template slot: "admit-card"
//////////////////////////////////////////////////////

export interface AdmitCardSubject {
  name: string;
  date: string;
  time: string;
  room?: string;
  code?: string;
}

export interface AdmitCardData {
  studentName: string;
  fatherName?: string;
  admissionNo: string;
  rollNo: string;
  class: string;
  section: string;
  examName: string;
  academicYear?: string;
  photo?: string;
  dob?: string;
  subjects: AdmitCardSubject[];
  instructions?: string[];
  venue?: string;
  startDate?: string;
  endDate?: string;
}

interface AdmitCardPrintProps {
  data: AdmitCardData;
  /** Show controls (print/preview/PDF) */
  showControls?: boolean;
  /** Preview or print mode */
  mode?: 'preview' | 'print';
  /** YN-UDP template ID override */
  templateId?: string;
}

export default function AdmitCardPrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
}: AdmitCardPrintProps) {
  // Prepare data for YN-UDP template merge
  const templateData = {
    student_name: data.studentName,
    father_name: data.fatherName || '',
    admission_no: data.admissionNo,
    roll_number: data.rollNo,
    class_name: data.class,
    section: data.section,
    exam_name: data.examName,
    academic_year: data.academicYear || '',
    photo: data.photo || '',
    dob: data.dob || '',
    venue: data.venue || '',
  };

  const defaultInstructions = [
    'Students must carry this admit card to the examination hall.',
    'No student will be allowed without a valid admit card.',
    'Mobile phones and electronic devices are strictly prohibited.',
    'Students must be present 15 minutes before the exam starts.',
    'Use of unfair means will lead to immediate disqualification.',
  ];

  const instructions = data.instructions || defaultInstructions;

  return (
    <PrintLayout
      title="Admit Card"
      subtitle={data.examName}
      templateSlot="admit-card"
      templateId={templateId}
      templateData={templateData}
      orientation="portrait"
      showControls={showControls}
      mode={mode}
      watermark="ADMIT CARD"
    >
      <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '10pt' }}>
        {/* Student Information Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '6mm',
          gap: '4mm',
        }}>
          {/* Student Details */}
          <div style={{ flex: 1 }}>
            <table style={{ border: 'none', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ border: 'none', padding: '2pt 4pt', fontWeight: 600, width: '35%' }}>Name</td>
                  <td style={{ border: 'none', padding: '2pt 4pt' }}>: {data.studentName}</td>
                </tr>
                {data.fatherName && (
                  <tr>
                    <td style={{ border: 'none', padding: '2pt 4pt', fontWeight: 600 }}>Father's Name</td>
                    <td style={{ border: 'none', padding: '2pt 4pt' }}>: {data.fatherName}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ border: 'none', padding: '2pt 4pt', fontWeight: 600 }}>Admission No</td>
                  <td style={{ border: 'none', padding: '2pt 4pt' }}>: {data.admissionNo}</td>
                </tr>
                <tr>
                  <td style={{ border: 'none', padding: '2pt 4pt', fontWeight: 600 }}>Roll No</td>
                  <td style={{ border: 'none', padding: '2pt 4pt' }}>: {data.rollNo}</td>
                </tr>
                <tr>
                  <td style={{ border: 'none', padding: '2pt 4pt', fontWeight: 600 }}>Class / Section</td>
                  <td style={{ border: 'none', padding: '2pt 4pt' }}>: {data.class} - {data.section}</td>
                </tr>
                {data.dob && (
                  <tr>
                    <td style={{ border: 'none', padding: '2pt 4pt', fontWeight: 600 }}>Date of Birth</td>
                    <td style={{ border: 'none', padding: '2pt 4pt' }}>: {formatIndianDate(data.dob)}</td>
                  </tr>
                )}
                {data.academicYear && (
                  <tr>
                    <td style={{ border: 'none', padding: '2pt 4pt', fontWeight: 600 }}>Session</td>
                    <td style={{ border: 'none', padding: '2pt 4pt' }}>: {data.academicYear}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Student Photo */}
          <div style={{
            width: '30mm',
            height: '36mm',
            border: '1pt solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: '#f9f9f9',
          }}>
            {data.photo ? (
              <img
                src={data.photo}
                alt="Student"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '8pt', color: '#999', textAlign: 'center' }}>
                Paste<br/>Photo
              </span>
            )}
          </div>
        </div>

        {/* Exam Schedule Table */}
        <div style={{ marginBottom: '6mm' }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: '3mm', textAlign: 'center' }}>
            Examination Schedule
            {data.venue && <span style={{ fontWeight: 400, fontSize: '9pt' }}> — Venue: {data.venue}</span>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f4f8' }}>
                <th style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center', width: '8%' }}>S.No.</th>
                <th style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'left' }}>Subject</th>
                {data.subjects[0]?.code && (
                  <th style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>Code</th>
                )}
                <th style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>Date</th>
                <th style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>Time</th>
                {data.subjects[0]?.room && (
                  <th style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>Room</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((sub, idx) => (
                <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1pt solid #333', padding: '4pt 6pt' }}>{sub.name}</td>
                  {sub.code !== undefined && (
                    <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{sub.code}</td>
                  )}
                  <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{sub.date}</td>
                  <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{sub.time}</td>
                  {sub.room !== undefined && (
                    <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'center' }}>{sub.room}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div style={{
          marginBottom: '8mm',
          padding: '3mm 4mm',
          border: '0.5pt solid #ccc',
          borderRadius: '2pt',
          background: '#fafafa',
        }}>
          <div style={{ fontSize: '10pt', fontWeight: 700, marginBottom: '2mm' }}>
            Instructions:
          </div>
          <ol style={{ paddingLeft: '5mm', margin: 0, fontSize: '8.5pt', lineHeight: 1.6 }}>
            {instructions.map((inst, idx) => (
              <li key={idx} style={{ marginBottom: '1pt' }}>{inst}</li>
            ))}
          </ol>
        </div>

        {/* Signature Area */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '15mm',
          paddingTop: '2mm',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '9pt', fontWeight: 500 }}>Class Teacher</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '9pt', fontWeight: 500 }}>Student's Sign.</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 3pt' }}></div>
            <div style={{ fontSize: '9pt', fontWeight: 500 }}>Principal</div>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
}

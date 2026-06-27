import PrintLayout from './PrintLayout';

//////////////////////////////////////////////////////
// 📋 ATTENDANCE SHEET PRINT — Monthly Attendance Register
// Month-wise grid (students × dates) with summary columns.
// Landscape orientation for full month view.
// YN-UDP template slot: "attendance-sheet"
//////////////////////////////////////////////////////

export interface AttendanceStudent {
  rollNo: string;
  name: string;
  /** Attendance for each day: 'P' | 'A' | 'L' | 'H' | '-' | null */
  days: (string | null)[];
  /** Summary */
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface AttendanceSheetData {
  class: string;
  section: string;
  month: string;
  year: number;
  totalDays: number;
  holidays?: number[];
  students: AttendanceStudent[];
  teacher?: string;
  /** Sundays or weekly off days (0-indexed day of month, 1-based) */
  offDays?: number[];
}

interface AttendanceSheetPrintProps {
  data: AttendanceSheetData;
  showControls?: boolean;
  mode?: 'preview' | 'print';
  templateId?: string;
}

export default function AttendanceSheetPrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
}: AttendanceSheetPrintProps) {
  const templateData = {
    class_name: data.class,
    section: data.section,
    month: data.month,
    year: String(data.year),
    total_students: String(data.students.length),
    teacher_name: data.teacher || '',
  };

  // Generate day numbers array
  const daysInMonth = data.totalDays;
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <PrintLayout
      title="Attendance Register"
      subtitle={`${data.month} ${data.year} | Class: ${data.class} - ${data.section}`}
      templateSlot="attendance-sheet"
      templateId={templateId}
      templateData={templateData}
      orientation="landscape"
      showControls={showControls}
      mode={mode}
      showFooter={true}
    >
      <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '7.5pt' }}>
        {/* Class Info Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '3mm',
          fontSize: '9pt',
          padding: '2mm 3mm',
          background: '#f0f4f8',
          borderRadius: '2pt',
        }}>
          <span><strong>Class:</strong> {data.class} - {data.section}</span>
          <span><strong>Month:</strong> {data.month} {data.year}</span>
          <span><strong>Working Days:</strong> {daysInMonth - (data.holidays?.length || 0)}</span>
          <span><strong>Total Students:</strong> {data.students.length}</span>
          {data.teacher && <span><strong>Teacher:</strong> {data.teacher}</span>}
        </div>

        {/* Attendance Grid */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '6.5pt',
            tableLayout: 'fixed',
          }}>
            <thead>
              <tr>
                <th style={{
                  ...thStyle,
                  width: '6mm',
                  position: 'sticky',
                  left: 0,
                  background: '#f0f4f8',
                  zIndex: 2,
                }}>
                  Roll
                </th>
                <th style={{
                  ...thStyle,
                  width: '30mm',
                  textAlign: 'left',
                  position: 'sticky',
                  left: '6mm',
                  background: '#f0f4f8',
                  zIndex: 2,
                }}>
                  Student Name
                </th>
                {dayNumbers.map(day => {
                  const isHoliday = data.holidays?.includes(day);
                  const isOff = data.offDays?.includes(day);
                  return (
                    <th
                      key={day}
                      style={{
                        ...thStyle,
                        width: '6mm',
                        background: isHoliday || isOff ? '#feebc8' : '#f0f4f8',
                      }}
                    >
                      {day}
                    </th>
                  );
                })}
                {/* Summary columns */}
                <th style={{ ...thStyle, width: '7mm', background: '#c6f6d5' }}>P</th>
                <th style={{ ...thStyle, width: '7mm', background: '#fed7d7' }}>A</th>
                <th style={{ ...thStyle, width: '7mm', background: '#fefcbf' }}>L</th>
                <th style={{ ...thStyle, width: '9mm', background: '#e2e8f0' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student, idx) => (
                <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{
                    ...tdStyle,
                    textAlign: 'center',
                    fontWeight: 600,
                    position: 'sticky',
                    left: 0,
                    background: idx % 2 === 0 ? 'white' : '#fafbfc',
                    zIndex: 1,
                  }}>
                    {student.rollNo}
                  </td>
                  <td style={{
                    ...tdStyle,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    position: 'sticky',
                    left: '6mm',
                    background: idx % 2 === 0 ? 'white' : '#fafbfc',
                    zIndex: 1,
                  }}>
                    {student.name}
                  </td>
                  {dayNumbers.map((day, dayIdx) => {
                    const status = student.days[dayIdx];
                    const isHoliday = data.holidays?.includes(day);
                    const isOff = data.offDays?.includes(day);
                    return (
                      <td
                        key={day}
                        style={{
                          ...tdStyle,
                          textAlign: 'center',
                          fontWeight: 600,
                          background: isHoliday || isOff
                            ? '#fef3c7'
                            : status === 'A'
                            ? '#fee2e2'
                            : status === 'L'
                            ? '#fef9c3'
                            : 'transparent',
                          color: status === 'P'
                            ? '#22543d'
                            : status === 'A'
                            ? '#c53030'
                            : status === 'L'
                            ? '#b7791f'
                            : '#999',
                        }}
                      >
                        {isHoliday || isOff ? 'H' : status || '-'}
                      </td>
                    );
                  })}
                  {/* Summary */}
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#22543d', background: '#f0fff4' }}>
                    {student.present}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#c53030', background: '#fff5f5' }}>
                    {student.absent}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#b7791f', background: '#fffff0' }}>
                    {student.late}
                  </td>
                  <td style={{
                    ...tdStyle,
                    textAlign: 'center',
                    fontWeight: 700,
                    color: student.percentage >= 75 ? '#22543d' : '#c53030',
                  }}>
                    {student.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: '4mm',
          marginTop: '4mm',
          fontSize: '7pt',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
            <span style={{ width: '3mm', height: '3mm', background: '#c6f6d5', border: '0.5pt solid #68d391', display: 'inline-block' }}></span>
            P = Present
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
            <span style={{ width: '3mm', height: '3mm', background: '#fed7d7', border: '0.5pt solid #fc8181', display: 'inline-block' }}></span>
            A = Absent
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
            <span style={{ width: '3mm', height: '3mm', background: '#fefcbf', border: '0.5pt solid #f6e05e', display: 'inline-block' }}></span>
            L = Late
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
            <span style={{ width: '3mm', height: '3mm', background: '#fef3c7', border: '0.5pt solid #fbbf24', display: 'inline-block' }}></span>
            H = Holiday
          </span>
        </div>

        {/* Signatures */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8mm',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '30mm', margin: '0 auto 2pt' }}></div>
            <div style={{ fontSize: '8pt', fontWeight: 500 }}>Class Teacher</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '30mm', margin: '0 auto 2pt' }}></div>
            <div style={{ fontSize: '8pt', fontWeight: 500 }}>Head of Department</div>
          </div>
          <div style={{ textAlign: '1pt solid #333' as any }}>
            <div style={{ borderTop: '1pt solid #333', width: '30mm', margin: '0 auto 2pt' }}></div>
            <div style={{ fontSize: '8pt', fontWeight: 500, textAlign: 'center' }}>Principal</div>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  border: '0.5pt solid #333',
  padding: '2pt 1pt',
  textAlign: 'center',
  fontSize: '6pt',
  fontWeight: 700,
  background: '#f0f4f8',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  border: '0.5pt solid #999',
  padding: '2pt 1pt',
  fontSize: '6.5pt',
};

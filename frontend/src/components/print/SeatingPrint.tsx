import PrintLayout from './PrintLayout';

//////////////////////////////////////////////////////
// 🪑 SEATING ARRANGEMENT PRINT — Exam Seating Plan
// Room-wise layout with student positions in grid.
// Instructions for invigilators.
// YN-UDP template slot: "seating-arrangement"
//////////////////////////////////////////////////////

export interface SeatPosition {
  row: number;
  col: number;
  studentName: string;
  rollNo: string;
  class: string;
  section?: string;
  subject?: string;
}

export interface RoomSeating {
  roomNo: string;
  roomName?: string;
  capacity: number;
  rows: number;
  columns: number;
  subject?: string;
  invigilator?: string;
  date?: string;
  time?: string;
  seats: SeatPosition[];
}

export interface SeatingData {
  examName: string;
  date?: string;
  rooms: RoomSeating[];
  instructions?: string[];
}

interface SeatingPrintProps {
  data: SeatingData;
  showControls?: boolean;
  mode?: 'preview' | 'print';
  templateId?: string;
}

export default function SeatingPrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
}: SeatingPrintProps) {
  const templateData = {
    exam_name: data.examName,
    date: data.date || '',
    total_rooms: String(data.rooms.length),
  };

  const defaultInstructions = [
    'Students must occupy the seat allotted to them. No seat exchange is allowed.',
    'Students are not permitted to carry mobile phones, smart watches, or any electronic devices.',
    'Invigilators must verify the identity of each student before allowing them to sit.',
    'Any material other than the allowed stationery is prohibited in the examination hall.',
    'The question paper must not be taken outside the hall before the stipulated time.',
    'Invigilator must sign the attendance sheet and submit to the exam controller.',
  ];

  const instructions = data.instructions || defaultInstructions;

  return (
    <PrintLayout
      title="Seating Arrangement"
      subtitle={`${data.examName}${data.date ? ` — ${data.date}` : ''}`}
      templateSlot="seating-arrangement"
      templateId={templateId}
      templateData={templateData}
      orientation="landscape"
      showControls={showControls}
      mode={mode}
      showFooter={true}
    >
      <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '9pt' }}>
        {/* Room Layouts */}
        {data.rooms.map((room, roomIdx) => (
          <div
            key={roomIdx}
            style={{
              marginBottom: '8mm',
              pageBreakInside: 'avoid',
              pageBreakAfter: roomIdx < data.rooms.length - 1 ? 'always' : 'auto',
            }}
          >
            {/* Room Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '3mm',
              padding: '2mm 4mm',
              background: '#f0f4f8',
              borderRadius: '2pt',
              border: '0.5pt solid #cbd5e0',
            }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '11pt' }}>
                  Room: {room.roomNo}
                </span>
                {room.roomName && <span style={{ marginLeft: '2mm', color: '#555' }}>({room.roomName})</span>}
              </div>
              <div style={{ display: 'flex', gap: '4mm', fontSize: '8.5pt' }}>
                <span><strong>Capacity:</strong> {room.capacity}</span>
                <span><strong>Rows × Cols:</strong> {room.rows} × {room.columns}</span>
                {room.subject && <span><strong>Subject:</strong> {room.subject}</span>}
                {room.invigilator && <span><strong>Invigilator:</strong> {room.invigilator}</span>}
              </div>
            </div>

            {room.date && (
              <div style={{ fontSize: '8.5pt', marginBottom: '2mm', color: '#555' }}>
                <strong>Date:</strong> {room.date} {room.time && `| Time: ${room.time}`}
              </div>
            )}

            {/* Seating Grid */}
            <div style={{
              border: '1pt solid #333',
              padding: '3mm',
              borderRadius: '2pt',
            }}>
              {/* Blackboard indicator */}
              <div style={{
                textAlign: 'center',
                background: '#2d3748',
                color: 'white',
                padding: '1mm 0',
                fontSize: '7pt',
                fontWeight: 600,
                marginBottom: '3mm',
                borderRadius: '2pt',
              }}>
                BLACKBOARD / FRONT
              </div>

              {/* Seat Grid */}
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}>
                <tbody>
                  {Array.from({ length: room.rows }, (_, rowIdx) => (
                    <tr key={rowIdx}>
                      {Array.from({ length: room.columns }, (_, colIdx) => {
                        const seat = room.seats.find(s => s.row === rowIdx + 1 && s.col === colIdx + 1);
                        return (
                          <td
                            key={colIdx}
                            style={{
                              border: '0.5pt solid #ccc',
                              padding: '2mm',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              height: '14mm',
                              background: seat ? 'white' : '#f7fafc',
                            }}
                          >
                            {seat ? (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '8pt' }}>{seat.rollNo}</div>
                                <div style={{ fontSize: '6.5pt', color: '#333', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                  {seat.studentName}
                                </div>
                                <div style={{ fontSize: '6pt', color: '#666' }}>
                                  {seat.class}{seat.section ? `-${seat.section}` : ''}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '6pt', color: '#ccc' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Door indicator */}
              <div style={{
                textAlign: 'right',
                marginTop: '2mm',
                fontSize: '7pt',
                color: '#666',
              }}>
                ← DOOR
              </div>
            </div>
          </div>
        ))}

        {/* Instructions for Invigilators */}
        <div style={{
          marginTop: '6mm',
          padding: '3mm 4mm',
          border: '0.5pt solid #e2e8f0',
          borderRadius: '2pt',
          background: '#fffbeb',
          pageBreakInside: 'avoid',
        }}>
          <div style={{ fontWeight: 700, fontSize: '9pt', marginBottom: '2mm' }}>
            📋 Instructions for Invigilators:
          </div>
          <ol style={{ paddingLeft: '5mm', margin: 0, fontSize: '8pt', lineHeight: 1.6 }}>
            {instructions.map((inst, idx) => (
              <li key={idx} style={{ marginBottom: '1pt' }}>{inst}</li>
            ))}
          </ol>
        </div>

        {/* Signatures */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '10mm',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '30mm', margin: '0 auto 2pt' }}></div>
            <div style={{ fontSize: '8pt', fontWeight: 500 }}>Exam Controller</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '30mm', margin: '0 auto 2pt' }}></div>
            <div style={{ fontSize: '8pt', fontWeight: 500 }}>Vice Principal</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #333', width: '30mm', margin: '0 auto 2pt' }}></div>
            <div style={{ fontSize: '8pt', fontWeight: 500 }}>Principal</div>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
}

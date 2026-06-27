import PrintLayout from './PrintLayout';

//////////////////////////////////////////////////////
// 🪪 ID CARD PRINT — Student/Teacher Identity Card
// Credit card size (85.6mm × 54mm), front & back.
// 4-up printing on A4 for batch operations.
// YN-UDP template slot: "id-card"
//////////////////////////////////////////////////////

export interface IDCardData {
  /** Card type */
  type: 'student' | 'teacher' | 'staff';
  /** Person details */
  name: string;
  photo?: string;
  class?: string;
  section?: string;
  admissionNo?: string;
  rollNo?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  /** Personal details */
  fatherName?: string;
  dob?: string;
  bloodGroup?: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  /** Validity */
  validFrom?: string;
  validTo?: string;
  academicYear?: string;
  /** QR/Barcode data */
  qrData?: string;
  barcode?: string;
}

interface IDCardPrintProps {
  data: IDCardData | IDCardData[];
  showControls?: boolean;
  mode?: 'preview' | 'print';
  templateId?: string;
  /** Show only front, only back, or both */
  side?: 'front' | 'back' | 'both';
}

export default function IDCardPrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
  side = 'both',
}: IDCardPrintProps) {
  const cards = Array.isArray(data) ? data : [data];
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
  const primaryColor = tenant.primaryColor || '#1a365d';

  const templateData = cards.length === 1 ? {
    student_name: cards[0].name,
    class_name: cards[0].class || '',
    admission_no: cards[0].admissionNo || '',
    photo: cards[0].photo || '',
    blood_group: cards[0].bloodGroup || '',
    phone: cards[0].phone || '',
  } : undefined;

  return (
    <PrintLayout
      title="Identity Card"
      templateSlot="id-card"
      templateId={templateId}
      templateData={templateData}
      orientation="portrait"
      showControls={showControls}
      mode={mode}
      showHeader={false}
      showFooter={false}
      additionalCSS={`
        @page { margin: 10mm; }
        .id-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6mm;
          padding: 2mm;
        }
        @media screen and (max-width: 768px) {
          .id-cards-grid { grid-template-columns: 1fr; }
        }
      `}
    >
      <div className="id-cards-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6mm',
        padding: '2mm',
      }}>
        {cards.map((card, idx) => (
          <div key={idx} style={{ pageBreakInside: 'avoid' }}>
            {(side === 'front' || side === 'both') && (
              <IDCardFront card={card} primaryColor={primaryColor} tenant={tenant} />
            )}
            {side === 'both' && <div style={{ height: '3mm' }}></div>}
            {(side === 'back' || side === 'both') && (
              <IDCardBack card={card} primaryColor={primaryColor} tenant={tenant} />
            )}
          </div>
        ))}
      </div>
    </PrintLayout>
  );
}

function IDCardFront({
  card,
  primaryColor,
  tenant,
}: {
  card: IDCardData;
  primaryColor: string;
  tenant: any;
}) {
  return (
    <div style={{
      width: '85.6mm',
      height: '54mm',
      border: '0.5pt solid #333',
      borderRadius: '3mm',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      position: 'relative',
      background: 'white',
    }}>
      {/* Top colored bar */}
      <div style={{
        background: primaryColor,
        height: '14mm',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2mm',
        padding: '0 4mm',
      }}>
        {tenant.logo && (
          <img src={tenant.logo} alt="Logo" style={{ width: '10mm', height: '10mm', objectFit: 'contain', borderRadius: '1mm' }} />
        )}
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase' }}>
            {tenant.name || 'School Name'}
          </div>
          <div style={{ fontSize: '6pt', opacity: 0.9 }}>
            {tenant.address ? tenant.address.substring(0, 50) : ''}
          </div>
        </div>
      </div>

      {/* Card type badge */}
      <div style={{
        position: 'absolute',
        top: '14mm',
        left: 0,
        right: 0,
        textAlign: 'center',
      }}>
        <span style={{
          background: card.type === 'student' ? '#38a169' : card.type === 'teacher' ? '#3182ce' : '#d69e2e',
          color: 'white',
          fontSize: '6pt',
          fontWeight: 700,
          padding: '1pt 8pt',
          borderRadius: '0 0 4pt 4pt',
          textTransform: 'uppercase',
          letterSpacing: '0.5pt',
        }}>
          {card.type === 'student' ? 'Student' : card.type === 'teacher' ? 'Teacher' : 'Staff'}
        </span>
      </div>

      {/* Content area */}
      <div style={{
        display: 'flex',
        padding: '5mm 4mm 3mm',
        gap: '3mm',
      }}>
        {/* Photo */}
        <div style={{
          width: '18mm',
          height: '22mm',
          border: '0.5pt solid #ccc',
          borderRadius: '2pt',
          overflow: 'hidden',
          flexShrink: 0,
          background: '#f7f7f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {card.photo ? (
            <img src={card.photo} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '6pt', color: '#999' }}>Photo</span>
          )}
        </div>

        {/* Details */}
        <div style={{ flex: 1, fontSize: '7.5pt', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, fontSize: '9pt', marginBottom: '1mm', color: primaryColor }}>
            {card.name}
          </div>
          {card.type === 'student' && (
            <>
              {card.class && <div><strong>Class:</strong> {card.class}{card.section ? ` - ${card.section}` : ''}</div>}
              {card.admissionNo && <div><strong>Adm. No:</strong> {card.admissionNo}</div>}
              {card.rollNo && <div><strong>Roll No:</strong> {card.rollNo}</div>}
              {card.bloodGroup && <div><strong>Blood:</strong> {card.bloodGroup}</div>}
            </>
          )}
          {card.type !== 'student' && (
            <>
              {card.designation && <div><strong>Desig.:</strong> {card.designation}</div>}
              {card.employeeId && <div><strong>Emp. ID:</strong> {card.employeeId}</div>}
              {card.department && <div><strong>Dept.:</strong> {card.department}</div>}
            </>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#f0f4f8',
        padding: '1mm 4mm',
        fontSize: '6pt',
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '0.5pt solid #e2e8f0',
      }}>
        <span>Valid: {card.academicYear || `${card.validFrom || ''} - ${card.validTo || ''}`}</span>
        {card.emergencyContact && <span>Emergency: {card.emergencyContact}</span>}
      </div>
    </div>
  );
}

function IDCardBack({
  card,
  primaryColor,
  tenant,
}: {
  card: IDCardData;
  primaryColor: string;
  tenant: any;
}) {
  return (
    <div style={{
      width: '85.6mm',
      height: '54mm',
      border: '0.5pt solid #333',
      borderRadius: '3mm',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      padding: '3mm 4mm',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'white',
    }}>
      {/* School Info */}
      <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
        <div style={{ fontSize: '8pt', fontWeight: 700, color: primaryColor }}>
          {tenant.name || 'School Name'}
        </div>
        <div style={{ fontSize: '6.5pt', color: '#555' }}>
          {tenant.address || ''}
        </div>
        {tenant.phone && (
          <div style={{ fontSize: '6.5pt', color: '#555' }}>
            Ph: {tenant.phone}
          </div>
        )}
      </div>

      {/* Student-specific back details */}
      <div style={{ fontSize: '7pt', lineHeight: 1.6 }}>
        {card.fatherName && <div><strong>Father's Name:</strong> {card.fatherName}</div>}
        {card.address && <div><strong>Address:</strong> {card.address.substring(0, 80)}</div>}
        {card.phone && <div><strong>Contact:</strong> {card.phone}</div>}
        {card.dob && <div><strong>DOB:</strong> {card.dob}</div>}
      </div>

      {/* QR Code area + Signature */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: '2mm',
      }}>
        {/* QR placeholder */}
        <div style={{
          width: '14mm',
          height: '14mm',
          border: '0.5pt solid #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '5pt',
          color: '#999',
        }}>
          QR Code
        </div>

        {/* Signature */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '0.5pt solid #333', width: '25mm', margin: '0 auto 1pt' }}></div>
          <div style={{ fontSize: '6.5pt', fontWeight: 500 }}>Principal's Signature</div>
        </div>
      </div>

      {/* Terms */}
      <div style={{
        fontSize: '5.5pt',
        color: '#888',
        marginTop: '1mm',
        textAlign: 'center',
        borderTop: '0.5pt dashed #ddd',
        paddingTop: '1mm',
      }}>
        If found, please return to the school. This card is non-transferable.
      </div>
    </div>
  );
}

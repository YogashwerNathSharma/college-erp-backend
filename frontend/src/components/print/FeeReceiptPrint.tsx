import PrintLayout from './PrintLayout';
import { numberToWords, formatIndianDate } from '../../utils/printHelper';

//////////////////////////////////////////////////////
// 🧾 FEE RECEIPT PRINT — Fee Payment Receipt
// Detailed fee breakdown, payment info, amount in words.
// Supports original/duplicate marking.
// YN-UDP template slot: "fee-receipt"
//////////////////////////////////////////////////////

export interface FeeItem {
  name: string;
  amount: number;
  period?: string;
}

export interface FeeReceiptData {
  receiptNo: string;
  date: string;
  studentName: string;
  admissionNo: string;
  class: string;
  section: string;
  fatherName: string;
  motherName?: string;
  phone?: string;
  items: FeeItem[];
  totalAmount: number;
  discount: number;
  fineAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount?: number;
  paymentMode: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Bank Transfer' | string;
  transactionId?: string;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  amountInWords?: string;
  feeMonth?: string;
  academicYear?: string;
  /** 'original' or 'duplicate' copy */
  copyType?: 'original' | 'duplicate';
}

interface FeeReceiptPrintProps {
  data: FeeReceiptData;
  showControls?: boolean;
  mode?: 'preview' | 'print';
  templateId?: string;
  /** Print both original and duplicate on same page */
  printDuplicate?: boolean;
}

export default function FeeReceiptPrint({
  data,
  showControls = true,
  mode = 'preview',
  templateId,
  printDuplicate = false,
}: FeeReceiptPrintProps) {
  const amountWords = data.amountInWords || numberToWords(data.paidAmount || data.netAmount);

  const templateData = {
    receipt_no: data.receiptNo,
    date: data.date,
    student_name: data.studentName,
    admission_no: data.admissionNo,
    class_name: data.class,
    section: data.section,
    father_name: data.fatherName,
    total_fee: String(data.totalAmount),
    paid_amount: String(data.paidAmount || data.netAmount),
    payment_mode: data.paymentMode,
    transaction_id: data.transactionId || '',
    amount_in_words: amountWords,
  };

  return (
    <PrintLayout
      title="Fee Receipt"
      templateSlot="fee-receipt"
      templateId={templateId}
      templateData={templateData}
      orientation="portrait"
      showControls={showControls}
      mode={mode}
      showHeader={true}
      showFooter={true}
    >
      <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '10pt' }}>
        {/* Receipt as standalone block */}
        <ReceiptBlock data={data} amountWords={amountWords} copyType={data.copyType || 'original'} />
        
        {/* Duplicate copy */}
        {printDuplicate && (
          <>
            <div style={{
              borderTop: '1pt dashed #999',
              margin: '8mm 0',
              position: 'relative',
              textAlign: 'center',
            }}>
              <span style={{
                background: 'white',
                padding: '0 4mm',
                fontSize: '8pt',
                color: '#666',
                position: 'relative',
                top: '-6pt',
              }}>
                ✂️ Cut Here — Student Copy
              </span>
            </div>
            <ReceiptBlock data={data} amountWords={amountWords} copyType="duplicate" />
          </>
        )}
      </div>
    </PrintLayout>
  );
}

function ReceiptBlock({
  data,
  amountWords,
  copyType,
}: {
  data: FeeReceiptData;
  amountWords: string;
  copyType: 'original' | 'duplicate';
}) {
  return (
    <div style={{ border: '1pt solid #ccc', padding: '4mm', borderRadius: '2pt', position: 'relative' }}>
      {/* Copy type stamp */}
      <div style={{
        position: 'absolute',
        top: '3mm',
        right: '4mm',
        fontSize: '8pt',
        fontWeight: 700,
        color: copyType === 'original' ? '#2b6cb0' : '#c53030',
        textTransform: 'uppercase',
        border: `1pt solid ${copyType === 'original' ? '#2b6cb0' : '#c53030'}`,
        padding: '1pt 6pt',
        borderRadius: '2pt',
        transform: 'rotate(-5deg)',
      }}>
        {copyType === 'original' ? 'ORIGINAL' : 'DUPLICATE'}
      </div>

      {/* Receipt No & Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4mm', fontSize: '9.5pt' }}>
        <div><strong>Receipt No:</strong> {data.receiptNo}</div>
        <div><strong>Date:</strong> {formatIndianDate(data.date)}</div>
      </div>

      {/* Student Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1mm 4mm',
        marginBottom: '4mm',
        fontSize: '9.5pt',
        padding: '2mm 3mm',
        background: '#f8fafc',
        borderRadius: '2pt',
      }}>
        <div><strong>Name:</strong> {data.studentName}</div>
        <div><strong>Adm. No:</strong> {data.admissionNo}</div>
        <div><strong>Class:</strong> {data.class} - {data.section}</div>
        <div><strong>Father:</strong> {data.fatherName}</div>
        {data.feeMonth && <div><strong>Fee Month:</strong> {data.feeMonth}</div>}
        {data.academicYear && <div><strong>Session:</strong> {data.academicYear}</div>}
      </div>

      {/* Fee Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', marginBottom: '3mm' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center', width: '8%' }}>S.No</th>
            <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'left' }}>Fee Head / Particulars</th>
            {data.items[0]?.period && (
              <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center' }}>Period</th>
            )}
            <th style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right', width: '18%' }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
              <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ border: '1pt solid #333', padding: '3pt 6pt' }}>{item.name}</td>
              {item.period !== undefined && (
                <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'center' }}>{item.period}</td>
              )}
              <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
                {item.amount.toLocaleString('en-IN')}
              </td>
            </tr>
          ))}

          {/* Totals */}
          <tr style={{ fontWeight: 600 }}>
            <td colSpan={data.items[0]?.period ? 3 : 2} style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
              Sub Total
            </td>
            <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
              ₹{data.totalAmount.toLocaleString('en-IN')}
            </td>
          </tr>

          {data.discount > 0 && (
            <tr style={{ color: '#22543d' }}>
              <td colSpan={data.items[0]?.period ? 3 : 2} style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
                Discount / Concession
              </td>
              <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
                - ₹{data.discount.toLocaleString('en-IN')}
              </td>
            </tr>
          )}

          {data.fineAmount > 0 && (
            <tr style={{ color: '#c53030' }}>
              <td colSpan={data.items[0]?.period ? 3 : 2} style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
                Late Fee / Fine
              </td>
              <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
                + ₹{data.fineAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          )}

          <tr style={{ fontWeight: 700, background: '#f0f4f8' }}>
            <td colSpan={data.items[0]?.period ? 3 : 2} style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'right' }}>
              Net Amount Payable
            </td>
            <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'right', fontSize: '11pt' }}>
              ₹{data.netAmount.toLocaleString('en-IN')}
            </td>
          </tr>

          <tr style={{ fontWeight: 700, background: '#edf7ed' }}>
            <td colSpan={data.items[0]?.period ? 3 : 2} style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'right' }}>
              Amount Paid
            </td>
            <td style={{ border: '1pt solid #333', padding: '4pt 6pt', textAlign: 'right', fontSize: '11pt', color: '#22543d' }}>
              ₹{(data.paidAmount || data.netAmount).toLocaleString('en-IN')}
            </td>
          </tr>

          {data.balanceAmount !== undefined && data.balanceAmount > 0 && (
            <tr style={{ fontWeight: 600, color: '#c53030' }}>
              <td colSpan={data.items[0]?.period ? 3 : 2} style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
                Balance Due
              </td>
              <td style={{ border: '1pt solid #333', padding: '3pt 6pt', textAlign: 'right' }}>
                ₹{data.balanceAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={{
        fontSize: '9pt',
        marginBottom: '3mm',
        padding: '2mm 3mm',
        background: '#f8fafc',
        borderRadius: '2pt',
        border: '0.5pt solid #e2e8f0',
      }}>
        <strong>Amount in Words:</strong> {amountWords}
      </div>

      {/* Payment Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1mm 4mm',
        fontSize: '9pt',
        marginBottom: '6mm',
      }}>
        <div><strong>Payment Mode:</strong> {data.paymentMode}</div>
        {data.transactionId && <div><strong>Transaction ID:</strong> {data.transactionId}</div>}
        {data.chequeNo && <div><strong>Cheque No:</strong> {data.chequeNo}</div>}
        {data.chequeDate && <div><strong>Cheque Date:</strong> {data.chequeDate}</div>}
        {data.bankName && <div><strong>Bank:</strong> {data.bankName}</div>}
      </div>

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8mm' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '8pt', color: '#666', marginBottom: '8mm' }}>Received with thanks</div>
          <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 2pt' }}></div>
          <div style={{ fontSize: '9pt', fontWeight: 500 }}>Cashier / Accountant</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '8pt', color: '#666', marginBottom: '8mm' }}>&nbsp;</div>
          <div style={{ borderTop: '1pt solid #333', width: '35mm', margin: '0 auto 2pt' }}></div>
          <div style={{ fontSize: '9pt', fontWeight: 500 }}>Parent / Guardian</div>
        </div>
      </div>

      {/* Note */}
      <div style={{ marginTop: '4mm', fontSize: '7.5pt', color: '#666', fontStyle: 'italic' }}>
        Note: Fee once paid will not be refunded. Please keep this receipt safe for future reference.
      </div>
    </div>
  );
}

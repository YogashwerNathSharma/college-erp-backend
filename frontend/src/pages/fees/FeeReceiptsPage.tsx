
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FeeReceiptPrint } from "./FeeReceiptPrint";

const API = `${API_BASE_URL}/api`;

interface ReceiptPayment {
  receiptNo: string;
  amount: number;
  method: string;
  reference: string | null;
  paymentDate: string;
  student: {
    name: string;
    admissionNo: string;
    class: string;
    fatherName?: string;
    section?: string;
    rollNumber?: string;
  };
  feeStructure: string;
  installmentNo: number;
  feeItems?: { name: string; amount: number; code?: string }[];
}

interface DailyData {
  date: string;
  payments: ReceiptPayment[];
  summary: { method: string; count: number; total: number }[];
  grandTotal: number;
}

const FeeReceiptsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);

  useEffect(() => {
    if (selectedDate) fetchReceipts();
  }, [selectedDate]);

  const fetchReceipts = async () => {
    setLoading(true);
    setSelectedReceipts([]);
    try {
      const res = await axios.get(`${API}/fees/collection/daily-collection`, {
        params: { date: selectedDate },
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setData(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load receipts");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (receiptNo: string) => {
    setSelectedReceipts((prev) =>
      prev.includes(receiptNo)
        ? prev.filter((r) => r !== receiptNo)
        : [...prev, receiptNo]
    );
  };

  const selectAll = () => {
    if (!data) return;
    if (selectedReceipts.length === data.payments.length) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(data.payments.map((p) => p.receiptNo));
    }
  };

  // Print single receipt
  const handlePrintSingle = async (payment: ReceiptPayment) => {
    await FeeReceiptPrint({
      receiptNo: payment.receiptNo,
      paymentDate: payment.paymentDate,
      studentName: payment.student.name,
      admissionNo: payment.student.admissionNo,
      fatherName: payment.student.fatherName || "",
      className: payment.student.class,
      section: payment.student.section || "",
      rollNumber: payment.student.rollNumber || "",
      feeHead: payment.feeStructure,
      feeItems: payment.feeItems || undefined,
      installmentNo: payment.installmentNo,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
    });
  };

  // Bulk print selected receipts
  const handleBulkPrint = async () => {
    if (!data || selectedReceipts.length === 0) {
      toast.error("Please select receipts to print");
      return;
    }

    const selectedPayments = data.payments.filter((p) =>
      selectedReceipts.includes(p.receiptNo)
    );

    // Open a new window with all receipts stacked
    const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
    const schoolName = tenant.name || tenant.schoolName || "School Name";
    const address = tenant.address || "";
    const phone = tenant.phone || "";
    const email = tenant.email || "";
    const logoUrl = tenant.logoUrl
      ? tenant.logoUrl.startsWith("http")
        ? tenant.logoUrl
        : `${tenant.logoUrl}`
      : "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups.");
      return;
    }

    const receiptsHTML = selectedPayments
      .map((payment) => {
        const date = new Date(payment.paymentDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const feeItems = payment.feeItems || [{ name: payment.feeStructure, amount: payment.amount }];

        return `
        <div class="receipt-row">
          <div class="receipt-copy">
            <div style="display: flex; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
              ${logoUrl ? `<img src="${logoUrl}" style="width: 36px; height: 36px; object-fit: contain; margin-right: 8px;" />` : ""}
              <div style="flex: 1; text-align: center;">
                <div style="font-size: 13px; font-weight: bold;">${schoolName}</div>
                <div style="font-size: 8px;">${address}</div>
                <div style="font-size: 8px;">${phone}${email ? " | " + email : ""}</div>
              </div>
            </div>
            <div style="text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 4px; background: #e8e8e8; padding: 2px; border: 1px solid #000;">
              FEE RECEIPT (Student Copy)
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 9px;">
              <div><strong>Receipt No.</strong> ${payment.receiptNo}</div>
              <div><strong>Date.</strong> ${date}</div>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 9px;">
              <tr>
                <td style="padding: 1px 0; width: 32%;"><strong>Student Name.</strong></td>
                <td colspan="3">${payment.student.name}</td>
              </tr>
              <tr>
                <td style="padding: 1px 0;"><strong>Father's Name.</strong></td>
                <td colspan="3">${payment.student.fatherName || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 1px 0;"><strong>Class.</strong></td>
                <td style="width: 18%;">${payment.student.class} ${payment.student.section || ""}</td>
                <td style="width: 22%;"><strong>Adm.No.</strong></td>
                <td style="width: 28%;">${payment.student.admissionNo}</td>
              </tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 5px;">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-size: 8px; width: 25px;">S.No</th>
                  <th style="border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 8px;">Particulars</th>
                  <th style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 8px; width: 70px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${feeItems.map((item: any, idx: number) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px;">${item.name}</td>
                  <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 9px;">${item.amount?.toLocaleString("en-IN") || ""}</td>
                </tr>
                `).join("")}
                <tr style="background: #e8f5e9;">
                  <td style="border: 1px solid #000; padding: 2px 4px;"></td>
                  <td style="border: 1px solid #000; padding: 3px 4px; font-weight: bold; font-size: 10px;">Total Paid</td>
                  <td style="border: 1px solid #000; padding: 3px 4px; text-align: right; font-weight: bold; font-size: 10px;">₹${payment.amount.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
            <div style="display: flex; justify-content: space-between; font-size: 8px;">
              <div><strong>Mode:</strong> ${payment.method}</div>
              ${payment.reference ? `<div><strong>Ref:</strong> ${payment.reference}</div>` : ""}
            </div>
          </div>

          <div class="receipt-copy">
            <div style="display: flex; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
              ${logoUrl ? `<img src="${logoUrl}" style="width: 36px; height: 36px; object-fit: contain; margin-right: 8px;" />` : ""}
              <div style="flex: 1; text-align: center;">
                <div style="font-size: 13px; font-weight: bold;">${schoolName}</div>
                <div style="font-size: 8px;">${address}</div>
                <div style="font-size: 8px;">${phone}${email ? " | " + email : ""}</div>
              </div>
            </div>
            <div style="text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 4px; background: #e8e8e8; padding: 2px; border: 1px solid #000;">
              FEE RECEIPT (School Copy)
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 9px;">
              <div><strong>Receipt No.</strong> ${payment.receiptNo}</div>
              <div><strong>Date.</strong> ${date}</div>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 9px;">
              <tr>
                <td style="padding: 1px 0; width: 32%;"><strong>Student Name.</strong></td>
                <td colspan="3">${payment.student.name}</td>
              </tr>
              <tr>
                <td style="padding: 1px 0;"><strong>Father's Name.</strong></td>
                <td colspan="3">${payment.student.fatherName || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 1px 0;"><strong>Class.</strong></td>
                <td style="width: 18%;">${payment.student.class} ${payment.student.section || ""}</td>
                <td style="width: 22%;"><strong>Adm.No.</strong></td>
                <td style="width: 28%;">${payment.student.admissionNo}</td>
              </tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 5px;">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-size: 8px; width: 25px;">S.No</th>
                  <th style="border: 1px solid #000; padding: 2px 4px; text-align: left; font-size: 8px;">Particulars</th>
                  <th style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 8px; width: 70px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${feeItems.map((item: any, idx: number) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 2px 4px; font-size: 9px;">${item.name}</td>
                  <td style="border: 1px solid #000; padding: 2px 4px; text-align: right; font-size: 9px;">${item.amount?.toLocaleString("en-IN") || ""}</td>
                </tr>
                `).join("")}
                <tr style="background: #e8f5e9;">
                  <td style="border: 1px solid #000; padding: 2px 4px;"></td>
                  <td style="border: 1px solid #000; padding: 3px 4px; font-weight: bold; font-size: 10px;">Total Paid</td>
                  <td style="border: 1px solid #000; padding: 3px 4px; text-align: right; font-weight: bold; font-size: 10px;">₹${payment.amount.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
            <div style="display: flex; justify-content: space-between; font-size: 8px;">
              <div><strong>Mode:</strong> ${payment.method}</div>
              ${payment.reference ? `<div><strong>Ref:</strong> ${payment.reference}</div>` : ""}
            </div>
          </div>
        </div>
      `;
      })
      .join('<div class="page-break"></div>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk Receipt Print - ${selectedDate}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; }
          .receipt-row {
            display: flex;
            gap: 8px;
            justify-content: center;
            padding: 4px 10px;
          }
          .receipt-copy {
            width: 48%;
            border: 1.5px solid #000;
            padding: 8px 10px;
            font-size: 9px;
          }
          .page-break { page-break-after: always; }
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
            @page { size: A4 portrait; margin: 5mm; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: center; padding: 12px; background: #f0f9ff; border-bottom: 2px solid #3b82f6;">
          <button onclick="window.print()" style="padding: 10px 30px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; margin-right: 10px;">
            🖨️ Print All (${selectedPayments.length} Receipts)
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
            ✕ Close
          </button>
        </div>
        ${receiptsHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">
            View day-wise receipts • Reprint single or bulk
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={fetchReceipts}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && data.payments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500 uppercase">Total Receipts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data.payments.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500 uppercase">Total Collection</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(data.grandTotal)}
            </p>
          </div>
          {data.summary.map((s) => (
            <div key={s.method} className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs text-gray-500 uppercase">{s.method}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(s.total)}
              </p>
              <p className="text-xs text-gray-400">{s.count} txn</p>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Print Button */}
      {data && data.payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  data.payments.length > 0 &&
                  selectedReceipts.length === data.payments.length
                }
                onChange={selectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Select All ({data.payments.length})
            </label>
            {selectedReceipts.length > 0 && (
              <span className="text-sm text-primary-600 font-medium">
                {selectedReceipts.length} selected
              </span>
            )}
          </div>
          <button
            onClick={handleBulkPrint}
            disabled={selectedReceipts.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
          >
            🖨️ Bulk Print ({selectedReceipts.length})
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-500">Loading receipts...</span>
        </div>
      )}

      {/* No Data */}
      {!loading && (!data || data.payments.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-gray-500 text-lg font-medium">
            No receipts found for {formatDate(selectedDate)}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Try selecting a different date
          </p>
        </div>
      )}

      {/* Receipts Table */}
      {!loading && data && data.payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                    <input
                      type="checkbox"
                      checked={selectedReceipts.length === data.payments.length}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Receipt No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fee Head
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.payments.map((payment) => (
                  <tr
                    key={payment.receiptNo}
                    className={`hover:bg-gray-50 ${
                      selectedReceipts.includes(payment.receiptNo)
                        ? "bg-primary-50"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedReceipts.includes(payment.receiptNo)}
                        onChange={() => toggleSelect(payment.receiptNo)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-primary-600 font-medium">
                      {payment.receiptNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.student.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {payment.student.admissionNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.student.class}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.feeStructure}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatTime(payment.paymentDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handlePrintSingle(payment)}
                        className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg hover:bg-primary-100 transition-colors"
                        title="Print Receipt"
                      >
                        🖨️ Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="bg-gray-50 border-t px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {data.payments.length} receipts for{" "}
              <strong>{formatDate(selectedDate)}</strong>
            </span>
            <span className="text-sm font-bold text-green-700">
              Total: {formatCurrency(data.grandTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeReceiptsPage;

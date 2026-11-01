/**
 * 🧾 Fee Receipt PDF Page
 *
 * Wraps the existing FeeReceiptPrint component with PrintExportBar
 * and adds server-side PDF download capability.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import PrintExportBar from "../../components/print/PrintExportBar";
import { FeeReceiptPrint } from "../../components/print";
import type { FeeReceiptData } from "../../components/print";

export default function FeeReceiptPDFPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FeeReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!paymentId) return;
    fetchData();
  }, [paymentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch payment details — try the receipt endpoint first, fall back to payment details
      const res = await axios.get(
        getFullUrl(`/api/fees/payment/${paymentId}`),
        { headers }
      );

      const payment = res.data?.data || res.data;
      if (!payment) throw new Error("Payment not found");

      const studentFee = payment.studentFee || {};
      const enrollment = studentFee.enrollment || {};
      const student = enrollment.student || payment.student || {};

      setData({
        receiptNo: payment.receiptNumber || payment.id?.slice(-8)?.toUpperCase() || "N/A",
        date: new Date(payment.paymentDate || payment.createdAt).toLocaleDateString("en-IN"),
        studentName: student.firstName
          ? `${student.firstName} ${student.lastName || ""}`
          : payment.studentName || "N/A",
        admissionNo: student.admissionNo || payment.admissionNo || "",
        class: enrollment.class?.name || payment.className || "",
        section: enrollment.section?.name || payment.sectionName || "",
        fatherName: student.fatherName || payment.fatherName || "",
        phone: student.phone || student.fatherPhone || "",
        items: (studentFee.feeStructure?.items || payment.items || []).map((i: any) => ({
          name: i.feeHead?.name || i.name || "Fee",
          amount: i.amount || 0,
          period: i.frequency || i.period || "",
        })),
        totalAmount: studentFee.totalAmount || payment.totalAmount || payment.amount || 0,
        discount: studentFee.discountAmount || payment.discount || 0,
        fineAmount: studentFee.fineAmount || payment.fineAmount || 0,
        netAmount: payment.amount || 0,
        paidAmount: payment.amount || 0,
        balanceAmount: studentFee.balanceAmount || payment.balanceAmount || 0,
        paymentMode: payment.paymentMode || payment.method || "Cash",
        transactionId: payment.transactionId || payment.referenceNumber || "",
        academicYear: enrollment.academicYear?.name || "",
      });
    } catch (err: any) {
      console.error("Failed to load fee receipt data:", err);
      toast.error("Failed to load receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(
        getFullUrl(`/api/fees/receipt/${paymentId}/pdf`),
        { headers, responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `fee-receipt-${paymentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Receipt PDF downloaded!");
    } catch (err: any) {
      toast.error("PDF download failed");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        No receipt data found for this payment.
      </div>
    );
  }

  return (
    <div>
      <PrintExportBar
        title="Fee Receipt"
        onDownloadPdf={handleDownloadPdf}
        onBack={() => navigate(-1)}
        loading={downloading}
      />
      <div className="max-w-[210mm] mx-auto mt-4">
        <FeeReceiptPrint data={data} showControls={false} mode="preview" />
      </div>
    </div>
  );
}

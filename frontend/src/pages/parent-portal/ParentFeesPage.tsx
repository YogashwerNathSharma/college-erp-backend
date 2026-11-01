import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import {
  IndianRupee,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";

// ─── Types ───
interface Child {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  sectionName: string;
}

interface FeeRecord {
  id: string;
  totalAmount: number;
  discountAmount: number;
  fineAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  installmentNo: number;
  dueDate: string;
  status: string;
  feeHead?: { id: string; name: string };
  feeStructure?: { id: string; name: string };
}

interface FeeSummary {
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  PAID: { bg: "bg-green-100", text: "text-green-700", label: "Paid" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
  UNPAID: { bg: "bg-red-100", text: "text-red-700", label: "Unpaid" },
  PARTIAL: { bg: "bg-orange-100", text: "text-orange-700", label: "Partial" },
  PARTIALLY_PAID: { bg: "bg-orange-100", text: "text-orange-700", label: "Partial" },
  OVERDUE: { bg: "bg-red-100", text: "text-red-700", label: "Overdue" },
};

function ParentFeesPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchFees(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/parent/my-children"));
      if (res.data?.success && res.data.data?.length > 0) {
        setChildren(res.data.data);
        setSelectedChild(res.data.data[0]);
      }
    } catch {
      toast.error("Failed to load children");
    } finally {
      setLoading(false);
    }
  };

  const fetchFees = async (studentId: string) => {
    try {
      const res = await axios.get(getFullUrl(`/api/parent/child/${studentId}/fees`));
      if (res.data?.success) {
        setFees(res.data.data.fees || []);
        setSummary(res.data.data.summary || null);
      }
    } catch {
      toast.error("Failed to load fee data");
    }
  };

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <IndianRupee className="text-teal-600" size={24} />
        Fee Details
      </h1>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                selectedChild?.id === child.id
                  ? "bg-teal-50 border-teal-500 text-teal-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Users size={16} />
              {child.firstName} {child.lastName}
            </button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <IndianRupee className="text-blue-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Fee</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalDue)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-500">Paid Amount</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalPaid)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-500">Balance Due</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalBalance)}</p>
          </div>
        </div>
      )}

      {/* Fee Details Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Installment Details</h3>
        </div>

        {fees.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-500 text-sm">No fee records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Fee Head</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Due Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Discount</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Fine</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Net</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Paid</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Balance</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => {
                  const badge = STATUS_BADGE[fee.status] || STATUS_BADGE["PENDING"];
                  const isOverdue = fee.status !== "PAID" && new Date(fee.dueDate) < new Date();

                  return (
                    <tr key={fee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{fee.installmentNo}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {fee.feeHead?.name || fee.feeStructure?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`flex items-center justify-center gap-1 ${isOverdue ? "text-red-600" : "text-gray-600"}`}>
                          <Calendar size={14} />
                          {formatDate(fee.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(fee.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {fee.discountAmount > 0 ? `-${formatCurrency(fee.discountAmount)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {fee.fineAmount > 0 ? `+${formatCurrency(fee.fineAmount)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {formatCurrency(fee.netAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-700 font-medium">
                        {formatCurrency(fee.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {fee.balanceAmount > 0 ? formatCurrency(fee.balanceAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {isOverdue && fee.status !== "PAID" ? "Overdue" : badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentFeesPage;

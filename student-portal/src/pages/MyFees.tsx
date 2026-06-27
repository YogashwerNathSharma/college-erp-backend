import { useState, useEffect } from "react";
import { portalService } from "../services/portal.service";
import { HiDownload } from "react-icons/hi";

//////////////////////////////////////////////////////
// 💰 MY FEES PAGE
//////////////////////////////////////////////////////

interface FeeData {
  summary: {
    totalFee: number;
    paidAmount: number;
    pendingAmount: number;
    discount: number;
  };
  installments: Array<{
    id: string;
    name: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
  }>;
  receipts: Array<{
    id: string;
    receiptNo: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
  }>;
}

export default function MyFees() {
  const [data, setData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"summary" | "receipts">("summary");

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const result = await portalService.getFees();
        setData(result);
      } catch (error) {
        console.error("Fees fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, []);

  const statusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    PENDING: "bg-orange-100 text-orange-700",
    OVERDUE: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Fees</h1>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-xl font-bold text-gray-900">₹{data?.summary?.totalFee?.toLocaleString("en-IN") || 0}</p>
          <p className="text-sm text-gray-500">Total Fee</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-xl font-bold text-green-600">₹{data?.summary?.paidAmount?.toLocaleString("en-IN") || 0}</p>
          <p className="text-sm text-gray-500">Paid</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-xl font-bold text-red-600">₹{data?.summary?.pendingAmount?.toLocaleString("en-IN") || 0}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-lg p-4 border text-center">
          <p className="text-xl font-bold text-blue-600">₹{data?.summary?.discount?.toLocaleString("en-IN") || 0}</p>
          <p className="text-sm text-gray-500">Discount</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setTab("summary")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
            tab === "summary" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500"
          }`}
        >
          Fee Breakdown
        </button>
        <button
          onClick={() => setTab("receipts")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
            tab === "receipts" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500"
          }`}
        >
          Payment Receipts
        </button>
      </div>

      {tab === "summary" ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installment</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.installments?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">₹{item.amount.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{item.dueDate}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.receipts?.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{receipt.receiptNo}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">₹{receipt.amount.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{receipt.paymentDate}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{receipt.paymentMode}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-primary-600 hover:text-primary-700">
                      <HiDownload className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

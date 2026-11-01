import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { FiDollarSign } from "react-icons/fi";

interface SalaryRecord { id: string; month: number; year: number; basicSalary: number; totalAllowances: number; totalDeductions: number; netSalary: number; status: string; }

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}
function normalizeId(item: any): string { return item?.id || item?._id || ""; }
function Spinner() { return (<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>); }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function MySalaryPage() {
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [currentSalary, setCurrentSalary] = useState<SalaryRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalary() {
      try {
        const now = new Date();
        const res = await axios.get(getFullUrl("/api/teacher-salary"), { headers: getAuthHeaders(), params: { month: now.getMonth() + 1, year: now.getFullYear() } });
        const data = res.data?.data?.data || res.data?.data || [];
        const records: SalaryRecord[] = Array.isArray(data) ? data : (data ? [data] : []);
        setSalaryRecords(records);
        if (records.length > 0) setCurrentSalary(records[0]);
      } catch {} finally { setLoading(false); }
    }
    fetchSalary();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Salary & Payslips</h2>
      {currentSalary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-sm text-gray-500">Basic Salary</p><p className="text-2xl font-bold text-gray-800 mt-1">\u20b9{(currentSalary.basicSalary || 0).toLocaleString("en-IN")}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-sm text-gray-500">Allowances</p><p className="text-2xl font-bold text-green-600 mt-1">\u20b9{(currentSalary.totalAllowances || 0).toLocaleString("en-IN")}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-sm text-gray-500">Net Pay</p><p className="text-2xl font-bold text-indigo-600 mt-1">\u20b9{(currentSalary.netSalary || 0).toLocaleString("en-IN")}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Recent Payslips</h3></div>
            <div className="divide-y divide-gray-100">
              {salaryRecords.map((slip) => {
                const monthName = MONTHS[(slip.month || 1) - 1] || "Unknown";
                return (
                  <div key={normalizeId(slip)} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{monthName} {slip.year}</p>
                      <p className="text-xs text-gray-500">Basic: \u20b9{(slip.basicSalary || 0).toLocaleString("en-IN")} | Allowances: \u20b9{(slip.totalAllowances || 0).toLocaleString("en-IN")} | Ded: \u20b9{(slip.totalDeductions || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600">\u20b9{(slip.netSalary || 0).toLocaleString("en-IN")}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${slip.status === "PAID" ? "bg-green-100 text-green-700" : slip.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{slip.status || "N/A"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8"><div className="text-center py-8 text-gray-500"><FiDollarSign className="mx-auto text-3xl mb-2 text-gray-300" /><p className="text-sm">No salary records available. Please contact administration.</p></div></div>
      )}
    </div>
  );
}

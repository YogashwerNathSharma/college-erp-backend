

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiDollarSign, FiDownload } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

interface SalaryRecord {
  id: string;
  teacherId: string;
  teacher?: { name: string; email: string };
  month: number;
  year: number;
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TeacherSalary = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salary, setSalary] = useState<SalaryRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teacher`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setTeachers(res.data.data?.data || []);
    } catch (err) {
      toast.error("Failed to load teachers");
    }
  };

  const fetchSalary = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/teacher-salary/${selectedTeacher}/slip?month=${selectedMonth}&year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSalary(res.data.data);
      }
    } catch (err: any) {
      setSalary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchSalary();
  }, [selectedTeacher, selectedMonth, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Payroll / Salary</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : salary ? (
        <>
          {/* Salary Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <p className="text-sm text-gray-500">Basic Salary</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{salary.basicSalary?.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <p className="text-sm text-gray-500">Allowances</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{salary.totalAllowances?.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <p className="text-sm text-gray-500">Deductions</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{salary.totalDeductions?.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
              <p className="text-sm text-gray-500">Net Salary</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{salary.netSalary?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Salary Breakdown - {MONTHS[selectedMonth - 1]} {selectedYear}
              </h2>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <FiDownload size={16} /> Download Payslip
              </button>
            </div>

            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-semibold text-gray-600">Description</th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 text-sm text-gray-700">Basic Salary</td>
                    <td className="py-3 text-sm text-gray-700 text-right">
                      ₹{salary.basicSalary?.toLocaleString()}
                    </td>
                  </tr>

                  {/* Allowances */}
                  {(salary.allowances as any[])?.map((item: any, i: number) => (
                    <tr key={`a-${i}`} className="border-b">
                      <td className="py-3 text-sm text-gray-700">{item.name} (Allowance)</td>
                      <td className="py-3 text-sm text-green-600 text-right">
                        +₹{item.amount?.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  <tr className="border-b bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-700">Total Allowances</td>
                    <td className="py-3 text-sm font-medium text-green-600 text-right">
                      +₹{salary.totalAllowances?.toLocaleString()}
                    </td>
                  </tr>

                  {/* Deductions */}
                  {(salary.deductions as any[])?.map((item: any, i: number) => (
                    <tr key={`d-${i}`} className="border-b">
                      <td className="py-3 text-sm text-gray-700">{item.name} (Deduction)</td>
                      <td className="py-3 text-sm text-red-600 text-right">
                        -₹{item.amount?.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  <tr className="border-b bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-700">Total Deductions</td>
                    <td className="py-3 text-sm font-medium text-red-600 text-right">
                      -₹{salary.totalDeductions?.toLocaleString()}
                    </td>
                  </tr>

                  <tr className="bg-blue-50">
                    <td className="py-4 text-base font-bold text-gray-800">Net Salary</td>
                    <td className="py-4 text-base font-bold text-blue-600 text-right">
                      ₹{salary.netSalary?.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : selectedTeacher ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiDollarSign className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No salary record found for this month</p>
        </div>
      ) : null}
    </div>
  );
};

export default TeacherSalary;


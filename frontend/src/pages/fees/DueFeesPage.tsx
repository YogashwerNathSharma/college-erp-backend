import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, Search, ChevronDown, ChevronRight, Users, IndianRupee, X, Printer } from "lucide-react";

interface DueFeeStudent {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  totalDue: number;
  paidAmount: number;
  balance: number;
}

interface ClassWiseDue {
  classId: string;
  className: string;
  totalStudents: number;
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
  students: DueFeeStudent[];
}

export default function DueFeesPage() {
  const [classData, setClassData] = useState<ClassWiseDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"class" | "student">("class");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentFees, setStudentFees] = useState<any[]>([]);

  useEffect(() => {
    fetchDueFees();
  }, []);

  const fetchDueFees = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("/api/fees/due-summary", { headers });
      setClassData(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching due fees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentFeeDetail = async (studentId: string, studentInfo: any) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/fees/collection/search?studentId=${studentId}`, { headers });
      const fees = res.data?.data?.fees || res.data?.data || [];
      setStudentFees(fees);
      setSelectedStudent(studentInfo);
    } catch (err) {
      console.error("Error fetching student fees:", err);
      setStudentFees([]);
      setSelectedStudent(studentInfo);
    }
  };

  const handleStudentClick = (s: any) => {
    fetchStudentFeeDetail(s.studentId, s);
  };

  const allStudents = classData.flatMap(c =>
    c.students.map(s => ({ ...s, className: c.className }))
  );

  const filteredStudents = allStudents.filter(s =>
    s.balance > 0 &&
    (s.studentName.toLowerCase().includes(search.toLowerCase()) ||
     s.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
     s.className.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDueAll = classData.reduce((sum, c) => sum + c.totalBalance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="text-red-500" size={24} />
            Due Fees Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total pending: <span className="font-bold text-red-600 dark:text-red-400">₹{totalDueAll.toLocaleString("en-IN")}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("class")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === "class" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            Class-wise
          </button>
          <button
            onClick={() => setView("student")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === "student" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            Student-wise
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, admission no, or class..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Class-wise View */}
      {view === "class" && (
        <div className="space-y-3">
          {classData.filter(c => c.totalBalance > 0).map((cls) => (
            <div key={cls.classId} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setExpandedClass(expandedClass === cls.classId ? null : cls.classId)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 dark:text-white">Class {cls.className}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cls.totalStudents} students with dues</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-red-600 dark:text-red-400">₹{cls.totalBalance.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-slate-400">pending</p>
                  </div>
                  {expandedClass === cls.classId ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>

              {expandedClass === cls.classId && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/30">
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Student</th>
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Adm. No</th>
                        <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Section</th>
                        <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2">Total Fee</th>
                        <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2">Paid</th>
                        <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cls.students.filter(s => s.balance > 0).map((s) => (
                        <tr key={s.studentId} onClick={() => handleStudentClick(s)} className="border-t border-slate-50 dark:border-slate-700/50 hover:bg-indigo-50 dark:hover:bg-slate-700/20 cursor-pointer">
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">{s.studentName}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-500">{s.admissionNo}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-500">{s.sectionName || "—"}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-slate-600 dark:text-slate-300">₹{s.totalDue.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-emerald-600">₹{s.paidAmount.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 text-sm text-right font-bold text-red-600">₹{s.balance.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {classData.filter(c => c.totalBalance > 0).length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <IndianRupee size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No dues found!</p>
              <p className="text-sm mt-1">All fees are cleared 🎉</p>
            </div>
          )}
        </div>
      )}

      {/* Student-wise View */}
      {view === "student" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Student</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Class</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Section</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Adm No</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Total Fee</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Paid</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Due Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.slice(0, 50).map((s, i) => (
                <tr key={i} onClick={() => handleStudentClick(s)} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-indigo-50 dark:hover:bg-slate-700/20 cursor-pointer">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">{s.studentName}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-500">Class {s.className}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-500">{s.sectionName || "—"}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-500">{s.admissionNo}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-slate-600 dark:text-slate-300">₹{s.totalDue.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-emerald-600">₹{s.paidAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-bold text-red-600">₹{s.balance.toLocaleString("en-IN")}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    {search ? "No matching students found" : "No dues found!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredStudents.length > 50 && (
            <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700">
              Showing 50 of {filteredStudents.length} students
            </div>
          )}
        </div>
      )}
    </div>

    {/* Student Fee Detail Modal */}
    {selectedStudent && (
      <div className="fixed inset-0 bg-black/60 z-[9000] flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedStudent.studentName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedStudent.admissionNo} • Class {selectedStudent.className}{selectedStudent.sectionName ? ` - ${selectedStudent.sectionName}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (!printWindow) return;
                  const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
                  const user = JSON.parse(localStorage.getItem("user") || "{}");
                  const logoUrl = tenant.logoUrl ? (tenant.logoUrl.startsWith("http") ? tenant.logoUrl : tenant.logoUrl) : "";
                  const schoolName = tenant.name || tenant.schoolName || "School";
                  const address = tenant.address || "";
                  const adminName = user.name || user.firstName || "Admin";
                  const now = new Date();
                  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
                  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
                  printWindow.document.write(`<html><head><title>Fee Record - ${selectedStudent.studentName}</title>
                    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:15mm;font-size:12px;color:#222}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #333;padding:6px 8px;text-align:left;font-size:11px}th{background:#f0f0f0;font-weight:600}@media print{body{padding:10mm}@page{size:A4;margin:10mm}-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}</style></head><body>
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:15px;"><div style="flex-shrink:0;width:60px;">${logoUrl ? `<img src="${logoUrl}" style="width:55px;height:55px;object-fit:contain;border-radius:4px;" />` : `<div style="width:55px;height:55px;background:#4f46e5;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px;">${schoolName.charAt(0)}</div>`}</div><div style="flex:1;text-align:center;padding:0 15px;"><h1 style="margin:0;font-size:18px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;">${schoolName}</h1>${address ? `<p style="margin:3px 0 0;font-size:11px;color:#444;">${address}</p>` : ""}</div><div style="flex-shrink:0;text-align:right;font-size:10px;color:#555;min-width:130px;"><p style="margin:0;"><strong>Printed by:</strong> ${adminName}</p><p style="margin:3px 0 0;"><strong>Date:</strong> ${dateStr}</p><p style="margin:3px 0 0;"><strong>Time:</strong> ${timeStr}</p></div></div>
                    <h2 style="font-size:14px;font-weight:bold;margin-bottom:5px;">Fee Record</h2>
                    <p style="font-size:11px;margin-bottom:10px;"><b>${selectedStudent.studentName}</b> | ${selectedStudent.admissionNo} | Class ${selectedStudent.className} ${selectedStudent.sectionName || ""}</p>
                    <table><tr><th>#</th><th>Installment</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Due Date</th></tr>
                    ${studentFees.map((f: any, i: number) => `<tr><td>${i+1}</td><td>${f.installmentNo || i+1}</td><td>₹${(f.netAmount || f.totalAmount || 0).toLocaleString("en-IN")}</td><td>₹${(f.paidAmount || 0).toLocaleString("en-IN")}</td><td class="total">₹${(f.balanceAmount || 0).toLocaleString("en-IN")}</td><td>${f.status || "—"}</td><td>${f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "—"}</td></tr>`).join("")}
                    </table><br><p style="font-weight:bold;margin-top:10px;">Total Due: ₹${selectedStudent.balance?.toLocaleString("en-IN") || "0"}</p></body></html>`);
                  printWindow.document.close();
                  printWindow.print();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
              >
                <Printer size={14} /> Print
              </button>
              <button onClick={() => { setSelectedStudent(null); window.location.href = `/fees/collection?student=${encodeURIComponent(selectedStudent?.admissionNo || selectedStudent?.studentName || "")}`; }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition">
                💰 Collect Fee
              </button>
              <button onClick={() => setSelectedStudent(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Fee</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">₹{selectedStudent.totalDue?.toLocaleString("en-IN") || "0"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Paid</p>
              <p className="text-lg font-bold text-emerald-600">₹{selectedStudent.paidAmount?.toLocaleString("en-IN") || "0"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Due</p>
              <p className="text-lg font-bold text-red-600">₹{selectedStudent.balance?.toLocaleString("en-IN") || "0"}</p>
            </div>
          </div>

          {/* Fee Installments Table */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {studentFees.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">#</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Installment</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Total</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Paid</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Balance</th>
                    <th className="text-center py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {studentFees.map((f: any, i: number) => (
                    <tr key={f.id || i} className="border-b border-slate-50 dark:border-slate-700/50">
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">{i + 1}</td>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">Inst. {f.installmentNo || i + 1}</td>
                      <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">₹{(f.netAmount || f.totalAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 text-right text-emerald-600">₹{(f.paidAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 text-right font-bold text-red-600">₹{(f.balanceAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : f.status === "OVERDUE" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"}`}>
                          {f.status || "PENDING"}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <p>No detailed fee records found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

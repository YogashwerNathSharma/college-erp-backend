import { useState, useEffect } from "react";
import { X, Printer, Download, Search, Filter } from "lucide-react";
import axios from "axios";
import { printDocument, printMultipleReceipts } from "../../utils/print";

type ModalType = "students" | "classes" | "fees_collected" | "fees_pending" | "receipts" | "recent_payments";

type Props = {
  isOpen: boolean;
  type: ModalType;
  onClose: () => void;
};

export default function DashboardDetailModal({ isOpen, type, onClose }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [fatherFilter, setFatherFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setClassFilter("");
      setFatherFilter("");
      setAddressFilter("");
      setSelectedItems(new Set());
      setSelectAll(false);
      fetchData();
      fetchClasses();
    }
  }, [isOpen, type]);

  // Also refetch when search/class changes (server-side search for students)
  useEffect(() => {
    if (isOpen && type === "students") {
      const timer = setTimeout(() => fetchData(), 300); // Debounce
      return () => clearTimeout(timer);
    }
  }, [searchTerm, classFilter]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get("/api/class", { headers });
      const d = res.data?.data || res.data;
      setClasses(Array.isArray(d) ? d : d?.classes || []);
    } catch {
      setClasses([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let result: any[] = [];

      switch (type) {
        case "students": {
          // Backend supports: ?search=&classId=&limit=1000
          let url = "/api/students?limit=1000";
          if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
          if (classFilter) {
            // Find classId from class name
            const cls = classes.find((c: any) => c.name === classFilter);
            if (cls) url += `&classId=${cls.id}`;
          }
          const res = await axios.get(url, { headers });
          const d = res.data?.data;
          // API returns { students: [...], total, page, limit }
          result = d?.students || d || [];
          break;
        }
        case "classes": {
          const res = await axios.get("/api/class", { headers });
          const d = res.data?.data || res.data;
          result = Array.isArray(d) ? d : d?.classes || [];
          break;
        }
        case "fees_collected":
        case "receipts":
        case "recent_payments": {
          const res = await axios.get("/api/fees/collection/all-payments", { headers });
          result = res.data?.data || [];
          break;
        }
        case "fees_pending": {
          const res = await axios.get("/api/fees/collection/defaulters", { headers });
          result = res.data?.data?.defaulters || res.data?.defaulters || res.data?.data || [];
          break;
        }
      }

      setData(Array.isArray(result) ? result : []);
    } catch (err: any) {
      console.error("Modal fetch error:", err?.response?.status, err?.response?.data, err?.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ━━━ CLIENT-SIDE FILTERS (for non-student types) ━━━
  const filteredData = data.filter((item: any) => {
    // For students: server-side search already applied, only do father/address here
    if (type === "students") {
      const father = (item.fatherName || "").toLowerCase();
      const address = (item.address || "").toLowerCase();
      const matchFather = !fatherFilter || father.includes(fatherFilter.toLowerCase());
      const matchAddress = !addressFilter || address.includes(addressFilter.toLowerCase());
      return matchFather && matchAddress;
    }

    // For fees/receipts: client-side search
    const name = `${item.firstName || ""} ${item.lastName || ""} ${item.studentName || ""} ${item.student?.name || ""}`.toLowerCase();
    const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
    const itemClass = (item.className || item.class?.name || item.class || "").trim();
    const matchClass = !classFilter || itemClass === classFilter;
    return matchSearch && matchClass;
  });

  // ━━━ SELECT ━━━
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredData.map((d: any) => d.id || d._id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  // ━━━ PRINT ━━━
  const handlePrintSingle = (item: any) => {
    if (type === "fees_collected" || type === "receipts" || type === "recent_payments") {
      // Use Unified Print System
      printDocument("fee_receipt", item);
    } else {
      printItems([item]);
    }
  };
  const handlePrintSelected = () => {
    const items = filteredData.filter((d: any) => selectedItems.has(d.id || d._id));
    if (items.length === 0) { alert("Koi item select nahi kiya!"); return; }
    if (type === "fees_collected" || type === "receipts" || type === "recent_payments") {
      // Print ALL selected receipts in ONE window with page breaks
      printMultipleReceipts(items);
    } else {
      printItems(items);
    }
  };
  const handlePrintClassWise = () => {
    if (!classFilter) { alert("Pehle class filter select karo!"); return; }
    if (type === "fees_collected" || type === "receipts" || type === "recent_payments") {
      filteredData.forEach((item: any) => { handlePrintSingle(item); });
    } else {
      printItems(filteredData);
    }
  };
  const handlePrintAll = () => {
    if (type === "fees_collected" || type === "receipts" || type === "recent_payments") {
      filteredData.forEach((item: any) => { handlePrintSingle(item); });
    } else {
      printItems(filteredData);
    }
  };

  // Direct print without redirect
  const printItems = (items: any[]) => {
    // Use hidden iframe for mobile-friendly print (no popup blocking)
    let printFrame = document.getElementById("yn-print-frame") as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "yn-print-frame";
      printFrame.style.position = "fixed";
      printFrame.style.top = "-10000px";
      printFrame.style.left = "-10000px";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "none";
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!frameDoc) { alert("Print not supported"); return; }

    const rows = items.map((item: any, i: number) => {
      if (type === "students") {
        return `<tr><td>${i+1}</td><td><b>${item.firstName || ""} ${item.lastName || ""}</b></td><td>${getStudentClass(item)}</td><td>${getStudentSection(item)}</td><td>${item.fatherName || "-"}</td><td>${item.phone || item.fatherPhone || "-"}</td><td>${item.address || "-"}</td></tr>`;
      } else if (type === "fees_pending") {
        return `<tr><td>${i+1}</td><td><b>${item.studentName || item.student?.name || "-"}</b></td><td>${item.className || item.class || "-"}</td><td style="color:red;font-weight:bold">₹${item.pendingAmount || item.pending || 0}</td><td>₹${item.totalAmount || item.netAmount || 0}</td></tr>`;
      } else {
        return `<tr><td>${i+1}</td><td><b>${item.studentName || item.student?.name || "-"}</b></td><td>${item.className || item.class || "-"}</td><td>${item.receiptNo || "-"}</td><td style="font-weight:bold;color:green">₹${item.amount || item.paidAmount || 0}</td><td>${item.paymentDate ? new Date(item.paymentDate).toLocaleDateString("en-IN") : item.date || "-"}</td><td>${item.method || "-"}</td></tr>`;
      }
    }).join("");

    const headers = type === "students"
      ? "<th>#</th><th>Name</th><th>Class</th><th>Section</th><th>Father</th><th>Phone</th><th>Address</th>"
      : type === "fees_pending"
        ? "<th>#</th><th>Student</th><th>Class</th><th>Pending</th><th>Total</th>"
        : "<th>#</th><th>Student</th><th>Class</th><th>Receipt No</th><th>Amount</th><th>Date</th><th>Method</th>";

    const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");

    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html><html><head><title>Print - ${getTitle()}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;padding:20px;font-size:12px}
        .header{text-align:center;margin-bottom:15px;border-bottom:2px solid #333;padding-bottom:10px}
        .header h1{font-size:18px;margin-bottom:2px}
        .header p{font-size:11px;color:#555}
        .meta{display:flex;justify-content:space-between;margin-bottom:10px;font-size:11px}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:11px}
        th{background:#f5f5f5;font-weight:bold}
        tr:nth-child(even){background:#fafafa}
        .footer{margin-top:20px;text-align:center;font-size:10px;color:#999}
        @media print{body{padding:10px}button{display:none!important}}
        @media (max-width:600px){th,td{padding:4px;font-size:10px}}
      </style></head><body>
      <div class="header">
        <h1>${tenant.name || "School"}</h1>
        <p>${tenant.address || ""} ${tenant.phone ? "| Ph: "+tenant.phone : ""}</p>
      </div>
      <div class="meta"><span><b>${getTitle()}</b></span><span>Date: ${new Date().toLocaleDateString("en-IN")} | Total: ${items.length}</span></div>
      <table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">Generated by yn AI ERP System</div>
    </body></html>`);
    frameDoc.close();

    // Wait for content to render then print
    setTimeout(() => {
      printFrame.contentWindow?.print();
    }, 300);
  };

  // ━━━ TITLE ━━━
  const getTitle = () => {
    switch (type) {
      case "students": return "👨🎓 All Students";
      case "classes": return "🏫 All Classes";
      case "fees_collected": return "💰 Fee Receipts (Collected)";
      case "fees_pending": return "⚠️ Pending Fees (Defaulters)";
      case "receipts": return "🧾 Print Receipts — All Receipts";
      case "recent_payments": return "💳 Recent Payments";
    }
  };

  // Get class/section from student's enrollment
  const getStudentClass = (item: any) => {
    if (item.enrollments && item.enrollments.length > 0) {
      return item.enrollments[0]?.class?.name || "-";
    }
    return item.className || item.class?.name || "-";
  };
  const getStudentSection = (item: any) => {
    if (item.enrollments && item.enrollments.length > 0) {
      return item.enrollments[0]?.section?.name || "-";
    }
    return item.sectionName || item.section?.name || "-";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl h-[100vh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden sm:rounded-2xl rounded-none" onClick={(e) => e.stopPropagation()}>
        
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{getTitle()}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded">{filteredData.length} records</span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ═══ FILTERS ═══ */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[150px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={type === "students" ? "Search name, admission no, phone..." : "Search name..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500"
              />
            </div>

            {type !== "classes" && (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white min-w-[120px]"
              >
                <option value="">All Classes</option>
                {classes.map((c: any) => (
                  <option key={c.id || c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}

            {type === "students" && (
              <>
                <input type="text" placeholder="Father name..." value={fatherFilter} onChange={(e) => setFatherFilter(e.target.value)} 
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm w-[130px]" />
                <input type="text" placeholder="Address..." value={addressFilter} onChange={(e) => setAddressFilter(e.target.value)} 
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm w-[130px]" />
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrintSelected} disabled={selectedItems.size === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition">
              <Printer size={13} /> Print Selected ({selectedItems.size})
            </button>
            <button onClick={handlePrintClassWise}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition">
              <Filter size={13} /> Class-wise
            </button>
            <button onClick={handlePrintAll}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition">
              <Download size={13} /> Bulk All
            </button>
          </div>
        </div>

        {/* ═══ TABLE ═══ */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-500 py-16">
              <p className="text-lg">😕 Koi data nahi mila</p>
              <p className="text-sm mt-1">Search type karein ya class select karein</p>
            </div>
          ) : (
            <table className="w-full text-sm text-slate-800 dark:text-slate-200">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <tr className="text-left text-slate-600 dark:text-slate-300 text-xs uppercase">
                  <th className="p-2.5 w-8"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                  <th className="p-2.5 w-8">#</th>
                  {type === "students" && (
                    <><th className="p-2.5">Name</th><th className="p-2.5">Class</th><th className="p-2.5">Section</th><th className="p-2.5">Father</th><th className="p-2.5">Phone</th><th className="p-2.5">Address</th></>
                  )}
                  {type === "classes" && (
                    <><th className="p-2.5">Class</th><th className="p-2.5">Sections</th></>
                  )}
                  {(type === "fees_collected" || type === "receipts" || type === "recent_payments") && (
                    <><th className="p-2.5">Student</th><th className="p-2.5">Class</th><th className="p-2.5">Section</th><th className="p-2.5">Receipt</th><th className="p-2.5">Amount</th><th className="p-2.5">Date</th><th className="p-2.5">Method</th></>
                  )}
                  {type === "fees_pending" && (
                    <><th className="p-2.5">Student</th><th className="p-2.5">Class</th><th className="p-2.5">Pending</th><th className="p-2.5">Total</th></>
                  )}
                  <th className="p-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item: any, i: number) => {
                  const id = item.id || item._id || `row-${i}`;
                  const isSelected = selectedItems.has(id);
                  return (
                    <tr key={id} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-indigo-50/40 dark:hover:bg-slate-800 ${isSelected ? "bg-indigo-50 dark:bg-indigo-950" : ""}`}>
                      <td className="p-2.5"><input type="checkbox" checked={isSelected} onChange={() => toggleItem(id)} /></td>
                      <td className="p-2.5 text-slate-400 text-xs">{i + 1}</td>

                      {type === "students" && (
                        <>
                          <td className="p-2.5 font-medium">{item.firstName} {item.lastName}</td>
                          <td className="p-2.5">{getStudentClass(item)}</td>
                          <td className="p-2.5">{getStudentSection(item)}</td>
                          <td className="p-2.5 text-slate-600">{item.fatherName || "-"}</td>
                          <td className="p-2.5 text-slate-500 text-xs">{item.phone || item.fatherPhone || "-"}</td>
                          <td className="p-2.5 text-slate-500 text-xs max-w-[120px] truncate">{item.address || "-"}</td>
                        </>
                      )}
                      {type === "classes" && (
                        <>
                          <td className="p-2.5 font-medium">{item.name}</td>
                          <td className="p-2.5">{item.sections?.length || "-"}</td>
                        </>
                      )}
                      {(type === "fees_collected" || type === "receipts" || type === "recent_payments") && (
                        <>
                          <td className="p-2.5 font-medium">{item.studentName || item.student?.name || "-"}</td>
                          <td className="p-2.5">{item.className || item.class || "-"}</td>
                          <td className="p-2.5">{item.section || item.sectionName || "-"}</td>
                          <td className="p-2.5 font-mono text-indigo-600 text-xs">{item.receiptNo || "-"}</td>
                          <td className="p-2.5 font-bold text-green-600">₹{item.amount || item.paidAmount || 0}</td>
                          <td className="p-2.5 text-xs">{item.paymentDate ? new Date(item.paymentDate).toLocaleDateString("en-IN") : item.date || "-"}</td>
                          <td className="p-2.5"><span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">{item.method || "-"}</span></td>
                        </>
                      )}
                      {type === "fees_pending" && (
                        <>
                          <td className="p-2.5 font-medium">{item.studentName || item.student?.name || "-"}</td>
                          <td className="p-2.5">{item.className || item.class || "-"}</td>
                          <td className="p-2.5 font-bold text-red-500">₹{item.pendingAmount || item.pending || 0}</td>
                          <td className="p-2.5">₹{item.totalAmount || item.netAmount || 0}</td>
                        </>
                      )}

                      <td className="p-2.5">
                        <button onClick={() => handlePrintSingle(item)} className="text-indigo-500 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded" title="Print">
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-6 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          <span>{filteredData.length} of {data.length}</span>
          <span>Selected: {selectedItems.size}</span>
        </div>
      </div>
    </div>
  );
}

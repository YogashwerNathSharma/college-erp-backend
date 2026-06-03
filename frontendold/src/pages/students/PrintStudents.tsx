
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface AcademicYear { id: string; name: string; }
interface ClassItem { id: string; name: string; }
interface Section { id: string; name: string; }
interface TenantInfo {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  type?: string;
}

// Default selected columns (initial selection)
const DEFAULT_SELECTED = [
  "admissionNo", "firstName", "lastName", "fatherName", "gender", "dob", "phone", "status",
];

const PrintStudents = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  // Filters
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  // Data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Tenant info from localStorage (saved by Dashboard)
  const [tenant] = useState<TenantInfo | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("tenant") || "null");
    } catch {
      return null;
    }
  });

  // Dynamic columns
  const [availableColumns, setAvailableColumns] = useState<{ key: string; label: string }[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED);

  // UI
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearRes, classRes] = await Promise.all([
          axios.get("/api/academic"),
          axios.get("/api/class"),
        ]);
        const years = yearRes.data?.data || yearRes.data || [];
        const cls = classRes.data?.data || classRes.data || [];
        setAcademicYears(Array.isArray(years) ? years : []);
        setClasses(Array.isArray(cls) ? cls : []);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch sections
  useEffect(() => {
    if (!classId) { setSections([]); return; }
    axios.get(`/api/section?classId=${classId}`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setSections(Array.isArray(data) ? data : []);
      })
      .catch(() => setSections([]));
  }, [classId]);

  // Build dynamic columns from student data
  const buildColumnsFromData = (studentList: any[]) => {
    if (studentList.length === 0) return;

    const excludeKeys = ["id", "tenantId", "isDeleted", "deletedAt", "createdAt", "updatedAt", "enrollments", "photoUrl", "academicYearId"];

    const labelMap: Record<string, string> = {
      firstName: "First Name",
      lastName: "Last Name",
      admissionNo: "Admission No",
      srNo: "SR No",
      rollNumber: "Roll No",
      fatherName: "Father Name",
      motherName: "Mother Name",
      fatherPhone: "Father Phone",
      motherPhone: "Mother Phone",
      fatherOccupation: "Father Occupation",
      motherOccupation: "Mother Occupation",
      guardianName: "Guardian Name",
      guardianPhone: "Guardian Phone",
      guardianRelation: "Guardian Relation",
      gender: "Gender",
      dob: "Date of Birth",
      phone: "Phone",
      email: "Email",
      address: "Address",
      aadharNo: "Aadhar No",
      category: "Category",
      religion: "Religion",
      caste: "Caste",
      bloodGroup: "Blood Group",
      nationality: "Nationality",
      status: "Status",
      admissionDate: "Admission Date",
      parentPhone: "Parent Phone",
      className: "Class",
      sectionName: "Section",
      academicYearName: "Academic Year",
    };

    const allKeys = new Set<string>();
    studentList.forEach((student) => {
      Object.keys(student).forEach((key) => {
        if (!excludeKeys.includes(key)) allKeys.add(key);
      });
    });

    allKeys.add("rollNumber");
    allKeys.add("className");
    allKeys.add("sectionName");

    const columns = Array.from(allKeys).map((key) => ({
      key,
      label: labelMap[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    }));

    const priority = ["admissionNo", "srNo", "rollNumber", "firstName", "lastName", "fatherName", "motherName", "gender", "dob", "phone", "className", "sectionName", "address", "status"];
    columns.sort((a, b) => {
      const aIdx = priority.indexOf(a.key);
      const bIdx = priority.indexOf(b.key);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.label.localeCompare(b.label);
    });

    setAvailableColumns(columns);
    const validKeys = new Set(columns.map((c) => c.key));
    setSelectedColumns((prev) => {
      const filtered = prev.filter((k) => validKeys.has(k));
      return filtered.length === 0 ? DEFAULT_SELECTED.filter((k) => validKeys.has(k)) : filtered;
    });
  };

  // Toggle column
  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => setSelectedColumns(availableColumns.map((c) => c.key));
  const deselectAllColumns = () => setSelectedColumns([]);

  // Fetch students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 9999 };
      if (academicYearId) params.academicYearId = academicYearId;
      if (classId) params.classId = classId;
      if (sectionId) params.sectionId = sectionId;

      const res = await axios.get("/api/students", { params });
      const result = res.data?.data;
      const studentList = result?.students || [];
      setStudents(studentList);
      setShowPreview(true);
      buildColumnsFromData(studentList);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get cell value
  const getCellValue = (student: any, key: string) => {
    if (key === "rollNumber") return student.enrollments?.[0]?.rollNumber || "-";
    if (key === "className") return student.enrollments?.[0]?.class?.name || "-";
    if (key === "sectionName") return student.enrollments?.[0]?.section?.name || "-";
    if (key === "academicYearName") return student.enrollments?.[0]?.academicYear?.name || "-";
    if (key === "dob" || key === "admissionDate") {
      return student[key] ? new Date(student[key]).toLocaleDateString("en-IN") : "-";
    }
    return student[key] || "-";
  };

  // Helper functions
  const getClassName = () => classes.find((c) => c.id === classId)?.name || "All Classes";
  const getSectionName = () => sections.find((s) => s.id === sectionId)?.name || "All Sections";
  const getYearName = () => academicYears.find((y) => y.id === academicYearId)?.name || "";

  // PRINT
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const schoolName = tenant?.name || "School Name";
    const schoolLogo = tenant?.logoUrl || "";
    const schoolAddress = tenant?.address || "";
    const schoolPhone = tenant?.phone || "";
    const schoolEmail = tenant?.email || "";
    const className = getClassName();
    const sectionName = sectionId ? " - " + getSectionName() : "";
    const yearName = getYearName() ? " | " + getYearName() : "";
    const totalStudents = students.length;
    const printDate = new Date().toLocaleDateString("en-IN");
    const printTime = new Date().toLocaleTimeString("en-IN");

    // Build table HTML SEPARATELY — NO nested backticks
    let tableHeaderCells = '<th style="width:30px;text-align:center;border:1px solid #333;padding:5px 8px;background:#f0f0f0;font-weight:bold;">#</th>';
    selectedColumns.forEach((key) => {
      const label = availableColumns.find((c) => c.key === key)?.label || key;
      tableHeaderCells += '<th style="border:1px solid #333;padding:5px 8px;background:#f0f0f0;font-weight:bold;text-align:left;">' + label + '</th>';
    });

    let tableRows = "";
    students.forEach((student, idx) => {
      const bgColor = idx % 2 === 0 ? "#fff" : "#f9f9f9";
      let cells = '<td style="width:30px;text-align:center;border:1px solid #333;padding:5px 8px;">' + (idx + 1) + '</td>';
      selectedColumns.forEach((key) => {
        const val = getCellValue(student, key);
        cells += '<td style="border:1px solid #333;padding:5px 8px;text-align:left;">' + val + '</td>';
      });
      tableRows += '<tr style="background:' + bgColor + ';">' + cells + '</tr>';
    });

    const tableHTML = '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:5px;"><thead><tr>' + tableHeaderCells + '</tr></thead><tbody>' + tableRows + '</tbody></table>';

    // Build logo
    const logoHTML = schoolLogo ? '<img src="' + schoolLogo + '" alt="Logo" style="width:60px;height:60px;object-fit:contain;border-radius:4px;" />' : "";

    // Build contact line
    let contactLine = "";
    if (schoolPhone || schoolEmail) {
      contactLine = '<p style="font-size:10px;color:#777;margin:2px 0;">';
      if (schoolPhone) contactLine += "Ph: " + schoolPhone;
      if (schoolPhone && schoolEmail) contactLine += " | ";
      if (schoolEmail) contactLine += "Email: " + schoolEmail;
      contactLine += "</p>";
    }

    const htmlContent = [
  "<!DOCTYPE html><html><head>",
  "<title></title>",
  
  "</head><body>",

  '<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:15px;">',

  // LEFT LOGO
  '<div style="width:80px;">' + logoHTML + '</div>',

  // CENTER SCHOOL INFO
  '<div style="text-align:center;flex:1;">',
  '<h1 style="font-size:24px;margin:0;font-weight:bold;text-transform:uppercase;">' + schoolName + '</h1>',
  schoolAddress
    ? '<p style="font-size:11px;color:#555;margin:2px 0;">' + schoolAddress + '</p>'
    : '',
  contactLine,
  '</div>',

  // RIGHT PRINT INFO
  '<div style="text-align:right;font-size:10px;color:#555;line-height:1.8;">',
  '<div><strong>Print By:</strong> Admin</div>',
  '<div><strong>Date:</strong> ' + printDate + '</div>',
  '<div><strong>Time:</strong> ' + printTime + '</div>',
  '</div>',

  '</div>',

  // REPORT TITLE
  '<div style="text-align:center;padding:6px 0;border-bottom:1px solid #ccc;margin-bottom:10px;">',
  '<strong>Student List — ' + className + sectionName + yearName + '</strong>',
  '<span style="float:right;font-size:10px;color:#555;">Total: ' + totalStudents + ' students</span>',
  '</div>',

  tableHTML,

  // FOOTER
  '<div style="margin-top:15px;padding-top:10px;border-top:1px solid #ccc;font-size:9px;color:#777;text-align:right;">',
  'Generated by College ERP',
  '</div>',

  '<script>window.print(); window.close();<\/script>',
  '</body></html>',
].join("\n");

printWindow.document.write(htmlContent);
printWindow.document.close();
  };

  // EXPORT CSV
  const handleExcelExport = () => {
    const headers = selectedColumns.map(
      (key) => availableColumns.find((c) => c.key === key)?.label || key
    );

    const rows = students.map((student) =>
      selectedColumns.map((key) => {
        const val = getCellValue(student, key);
        if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
    );

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Student_List_${getClassName()}_${getYearName() || "All"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🖨️ Print Student List</h1>
          <p className="text-gray-500 text-sm mt-1">Select filters and columns, then print or export</p>
        </div>
        <button onClick={() => navigate("/students")} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">← Back</button>
      </div>

      {/* Filters + Column Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Filters */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">📋 Filters</h2>
          <div className="space-y-3">
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Academic Years</option>
              {academicYears.map((y) => (<option key={y.id} value={y.id}>{y.name}</option>))}
            </select>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Classes</option>
              {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Sections</option>
              {sections.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <button onClick={fetchStudents} disabled={loading} className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Loading..." : "🔍 Load Students"}
          </button>
        </div>

        {/* Column Selection */}
        <div className="bg-white p-5 rounded-xl shadow lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">📊 Select Columns to Print</h2>
            <div className="flex gap-2">
              <button onClick={selectAllColumns} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded" disabled={availableColumns.length === 0}>Select All</button>
              <button onClick={deselectAllColumns} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded" disabled={availableColumns.length === 0}>Clear All</button>
            </div>
          </div>
          {availableColumns.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>📋 Click "Load Students" to see available columns</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
              {availableColumns.map((col) => (
                <label key={col.key} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-sm ${selectedColumns.includes(col.key) ? "bg-indigo-50 border-indigo-300" : "bg-gray-50 border-gray-200"}`}>
                  <input type="checkbox" checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="w-4 h-4" />
                  {col.label}
                </label>
              ))}
            </div>
          )}
          {selectedColumns.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">{selectedColumns.length} columns selected</p>
          )}
        </div>
      </div>

      {/* Preview + Actions */}
      {showPreview && students.length > 0 && (
        <>
          <div className="flex gap-3 mb-4">
            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">🖨️ Print PDF</button>
            <button onClick={handleExcelExport} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">📊 Export Excel (CSV)</button>
            <span className="self-center text-sm text-gray-500">{students.length} students | {selectedColumns.length} columns</span>
          </div>

          <div className="bg-white rounded-xl shadow overflow-auto max-h-[600px]">
            {/* On-screen Header (NOT included in print — ref is on table only) */}
            <div className="flex items-start justify-between px-4 py-3 border-b-2 border-gray-800">
              {/* LEFT — Logo */}
              <div className="flex-shrink-0">
                {tenant?.logoUrl && <img src={tenant.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded" />}
              </div>
              {/* CENTER — Name + Address */}
              <div className="text-center flex-1 px-4">
                <h1 className="text-lg font-bold uppercase">{tenant?.name || "School Name"}</h1>
                {tenant?.address && <p className="text-[11px] text-gray-600">{tenant.address}</p>}
                {(tenant?.phone || tenant?.email) && (
                  <p className="text-[10px] text-gray-500">
                    {tenant?.phone ? `Ph: ${tenant.phone}` : ""}{tenant?.phone && tenant?.email ? " | " : ""}{tenant?.email ? `Email: ${tenant.email}` : ""}
                  </p>
                )}
              </div>
              {/* RIGHT — Print info */}
              <div className="text-right text-[10px] text-gray-600 leading-relaxed flex-shrink-0">
                <p><strong>Print By:</strong> Admin</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}</p>
                <p><strong>Time:</strong> {new Date().toLocaleTimeString("en-IN")}</p>
              </div>
            </div>
            {/* Title row */}
            <div className="text-center py-2 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                Student List — {getClassName()} {sectionId ? `- ${getSectionName()}` : ""} {getYearName() ? `| ${getYearName()}` : ""}
              </h2>
            </div>

            <div ref={printRef}>
            <table className="w-full text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 border text-left">#</th>
                  {selectedColumns.map((key) => (
                    <th key={key} className="p-2 border text-left">{availableColumns.find((c) => c.key === key)?.label || key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 border">{idx + 1}</td>
                    {selectedColumns.map((key) => (
                      <td key={key} className="p-2 border">{getCellValue(student, key)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {showPreview && students.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-lg font-medium">No students found</p>
          <p className="text-sm mt-1">Try different filters</p>
        </div>
      )}
    </div>
  );
};

export default PrintStudents;

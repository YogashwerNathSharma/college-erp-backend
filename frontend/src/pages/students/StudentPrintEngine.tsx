import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import {
  Printer,
  Download,
  FileSpreadsheet,
  Eye,
  User,
  Users,
  MapPin,
  Phone,
  CreditCard,
  Search,
  Filter,
  X,
  Check,
  Settings,
  FileText,
  QrCode,
  Image,
  LayoutGrid,
  List,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import PageHeader from "../../components/enterprise/PageHeader";
import LoadingSkeleton from "../../components/enterprise/LoadingSkeleton";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface DropdownItem {
  id: string;
  name: string;
}

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dob: string;
  email?: string;
  mobile?: string;
  phone?: string;
  classId?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  address?: string;
  permanentAddress?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentPinCode?: string;
  photo?: string;
  status?: string;
}

interface PrintConfig {
  type: PrintType;
  orientation: "portrait" | "landscape";
  paperSize: "a4" | "letter" | "legal";
  includePhoto: boolean;
  includeQR: boolean;
  showHeader: boolean;
}

type PrintType =
  | "profile"
  | "list"
  | "address"
  | "contact"
  | "parent"
  | "idcard";

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const PRINT_TYPES: { id: PrintType; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "profile", label: "Student Profile", icon: <User className="w-5 h-5" />, description: "Full profile with personal & academic details" },
  { id: "list", label: "Student List", icon: <List className="w-5 h-5" />, description: "Tabular list with selected columns" },
  { id: "address", label: "Address List", icon: <MapPin className="w-5 h-5" />, description: "Student addresses in print-ready format" },
  { id: "contact", label: "Contact List", icon: <Phone className="w-5 h-5" />, description: "Phone numbers and email contacts" },
  { id: "parent", label: "Parent Details", icon: <Users className="w-5 h-5" />, description: "Parent/Guardian information per student" },
  { id: "idcard", label: "ID Card", icon: <CreditCard className="w-5 h-5" />, description: "Navigate to ID card generator" },
];

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const inputClasses =
  "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm";
const sectionClasses =
  "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6";

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export default function StudentPrintEngine() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  // State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  // Print config
  const [config, setConfig] = useState<PrintConfig>({
    type: "list",
    orientation: "portrait",
    paperSize: "a4",
    includePhoto: true,
    includeQR: false,
    showHeader: true,
  });

  // Filters
  const [classes, setClasses] = useState<DropdownItem[]>([]);
  const [sections, setSections] = useState<DropdownItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Students
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Tenant info
  const [tenant] = useState<{ name?: string; logoUrl?: string; address?: string; phone?: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("tenant") || "null");
    } catch {
      return null;
    }
  });

  // ─── Fetch Classes ───
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(getFullUrl("/api/classes"), authHeaders());
        setClasses(res.data?.data || res.data || []);
      } catch {
        // silent
      }
    };
    fetchClasses();
  }, []);

  // ─── Fetch Sections on Class Change ───
  useEffect(() => {
    if (selectedClass) {
      axios
        .get(getFullUrl(`/api/sections?classId=${selectedClass}`), authHeaders())
        .then((res) => setSections(res.data?.data || res.data || []))
        .catch(() => setSections([]));
    } else {
      setSections([]);
    }
  }, [selectedClass]);

  // ─── Fetch Students ───
  const fetchStudents = useCallback(async () => {
    setFetchingStudents(true);
    try {
      const params: Record<string, string> = {};
      if (selectedClass) params.classId = selectedClass;
      if (selectedSection) params.sectionId = selectedSection;
      if (selectedStatus) params.status = selectedStatus;

      const res = await axios.get(getFullUrl("/api/students"), {
        ...authHeaders(),
        params,
      });
      const data = res.data?.data || res.data?.students || [];
      setStudents(data);
      setFilteredStudents(data);
      setSelectedStudents(data.map((s: Student) => s.id));
      setSelectAll(true);
    } catch (err) {
      toast.error("Failed to fetch students");
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setFetchingStudents(false);
    }
  }, [selectedClass, selectedSection, selectedStatus]);

  // ─── Search filter ───
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredStudents(
      students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.admissionNo?.toLowerCase().includes(q) ||
          s.fatherName?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, students]);

  // ─── Selection Handlers ───
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // ─── Get selected student data ───
  const getSelectedData = () =>
    students.filter((s) => selectedStudents.includes(s.id));

  // ─── Print ───
  const handlePrint = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocked. Please allow pop-ups.");
      return;
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
        @page { size: ${config.paperSize} ${config.orientation}; margin: 15mm; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 12px; }
        th { background: #f1f5f9; font-weight: 600; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #4f46e5; }
        .header h1 { font-size: 20px; color: #1e293b; }
        .header p { font-size: 12px; color: #64748b; margin-top: 4px; }
        .profile-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
        .profile-card h3 { font-size: 14px; color: #4f46e5; margin-bottom: 8px; }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
        .profile-grid .field { font-size: 12px; padding: 4px 0; }
        .profile-grid .label { color: #64748b; }
        .profile-grid .value { color: #1e293b; font-weight: 500; }
        .photo { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0; float: right; margin-left: 12px; }
        @media print { body { padding: 0; } }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Print - ${PRINT_TYPES.find((t) => t.id === config.type)?.label}</title>${styles}</head>
      <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // ─── Download PDF ───
  const handleDownloadPDF = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    const data = getSelectedData();
    const doc = new jsPDF({
      orientation: config.orientation === "landscape" ? "l" : "p",
      unit: "mm",
      format: config.paperSize,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 15;

    // Header
    if (config.showHeader && tenant?.name) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(tenant.name, pageWidth / 2, yPos, { align: "center" });
      yPos += 6;
      if (tenant.address) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(tenant.address, pageWidth / 2, yPos, { align: "center" });
        yPos += 4;
      }
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 8;
    }

    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      PRINT_TYPES.find((t) => t.id === config.type)?.label || "Student Report",
      15,
      yPos
    );
    yPos += 8;

    // Content based on type
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    if (config.type === "list" || config.type === "contact" || config.type === "address") {
      // Table header
      const cols =
        config.type === "list"
          ? ["#", "Adm No", "Name", "Class", "Gender", "DOB", "Status"]
          : config.type === "contact"
            ? ["#", "Name", "Mobile", "Email", "Father Phone", "Mother Phone"]
            : ["#", "Name", "Address", "City", "State", "PIN"];

      const colWidths =
        config.type === "list"
          ? [8, 20, 40, 20, 18, 25, 18]
          : config.type === "contact"
            ? [8, 35, 28, 40, 28, 28]
            : [8, 30, 55, 25, 25, 18];

      // Draw header row
      doc.setFillColor(241, 245, 249);
      doc.rect(15, yPos - 4, pageWidth - 30, 7, "F");
      doc.setFont("helvetica", "bold");
      let xPos = 15;
      cols.forEach((col, i) => {
        doc.text(col, xPos + 2, yPos);
        xPos += colWidths[i];
      });
      yPos += 6;
      doc.setFont("helvetica", "normal");

      // Draw rows
      data.forEach((student, idx) => {
        if (yPos > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 15;
        }

        xPos = 15;
        const row =
          config.type === "list"
            ? [
                String(idx + 1),
                student.admissionNo || "",
                `${student.firstName} ${student.lastName}`,
                student.className || "",
                student.gender || "",
                student.dob ? new Date(student.dob).toLocaleDateString() : "",
                student.status || "Active",
              ]
            : config.type === "contact"
              ? [
                  String(idx + 1),
                  `${student.firstName} ${student.lastName}`,
                  student.mobile || student.phone || "",
                  student.email || "",
                  student.fatherPhone || "",
                  student.motherPhone || "",
                ]
              : [
                  String(idx + 1),
                  `${student.firstName} ${student.lastName}`,
                  student.permanentAddress || student.address || "",
                  student.permanentCity || "",
                  student.permanentState || "",
                  student.permanentPinCode || "",
                ];

        row.forEach((cell, i) => {
          doc.text(cell.substring(0, Math.floor(colWidths[i] / 2)), xPos + 2, yPos);
          xPos += colWidths[i];
        });
        yPos += 5;
      });
    } else if (config.type === "profile" || config.type === "parent") {
      data.forEach((student, idx) => {
        if (idx > 0) {
          doc.addPage();
          yPos = 15;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${student.firstName} ${student.lastName}`, 15, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        const fields =
          config.type === "profile"
            ? [
                ["Admission No", student.admissionNo],
                ["Class", student.className || ""],
                ["Section", student.sectionName || ""],
                ["Gender", student.gender || ""],
                ["DOB", student.dob ? new Date(student.dob).toLocaleDateString() : ""],
                ["Mobile", student.mobile || student.phone || ""],
                ["Email", student.email || ""],
                ["Father", student.fatherName || ""],
                ["Address", student.permanentAddress || student.address || ""],
              ]
            : [
                ["Father's Name", student.fatherName || ""],
                ["Father's Phone", student.fatherPhone || ""],
                ["Mother's Name", student.motherName || ""],
                ["Mother's Phone", student.motherPhone || ""],
                ["Student Mobile", student.mobile || student.phone || ""],
                ["Email", student.email || ""],
              ];

        fields.forEach(([label, value]) => {
          if (yPos > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = 15;
          }
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(`${label}:`, 15, yPos);
          doc.setTextColor(30, 41, 59);
          doc.text(value || "—", 55, yPos);
          yPos += 5;
        });

        yPos += 5;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    doc.save(`students_${config.type}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  // ─── Export Excel ───
  const handleExportExcel = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    const data = getSelectedData();
    let csvContent = "";

    if (config.type === "list" || config.type === "profile") {
      csvContent =
        "Admission No,First Name,Last Name,Class,Section,Gender,DOB,Mobile,Email,Status\n";
      data.forEach((s) => {
        csvContent += `"${s.admissionNo || ""}","${s.firstName}","${s.lastName}","${s.className || ""}","${s.sectionName || ""}","${s.gender || ""}","${s.dob || ""}","${s.mobile || s.phone || ""}","${s.email || ""}","${s.status || "Active"}"\n`;
      });
    } else if (config.type === "contact") {
      csvContent = "Name,Student Mobile,Email,Father Phone,Mother Phone\n";
      data.forEach((s) => {
        csvContent += `"${s.firstName} ${s.lastName}","${s.mobile || s.phone || ""}","${s.email || ""}","${s.fatherPhone || ""}","${s.motherPhone || ""}"\n`;
      });
    } else if (config.type === "address") {
      csvContent = "Name,Address,City,State,PIN\n";
      data.forEach((s) => {
        csvContent += `"${s.firstName} ${s.lastName}","${s.permanentAddress || s.address || ""}","${s.permanentCity || ""}","${s.permanentState || ""}","${s.permanentPinCode || ""}"\n`;
      });
    } else if (config.type === "parent") {
      csvContent =
        "Student Name,Father Name,Father Phone,Mother Name,Mother Phone\n";
      data.forEach((s) => {
        csvContent += `"${s.firstName} ${s.lastName}","${s.fatherName || ""}","${s.fatherPhone || ""}","${s.motherName || ""}","${s.motherPhone || ""}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students_${config.type}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Excel/CSV exported successfully");
  };

  // ═══════════════════════════════════════════════════════
  // RENDER: Step 1 - Print Type Selection
  // ═══════════════════════════════════════════════════════

  const renderStep1 = () => (
    <div className={sectionClasses}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        Select Print Type
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Choose what type of document you want to generate
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRINT_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => {
              if (type.id === "idcard") {
                navigate("/students/id-card");
                return;
              }
              setConfig((prev) => ({ ...prev, type: type.id }));
              setStep(2);
            }}
            className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md group ${
              config.type === type.id
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                config.type === type.id
                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500"
              }`}
            >
              {type.icon}
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {type.label}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {type.description}
            </p>
            {type.id === "idcard" && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                Opens ID Card page <ChevronRight className="w-3 h-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // RENDER: Step 2 - Filters & Student Selection
  // ═══════════════════════════════════════════════════════

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className={sectionClasses}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-500" />
          Filter Students
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection("");
              }}
              className={inputClasses}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className={inputClasses}
              disabled={!selectedClass}
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={inputClasses}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
              <option value="">All</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchStudents}
              disabled={fetchingStudents}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
            >
              {fetchingStudents ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Fetch Students
            </button>
          </div>
        </div>

        {/* Search within results */}
        {students.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, admission no, father's name..."
              className={`${inputClasses} pl-10`}
            />
          </div>
        )}
      </div>

      {/* Student Selection List */}
      {students.length > 0 && (
        <div className={sectionClasses}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Select Students ({selectedStudents.length} of {filteredStudents.length} selected)
            </h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Select All
              </span>
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-slate-100 dark:border-slate-700 p-2">
            {filteredStudents.map((student) => (
              <label
                key={student.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  selectedStudents.includes(student.id)
                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                {config.includePhoto && student.photo && (
                  <img
                    src={getFullUrl(student.photo)}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {student.admissionNo} • {student.className || "—"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    student.status === "active" || !student.status
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {student.status || "Active"}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {students.length === 0 && !fetchingStudents && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Select filters and click "Fetch Students" to load data</p>
        </div>
      )}

      {fetchingStudents && <LoadingSkeleton variant="list" />}
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // RENDER: Step 3 - Template Options
  // ═══════════════════════════════════════════════════════

  const renderStep3 = () => (
    <div className={sectionClasses}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-indigo-500" />
        Template Options
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orientation */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Orientation
          </label>
          <div className="flex gap-3">
            {(["portrait", "landscape"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setConfig((p) => ({ ...p, orientation: o }))}
                className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                  config.orientation === o
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300"
                }`}
              >
                <div
                  className={`mx-auto mb-2 border-2 rounded ${
                    o === "portrait" ? "w-6 h-8" : "w-8 h-6"
                  } ${
                    config.orientation === o
                      ? "border-indigo-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                />
                <span className="text-xs font-medium capitalize">{o}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Paper Size */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Paper Size
          </label>
          <div className="flex gap-3">
            {(["a4", "letter", "legal"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setConfig((p) => ({ ...p, paperSize: size }))}
                className={`flex-1 p-3 rounded-xl border-2 text-center text-xs font-medium capitalize transition-all ${
                  config.paperSize === size
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300"
                }`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Include Photo */}
        <div>
          <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <input
              type="checkbox"
              checked={config.includePhoto}
              onChange={(e) =>
                setConfig((p) => ({ ...p, includePhoto: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <Image className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Include Student Photo
            </span>
          </label>
        </div>

        {/* Include QR */}
        <div>
          <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <input
              type="checkbox"
              checked={config.includeQR}
              onChange={(e) =>
                setConfig((p) => ({ ...p, includeQR: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <QrCode className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Include QR Code
            </span>
          </label>
        </div>

        {/* Show Header */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <input
              type="checkbox"
              checked={config.showHeader}
              onChange={(e) =>
                setConfig((p) => ({ ...p, showHeader: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <FileText className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Show School Header
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Includes school name, logo, and address at the top
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // RENDER: Step 4 - Preview
  // ═══════════════════════════════════════════════════════

  const renderPreviewContent = () => {
    const data = getSelectedData();
    if (data.length === 0) return <p className="text-center text-slate-400 py-8">No students selected</p>;

    return (
      <div>
        {/* Header */}
        {config.showHeader && (
          <div className="text-center mb-6 pb-4 border-b-2 border-indigo-600">
            {tenant?.logoUrl && (
              <img src={getFullUrl(tenant.logoUrl)} alt="Logo" className="h-12 mx-auto mb-2" />
            )}
            <h1 className="text-xl font-bold text-slate-900">{tenant?.name || "School Name"}</h1>
            {tenant?.address && (
              <p className="text-xs text-slate-500 mt-1">{tenant.address}</p>
            )}
          </div>
        )}

        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          {PRINT_TYPES.find((t) => t.id === config.type)?.label} ({data.length} students)
        </h2>

        {/* List / Contact / Address Table */}
        {(config.type === "list" || config.type === "contact" || config.type === "address") && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {config.type === "list" && (
                    <>
                      <th className="border border-slate-200 p-2 text-left">#</th>
                      <th className="border border-slate-200 p-2 text-left">Adm No</th>
                      <th className="border border-slate-200 p-2 text-left">Name</th>
                      <th className="border border-slate-200 p-2 text-left">Class</th>
                      <th className="border border-slate-200 p-2 text-left">Gender</th>
                      <th className="border border-slate-200 p-2 text-left">DOB</th>
                      <th className="border border-slate-200 p-2 text-left">Status</th>
                    </>
                  )}
                  {config.type === "contact" && (
                    <>
                      <th className="border border-slate-200 p-2 text-left">#</th>
                      <th className="border border-slate-200 p-2 text-left">Name</th>
                      <th className="border border-slate-200 p-2 text-left">Mobile</th>
                      <th className="border border-slate-200 p-2 text-left">Email</th>
                      <th className="border border-slate-200 p-2 text-left">Father Phone</th>
                      <th className="border border-slate-200 p-2 text-left">Mother Phone</th>
                    </>
                  )}
                  {config.type === "address" && (
                    <>
                      <th className="border border-slate-200 p-2 text-left">#</th>
                      <th className="border border-slate-200 p-2 text-left">Name</th>
                      <th className="border border-slate-200 p-2 text-left">Address</th>
                      <th className="border border-slate-200 p-2 text-left">City</th>
                      <th className="border border-slate-200 p-2 text-left">State</th>
                      <th className="border border-slate-200 p-2 text-left">PIN</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    {config.type === "list" && (
                      <>
                        <td className="border border-slate-200 p-2">{idx + 1}</td>
                        <td className="border border-slate-200 p-2">{s.admissionNo}</td>
                        <td className="border border-slate-200 p-2">{s.firstName} {s.lastName}</td>
                        <td className="border border-slate-200 p-2">{s.className || "—"}</td>
                        <td className="border border-slate-200 p-2">{s.gender || "—"}</td>
                        <td className="border border-slate-200 p-2">{s.dob ? new Date(s.dob).toLocaleDateString() : "—"}</td>
                        <td className="border border-slate-200 p-2">{s.status || "Active"}</td>
                      </>
                    )}
                    {config.type === "contact" && (
                      <>
                        <td className="border border-slate-200 p-2">{idx + 1}</td>
                        <td className="border border-slate-200 p-2">{s.firstName} {s.lastName}</td>
                        <td className="border border-slate-200 p-2">{s.mobile || s.phone || "—"}</td>
                        <td className="border border-slate-200 p-2">{s.email || "—"}</td>
                        <td className="border border-slate-200 p-2">{s.fatherPhone || "—"}</td>
                        <td className="border border-slate-200 p-2">{s.motherPhone || "—"}</td>
                      </>
                    )}
                    {config.type === "address" && (
                      <>
                        <td className="border border-slate-200 p-2">{idx + 1}</td>
                        <td className="border border-slate-200 p-2">{s.firstName} {s.lastName}</td>
                        <td className="border border-slate-200 p-2">{s.permanentAddress || s.address || "—"}</td>
                        <td className="border border-slate-200 p-2">{s.permanentCity || "—"}</td>
                        <td className="border border-slate-200 p-2">{s.permanentState || "—"}</td>
                        <td className="border border-slate-200 p-2">{s.permanentPinCode || "—"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Profile */}
        {config.type === "profile" && (
          <div className="space-y-4">
            {data.map((s) => (
              <div key={s.id} className="border border-slate-200 rounded-lg p-4 page-break-inside-avoid">
                <div className="flex items-start gap-4">
                  {config.includePhoto && s.photo && (
                    <img
                      src={getFullUrl(s.photo)}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-indigo-700">
                      {s.firstName} {s.middleName || ""} {s.lastName}
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                      <div><span className="text-slate-500">Adm No:</span> <span className="font-medium">{s.admissionNo}</span></div>
                      <div><span className="text-slate-500">Class:</span> <span className="font-medium">{s.className || "—"}</span></div>
                      <div><span className="text-slate-500">Gender:</span> <span className="font-medium">{s.gender || "—"}</span></div>
                      <div><span className="text-slate-500">DOB:</span> <span className="font-medium">{s.dob ? new Date(s.dob).toLocaleDateString() : "—"}</span></div>
                      <div><span className="text-slate-500">Mobile:</span> <span className="font-medium">{s.mobile || s.phone || "—"}</span></div>
                      <div><span className="text-slate-500">Email:</span> <span className="font-medium">{s.email || "—"}</span></div>
                      <div><span className="text-slate-500">Father:</span> <span className="font-medium">{s.fatherName || "—"}</span></div>
                      <div><span className="text-slate-500">Address:</span> <span className="font-medium">{s.permanentAddress || s.address || "—"}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Parent Details */}
        {config.type === "parent" && (
          <div className="space-y-3">
            {data.map((s) => (
              <div key={s.id} className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-indigo-700 mb-2">
                  {s.firstName} {s.lastName} ({s.admissionNo})
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-slate-500">Father:</span> <span className="font-medium">{s.fatherName || "—"}</span></div>
                  <div><span className="text-slate-500">Father Phone:</span> <span className="font-medium">{s.fatherPhone || "—"}</span></div>
                  <div><span className="text-slate-500">Mother:</span> <span className="font-medium">{s.motherName || "—"}</span></div>
                  <div><span className="text-slate-500">Mother Phone:</span> <span className="font-medium">{s.motherPhone || "—"}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-[10px] text-slate-400 text-center mt-6 pt-3 border-t border-slate-200">
          Generated on {new Date().toLocaleDateString()} | {data.length} student(s)
        </p>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Preview */}
      <div className={sectionClasses}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-500" />
            Preview
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {config.orientation} • {config.paperSize.toUpperCase()}
          </span>
        </div>

        <div
          ref={printRef}
          className={`bg-white border border-slate-200 rounded-lg p-6 mx-auto shadow-inner overflow-auto max-h-[600px] ${
            config.orientation === "landscape" ? "max-w-4xl" : "max-w-2xl"
          }`}
          style={{ color: "#1e293b" }}
        >
          {renderPreviewContent()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          type="button"
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Excel
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Print Engine"
        subtitle="Generate, preview, and print student reports"
        icon={<Printer className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Print Engine" },
        ]}
      />

      {/* ─── Step Tabs ─── */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {[
          { id: 1, label: "Type", icon: LayoutGrid },
          { id: 2, label: "Filter", icon: Filter },
          { id: 3, label: "Options", icon: Settings },
          { id: 4, label: "Preview", icon: Eye },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isAccessible = s.id <= step || (s.id === 2 && config.type) || students.length > 0;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (isAccessible || s.id <= step) setStep(s.id as 1 | 2 | 3 | 4);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Step Content ─── */}
      <div>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* ─── Navigation ─── */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => setStep((p) => Math.max(1, p - 1) as 1 | 2 | 3 | 4)}
          disabled={step === 1}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            step === 1
              ? "opacity-40 cursor-not-allowed text-slate-400"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
          }`}
        >
          Back
        </button>

        {step < 4 && (
          <button
            type="button"
            onClick={() => {
              if (step === 2 && selectedStudents.length === 0) {
                toast.error("Please fetch and select at least one student");
                return;
              }
              setStep((p) => Math.min(4, p + 1) as 1 | 2 | 3 | 4);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}


import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getPrintSignatureHTML } from "../../components/PrintSignature";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
  startDate?: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  admissionNo: string;
  srNo?: string;
  phone?: string;
  email?: string;
  address?: string;
  fatherName: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  category?: string;
  status: string;
  admissionDate?: string;
  enrollments: {
    class: { id: string; name: string };
    section: { id: string; name: string };
    academicYear?: { id: string; name: string };
    rollNumber?: string;
  }[];
}

interface ReportType {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface TenantInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

// ═══════════════════════════════════════════════════════
// REPORT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════

const REPORT_TYPES: ReportType[] = [
  { id: "class-wise", icon: "📋", title: "Class-wise Student List", description: "Complete student list by class & section" },
  { id: "gender-wise", icon: "👫", title: "Gender-wise Report", description: "Boys & Girls count per class" },
  { id: "category-wise", icon: "📊", title: "Category-wise Report", description: "General/OBC/SC/ST/EWS distribution" },
  { id: "birthday", icon: "🎂", title: "Birthday List", description: "Month-wise student birthdays" },
  { id: "admission-register", icon: "📝", title: "Admission Register", description: "Date-wise admission log" },
  { id: "tc-left", icon: "🚪", title: "TC / Left Students", description: "Students who left or TC issued" },
  { id: "strength-summary", icon: "📈", title: "Student Strength Summary", description: "Class × Section matrix" },
  { id: "occupation", icon: "👨‍💼", title: "Father's Occupation", description: "Occupation-wise summary" },
  { id: "age-wise", icon: "📅", title: "Age-wise Report", description: "Students grouped by age range" },
  { id: "new-admissions", icon: "🆕", title: "New Admissions", description: "This month / custom range" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ═══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

const getLogoUrl = (path: string | undefined | null): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${path}`;
  return `/uploads/${path}`;
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const calculateAge = (dob: string, referenceDate?: Date): number => {
  const birthDate = new Date(dob);
  const ref = referenceDate || new Date();
  let age = ref.getFullYear() - birthDate.getFullYear();
  const m = ref.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function StudentReportsPage() {
  const navigate = useNavigate();

  // Data state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);

  // Filter state
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Tenant & User
  const tenant: TenantInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("tenant") || "{}"); } catch { return {}; }
  }, []);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  // ─── Fetch dropdowns ──────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearRes, classRes] = await Promise.all([
          axios.get("/api/academic"),
          axios.get("/api/class"),
        ]);
        const years = yearRes.data?.data || [];
        const cls = classRes.data?.data || [];
        setAcademicYears(years);
        setClasses(cls);
        // Auto-select current academic year
        const current = years.find((y: any) => y.isCurrent) || years[0];
        if (current) setAcademicYearId(current.id);
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    if (!classId) { setSections([]); return; }
    axios.get(`/api/section?classId=${classId}`)
      .then((res) => setSections(res.data?.data || []))
      .catch(() => setSections([]));
  }, [classId]);

  // ─── Generate Report ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setGenerated(false);

    try {
      const params: any = { limit: 9999 };
      if (academicYearId) params.academicYearId = academicYearId;

      // For specific reports, filter by class/section
      if (["class-wise", "birthday", "admission-register", "new-admissions"].includes(selectedReport)) {
        if (classId) params.classId = classId;
        if (sectionId) params.sectionId = sectionId;
      }

      // For TC/Left report, fetch inactive/left students
      if (selectedReport === "tc-left") {
        params.status = "all";
      }

      const res = await axios.get("/api/students", { params });
      const result = res.data?.data;
      let studentList = result?.students || [];

      // For TC/Left, filter only left/tc_issued status
      if (selectedReport === "tc-left") {
        studentList = studentList.filter((s: StudentData) =>
          s.status === "left" || s.status === "tc_issued" || s.status === "inactive"
        );
      }

      setStudents(studentList);
      setGenerated(true);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Report Data Processing ──────────────────────────────
  const reportData = useMemo(() => {
    if (!generated || students.length === 0) return null;

    switch (selectedReport) {
      case "class-wise": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          fatherName: s.fatherName,
          gender: s.gender,
          dob: formatDate(s.dob),
          phone: s.fatherPhone || s.phone || "-",
          address: s.address || "-",
        }));
      }

      case "gender-wise": {
        const classMap: Record<string, { boys: number; girls: number }> = {};
        for (const s of students) {
          const cls = s.enrollments?.[0]?.class?.name || "Unassigned";
          if (!classMap[cls]) classMap[cls] = { boys: 0, girls: 0 };
          if (s.gender === "Male") classMap[cls].boys++;
          else classMap[cls].girls++;
        }
        return Object.entries(classMap).map(([cls, data]) => ({
          class: cls,
          boys: data.boys,
          girls: data.girls,
          total: data.boys + data.girls,
        })).sort((a, b) => {
          const numA = parseInt(a.class.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.class.replace(/\D/g, "")) || 0;
          return numA - numB;
        });
      }

      case "category-wise": {
        const classMap: Record<string, Record<string, number>> = {};
        for (const s of students) {
          const cls = s.enrollments?.[0]?.class?.name || "Unassigned";
          const cat = s.category || "General";
          if (!classMap[cls]) classMap[cls] = { General: 0, OBC: 0, SC: 0, ST: 0, EWS: 0 };
          classMap[cls][cat] = (classMap[cls][cat] || 0) + 1;
        }
        return Object.entries(classMap).map(([cls, cats]) => ({
          class: cls,
          General: cats.General || 0,
          OBC: cats.OBC || 0,
          SC: cats.SC || 0,
          ST: cats.ST || 0,
          EWS: cats.EWS || 0,
          total: Object.values(cats).reduce((a, b) => a + b, 0),
        })).sort((a, b) => {
          const numA = parseInt(a.class.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.class.replace(/\D/g, "")) || 0;
          return numA - numB;
        });
      }

      case "birthday": {
        return students
          .filter((s) => {
            if (!s.dob) return false;
            const month = new Date(s.dob).getMonth();
            return month === selectedMonth;
          })
          .map((s, i) => ({
            sno: i + 1,
            name: `${s.firstName} ${s.lastName}`,
            dob: formatDate(s.dob),
            class: s.enrollments?.[0]?.class?.name || "-",
            fatherName: s.fatherName,
            phone: s.fatherPhone || s.phone || "-",
          }))
          .sort((a, b) => {
            const dayA = parseInt(a.dob.split("/")[0]) || 0;
            const dayB = parseInt(b.dob.split("/")[0]) || 0;
            return dayA - dayB;
          });
      }

      case "admission-register": {
        let filtered = students;
        if (dateFrom) {
          filtered = filtered.filter((s) => s.admissionDate && new Date(s.admissionDate) >= new Date(dateFrom));
        }
        if (dateTo) {
          filtered = filtered.filter((s) => s.admissionDate && new Date(s.admissionDate) <= new Date(dateTo));
        }
        return filtered
          .sort((a, b) => new Date(b.admissionDate || "").getTime() - new Date(a.admissionDate || "").getTime())
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            fatherName: s.fatherName,
            dob: formatDate(s.dob),
            class: s.enrollments?.[0]?.class?.name || "-",
            admissionDate: formatDate(s.admissionDate),
          }));
      }

      case "tc-left": {
        return students.map((s, i) => ({
          sno: i + 1,
          admNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          class: s.enrollments?.[0]?.class?.name || "-",
          fatherName: s.fatherName,
          status: s.status,
          date: "-",
        }));
      }

      case "strength-summary": {
        const matrix: Record<string, Record<string, number>> = {};
        const allSections = new Set<string>();
        for (const s of students) {
          const cls = s.enrollments?.[0]?.class?.name || "Unassigned";
          const sec = s.enrollments?.[0]?.section?.name || "N/A";
          allSections.add(sec);
          if (!matrix[cls]) matrix[cls] = {};
          matrix[cls][sec] = (matrix[cls][sec] || 0) + 1;
        }
        const sectionList = Array.from(allSections).sort();
        const rows = Object.entries(matrix)
          .sort((a, b) => {
            const numA = parseInt(a[0].replace(/\D/g, "")) || 0;
            const numB = parseInt(b[0].replace(/\D/g, "")) || 0;
            return numA - numB;
          })
          .map(([cls, secs]) => {
            const row: any = { class: cls };
            let total = 0;
            for (const sec of sectionList) {
              row[sec] = secs[sec] || 0;
              total += secs[sec] || 0;
            }
            row.total = total;
            return row;
          });
        return { rows, sections: sectionList };
      }

      case "occupation": {
        const occMap: Record<string, number> = {};
        for (const s of students) {
          const occ = s.fatherOccupation || "Not Specified";
          occMap[occ] = (occMap[occ] || 0) + 1;
        }
        const total = students.length;
        return Object.entries(occMap)
          .sort((a, b) => b[1] - a[1])
          .map(([occupation, count]) => ({
            occupation,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          }));
      }

      case "age-wise": {
        const ageMap: Record<string, { boys: number; girls: number }> = {};
        for (const s of students) {
          if (!s.dob) continue;
          const age = calculateAge(s.dob);
          const range = `${age}-${age + 1}`;
          if (!ageMap[range]) ageMap[range] = { boys: 0, girls: 0 };
          if (s.gender === "Male") ageMap[range].boys++;
          else ageMap[range].girls++;
        }
        return Object.entries(ageMap)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([range, data]) => ({
            ageRange: `${range} years`,
            boys: data.boys,
            girls: data.girls,
            total: data.boys + data.girls,
          }));
      }

      case "new-admissions": {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const filtered = students.filter((s) => {
          if (!s.admissionDate) return false;
          return new Date(s.admissionDate) >= monthStart;
        });
        return filtered
          .sort((a, b) => new Date(b.admissionDate || "").getTime() - new Date(a.admissionDate || "").getTime())
          .map((s, i) => ({
            sno: i + 1,
            admNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            fatherName: s.fatherName,
            class: s.enrollments?.[0]?.class?.name || "-",
            admissionDate: formatDate(s.admissionDate),
            phone: s.fatherPhone || s.phone || "-",
          }));
      }

      default:
        return null;
    }
  }, [students, generated, selectedReport, selectedMonth, dateFrom, dateTo]);

  // ─── Get Report Title ─────────────────────────────────────
  const getReportTitle = (): string => {
    const report = REPORT_TYPES.find((r) => r.id === selectedReport);
    return report?.title || "Student Report";
  };

  const getSubtitle = (): string => {
    const parts: string[] = [];
    const year = academicYears.find((y) => y.id === academicYearId);
    if (year) parts.push(`Year: ${year.name}`);
    const cls = classes.find((c) => c.id === classId);
    if (cls) parts.push(`Class: ${cls.name}`);
    const sec = sections.find((s) => s.id === sectionId);
    if (sec) parts.push(`Section: ${sec.name}`);
    if (selectedReport === "birthday") parts.push(`Month: ${MONTHS[selectedMonth]}`);
    return parts.join(" | ");
  };

  // ─── CSV Export ────────────────────────────────────────────
  const exportCSV = () => {
    if (!reportData) return;

    let csvContent = "";
    let rows: any[] = [];

    if (selectedReport === "strength-summary") {
      const data = reportData as { rows: any[]; sections: string[] };
      const headers = ["Class", ...data.sections, "Total"];
      csvContent += headers.join(",") + "\n";
      for (const row of data.rows) {
        const values = [row.class, ...data.sections.map((s) => row[s] || 0), row.total];
        csvContent += values.join(",") + "\n";
      }
    } else {
      rows = Array.isArray(reportData) ? reportData : [];
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      csvContent += headers.join(",") + "\n";
      for (const row of rows) {
        const values = headers.map((h) => {
          const val = String(row[h] || "").replace(/,/g, " ");
          return `"${val}"`;
        });
        csvContent += values.join(",") + "\n";
      }
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedReport}-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // ─── Print ─────────────────────────────────────────────────
  const handlePrint = async () => {
    if (!reportData) return;

    const signatureHTML = await getPrintSignatureHTML();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const schoolName = tenant?.name || "School Name";
    const schoolAddress = tenant?.address || "";
    const schoolPhone = tenant?.phone || "";
    const schoolEmail = tenant?.email || "";
    const logoUrl = getLogoUrl(tenant?.logoUrl);
    const printDate = new Date().toLocaleDateString("en-IN");
    const printTime = new Date().toLocaleTimeString("en-IN");
    const reportTitle = getReportTitle();
    const subtitle = getSubtitle();
    const userName = user?.name || "Admin";

    // Build table HTML
    let tableHTML = "";

    if (selectedReport === "strength-summary") {
      const data = reportData as { rows: any[]; sections: string[] };
      let headerCells = '<th style="border:1px solid #333;padding:6px 10px;background:#f0f0f0;font-weight:bold;">Class</th>';
      for (const sec of data.sections) {
        headerCells += `<th style="border:1px solid #333;padding:6px 10px;background:#f0f0f0;font-weight:bold;">${sec}</th>`;
      }
      headerCells += '<th style="border:1px solid #333;padding:6px 10px;background:#f0f0f0;font-weight:bold;">Total</th>';

      let bodyRows = "";
      let grandTotal = 0;
      const sectionTotals: Record<string, number> = {};
      for (const row of data.rows) {
        let cells = `<td style="border:1px solid #333;padding:5px 10px;font-weight:600;">${row.class}</td>`;
        for (const sec of data.sections) {
          const val = row[sec] || 0;
          sectionTotals[sec] = (sectionTotals[sec] || 0) + val;
          cells += `<td style="border:1px solid #333;padding:5px 10px;text-align:center;">${val}</td>`;
        }
        grandTotal += row.total;
        cells += `<td style="border:1px solid #333;padding:5px 10px;text-align:center;font-weight:bold;">${row.total}</td>`;
        bodyRows += `<tr>${cells}</tr>`;
      }
      // Total row
      let totalCells = '<td style="border:1px solid #333;padding:5px 10px;font-weight:bold;background:#f0f0f0;">TOTAL</td>';
      for (const sec of data.sections) {
        totalCells += `<td style="border:1px solid #333;padding:5px 10px;text-align:center;font-weight:bold;background:#f0f0f0;">${sectionTotals[sec] || 0}</td>`;
      }
      totalCells += `<td style="border:1px solid #333;padding:5px 10px;text-align:center;font-weight:bold;background:#f0f0f0;">${grandTotal}</td>`;
      bodyRows += `<tr>${totalCells}</tr>`;

      tableHTML = `<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    } else {
      const rows = Array.isArray(reportData) ? reportData : [];
      if (rows.length === 0) return;

      const headers = Object.keys(rows[0]);
      const labelMap: Record<string, string> = {
        sno: "S.No", admNo: "Adm No", name: "Name", fatherName: "Father Name",
        gender: "Gender", dob: "DOB", phone: "Phone", address: "Address",
        class: "Class", boys: "Boys", girls: "Girls", total: "Total",
        General: "General", OBC: "OBC", SC: "SC", ST: "ST", EWS: "EWS",
        admissionDate: "Adm Date", status: "Status", date: "Date",
        occupation: "Occupation", count: "Count", percentage: "%",
        ageRange: "Age Range",
      };

      let headerCells = "";
      for (const h of headers) {
        headerCells += `<th style="border:1px solid #333;padding:5px 8px;background:#f0f0f0;font-weight:bold;text-align:left;font-size:11px;">${labelMap[h] || h}</th>`;
      }

      let bodyRows = "";
      rows.forEach((row: any, idx: number) => {
        const bg = idx % 2 === 0 ? "#fff" : "#f9f9f9";
        let cells = "";
        for (const h of headers) {
          cells += `<td style="border:1px solid #333;padding:4px 8px;font-size:11px;">${row[h] ?? "-"}</td>`;
        }
        bodyRows += `<tr style="background:${bg};">${cells}</tr>`;
      });

      tableHTML = `<table style="width:100%;border-collapse:collapse;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    }

    const totalCount = selectedReport === "strength-summary"
      ? (reportData as any).rows?.length || 0
      : (Array.isArray(reportData) ? reportData.length : 0);

    const logoHTML = logoUrl ? `<img src="${logoUrl}" style="width:50px;height:50px;object-fit:contain;" />` : "";

    const html = `<!DOCTYPE html>
<html>
<head><title>${reportTitle}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  @media print { body { margin: 10px; } }
  @page { margin: 15mm; }
</style>
</head>
<body>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:5px;">
    <div style="width:60px;">${logoHTML}</div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:18px;font-weight:bold;line-height:1.2;">${schoolName}</div>
      ${schoolAddress ? `<div style="font-size:11px;color:#555;">${schoolAddress}</div>` : ""}
      ${schoolPhone || schoolEmail ? `<div style="font-size:10px;color:#777;">${schoolPhone ? "Ph: " + schoolPhone : ""}${schoolPhone && schoolEmail ? " | " : ""}${schoolEmail ? "Email: " + schoolEmail : ""}</div>` : ""}
    </div>
    <div style="width:120px;text-align:right;font-size:9px;color:#888;">
      <div>Date: ${printDate}</div>
      <div>Time: ${printTime}</div>
    </div>
  </div>
  <hr style="border:none;border-top:2px solid #333;margin:5px 0 10px;" />
  <div style="text-align:center;margin-bottom:5px;">
    <div style="font-size:15px;font-weight:bold;">${reportTitle}</div>
    ${subtitle ? `<div style="font-size:11px;color:#555;">${subtitle}</div>` : ""}
    <div style="font-size:10px;color:#888;">Total Records: ${totalCount}</div>
  </div>
  ${tableHTML}
  <div style="margin-top:30px;display:flex;justify-content:flex-end;">
    ${signatureHTML}
  </div>
  <div style="margin-top:20px;display:flex;justify-content:space-between;font-size:9px;color:#888;border-top:1px solid #ccc;padding-top:8px;">
    <span>Generated by: ${userName}</span>
    <span>Printed: ${printDate} ${printTime}</span>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ─── Render Table Based on Report Type ────────────────────
  const renderTable = () => {
    if (!generated) return null;
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-500">Loading...</span>
        </div>
      );
    }

    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
      return (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-lg font-medium">No data found</p>
          <p className="text-sm">Try changing filters or select a different report type</p>
        </div>
      );
    }

    // Strength Summary (special matrix layout)
    if (selectedReport === "strength-summary") {
      const data = reportData as { rows: any[]; sections: string[] };
      const sectionTotals: Record<string, number> = {};
      let grandTotal = 0;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                {data.sections.map((sec) => (
                  <th key={sec} className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{sec}</th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.rows.map((row, i) => {
                grandTotal += row.total;
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{row.class}</td>
                    {data.sections.map((sec) => {
                      const val = row[sec] || 0;
                      sectionTotals[sec] = (sectionTotals[sec] || 0) + val;
                      return <td key={sec} className="px-4 py-2 text-center">{val}</td>;
                    })}
                    <td className="px-4 py-2 text-center font-bold">{row.total}</td>
                  </tr>
                );
              })}
              <tr className="bg-primary-50 font-bold">
                <td className="px-4 py-2">TOTAL</td>
                {data.sections.map((sec) => (
                  <td key={sec} className="px-4 py-2 text-center">{sectionTotals[sec] || 0}</td>
                ))}
                <td className="px-4 py-2 text-center">{grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // All other reports (array-based)
    const rows = Array.isArray(reportData) ? reportData : [];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    const labelMap: Record<string, string> = {
      sno: "S.No", admNo: "Adm No", name: "Student Name", fatherName: "Father Name",
      gender: "Gender", dob: "DOB", phone: "Phone", address: "Address",
      class: "Class", boys: "Boys", girls: "Girls", total: "Total",
      General: "General", OBC: "OBC", SC: "SC", ST: "ST", EWS: "EWS",
      admissionDate: "Adm Date", status: "Status", date: "Date",
      occupation: "Occupation", count: "Count", percentage: "%",
      ageRange: "Age Range",
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              {headers.map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                  {labelMap[h] || h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2 whitespace-nowrap text-sm">
                    {h === "status" ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row[h] === "active" ? "bg-green-100 text-green-700" :
                        row[h] === "left" ? "bg-red-100 text-red-700" :
                        row[h] === "tc_issued" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {row[h]}
                      </span>
                    ) : h === "percentage" ? (
                      `${row[h]}%`
                    ) : (
                      row[h] ?? "-"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 border-t">
          Total Records: <strong>{rows.length}</strong>
          {selectedReport === "gender-wise" && (
            <span className="ml-4">
              Total Boys: <strong>{rows.reduce((a: number, r: any) => a + r.boys, 0)}</strong> |
              Total Girls: <strong>{rows.reduce((a: number, r: any) => a + r.girls, 0)}</strong>
            </span>
          )}
        </div>
      </div>
    );
  };

  // ─── RENDER ────────────────────────────────────────────────
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Student Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate & print various student reports</p>
        </div>
        <button
          onClick={() => navigate("/students")}
          className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
        >
          ← Back to Students
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Select Report Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {REPORT_TYPES.map((report) => (
            <button
              key={report.id}
              onClick={() => { setSelectedReport(report.id); setGenerated(false); }}
              className={`p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                selectedReport === report.id
                  ? "border-primary-500 bg-primary-50 shadow-md"
                  : "border-gray-100 hover:border-primary-200"
              }`}
            >
              <div className="text-2xl mb-1">{report.icon}</div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">{report.title}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{report.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Academic Year — always show */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Years</option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            {/* Class — show for most reports */}
            {!["occupation", "strength-summary"].includes(selectedReport) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                <select
                  value={classId}
                  onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section */}
            {!["gender-wise", "category-wise", "occupation", "age-wise", "strength-summary"].includes(selectedReport) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                  disabled={!classId}
                >
                  <option value="">All Sections</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Month — for birthday */}
            {selectedReport === "birthday" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range — for admission register */}
            {selectedReport === "admission-register" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Generate Button */}
          <div className="mt-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? "Generating..." : "📊 Generate Report"}
            </button>
          </div>
        </div>
      )}

      {/* Report Output */}
      {generated && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Report Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-800">{getReportTitle()}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{getSubtitle()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs font-medium border border-green-200"
              >
                📥 Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 text-xs font-medium border border-primary-200"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {/* Report Table */}
          {renderTable()}
        </div>
      )}
    </div>
  );
}


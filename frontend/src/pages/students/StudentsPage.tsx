import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import { toast } from "react-hot-toast";

import {

  Plus,

  Search,

  Filter,

  X,

  LayoutGrid,

  LayoutList,

  Download,

  FileText,

  FileSpreadsheet,

  Trash2,

  Send,

  ArrowUpCircle,

  Eye,

  Edit,

  Clock,

  Heart,

  CreditCard,

  MoreVertical,

  Users,

  ChevronLeft,

  ChevronRight,

  CheckSquare,

  Square,

  ChevronUp,

  ChevronDown,

  RefreshCw,

} from "lucide-react";

import {

  PageHeader,

  StatusBadge,

  ConfirmDialog,

  LoadingSkeleton,

  EmptyState,

} from "../../components/enterprise";

import { getFullUrl } from "../../utils/url";



// ═══════════════════════════════════════════════════════

// TYPES

// ═══════════════════════════════════════════════════════



interface Student {

  id: string;

  firstName: string;

  lastName: string;

  fullName: string;

  gender: string;

  dob: string;

  bloodGroup: string;

  admissionNo: string;

  srNo: string;

  rollNumber: string;

  phone: string;

  email: string;

  photoUrl: string | null;

  fatherName: string;

  motherName: string;

  fatherPhone: string;

  status: string;

  isDeleted: boolean;

  createdAt: string;

  _count: { documents: number };

  enrollments: {

    class: { id: string; name: string };

    section: { id: string; name: string };

  }[];

}



interface ClassItem {

  id: string;

  name: string;

}



interface SectionItem {

  id: string;

  name: string;

  class?: { name: string };

}



type ViewMode = "table" | "card";

type SortDir = "asc" | "desc";



// ═══════════════════════════════════════════════════════

// CONSTANTS

// ═══════════════════════════════════════════════════════



const STATUS_OPTIONS = [

  { value: "", label: "All Status" },

  { value: "active", label: "Active" },

  { value: "inactive", label: "Inactive" },

  { value: "transferred", label: "Transferred" },

  { value: "suspended", label: "Suspended" },

];



const GENDER_OPTIONS = [

  { value: "", label: "All Gender" },

  { value: "Male", label: "Male" },

  { value: "Female", label: "Female" },

];



const PAGE_SIZE_OPTIONS = [10, 25, 50];



const STATUS_VARIANT_MAP: Record<string, "success" | "neutral" | "info" | "danger" | "warning"> = {

  active: "success",

  inactive: "neutral",

  transferred: "info",

  suspended: "danger",

};



// ═══════════════════════════════════════════════════════

// HELPER: AUTH HEADERS

// ═══════════════════════════════════════════════════════



function authHeaders() {

  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

}



// ═══════════════════════════════════════════════════════

// HELPER: STUDENT AVATAR

// ═══════════════════════════════════════════════════════



function StudentAvatar({ student, size = "md" }: { student: Student; size?: "sm" | "md" | "lg" }) {

  const sizeMap = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };

  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();



  if (student.photoUrl) {

    return (

      <img

        src={getFullUrl(student.photoUrl)}

        alt={student.fullName || `${student.firstName} ${student.lastName}`}

        className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm`}

      />

    );

  }



  return (

    <div

      className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold text-white ring-2 ring-white dark:ring-slate-800 shadow-sm`}

    >

      {initials}

    </div>

  );

}



// ═══════════════════════════════════════════════════════

// HELPER: ACTION DROPDOWN

// ═══════════════════════════════════════════════════════



function RowActionsDropdown({

  student,

  onDelete,

}: {

  student: Student;

  onDelete: (id: string) => void;

}) {

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);



  useEffect(() => {

    function handleClickOutside(e: MouseEvent) {

      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);

    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);



  const actions = [

    { label: "View Profile", icon: <Eye className="w-4 h-4" />, action: () => navigate(`/students/${student.id}/profile`) },

    { label: "Edit", icon: <Edit className="w-4 h-4" />, action: () => navigate(`/students/edit/${student.id}`) },

    { label: "Timeline", icon: <Clock className="w-4 h-4" />, action: () => navigate(`/students/${student.id}/timeline`) },

    { label: "Medical", icon: <Heart className="w-4 h-4" />, action: () => navigate(`/students/${student.id}/medical`) },

    { label: "ID Card", icon: <CreditCard className="w-4 h-4" />, action: () => navigate(`/students/id-card?studentId=${student.id}`) },

    { label: "Delete", icon: <Trash2 className="w-4 h-4" />, action: () => onDelete(student.id), danger: true },

  ];



  return (

    <div ref={ref} className="relative">

      <button

        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}

        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"

      >

        <MoreVertical className="w-4 h-4" />

      </button>

      {open && (

        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">

          {actions.map((item, idx) => (

            <button

              key={idx}

              onClick={(e) => { e.stopPropagation(); item.action(); setOpen(false); }}

              className={`flex items-center gap-2.5 w-full px-4 py-2 text-sm transition-colors ${

                item.danger

                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"

                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"

              }`}

            >

              {item.icon}

              {item.label}

            </button>

          ))}

        </div>

      )}

    </div>

  );

}



// ═══════════════════════════════════════════════════════

// MAIN COMPONENT

// ═══════════════════════════════════════════════════════



export default function StudentsPage() {

  const navigate = useNavigate();



  // ─── Data State ───

  const [students, setStudents] = useState<Student[]>([]);

  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [sections, setSections] = useState<SectionItem[]>([]);

  const [loading, setLoading] = useState(true);



  // ─── Filter State ───

  const [search, setSearch] = useState("");

  const [classFilter, setClassFilter] = useState("");

  const [sectionFilter, setSectionFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [genderFilter, setGenderFilter] = useState("");



  // ─── View & Table State ───

  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [sortKey, setSortKey] = useState<string>("fullName");

  const [sortDir, setSortDir] = useState<SortDir>("asc");



  // ─── Selection State ───

  const [selectedIds, setSelectedIds] = useState<string[]>([]);



  // ─── Confirm Dialog State ───

  const [confirmDialog, setConfirmDialog] = useState<{

    open: boolean;

    title: string;

    message: string;

    variant: "danger" | "warning" | "info";

    onConfirm: () => void;

    loading?: boolean;

  }>({ open: false, title: "", message: "", variant: "danger", onConfirm: () => {} });



  // ═══════════════════════════════════════════════════════

  // DATA FETCHING

  // ═══════════════════════════════════════════════════════



  const fetchStudents = useCallback(async () => {

    try {

      setLoading(true);

      const res = await axios.get("/api/students", authHeaders());

      const payload = res.data?.data;

      const data = payload?.students || payload || res.data?.students || [];

      setStudents(Array.isArray(data) ? data : []);

    } catch (err: any) {

      toast.error(err.response?.data?.message || "Failed to load students");

      setStudents([]);

    } finally {

      setLoading(false);

    }

  }, []);



  const fetchClasses = useCallback(async () => {

    try {

      const res = await axios.get("/api/class", authHeaders());

      const raw = res.data?.data ?? res.data;

      const classList = Array.isArray(raw) ? raw : [];

      setClasses(classList);

    } catch (err) {

      console.error("[StudentsPage] fetchClasses failed:", err);

    }

  }, []);



  const fetchSections = useCallback(async () => {

    try {

      const url = classFilter ? `/api/section?classId=${classFilter}` : "/api/section";

      const res = await axios.get(url, authHeaders());

      setSections(res.data?.data || []);

    } catch {

      // silent - non-critical

    }

  }, [classFilter]);



  useEffect(() => {

    fetchStudents();

    fetchClasses();

  }, [fetchStudents, fetchClasses]);



  // Fetch sections (re-fetch when class filter changes)

  useEffect(() => {

    fetchSections();

  }, [classFilter, fetchSections]);



  // Fallback: extract classes from student enrollments if class API returned empty

  useEffect(() => {

    if (classes.length === 0 && students.length > 0) {

      const classMap = new Map<string, ClassItem>();

      students.forEach((s) => s.enrollments?.forEach((e) => {
        if (e.class?.id && e.class?.name) classMap.set(e.class.id, { id: e.class.id, name: e.class.name });
      }));

      if (classMap.size > 0) setClasses(Array.from(classMap.values()));

    }

  }, [students, classes.length]);


  // ═══════════════════════════════════════════════════════

  // FILTERING & SORTING

  // ═══════════════════════════════════════════════════════



  const filteredStudents = useMemo(() => {

    let result = [...students];



    // Search

    if (search) {

      const q = search.toLowerCase();

      result = result.filter(

        (s) =>

          (s.fullName || `${s.firstName} ${s.lastName}`).toLowerCase().includes(q) ||

          s.admissionNo?.toLowerCase().includes(q) ||

          s.fatherName?.toLowerCase().includes(q) ||

          s.phone?.toLowerCase().includes(q) ||

          s.fatherPhone?.toLowerCase().includes(q)

      );

    }



    // Class filter

    if (classFilter) {

      result = result.filter((s) =>

        s.enrollments?.some((e) => e.class?.id === classFilter || e.class?.name === classFilter)

      );

    }



    // Section filter

    if (sectionFilter) {

      result = result.filter((s) =>

        s.enrollments?.some((e) => e.section?.id === sectionFilter || e.section?.name === sectionFilter)

      );

    }



    // Status filter

    if (statusFilter) {

      result = result.filter((s) => s.status?.toLowerCase() === statusFilter.toLowerCase());

    }



    // Gender filter

    if (genderFilter) {

      result = result.filter((s) => s.gender?.toLowerCase() === genderFilter.toLowerCase());

    }



    return result;

  }, [students, search, classFilter, sectionFilter, statusFilter, genderFilter]);



  const sortedStudents = useMemo(() => {

    const sorted = [...filteredStudents].sort((a, b) => {

      let aVal: any = "";

      let bVal: any = "";



      switch (sortKey) {

        case "fullName":

          aVal = a.fullName || `${a.firstName} ${a.lastName}`;

          bVal = b.fullName || `${b.firstName} ${b.lastName}`;

          break;

        case "admissionNo":

          aVal = a.admissionNo || "";

          bVal = b.admissionNo || "";

          break;

        case "class":

          aVal = a.enrollments?.[0]?.class?.name || "";

          bVal = b.enrollments?.[0]?.class?.name || "";

          break;

        case "fatherName":

          aVal = a.fatherName || "";

          bVal = b.fatherName || "";

          break;

        case "gender":

          aVal = a.gender || "";

          bVal = b.gender || "";

          break;

        case "status":

          aVal = a.status || "";

          bVal = b.status || "";

          break;

        case "createdAt":

          aVal = a.createdAt || "";

          bVal = b.createdAt || "";

          break;

        default:

          aVal = (a as any)[sortKey] || "";

          bVal = (b as any)[sortKey] || "";

      }



      const cmp = String(aVal).localeCompare(String(bVal));

      return sortDir === "asc" ? cmp : -cmp;

    });



    return sorted;

  }, [filteredStudents, sortKey, sortDir]);



  // ═══════════════════════════════════════════════════════

  // PAGINATION

  // ═══════════════════════════════════════════════════════



  const totalPages = Math.ceil(sortedStudents.length / pageSize);

  const paginatedStudents = useMemo(

    () => sortedStudents.slice((page - 1) * pageSize, page * pageSize),

    [sortedStudents, page, pageSize]

  );



  // Reset page when filters change

  useEffect(() => {

    setPage(1);

  }, [search, classFilter, sectionFilter, statusFilter, genderFilter, pageSize]);



  // ═══════════════════════════════════════════════════════

  // SELECTION

  // ═══════════════════════════════════════════════════════



  const allPageSelected =

    paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedIds.includes(s.id));



  const toggleAll = () => {

    if (allPageSelected) {

      setSelectedIds((prev) => prev.filter((id) => !paginatedStudents.find((s) => s.id === id)));

    } else {

      const newIds = paginatedStudents.map((s) => s.id);

      setSelectedIds((prev) => [...new Set([...prev, ...newIds])]);

    }

  };



  const toggleRow = (id: string) => {

    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  };



  // ═══════════════════════════════════════════════════════

  // SORT HANDLER

  // ═══════════════════════════════════════════════════════



  const handleSort = (key: string) => {

    if (sortKey === key) {

      setSortDir((d) => (d === "asc" ? "desc" : "asc"));

    } else {

      setSortKey(key);

      setSortDir("asc");

    }

  };



  // ═══════════════════════════════════════════════════════

  // ACTIONS

  // ═══════════════════════════════════════════════════════



  const handleDeleteStudent = (id: string) => {

    setConfirmDialog({

      open: true,

      title: "Delete Student",

      message: "Are you sure you want to delete this student? This is a soft delete and can be reversed.",

      variant: "danger",

      onConfirm: async () => {

        try {

          setConfirmDialog((prev) => ({ ...prev, loading: true }));

          await axios.delete(`/api/students/${id}`, authHeaders());

          toast.success("Student deleted successfully");

          setStudents((prev) => prev.filter((s) => s.id !== id));

          setSelectedIds((prev) => prev.filter((x) => x !== id));

        } catch (err: any) {

          toast.error(err.response?.data?.message || "Failed to delete student");

        } finally {

          setConfirmDialog({ open: false, title: "", message: "", variant: "danger", onConfirm: () => {} });

        }

      },

    });

  };



  const handleBulkDelete = () => {

    setConfirmDialog({

      open: true,

      title: "Bulk Delete Students",

      message: `Are you sure you want to delete ${selectedIds.length} selected students? This action is a soft delete.`,

      variant: "danger",

      onConfirm: async () => {

        try {

          setConfirmDialog((prev) => ({ ...prev, loading: true }));

          await Promise.all(selectedIds.map((id) => axios.delete(`/api/students/${id}`, authHeaders())));

          toast.success(`${selectedIds.length} students deleted successfully`);

          setStudents((prev) => prev.filter((s) => !selectedIds.includes(s.id)));

          setSelectedIds([]);

        } catch (err: any) {

          toast.error(err.response?.data?.message || "Failed to delete some students");

        } finally {

          setConfirmDialog({ open: false, title: "", message: "", variant: "danger", onConfirm: () => {} });

        }

      },

    });

  };



  const handleBulkExport = () => {

    const selected = students.filter((s) => selectedIds.includes(s.id));

    exportCSV(selected);

    toast.success(`Exported ${selected.length} students`);

  };



  const handleBulkSMS = () => {

    toast.success(`SMS queued for ${selectedIds.length} students`);

  };



  const handleBulkPromote = () => {

    navigate(`/students/promotion?ids=${selectedIds.join(",")}`);

  };



  // ═══════════════════════════════════════════════════════

  // EXPORT

  // ═══════════════════════════════════════════════════════



  const exportCSV = (data?: Student[]) => {

    const exportData = data || sortedStudents;

    const headers = ["Name", "Admission No", "Class", "Section", "Father Name", "Phone", "Gender", "Status"];

    const rows = exportData.map((s) => [

      s.fullName || `${s.firstName} ${s.lastName}`,

      s.admissionNo,

      s.enrollments?.[0]?.class?.name || "",

      s.enrollments?.[0]?.section?.name || "",

      s.fatherName,

      s.phone || s.fatherPhone || "",

      s.gender,

      s.status,

    ]);



    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c || ""}"`).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;

    a.click();

    URL.revokeObjectURL(url);

    if (!data) toast.success("CSV exported successfully");

  };



  const exportExcel = () => {

    // Export as CSV with .xls extension for compatibility

    const exportData = sortedStudents;

    const headers = ["Name", "Admission No", "Class", "Section", "Father Name", "Phone", "Gender", "Status"];

    const rows = exportData.map((s) => [

      s.fullName || `${s.firstName} ${s.lastName}`,

      s.admissionNo,

      s.enrollments?.[0]?.class?.name || "",

      s.enrollments?.[0]?.section?.name || "",

      s.fatherName,

      s.phone || s.fatherPhone || "",

      s.gender,

      s.status,

    ]);



    const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");

    const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `students_export_${new Date().toISOString().split("T")[0]}.xls`;

    a.click();

    URL.revokeObjectURL(url);

    toast.success("Excel exported successfully");

  };



  const exportPDF = () => {

    // Open print dialog as PDF export fallback

    window.print();

    toast.success("PDF print dialog opened");

  };



  // ═══════════════════════════════════════════════════════

  // CLEAR FILTERS

  // ═══════════════════════════════════════════════════════



  const hasFilters = search || classFilter || sectionFilter || statusFilter || genderFilter;



  const clearFilters = () => {

    setSearch("");

    setClassFilter("");

    setSectionFilter("");

    setStatusFilter("");

    setGenderFilter("");

  };



  // ═══════════════════════════════════════════════════════

  // RENDER: LOADING

  // ═══════════════════════════════════════════════════════



  if (loading && students.length === 0) {

    return (

      <div className="p-6 space-y-6">

        <PageHeader

          title="Student Management"

          subtitle="Loading student records..."

          breadcrumbs={[

            { label: "Dashboard", path: "/" },

            { label: "Students" },

          ]}

          icon={<Users className="w-5 h-5" />}

        />

        <LoadingSkeleton variant="table" />

      </div>

    );

  }



  // ═══════════════════════════════════════════════════════

  // RENDER: TABLE COLUMNS

  // ═══════════════════════════════════════════════════════



  const sortableColumns = [

    { key: "fullName", label: "Student" },

    { key: "class", label: "Class / Section" },

    { key: "fatherName", label: "Father Name" },

    { key: "phone", label: "Contact" },

    { key: "gender", label: "Gender" },

    { key: "status", label: "Status" },

  ];



  // ═══════════════════════════════════════════════════════

  // RENDER

  // ═══════════════════════════════════════════════════════



  return (

    <div className="p-6 space-y-6 min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ─── PAGE HEADER ─── */}

      <PageHeader

        title="Student Management"

        subtitle={`${filteredStudents.length} student${filteredStudents.length !== 1 ? "s" : ""} found`}

        breadcrumbs={[

          { label: "Dashboard", path: "/" },

          { label: "Students" },

        ]}

        icon={<Users className="w-5 h-5" />}

        badge={{ label: `${students.length} Total`, color: "blue" }}

        actions={

          <button

            onClick={() => navigate("/students/admission")}

            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-colors"

          >

            <Plus className="w-4 h-4" />

            Add Student

          </button>

        }

      />



      {/* ─── FILTER BAR ─── */}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">

        <div className="flex flex-col lg:flex-row lg:items-center gap-3">

          {/* Search */}

          <div className="relative flex-1 min-w-[240px]">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input

              type="text"

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Search name, admission no, father name, phone..."

              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"

            />

            {search && (

              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">

                <X className="w-4 h-4" />

              </button>

            )}

          </div>



          {/* Class Filter */}

          <select

            value={classFilter}

            onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(""); }}

            className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[140px]"

          >

            <option value="">All Classes</option>

            {[...classes].sort((a, b) =>

              a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })

            ).map((c) => (

              <option key={c.id} value={c.id}>{c.name}</option>

            ))}

          </select>



          {/* Section Filter */}

          <select

            value={sectionFilter}

            onChange={(e) => setSectionFilter(e.target.value)}

            className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[140px]"

          >

            <option value="">All Sections</option>

            {(classFilter

              ? sections.map((s) => ({ key: s.id, value: s.id, label: s.name }))

              : sections

                  .filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i)

                  .map((s) => ({ key: s.name, value: s.name, label: s.name }))

            ).map((opt) => (

              <option key={opt.key} value={opt.value}>

                {opt.label}

              </option>

            ))}

          </select>



          {/* Status Filter */}

          <select

            value={statusFilter}

            onChange={(e) => setStatusFilter(e.target.value)}

            className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[130px]"

          >

            {STATUS_OPTIONS.map((opt) => (

              <option key={opt.value} value={opt.value}>{opt.label}</option>

            ))}

          </select>



          {/* Gender Filter */}

          <select

            value={genderFilter}

            onChange={(e) => setGenderFilter(e.target.value)}

            className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[120px]"

          >

            {GENDER_OPTIONS.map((opt) => (

              <option key={opt.value} value={opt.value}>{opt.label}</option>

            ))}

          </select>



          {/* Clear Filters */}

          {hasFilters && (

            <button

              onClick={clearFilters}

              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"

            >

              <X className="w-3.5 h-3.5" />

              Clear

            </button>

          )}



          {/* Divider */}

          <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-700" />



          {/* View Toggle */}

          <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">

            <button

              onClick={() => setViewMode("table")}

              className={`p-2.5 transition-colors ${

                viewMode === "table"

                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"

                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"

              }`}

              title="Table view"

            >

              <LayoutList className="w-4 h-4" />

            </button>

            <button

              onClick={() => setViewMode("card")}

              className={`p-2.5 transition-colors ${

                viewMode === "card"

                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"

                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"

              }`}

              title="Card view"

            >

              <LayoutGrid className="w-4 h-4" />

            </button>

          </div>



          {/* Refresh */}

          <button

            onClick={fetchStudents}

            className="p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"

            title="Refresh"

          >

            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />

          </button>



          {/* Export Menu */}

          <ExportDropdown onCSV={() => exportCSV()} onExcel={exportExcel} onPDF={exportPDF} />

        </div>

      </div>



      {/* ─── BULK ACTIONS BAR ─── */}

      {selectedIds.length > 0 && (

        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in slide-in-from-top-2 duration-200">

          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">

            {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""} selected

          </span>

          <div className="flex items-center gap-2 flex-wrap">

            <button

              onClick={handleBulkDelete}

              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 rounded-lg transition-colors"

            >

              <Trash2 className="w-3.5 h-3.5" /> Delete

            </button>

            <button

              onClick={handleBulkExport}

              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg transition-colors"

            >

              <Download className="w-3.5 h-3.5" /> Export

            </button>

            <button

              onClick={handleBulkSMS}

              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg transition-colors"

            >

              <Send className="w-3.5 h-3.5" /> SMS

            </button>

            <button

              onClick={handleBulkPromote}

              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg transition-colors"

            >

              <ArrowUpCircle className="w-3.5 h-3.5" /> Promote

            </button>

          </div>

          <button

            onClick={() => setSelectedIds([])}

            className="sm:ml-auto text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"

          >

            Clear selection

          </button>

        </div>

      )}



      {/* ─── CONTENT ─── */}

      {filteredStudents.length === 0 && !loading ? (

        <EmptyState

          icon={<Users className="w-8 h-8" />}

          title="No Students Found"

          description={hasFilters ? "Try adjusting your search or filters to find students." : "No students have been added yet. Click 'Add Student' to get started."}

          action={

            hasFilters ? (

              <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">

                Clear Filters

              </button>

            ) : (

              <button onClick={() => navigate("/students/admission")} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">

                Add First Student

              </button>

            )

          }

        />

      ) : viewMode === "table" ? (

        /* ─── TABLE VIEW ─── */

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">

                <tr>

                  {/* Checkbox */}

                  <th className="px-4 py-3 w-12">

                    <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">

                      {allPageSelected ? <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Square className="w-4 h-4" />}

                    </button>

                  </th>

                  {/* Photo */}

                  <th className="px-4 py-3 w-14"></th>

                  {/* Sortable Columns */}

                  {sortableColumns.map((col) => (

                    <th

                      key={col.key}

                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors"

                      onClick={() => handleSort(col.key)}

                    >

                      <div className="flex items-center gap-1">

                        {col.label}

                        {sortKey === col.key && (

                          sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />

                        )}

                      </div>

                    </th>

                  ))}

                  {/* Actions */}

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                    Actions

                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">

                {loading ? (

                  Array.from({ length: pageSize }).map((_, i) => (

                    <tr key={i} className="animate-pulse">

                      <td className="px-4 py-3"><div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>

                      <td className="px-4 py-3"><div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" /></td>

                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" /></td>

                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" /></td>

                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" /></td>

                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" /></td>

                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-14" /></td>

                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" /></td>

                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-8 ml-auto" /></td>

                    </tr>

                  ))

                ) : (

                  paginatedStudents.map((student) => (

                    <tr

                      key={student.id}

                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${

                        selectedIds.includes(student.id) ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""

                      }`}

                      onClick={() => navigate(`/students/${student.id}/profile`)}

                    >

                      {/* Checkbox */}

                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>

                        <button

                          onClick={() => toggleRow(student.id)}

                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"

                        >

                          {selectedIds.includes(student.id) ? (

                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />

                          ) : (

                            <Square className="w-4 h-4" />

                          )}

                        </button>

                      </td>

                      {/* Photo */}

                      <td className="px-4 py-3">

                        <StudentAvatar student={student} size="md" />

                      </td>

                      {/* Student Name + Admission No */}

                      <td className="px-4 py-3">

                        <div>

                          <p className="text-sm font-medium text-slate-900 dark:text-white">

                            {student.fullName || `${student.firstName} ${student.lastName}`}

                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">

                            {student.admissionNo}

                          </p>

                        </div>

                      </td>

                      {/* Class / Section */}

                      <td className="px-4 py-3">

                        {student.enrollments?.[0] ? (

                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">

                            {student.enrollments[0].class?.name} - {student.enrollments[0].section?.name}

                          </span>

                        ) : (

                          <span className="text-sm text-slate-400">—</span>

                        )}

                      </td>

                      {/* Father Name */}

                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">

                        {student.fatherName || "—"}

                      </td>

                      {/* Contact */}

                      <td className="px-4 py-3">

                        <div>

                          <p className="text-sm text-slate-700 dark:text-slate-300">{student.phone || student.fatherPhone || "—"}</p>

                          {student.email && (

                            <p className="text-xs text-slate-400 truncate max-w-[160px]">{student.email}</p>

                          )}

                        </div>

                      </td>

                      {/* Gender */}

                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">

                        {student.gender || "—"}

                      </td>

                      {/* Status */}

                      <td className="px-4 py-3">

                        <StatusBadge

                          label={student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || "Unknown"}

                          variant={STATUS_VARIANT_MAP[student.status?.toLowerCase()] || "neutral"}

                        />

                      </td>

                      {/* Actions */}

                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>

                        <RowActionsDropdown student={student} onDelete={handleDeleteStudent} />

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>



          {/* ─── PAGINATION FOOTER ─── */}

          {!loading && sortedStudents.length > 0 && (

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div className="flex items-center gap-3">

                <p className="text-sm text-slate-500 dark:text-slate-400">

                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedStudents.length)} of {sortedStudents.length}

                </p>

                <select

                  value={pageSize}

                  onChange={(e) => setPageSize(Number(e.target.value))}

                  className="px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"

                >

                  {PAGE_SIZE_OPTIONS.map((size) => (

                    <option key={size} value={size}>{size} / page</option>

                  ))}

                </select>

              </div>

              <div className="flex items-center gap-1">

                <button

                  onClick={() => setPage((p) => Math.max(1, p - 1))}

                  disabled={page === 1}

                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors"

                >

                  <ChevronLeft className="w-4 h-4" />

                </button>

                {generatePageNumbers(page, totalPages).map((pageNum, idx) =>

                  pageNum === -1 ? (

                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">…</span>

                  ) : (

                    <button

                      key={pageNum}

                      onClick={() => setPage(pageNum)}

                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${

                        page === pageNum

                          ? "bg-indigo-600 text-white shadow-sm"

                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"

                      }`}

                    >

                      {pageNum}

                    </button>

                  )

                )}

                <button

                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}

                  disabled={page === totalPages || totalPages === 0}

                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors"

                >

                  <ChevronRight className="w-4 h-4" />

                </button>

              </div>

            </div>

          )}

        </div>

      ) : (

        /* ─── CARD VIEW ─── */

        <div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {paginatedStudents.map((student) => (

              <div

                key={student.id}

                onClick={() => navigate(`/students/${student.id}/profile`)}

                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer group ${

                  selectedIds.includes(student.id) ? "ring-2 ring-indigo-500 border-indigo-300" : ""

                }`}

              >

                {/* Card Header */}

                <div className="flex items-start justify-between mb-4">

                  <div className="flex items-center gap-3">

                    <StudentAvatar student={student} size="lg" />

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">

                        {student.fullName || `${student.firstName} ${student.lastName}`}

                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">

                        {student.admissionNo}

                      </p>

                    </div>

                  </div>

                  <div onClick={(e) => e.stopPropagation()}>

                    <button

                      onClick={() => toggleRow(student.id)}

                      className="text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors"

                    >

                      {selectedIds.includes(student.id) ? (

                        <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />

                      ) : (

                        <Square className="w-5 h-5" />

                      )}

                    </button>

                  </div>

                </div>



                {/* Card Body */}

                <div className="space-y-2">

                  {student.enrollments?.[0] && (

                    <div className="flex items-center gap-2">

                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">

                        {student.enrollments[0].class?.name} - {student.enrollments[0].section?.name}

                      </span>

                    </div>

                  )}

                  {student.fatherName && (

                    <p className="text-xs text-slate-500 dark:text-slate-400">

                      Father: {student.fatherName}

                    </p>

                  )}

                  {(student.phone || student.fatherPhone) && (

                    <p className="text-xs text-slate-500 dark:text-slate-400">

                      📞 {student.phone || student.fatherPhone}

                    </p>

                  )}

                </div>



                {/* Card Footer */}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">

                  <StatusBadge

                    label={student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || "Unknown"}

                    variant={STATUS_VARIANT_MAP[student.status?.toLowerCase()] || "neutral"}

                    size="sm"

                  />

                  <span className="text-xs text-slate-400 dark:text-slate-500">{student.gender}</span>

                </div>

              </div>

            ))}

          </div>



          {/* Card View Pagination */}

          {sortedStudents.length > pageSize && (

            <div className="mt-6 flex items-center justify-center gap-2">

              <button

                onClick={() => setPage((p) => Math.max(1, p - 1))}

                disabled={page === 1}

                className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors"

              >

                Previous

              </button>

              <span className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">

                Page {page} of {totalPages}

              </span>

              <button

                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}

                disabled={page === totalPages}

                className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors"

              >

                Next

              </button>

            </div>

          )}

        </div>

      )}



      {/* ─── CONFIRM DIALOG ─── */}

      <ConfirmDialog

        open={confirmDialog.open}

        onClose={() => setConfirmDialog({ open: false, title: "", message: "", variant: "danger", onConfirm: () => {} })}

        onConfirm={confirmDialog.onConfirm}

        title={confirmDialog.title}

        message={confirmDialog.message}

        variant={confirmDialog.variant}

        loading={confirmDialog.loading}

        confirmLabel="Confirm"

      />

    </div>

  );

}



// ═══════════════════════════════════════════════════════

// HELPER: EXPORT DROPDOWN

// ═══════════════════════════════════════════════════════



function ExportDropdown({

  onCSV,

  onExcel,

  onPDF,

}: {

  onCSV: () => void;

  onExcel: () => void;

  onPDF: () => void;

}) {

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);



  useEffect(() => {

    function handleClick(e: MouseEvent) {

      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);

    }

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);

  }, []);



  return (

    <div ref={ref} className="relative">

      <button

        onClick={() => setOpen(!open)}

        className="flex items-center gap-1.5 px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"

      >

        <Download className="w-4 h-4" />

        Export

      </button>

      {open && (

        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5">

          <button

            onClick={() => { onCSV(); setOpen(false); }}

            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"

          >

            <FileText className="w-4 h-4 text-emerald-500" /> Export CSV

          </button>

          <button

            onClick={() => { onExcel(); setOpen(false); }}

            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"

          >

            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel

          </button>

          <button

            onClick={() => { onPDF(); setOpen(false); }}

            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"

          >

            <FileText className="w-4 h-4 text-red-500" /> Export PDF

          </button>

        </div>

      )}

    </div>

  );

}



// ═══════════════════════════════════════════════════════

// HELPER: PAGE NUMBER GENERATOR

// ═══════════════════════════════════════════════════════



function generatePageNumbers(current: number, total: number): number[] {

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);



  const pages: number[] = [];



  if (current <= 4) {

    pages.push(1, 2, 3, 4, 5, -1, total);

  } else if (current >= total - 3) {

    pages.push(1, -1, total - 4, total - 3, total - 2, total - 1, total);

  } else {

    pages.push(1, -1, current - 1, current, current + 1, -1, total);

  }



  return pages;

}


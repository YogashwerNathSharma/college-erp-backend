
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  GraduationCap,
  IndianRupee,
  ClipboardCheck,
  BookOpen,
  Bus,
  CheckCircle,
  FileText,
  Users,
  Printer,
  IdCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  PieChart,
  FileBarChart,
  Fuel,
  BookOpenCheck,
  Library,
  DollarSign,
  UserCheck,
  Building2,
  ScrollText,
  Star,
  ArrowUpDown,
  BarChart3,
  Layers,
  ListOrdered,
  UserX,
  FileCheck,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  MessageSquare,
  Banknote,
  CreditCard,
  Tag,
  Briefcase,
  Wrench,
  Route,
  BookMarked,
  AlertCircle,
  Search,
  TrendingDown,
  Activity,
  PenTool,
  Layout,
  Palette,
  FileSpreadsheet,
} from "lucide-react";

interface ReportItem {
  title: string;
  icon: any;
  path: string;
  comingSoon?: boolean;
}

interface ReportCategory {
  category: string;
  gradient: string;
  items: ReportItem[];
}

const reportData: ReportCategory[] = [
  {
    category: "Student Reports",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    items: [
      { title: "Student List", icon: GraduationCap, path: "/students" },
      { title: "Student Profile", icon: Users, path: "/student-profile" },
      { title: "Student Report", icon: FileBarChart, path: "/students/reports" },
      { title: "Promotion List", icon: ArrowUpDown, path: "/students/promotion" },
      { title: "TC Report and Other certificates", icon: ScrollText, path: "/certificates" },
      { title: "ID Card", icon: IdCard, path: "/students/id-card" },
    ],
  },
  {
    category: "Exam Reports",
    gradient: "linear-gradient(135deg, #a855f7, #7c3aed)",
    items: [
      { title: "Exam Wise Marks", icon: FileText, path: "/exam-reports?tab=marks" },
      { title: "Class Result", icon: FileBarChart, path: "/exam-reports?tab=result_summary" },
      { title: "Subject Wise", icon: BookOpen, path: "/exam-reports?tab=subject_wise" },
      { title: "Topper Report", icon: Star, path: "/exam-reports?tab=topper_list" },
      { title: "Pass/Fail Report", icon: CheckCircle, path: "/exam-reports?tab=pass_fail" },
      { title: "Grade Report", icon: FileCheck, path: "/exam-reports?tab=grade_report" },
      { title: "Attendance Report", icon: UserCheck, path: "/exam-reports?tab=attendance" },
      { title: "Rank List", icon: ListOrdered, path: "/exam-reports?tab=result_summary" },
      { title: "Consolidated Report Card", icon: Layers, path: "/exams/consolidated-report", comingSoon: true },
    ],
  },
  {
    category: "Report Cards & Templates",
    gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    items: [
      { title: "Half Yearly (With Grade)", icon: FileSpreadsheet, path: "/exams", comingSoon: true },
      { title: "Half Yearly (Without Grade)", icon: FileSpreadsheet, path: "/exams", comingSoon: true },
      { title: "Annual (With Grade)", icon: FileSpreadsheet, path: "/exams", comingSoon: true },
      { title: "Annual (Without Grade)", icon: FileSpreadsheet, path: "/exams", comingSoon: true },
      { title: "Consolidated (With Grade)", icon: Layers, path: "/exams", comingSoon: true },
      { title: "Consolidated (Without Grade)", icon: Layers, path: "/exams", comingSoon: true },
      { title: "CBSE Pattern", icon: FileCheck, path: "/exams", comingSoon: true },
      { title: "ICSE Pattern", icon: FileCheck, path: "/exams", comingSoon: true },
      { title: "State Board Pattern", icon: FileCheck, path: "/exams", comingSoon: true },
      { title: "Custom Template 1", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 2", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 3", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 4", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 5", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 6", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 7", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 8", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 9", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 10", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 11", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 12", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 13", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 14", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 15", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 16", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 17", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 18", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 19", icon: Layout, path: "/exams", comingSoon: true },
      { title: "Custom Template 20", icon: Layout, path: "/exams", comingSoon: true },
    ],
  },
  {
    category: "Attendance Reports",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    items: [
      { title: "Daily Attendance", icon: CalendarDays, path: "/attendance" },
      { title: "Monthly Attendance", icon: CalendarRange, path: "/attendance-report" },
      { title: "Yearly Attendance", icon: CalendarClock, path: "/attendance-report" },
      { title: "Student Attendance", icon: UserCheck, path: "/attendance-report" },
      { title: "Teacher Attendance", icon: Users, path: "/teacher-attendance" },
      { title: "Attendance Register", icon: ClipboardCheck, path: "/attendance-report" },
      { title: "Attendance Summary", icon: PieChart, path: "/attendance-report" },
      { title: "Late Coming", icon: Clock, path: "/attendance", comingSoon: true },
      { title: "SMS Report", icon: MessageSquare, path: "/attendance", comingSoon: true },
    ],
  },
  {
    category: "Fee Reports",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    items: [
      { title: "Collection Report", icon: IndianRupee, path: "/fees/reports" },
      { title: "Pending Fees", icon: AlertTriangle, path: "/fees/reminders" },
      { title: "Defaulter List", icon: UserX, path: "/fees/reminders" },
      { title: "Receipt Print", icon: Printer, path: "/fees/collection" },
      { title: "Fee Register", icon: FileText, path: "/fees/reports" },
      { title: "Daily Collection", icon: CalendarDays, path: "/fees/reports" },
      { title: "Cash Book", icon: Banknote, path: "/fees/reports", comingSoon: true },
      { title: "Online Collection", icon: CreditCard, path: "/fees/reports", comingSoon: true },
      { title: "Class Wise Collection", icon: Layers, path: "/fees/reports" },
      { title: "Discount Report", icon: Tag, path: "/fees/discounts" },
      { title: "Fine Report", icon: AlertCircle, path: "/fees/fine-rules" },
    ],
  },
  {
    category: "Teacher Reports",
    gradient: "linear-gradient(135deg, #ec4899, #db2777)",
    items: [
      { title: "Teacher List", icon: Users, path: "/teachers" },
      { title: "Teacher Profile", icon: Users, path: "/teachers", comingSoon: true },
      { title: "Salary Report", icon: DollarSign, path: "/teacher-salary" },
      { title: "Leave Report", icon: Clock, path: "/teacher-leave" },
      { title: "Performance", icon: TrendingUp, path: "/teacher-performance" },
      { title: "Experience", icon: Briefcase, path: "/teacher-reports" },
      { title: "Joining Report", icon: CalendarDays, path: "/teacher-reports" },
      { title: "ID Card", icon: IdCard, path: "/teacher-reports", comingSoon: true },
    ],
  },
  {
    category: "Transport Reports",
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    items: [
      { title: "Vehicle Report", icon: Bus, path: "/transport" },
      { title: "Route Report", icon: Route, path: "/transport" },
      { title: "Student Transport", icon: Users, path: "/transport" },
      { title: "Fee Collection", icon: IndianRupee, path: "/transport", comingSoon: true },
      { title: "Bus Attendance", icon: ClipboardCheck, path: "/transport", comingSoon: true },
      { title: "Driver Report", icon: UserCheck, path: "/transport", comingSoon: true },
      { title: "Maintenance Report", icon: Wrench, path: "/transport", comingSoon: true },
      { title: "Fuel Report", icon: Fuel, path: "/transport", comingSoon: true },
    ],
  },
  {
    category: "Library Reports",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    items: [
      { title: "Issue Register", icon: BookOpenCheck, path: "/library" },
      { title: "Return Register", icon: BookMarked, path: "/library" },
      { title: "Fine Report", icon: AlertCircle, path: "/library" },
      { title: "Overdue Books", icon: AlertTriangle, path: "/library" },
      { title: "Book Stock", icon: Library, path: "/library" },
      { title: "Lost Books", icon: Search, path: "/library" },
      { title: "Member Report", icon: Users, path: "/library" },
    ],
  },
  {
    category: "Analytics",
    gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
    items: [
      { title: "Admission Analysis", icon: TrendingUp, path: "/reports", comingSoon: true },
      { title: "Fee Analysis", icon: PieChart, path: "/reports", comingSoon: true },
      { title: "Attendance Analysis", icon: BarChart3, path: "/reports", comingSoon: true },
      { title: "Exam Analysis", icon: Activity, path: "/reports", comingSoon: true },
      { title: "Transport Analysis", icon: Bus, path: "/reports", comingSoon: true },
      { title: "Library Analysis", icon: BookOpen, path: "/reports", comingSoon: true },
      { title: "Income Analysis", icon: TrendingUp, path: "/reports", comingSoon: true },
      { title: "Expense Analysis", icon: TrendingDown, path: "/reports", comingSoon: true },
    ],
  },
  {
    category: "Designers & Tools",
    gradient: "linear-gradient(135deg, #475569, #334155)",
    items: [
      { title: "Certificate Designer", icon: PenTool, path: "/reports", comingSoon: true },
      { title: "Report Designer", icon: Palette, path: "/reports", comingSoon: true },
      { title: "Report Card Designer", icon: Layout, path: "/reports", comingSoon: true },
    ],
  },
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [loadingTenants, setLoadingTenants] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      setLoadingTenants(true);
      axios
        .get("/api/super-admin/tenants")
        .then((res) => {
          const list = res.data?.data || res.data || [];
          setTenants(Array.isArray(list) ? list : []);
        })
        .catch((err) => console.error("Failed to fetch tenants", err))
        .finally(() => setLoadingTenants(false));
    }
  }, [isSuperAdmin]);

  const handleNavigate = (item: ReportItem) => {
    if (item.comingSoon) {
      toast("Coming Soon!", {
        icon: "\ud83d\udea7",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }
    if (isSuperAdmin && selectedTenant) {
      localStorage.setItem("reportTenantId", selectedTenant);
    }
    navigate(item.path);
  };

  return (
    <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Reports Center</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isSuperAdmin
            ? "Select a tenant to view their reports"
            : "Access all reports from one place"}
        </p>
      </div>

      {/* Super Admin: Tenant Selector */}
      {isSuperAdmin && (
        <div className="mb-5 bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
            >
              <Building2 size={18} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              Select School:
            </span>
          </div>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="flex-1 max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Select Tenant --</option>
            {tenants.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.email ? `(${t.email})` : ""}
              </option>
            ))}
          </select>
          {loadingTenants && (
            <span className="text-xs text-gray-400">Loading...</span>
          )}
        </div>
      )}

      {/* Reports Grid */}
      {(!isSuperAdmin || selectedTenant) && (
        <div className="space-y-6">
          {reportData.map((category) => (
            <div key={category.category}>
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: category.gradient }}
                />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  {category.category}
                </h2>
                <span className="text-xs text-gray-400 ml-1">
                  ({category.items.length})
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {category.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`${item.title}-${idx}`}
                      onClick={() => handleNavigate(item)}
                      className={`relative bg-white border border-gray-200 rounded-xl px-4 py-4 cursor-pointer hover:shadow-lg hover:border-indigo-400 transition-all duration-200 group flex items-center gap-3 ${
                        item.comingSoon ? "opacity-70" : ""
                      }`}
                    >
                      <div
                        className="w-10 h-10 min-w-[40px] rounded-lg flex items-center justify-center shadow-sm"
                        style={{ background: category.gradient }}
                      >
                        <Icon size={20} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 leading-tight">
                        {item.title}
                      </span>
                      {item.comingSoon && (
                        <span className="absolute top-1.5 right-2 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                          Soon
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Super Admin: No tenant selected placeholder */}
      {isSuperAdmin && !selectedTenant && !loadingTenants && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Building2 size={48} className="mb-3 opacity-50" />
          <p className="text-sm">Select a school/tenant to view reports</p>
        </div>
      )}
    </div>
  );
}


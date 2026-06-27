
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
  Tag,
  Briefcase,
  Wrench,
  Route,
  BookMarked,
  AlertCircle,
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
      { title: "Consolidated Report Card", icon: Layers, path: "/exams" },
    ],
  },
  {
    category: "Attendance Reports",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    items: [
      { title: "Daily Attendance", icon: CalendarDays, path: "/attendance-report?tab=datewise" },
      { title: "Monthly Attendance", icon: CalendarRange, path: "/attendance-report?tab=monthly" },
      { title: "Yearly Attendance", icon: CalendarClock, path: "/attendance-report?tab=yearly" },
      { title: "Student Attendance", icon: UserCheck, path: "/attendance-report?tab=classwise" },
      { title: "Teacher Attendance", icon: Users, path: "/teacher-attendance" },
      { title: "Attendance Register", icon: ClipboardCheck, path: "/attendance-report?tab=classwise" },
      { title: "Attendance Summary", icon: PieChart, path: "/attendance-report?tab=school" },
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
      { title: "Teacher Profile", icon: Users, path: "/teachers" },
      { title: "Salary Report", icon: DollarSign, path: "/teacher-salary" },
      { title: "Leave Report", icon: Clock, path: "/teacher-leave" },
      { title: "Performance", icon: TrendingUp, path: "/teacher-performance" },
      { title: "Experience", icon: Briefcase, path: "/teacher-reports" },
      { title: "Joining Report", icon: CalendarDays, path: "/teacher-reports" },
      { title: "ID Card", icon: IdCard, path: "/teacher-id-card" },
    ],
  },
  {
    category: "Transport Reports",
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    items: [
      { title: "Vehicle Report", icon: Bus, path: "/transport?tab=vehicles" },
      { title: "Route Report", icon: Route, path: "/transport?tab=routes" },
      { title: "Student Transport", icon: Users, path: "/transport?tab=assignments" },
      { title: "Bus Attendance", icon: ClipboardCheck, path: "/transport?tab=attendance" },
      { title: "Transport Reports", icon: FileText, path: "/transport?tab=reports" },
      { title: "Fee Collection", icon: IndianRupee, path: "/transport?tab=reports" },
      { title: "Driver Report", icon: UserCheck, path: "/transport?tab=reports" },
      { title: "Maintenance Report", icon: Wrench, path: "/transport?tab=reports" },
      { title: "Fuel Report", icon: Fuel, path: "/transport?tab=reports" },
    ],
  },
  {
    category: "Library Reports",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    items: [
      { title: "Issue / Return", icon: BookOpenCheck, path: "/library?tab=issue-return" },
      { title: "Books Management", icon: BookMarked, path: "/library?tab=books" },
      { title: "Members", icon: Users, path: "/library?tab=members" },
      { title: "Library Reports", icon: TrendingUp, path: "/library?tab=reports" },
      { title: "Overdue Books", icon: AlertTriangle, path: "/library?tab=reports" },
      { title: "Book Stock", icon: Library, path: "/library?tab=books" },
      { title: "Fine Report", icon: AlertCircle, path: "/library?tab=reports" },
    ],
  },
  {
    category: "Analytics",
    gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
    items: [
      { title: "Admission Analysis", icon: TrendingUp, path: "/analytics?tab=admission" },
      { title: "Fee Analysis", icon: PieChart, path: "/analytics?tab=fee" },
      { title: "Attendance Analysis", icon: BarChart3, path: "/analytics?tab=attendance" },
      { title: "Exam Analysis", icon: Activity, path: "/analytics?tab=exam" },
      { title: "Transport Analysis", icon: Bus, path: "/analytics?tab=transport" },
      { title: "Library Analysis", icon: BookOpen, path: "/analytics?tab=library" },
      { title: "Income Analysis", icon: TrendingUp, path: "/analytics?tab=income" },
      { title: "Expense Analysis", icon: TrendingDown, path: "/analytics?tab=expense" },
    ],
  },
  {
    category: "Designers & Tools",
    gradient: "linear-gradient(135deg, #475569, #334155)",
    items: [
      { title: "Certificate Designer", icon: PenTool, path: "/designer/certificate" },
      { title: "Report Designer", icon: Palette, path: "/designer/report" },
      { title: "Report Card Designer", icon: Layout, path: "/designer/report-card" },
      { title: "ID Card Designer", icon: IdCard, path: "/designer/id-card" },
    ],
  },
  {
    category: "Report Cards & Templates",
    gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    items: [
      { title: "Half Yearly (With Grade)", icon: FileSpreadsheet, path: "/report-card-select?template=half-yearly-grade" },
      { title: "Half Yearly (Without Grade)", icon: FileSpreadsheet, path: "/report-card-select?template=half-yearly-no-grade" },
      { title: "Annual (With Grade)", icon: FileSpreadsheet, path: "/report-card-select?template=annual-grade" },
      { title: "Annual (Without Grade)", icon: FileSpreadsheet, path: "/report-card-select?template=annual-no-grade" },
      { title: "Consolidated (With Grade)", icon: Layers, path: "/report-card-select?template=consolidated-grade" },
      { title: "Consolidated (Without Grade)", icon: Layers, path: "/report-card-select?template=consolidated-no-grade" },
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
            className="flex-1 max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                      <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 leading-tight">
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


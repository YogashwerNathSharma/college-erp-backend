import { getFullUrl } from "../utils/url";
import { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Users, UserCog, IndianRupee, AlertCircle, GraduationCap,
  CalendarCheck, ClipboardList, Bus, BookOpen, BarChart3,
  Clock, Zap, CheckCircle, TrendingUp, TrendingDown,
  Calendar, Bell, UserPlus, Receipt, ArrowRight,
  School, Building2, Award, Library, Package,
  BedDouble, Send, Shield, FileText, Activity,
  PieChart, Layers, CreditCard, Cake, Megaphone,
  DoorOpen, BookMarked, Truck, MapPin, UserCheck,
  AlertTriangle, Star, ClipboardCheck,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart as RechartPie,
  Pie, LineChart, Line, Legend,
} from "recharts";
import DashboardDetailModal from "../components/dashboard/DashboardDetailModal";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatINR(amount: number): string {
  if (!amount && amount !== 0) return "₹0";
  return "₹" + amount.toLocaleString("en-IN");
}

function formatCompact(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 17) return "🌤️";
  return "🌙";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ═══════════════════════════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════════════════════════

const animationCSS = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
@keyframes marqueeVertical {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}
.animate-marquee-vertical {
  animation: marqueeVertical 12s linear infinite;
}
.animate-marquee-vertical:hover { animation-play-state: paused; }
.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}
.animate-slide-right {
  animation: slideInRight 0.5s ease-out forwards;
  opacity: 0;
}
.stagger-1 { animation-delay: 0.03s; }
.stagger-2 { animation-delay: 0.06s; }
.stagger-3 { animation-delay: 0.09s; }
.stagger-4 { animation-delay: 0.12s; }
.stagger-5 { animation-delay: 0.15s; }
.stagger-6 { animation-delay: 0.18s; }
.stagger-7 { animation-delay: 0.21s; }
.stagger-8 { animation-delay: 0.24s; }
.stagger-9 { animation-delay: 0.27s; }
.stagger-10 { animation-delay: 0.3s; }
.stagger-11 { animation-delay: 0.33s; }
.stagger-12 { animation-delay: 0.36s; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ═══════════════════════════════════════════════════════════════
// QUICK ACTIONS CONFIG
// ═══════════════════════════════════════════════════════════════

const quickActions = [
  { label: "Students", icon: GraduationCap, route: "/students", color: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/50" },
  { label: "Teachers", icon: UserCog, route: "/teachers", color: "bg-green-500", lightBg: "bg-green-50 dark:bg-green-950/50" },
  { label: "Fees", icon: IndianRupee, route: "/fees/collection", color: "bg-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/50" },
  { label: "Fee Receipt", icon: Receipt, route: "/fees/receipts", color: "bg-red-500", lightBg: "bg-red-50 dark:bg-red-950/50" },
  { label: "Attendance", icon: CalendarCheck, route: "/attendance", color: "bg-purple-500", lightBg: "bg-purple-50 dark:bg-purple-950/50" },
  { label: "Exams", icon: ClipboardList, route: "/exams", color: "bg-orange-500", lightBg: "bg-orange-50 dark:bg-orange-950/50" },
  { label: "Timetable", icon: Clock, route: "/timetable", color: "bg-cyan-500", lightBg: "bg-cyan-50 dark:bg-cyan-950/50" },
  { label: "Transport", icon: Bus, route: "/transport", color: "bg-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/50" },
  { label: "Library", icon: BookOpen, route: "/library", color: "bg-rose-500", lightBg: "bg-rose-50 dark:bg-rose-950/50" },
  { label: "Hostel", icon: BedDouble, route: "/hostel/rooms", color: "bg-teal-500", lightBg: "bg-teal-50 dark:bg-teal-950/50" },
  { label: "HR", icon: Users, route: "/hr/staff", color: "bg-sky-500", lightBg: "bg-sky-50 dark:bg-sky-950/50" },
  { label: "Settings", icon: Layers, route: "/settings/subscription", color: "bg-slate-500", lightBg: "bg-slate-50 dark:bg-slate-950/50" },
];

// ═══════════════════════════════════════════════════════════════
// CHART COLORS
// ═══════════════════════════════════════════════════════════════

const GENDER_COLORS = ["#3b82f6", "#ec4899", "#8b5cf6"];
const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81"];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { setTenant }: any = useOutletContext();
  const navigate = useNavigate();

  const [data, setData] = useState<any>({
    totalStudents: 0, totalClasses: 0, totalPaid: 0,
    totalPending: 0, monthlyData: [], recentPayments: [],
    defaulters: [], insights: {},
    genderData: [], classWiseStrength: [], attendanceTrend: [],
    totalTeachers: 0,
    // New fields
    teachersPresent: 0, teachersOnLeave: 0,
    totalVehicles: 0, activeRoutes: 0, totalDrivers: 0,
    libraryBooks: 0, booksIssued: 0, booksOverdue: 0,
    notifications: [], events: [], birthdays: [],
    todayTimetable: [], upcomingExams: [],
    assignments: [], announcements: [],
    hostelOccupancy: 0, hostelCapacity: 0, hostelVacant: 0,
    gatePasses: 0, visitorsToday: 0,
    staffPresent: 0, staffTotal: 0,
  });

  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    type: "students" | "classes" | "fees_collected" | "fees_pending" | "receipts" | "recent_payments";
  }>({ open: false, type: "students" });
  const [paymentStudent, setPaymentStudent] = useState<any>(null);
  const [paymentStudentFees, setPaymentStudentFees] = useState<any[]>([]);
  const [genderModal, setGenderModal] = useState(false);
  const [genderStudents, setGenderStudents] = useState<any[]>([]);
  const [genderFilter, setGenderFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [classFilterGender, setClassFilterGender] = useState("");

  // ─── Subscription fetch ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
    axios.get("/api/tenant/my-subscription", { headers })
      .then((res) => setSubscriptionInfo(res.data?.data || res.data))
      .catch(() => { });
  }, []);

  // ─── Dashboard data fetch ────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/api/dashboard", { headers });
        const d = res.data?.data;

        setData({
          totalStudents: d?.totalStudents ?? 0,
          totalClasses: d?.totalClasses ?? 0,
          totalPaid: d?.totalPaid ?? 0,
          totalPending: d?.totalPending ?? 0,
          monthlyData: d?.monthlyData ?? [],
          recentPayments: d?.recentPayments ?? [],
          defaulters: d?.defaulters ?? [],
          insights: d?.insights ?? {},
          genderData: d?.genderData ?? [],
          classWiseStrength: d?.classWiseStrength ?? [],
          attendanceTrend: d?.attendanceTrend ?? [],
          totalTeachers: d?.totalTeachers ?? 0,
          // New data from API
          teachersPresent: d?.teachersPresent ?? d?.totalTeachers ?? 0,
          teachersOnLeave: d?.teachersOnLeave ?? 0,
          totalVehicles: d?.totalVehicles ?? 0,
          activeRoutes: d?.activeRoutes ?? 0,
          totalDrivers: d?.totalDrivers ?? 0,
          libraryBooks: d?.libraryBooks ?? 0,
          booksIssued: d?.booksIssued ?? 0,
          booksOverdue: d?.booksOverdue ?? 0,
          notifications: d?.notifications ?? [],
          events: d?.events ?? [],
          birthdays: d?.birthdays ?? [],
          todayTimetable: d?.todayTimetable ?? [],
          upcomingExams: d?.upcomingExams ?? [],
          assignments: d?.assignments ?? [],
          announcements: d?.announcements ?? [],
          hostelOccupancy: d?.hostelOccupancy ?? 0,
          hostelCapacity: d?.hostelCapacity ?? 0,
          hostelVacant: d?.hostelVacant ?? 0,
          gatePasses: d?.gatePasses ?? 0,
          visitorsToday: d?.visitorsToday ?? 0,
          staffPresent: d?.staffPresent ?? 0,
          staffTotal: d?.staffTotal ?? 0,
        });

        const tenantData = {
          name: d?.tenant?.name || "",
          schoolName: d?.tenant?.schoolName || d?.tenant?.name || "",
          type: d?.tenant?.type || "",
          logoUrl: getFullUrl(d?.tenant?.logoUrl || d?.tenant?.logo),
          backgroundUrl: d?.tenant?.backgroundUrl || null,
          address: d?.tenant?.address || "",
          phone: d?.tenant?.phone || "",
          email: d?.tenant?.email || "",
        };
        setTenant(tenantData);
        localStorage.setItem("tenant", JSON.stringify(tenantData));
      } catch (err) {
        console.log("Dashboard error:", err);
        const savedTenant = localStorage.getItem("tenant");
        if (savedTenant) setTenant(JSON.parse(savedTenant));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ─── Plan + Payment handlers ─────────────────────────────────
  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/tenant/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(res.data.data || []);
      setShowPlansModal(true);
    } catch (err) {
      console.error("Fetch plans error:", err);
    }
  };

  const buyPlan = async (planId: string) => {
    try {
      setPaymentLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post("/api/tenant/self-subscribe", { planId }, { headers });
      const { order, subscriptionId } = res.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SufLEYxZg1RUP2",
        amount: order.amount,
        currency: order.currency,
        name: "College ERP",
        description: "Subscription Plan",
        order_id: order.id,
        prefill: { name: user?.name || "User", email: user?.email || "", contact: "9999999999" },
        theme: { color: "#4f46e5" },
        handler: async function (response: any) {
          try {
            await axios.post("/api/subscription-payments/verify", {
              subscriptionId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, { headers });
            alert("✅ Payment Successful! Plan Activated.");
            setShowPlansModal(false);
            window.location.reload();
          } catch { alert("❌ Payment verification failed"); }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (r: any) => alert(r?.error?.description || "Payment Failed"));
      rzp.open();
    } catch (error: any) {
      alert("❌ " + (error.response?.data?.message || "Invalid plan. Purchase a valid paid plan to continue."));
    } finally {
      setPaymentLoading(false);
    }
  };

  const isFreePlan = subscriptionInfo?.amount === 0 || subscriptionInfo?.planName?.toLowerCase().includes("free");

  // ─── Student fee detail handler ──────────────────────────────
  const handlePaymentStudentClick = async (p: any) => {
    setPaymentStudent(p);
    setPaymentStudentFees([]);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const query = p.admissionNo || p.studentName || "";
      const res = await axios.get(`/api/fees/collection/search?q=${encodeURIComponent(query)}`, { headers });
      const result = res.data;
      
      if (result?.type === "single" && result?.data?.fees) {
        setPaymentStudentFees(result.data.fees);
      } else if (result?.type === "list" && result?.students?.length > 0) {
        const enrollId = result.students[0].enrollmentId || result.students[0].id;
        const feeRes = await axios.get(`/api/fees/collection/student/${enrollId}`, { headers });
        setPaymentStudentFees(feeRes.data?.fees || []);
      }
    } catch (err) {
      console.error("Fee fetch error:", err);
      setPaymentStudentFees([]);
    }
  };

  // ─── Gender modal handler ───────────────────────────────────
  const handleGenderClick = async () => {
    setGenderModal(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("/api/students?limit=1000", { headers });
      setGenderStudents(res.data?.data?.students || res.data?.data || []);
    } catch {
      setGenderStudents([]);
    }
  };

  // ─── Derived chart data ──────────────────────────────────────
  const genderColors = ["#3b82f6", "#ec4899", "#8b5cf6"];
  const genderData = (data.genderData && data.genderData.length > 0
    ? data.genderData.map((g: any, i: number) => ({ ...g, color: genderColors[i] || "#8b5cf6" }))
    : [
      { name: "Boys", value: Math.round((data.totalStudents || 0) * 0.55), color: "#3b82f6" },
      { name: "Girls", value: Math.round((data.totalStudents || 0) * 0.43), color: "#ec4899" },
      { name: "Other", value: Math.round((data.totalStudents || 0) * 0.02), color: "#8b5cf6" },
    ]
  ).filter((d: any) => d.value > 0);

  const attendanceTrend = (data.attendanceTrend && data.attendanceTrend.length > 0)
    ? data.attendanceTrend.map((a: any) => ({ day: a.day, rate: a.percentage }))
    : [];

  const classStrength = data.classWiseStrength || data.insights?.classStrength || [];

  // ─── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-slate-700 dark:text-slate-300 font-medium">Loading Dashboard</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Fetching your data...</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      <style>{animationCSS}</style>
      <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3 max-w-[1600px] mx-auto overflow-x-hidden pb-24 sm:pb-5">

        {/* ═══ GREETING HEADER + QUICK ACTIONS ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in-up stagger-1">
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {getGreetingEmoji()} {getGreeting()}, {user?.name?.split(" ")[0] || "Admin"}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate()}</p>
            <div className="flex sm:hidden items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Session: <b className="text-slate-700 dark:text-slate-300">2026-27</b></span>
              <span className="flex items-center gap-1"><Building2 size={10} /> <b className="text-slate-700 dark:text-slate-300">Main Campus</b></span>
            </div>
          </div>
          <div className="hidden sm:flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Session: <b className="text-slate-700 dark:text-slate-300">2026-27</b>
            </span>
            <span className="flex items-center gap-1">
              <Building2 size={11} /> Branch: <b className="text-slate-700 dark:text-slate-300">Main Campus</b>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> Last Login: <b className="text-slate-700 dark:text-slate-300">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</b>
            </span>
            <span className="flex items-center gap-1">
              ☀️ <b className="text-slate-700 dark:text-slate-300">32°C</b>
            </span>
          </div>
        </div>

        {/* ═══ QUICK ACTIONS + STAT CARDS (single row) ═══ */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 animate-fade-in-up stagger-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.route)}
                className={`flex flex-col items-center gap-1 py-1.5 sm:py-2 px-1 rounded-lg ${action.lightBg} hover:scale-105 transition-all duration-200 group`}
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${action.color} flex items-center justify-center`}>
                  <action.icon size={14} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">{action.label}</span>
              </button>
            ))}
        </div>

        {/* ═══ STAT CARDS ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 animate-fade-in-up stagger-2">
          <MiniStat label="Students" value={data.totalStudents} icon={<GraduationCap size={16} />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/50" onClick={() => setDetailModal({ open: true, type: "students" })} />
          <MiniStat label="Teachers" value={data.totalTeachers || 0} icon={<UserCog size={16} />} color="text-green-600" bg="bg-green-50 dark:bg-green-950/50" onClick={() => navigate("/teachers")} />
          <MiniStat label="Fee Collected" value={data.totalPaid >= 100000 ? `₹${formatCompact(data.totalPaid)}` : formatINR(data.totalPaid)} icon={<IndianRupee size={16} />} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/50" onClick={() => setDetailModal({ open: true, type: "fees_collected" })} />
          <MiniStat label="Fee Pending" value={data.totalPending >= 100000 ? `₹${formatCompact(data.totalPending)}` : formatINR(data.totalPending)} icon={<AlertCircle size={16} />} color="text-red-600" bg="bg-red-50 dark:bg-red-950/50" onClick={() => setDetailModal({ open: true, type: "fees_pending" })} />
          <MiniStat label="Attendance" value={data.insights?.attendanceToday ? `${data.insights.attendanceToday}%` : "—"} icon={<CalendarCheck size={16} />} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-950/50" onClick={() => navigate("/attendance")} />
          <MiniStat label="Classes" value={data.totalClasses} icon={<School size={16} />} color="text-cyan-600" bg="bg-cyan-50 dark:bg-cyan-950/50" onClick={() => setDetailModal({ open: true, type: "classes" })} />
        </div>

        {/* ═══ LIVE UPDATES CARD ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up stagger-3">
          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                <Zap size={14} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex-1">Live Updates</h4>
              {(data.notifications?.length > 0 || data.events?.length > 0 || data.upcomingExams?.length > 0 || data.birthdays?.length > 0 || data.announcements?.length > 0) && (
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {(data.notifications?.length || 0) + (data.events?.length || 0) + (data.upcomingExams?.length || 0) + (data.birthdays?.length || 0) + (data.announcements?.length || 0)} updates
                </span>
              )}
            </div>
            <div className="relative h-32 overflow-hidden">
              {(() => {
                const allItems = [
                  ...(data.notifications || []).map((n: any) => ({ type: "notification", text: n.message || n.title || "New notification", icon: "🔔", route: "/communication" })),
                  ...(data.events || []).map((e: any) => ({ type: "event", text: `${e.title || e.name || "Event"} — ${e.date || ""}`, icon: "📅", route: "/events" })),
                  ...(data.upcomingExams || []).map((ex: any) => ({ type: "exam", text: `${ex.name || ex.subject || "Exam"} — ${ex.date || ""}`, icon: "📊", route: "/exams" })),
                  ...(data.birthdays || []).map((b: any) => ({ type: "birthday", text: `${b.name || b.studentName || "Student"} — ${b.className || b.role || ""}`, icon: "🎂", route: "/students" })),
                  ...(data.announcements || []).map((a: any) => ({ type: "announcement", text: a.title || a.message || "Announcement", icon: "📢", route: "/communication" })),
                ];
                if (allItems.length === 0) {
                  return <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No updates right now</p>;
                }
                const doubled = [...allItems, ...allItems];
                return (
                  <div className="animate-marquee-vertical absolute w-full" style={{ animationDuration: `${Math.max(allItems.length * 3, 10)}s` }}>
                    {doubled.map((item: any, i: number) => (
                      <div key={i} onClick={() => navigate(item.route)} className={`py-1.5 px-2 rounded cursor-pointer transition-colors ${
                        item.type === "notification" ? "hover:bg-indigo-50 dark:hover:bg-indigo-950/30" :
                        item.type === "event" ? "hover:bg-purple-50 dark:hover:bg-purple-950/30" :
                        item.type === "birthday" ? "hover:bg-pink-50 dark:hover:bg-pink-950/30" :
                        item.type === "announcement" ? "hover:bg-orange-50 dark:hover:bg-orange-950/30" :
                        "hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                      }`}>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{item.icon} {item.text}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          {/* Assignments Card */}
          <div onClick={() => navigate("/exams")} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <ClipboardList size={16} className="text-orange-500" /> Assignments
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
              {data.assignments?.length > 0 ? data.assignments.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{a.title || a.subject || "Assignment"}</span>
                  <span className="text-[10px] text-red-500 font-medium whitespace-nowrap ml-2">{a.dueDate || ""}</span>
                </div>
              )) : (
                <p className="text-xs text-slate-400 py-4 text-center">No pending assignments</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ CHARTS ROW: Fee Collection + Attendance Trend (compact) ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 animate-fade-in-up stagger-4">
          {/* Monthly Fee Collection */}
          <div onClick={() => setDetailModal({ open: true, type: "fees_collected" })} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Monthly Fee Collection</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Revenue trends</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Collected</span>
            </div>
            <div className="h-32 sm:h-36">
              {data.monthlyData && data.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${formatCompact(v)}`} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }} formatter={(value: any) => [formatINR(value), "Amount"]} />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#areaGradient)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  <BarChart3 size={24} className="mb-1 opacity-50" />
                  <p className="text-xs">No monthly data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Trend */}
          <div onClick={() => navigate("/attendance")} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Attendance Trend</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Last 7 days</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-purple-500" /> Attendance %</span>
            </div>
            <div className="h-32 sm:h-36">
              {attendanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }} formatter={(value: any) => [`${value}%`, "Attendance"]} />
                    <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  <Activity size={24} className="mb-1 opacity-50" />
                  <p className="text-xs">No attendance data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ ROW: Class Strength + Gender ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up stagger-5">
          {/* Class-wise Strength */}
          <div onClick={() => navigate("/students")} className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-2">Class-wise Strength</h3>
            <div className="h-36 sm:h-44">
              {classStrength.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classStrength} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }} formatter={(value: any) => [`${value} students`]} />
                    <Bar dataKey="students" radius={[0, 4, 4, 0]} barSize={14}>
                      {classStrength.map((_: any, idx: number) => (
                        <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400"><Layers size={20} className="mb-1 opacity-50" /><p className="text-xs">No data</p></div>
              )}
            </div>
          </div>

          {/* Gender Donut */}
          <div onClick={handleGenderClick} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-2">Gender Ratio</h3>
            <div className="h-24 sm:h-28 flex items-center justify-center">
              {genderData.length > 0 ? (
                <ResponsiveContainer width="80%" height="100%">
                  <RechartPie>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {genderData.map((entry: any, idx: number) => (<Cell key={idx} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} formatter={(value: any) => [`${value} students`]} />
                  </RechartPie>
                </ResponsiveContainer>
              ) : (<p className="text-xs text-slate-400">No data</p>)}
            </div>
            <div className="flex items-center justify-center gap-3 mt-1">
              {genderData.map((item: any) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-slate-500">{item.name}</span>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ═══ ROW: Today's Timetable (full-width) ═══ */}
        <div className="animate-fade-in-up stagger-6">
          <div onClick={() => navigate("/timetable")} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Clock size={16} className="text-cyan-500" /> Today's Timetable
            </h4>
            <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-52 overflow-y-auto no-scrollbar">
              {data.todayTimetable?.length > 0 ? data.todayTimetable.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.subject || t.name || "Subject"}</span>
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">{t.time || t.period || ""}</span>
                </div>
              )) : (
                <p className="text-xs text-slate-400 py-6 text-center">No classes scheduled today</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ ROW: Recent Payments (compact) + Activity + Defaulters ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up stagger-9">
          {/* Recent Payments - Compact Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Receipt size={14} className="text-emerald-500" /> Recent Payments
              </h3>
              <button onClick={() => setDetailModal({ open: true, type: "recent_payments" })} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-0.5">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {data.recentPayments.length > 0 ? data.recentPayments.slice(0, 5).map((p: any, i: number) => (
                <div key={i} onClick={() => handlePaymentStudentClick(p)} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {(p.studentName || p.name || "S")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{p.studentName || p.name || "Student"}</p>
                      <p className="text-[10px] text-slate-400 truncate">{p.className || ""}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 whitespace-nowrap ml-2">{formatINR(p.amount)}</span>
                </div>
              )) : (
                <p className="text-xs text-slate-400 py-4 text-center">No recent payments</p>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div onClick={() => setDetailModal({ open: true, type: "recent_payments" })} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
              <Activity size={14} className="text-indigo-500" /> Recent Activity
            </h3>
            <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
              {data.recentPayments.length > 0 ? data.recentPayments.slice(0, 4).map((p: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{p.studentName || p.name || "Student"}</span>
                      {" paid "}
                      <span className="font-semibold text-emerald-600">{formatINR(p.amount)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(p.paidAt || p.date || "")}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 py-4 text-center">No recent activity</p>
              )}
            </div>
          </div>

          {/* Fee Defaulters */}
          <div onClick={() => navigate("/fees/due")} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <AlertCircle size={14} className="text-red-500" /> Fee Defaulters
              </h3>
              <button onClick={(e) => { e.stopPropagation(); setDetailModal({ open: true, type: "fees_pending" }); }} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium">View All</button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {data.defaulters.length > 0 ? data.defaulters.slice(0, 4).map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={11} className="text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{d.studentName || d.name || "Student"}</p>
                      <p className="text-[10px] text-slate-400">{d.className || "—"}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 whitespace-nowrap ml-2">{formatINR(d.pendingAmount || d.amount || 0)}</span>
                </div>
              )) : (
                <div className="text-center py-4">
                  <CheckCircle size={20} className="mx-auto text-green-400 mb-1" />
                  <p className="text-xs text-slate-500">No defaulters! 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ PLANS MODAL ═══ */}
        {showPlansModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose a Plan</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select the best plan for your institution</p>
                </div>
                <button onClick={() => setShowPlansModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isFree = plan.price === 0;
                  const isCurrentPlan = subscriptionInfo?.planName === plan.name;
                  return (
                    <div key={plan.id} className={`rounded-2xl border-2 p-6 relative transition-all hover:shadow-lg ${
                      isCurrentPlan ? "border-green-500 bg-green-50 dark:bg-green-950" : plan.isPopular ? "border-indigo-500 shadow-lg shadow-indigo-500/10" : "border-slate-200 dark:border-slate-700"
                    }`}>
                      {isCurrentPlan && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle size={12} /> Current
                        </span>
                      )}
                      {!isCurrentPlan && plan.isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full">⭐ Popular</span>
                      )}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      {plan.description && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{plan.description}</p>}
                      <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-4">
                        {isFree ? "Free" : formatINR(plan.price)}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{plan.durationInDays} Days</p>
                      <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <p>👨🎓 Students: <b>{plan.maxStudents}</b></p>
                        <p>👨🏫 Teachers: <b>{plan.maxTeachers}</b></p>
                        <p>👨💼 Admins: <b>{plan.maxAdmins}</b></p>
                        <p>💾 Storage: <b>{plan.maxStorageInGB} GB</b></p>
                      </div>
                      {plan.features?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {plan.features.map((f: string, i: number) => (
                            <span key={i} className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => !isCurrentPlan && buyPlan(plan.id)}
                        disabled={paymentLoading || isCurrentPlan}
                        className={`w-full mt-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                          isCurrentPlan ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50"
                        }`}
                      >
                        {isCurrentPlan ? (<><CheckCircle size={16} /> Active</>) : (<><Zap size={16} /> {paymentLoading ? "Processing..." : "Buy & Activate"}</>)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Student Fee History Modal */}
        {paymentStudent && (
          <div className="fixed inset-0 bg-black/60 z-[9000] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setPaymentStudent(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{paymentStudent.studentName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{paymentStudent.className}{paymentStudent.sectionName ? ` - ${paymentStudent.sectionName}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    const receiptData = { ...paymentStudent, installmentNo: paymentStudentFees[0]?.installmentNo || 1, dueDate: paymentStudentFees[0]?.dueDate, balance: paymentStudentFees.reduce((s: number, f: any) => s + (f.balanceAmount || 0), 0), feeHead: paymentStudentFees[0]?.feeStructure?.name || "Fee" };
                    import("../utils/print").then(({ printDocument }) => printDocument("fee_receipt", receiptData));
                  }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-medium">
                    🖨️ Print Receipt
                  </button>
                  <button onClick={() => { setPaymentStudent(null); navigate(`/fees/collection?student=${encodeURIComponent(paymentStudent?.admissionNo || paymentStudent?.studentName || "")}`); }} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 font-medium">
                    💰 Collect Fee
                  </button>
                  <button onClick={() => setPaymentStudent(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">✕</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Fee Payment History</h3>
                {paymentStudentFees.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">#</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Installment</th>
                        <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Net Fee</th>
                        <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Paid</th>
                        <th className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Balance</th>
                        <th className="text-center py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                        <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentStudentFees.map((f: any, idx: number) => (
                        <tr key={f.id || idx} className="border-b border-slate-50 dark:border-slate-700/50">
                          <td className="py-2.5 text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">Inst. {f.installmentNo || idx + 1}</td>
                          <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">₹{(f.netAmount || f.totalAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="py-2.5 text-right text-emerald-600 font-medium">₹{(f.paidAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="py-2.5 text-right font-bold text-red-600">₹{(f.balanceAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              f.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                : f.status === "OVERDUE" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                            }`}>{f.status || "PENDING"}</span>
                          </td>
                          <td className="py-2.5 text-slate-500 dark:text-slate-400 text-xs">{f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>No fee installments found for this student.</p>
                    <p className="text-xs mt-1">Click "Collect Fee" to assign and collect fees.</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">{paymentStudentFees.length} installments</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  Total Paid: <span className="text-emerald-600">₹{paymentStudentFees.reduce((s: number, f: any) => s + (f.paidAmount || 0), 0).toLocaleString("en-IN")}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Gender Breakdown Modal */}
        {genderModal && (
          <div className="fixed inset-0 bg-black/60 z-[9000] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setGenderModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-5xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Student Gender & Category Breakdown</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    const filtered = genderStudents.filter((s: any) => (!genderFilter || s.gender === genderFilter) && (!categoryFilter || s.category === categoryFilter) && (!classFilterGender || (s.className || s.class?.name) === classFilterGender));
                    const printW = window.open("", "_blank");
                    if (!printW) return;
                    const rows = filtered.map((s: any, i: number) => `<tr><td>${i+1}</td><td><b>${s.firstName} ${s.lastName}</b></td><td>${s.gender === "Male" ? "Boy" : "Girl"}</td><td>${s.className || s.class?.name || "—"}</td><td>${s.sectionName || s.section?.name || "—"}</td><td>${s.category || "—"}</td><td>${s.religion || "—"}</td><td>${s.fatherName || "—"}</td></tr>`).join("");
                    printW.document.write(`<html><head><title>Gender Breakdown</title><style>body{font-family:Arial;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f0f0f0}.header{text-align:center;margin-bottom:15px}@media print{.no-print{display:none}}</style></head><body><div class="header"><h2>Student Gender & Category Breakdown</h2><p>Total: ${filtered.length} students | Boys: ${filtered.filter((s:any)=>s.gender==="Male").length} | Girls: ${filtered.filter((s:any)=>s.gender==="Female").length}</p></div><table><tr><th>#</th><th>Name</th><th>Gender</th><th>Class</th><th>Section</th><th>Category</th><th>Religion</th><th>Father</th></tr>${rows}</table></body></html>`);
                    printW.document.close();
                    printW.print();
                  }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-medium">🖨️ Print</button>
                  <button onClick={() => setGenderModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">✕</button>
                </div>
              </div>

              <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 items-center">
                <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white">
                  <option value="">All Gender</option>
                  <option value="Male">Boys</option>
                  <option value="Female">Girls</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white">
                  <option value="">All Categories</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
                <select value={classFilterGender} onChange={(e) => setClassFilterGender(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white">
                  <option value="">All Classes</option>
                  {[...new Set(genderStudents.map((s: any) => s.className || s.class?.name).filter(Boolean))].sort((a: any, b: any) => a.localeCompare(b, undefined, {numeric: true})).map((c: any) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="ml-auto flex gap-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded font-medium">
                    Boys: {genderStudents.filter((s: any) => s.gender === "Male" && (!categoryFilter || s.category === categoryFilter) && (!classFilterGender || (s.className || s.class?.name) === classFilterGender)).length}
                  </span>
                  <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 rounded font-medium">
                    Girls: {genderStudents.filter((s: any) => s.gender === "Female" && (!categoryFilter || s.category === categoryFilter) && (!classFilterGender || (s.className || s.class?.name) === classFilterGender)).length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <tr className="text-left text-xs text-slate-600 dark:text-slate-300 uppercase">
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Gender</th>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Section</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Religion</th>
                      <th className="p-2.5">Father Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genderStudents
                      .filter((s: any) => (!genderFilter || s.gender === genderFilter) && (!categoryFilter || s.category === categoryFilter) && (!classFilterGender || (s.className || s.class?.name) === classFilterGender))
                      .map((s: any, i: number) => (
                      <tr key={s.id || i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="p-2.5 text-slate-400">{i + 1}</td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{s.firstName} {s.lastName}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.gender === "Male" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300"}`}>
                            {s.gender === "Male" ? "Boy" : "Girl"}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{s.className || s.class?.name || "—"}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{s.sectionName || s.section?.name || "—"}</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">{s.category || "—"}</span></td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400">{s.religion || "—"}</td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400">{s.fatherName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <DashboardDetailModal
          isOpen={detailModal.open}
          type={detailModal.type}
          onClose={() => setDetailModal({ ...detailModal, open: false })}
        />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Mini Stat Card - Ultra Compact */
function MiniStat({ label, value, icon, color, bg, onClick }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; bg: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`${bg} rounded-lg p-2 cursor-pointer hover:scale-[1.02] transition-all border border-slate-100 dark:border-slate-700/50`}>
      <div className="flex items-center gap-1.5">
        <span className={`${color} dark:opacity-90`}>{icon}</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{label}</span>
      </div>
      <p className={`text-sm font-bold text-slate-800 dark:text-white mt-0.5 truncate`}>{value}</p>
    </div>
  );
}

/** Info Card - Teachers/Transport style */
function InfoCard({ title, icon, iconColor, iconBg, items, onClick }: {
  title: string; icon: React.ReactNode; iconColor: string; iconBg: string;
  items: { label: string; value: number | string; color?: string }[];
  onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h4>
      </div>
      <div className="flex items-center justify-between">
        {items.map((item, i) => (
          <div key={i} className="text-center">
            <p className={`text-base font-bold ${item.color || "text-slate-800 dark:text-white"}`}>{item.value}</p>
            <p className="text-[10px] text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact List Card - Birthdays/Timetable/Exams/Assignments */
function CompactListCard({ title, items, emptyMsg, renderItem, onClick }: {
  title: string; items: any[]; emptyMsg: string;
  renderItem: (item: any) => React.ReactNode; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer">
      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">{title}</h4>
      <div className="space-y-1.5 max-h-24 overflow-y-auto no-scrollbar">
        {items && items.length > 0 ? items.slice(0, 4).map((item: any, i: number) => (
          <div key={i}>{renderItem(item)}</div>
        )) : (
          <p className="text-xs text-slate-400 py-3 text-center">{emptyMsg}</p>
        )}
      </div>
    </div>
  );
}

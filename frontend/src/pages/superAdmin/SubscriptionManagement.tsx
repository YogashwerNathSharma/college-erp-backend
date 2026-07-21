import { useState, useMemo, useEffect } from "react";
import {
  CreditCard,
  Package,
  Receipt,
  Tag,
  Calculator,
  RotateCcw,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Download,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Clock,
  AlertCircle,
  FileText,
  Percent,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Target,
  Activity,
  PieChart,
  Settings,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Send,
  Star,
  Crown,
  Shield,
  Database,
  HardDrive,
  Wifi,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DataTable,
  StatsCard,
  PageHeader,
  StatusBadge,
  ChartCard,
  ConfirmDialog,
} from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface Plan {
  id: string;
  name: string;
  description: string;
  type: "Monthly" | "Yearly" | "Lifetime" | "Custom";
  price: number;
  billingCycle: string;
  features: string[];
  limits: {
    maxStudents: number;
    maxTeachers: number;
    maxStorage: number;
    maxApiCalls: number;
  };
  activeSubscribers: number;
  status: "active" | "inactive";
  discount: number;
  isPopular: boolean;
  createdAt: string;
}

interface BillingRecord {
  id: string;
  tenant: string;
  tenantLogo: string;
  plan: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "failed" | "refunded";
  method: string;
  transactionId: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  tenant: string;
  plan: string;
  amount: number;
  tax: number;
  total: number;
  status: "paid" | "pending" | "overdue" | "draft";
  issuedDate: string;
  dueDate: string;
}

interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  applicablePlans: string[];
  status: "active" | "inactive" | "expired";
  description: string;
}

interface TaxConfig {
  gstEnabled: boolean;
  gstRate: number;
  gstNumber: string;
  panNumber: string;
  sacCode: string;
  placeOfSupply: string;
  igstEnabled: boolean;
  cessRate: number;
  invoicePrefix: string;
  invoiceStartNumber: number;
}

interface Refund {
  id: string;
  tenant: string;
  plan: string;
  amount: number;
  reason: string;
  requestDate: string;
  processedDate: string | null;
  status: "pending" | "approved" | "rejected" | "processing" | "completed";
  method: string;
  transactionId: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

const MOCK_PLANS: Plan[] = [
  {
    id: "plan-1",
    name: "Starter",
    description: "Perfect for small institutions getting started",
    type: "Monthly",
    price: 2999,
    billingCycle: "monthly",
    features: ["Student Management", "Attendance", "Basic Reports", "Email Support", "5 Admin Users"],
    limits: { maxStudents: 500, maxTeachers: 50, maxStorage: 5, maxApiCalls: 10000 },
    activeSubscribers: 45,
    status: "active",
    discount: 0,
    isPopular: false,
    createdAt: "2024-01-15",
  },
  {
    id: "plan-2",
    name: "Professional",
    description: "For growing institutions with advanced needs",
    type: "Monthly",
    price: 7999,
    billingCycle: "monthly",
    features: ["Everything in Starter", "Fee Management", "Exam Module", "SMS Gateway", "API Access", "Priority Support", "15 Admin Users"],
    limits: { maxStudents: 2000, maxTeachers: 200, maxStorage: 25, maxApiCalls: 50000 },
    activeSubscribers: 128,
    status: "active",
    discount: 10,
    isPopular: true,
    createdAt: "2024-01-15",
  },
  {
    id: "plan-3",
    name: "Enterprise",
    description: "Full-featured for large universities",
    type: "Yearly",
    price: 149999,
    billingCycle: "yearly",
    features: ["Everything in Professional", "Multi-Campus", "Custom Modules", "Dedicated Support", "White Labeling", "SLA 99.9%", "Unlimited Admins", "Advanced Analytics"],
    limits: { maxStudents: 50000, maxTeachers: 5000, maxStorage: 500, maxApiCalls: 1000000 },
    activeSubscribers: 32,
    status: "active",
    discount: 20,
    isPopular: false,
    createdAt: "2024-02-01",
  },
  {
    id: "plan-4",
    name: "Lifetime Access",
    description: "One-time payment, forever access",
    type: "Lifetime",
    price: 499999,
    billingCycle: "one-time",
    features: ["Everything in Enterprise", "Lifetime Updates", "Source Code Access", "Custom Development (10hrs/month)", "On-Premise Option"],
    limits: { maxStudents: 100000, maxTeachers: 10000, maxStorage: 2000, maxApiCalls: 5000000 },
    activeSubscribers: 8,
    status: "active",
    discount: 0,
    isPopular: false,
    createdAt: "2024-03-01",
  },
  {
    id: "plan-5",
    name: "Trial",
    description: "14-day free trial with full features",
    type: "Custom",
    price: 0,
    billingCycle: "14-days",
    features: ["All Professional Features", "Limited to 14 days", "50 Students Max"],
    limits: { maxStudents: 50, maxTeachers: 10, maxStorage: 1, maxApiCalls: 5000 },
    activeSubscribers: 215,
    status: "active",
    discount: 100,
    isPopular: false,
    createdAt: "2024-01-01",
  },
];

const MOCK_BILLING: BillingRecord[] = [
  { id: "bill-1", tenant: "Delhi Public School", tenantLogo: "DPS", plan: "Enterprise", amount: 149999, date: "2024-07-15", status: "paid", method: "UPI", transactionId: "TXN001234567" },
  { id: "bill-2", tenant: "St. Xavier's College", tenantLogo: "SXC", plan: "Professional", amount: 7999, date: "2024-07-14", status: "paid", method: "Credit Card", transactionId: "TXN001234568" },
  { id: "bill-3", tenant: "IIT Academy", tenantLogo: "IIT", plan: "Professional", amount: 7999, date: "2024-07-13", status: "pending", method: "Bank Transfer", transactionId: "TXN001234569" },
  { id: "bill-4", tenant: "Greenfield International", tenantLogo: "GFI", plan: "Enterprise", amount: 149999, date: "2024-07-12", status: "paid", method: "Net Banking", transactionId: "TXN001234570" },
  { id: "bill-5", tenant: "Sunrise Academy", tenantLogo: "SA", plan: "Starter", amount: 2999, date: "2024-07-11", status: "failed", method: "UPI", transactionId: "TXN001234571" },
  { id: "bill-6", tenant: "National School", tenantLogo: "NS", plan: "Professional", amount: 7999, date: "2024-07-10", status: "paid", method: "Credit Card", transactionId: "TXN001234572" },
  { id: "bill-7", tenant: "Cambridge School", tenantLogo: "CS", plan: "Starter", amount: 2999, date: "2024-07-09", status: "refunded", method: "UPI", transactionId: "TXN001234573" },
  { id: "bill-8", tenant: "Modern Academy", tenantLogo: "MA", plan: "Enterprise", amount: 149999, date: "2024-07-08", status: "paid", method: "Bank Transfer", transactionId: "TXN001234574" },
];

const MOCK_INVOICES: Invoice[] = [
  { id: "inv-1", invoiceNumber: "INV-2024-0156", tenant: "Delhi Public School", plan: "Enterprise", amount: 127118, tax: 22881, total: 149999, status: "paid", issuedDate: "2024-07-01", dueDate: "2024-07-15" },
  { id: "inv-2", invoiceNumber: "INV-2024-0157", tenant: "St. Xavier's College", plan: "Professional", amount: 6779, tax: 1220, total: 7999, status: "paid", issuedDate: "2024-07-01", dueDate: "2024-07-15" },
  { id: "inv-3", invoiceNumber: "INV-2024-0158", tenant: "IIT Academy", plan: "Professional", amount: 6779, tax: 1220, total: 7999, status: "pending", issuedDate: "2024-07-05", dueDate: "2024-07-20" },
  { id: "inv-4", invoiceNumber: "INV-2024-0159", tenant: "Greenfield International", plan: "Enterprise", amount: 127118, tax: 22881, total: 149999, status: "paid", issuedDate: "2024-07-01", dueDate: "2024-07-15" },
  { id: "inv-5", invoiceNumber: "INV-2024-0160", tenant: "Tech Institute", plan: "Starter", amount: 2542, tax: 457, total: 2999, status: "overdue", issuedDate: "2024-06-20", dueDate: "2024-07-05" },
  { id: "inv-6", invoiceNumber: "INV-2024-0161", tenant: "Royal School", plan: "Professional", amount: 6779, tax: 1220, total: 7999, status: "draft", issuedDate: "2024-07-18", dueDate: "2024-08-02" },
];

const MOCK_COUPONS: Coupon[] = [
  { id: "coup-1", code: "WELCOME50", discountType: "percentage", discountValue: 50, validFrom: "2024-01-01", validUntil: "2024-12-31", usageLimit: 1000, usedCount: 342, applicablePlans: ["Starter", "Professional"], status: "active", description: "Welcome offer for new signups" },
  { id: "coup-2", code: "ANNUAL20", discountType: "percentage", discountValue: 20, validFrom: "2024-06-01", validUntil: "2024-08-31", usageLimit: 500, usedCount: 89, applicablePlans: ["Enterprise"], status: "active", description: "Annual subscription discount" },
  { id: "coup-3", code: "FLAT5000", discountType: "fixed", discountValue: 5000, validFrom: "2024-03-01", validUntil: "2024-06-30", usageLimit: 200, usedCount: 200, applicablePlans: ["Professional", "Enterprise"], status: "expired", description: "Flat ₹5000 off on premium plans" },
  { id: "coup-4", code: "EDUFEST", discountType: "percentage", discountValue: 30, validFrom: "2024-09-01", validUntil: "2024-09-30", usageLimit: 100, usedCount: 0, applicablePlans: ["Starter", "Professional", "Enterprise"], status: "inactive", description: "Education festival special" },
  { id: "coup-5", code: "REFER10", discountType: "percentage", discountValue: 10, validFrom: "2024-01-01", validUntil: "2025-12-31", usageLimit: 5000, usedCount: 1247, applicablePlans: ["Starter", "Professional", "Enterprise"], status: "active", description: "Referral program discount" },
];

const MOCK_REFUNDS: Refund[] = [
  { id: "ref-1", tenant: "Cambridge School", plan: "Starter", amount: 2999, reason: "Service not as expected", requestDate: "2024-07-08", processedDate: "2024-07-09", status: "completed", method: "Original Payment Method", transactionId: "REF001234573" },
  { id: "ref-2", tenant: "Valley Institute", plan: "Professional", amount: 7999, reason: "Switching to competitor", requestDate: "2024-07-14", processedDate: null, status: "pending", method: "Bank Transfer", transactionId: "" },
  { id: "ref-3", tenant: "Metro Academy", plan: "Professional", amount: 4000, reason: "Partial refund - unused period", requestDate: "2024-07-10", processedDate: "2024-07-12", status: "approved", method: "Original Payment Method", transactionId: "REF001234575" },
  { id: "ref-4", tenant: "Star School", plan: "Starter", amount: 2999, reason: "Technical issues unresolved", requestDate: "2024-07-13", processedDate: null, status: "processing", method: "UPI", transactionId: "REF001234576" },
  { id: "ref-5", tenant: "Global Academy", plan: "Enterprise", amount: 50000, reason: "Downgrading plan", requestDate: "2024-07-11", processedDate: "2024-07-12", status: "rejected", method: "N/A", transactionId: "" },
];

const MOCK_MRR_DATA = [
  { month: "Jan", mrr: 285000, arr: 3420000, subscribers: 180 },
  { month: "Feb", mrr: 312000, arr: 3744000, subscribers: 195 },
  { month: "Mar", mrr: 345000, arr: 4140000, subscribers: 210 },
  { month: "Apr", mrr: 378000, arr: 4536000, subscribers: 228 },
  { month: "May", mrr: 420000, arr: 5040000, subscribers: 252 },
  { month: "Jun", mrr: 465000, arr: 5580000, subscribers: 278 },
  { month: "Jul", mrr: 512000, arr: 6144000, subscribers: 305 },
  { month: "Aug", mrr: 548000, arr: 6576000, subscribers: 328 },
  { month: "Sep", mrr: 590000, arr: 7080000, subscribers: 350 },
  { month: "Oct", mrr: 635000, arr: 7620000, subscribers: 375 },
  { month: "Nov", mrr: 680000, arr: 8160000, subscribers: 398 },
  { month: "Dec", mrr: 724000, arr: 8688000, subscribers: 428 },
];

const MOCK_PLAN_DISTRIBUTION = [
  { name: "Starter", value: 45, color: "#6366f1" },
  { name: "Professional", value: 128, color: "#10b981" },
  { name: "Enterprise", value: 32, color: "#f59e0b" },
  { name: "Lifetime", value: 8, color: "#ef4444" },
  { name: "Trial", value: 215, color: "#8b5cf6" },
];

const MOCK_REVENUE_BY_PLAN = [
  { plan: "Starter", revenue: 134955, count: 45 },
  { plan: "Professional", revenue: 1023872, count: 128 },
  { plan: "Enterprise", revenue: 4799968, count: 32 },
  { plan: "Lifetime", revenue: 3999992, count: 8 },
];

const MOCK_TAX_CONFIG: TaxConfig = {
  gstEnabled: true,
  gstRate: 18,
  gstNumber: "07AAGCR4375J1ZS",
  panNumber: "AAGCR4375J",
  sacCode: "998431",
  placeOfSupply: "Delhi",
  igstEnabled: false,
  cessRate: 0,
  invoicePrefix: "INV",
  invoiceStartNumber: 1001,
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

type TabKey = "plans" | "billing" | "invoices" | "coupons" | "tax" | "refunds" | "analytics";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "plans", label: "Plans", icon: <Package className="w-4 h-4" /> },
  { key: "billing", label: "Billing History", icon: <CreditCard className="w-4 h-4" /> },
  { key: "invoices", label: "Invoices", icon: <Receipt className="w-4 h-4" /> },
  { key: "coupons", label: "Coupons & Promos", icon: <Tag className="w-4 h-4" /> },
  { key: "tax", label: "Tax/GST", icon: <Calculator className="w-4 h-4" /> },
  { key: "refunds", label: "Refunds", icon: <RotateCcw className="w-4 h-4" /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER - FORMAT CURRENCY
// ══════════════════════════════════════════════════════════════════════════════

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>("plans");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ mrr: 0, activeSubscribers: 0, churnRate: 0, arpu: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/subscriptions/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const d = res.data.data;
        setStats({
          mrr: d.monthlyRevenue || d.mrr || 0,
          activeSubscribers: d.activeSubscriptions || d.activeSubscribers || 0,
          churnRate: d.churnRate || 0,
          arpu: d.arpu || 0,
        });
      }
    } catch {
      // Keep defaults (will show 0 if no data)
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Subscription & Billing"
        subtitle="Manage plans, billing, invoices, and revenue analytics"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success("Data refreshed")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(stats.mrr)}
          icon={<IndianRupee className="w-5 h-5" />}
          subtitle="Monthly recurring"
          color="emerald"
        />
        <StatsCard
          title="Active Subscribers"
          value={String(stats.activeSubscribers)}
          icon={<Users className="w-5 h-5" />}
          subtitle="Currently active"
          color="indigo"
        />
        <StatsCard
          title="Churn Rate"
          value={`${stats.churnRate}%`}
          icon={<TrendingDown className="w-5 h-5" />}
          subtitle="Monthly churn"
          color="amber"
        />
        <StatsCard
          title="Avg Revenue Per User"
          value={formatCurrency(stats.arpu)}
          icon={<Target className="w-5 h-5" />}
          subtitle="Per subscriber"
          color="purple"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-thin">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "plans" && <PlansTab />}
          {activeTab === "billing" && <BillingTab />}
          {activeTab === "invoices" && <InvoicesTab />}
          {activeTab === "coupons" && <CouponsTab />}
          {activeTab === "tax" && <TaxTab />}
          {activeTab === "refunds" && <RefundsTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PLANS TAB
// ══════════════════════════════════════════════════════════════════════════════

function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/subscriptions/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.data?.length > 0) {
        setPlans(res.data.data);
      }
    } catch {
      // Keep mock data as fallback
    } finally {
      setPlansLoading(false);
    }
  };
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const handleDuplicate = (plan: Plan) => {
    const newPlan: Plan = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      activeSubscribers: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPlans([...plans, newPlan]);
    toast.success(`Plan "${plan.name}" duplicated successfully`);
  };

  const handleToggleStatus = (planId: string) => {
    setPlans(plans.map((p) => p.id === planId ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p));
    toast.success("Plan status updated");
  };

  const handleDelete = () => {
    if (deletingPlanId) {
      setPlans(plans.filter((p) => p.id !== deletingPlanId));
      toast.success("Plan deleted successfully");
      setShowDeleteConfirm(false);
      setDeletingPlanId(null);
    }
  };

  const columns: Column<Plan>[] = [
    {
      key: "name",
      label: "Plan",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            row.isPopular ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-slate-100 dark:bg-slate-800"
          }`}>
            {row.isPopular ? <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Package className="w-5 h-5 text-slate-500" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 dark:text-white">{row.name}</span>
              {row.isPopular && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">POPULAR</span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px] truncate">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.type === "Monthly" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" :
          row.type === "Yearly" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" :
          row.type === "Lifetime" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" :
          "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
        }`}>
          {row.type}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(row.price)}</span>
          {row.discount > 0 && (
            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">-{row.discount}%</span>
          )}
        </div>
      ),
    },
    {
      key: "features",
      label: "Features",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">{row.features.length} features</span>
      ),
    },
    {
      key: "activeSubscribers",
      label: "Subscribers",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">{row.activeSubscribers}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingPlan(row); setShowEditModal(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDuplicate(row); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row.id); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title={row.status === "active" ? "Deactivate" : "Activate"}
          >
            {row.status === "active" ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeletingPlanId(row.id); setShowDeleteConfirm(true); }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={plans}
        title="Subscription Plans"
        subtitle={`${plans.length} plans configured`}
        searchPlaceholder="Search plans..."
        headerActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompareView(!showCompareView)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Layers className="w-4 h-4" />
              Compare
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          </div>
        }
      />

      {/* Plan Comparison View */}
      {showCompareView && <PlanComparisonView plans={plans} />}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <PlanModal
          title="Create New Plan"
          onClose={() => setShowCreateModal(false)}
          onSave={(plan) => {
            setPlans([...plans, { ...plan, id: `plan-${Date.now()}`, activeSubscribers: 0, createdAt: new Date().toISOString().split("T")[0] }]);
            setShowCreateModal(false);
            toast.success("Plan created successfully");
          }}
        />
      )}

      {/* Edit Plan Modal */}
      {showEditModal && editingPlan && (
        <PlanModal
          title="Edit Plan"
          initialData={editingPlan}
          onClose={() => { setShowEditModal(false); setEditingPlan(null); }}
          onSave={(plan) => {
            setPlans(plans.map((p) => p.id === editingPlan.id ? { ...editingPlan, ...plan } : p));
            setShowEditModal(false);
            setEditingPlan(null);
            toast.success("Plan updated successfully");
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Plan"
        message="Are you sure you want to delete this plan? Active subscribers will need to be migrated."
        confirmLabel="Delete Plan"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingPlanId(null); }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PLAN MODAL
// ══════════════════════════════════════════════════════════════════════════════

const ALL_FEATURES = [
  "Student Management", "Teacher Management", "Attendance", "Fee Management",
  "Exam Module", "Timetable", "Transport", "Hostel", "Library",
  "SMS Gateway", "Email Notifications", "Push Notifications",
  "Basic Reports", "Advanced Analytics", "Custom Reports",
  "API Access", "Webhooks", "White Labeling",
  "Multi-Campus", "Custom Modules", "Dedicated Support",
  "Priority Support", "Email Support", "Phone Support",
  "SLA 99.9%", "On-Premise Option", "Source Code Access",
];

function PlanModal({ title, initialData, onClose, onSave }: {
  title: string;
  initialData?: Plan;
  onClose: () => void;
  onSave: (plan: Partial<Plan>) => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || "Monthly" as Plan["type"],
    price: initialData?.price || 0,
    billingCycle: initialData?.billingCycle || "monthly",
    features: initialData?.features || [] as string[],
    limits: initialData?.limits || { maxStudents: 500, maxTeachers: 50, maxStorage: 5, maxApiCalls: 10000 },
    discount: initialData?.discount || 0,
    isPopular: initialData?.isPopular || false,
    status: initialData?.status || "active" as Plan["status"],
  });

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Plan Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Professional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Plan["type"] })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Lifetime">Lifetime</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brief description of the plan..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Price (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Billing Cycle</label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="one-time">One-time</option>
                <option value="14-days">14 Days (Trial)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Discount (%)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                min={0}
                max={100}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Limits */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Plan Limits</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Max Students</label>
                <input
                  type="number"
                  value={formData.limits.maxStudents}
                  onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxStudents: Number(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Max Teachers</label>
                <input
                  type="number"
                  value={formData.limits.maxTeachers}
                  onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxTeachers: Number(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Storage (GB)</label>
                <input
                  type="number"
                  value={formData.limits.maxStorage}
                  onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxStorage: Number(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">API Calls/mo</label>
                <input
                  type="number"
                  value={formData.limits.maxApiCalls}
                  onChange={(e) => setFormData({ ...formData, limits: { ...formData.limits, maxApiCalls: Number(e.target.value) } })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Features ({formData.features.length} selected)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {ALL_FEATURES.map((feature) => (
                <label key={feature} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded p-1.5 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="truncate">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Popular toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPopular}
              onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark as Popular (highlighted in pricing page)</span>
          </label>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(formData as Partial<Plan>)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            {initialData ? "Update Plan" : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PLAN COMPARISON VIEW
// ══════════════════════════════════════════════════════════════════════════════

function PlanComparisonView({ plans }: { plans: Plan[] }) {
  const activePlans = plans.filter((p) => p.status === "active");
  const allFeatures = [...new Set(activePlans.flatMap((p) => p.features))];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Plan Comparison Matrix</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Side-by-side feature comparison of all active plans</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 min-w-[200px]">Feature</th>
              {activePlans.map((plan) => (
                <th key={plan.id} className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 min-w-[140px]">
                  <div className="flex flex-col items-center gap-1">
                    <span>{plan.name}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm normal-case">{formatCurrency(plan.price)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {allFeatures.map((feature) => (
              <tr key={feature} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">{feature}</td>
                {activePlans.map((plan) => (
                  <td key={plan.id} className="px-4 py-2.5 text-center">
                    {plan.features.includes(feature) ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {/* Limits */}
            <tr className="bg-slate-50 dark:bg-slate-800/30">
              <td colSpan={activePlans.length + 1} className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Limits</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">Max Students</td>
              {activePlans.map((plan) => (
                <td key={plan.id} className="px-4 py-2.5 text-center text-sm font-medium text-slate-900 dark:text-white">{formatNumber(plan.limits.maxStudents)}</td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">Max Teachers</td>
              {activePlans.map((plan) => (
                <td key={plan.id} className="px-4 py-2.5 text-center text-sm font-medium text-slate-900 dark:text-white">{formatNumber(plan.limits.maxTeachers)}</td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">Storage</td>
              {activePlans.map((plan) => (
                <td key={plan.id} className="px-4 py-2.5 text-center text-sm font-medium text-slate-900 dark:text-white">{plan.limits.maxStorage} GB</td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">API Calls/month</td>
              {activePlans.map((plan) => (
                <td key={plan.id} className="px-4 py-2.5 text-center text-sm font-medium text-slate-900 dark:text-white">{formatNumber(plan.limits.maxApiCalls)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BILLING HISTORY TAB
// ══════════════════════════════════════════════════════════════════════════════

function BillingTab() {
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/subscriptions/billing", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawData = res.data.success ? (res.data.data?.data || res.data.data || []) : [];
      if (rawData.length > 0) {
        // Map API response to BillingRecord format
        const mapped: BillingRecord[] = rawData.map((item: any) => ({
          id: item.id,
          tenant: item.tenant?.name || item.tenantId || "Unknown",
          tenantLogo: (item.tenant?.name || "T").substring(0, 3).toUpperCase(),
          plan: item.plan?.name || item.planId || "—",
          amount: item.amount || item.plan?.price || 0,
          date: item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : "—",
          status: (item.paymentStatus || item.status || "pending").toLowerCase(),
          method: item.paymentMethod || "—",
          transactionId: item.transactionId || item.id?.slice(-8) || "—",
        }));
        setBilling(mapped);
      } else {
        setBilling([]);
      }
    } catch {
      setBilling([]);
    } finally {
      setBillingLoading(false);
    }
  };

  const filteredBilling = useMemo(() => {
    let result = [...billing];
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (dateRange.from) {
      result = result.filter((b) => b.date >= dateRange.from);
    }
    if (dateRange.to) {
      result = result.filter((b) => b.date <= dateRange.to);
    }
    return result;
  }, [billing, statusFilter, dateRange]);

  const billingColumns: Column<BillingRecord>[] = [
    {
      key: "tenant",
      label: "Tenant",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {row.tenantLogo}
          </div>
          <span className="font-medium text-slate-900 dark:text-white">{row.tenant}</span>
        </div>
      ),
    },
    { key: "plan", label: "Plan" },
    {
      key: "amount",
      label: "Amount",
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const variant = row.status === "paid" ? "success" : row.status === "pending" ? "warning" : row.status === "failed" ? "error" : "info";
        return <StatusBadge status={row.status} />;
      },
    },
    { key: "method", label: "Method" },
    {
      key: "transactionId",
      label: "Transaction ID",
      render: (row) => <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{row.transactionId}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          placeholder="From"
        />
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          placeholder="To"
        />
        {(statusFilter !== "all" || dateRange.from || dateRange.to) && (
          <button
            onClick={() => { setStatusFilter("all"); setDateRange({ from: "", to: "" }); }}
            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      <DataTable
        columns={billingColumns}
        data={filteredBilling}
        title="Payment History"
        subtitle={`${filteredBilling.length} transactions`}
        searchPlaceholder="Search transactions..."
        onExportCSV={() => toast.success("Exported to CSV")}
        onExportExcel={() => toast.success("Exported to Excel")}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INVOICES TAB
// ══════════════════════════════════════════════════════════════════════════════

function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/subscriptions/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawData = res.data.success ? (res.data.data?.data || res.data.data || []) : [];
      if (rawData.length > 0) {
        const mapped: Invoice[] = rawData.map((item: any, idx: number) => ({
          id: item.id,
          invoiceNumber: item.invoiceNumber || `INV-${new Date().getFullYear()}-${String(idx + 1).padStart(4, "0")}`,
          tenant: item.tenant?.name || "Unknown",
          plan: item.plan?.name || "—",
          amount: item.amount || item.plan?.price || 0,
          tax: Math.round((item.amount || item.plan?.price || 0) * 0.18),
          total: Math.round((item.amount || item.plan?.price || 0) * 1.18),
          status: (item.paymentStatus || item.status || "pending").toLowerCase(),
          issuedDate: item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : "—",
          dueDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "—",
        }));
        setInvoices(mapped);
      }
    } catch {
      setInvoices([]);
    }
  };

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      render: (row) => (
        <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">{row.invoiceNumber}</span>
      ),
    },
    {
      key: "tenant",
      label: "Tenant",
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.tenant}</span>,
    },
    { key: "plan", label: "Plan" },
    {
      key: "amount",
      label: "Subtotal",
      render: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "tax",
      label: "Tax (GST)",
      render: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{formatCurrency(row.tax)}</span>,
    },
    {
      key: "total",
      label: "Total",
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(row.total)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "issuedDate",
      label: "Issued",
      render: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(row.issuedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewInvoice(row); setShowPreview(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toast.success("Invoice downloaded"); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toast.success("Invoice sent to tenant"); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={invoiceColumns}
        data={invoices}
        title="Invoices"
        subtitle={`${invoices.length} invoices generated`}
        searchPlaceholder="Search invoices..."
        onExportCSV={() => toast.success("Exported to CSV")}
        headerActions={
          <button
            onClick={() => toast.success("New invoice generated")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Invoice
          </button>
        }
      />

      {/* Invoice Preview Modal */}
      {showPreview && previewInvoice && (
        <InvoicePreviewModal invoice={previewInvoice} onClose={() => { setShowPreview(false); setPreviewInvoice(null); }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INVOICE PREVIEW MODAL
// ══════════════════════════════════════════════════════════════════════════════

function InvoicePreviewModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => toast.success("Downloaded")} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">INVOICE</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">College ERP Platform</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">123 Tech Park, Sector 62</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Noida, UP 201301</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">GSTIN: 07AAGCR4375J1ZS</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-1">Bill To</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{invoice.tenant}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Plan: {invoice.plan}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Issued: {new Date(invoice.issuedDate).toLocaleDateString("en-IN")}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Due: {new Date(invoice.dueDate).toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          {/* Items */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{invoice.plan} Plan Subscription</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-medium">{formatCurrency(invoice.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">GST (18%)</span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white">Total</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COUPONS TAB
// ══════════════════════════════════════════════════════════════════════════════

function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/subscriptions/coupons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawData = res.data.success ? (res.data.data || []) : [];
      if (rawData.length > 0) {
        setCoupons(rawData);
      }
    } catch {
      setCoupons([]);
    }
  };

  const handleToggleCoupon = (id: string) => {
    setCoupons(coupons.map((c) => c.id === id ? { ...c, status: c.status === "active" ? "inactive" : "active" } : c));
    toast.success("Coupon status updated");
  };

  const couponColumns: Column<Coupon>[] = [
    {
      key: "code",
      label: "Coupon Code",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{row.code}</span>
        </div>
      ),
    },
    {
      key: "discountType",
      label: "Discount",
      render: (row) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          {row.discountType === "percentage" ? `${row.discountValue}%` : formatCurrency(row.discountValue)}
        </span>
      ),
    },
    {
      key: "validity",
      label: "Validity",
      render: (row) => (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p>{new Date(row.validFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - {new Date(row.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (row) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.usedCount}/{row.usageLimit}</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${Math.min(100, (row.usedCount / row.usageLimit) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "applicablePlans",
      label: "Applicable Plans",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.applicablePlans.slice(0, 2).map((plan) => (
            <span key={plan} className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
              {plan}
            </span>
          ))}
          {row.applicablePlans.length > 2 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
              +{row.applicablePlans.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleCoupon(row.id); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title={row.status === "active" ? "Deactivate" : "Activate"}
          >
            {row.status === "active" ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toast.success("Coupon deleted"); setCoupons(coupons.filter((c) => c.id !== row.id)); }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={couponColumns}
        data={coupons}
        title="Coupons & Promotions"
        subtitle={`${coupons.filter((c) => c.status === "active").length} active coupons`}
        searchPlaceholder="Search coupons..."
        headerActions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        }
      />

      {/* Coupon Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Redemptions</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNumber(coupons.reduce((sum, c) => sum + c.usedCount, 0))}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Discount Given</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(456780)}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Conversion Uplift</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">+23.5%</p>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <CouponModal
          onClose={() => setShowCreateModal(false)}
          onSave={(coupon) => {
            setCoupons([...coupons, { ...coupon, id: `coup-${Date.now()}`, usedCount: 0, status: "active" }]);
            setShowCreateModal(false);
            toast.success("Coupon created successfully");
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COUPON MODAL
// ══════════════════════════════════════════════════════════════════════════════

function CouponModal({ onClose, onSave }: { onClose: () => void; onSave: (coupon: any) => void }) {
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 10,
    validFrom: "",
    validUntil: "",
    usageLimit: 100,
    applicablePlans: [] as string[],
  });

  const togglePlan = (plan: string) => {
    setFormData((prev) => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(plan)
        ? prev.applicablePlans.filter((p) => p !== plan)
        : [...prev.applicablePlans, plan],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Coupon</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Coupon Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., SAVE20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percentage" | "fixed" })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brief description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Discount Value</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Valid From</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Valid Until</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Applicable Plans</label>
            <div className="flex flex-wrap gap-2">
              {["Starter", "Professional", "Enterprise", "Lifetime"].map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => togglePlan(plan)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    formData.applicablePlans.includes(plan)
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            Create Coupon
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAX / GST TAB
// ══════════════════════════════════════════════════════════════════════════════

function TaxTab() {
  const [config, setConfig] = useState<TaxConfig>(MOCK_TAX_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Tax configuration saved successfully");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* GST Configuration */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">GST Configuration</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure tax settings for invoice generation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.gstEnabled}
                onChange={(e) => setConfig({ ...config, gstEnabled: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable GST</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">GST Rate (%)</label>
              <input
                type="number"
                value={config.gstRate}
                onChange={(e) => setConfig({ ...config, gstRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">GSTIN Number</label>
              <input
                type="text"
                value={config.gstNumber}
                onChange={(e) => setConfig({ ...config, gstNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 07AAGCR4375J1ZS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">PAN Number</label>
              <input
                type="text"
                value={config.panNumber}
                onChange={(e) => setConfig({ ...config, panNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., AAGCR4375J"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">SAC Code (HSN)</label>
              <input
                type="text"
                value={config.sacCode}
                onChange={(e) => setConfig({ ...config, sacCode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Place of Supply</label>
              <input
                type="text"
                value={config.placeOfSupply}
                onChange={(e) => setConfig({ ...config, placeOfSupply: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.igstEnabled}
                onChange={(e) => setConfig({ ...config, igstEnabled: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable IGST (Inter-state)</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cess Rate (%)</label>
              <input
                type="number"
                value={config.cessRate}
                onChange={(e) => setConfig({ ...config, cessRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Invoice Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Invoice Prefix</label>
              <input
                type="text"
                value={config.invoicePrefix}
                onChange={(e) => setConfig({ ...config, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Starting Number</label>
              <input
                type="number"
                value={config.invoiceStartNumber}
                onChange={(e) => setConfig({ ...config, invoiceStartNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Tax Reports Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Tax Collected (FY)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(1845672)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+18% vs last FY</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">CGST Collected</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(922836)}</p>
          <p className="text-xs text-slate-400 mt-1">9% of revenue</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">SGST Collected</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(922836)}</p>
          <p className="text-xs text-slate-400 mt-1">9% of revenue</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REFUNDS TAB
// ══════════════════════════════════════════════════════════════════════════════

function RefundsTab() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState<Refund | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/super-admin/subscriptions/refunds", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawData = res.data.success ? (res.data.data || []) : [];
      if (rawData.length > 0) {
        setRefunds(rawData);
      }
    } catch {
      setRefunds([]);
    }
  };

  const handleProcessRefund = (id: string, action: "approve" | "reject") => {
    setRefunds(refunds.map((r) =>
      r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected", processedDate: new Date().toISOString().split("T")[0] } : r
    ));
    toast.success(`Refund ${action === "approve" ? "approved" : "rejected"} successfully`);
    setShowProcessModal(false);
    setProcessingRefund(null);
  };

  const refundColumns: Column<Refund>[] = [
    {
      key: "tenant",
      label: "Tenant",
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.tenant}</span>,
    },
    { key: "plan", label: "Plan" },
    {
      key: "amount",
      label: "Amount",
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => <span className="text-sm text-slate-600 dark:text-slate-300 max-w-[200px] truncate block">{row.reason}</span>,
    },
    {
      key: "requestDate",
      label: "Requested",
      render: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(row.requestDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === "pending" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleProcessRefund(row.id, "approve"); }}
                className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                title="Approve"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleProcessRefund(row.id, "reject"); }}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setProcessingRefund(row); setShowProcessModal(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Refund Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending</span>
          </div>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-100 mt-1">{refunds.filter((r) => r.status === "pending").length}</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Processing</span>
          </div>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">{refunds.filter((r) => r.status === "processing").length}</p>
        </div>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Completed</span>
          </div>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{refunds.filter((r) => r.status === "completed" || r.status === "approved").length}</p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/50">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Rejected</span>
          </div>
          <p className="text-xl font-bold text-red-900 dark:text-red-100 mt-1">{refunds.filter((r) => r.status === "rejected").length}</p>
        </div>
      </div>

      <DataTable
        columns={refundColumns}
        data={refunds}
        title="Refund Requests"
        subtitle={`${refunds.length} total refund requests`}
        searchPlaceholder="Search refunds..."
        onExportCSV={() => toast.success("Exported to CSV")}
      />

      {/* Refund Detail Modal */}
      {showProcessModal && processingRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Refund Details</h2>
              <button onClick={() => { setShowProcessModal(false); setProcessingRefund(null); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tenant</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{processingRefund.tenant}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Plan</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{processingRefund.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Amount</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(processingRefund.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                  <StatusBadge status={processingRefund.status} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Request Date</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{processingRefund.requestDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Method</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{processingRefund.method}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Reason</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">{processingRefund.reason}</p>
              </div>
            </div>
            {processingRefund.status === "pending" && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  onClick={() => handleProcessRefund(processingRefund.id, "reject")}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleProcessRefund(processingRefund.id, "approve")}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Approve Refund
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ══════════════════════════════════════════════════════════════════════════════

function AnalyticsTab() {
  const [period, setPeriod] = useState("12months");
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {[
          { value: "7days", label: "7 Days" },
          { value: "30days", label: "30 Days" },
          { value: "6months", label: "6 Months" },
          { value: "12months", label: "12 Months" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              period === opt.value
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl text-white">
          <p className="text-sm opacity-80">MRR</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(724000)}</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm">+12.5% this month</span>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl text-white">
          <p className="text-sm opacity-80">ARR</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(8688000)}</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm">+45% YoY</span>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl text-white">
          <p className="text-sm opacity-80">Churn Rate</p>
          <p className="text-2xl font-bold mt-1">2.1%</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-sm">-0.3% improvement</span>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl text-white">
          <p className="text-sm opacity-80">ARPU</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(1691)}</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm">+5.4% this month</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Chart */}
        <ChartCard title="Monthly Recurring Revenue" subtitle="Revenue trend over 12 months">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_MRR_DATA}>
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
                itemStyle={{ color: "#a5b4fc" }}
                formatter={(value: any) => [formatCurrency(value), "MRR"]}
              />
              <Area type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2} fill="url(#mrrGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ARR Trend */}
        <ChartCard title="Annual Recurring Revenue" subtitle="ARR projection based on current MRR">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_MRR_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
                formatter={(value: any) => [formatCurrency(value), "ARR"]}
              />
              <Line type="monotone" dataKey="arr" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution Pie */}
        <ChartCard title="Plan Distribution" subtitle="Subscriber breakdown by plan type">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={MOCK_PLAN_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {MOCK_PLAN_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue by Plan Bar Chart */}
        <ChartCard title="Revenue by Plan" subtitle="Total revenue collected per plan type">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_REVENUE_BY_PLAN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="plan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f1f5f9" }}
                formatter={(value: any) => [formatCurrency(value), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {MOCK_REVENUE_BY_PLAN.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Subscriber Growth */}
      <ChartCard title="Subscriber Growth" subtitle="Total active subscribers over time" height="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_MRR_DATA}>
            <defs>
              <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value: any) => [value, "Subscribers"]}
            />
            <Area type="monotone" dataKey="subscribers" stroke="#8b5cf6" strokeWidth={2} fill="url(#subGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

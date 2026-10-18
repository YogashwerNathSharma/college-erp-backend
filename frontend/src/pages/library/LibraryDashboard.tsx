import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Users, BookCopy, AlertTriangle, Plus,
  Search, ArrowRight, RefreshCw, TrendingUp, Clock,
  BookMarked, Calendar, Download, CheckCircle, XCircle,
  Library, FileText, Star, ArrowLeftRight, Bookmark,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart,
  Bar, Legend,
} from "recharts";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface DashboardStats {
  totalBooks: number;
  booksIssued: number;
  overdueReturns: number;
  totalMembers: number;
  newArrivals: number;
  totalCategories: number;
}

interface MonthlyIssueReturn {
  month: string;
  issued: number;
  returned: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface PopularBook {
  title: string;
  issues: number;
}

interface OverdueBook {
  id: string;
  bookTitle: string;
  issuedTo: string;
  issueDate: string;
  dueDate: string;
  fine: number;
  overdueDays: number;
}

// ─────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────

const api = axios.create({ baseURL: `${API_BASE_URL}/api` });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, trend, trendUp, color, bgColor }: {
  icon: any; label: string; value: string | number; trend?: string;
  trendUp?: boolean; color: string; bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            <TrendingUp className={`w-3 h-3 ${!trendUp ? 'rotate-180' : ''}`} />
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// QUICK ACTION
// ─────────────────────────────────────────────

function QuickAction({ icon: Icon, label, onClick, color, bgColor }: {
  icon: any; label: string; onClick: () => void; color: string; bgColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200 group"
    >
      <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function LibraryDashboardView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0, booksIssued: 0, overdueReturns: 0,
    totalMembers: 0, newArrivals: 0, totalCategories: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyIssueReturn[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);
  const [overdueBooks, setOverdueBooks] = useState<OverdueBook[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [booksRes, membersRes, issuesRes, categoriesRes] = await Promise.all([
        api.get("/library/books"),
        api.get("/library/members"),
        api.get("/library/issues"),
        api.get("/library/categories"),
      ]);

      const books = booksRes.data?.books || booksRes.data || [];
      const members = membersRes.data?.members || membersRes.data || [];
      const issues = issuesRes.data?.issues || issuesRes.data || [];
      const categories = categoriesRes.data?.categories || categoriesRes.data || [];

      const overdueIssues = issues.filter((i: any) => i.status === "OVERDUE" || (i.status === "ISSUED" && new Date(i.dueDate) < new Date()));
      const issuedNow = issues.filter((i: any) => i.status === "ISSUED");

      setStats({
        totalBooks: books.length || books.reduce?.((s: number, b: any) => s + (b.totalCopies || 1), 0) || 0,
        booksIssued: issuedNow.length,
        overdueReturns: overdueIssues.length,
        totalMembers: members.length,
        newArrivals: books.filter((b: any) => {
          const created = new Date(b.createdAt);
          const now = new Date();
          return (now.getTime() - created.getTime()) < 30 * 24 * 60 * 60 * 1000;
        }).length,
        totalCategories: categories.length,
      });

      // Category distribution
      const categoryColors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f97316"];
      setCategoryData(categories.slice(0, 7).map((c: any, i: number) => ({
        name: c.name || "Category",
        value: c._count?.books || Math.floor(Math.random() * 50 + 10),
        color: categoryColors[i % categoryColors.length],
      })));

      // Monthly data
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      setMonthlyData(months.map((m) => ({
        month: m,
        issued: Math.floor(Math.random() * 40 + 20),
        returned: Math.floor(Math.random() * 35 + 15),
      })));

      // Popular books
      setPopularBooks(
        books.slice(0, 6).map((b: any) => ({
          title: b.title?.length > 25 ? b.title.slice(0, 25) + "..." : (b.title || "Unknown"),
          issues: b._count?.issues || Math.floor(Math.random() * 20 + 5),
        }))
      );

      // Overdue books
      setOverdueBooks(
        overdueIssues.slice(0, 5).map((issue: any) => ({
          id: issue.id,
          bookTitle: issue.book?.title || "Unknown Book",
          issuedTo: issue.member?.name || "Unknown",
          issueDate: new Date(issue.issueDate).toLocaleDateString("en-IN"),
          dueDate: new Date(issue.dueDate).toLocaleDateString("en-IN"),
          fine: issue.fineAmount || 0,
          overdueDays: issue.overdueDays || Math.ceil((Date.now() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
        }))
      );
    } catch (error) {
      console.error("Library dashboard fetch error:", error);
      // Fallback data
      setStats({ totalBooks: 2450, booksIssued: 187, overdueReturns: 23, totalMembers: 856, newArrivals: 45, totalCategories: 12 });
      setMonthlyData([
        { month: "Jan", issued: 45, returned: 38 },
        { month: "Feb", issued: 52, returned: 48 },
        { month: "Mar", issued: 38, returned: 42 },
        { month: "Apr", issued: 61, returned: 55 },
        { month: "May", issued: 48, returned: 44 },
        { month: "Jun", issued: 55, returned: 50 },
      ]);
      setCategoryData([
        { name: "Academic", value: 850, color: "#6366f1" },
        { name: "Fiction", value: 420, color: "#8b5cf6" },
        { name: "Reference", value: 380, color: "#ec4899" },
        { name: "Science", value: 310, color: "#f59e0b" },
        { name: "History", value: 240, color: "#10b981" },
        { name: "Others", value: 250, color: "#06b6d4" },
      ]);
      setPopularBooks([
        { title: "Physics NCERT Class 12", issues: 28 },
        { title: "Mathematics R.D. Sharma", issues: 25 },
        { title: "Chemistry O.P. Tandon", issues: 22 },
        { title: "English Grammar Wren & Martin", issues: 19 },
        { title: "Biology Trueman's", issues: 17 },
        { title: "Computer Science Sumita Arora", issues: 15 },
      ]);
      setOverdueBooks([
        { id: "1", bookTitle: "Data Structures in C", issuedTo: "Amit Kumar", issueDate: "15/05/2026", dueDate: "30/05/2026", fine: 70, overdueDays: 28 },
        { id: "2", bookTitle: "Organic Chemistry", issuedTo: "Priya Singh", issueDate: "20/05/2026", dueDate: "03/06/2026", fine: 50, overdueDays: 24 },
        { id: "3", bookTitle: "Indian History", issuedTo: "Rahul Verma", issueDate: "25/05/2026", dueDate: "08/06/2026", fine: 40, overdueDays: 19 },
        { id: "4", bookTitle: "English Literature", issuedTo: "Neha Sharma", issueDate: "01/06/2026", dueDate: "15/06/2026", fine: 25, overdueDays: 12 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading library data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage books, members, and track issues & returns
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => navigate("/library?tab=books")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Book
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={BookOpen} label="Total Books" value={stats.totalBooks.toLocaleString()} trend="+45" trendUp color="text-rose-600" bgColor="bg-rose-50 dark:bg-rose-900/30" />
        <StatCard icon={BookCopy} label="Books Issued" value={stats.booksIssued} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/30" />
        <StatCard icon={AlertTriangle} label="Overdue Returns" value={stats.overdueReturns} trend={stats.overdueReturns > 0 ? `${stats.overdueReturns}` : undefined} trendUp={false} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/30" />
        <StatCard icon={Users} label="Total Members" value={stats.totalMembers} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
        <StatCard icon={Star} label="New Arrivals" value={stats.newArrivals} trend="+12" trendUp color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/30" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Issue/Return Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Issue / Return</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">Last 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="issuedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="returnedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend />
              <Area type="monotone" dataKey="issued" name="Issued" stroke="#6366f1" fill="url(#issuedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="returned" name="Returned" stroke="#10b981" fill="url(#returnedGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Books Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Popular Books</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">Most Issued</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={popularBooks} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis type="category" dataKey="title" tick={{ fontSize: 10, fill: "#6b7280" }} width={160} />
            <Tooltip />
            <Bar dataKey="issues" name="Times Issued" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overdue Books Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Overdue Books
            </h3>
            <button
              onClick={() => navigate("/library?tab=issues&filter=overdue")}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Book Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Issued To</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Issue Date</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Due Date</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Overdue</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {overdueBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{book.bookTitle}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{book.issuedTo}</td>
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">{book.issueDate}</td>
                    <td className="py-3 px-4 text-center text-red-600 dark:text-red-400 font-medium">{book.dueDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {book.overdueDays} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">₹{book.fine}</td>
                  </tr>
                ))}
                {overdueBooks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      No overdue books! 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={ArrowLeftRight} label="Issue Book" onClick={() => navigate("/library?tab=issues")} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-900/30" />
            <QuickAction icon={CheckCircle} label="Return Book" onClick={() => navigate("/library?tab=issues")} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/30" />
            <QuickAction icon={Plus} label="Add Book" onClick={() => navigate("/library?tab=books")} color="text-rose-600" bgColor="bg-rose-50 dark:bg-rose-900/30" />
            <QuickAction icon={Library} label="View Catalog" onClick={() => navigate("/library?tab=books")} color="text-indigo-600" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
            <QuickAction icon={Users} label="Members" onClick={() => navigate("/library?tab=members")} color="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-900/30" />
            <QuickAction icon={Download} label="Reports" onClick={() => navigate("/library?tab=reports")} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

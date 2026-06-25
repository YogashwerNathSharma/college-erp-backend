
// ============================================
// LIBRARY DASHBOARD — Complete Library Management UI
// School ERP - Single File Component with Tabs
// Style: Same as SuperAdminSettings/TenantAdminSettings


import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";
import {
  BookOpen, Users, BookCopy, AlertTriangle, DollarSign,
  Plus, Search, Filter, Edit2, Trash2, Eye, RefreshCw,
  ArrowLeftRight, BarChart3, Settings, Loader2, X,
  BookMarked, UserCheck, Calendar, Clock, ChevronLeft,
  ChevronRight, Download, TrendingUp, Library, FileText,
  CheckCircle, XCircle, AlertCircle, Hash
} from "lucide-react";

// ==================== TYPES ====================
interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  categoryId: string;
  category?: { id: string; name: string };
  language: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation?: string;
  coverImageUrl?: string;
  description?: string;
  price?: number;
  pages?: number;
  publishYear?: number;
  createdAt: string;
}

interface BookCategory {
  id: string;
  name: string;
  description?: string;
  _count?: { books: number };
}

interface LibraryMember {
  id: string;
  membershipId: string;
  memberType: string;
  name: string;
  email?: string;
  phone?: string;
  class?: string;
  maxBooksAllowed: number;
  currentBooksIssued: number;
  status: string;
  createdAt: string;
}

interface BookIssue {
  id: string;
  bookId: string;
  memberId: string;
  memberType: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  fineAmount: number;
  fineStatus?: string;
  remarks?: string;
  issuedBy: string;
  returnedBy?: string;
  book?: { title: string; author: string };
  member?: { name: string; membershipId: string; memberType?: string; phone?: string };
  overdueDays?: number;
  calculatedFine?: number;
}

interface DashboardStats {
  totalBooks: number;
  uniqueBooks: number;
  totalMembers: number;
  booksIssued: number;
  overdueBooks: number;
  totalFineCollected: number;
  recentActivity: BookIssue[];
}

interface LibrarySettings {
  id: string;
  maxBooksPerStudent: number;
  maxBooksPerTeacher: number;
  maxBooksPerStaff: number;
  issueDurationDays: number;
  finePerDay: number;
  allowRenewal: boolean;
  maxRenewals: number;
  lostBookFineMultiplier: number;
  workingDaysOnly: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== API HELPER ====================
const API_BASE = `${API_BASE_URL}/api/library`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const apiCall = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: getHeaders(),
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Something went wrong");
  return data;
};

// ==================== MAIN COMPONENT ====================
const LibraryDashboard: React.FC = () => {
  // Tab state
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validLibraryTabs = ["dashboard", "books", "members", "issue-return", "reports", "settings"];
  const hideTabsBar = tabFromUrl && validLibraryTabs.includes(tabFromUrl);

  const [activeTab, setActiveTab] = useState<string>(
    tabFromUrl && validLibraryTabs.includes(tabFromUrl) ? tabFromUrl : "dashboard"
  );
  
  // Tabs config — same style as TenantAdminSettings
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "books", label: "Books", icon: BookOpen },
    { id: "members", label: "Members", icon: Users },
    { id: "issue-return", label: "Issue / Return", icon: ArrowLeftRight },
    { id: "reports", label: "Reports", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Library className="w-8 h-8 text-primary-600" />
          Library Management
        </h1>
        <p className="text-slate-500 mt-1">Manage books, members, and transactions</p>
      </div>

      {/* Tab Navigation — indigo style */}
      {!hideTabsBar && <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600 bg-primary-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>}

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "books" && <BooksTab />}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "issue-return" && <IssueReturnTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
};

// ==================== DASHBOARD TAB ====================
const DashboardTab: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [libraryModal, setLibraryModal] = useState<{ open: boolean; type: string }>({ open: false, type: "" });
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiCall("/dashboard");
      setStats(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (type: string) => {
    setLibraryModal({ open: true, type });
    setModalLoading(true);
    setModalData([]);
    try {
      let res: any;
      switch (type) {
        case "totalBooks":
          res = await apiCall("/books?page=1&limit=100");
          setModalData(res.data.books || []);
          break;
        case "activeMembers":
          res = await apiCall("/members?page=1&limit=100&status=ACTIVE");
          setModalData(res.data.members || []);
          break;
        case "booksIssued":
          res = await apiCall("/overdue");
          // overdue gives currently issued + overdue; for "issued" we show all active
          const dashRes = await apiCall("/dashboard");
          setModalData(dashRes.data.recentActivity?.filter((i: any) => i.status === "ISSUED") || dashRes.data.recentActivity || []);
          break;
        case "overdueBooks":
          res = await apiCall("/overdue");
          setModalData(res.data || []);
          break;
        case "fineCollected":
          res = await apiCall("/overdue");
          setModalData((res.data || []).filter((item: any) => item.fineAmount > 0 || item.calculatedFine > 0));
          break;
        default:
          setModalData([]);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (libraryModal.type) {
      case "totalBooks": return "All Books";
      case "activeMembers": return "Active Members";
      case "booksIssued": return "Books Currently Issued";
      case "overdueBooks": return "Overdue Books";
      case "fineCollected": return "Fine Records";
      default: return "Details";
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const statCards = [
    { label: "Total Books", value: stats.totalBooks, icon: BookOpen, color: "from-primary-500 to-primary-600", subtext: `${stats.uniqueBooks} unique titles`, type: "totalBooks" },
    { label: "Active Members", value: stats.totalMembers, icon: Users, color: "from-green-500 to-green-600", subtext: "Registered members", type: "activeMembers" },
    { label: "Books Issued", value: stats.booksIssued, icon: BookCopy, color: "from-purple-500 to-purple-600", subtext: "Currently issued", type: "booksIssued" },
    { label: "Overdue Books", value: stats.overdueBooks, icon: AlertTriangle, color: "from-orange-500 to-orange-600", subtext: "Need attention", type: "overdueBooks" },
    { label: "Fine Collected", value: `₹${stats.totalFineCollected}`, icon: DollarSign, color: "from-emerald-500 to-emerald-600", subtext: "Total collected", type: "fineCollected" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards — colorful gradient, clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => handleCardClick(card.type)}
              className={`bg-gradient-to-br ${card.color} rounded-xl p-5 text-white shadow-lg cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">{card.value}</span>
              </div>
              <p className="text-sm font-medium opacity-90">{card.label}</p>
              <p className="text-xs opacity-70 mt-1">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
          <button onClick={fetchDashboard} className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {stats.recentActivity.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No recent activity yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Book</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Member</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Date</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Fine</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <p className="font-medium text-slate-700">{item.book?.title}</p>
                      <p className="text-xs text-slate-400">{item.book?.author}</p>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-slate-700">{item.member?.name}</p>
                      <p className="text-xs text-slate-400">{item.member?.membershipId}</p>
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {new Date(item.issueDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-2">
                      {item.fineAmount > 0 ? (
                        <span className="text-red-600 font-medium">₹{item.fineAmount}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clickable Card Modal */}
      {libraryModal.open && (
        <div className="fixed inset-0 bg-black/60 z-[9000] flex items-center justify-center p-0 sm:p-4" onClick={() => setLibraryModal({ open: false, type: "" })}>
          <div
            className="bg-white w-full h-[100vh] sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:w-full flex flex-col rounded-none sm:rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">{getModalTitle()}</h2>
              <button
                onClick={() => setLibraryModal({ open: false, type: "" })}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : modalData.length === 0 ? (
                <p className="text-center text-slate-400 py-12">No records found</p>
              ) : (
                <div className="space-y-3">
                  {/* Total Books List */}
                  {libraryModal.type === "totalBooks" && modalData.map((book: any) => (
                    <div key={book.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{book.title}</p>
                        <p className="text-sm text-slate-500">{book.author}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-slate-700">{book.availableCopies}/{book.totalCopies}</p>
                        <p className="text-xs text-slate-400">available</p>
                      </div>
                    </div>
                  ))}

                  {/* Active Members List */}
                  {libraryModal.type === "activeMembers" && modalData.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-green-200 transition-colors">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.membershipId} • {member.memberType}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-slate-700">{member.currentBooksIssued}/{member.maxBooksAllowed}</p>
                        <p className="text-xs text-slate-400">books issued</p>
                      </div>
                    </div>
                  ))}

                  {/* Books Issued List */}
                  {libraryModal.type === "booksIssued" && modalData.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-purple-200 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <BookCopy className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.book?.title || "Unknown Book"}</p>
                        <p className="text-sm text-slate-500">{item.member?.name || "Unknown"} • {item.member?.membershipId || ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-slate-700">{new Date(item.dueDate).toLocaleDateString("en-IN")}</p>
                        <p className="text-xs text-slate-400">due date</p>
                      </div>
                    </div>
                  ))}

                  {/* Overdue Books List */}
                  {libraryModal.type === "overdueBooks" && modalData.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-orange-200 transition-colors">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.book?.title || "Unknown Book"}</p>
                        <p className="text-sm text-slate-500">{item.member?.name || "Unknown"} • {item.member?.membershipId || ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-red-600">{item.overdueDays || 0} days</p>
                        <p className="text-xs text-slate-400">overdue</p>
                      </div>
                    </div>
                  ))}

                  {/* Fine Collected List */}
                  {libraryModal.type === "fineCollected" && modalData.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.book?.title || "Unknown Book"}</p>
                        <p className="text-sm text-slate-500">{item.member?.name || "Unknown"} • {item.member?.membershipId || ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-emerald-700">₹{item.fineAmount || item.calculatedFine || 0}</p>
                        <p className="text-xs text-slate-400">fine</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== BOOKS TAB ====================
const BooksTab: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Book form state
  const [bookForm, setBookForm] = useState({
    title: "", author: "", isbn: "", publisher: "", edition: "",
    categoryId: "", language: "English", totalCopies: 1,
    shelfLocation: "", coverImageUrl: "", description: "",
    price: 0, pages: 0, publishYear: new Date().getFullYear(),
  });

  // Category form
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [pagination.page, search, filterCategory]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      let url = `/books?page=${pagination.page}&limit=10`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterCategory) url += `&categoryId=${filterCategory}`;
      const res = await apiCall(url);
      setBooks(res.data.books);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiCall("/categories");
      setCategories(res.data);
    } catch (err: any) {
      console.error("Categories fetch failed:", err);
    }
  };

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await apiCall(`/books/${editingBook.id}`, { method: "PUT", body: JSON.stringify(bookForm) });
        toast.success("Book updated successfully! 📖");
      } else {
        await apiCall("/books", { method: "POST", body: JSON.stringify(bookForm) });
        toast.success("Book added successfully! 📚");
      }
      setShowModal(false);
      resetBookForm();
      fetchBooks();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("Kya aap sure hain? Book delete ho jayegi!")) return;
    try {
      await apiCall(`/books/${id}`, { method: "DELETE" });
      toast.success("Book deleted! 🗑️");
      fetchBooks();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall("/categories", { method: "POST", body: JSON.stringify(categoryForm) });
      toast.success("Category created! 📂");
      setShowCategoryModal(false);
      setCategoryForm({ name: "", description: "" });
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title, author: book.author, isbn: book.isbn || "",
      publisher: book.publisher || "", edition: book.edition || "",
      categoryId: book.categoryId, language: book.language,
      totalCopies: book.totalCopies, shelfLocation: book.shelfLocation || "",
      coverImageUrl: book.coverImageUrl || "", description: book.description || "",
      price: book.price || 0, pages: book.pages || 0,
      publishYear: book.publishYear || new Date().getFullYear(),
    });
    setShowModal(true);
  };

  const resetBookForm = () => {
    setEditingBook(null);
    setBookForm({
      title: "", author: "", isbn: "", publisher: "", edition: "",
      categoryId: "", language: "English", totalCopies: 1,
      shelfLocation: "", coverImageUrl: "", description: "",
      price: 0, pages: 0, publishYear: new Date().getFullYear(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search books by title, author, ISBN..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination(p => ({...p, page: 1})); }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPagination(p => ({...p, page: 1})); }}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Category
            </button>
            <button
              onClick={() => { resetBookForm(); setShowModal(true); }}
              className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Book
            </button>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Book</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Author</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">ISBN</th>
                    <th className="text-center py-3 px-4 text-slate-600 font-semibold">Copies</th>
                    <th className="text-center py-3 px-4 text-slate-600 font-semibold">Available</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Shelf</th>
                    <th className="text-right py-3 px-4 text-slate-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">No books found. Add your first book! 📚</td></tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-primary-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{book.title}</p>
                              <p className="text-xs text-slate-400">{book.language} • {book.publishYear || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{book.author}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">
                            {book.category?.name || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{book.isbn || "—"}</td>
                        <td className="py-3 px-4 text-center text-slate-700 font-medium">{book.totalCopies}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            book.availableCopies > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {book.availableCopies}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{book.shelfLocation || "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditModal(book)} className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteBook(book.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPagination(p => ({...p, page: p.page - 1}))}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm text-slate-600">{pagination.page} / {pagination.totalPages}</span>
                  <button
                    onClick={() => setPagination(p => ({...p, page: p.page + 1}))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Book Modal */}
      {showModal && (
        <Modal title={editingBook ? "Edit Book" : "Add New Book"} onClose={() => { setShowModal(false); resetBookForm(); }}>
          <form onSubmit={handleSubmitBook} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Title *" value={bookForm.title} onChange={(v) => setBookForm({...bookForm, title: v})} required />
              <FormInput label="Author *" value={bookForm.author} onChange={(v) => setBookForm({...bookForm, author: v})} required />
              <FormInput label="ISBN" value={bookForm.isbn} onChange={(v) => setBookForm({...bookForm, isbn: v})} />
              <FormInput label="Publisher" value={bookForm.publisher} onChange={(v) => setBookForm({...bookForm, publisher: v})} />
              <FormInput label="Edition" value={bookForm.edition} onChange={(v) => setBookForm({...bookForm, edition: v})} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={bookForm.categoryId}
                  onChange={(e) => setBookForm({...bookForm, categoryId: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <FormInput label="Language" value={bookForm.language} onChange={(v) => setBookForm({...bookForm, language: v})} />
              <FormInput label="Total Copies" type="number" value={bookForm.totalCopies.toString()} onChange={(v) => setBookForm({...bookForm, totalCopies: parseInt(v) || 1})} />
              <FormInput label="Shelf Location" value={bookForm.shelfLocation} onChange={(v) => setBookForm({...bookForm, shelfLocation: v})} />
              <FormInput label="Price (₹)" type="number" value={bookForm.price.toString()} onChange={(v) => setBookForm({...bookForm, price: parseFloat(v) || 0})} />
              <FormInput label="Pages" type="number" value={bookForm.pages.toString()} onChange={(v) => setBookForm({...bookForm, pages: parseInt(v) || 0})} />
              <FormInput label="Publish Year" type="number" value={bookForm.publishYear.toString()} onChange={(v) => setBookForm({...bookForm, publishYear: parseInt(v) || 2024})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={bookForm.description}
                onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <FormInput label="Cover Image URL" value={bookForm.coverImageUrl} onChange={(v) => setBookForm({...bookForm, coverImageUrl: v})} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowModal(false); resetBookForm(); }} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 shadow-md">
                {editingBook ? "Update Book" : "Add Book"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <Modal title="Add New Category" onClose={() => setShowCategoryModal(false)}>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <FormInput label="Category Name *" value={categoryForm.name} onChange={(v) => setCategoryForm({...categoryForm, name: v})} required />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 shadow-md">
                Create Category
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ==================== MEMBERS TAB ====================
const MembersTab: React.FC = () => {
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<LibraryMember | null>(null);

  // Member form
  const [memberForm, setMemberForm] = useState({
    name: "", email: "", phone: "", memberType: "STUDENT", class: "", status: "ACTIVE",
  });

  useEffect(() => {
    fetchMembers();
  }, [pagination.page, search, filterType, filterStatus]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      let url = `/members?page=${pagination.page}&limit=10`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterType) url += `&memberType=${filterType}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      const res = await apiCall(url);
      setMembers(res.data.members);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await apiCall(`/members/${editingMember.id}`, { method: "PUT", body: JSON.stringify(memberForm) });
        toast.success("Member updated! ✅");
      } else {
        await apiCall("/members", { method: "POST", body: JSON.stringify(memberForm) });
        toast.success("Member registered successfully! 🎉");
      }
      setShowModal(false);
      resetMemberForm();
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Kya aap sure hain? Member delete ho jayega!")) return;
    try {
      await apiCall(`/members/${id}`, { method: "DELETE" });
      toast.success("Member removed! 🗑️");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEditModal = (member: LibraryMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name, email: member.email || "", phone: member.phone || "",
      memberType: member.memberType, class: member.class || "", status: member.status,
    });
    setShowModal(true);
  };

  const resetMemberForm = () => {
    setEditingMember(null);
    setMemberForm({ name: "", email: "", phone: "", memberType: "STUDENT", class: "", status: "ACTIVE" });
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search members by name, email, ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination(p => ({...p, page: 1})); }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPagination(p => ({...p, page: 1})); }}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="STAFF">Staff</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPagination(p => ({...p, page: 1})); }}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <button
            onClick={() => { resetMemberForm(); setShowModal(true); }}
            className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Member</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Membership ID</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Contact</th>
                    <th className="text-center py-3 px-4 text-slate-600 font-semibold">Books Issued</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 text-slate-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">No members found. Register the first member! 👤</td></tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-green-700 font-bold text-sm">{member.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{member.name}</p>
                              {member.class && <p className="text-xs text-slate-400">Class: {member.class}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-mono text-xs">{member.membershipId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <MemberTypeBadge type={member.memberType} />
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-600 text-xs">{member.email || "—"}</p>
                          <p className="text-slate-400 text-xs">{member.phone || "—"}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-medium text-slate-700">{member.currentBooksIssued}</span>
                          <span className="text-slate-400">/{member.maxBooksAllowed}</span>
                        </td>
                        <td className="py-3 px-4">
                          <MemberStatusBadge status={member.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditModal(member)} className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteMember(member.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPagination(p => ({...p, page: p.page - 1}))} disabled={pagination.page === 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm text-slate-600">{pagination.page} / {pagination.totalPages}</span>
                  <button onClick={() => setPagination(p => ({...p, page: p.page + 1}))} disabled={pagination.page === pagination.totalPages} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Member Modal */}
      {showModal && (
        <Modal title={editingMember ? "Edit Member" : "Register New Member"} onClose={() => { setShowModal(false); resetMemberForm(); }}>
          <form onSubmit={handleSubmitMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Full Name *" value={memberForm.name} onChange={(v) => setMemberForm({...memberForm, name: v})} required />
              <FormInput label="Email" type="email" value={memberForm.email} onChange={(v) => setMemberForm({...memberForm, email: v})} />
              <FormInput label="Phone" value={memberForm.phone} onChange={(v) => setMemberForm({...memberForm, phone: v})} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Member Type *</label>
                <select
                  value={memberForm.memberType}
                  onChange={(e) => setMemberForm({...memberForm, memberType: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
              {memberForm.memberType === "STUDENT" && (
                <FormInput label="Class / Section" value={memberForm.class} onChange={(v) => setMemberForm({...memberForm, class: v})} />
              )}
              {editingMember && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={memberForm.status}
                    onChange={(e) => setMemberForm({...memberForm, status: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowModal(false); resetMemberForm(); }} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 shadow-md">
                {editingMember ? "Update Member" : "Register Member"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ==================== ISSUE/RETURN TAB ====================
const IssueReturnTab: React.FC = () => {
  const [mode, setMode] = useState<"issue" | "return">("issue");
  
  // Issue form states
  const [memberSearch, setMemberSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [searchedMembers, setSearchedMembers] = useState<LibraryMember[]>([]);
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [issueRemarks, setIssueRemarks] = useState("");
  const [issuing, setIssuing] = useState(false);

  // Return form states
  const [returnMemberSearch, setReturnMemberSearch] = useState("");
  const [returnSearchedMembers, setReturnSearchedMembers] = useState<LibraryMember[]>([]);
  const [returnSelectedMember, setReturnSelectedMember] = useState<LibraryMember | null>(null);
  const [activeIssues, setActiveIssues] = useState<BookIssue[]>([]);
  const [returning, setReturning] = useState(false);
  const [fineStatusMap, setFineStatusMap] = useState<{[key: string]: string}>({});

  // Search members — debounced
  useEffect(() => {
    if (memberSearch.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiCall(`/members/search?q=${encodeURIComponent(memberSearch)}`);
          setSearchedMembers(res.data);
        } catch (err) { console.error(err); }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchedMembers([]);
    }
  }, [memberSearch]);

  // Search books — debounced
  useEffect(() => {
    if (bookSearch.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiCall(`/books/search?q=${encodeURIComponent(bookSearch)}`);
          setSearchedBooks(res.data);
        } catch (err) { console.error(err); }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchedBooks([]);
    }
  }, [bookSearch]);

  // Return member search
  useEffect(() => {
    if (returnMemberSearch.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiCall(`/members/search?q=${encodeURIComponent(returnMemberSearch)}`);
          setReturnSearchedMembers(res.data);
        } catch (err) { console.error(err); }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setReturnSearchedMembers([]);
    }
  }, [returnMemberSearch]);

  // Fetch active issues for return member
  const fetchActiveIssues = async (memberId: string) => {
    try {
      const res = await apiCall(`/active-issues/${memberId}`);
      setActiveIssues(res.data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Issue book handler
  const handleIssueBook = async () => {
    if (!selectedMember || !selectedBook) {
      toast.error("Please select both member and book!");
      return;
    }
    try {
      setIssuing(true);
      await apiCall("/issue", {
        method: "POST",
        body: JSON.stringify({ bookId: selectedBook.id, memberId: selectedMember.id, remarks: issueRemarks }),
      });
      toast.success("Book issued successfully! 📤");
      // Reset form
      setSelectedMember(null);
      setSelectedBook(null);
      setMemberSearch("");
      setBookSearch("");
      setIssueRemarks("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIssuing(false);
    }
  };

  // Return book handler
  const handleReturnBook = async (issueId: string) => {
    try {
      setReturning(true);
      const res = await apiCall("/return", {
        method: "POST",
        body: JSON.stringify({ issueId, fineStatus: fineStatusMap[issueId] || "PENDING" }),
      });
      toast.success("Book returned successfully! 📥");
      if (res.data.fineAmount > 0) {
        toast(`Fine: ₹${res.data.fineAmount}`, { icon: "💰" });
      }
      // Refresh active issues
      if (returnSelectedMember) fetchActiveIssues(returnSelectedMember.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReturning(false);
    }
  };

  // Renew book handler
  const handleRenewBook = async (issueId: string) => {
    try {
      await apiCall(`/renew/${issueId}`, { method: "POST" });
      toast.success("Book renewed! New due date extended 🔄");
      if (returnSelectedMember) fetchActiveIssues(returnSelectedMember.id);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle Issue / Return */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("issue")}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
              mode === "issue"
                ? "bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <BookCopy className="w-4 h-4" /> Issue Book
          </button>
          <button
            onClick={() => setMode("return")}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
              mode === "return"
                ? "bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" /> Return Book
          </button>
        </div>
      </div>

      {/* Issue Form */}
      {mode === "issue" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookCopy className="w-5 h-5 text-primary-600" /> Issue a Book
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Member Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Member</label>
              {selectedMember ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{selectedMember.name}</p>
                    <p className="text-xs text-slate-500">{selectedMember.membershipId} • {selectedMember.memberType} • Books: {selectedMember.currentBooksIssued}/{selectedMember.maxBooksAllowed}</p>
                  </div>
                  <button onClick={() => { setSelectedMember(null); setMemberSearch(""); }} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search member by name or ID..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                  {searchedMembers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchedMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedMember(m); setSearchedMembers([]); setMemberSearch(""); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm border-b border-slate-50 last:border-0"
                        >
                          <p className="font-medium text-slate-700">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.membershipId} • {m.memberType}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Book Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Book</label>
              {selectedBook ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{selectedBook.title}</p>
                    <p className="text-xs text-slate-500">{selectedBook.author} • Available: {selectedBook.availableCopies}/{selectedBook.totalCopies}</p>
                  </div>
                  <button onClick={() => { setSelectedBook(null); setBookSearch(""); }} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search book by title or ISBN..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                  {searchedBooks.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchedBooks.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => { setSelectedBook(b); setSearchedBooks([]); setBookSearch(""); }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm border-b border-slate-50 last:border-0 ${b.availableCopies === 0 ? "opacity-50" : ""}`}
                          disabled={b.availableCopies === 0}
                        >
                          <p className="font-medium text-slate-700">{b.title}</p>
                          <p className="text-xs text-slate-400">{b.author} • Available: {b.availableCopies}/{b.totalCopies}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (optional)</label>
            <input
              type="text"
              value={issueRemarks}
              onChange={(e) => setIssueRemarks(e.target.value)}
              placeholder="Any notes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Issue Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleIssueBook}
              disabled={!selectedMember || !selectedBook || issuing}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
            >
              {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookCopy className="w-4 h-4" />}
              Issue Book
            </button>
          </div>
        </div>
      )}

      {/* Return Form */}
      {mode === "return" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary-600" /> Return a Book
          </h3>

          {/* Search Member for Return */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Find Member</label>
            {returnSelectedMember ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{returnSelectedMember.name}</p>
                  <p className="text-xs text-slate-500">{returnSelectedMember.membershipId} • Books Issued: {returnSelectedMember.currentBooksIssued}</p>
                </div>
                <button onClick={() => { setReturnSelectedMember(null); setActiveIssues([]); setReturnMemberSearch(""); }} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search member to return books..."
                  value={returnMemberSearch}
                  onChange={(e) => setReturnMemberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
                {returnSearchedMembers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {returnSearchedMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setReturnSelectedMember(m);
                          setReturnSearchedMembers([]);
                          setReturnMemberSearch("");
                          fetchActiveIssues(m.id);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm border-b border-slate-50 last:border-0"
                      >
                        <p className="font-medium text-slate-700">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.membershipId} • Currently Issued: {m.currentBooksIssued}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Issues Table */}
          {returnSelectedMember && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Currently Issued Books</h4>
              {activeIssues.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No active issues for this member</p>
              ) : (
                <div className="space-y-3">
                  {activeIssues.map((issue) => {
                    const isOverdue = new Date(issue.dueDate) < new Date();
                    const overdueDays = isOverdue ? Math.ceil((new Date().getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    
                    return (
                      <div key={issue.id} className={`border rounded-lg p-4 ${isOverdue ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-800">{issue.book?.title}</p>
                            <p className="text-xs text-slate-500">{issue.book?.author}</p>
                            <div className="flex gap-4 mt-1">
                              <p className="text-xs text-slate-500">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Issued: {new Date(issue.issueDate).toLocaleDateString("en-IN")}
                              </p>
                              <p className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-slate-500"}`}>
                                <Clock className="w-3 h-3 inline mr-1" />
                                Due: {new Date(issue.dueDate).toLocaleDateString("en-IN")}
                              </p>
                            </div>
                            {isOverdue && (
                              <p className="text-xs text-red-600 font-medium mt-1">
                                ⚠️ Overdue by {overdueDays} day(s) — Estimated Fine: ₹{overdueDays * 2}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRenewBook(issue.id)}
                              className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Renew
                            </button>
                            <button
                              onClick={() => handleReturnBook(issue.id)}
                              disabled={returning}
                              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition flex items-center gap-1 disabled:opacity-50"
                            >
                              {returning ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Return
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== REPORTS TAB ====================
const ReportsTab: React.FC = () => {
  const [mostIssued, setMostIssued] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<BookIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<"most-issued" | "category" | "overdue">("most-issued");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [mostRes, catRes, overdueRes] = await Promise.all([
        apiCall("/reports/most-issued"),
        apiCall("/reports/category-stats"),
        apiCall("/overdue"),
      ]);
      setMostIssued(mostRes.data);
      setCategoryStats(catRes.data);
      setOverdueList(overdueRes.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Report Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "most-issued" as const, label: "Most Issued Books", icon: TrendingUp },
            { id: "category" as const, label: "Category Stats", icon: BarChart3 },
            { id: "overdue" as const, label: "Overdue Report", icon: AlertTriangle },
          ].map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => setActiveReport(r.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  activeReport === r.id
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" /> {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Most Issued Books */}
      {activeReport === "most-issued" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">📈 Most Issued Books (Top 10)</h3>
          {mostIssued.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No data available yet</p>
          ) : (
            <div className="space-y-3">
              {mostIssued.map((item, i) => (
                <div key={item.bookId} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? "bg-yellow-100 text-yellow-700" :
                    i === 1 ? "bg-slate-100 text-slate-600" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-slate-50 text-slate-500"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.author} • {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">{item.issueCount}</p>
                    <p className="text-xs text-slate-400">times issued</p>
                  </div>
                  {/* Simple bar chart */}
                  <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                      style={{ width: `${(item.issueCount / (mostIssued[0]?.issueCount || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Stats */}
      {activeReport === "category" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 Category-wise Statistics</h3>
          {categoryStats.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No categories found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Category</th>
                    <th className="text-center py-3 px-4 text-slate-600 font-semibold">Total Books</th>
                    <th className="text-center py-3 px-4 text-slate-600 font-semibold">Total Copies</th>
                    <th className="text-center py-3 px-4 text-slate-600 font-semibold">Available</th>
                    <th className="text-center py-3 px-4 text-slate-600 font-semibold">Total Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats.map((cat) => (
                    <tr key={cat.categoryId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-700">{cat.categoryName}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{cat.totalBooks}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{cat.totalCopies}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${cat.availableCopies > 0 ? "text-green-600" : "text-red-600"}`}>
                          {cat.availableCopies}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-primary-600 font-medium">{cat.totalIssues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Overdue Report */}
      {activeReport === "overdue" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" /> Overdue Books ({overdueList.length})
          </h3>
          {overdueList.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-slate-500">No overdue books! Everything is on time 🎉</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-50 border-b border-red-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-red-700 font-semibold">Book</th>
                    <th className="text-left py-3 px-4 text-red-700 font-semibold">Member</th>
                    <th className="text-left py-3 px-4 text-red-700 font-semibold">Due Date</th>
                    <th className="text-center py-3 px-4 text-red-700 font-semibold">Days Overdue</th>
                    <th className="text-right py-3 px-4 text-red-700 font-semibold">Fine (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueList.map((item) => (
                    <tr key={item.id} className="border-b border-red-50 hover:bg-red-50/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{item.book?.title}</p>
                        <p className="text-xs text-slate-400">{item.book?.author}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-700">{item.member?.name}</p>
                        <p className="text-xs text-slate-400">{item.member?.membershipId} • {item.member?.phone || "—"}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{new Date(item.dueDate).toLocaleDateString("en-IN")}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          {item.overdueDays} days
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">₹{item.calculatedFine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== SETTINGS TAB ====================
const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiCall("/settings");
      setSettings(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const { id, ...data } = settings;
      await apiCall("/settings", { method: "PUT", body: JSON.stringify(data) });
      toast.success("Settings saved successfully! ⚙️");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!settings) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl">
      <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary-600" /> Library Configuration
      </h3>

      <div className="space-y-6">
        {/* Book Limits */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Book Issue Limits</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Max Books per Student</label>
              <input
                type="number"
                value={settings.maxBooksPerStudent}
                onChange={(e) => setSettings({...settings, maxBooksPerStudent: parseInt(e.target.value) || 0})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Max Books per Teacher</label>
              <input
                type="number"
                value={settings.maxBooksPerTeacher}
                onChange={(e) => setSettings({...settings, maxBooksPerTeacher: parseInt(e.target.value) || 0})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Max Books per Staff</label>
              <input
                type="number"
                value={settings.maxBooksPerStaff}
                onChange={(e) => setSettings({...settings, maxBooksPerStaff: parseInt(e.target.value) || 0})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Duration & Fine */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Duration & Fine</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Issue Duration (days)</label>
              <input
                type="number"
                value={settings.issueDurationDays}
                onChange={(e) => setSettings({...settings, issueDurationDays: parseInt(e.target.value) || 14})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Fine per Day (₹)</label>
              <input
                type="number"
                step="0.5"
                value={settings.finePerDay}
                onChange={(e) => setSettings({...settings, finePerDay: parseFloat(e.target.value) || 0})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Lost Book Fine Multiplier</label>
              <input
                type="number"
                step="0.5"
                value={settings.lostBookFineMultiplier}
                onChange={(e) => setSettings({...settings, lostBookFineMultiplier: parseFloat(e.target.value) || 2})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Renewal Settings */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Renewal Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowRenewal}
                  onChange={(e) => setSettings({...settings, allowRenewal: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
              <span className="text-sm text-slate-600">Allow Renewal</span>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Max Renewals</label>
              <input
                type="number"
                value={settings.maxRenewals}
                onChange={(e) => setSettings({...settings, maxRenewals: parseInt(e.target.value) || 0})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500"
                disabled={!settings.allowRenewal}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.workingDaysOnly}
                  onChange={(e) => setSettings({...settings, workingDaysOnly: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
              <span className="text-sm text-slate-600">Fine on Working Days Only</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-md flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== SHARED COMPONENTS ====================
// Loading spinner
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
  </div>
);

// Modal wrapper
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
      <div className="flex items-center justify-between p-5 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

// Form input component
const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, type = "text", required, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    />
  </div>
);

// Status badge — issue status ke liye
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    ISSUED: "bg-primary-100 text-primary-700",
    RETURNED: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    LOST: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
};

// Member type badge
const MemberTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const styles: Record<string, string> = {
    STUDENT: "bg-primary-100 text-primary-700",
    TEACHER: "bg-purple-100 text-purple-700",
    STAFF: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[type] || "bg-slate-100 text-slate-600"}`}>
      {type}
    </span>
  );
};

// Member status badge
const MemberStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    EXPIRED: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
};

export default LibraryDashboard;

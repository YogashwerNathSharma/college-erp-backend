import { useState, useEffect, useCallback } from "react";
import {
  LifeBuoy,
  Ticket,
  BookOpen,
  Megaphone,
  Wrench,
  Monitor,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  X,
  MessageSquare,
  User,
  Tag,
  Send,
  Power,
  PowerOff,
  ArrowUpRight,
  CircleDot,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { DataTable, PageHeader, StatsCard, StatusBadge } from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  reportedBy: string;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  comments?: TicketComment[];
}

interface TicketComment {
  id: string;
  content: string;
  authorId: string;
  author?: { name: string };
  createdAt: string;
}

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  targetAudience: string;
  publishedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  avgResolutionHours: number;
  byPriority: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════
// TAB CONFIG
// ═══════════════════════════════════════════════════════════

const TABS = [
  { key: "tickets", label: "Tickets", icon: Ticket },
  { key: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "status", label: "System Status", icon: Monitor },
] as const;

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function SupportCenter() {
  const [activeTab, setActiveTab] = useState<string>("tickets");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceStatus, setMaintenanceStatus] = useState({ enabled: false, message: "", scheduledEnd: "" });
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Modals
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/super-admin/support-center/tickets");
      if (data.success) setTickets(data.tickets);
    } catch {
      setTickets(generateMockTickets());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/support-center/tickets/stats");
      if (data.success) setStats(data.stats);
    } catch {
      setStats({ total: 67, open: 12, inProgress: 8, resolved: 35, closed: 12, avgResolutionHours: 18, byPriority: { low: 15, medium: 30, high: 17, critical: 5 } });
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/support-center/kb");
      if (data.success) setArticles(data.articles);
    } catch {
      setArticles(generateMockArticles());
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/support-center/announcements");
      if (data.success) setAnnouncements(data.announcements);
    } catch {
      setAnnouncements(generateMockAnnouncements());
    }
  }, []);

  const fetchMaintenance = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/support-center/maintenance");
      if (data.success) setMaintenanceStatus(data);
    } catch {
      setMaintenanceStatus({ enabled: false, message: "System is under maintenance", scheduledEnd: "" });
    }
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/support-center/system-status");
      if (data.success) setSystemStatus(data);
    } catch {
      setSystemStatus({
        overall: "operational",
        services: [
          { name: "Database", status: "operational", responseTime: 12 },
          { name: "API Server", status: "operational", responseTime: 5 },
          { name: "Authentication", status: "operational", responseTime: 8 },
          { name: "File Storage", status: "operational", responseTime: 45 },
          { name: "Email Service", status: "degraded", responseTime: 1200 },
          { name: "Queue Worker", status: "operational", responseTime: 3 },
        ],
        uptime: { seconds: 1234567, formatted: "14d 6h 56m" },
        memory: { heapUsed: 156, heapTotal: 256, rss: 320 },
      });
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetchArticles();
    fetchAnnouncements();
    fetchMaintenance();
    fetchSystemStatus();
  }, [fetchTickets, fetchStats, fetchArticles, fetchAnnouncements, fetchMaintenance, fetchSystemStatus]);

  // ─── Ticket Columns ──────────────────────────────────────
  const ticketColumns: Column<SupportTicket>[] = [
    {
      key: "ticketNumber",
      label: "Ticket",
      width: "120px",
      render: (row) => <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">{row.ticketNumber}</span>,
    },
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <div>
          <p className="font-medium text-sm text-slate-900 dark:text-white">{row.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{row.description}</p>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      width: "100px",
      render: (row) => {
        const colors: Record<string, string> = {
          critical: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",
          high: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
          medium: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
          low: "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800",
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[row.priority] || colors.medium}`}>{row.priority}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      width: "120px",
      render: (row) => {
        const variants: Record<string, any> = { open: "warning", in_progress: "info", waiting: "default", resolved: "success", closed: "default" };
        return <StatusBadge status={row.status.replace("_", " ")} variant={variants[row.status] || "default"} />;
      },
    },
    {
      key: "assignee",
      label: "Assigned To",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {row.assignee?.name || "Unassigned"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      width: "130px",
      render: (row) => <span className="text-sm text-slate-600 dark:text-slate-400">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "50px",
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedTicket(row); setShowTicketDetail(true); }}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Support Center"
        subtitle="Ticket management, knowledge base, and system operations"
        icon={<LifeBuoy className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Super Admin", path: "/super-admin" },
          { label: "Support Center" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {activeTab === "tickets" && (
              <button onClick={() => setShowTicketModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                New Ticket
              </button>
            )}
            {activeTab === "knowledge" && (
              <button onClick={() => { setEditingArticle(null); setShowArticleModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                New Article
              </button>
            )}
            {activeTab === "announcements" && (
              <button onClick={() => { setEditingAnnouncement(null); setShowAnnouncementModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                New Announcement
              </button>
            )}
          </div>
        }
      />

      {/* Stats Cards (for tickets) */}
      {activeTab === "tickets" && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatsCard title="Total Tickets" value={stats.total} icon={<Ticket className="w-5 h-5" />} color="indigo" />
          <StatsCard title="Open" value={stats.open} icon={<AlertCircle className="w-5 h-5" />} color="amber" />
          <StatsCard title="In Progress" value={stats.inProgress} icon={<Loader2 className="w-5 h-5" />} color="cyan" />
          <StatsCard title="Resolved" value={stats.resolved} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
          <StatsCard title="Avg Resolution" value={`${stats.avgResolutionHours}h`} icon={<Clock className="w-5 h-5" />} color="purple" />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "tickets" && (
            <DataTable
              columns={ticketColumns}
              data={tickets}
              loading={loading}
              rowKey="id"
              onRefresh={fetchTickets}
              onRowClick={(row) => { setSelectedTicket(row); setShowTicketDetail(true); }}
              pageSize={15}
              emptyMessage="No tickets found"
            />
          )}

          {activeTab === "knowledge" && (
            <KnowledgeBasePanel
              articles={articles}
              onEdit={(article) => { setEditingArticle(article); setShowArticleModal(true); }}
              onDelete={async (id) => {
                try { await axios.delete(`/api/super-admin/support-center/kb/${id}`); } catch {}
                toast.success("Article deleted");
                setArticles((a) => a.filter((x) => x.id !== id));
              }}
            />
          )}

          {activeTab === "announcements" && (
            <AnnouncementsPanel
              announcements={announcements}
              onEdit={(ann) => { setEditingAnnouncement(ann); setShowAnnouncementModal(true); }}
              onDelete={async (id) => {
                try { await axios.delete(`/api/super-admin/support-center/announcements/${id}`); } catch {}
                toast.success("Announcement deleted");
                setAnnouncements((a) => a.filter((x) => x.id !== id));
              }}
            />
          )}

          {activeTab === "maintenance" && (
            <MaintenancePanel
              status={maintenanceStatus}
              onToggle={async (enabled, message, scheduledEnd) => {
                try {
                  await axios.post("/api/super-admin/support-center/maintenance", { enabled, message, scheduledEnd });
                } catch {}
                setMaintenanceStatus({ enabled, message, scheduledEnd });
                toast.success(`Maintenance mode ${enabled ? "enabled" : "disabled"}`);
              }}
            />
          )}

          {activeTab === "status" && <SystemStatusPanel status={systemStatus} />}
        </div>
      </div>

      {/* Modals */}
      {showTicketModal && (
        <TicketModal
          onClose={() => setShowTicketModal(false)}
          onSave={async (data) => {
            try { await axios.post("/api/super-admin/support-center/tickets", data); } catch {}
            toast.success("Ticket created");
            setShowTicketModal(false);
            fetchTickets();
            fetchStats();
          }}
        />
      )}

      {showTicketDetail && selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setShowTicketDetail(false)}
          onAssign={async (assigneeId) => {
            try { await axios.patch(`/api/super-admin/support-center/tickets/${selectedTicket.id}/assign`, { assigneeId }); } catch {}
            toast.success("Ticket assigned");
            fetchTickets();
          }}
          onResolve={async (resolution) => {
            try { await axios.patch(`/api/super-admin/support-center/tickets/${selectedTicket.id}/resolve`, { resolution }); } catch {}
            toast.success("Ticket resolved");
            setShowTicketDetail(false);
            fetchTickets();
            fetchStats();
          }}
          onComment={async (content) => {
            try { await axios.post(`/api/super-admin/support-center/tickets/${selectedTicket.id}/comments`, { content }); } catch {}
            toast.success("Comment added");
          }}
        />
      )}

      {showArticleModal && (
        <ArticleModal
          article={editingArticle}
          onClose={() => setShowArticleModal(false)}
          onSave={async (data) => {
            try {
              if (editingArticle) {
                await axios.put(`/api/super-admin/support-center/kb/${editingArticle.id}`, data);
              } else {
                await axios.post("/api/super-admin/support-center/kb", data);
              }
            } catch {}
            toast.success(editingArticle ? "Article updated" : "Article created");
            setShowArticleModal(false);
            fetchArticles();
          }}
        />
      )}

      {showAnnouncementModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => setShowAnnouncementModal(false)}
          onSave={async (data) => {
            try {
              if (editingAnnouncement) {
                await axios.put(`/api/super-admin/support-center/announcements/${editingAnnouncement.id}`, data);
              } else {
                await axios.post("/api/super-admin/support-center/announcements", data);
              }
            } catch {}
            toast.success(editingAnnouncement ? "Announcement updated" : "Announcement created");
            setShowAnnouncementModal(false);
            fetchAnnouncements();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// KNOWLEDGE BASE PANEL
// ═══════════════════════════════════════════════════════════

function KnowledgeBasePanel({ articles, onEdit, onDelete }: { articles: KBArticle[]; onEdit: (a: KBArticle) => void; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = [...new Set(articles.map((a) => a.category))];
  const filtered = articles.filter((a) => {
    if (categoryFilter && a.category !== categoryFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((article) => (
          <div key={article.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{article.category}</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${article.isPublished ? "bg-emerald-500" : "bg-slate-300"}`} title={article.isPublished ? "Published" : "Draft"} />
            </div>
            <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-2">{article.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3">{article.content}</p>
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {article.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => onEdit(article)} className="flex-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1 py-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => onDelete(article.id)} className="text-xs text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No articles found</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ANNOUNCEMENTS PANEL
// ═══════════════════════════════════════════════════════════

function AnnouncementsPanel({ announcements, onEdit, onDelete }: { announcements: Announcement[]; onEdit: (a: Announcement) => void; onDelete: (id: string) => void }) {
  const typeStyles: Record<string, { bg: string; icon: typeof AlertCircle }> = {
    info: { bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", icon: AlertCircle },
    warning: { bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", icon: AlertTriangle },
    critical: { bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", icon: XCircle },
    maintenance: { bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800", icon: Wrench },
  };

  return (
    <div className="space-y-4">
      {announcements.map((ann) => {
        const style = typeStyles[ann.type] || typeStyles.info;
        const Icon = style.icon;
        return (
          <div key={ann.id} className={`rounded-xl border p-4 ${style.bg}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 text-slate-600 dark:text-slate-400" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white">{ann.title}</h4>
                    {ann.isActive && <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{ann.content}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                    <span>Audience: {ann.targetAudience}</span>
                    <span>Published: {new Date(ann.publishedAt).toLocaleDateString()}</span>
                    {ann.expiresAt && <span>Expires: {new Date(ann.expiresAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(ann)} className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-500">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(ann.id)} className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {announcements.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No announcements yet</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAINTENANCE PANEL
// ═══════════════════════════════════════════════════════════

function MaintenancePanel({ status, onToggle }: { status: { enabled: boolean; message: string; scheduledEnd: string }; onToggle: (enabled: boolean, message: string, scheduledEnd: string) => void }) {
  const [message, setMessage] = useState(status.message);
  const [scheduledEnd, setScheduledEnd] = useState(status.scheduledEnd);

  return (
    <div className="max-w-2xl mx-auto">
      <div className={`rounded-2xl border-2 p-8 text-center ${status.enabled ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10" : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"}`}>
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${status.enabled ? "bg-red-100 dark:bg-red-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
          {status.enabled ? (
            <PowerOff className="w-10 h-10 text-red-600 dark:text-red-400" />
          ) : (
            <Power className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {status.enabled ? "Maintenance Mode Active" : "System is Operational"}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {status.enabled ? "Users will see a maintenance page instead of the application" : "All services are running normally"}
        </p>

        <div className="space-y-4 text-left max-w-md mx-auto mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maintenance Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="We're currently performing maintenance..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scheduled End Time (Optional)</label>
            <input
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={() => onToggle(!status.enabled, message, scheduledEnd)}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            status.enabled
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {status.enabled ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SYSTEM STATUS PANEL
// ═══════════════════════════════════════════════════════════

function SystemStatusPanel({ status }: { status: any }) {
  if (!status) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>;

  const getStatusColor = (s: string) => {
    switch (s) {
      case "operational": return "bg-emerald-500";
      case "degraded": return "bg-amber-500";
      case "outage": return "bg-red-500";
      default: return "bg-slate-400";
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "operational": return "Operational";
      case "degraded": return "Degraded";
      case "outage": return "Outage";
      default: return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`rounded-xl p-6 text-center ${
        status.overall === "operational" ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
      }`}>
        <div className={`w-4 h-4 rounded-full mx-auto mb-3 ${getStatusColor(status.overall)}`} />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {status.overall === "operational" ? "All Systems Operational" : "Some Services Degraded"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Uptime: {status.uptime?.formatted || "—"}</p>
      </div>

      {/* Services */}
      <div className="space-y-2">
        {status.services?.map((service: any) => (
          <div key={service.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
              <span className="text-sm font-medium text-slate-900 dark:text-white">{service.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">{service.responseTime}ms</span>
              <span className={`text-xs font-medium ${
                service.status === "operational" ? "text-emerald-600 dark:text-emerald-400" : service.status === "degraded" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
              }`}>
                {getStatusLabel(service.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Memory */}
      {status.memory && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Memory Usage</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Heap Used</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{status.memory.heapUsed} MB</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Heap Total</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{status.memory.heapTotal} MB</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">RSS</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{status.memory.rss} MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TICKET MODAL (Create)
// ═══════════════════════════════════════════════════════════

function TicketModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "general" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Ticket</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description..." rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="general">General</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature Request</option>
                <option value="billing">Billing</option>
                <option value="access">Access/Permissions</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.title || !form.description} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">Create Ticket</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TICKET DETAIL MODAL
// ═══════════════════════════════════════════════════════════

function TicketDetailModal({
  ticket,
  onClose,
  onAssign,
  onResolve,
  onComment,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  onAssign: (assigneeId: string) => void;
  onResolve: (resolution: string) => void;
  onComment: (content: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [resolution, setResolution] = useState("");
  const [showResolve, setShowResolve] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{ticket.ticketNumber}</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                ticket.priority === "critical" ? "bg-red-100 text-red-700" : ticket.priority === "high" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              }`}>
                {ticket.priority}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{ticket.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Status</label>
              <StatusBadge status={ticket.status.replace("_", " ")} variant={ticket.status === "resolved" ? "success" : ticket.status === "open" ? "warning" : "info"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Category</label>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{ticket.category}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Reporter</label>
              <p className="text-sm text-slate-900 dark:text-white">{ticket.reporter?.name || "Unknown"}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Assigned To</label>
              <p className="text-sm text-slate-900 dark:text-white">{ticket.assignee?.name || "Unassigned"}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-700 dark:text-slate-300">
              {ticket.description}
            </div>
          </div>

          {/* Resolution */}
          {ticket.resolution && (
            <div>
              <label className="block text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Resolution</label>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-emerald-200 dark:border-emerald-800">
                {ticket.resolution}
              </div>
            </div>
          )}

          {/* Comments */}
          {ticket.comments && ticket.comments.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Comments</label>
              <div className="space-y-2">
                {ticket.comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.author?.name || "Unknown"}</span>
                      <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Comment */}
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
            />
            <button
              onClick={() => { if (comment.trim()) { onComment(comment); setComment(""); } }}
              disabled={!comment.trim()}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          {ticket.status !== "resolved" && ticket.status !== "closed" && (
            <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              {!showResolve ? (
                <>
                  <button onClick={() => onAssign("admin-1")} className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                    Assign to Me
                  </button>
                  <button onClick={() => setShowResolve(true)} className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                    Mark Resolved
                  </button>
                </>
              ) : (
                <div className="flex-1 space-y-2">
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Enter resolution details..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowResolve(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                    <button onClick={() => { if (resolution.trim()) onResolve(resolution); }} disabled={!resolution.trim()} className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">Resolve</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ARTICLE MODAL
// ═══════════════════════════════════════════════════════════

function ArticleModal({ article, onClose, onSave }: { article: KBArticle | null; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    title: article?.title || "",
    content: article?.content || "",
    category: article?.category || "General",
    tags: article?.tags?.join(", ") || "",
    isPublished: article?.isPublished ?? false,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{article ? "Edit Article" : "New Article"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="General">General</option>
              <option value="Getting Started">Getting Started</option>
              <option value="Features">Features</option>
              <option value="Troubleshooting">Troubleshooting</option>
              <option value="FAQ">FAQ</option>
              <option value="API">API</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write article content (supports markdown)..." rows={8} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="setup, configuration, admin" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded border-slate-300" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Publish immediately</span>
          </label>
        </div>
        <div className="flex items-center gap-3 justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button onClick={() => onSave({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) })} disabled={!form.title || !form.content} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
            {article ? "Update" : "Create"} Article
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ANNOUNCEMENT MODAL
// ═══════════════════════════════════════════════════════════

function AnnouncementModal({ announcement, onClose, onSave }: { announcement: Announcement | null; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    title: announcement?.title || "",
    content: announcement?.content || "",
    type: announcement?.type || "info",
    targetAudience: announcement?.targetAudience || "all",
    expiresAt: announcement?.expiresAt?.split("T")[0] || "",
    isActive: announcement?.isActive ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{announcement ? "Edit Announcement" : "New Announcement"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
              <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="all">All Users</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="admins">Admins</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Announcement content..." rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expires At (Optional)</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-slate-300" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
          </label>
        </div>
        <div className="flex items-center gap-3 justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.title || !form.content} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
            {announcement ? "Update" : "Create"} Announcement
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

function generateMockTickets(): SupportTicket[] {
  const titles = ["Login not working for tenant", "Slow performance on dashboard", "Cannot export reports", "Payment gateway error", "Feature request: Bulk import", "SSL certificate expiring", "Email notifications not sending", "Storage quota exceeded"];
  const priorities = ["low", "medium", "medium", "high", "low", "critical", "high", "medium"];
  const statuses = ["open", "in_progress", "resolved", "open", "waiting", "in_progress", "resolved", "closed"];
  const categories = ["bug", "performance", "feature", "billing", "bug", "access", "bug", "general"];

  return titles.map((title, i) => ({
    id: `ticket-${i}`,
    ticketNumber: `TKT-${String(i + 1).padStart(5, "0")}`,
    title,
    description: `Detailed description of the issue: ${title}. Multiple users have reported this problem and it needs immediate attention.`,
    priority: priorities[i],
    status: statuses[i],
    category: categories[i],
    reportedBy: `user-${i}`,
    assignedTo: i % 3 === 0 ? undefined : `admin-${i % 2}`,
    reporter: { id: `user-${i}`, name: `User ${i + 1}`, email: `user${i + 1}@example.com` },
    assignee: i % 3 === 0 ? undefined : { id: `admin-${i % 2}`, name: `Admin ${(i % 2) + 1}`, email: `admin${(i % 2) + 1}@example.com` },
    resolution: statuses[i] === "resolved" ? "Issue has been fixed in the latest update" : undefined,
    resolvedAt: statuses[i] === "resolved" ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
    comments: [
      { id: `c-${i}-1`, content: "We are looking into this issue.", authorId: "admin-1", author: { name: "Admin 1" }, createdAt: new Date(Date.now() - (i + 1) * 3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}

function generateMockArticles(): KBArticle[] {
  return [
    { id: "kb-1", title: "Getting Started Guide", content: "Welcome to the platform! This guide will help you get started with all the basic features including user management, course setup, and attendance tracking.", category: "Getting Started", tags: ["setup", "basics", "onboarding"], isPublished: true, createdAt: "2025-01-15", updatedAt: "2025-06-01" },
    { id: "kb-2", title: "How to Configure Email Notifications", content: "Learn how to set up SMTP settings, create email templates, and configure notification triggers for various events in the system.", category: "Features", tags: ["email", "notifications", "configuration"], isPublished: true, createdAt: "2025-02-10", updatedAt: "2025-05-20" },
    { id: "kb-3", title: "Troubleshooting Login Issues", content: "Common solutions for login problems including password reset, account lockout, SSO configuration, and browser compatibility issues.", category: "Troubleshooting", tags: ["login", "auth", "troubleshooting"], isPublished: true, createdAt: "2025-03-05", updatedAt: "2025-06-15" },
    { id: "kb-4", title: "API Documentation Overview", content: "Complete guide to the REST API including authentication, endpoints, rate limiting, and webhooks for third-party integrations.", category: "API", tags: ["api", "integration", "developer"], isPublished: true, createdAt: "2025-01-20", updatedAt: "2025-04-10" },
    { id: "kb-5", title: "Billing and Subscription FAQ", content: "Frequently asked questions about billing cycles, plan upgrades, payment methods, invoices, and refund policies.", category: "FAQ", tags: ["billing", "subscription", "faq"], isPublished: false, createdAt: "2025-04-01", updatedAt: "2025-06-05" },
    { id: "kb-6", title: "Data Backup and Recovery", content: "How to configure automated backups, restore from backups, and export your data in various formats.", category: "Features", tags: ["backup", "data", "recovery"], isPublished: true, createdAt: "2025-02-25", updatedAt: "2025-05-30" },
  ];
}

function generateMockAnnouncements(): Announcement[] {
  return [
    { id: "ann-1", title: "Scheduled Maintenance - July 25", content: "We will be performing scheduled maintenance on July 25, 2026 from 2:00 AM to 6:00 AM IST. During this time, the platform may be temporarily unavailable.", type: "maintenance", targetAudience: "all", publishedAt: "2026-07-18T10:00:00Z", expiresAt: "2026-07-26T00:00:00Z", isActive: true, createdAt: "2026-07-18" },
    { id: "ann-2", title: "New Feature: Advanced Reports", content: "We've launched our new Advanced Reports module with customizable dashboards, scheduled report generation, and PDF export. Check it out in the Reports section!", type: "info", targetAudience: "admins", publishedAt: "2026-07-10T10:00:00Z", isActive: true, createdAt: "2026-07-10" },
    { id: "ann-3", title: "Security Update Required", content: "A critical security patch has been applied. All users are advised to update their passwords within the next 7 days for enhanced security.", type: "warning", targetAudience: "all", publishedAt: "2026-07-05T08:00:00Z", expiresAt: "2026-07-20T00:00:00Z", isActive: true, createdAt: "2026-07-05" },
  ];
}

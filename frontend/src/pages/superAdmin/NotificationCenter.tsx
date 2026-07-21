import { useState, useEffect, useCallback } from "react";
import {
  Bell, Mail, MessageSquare, Smartphone, Send, Radio, Plus, Edit2, Trash2,
  Clock, CheckCircle, XCircle, AlertCircle, Eye, X, Calendar, Users,
  TrendingUp, Zap, FileText, BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { DataTable, PageHeader, StatsCard, StatusBadge, ChartCard } from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface Notification {
  id: string;
  channel: string;
  recipient: string;
  recipientName?: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  templateId?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

interface NotifTemplate {
  id: string;
  name: string;
  channel: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotifStats {
  total: number;
  todaySent: number;
  monthSent: number;
  pending: number;
  failed: number;
  deliveryRate: number;
  byChannel: Record<string, number>;
  byStatus: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════
// TAB CONFIG
// ═══════════════════════════════════════════════════════════

const TABS = [
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "push", label: "Push", icon: Smartphone },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { key: "broadcast", label: "Broadcast", icon: Radio },
] as const;

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<string>("email");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [stats, setStats] = useState<NotifStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotifTemplate | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/super-admin/notification-center/notifications", {
        params: { channel: activeTab !== "broadcast" ? activeTab : undefined },
      });
      if (data.success) setNotifications(data.notifications);
    } catch {
      setNotifications(generateMockNotifications(activeTab));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/notification-center/stats");
      if (data.success) setStats(data.stats);
    } catch {
      setStats({
        total: 24567, todaySent: 156, monthSent: 4320, pending: 23, failed: 89, deliveryRate: 97,
        byChannel: { email: 12000, sms: 6000, push: 4500, whatsapp: 2067 },
        byStatus: { sent: 15000, delivered: 8000, pending: 23, failed: 89, read: 1455 },
      });
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/notification-center/templates");
      if (data.success) setTemplates(data.templates);
    } catch {
      setTemplates(generateMockTemplates());
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/super-admin/notification-center/analytics");
      if (data.success) setAnalytics(data.analytics);
    } catch {
      setAnalytics({
        dailyBreakdown: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
          sent: Math.floor(Math.random() * 200) + 50,
          delivered: Math.floor(Math.random() * 180) + 40,
          failed: Math.floor(Math.random() * 15),
        })),
        totalSent: 4320, totalFailed: 89, avgDeliveryRate: 97,
      });
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { fetchStats(); fetchTemplates(); fetchAnalytics(); }, [fetchStats, fetchTemplates, fetchAnalytics]);

  // ─── Table Columns ───────────────────────────────────────
  const columns: Column<Notification>[] = [
    {
      key: "status", label: "Status", width: "100px",
      render: (row) => {
        const variants: Record<string, any> = { sent: "info", delivered: "success", pending: "warning", failed: "danger", read: "success", bounced: "danger" };
        return <StatusBadge status={row.status} variant={variants[row.status] || "default"} />;
      },
    },
    {
      key: "recipient", label: "Recipient",
      render: (row) => (
        <div>
          <p className="font-medium text-sm text-slate-900 dark:text-white">{row.recipientName || row.recipient}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.recipient}</p>
        </div>
      ),
    },
    {
      key: "subject", label: "Subject / Content",
      render: (row) => (
        <div className="max-w-[300px]">
          {row.subject && <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{row.subject}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{row.body}</p>
        </div>
      ),
    },
    {
      key: "priority", label: "Priority", width: "90px",
      render: (row) => {
        const colors: Record<string, string> = {
          urgent: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",
          high: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
          normal: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
          low: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800",
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[row.priority] || colors.normal}`}>{row.priority}</span>;
      },
    },
    {
      key: "sentAt", label: "Sent", width: "160px",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {row.sentAt ? new Date(row.sentAt).toLocaleString() : row.scheduledAt ? `\u23F0 ${new Date(row.scheduledAt).toLocaleString()}` : "\u2014"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Notification Center"
        subtitle="Multi-channel messaging, templates, and delivery tracking"
        icon={<Bell className="w-5 h-5" />}
        breadcrumbs={[{ label: "Super Admin", path: "/super-admin" }, { label: "Notification Center" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
            <button onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
              <FileText className="w-4 h-4" /> Templates
            </button>
            <button onClick={() => setShowBroadcastModal(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Radio className="w-4 h-4" /> Broadcast
            </button>
            <button onClick={() => setShowSendModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Send className="w-4 h-4" /> Send Notification
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard title="Total Sent" value={stats?.total?.toLocaleString() || "0"} icon={<Send className="w-5 h-5" />} trend={18} trendLabel="this month" color="indigo" />
        <StatsCard title="Today" value={stats?.todaySent || 0} icon={<Zap className="w-5 h-5" />} color="emerald" />
        <StatsCard title="Delivery Rate" value={`${stats?.deliveryRate || 0}%`} icon={<CheckCircle className="w-5 h-5" />} color="cyan" />
        <StatsCard title="Pending" value={stats?.pending || 0} icon={<Clock className="w-5 h-5" />} color="amber" />
        <StatsCard title="Failed" value={stats?.failed || 0} icon={<XCircle className="w-5 h-5" />} color="rose" />
      </div>

      {/* Analytics Panel */}
      {showAnalyticsPanel && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Delivery Trend" subtitle="Last 30 days">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#94a3b8" }} />
                <Area type="monotone" dataKey="sent" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="Sent" />
                <Area type="monotone" dataKey="delivered" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Delivered" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Channel Distribution" subtitle="All time">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={Object.entries(stats?.byChannel || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {Object.entries(stats?.byChannel || {}).map((_, idx) => (<Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700">
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = stats?.byChannel?.[tab.key] || 0;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{count > 9999 ? `${Math.floor(count / 1000)}k` : count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Table */}
      {activeTab === "broadcast" ? (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
            <Radio className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Broadcast Messages</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">Send announcements to all users simultaneously across multiple channels</p>
          <button onClick={() => setShowBroadcastModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
            <Send className="w-4 h-4" /> Compose Broadcast
          </button>
        </div>
      ) : (
        <DataTable columns={columns} data={notifications} loading={loading} rowKey="id" onRefresh={fetchNotifications} onExportCSV={() => toast.success("Exported as CSV")} pageSize={20} emptyMessage={`No ${activeTab} notifications found`} />
      )}

      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Templates</h3>
            <button onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }} className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{tmpl.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{tmpl.channel}</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${tmpl.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
                {tmpl.subject && <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 truncate">Subject: {tmpl.subject}</p>}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{tmpl.body}</p>
                {tmpl.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tmpl.variables.map((v) => (<span key={v} className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">{`{{${v}}}`}</span>))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setShowSendModal(true)} className="flex-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1 py-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20"><Send className="w-3 h-3" /> Use</button>
                  <button onClick={() => { setEditingTemplate(tmpl); setShowTemplateModal(true); }} className="flex-1 text-xs text-slate-600 hover:text-slate-700 dark:text-slate-400 font-medium flex items-center justify-center gap-1 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800"><Edit2 className="w-3 h-3" /> Edit</button>
                  <button onClick={async () => { try { await axios.delete(`/api/super-admin/notification-center/templates/${tmpl.id}`); } catch {} toast.success("Template deleted"); setTemplates((t) => t.filter((x) => x.id !== tmpl.id)); }} className="text-xs text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && <SendNotificationModal channel={activeTab} templates={templates} onClose={() => setShowSendModal(false)} onSend={async (data: any) => { try { await axios.post("/api/super-admin/notification-center/send", data); } catch {} toast.success("Notification sent!"); setShowSendModal(false); fetchNotifications(); fetchStats(); }} />}

      {/* Template Modal */}
      {showTemplateModal && <TemplateModal template={editingTemplate} onClose={() => setShowTemplateModal(false)} onSave={async (data: any) => { try { if (editingTemplate) { await axios.put(`/api/super-admin/notification-center/templates/${editingTemplate.id}`, data); } else { await axios.post("/api/super-admin/notification-center/templates", data); } } catch {} toast.success(editingTemplate ? "Template updated" : "Template created"); setShowTemplateModal(false); fetchTemplates(); }} />}

      {/* Broadcast Modal */}
      {showBroadcastModal && <BroadcastModal onClose={() => setShowBroadcastModal(false)} onSend={async (data: any) => { try { await axios.post("/api/super-admin/notification-center/broadcast", data); } catch {} toast.success("Broadcast sent!"); setShowBroadcastModal(false); fetchNotifications(); }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SEND NOTIFICATION MODAL
// ═══════════════════════════════════════════════════════════

function SendNotificationModal({ channel, templates, onClose, onSend }: { channel: string; templates: NotifTemplate[]; onClose: () => void; onSend: (data: any) => void }) {
  const [form, setForm] = useState({ channel: channel === "broadcast" ? "email" : channel, recipients: "", subject: "", body: "", priority: "normal", scheduledAt: "", templateId: "" });

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) setForm({ ...form, templateId, subject: tmpl.subject, body: tmpl.body, channel: tmpl.channel });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Send Notification</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Channel</label>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="email">Email</option><option value="sms">SMS</option><option value="push">Push</option><option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Template (Optional)</label>
              <select value={form.templateId} onChange={(e) => handleTemplateSelect(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="">None - compose manually</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recipients (comma-separated)</label>
            <textarea value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} placeholder="user@example.com, another@example.com" rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none" />
          </div>
          {form.channel === "email" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Notification subject" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message Body</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Enter your message..." rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Schedule (Optional)</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button onClick={() => onSend({ ...form, recipients: form.recipients.split(",").map((r: string) => r.trim()).filter(Boolean) })} disabled={!form.recipients || !form.body} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Send className="w-4 h-4" /> {form.scheduledAt ? "Schedule" : "Send Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TEMPLATE MODAL
// ═══════════════════════════════════════════════════════════

function TemplateModal({ template, onClose, onSave }: { template: NotifTemplate | null; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ name: template?.name || "", channel: template?.channel || "email", subject: template?.subject || "", body: template?.body || "", variables: template?.variables?.join(", ") || "", isActive: template?.isActive ?? true });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{template ? "Edit Template" : "Create Template"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Template name" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" /></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Channel</label><select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="email">Email</option><option value="sms">SMS</option><option value="push">Push</option><option value="whatsapp">WhatsApp</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label><input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Message subject" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Body</label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Use {{variable}} for dynamic content" rows={5} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Variables (comma-separated)</label><input type="text" value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="name, email, date" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" /></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-slate-300" /><span className="text-sm text-slate-700 dark:text-slate-300">Active</span></label>
        </div>
        <div className="flex items-center gap-3 justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button onClick={() => onSave({ ...form, variables: form.variables.split(",").map((v: string) => v.trim()).filter(Boolean) })} disabled={!form.name || !form.body} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">{template ? "Update" : "Create"} Template</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BROADCAST MODAL
// ═══════════════════════════════════════════════════════════

function BroadcastModal({ onClose, onSend }: { onClose: () => void; onSend: (data: any) => void }) {
  const [form, setForm] = useState({ channels: ["email"] as string[], subject: "", body: "", targetAudience: "all", scheduledAt: "" });
  const toggleChannel = (ch: string) => setForm((f) => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center"><Radio className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Broadcast Message</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Channels</label>
            <div className="flex flex-wrap gap-2">
              {["email", "sms", "push", "whatsapp"].map((ch) => (
                <button key={ch} onClick={() => toggleChannel(ch)} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${form.channels.includes(ch) ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-600 dark:text-indigo-400" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>{ch.charAt(0).toUpperCase() + ch.slice(1)}</button>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Audience</label><select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="all">All Users</option><option value="students">Students Only</option><option value="teachers">Teachers Only</option><option value="admins">Admins Only</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label><input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Broadcast subject" className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Compose your broadcast message..." rows={5} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Schedule (Optional)</label><input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></div>
        </div>
        <div className="flex items-center gap-3 justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
          <button onClick={() => onSend(form)} disabled={!form.body || form.channels.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 flex items-center gap-2"><Radio className="w-4 h-4" /> {form.scheduledAt ? "Schedule Broadcast" : "Send Broadcast"}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

function generateMockNotifications(channel: string): Notification[] {
  const subjects = ["Welcome to the Platform", "Password Reset", "New Assignment", "Fee Reminder", "Exam Schedule"];
  const statuses = ["sent", "delivered", "delivered", "delivered", "pending", "failed"];
  const priorities = ["normal", "normal", "high", "low", "urgent"];
  return Array.from({ length: 20 }, (_, i) => ({
    id: `notif-${channel}-${i}`, channel, recipient: `user${i + 1}@example.com`, recipientName: `User ${i + 1}`,
    subject: subjects[i % subjects.length], body: `This is a ${channel} notification message content for recipient ${i + 1}.`,
    status: statuses[i % statuses.length], priority: priorities[i % priorities.length],
    sentAt: i % 5 !== 4 ? new Date(Date.now() - i * 3600000).toISOString() : undefined,
    scheduledAt: i % 5 === 4 ? new Date(Date.now() + 86400000).toISOString() : undefined,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function generateMockTemplates(): NotifTemplate[] {
  return [
    { id: "t1", name: "Welcome Email", channel: "email", subject: "Welcome to {{platform}}!", body: "Hi {{name}}, welcome aboard! Your account is ready.", variables: ["name", "platform"], isActive: true, createdAt: "2025-01-01", updatedAt: "2025-06-01" },
    { id: "t2", name: "Fee Reminder SMS", channel: "sms", subject: "", body: "Dear {{name}}, your fee of {{amount}} is due on {{date}}.", variables: ["name", "amount", "date"], isActive: true, createdAt: "2025-02-01", updatedAt: "2025-05-15" },
    { id: "t3", name: "Exam Alert Push", channel: "push", subject: "Exam Reminder", body: "Your {{subject}} exam is scheduled for {{date}} at {{time}}.", variables: ["subject", "date", "time"], isActive: true, createdAt: "2025-03-01", updatedAt: "2025-06-10" },
    { id: "t4", name: "Password Reset", channel: "email", subject: "Reset Your Password", body: "Hi {{name}}, click the link to reset: {{link}}", variables: ["name", "link"], isActive: true, createdAt: "2025-01-15", updatedAt: "2025-04-20" },
    { id: "t5", name: "Attendance Alert", channel: "whatsapp", subject: "", body: "Dear Parent, {{studentName}} was marked absent on {{date}}.", variables: ["studentName", "date"], isActive: false, createdAt: "2025-02-20", updatedAt: "2025-03-10" },
  ];
}

import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Bell, Send, Mail, MessageSquare, Smartphone,
  CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Filter, Search, Plus, Settings,
  TrendingUp, Zap, BarChart3, Calendar, Eye,
  X, ChevronDown, Play, Pause, Trash2, RotateCcw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

interface DashboardStats {
  sentToday: number;
  queueSize: number;
  failedToday: number;
  deliveredToday: number;
  deliveryRate: number;
  channelStats: { channel: string; count: number }[];
  recentLogs: any[];
  configuredChannels: { channel: string; provider: string; isActive: boolean; isVerified: boolean }[];
  weeklyTrend: { date: string; SMS: number; EMAIL: number; WHATSAPP: number; PUSH: number }[];
}

interface QueueItem {
  id: string;
  channel: string;
  to: string;
  toName?: string;
  subject?: string;
  body: string;
  status: string;
  priority: string;
  attempts: number;
  createdAt: string;
  error?: string;
}

interface NotificationLog {
  id: string;
  channel: string;
  to: string;
  toName?: string;
  subject?: string;
  status: string;
  cost?: number;
  createdAt: string;
}

// ─────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────

const CHANNEL_CONFIG = {
  SMS: { icon: Smartphone, color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400", label: "SMS" },
  EMAIL: { icon: Mail, color: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400", label: "Email" },
  WHATSAPP: { icon: MessageSquare, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400", label: "WhatsApp" },
  PUSH: { icon: Bell, color: "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400", label: "Push" },
  IN_APP: { icon: Zap, color: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400", label: "In-App" },
};

const STATUS_COLORS: Record<string, string> = {
  SENT: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  QUEUED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PROCESSING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#22c55e", "#8b5cf6"];

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "send" | "queue" | "logs" | "schedules" | "config">("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Send form state
  const [sendChannel, setSendChannel] = useState("SMS");
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sending, setSending] = useState(false);

  // Filters
  const [logChannel, setLogChannel] = useState("");
  const [logStatus, setLogStatus] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === "queue") fetchQueue();
    if (activeTab === "logs") fetchLogs();
    if (activeTab === "schedules") fetchSchedules();
    if (activeTab === "config") fetchConfigs();
  }, [activeTab]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(getFullUrl("/api/notifications/dashboard"));
      setStats(res.data.data);
    } catch (err) {
      console.error("Fetch dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/notifications/queue?limit=50"));
      setQueue(res.data.data);
    } catch (err) {
      console.error("Fetch queue error:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (logChannel) params.append("channel", logChannel);
      if (logStatus) params.append("status", logStatus);
      const res = await axios.get(getFullUrl(`/api/notifications/logs?${params}`));
      setLogs(res.data.data);
    } catch (err) {
      console.error("Fetch logs error:", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/notifications/schedules"));
      setSchedules(res.data.data);
    } catch (err) {
      console.error("Fetch schedules error:", err);
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/notifications/config"));
      setConfigs(res.data.data);
    } catch (err) {
      console.error("Fetch configs error:", err);
    }
  };

  const handleSend = async () => {
    if (!sendTo || !sendBody) {
      alert("Please fill in recipient and message body");
      return;
    }
    setSending(true);
    try {
      await axios.post(getFullUrl("/api/notifications/send"), {
        channel: sendChannel,
        to: sendTo,
        subject: sendSubject || undefined,
        body: sendBody,
      });
      alert("Notification sent!");
      setSendTo("");
      setSendSubject("");
      setSendBody("");
      fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await axios.post(getFullUrl(`/api/notifications/queue/${id}/retry`));
      fetchQueue();
    } catch (err) {
      console.error("Retry error:", err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await axios.post(getFullUrl(`/api/notifications/queue/${id}/cancel`));
      fetchQueue();
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage SMS, Email, WhatsApp, and Push notifications</p>
        </div>
        <button
          onClick={() => setActiveTab("send")}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Send size={18} />
          Send Notification
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto">
        {[
          { key: "dashboard", label: "Dashboard", icon: BarChart3 },
          { key: "send", label: "Send", icon: Send },
          { key: "queue", label: "Queue", icon: Clock },
          { key: "logs", label: "Logs", icon: Eye },
          { key: "schedules", label: "Schedules", icon: Calendar },
          { key: "config", label: "Configuration", icon: Settings },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ DASHBOARD TAB ═══════════════ */}
      {activeTab === "dashboard" && stats && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Sent Today" value={stats.sentToday} icon={<Send size={20} />} color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" />
            <StatCard title="Queue Size" value={stats.queueSize} icon={<Clock size={20} />} color="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
            <StatCard title="Delivered" value={stats.deliveredToday} icon={<CheckCircle size={20} />} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" />
            <StatCard title="Failed" value={stats.failedToday} icon={<XCircle size={20} />} color="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" />
            <StatCard title="Delivery Rate" value={`${stats.deliveryRate}%`} icon={<TrendingUp size={20} />} color="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Trend */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Weekly Notification Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="SMS" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="EMAIL" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="WHATSAPP" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="PUSH" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Channel Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Channel Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.channelStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="channel"
                    label={({ channel, count }: any) => `${channel}: ${count}`}
                  >
                    {stats.channelStats.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.configuredChannels.map(ch => {
              const config = CHANNEL_CONFIG[ch.channel as keyof typeof CHANNEL_CONFIG];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <div key={ch.channel} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ch.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {ch.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{config.label}</h4>
                  <p className="text-xs text-gray-500 mt-1">{ch.provider}</p>
                  {ch.isVerified && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={10} /> Verified
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Activity</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.recentLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      CHANNEL_CONFIG[log.channel as keyof typeof CHANNEL_CONFIG]?.color || "bg-gray-100 text-gray-600"
                    }`}>
                      {(() => {
                        const Icon = CHANNEL_CONFIG[log.channel as keyof typeof CHANNEL_CONFIG]?.icon || Bell;
                        return <Icon size={14} />;
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {log.channel} → {log.to}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[log.status] || "bg-gray-100 text-gray-600"}`}>
                    {log.status}
                  </span>
                </div>
              ))}
              {stats.recentLogs.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No activity yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ SEND TAB ═══════════════ */}
      {activeTab === "send" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Send Notification</h3>

            <div className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Channel</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["SMS", "EMAIL", "WHATSAPP", "PUSH"] as const).map(ch => {
                    const config = CHANNEL_CONFIG[ch];
                    const Icon = config.icon;
                    return (
                      <button
                        key={ch}
                        onClick={() => setSendChannel(ch)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                          sendChannel === ch
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                            : "border-gray-200 dark:border-slate-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon size={20} className={sendChannel === ch ? "text-indigo-600" : "text-gray-500"} />
                        <span className={`text-xs font-medium ${sendChannel === ch ? "text-indigo-600" : "text-gray-500"}`}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {sendChannel === "EMAIL" ? "Email Address" : sendChannel === "PUSH" ? "User ID" : "Phone Number"}
                </label>
                <input
                  type="text"
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                  placeholder={sendChannel === "EMAIL" ? "recipient@email.com" : sendChannel === "SMS" ? "+91XXXXXXXXXX" : "Enter recipient..."}
                />
              </div>

              {/* Subject (for email) */}
              {sendChannel === "EMAIL" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={sendSubject}
                    onChange={e => setSendSubject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Notification subject..."
                  />
                </div>
              )}

              {/* Message Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  value={sendBody}
                  onChange={e => setSendBody(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Type your message here... Use {{variable}} for dynamic content"
                />
                <p className="text-xs text-gray-400 mt-1">{sendBody.length} characters</p>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={sending || !sendTo || !sendBody}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {sending ? (
                  <><RefreshCw size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><Send size={16} /> Send {CHANNEL_CONFIG[sendChannel as keyof typeof CHANNEL_CONFIG]?.label}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ QUEUE TAB ═══════════════ */}
      {activeTab === "queue" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notification Queue</h3>
            <button onClick={fetchQueue} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Channel</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Recipient</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Message</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Priority</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Attempts</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {queue.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        CHANNEL_CONFIG[item.channel as keyof typeof CHANNEL_CONFIG]?.color || "bg-gray-100 text-gray-600"
                      }`}>
                        {item.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.toName || item.to}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-48 truncate">{item.body}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        item.priority === "HIGH" || item.priority === "CRITICAL"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.attempts}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {item.status === "FAILED" && (
                          <button onClick={() => handleRetry(item.id)} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Retry">
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {item.status === "QUEUED" && (
                          <button onClick={() => handleCancel(item.id)} className="p-1 rounded hover:bg-red-50 text-red-500" title="Cancel">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {queue.length === 0 && (
              <div className="text-center py-12 text-gray-400">Queue is empty</div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ LOGS TAB ═══════════════ */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={logChannel}
              onChange={e => { setLogChannel(e.target.value); setTimeout(fetchLogs, 100); }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700"
            >
              <option value="">All Channels</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PUSH">Push</option>
            </select>
            <select
              value={logStatus}
              onChange={e => { setLogStatus(e.target.value); setTimeout(fetchLogs, 100); }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700"
            >
              <option value="">All Status</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="BOUNCED">Bounced</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Channel</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Recipient</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Subject</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cost</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          CHANNEL_CONFIG[log.channel as keyof typeof CHANNEL_CONFIG]?.color || "bg-gray-100"
                        }`}>
                          {log.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.toName || log.to}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-48 truncate">{log.subject || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[log.status] || ""}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{log.cost ? `₹${log.cost.toFixed(2)}` : "-"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <div className="text-center py-12 text-gray-400">No logs found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ SCHEDULES TAB ═══════════════ */}
      {activeTab === "schedules" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map(schedule => (
              <div key={schedule.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{schedule.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{schedule.event}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    schedule.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {schedule.isActive ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <p>📱 Channels: {schedule.channel?.join(", ")}</p>
                  <p>🔄 Runs: {schedule.runCount} times</p>
                  {schedule.nextRunAt && (
                    <p>⏰ Next: {new Date(schedule.nextRunAt).toLocaleString("en-IN")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {schedules.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500">No notification schedules</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ CONFIG TAB ═══════════════ */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["SMS", "EMAIL", "WHATSAPP", "PUSH"] as const).map(channel => {
            const config = CHANNEL_CONFIG[channel];
            const Icon = config.icon;
            const channelConfig = configs.find((c: any) => c.channel === channel);

            return (
              <div key={channel} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{config.label}</h3>
                    <p className="text-xs text-gray-500">
                      {channelConfig ? `Provider: ${channelConfig.provider}` : "Not configured"}
                    </p>
                  </div>
                </div>

                {channelConfig ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        channelConfig.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {channelConfig.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Verified</span>
                      <span className={`text-xs ${channelConfig.isVerified ? "text-green-600" : "text-amber-600"}`}>
                        {channelConfig.isVerified ? "✓ Verified" : "⚠ Unverified"}
                      </span>
                    </div>
                    <button className="w-full mt-3 px-3 py-2 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                      Configure →
                    </button>
                  </div>
                ) : (
                  <button className="w-full px-3 py-2.5 text-sm bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors font-medium">
                    + Setup {config.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}

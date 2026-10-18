import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  Bot,
  Send,
  Sparkles,
  Brain,
  TrendingUp,
  AlertTriangle,
  Users,
  IndianRupee,
  Calendar,
  BarChart3,
  X,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  MessageSquare,
  Zap,
  Target,
} from "lucide-react";

// ══════════════════════════════════════════════════
// AI ASSISTANT - Enhanced Frontend
// ══════════════════════════════════════════════════

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState<"chat" | "insights" | "predictions">("chat");
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp?: Date }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInsights = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/ai/insights?limit=10"));
      if (res.data.success) setInsights(res.data.data);
    } catch (err) {
      console.error("Insights fetch error:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await axios.post(getFullUrl("/api/ai/chat"), {
        message: userMessage,
        conversationId,
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.data.data.response, timestamp: new Date() },
        ]);
        if (res.data.data.conversationId) {
          setConversationId(res.data.data.conversationId);
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async (type: string) => {
    setLoading(true);
    try {
      let endpoint = "";
      switch (type) {
        case "attendance": endpoint = "/api/ai/predict/attendance"; break;
        case "defaulters": endpoint = "/api/ai/predict/defaulters"; break;
        case "performance": endpoint = "/api/ai/analyze/performance"; break;
      }
      const res = await axios.post(getFullUrl(endpoint), {});
      if (res.data.success) setPredictions({ type, data: res.data.data });
    } catch (err: any) {
      alert(err.response?.data?.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = async (id: string) => {
    try {
      await axios.put(getFullUrl(`/api/ai/insights/${id}/dismiss`));
      setInsights((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Dismiss error:", err);
    }
  };

  // Quick action suggestions
  const quickActions = [
    { label: "How many students?", icon: Users },
    { label: "What's the pending fee?", icon: IndianRupee },
    { label: "Today's attendance?", icon: Calendar },
    { label: "Upcoming exams?", icon: BarChart3 },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot size={18} className="text-white sm:w-[22px] sm:h-[22px]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Intelligent insights & natural language queries</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-2 sm:px-4 overflow-x-auto">
          {[
            { key: "chat", label: "Chat", icon: MessageSquare },
            { key: "insights", label: "Insights", icon: Lightbulb },
            { key: "predictions", label: "Predictions", icon: Brain },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.key === "insights" && insights.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {insights.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-0">
          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[calc(100vh-220px)] sm:h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-6 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center mb-3 sm:mb-4">
                      <Sparkles size={24} className="text-indigo-500 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      Ask me anything about your school
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 px-2">
                      I can answer questions about students, fees, attendance, exams, and more
                    </p>
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md mx-auto px-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            setInput(action.label);
                          }}
                          className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-slate-600 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 transition-colors"
                        >
                          <action.icon size={14} className="text-indigo-500 flex-shrink-0" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white rounded-bl-sm"
                      }`}
                    >
                      <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 dark:border-slate-700 p-2.5 sm:p-4">
                <div className="flex gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Ask about students, fees, attendance..."
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === "insights" && (
            <div className="p-6 space-y-4">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-xl border-l-4 ${
                      insight.severity === "CRITICAL"
                        ? "border-l-red-500 bg-red-50 dark:bg-red-950/20"
                        : insight.severity === "WARNING"
                        ? "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20"
                        : "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {insight.severity === "CRITICAL" ? (
                            <AlertTriangle size={16} className="text-red-600" />
                          ) : (
                            <Lightbulb size={16} className="text-amber-600" />
                          )}
                          <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{insight.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            insight.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                            insight.severity === "WARNING" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {insight.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                        {insight.actionUrl && (
                          <a
                            href={insight.actionUrl}
                            className="inline-flex items-center gap-1 mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            {insight.actionLabel || "View Details"} <ChevronRight size={14} />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => dismissInsight(insight.id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                      >
                        <X size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No active insights. Everything looks good! ✨</p>
                </div>
              )}
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === "predictions" && (
            <div className="p-6 space-y-6">
              {/* Prediction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PredictionCard
                  title="Attendance Prediction"
                  description="Predict attendance patterns for the next 7 days"
                  icon={<Calendar size={24} />}
                  color="blue"
                  onClick={() => runPrediction("attendance")}
                  loading={loading}
                />
                <PredictionCard
                  title="Fee Defaulters"
                  description="Identify students at risk of defaulting on fees"
                  icon={<IndianRupee size={24} />}
                  color="red"
                  onClick={() => runPrediction("defaulters")}
                  loading={loading}
                />
                <PredictionCard
                  title="Performance Analysis"
                  description="Analyze student performance trends and risks"
                  icon={<TrendingUp size={24} />}
                  color="purple"
                  onClick={() => runPrediction("performance")}
                  loading={loading}
                />
              </div>

              {/* Prediction Results */}
              {predictions && (
                <div className="bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 p-5">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    {predictions.type === "attendance" && "Attendance Predictions"}
                    {predictions.type === "defaulters" && "Fee Defaulter Risk Assessment"}
                    {predictions.type === "performance" && "Performance Analysis"}
                  </h4>

                  {predictions.type === "attendance" && predictions.data && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Historical average: <strong>{predictions.data.historicalAverage}%</strong>
                      </p>
                      <div className="grid grid-cols-7 gap-2">
                        {predictions.data.predictions?.map((p: any) => (
                          <div key={p.date} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-slate-600">
                            <p className="text-xs text-gray-500">{p.dayName.substring(0, 3)}</p>
                            <p className={`text-lg font-bold ${p.predictedAttendanceRate >= 85 ? "text-green-600" : p.predictedAttendanceRate >= 70 ? "text-amber-600" : "text-red-600"}`}>
                              {p.predictedAttendanceRate}%
                            </p>
                          </div>
                        ))}
                      </div>
                      {predictions.data.atRiskStudents?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            At-Risk Students ({predictions.data.atRiskStudents.length})
                          </p>
                          <div className="space-y-1">
                            {predictions.data.atRiskStudents.slice(0, 5).map((s: any) => (
                              <div key={s.studentId} className="flex items-center justify-between text-sm py-1">
                                <span className="text-gray-600 dark:text-gray-400">{s.studentId.substring(0, 8)}...</span>
                                <span className="text-red-600 font-medium">{s.attendanceRate}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {predictions.type === "defaulters" && predictions.data && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-3">
                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                          <p className="text-xl font-bold text-red-600">{predictions.data.highRisk}</p>
                          <p className="text-xs text-red-500">High Risk</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                          <p className="text-xl font-bold text-amber-600">{predictions.data.mediumRisk}</p>
                          <p className="text-xs text-amber-500">Medium Risk</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                          <p className="text-xl font-bold text-green-600">{predictions.data.lowRisk}</p>
                          <p className="text-xs text-green-500">Low Risk</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                          <p className="text-xl font-bold text-indigo-600">₹{(predictions.data.totalPendingAmount / 100000).toFixed(1)}L</p>
                          <p className="text-xs text-indigo-500">Total Pending</p>
                        </div>
                      </div>
                      {predictions.data.recommendations && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">Recommendations:</p>
                          <ul className="space-y-1">
                            {predictions.data.recommendations.map((r: string, i: number) => (
                              <li key={i} className="text-sm text-yellow-600 dark:text-yellow-500 flex items-start gap-2">
                                <Target size={14} className="mt-0.5 shrink-0" /> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Prediction Card ──
function PredictionCard({ title, description, icon, color, onClick, loading }: any) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-left p-5 rounded-xl border border-gray-200 dark:border-slate-600 hover:shadow-md transition-all group disabled:opacity-50"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white mb-3`}>
        {loading ? <RefreshCw size={24} className="animate-spin" /> : icon}
      </div>
      <h4 className="font-semibold text-gray-800 dark:text-white group-hover:text-indigo-600 transition-colors">{title}</h4>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </button>
  );
}

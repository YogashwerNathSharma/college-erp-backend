import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  GitBranch,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ChevronRight,
  AlertCircle,
  MoreVertical,
  ArrowRight,
  Trash2,
  Eye,
  Edit,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react";

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

interface WorkflowStep {
  level: number;
  approverRole: string;
  approverUserId?: string;
  action: string;
  timeoutHours: number;
  autoApproveOnTimeout: boolean;
  notifyChannels?: string[];
}

interface Workflow {
  id: string;
  name: string;
  module: string;
  triggerEvent: string;
  description?: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
  _count?: { instances: number };
}

interface WorkflowInstance {
  id: string;
  workflowId: string;
  entityId: string;
  entityType: string;
  currentStep: number;
  totalSteps: number;
  status: string;
  initiatedBy: string;
  initiatorName?: string;
  data?: any;
  history: any[];
  createdAt: string;
  completedAt?: string;
  workflow?: { name: string; module: string; steps?: any[] };
}

interface Stats {
  totalWorkflows: number;
  activeWorkflows: number;
  pendingInstances: number;
  approvedToday: number;
  rejectedToday: number;
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

export default function WorkflowEngine() {
  const [activeTab, setActiveTab] = useState<"workflows" | "pending" | "instances">("pending");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<WorkflowInstance[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state for creating workflow
  const [formData, setFormData] = useState({
    name: "",
    module: "",
    triggerEvent: "",
    description: "",
    steps: [{ level: 1, approverRole: "", action: "", timeoutHours: 24, autoApproveOnTimeout: false }] as WorkflowStep[],
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [wfRes, pendingRes, statsRes, instancesRes] = await Promise.all([
        axios.get(getFullUrl("/api/workflows")),
        axios.get(getFullUrl("/api/workflows/pending")),
        axios.get(getFullUrl("/api/workflows/stats")),
        axios.get(getFullUrl("/api/workflows/instances?limit=50")),
      ]);
      setWorkflows(wfRes.data.data || []);
      setPendingApprovals(pendingRes.data.data || []);
      setStats(statsRes.data.data || null);
      setInstances(instancesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch workflow data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (instanceId: string) => {
    setActionLoading(instanceId);
    try {
      await axios.post(getFullUrl(`/api/workflows/instances/${instanceId}/approve`), { remarks });
      setRemarks("");
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (instanceId: string) => {
    if (!remarks.trim()) {
      alert("Please provide remarks for rejection");
      return;
    }
    setActionLoading(instanceId);
    try {
      await axios.post(getFullUrl(`/api/workflows/instances/${instanceId}/reject`), { remarks });
      setRemarks("");
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      if (!formData.name || !formData.module || !formData.triggerEvent) {
        alert("Name, module, and trigger event are required");
        return;
      }
      if (formData.steps.some((s) => !s.approverRole)) {
        alert("All steps must have an approver role");
        return;
      }
      await axios.post(getFullUrl("/api/workflows"), formData);
      setShowCreateModal(false);
      setFormData({
        name: "",
        module: "",
        triggerEvent: "",
        description: "",
        steps: [{ level: 1, approverRole: "", action: "", timeoutHours: 24, autoApproveOnTimeout: false }],
      });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create workflow");
    }
  };

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          level: prev.steps.length + 1,
          approverRole: "",
          action: "",
          timeoutHours: 24,
          autoApproveOnTimeout: false,
        },
      ],
    }));
  };

  const removeStep = (index: number) => {
    if (formData.steps.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, level: i + 1 })),
    }));
  };

  const updateStep = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 size={14} />;
      case "REJECTED":
        return <XCircle size={14} />;
      case "PENDING":
        return <Clock size={14} />;
      case "IN_PROGRESS":
        return <RefreshCw size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const moduleOptions = [
    "LEAVE",
    "FEE_DISCOUNT",
    "GATE_PASS",
    "ADMISSION",
    "PURCHASE",
    "CERTIFICATE",
    "TRANSFER",
    "EXPENSE",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Engine</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage approval workflows and track pending requests
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span className="font-medium">Create Workflow</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<GitBranch size={22} />}
            label="Total Workflows"
            value={stats.totalWorkflows}
            color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
          />
          <StatCard
            icon={<Play size={22} />}
            label="Active"
            value={stats.activeWorkflows}
            color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
          />
          <StatCard
            icon={<Clock size={22} />}
            label="Pending"
            value={stats.pendingInstances}
            color="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
          />
          <StatCard
            icon={<CheckCircle2 size={22} />}
            label="Approved Today"
            value={stats.approvedToday}
            color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          />
          <StatCard
            icon={<XCircle size={22} />}
            label="Rejected Today"
            value={stats.rejectedToday}
            color="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex border-b border-gray-100 dark:border-slate-700">
          {[
            { key: "pending", label: "Pending Approvals", count: pendingApprovals.length },
            { key: "workflows", label: "Workflow Templates", count: workflows.length },
            { key: "instances", label: "All Instances", count: instances.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-slate-700">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Pending Approvals Tab */}
          {activeTab === "pending" && (
            <div className="space-y-4">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={48} className="mx-auto text-green-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No pending approvals</p>
                </div>
              ) : (
                pendingApprovals.map((instance) => (
                  <div
                    key={instance.id}
                    className="border border-gray-100 dark:border-slate-700 rounded-lg p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {instance.workflow?.name || "Workflow"}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(instance.status)}`}>
                            {instance.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            Step {instance.currentStep}/{instance.totalSteps}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Module: <span className="font-medium">{instance.entityType}</span> • 
                          Initiated by: <span className="font-medium">{instance.initiatorName || "Unknown"}</span> • 
                          {new Date(instance.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedInstance(instance);
                          setShowHistoryModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <Eye size={18} />
                      </button>
                    </div>

                    {/* Action area */}
                    <div className="mt-4 flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Add remarks (required for reject)..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleApprove(instance.id)}
                        disabled={actionLoading === instance.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(instance.id)}
                        disabled={actionLoading === instance.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Workflow Templates Tab */}
          {activeTab === "workflows" && (
            <div className="space-y-4">
              {workflows.length === 0 ? (
                <div className="text-center py-12">
                  <GitBranch size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No workflows created yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-3 text-indigo-600 text-sm font-medium hover:underline"
                  >
                    Create your first workflow →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workflows.map((wf) => (
                    <div
                      key={wf.id}
                      className="border border-gray-100 dark:border-slate-700 rounded-lg p-5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{wf.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{wf.description || wf.triggerEvent}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            wf.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {wf.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <GitBranch size={12} />
                          {wf.steps.length} steps
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full">
                          {wf.module}
                        </span>
                        {wf._count && (
                          <span>{wf._count.instances} instances</span>
                        )}
                      </div>

                      {/* Steps visualization */}
                      <div className="mt-3 flex items-center gap-1">
                        {wf.steps.map((step, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              {step.level}
                            </div>
                            {idx < wf.steps.length - 1 && (
                              <ArrowRight size={12} className="text-gray-300 mx-0.5" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Instances Tab */}
          {activeTab === "instances" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
                    <th className="pb-3 font-medium">Workflow</th>
                    <th className="pb-3 font-medium">Module</th>
                    <th className="pb-3 font-medium">Initiated By</th>
                    <th className="pb-3 font-medium">Step</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {instances.map((inst) => (
                    <tr key={inst.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        {inst.workflow?.name || "—"}
                      </td>
                      <td className="py-3 text-gray-500">{inst.entityType}</td>
                      <td className="py-3 text-gray-500">{inst.initiatorName || "—"}</td>
                      <td className="py-3 text-gray-500">
                        {inst.currentStep}/{inst.totalSteps}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(inst.status)}`}>
                          {getStatusIcon(inst.status)}
                          {inst.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(inst.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => {
                            setSelectedInstance(inst);
                            setShowHistoryModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {instances.length === 0 && (
                <p className="text-center py-8 text-gray-400">No workflow instances yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Workflow</h2>
              <p className="text-sm text-gray-500 mt-1">Define approval steps for a process</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Leave Approval - 2 Level"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Module & Trigger */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module *
                  </label>
                  <select
                    value={formData.module}
                    onChange={(e) => setFormData((p) => ({ ...p, module: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Module</option>
                    {moduleOptions.map((m) => (
                      <option key={m} value={m}>
                        {m.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trigger Event *
                  </label>
                  <input
                    type="text"
                    value={formData.triggerEvent}
                    onChange={(e) => setFormData((p) => ({ ...p, triggerEvent: e.target.value }))}
                    placeholder="e.g. LEAVE_APPLIED"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Briefly describe when this workflow triggers..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Approval Steps
                  </label>
                  <button
                    onClick={addStep}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Step
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-750 rounded-lg border border-gray-100 dark:border-slate-600"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {step.level}
                      </div>
                      <input
                        type="text"
                        value={step.approverRole}
                        onChange={(e) => updateStep(index, "approverRole", e.target.value)}
                        placeholder="Approver Role (e.g. HOD, PRINCIPAL, ADMIN)"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="number"
                        value={step.timeoutHours}
                        onChange={(e) => updateStep(index, "timeoutHours", parseInt(e.target.value))}
                        className="w-20 px-2 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-center"
                        title="Timeout (hours)"
                      />
                      <span className="text-xs text-gray-400">hrs</span>
                      {formData.steps.length > 1 && (
                        <button
                          onClick={() => removeStep(index)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Workflow History</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedInstance.workflow?.name} • {selectedInstance.entityType}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-6">
                {Array.from({ length: selectedInstance.totalSteps }).map((_, i) => (
                  <div key={i} className="flex items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < selectedInstance.currentStep
                          ? selectedInstance.status === "REJECTED" && i === selectedInstance.currentStep - 1
                            ? "bg-red-500 text-white"
                            : "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-slate-600 text-gray-500"
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < selectedInstance.totalSteps - 1 && (
                      <div
                        className={`flex-1 h-1 mx-1 rounded ${
                          i < selectedInstance.currentStep - 1
                            ? "bg-green-400"
                            : "bg-gray-200 dark:bg-slate-600"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* History timeline */}
              <div className="space-y-4">
                {(selectedInstance.history as any[]).length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No actions taken yet</p>
                ) : (
                  (selectedInstance.history as any[]).map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            entry.action === "APPROVED"
                              ? "bg-green-500"
                              : entry.action === "REJECTED"
                              ? "bg-red-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {idx < (selectedInstance.history as any[]).length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 dark:bg-slate-600 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Step {entry.step} — {entry.action}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          by {entry.byName || "Unknown"} •{" "}
                          {new Date(entry.at).toLocaleString("en-IN")}
                        </p>
                        {entry.remarks && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
                            "{entry.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ══════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

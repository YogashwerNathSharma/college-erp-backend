import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  ShieldAlert,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PageHeader,
  DataTable,
  LoadingSkeleton,
  EmptyState,
  StatusBadge,
  ConfirmDialog,
} from "../../components/enterprise";
import type { Column } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type DisciplinaryRecord = {
  _id: string;
  type: "warning" | "suspension" | "expulsion" | "detention" | "counseling";
  reason: string;
  description: string;
  date: string;
  actionTaken: string;
  issuedBy: string;
  status: "open" | "resolved" | "dismissed";
};

type RecordForm = {
  type: DisciplinaryRecord["type"];
  reason: string;
  description: string;
  date: string;
  actionTaken: string;
  issuedBy: string;
};

const TYPE_CONFIG: Record<DisciplinaryRecord["type"], { label: string; variant: "warning" | "danger" | "neutral" | "info" }> = {
  warning: { label: "Warning", variant: "warning" },
  suspension: { label: "Suspension", variant: "danger" },
  expulsion: { label: "Expulsion", variant: "danger" },
  detention: { label: "Detention", variant: "neutral" },
  counseling: { label: "Counseling", variant: "info" },
};

const STATUS_CONFIG: Record<DisciplinaryRecord["status"], { label: string; variant: "warning" | "success" | "neutral" }> = {
  open: { label: "Open", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  dismissed: { label: "Dismissed", variant: "neutral" },
};

const EMPTY_FORM: RecordForm = {
  type: "warning",
  reason: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  actionTaken: "",
  issuedBy: "",
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function DisciplinaryRecords() {
  const { id } = useParams<{ id: string }>();
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<RecordForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewRecord, setViewRecord] = useState<DisciplinaryRecord | null>(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // ─── Load Data ───────────────────────────────────────────────

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/students/${id}/disciplinary`, authHeaders);
      setRecords(response.data.records || response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRecords();
  }, [id]);

  // ─── CRUD ────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (record: DisciplinaryRecord) => {
    setEditingId(record._id);
    setForm({
      type: record.type,
      reason: record.reason,
      description: record.description,
      date: record.date?.split("T")[0] || "",
      actionTaken: record.actionTaken,
      issuedBy: record.issuedBy,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const response = await axios.put(
          `/api/students/${id}/disciplinary/${editingId}`,
          form,
          authHeaders
        );
        setRecords((prev) => prev.map((r) => (r._id === editingId ? response.data : r)));
        toast.success("Record updated");
      } else {
        const response = await axios.post(
          `/api/students/${id}/disciplinary`,
          form,
          authHeaders
        );
        setRecords((prev) => [response.data, ...prev]);
        toast.success("Record added");
      }
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/students/${id}/disciplinary/${deleteId}`, authHeaders);
      setRecords((prev) => prev.filter((r) => r._id !== deleteId));
      toast.success("Record deleted");
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const updateStatus = async (recordId: string, newStatus: "resolved" | "dismissed") => {
    try {
      const response = await axios.put(
        `/api/students/${id}/disciplinary/${recordId}`,
        { status: newStatus },
        authHeaders
      );
      setRecords((prev) => prev.map((r) => (r._id === recordId ? { ...r, status: newStatus } : r)));
      toast.success(`Record ${newStatus}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // ─── Table Columns ───────────────────────────────────────────

  const columns: Column<DisciplinaryRecord>[] = [
    {
      key: "type",
      label: "Type",
      render: (row) => {
        const config = TYPE_CONFIG[row.type];
        return <StatusBadge label={config.label} variant={config.variant} />;
      },
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => (
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {row.reason}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(row.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "issuedBy",
      label: "Issued By",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const config = STATUS_CONFIG[row.status];
        return <StatusBadge label={config.label} variant={config.variant} />;
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setViewRecord(row); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === "open" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus(row._id, "resolved"); }}
                className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                title="Resolve"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus(row._id, "dismissed"); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Dismiss"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(row._id); }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            title="Delete"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingSkeleton variant="table" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Disciplinary Records"
        subtitle="Manage incident reports and behavioral records"
        icon={<ShieldAlert className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Profile", path: `/students/${id}` },
          { label: "Disciplinary Records" },
        ]}
        actions={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        }
      />

      {records.length === 0 ? (
        <EmptyState
          title="No disciplinary records"
          description="No incidents have been recorded for this student."
          icon={<ShieldAlert className="w-8 h-8" />}
          action={
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={records}
          rowKey="_id"
          searchPlaceholder="Search records..."
          onRowClick={(row) => setViewRecord(row)}
          onRefresh={fetchRecords}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {editingId ? "Edit Record" : "Add Disciplinary Record"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as DisciplinaryRecord["type"] })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="warning">Warning</option>
                    <option value="suspension">Suspension</option>
                    <option value="expulsion">Expulsion</option>
                    <option value="detention">Detention</option>
                    <option value="counseling">Counseling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason *
                </label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Brief reason for the record"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Detailed description of the incident"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Action Taken
                </label>
                <input
                  type="text"
                  value={form.actionTaken}
                  onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                  placeholder="Actions taken or penalties imposed"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Issued By
                </label>
                <input
                  type="text"
                  value={form.issuedBy}
                  onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}
                  placeholder="Teacher/Administrator name"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Add Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewRecord(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setViewRecord(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <StatusBadge label={TYPE_CONFIG[viewRecord.type].label} variant={TYPE_CONFIG[viewRecord.type].variant} size="md" />
              <StatusBadge label={STATUS_CONFIG[viewRecord.status].label} variant={STATUS_CONFIG[viewRecord.status].variant} size="md" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {viewRecord.reason}
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span className="ml-2 text-slate-900 dark:text-white">
                  {new Date(viewRecord.date).toLocaleDateString()}
                </span>
              </div>
              {viewRecord.description && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Description:</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{viewRecord.description}</p>
                </div>
              )}
              {viewRecord.actionTaken && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Action Taken:</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{viewRecord.actionTaken}</p>
                </div>
              )}
              <div>
                <span className="text-slate-500 dark:text-slate-400">Issued By:</span>
                <span className="ml-2 text-slate-900 dark:text-white">{viewRecord.issuedBy}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {viewRecord.status === "open" && (
                <>
                  <button
                    onClick={() => { updateStatus(viewRecord._id, "resolved"); setViewRecord(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve
                  </button>
                  <button
                    onClick={() => { updateStatus(viewRecord._id, "dismissed"); setViewRecord(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss
                  </button>
                </>
              )}
              <button
                onClick={() => { openEditModal(viewRecord); setViewRecord(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        message="Are you sure you want to permanently delete this disciplinary record?"
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

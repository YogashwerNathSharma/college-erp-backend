import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Syringe,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, ConfirmDialog, LoadingSkeleton, EmptyState } from "../../components/enterprise";
import { getFullUrl } from "../../utils/url";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Vaccination {
  id: string;
  vaccineName: string;
  doseNumber: number;
  dateGiven: string;
  nextDueDate: string | null;
  hospital: string;
  doctorName: string;
  batchNo: string;
  remarks: string;
  documentUrl: string | null;
  createdAt: string;
}

interface StudentHeader {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  photoUrl: string | null;
  enrollments: { class: { name: string }; section: { name: string } }[];
}

interface FormData {
  vaccineName: string;
  doseNumber: number;
  dateGiven: string;
  nextDueDate: string;
  hospital: string;
  doctorName: string;
  batchNo: string;
  remarks: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const VACCINES = [
  "BCG", "OPV", "Hepatitis B", "DPT", "Hib", "Rotavirus", "PCV",
  "IPV", "Measles", "MR", "JE", "DPT Booster", "OPV Booster",
  "Td", "HPV", "Typhoid", "Varicella", "Hepatitis A", "MMR", "COVID-19", "Other"
];

const emptyForm: FormData = {
  vaccineName: "",
  doseNumber: 1,
  dateGiven: "",
  nextDueDate: "",
  hospital: "",
  doctorName: "",
  batchNo: "",
  remarks: "",
};

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function StudentVaccination() {
  const { id: studentId } = useParams<{ id: string }>();

  const [student, setStudent] = useState<StudentHeader | null>(null);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ─── Load Data ─────────────────────────────────────────────
  useEffect(() => {
    if (!studentId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentRes, vaccRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/students/${studentId}`, authHeaders()),
          axios.get(`${API_BASE_URL}/api/students/operations/${studentId}/vaccinations`, authHeaders()),
        ]);
        setStudent(studentRes.data.data);
        setVaccinations(vaccRes.data.data || []);
      } catch (err: any) {
        toast.error("Failed to load vaccination records");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  // ─── Due Vaccinations ──────────────────────────────────────
  const dueVaccinations = vaccinations.filter((v) => {
    if (!v.nextDueDate) return false;
    return new Date(v.nextDueDate) <= new Date();
  });

  // ─── Open Add Modal ────────────────────────────────────────
  const openAddModal = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  // ─── Open Edit Modal ───────────────────────────────────────
  const openEditModal = (vac: Vaccination) => {
    setFormData({
      vaccineName: vac.vaccineName,
      doseNumber: vac.doseNumber,
      dateGiven: vac.dateGiven ? vac.dateGiven.split("T")[0] : "",
      nextDueDate: vac.nextDueDate ? vac.nextDueDate.split("T")[0] : "",
      hospital: vac.hospital || "",
      doctorName: vac.doctorName || "",
      batchNo: vac.batchNo || "",
      remarks: vac.remarks || "",
    });
    setEditingId(vac.id);
    setModalOpen(true);
  };

  // ─── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.vaccineName || !formData.dateGiven) {
      toast.error("Vaccine name and date are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await axios.put(
          `${API_BASE_URL}/api/students/operations/${studentId}/vaccinations/${editingId}`,
          formData,
          authHeaders()
        );
        toast.success("Vaccination record updated");
      } else {
        await axios.post(
          `${API_BASE_URL}/api/students/operations/${studentId}/vaccinations`,
          formData,
          authHeaders()
        );
        toast.success("Vaccination record added");
      }

      // Refresh
      const res = await axios.get(`${API_BASE_URL}/api/students/operations/${studentId}/vaccinations`, authHeaders());
      setVaccinations(res.data.data || []);
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/students/operations/${studentId}/vaccinations/${id}`,
        authHeaders()
      );
      setVaccinations((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vaccination record deleted");
    } catch (err: any) {
      toast.error("Failed to delete");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Vaccination Records"
        subtitle="Manage immunization history"
        icon={<Syringe className="w-6 h-6" />}
        actions={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Vaccination
          </button>
        }
      />

      {/* Student Header Card */}
      {student && (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
          {student.photoUrl ? (
            <img src={getFullUrl(student.photoUrl)} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {student.firstName[0]}{student.lastName[0]}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
            <p className="text-sm text-slate-500">{student.admissionNo} | {student.enrollments?.[0]?.class?.name || ""} - {student.enrollments?.[0]?.section?.name || ""}</p>
          </div>
        </div>
      )}

      {/* Due Vaccination Alerts */}
      {dueVaccinations.length > 0 && (
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-amber-800 dark:text-amber-300">Due Vaccinations ({dueVaccinations.length})</h4>
          </div>
          <div className="space-y-1">
            {dueVaccinations.map((v) => (
              <p key={v.id} className="text-sm text-amber-700 dark:text-amber-400">
                • {v.vaccineName} (Dose {v.doseNumber}) — Due: {new Date(v.nextDueDate!).toLocaleDateString("en-IN")}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Vaccination Table */}
      <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {vaccinations.length === 0 ? (
          <EmptyState
            icon={<Syringe className="w-12 h-12" />}
            title="No Vaccination Records"
            description="Add vaccination records to track immunization history"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Vaccine</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Dose</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date Given</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Next Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Hospital</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {vaccinations.map((vac) => {
                  const isDue = vac.nextDueDate && new Date(vac.nextDueDate) <= new Date();
                  return (
                    <tr key={vac.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{vac.vaccineName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">Dose {vac.doseNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{new Date(vac.dateGiven).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {vac.nextDueDate ? new Date(vac.nextDueDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{vac.hospital || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{vac.doctorName || "—"}</td>
                      <td className="px-4 py-3">
                        {isDue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Clock className="w-3 h-3" /> Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" /> Done
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(vac)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(vac.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingId ? "Edit Vaccination" : "Add Vaccination"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Vaccine Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vaccine Name *</label>
                <select
                  value={formData.vaccineName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vaccineName: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Vaccine</option>
                  {VACCINES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {/* Dose & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dose Number *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.doseNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, doseNumber: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date Given *</label>
                  <input
                    type="date"
                    value={formData.dateGiven}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateGiven: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Next Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nextDueDate: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Hospital & Doctor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hospital</label>
                  <input
                    type="text"
                    value={formData.hospital}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hospital: e.target.value }))}
                    placeholder="Hospital name"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Doctor</label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, doctorName: e.target.value }))}
                    placeholder="Doctor name"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Batch & Remarks */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch No</label>
                <input
                  type="text"
                  value={formData.batchNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, batchNo: e.target.value }))}
                  placeholder="Vaccine batch number"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Any remarks..."
                  rows={2}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-2.5 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingId ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          title="Delete Vaccination Record"
          message="Are you sure you want to delete this vaccination record? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

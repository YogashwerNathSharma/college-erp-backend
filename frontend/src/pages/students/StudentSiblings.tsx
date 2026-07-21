import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Trash2,
  Search,
  Link2,
  ExternalLink,
  X,
  Loader2,
  User,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { PageHeader, ConfirmDialog, LoadingSkeleton, EmptyState } from "../../components/enterprise";
import { getFullUrl } from "../../utils/url";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Sibling {
  id: string;
  name: string;
  relation: string;
  class: string;
  school: string;
  dob: string | null;
  siblingStudentId: string | null;
}

interface StudentHeader {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  photoUrl: string | null;
  enrollments: { class: { name: string }; section: { name: string } }[];
}

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  enrollments: { class: { name: string }; section: { name: string } }[];
}

interface FormData {
  name: string;
  relation: string;
  class: string;
  school: string;
  dob: string;
  siblingStudentId: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

export default function StudentSiblings() {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<StudentHeader | null>(null);
  const [siblings, setSiblings] = useState<Sibling[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    relation: "",
    class: "",
    school: "",
    dob: "",
    siblingStudentId: "",
  });

  // ─── Load Data ─────────────────────────────────────────────
  useEffect(() => {
    if (!studentId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentRes, sibRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/students/${studentId}`, authHeaders()),
          axios.get(`${API_BASE_URL}/api/students/operations/${studentId}/siblings`, authHeaders()),
        ]);
        setStudent(studentRes.data.data);
        setSiblings(sibRes.data.data || []);
      } catch (err: any) {
        toast.error("Failed to load sibling records");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  // ─── Search existing students ──────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/students?search=${encodeURIComponent(searchQuery)}&limit=6`,
          authHeaders()
        );
        const results = (res.data.data?.students || []).filter((s: any) => s.id !== studentId);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, studentId]);

  // ─── Select linked student ─────────────────────────────────
  const selectLinkedStudent = (s: SearchResult) => {
    setFormData((prev) => ({
      ...prev,
      name: `${s.firstName} ${s.lastName}`,
      class: s.enrollments?.[0]?.class?.name || "",
      school: "Same School",
      siblingStudentId: s.id,
    }));
    setSearchQuery("");
    setSearchResults([]);
    setLinkMode(false);
  };

  // ─── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.relation) {
      toast.error("Name and relation are required");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/students/operations/${studentId}/siblings`,
        {
          name: formData.name.trim(),
          relation: formData.relation,
          class: formData.class || undefined,
          school: formData.school || undefined,
          dob: formData.dob || undefined,
          siblingStudentId: formData.siblingStudentId || undefined,
        },
        authHeaders()
      );
      toast.success("Sibling added");

      // Refresh
      const res = await axios.get(`${API_BASE_URL}/api/students/operations/${studentId}/siblings`, authHeaders());
      setSiblings(res.data.data || []);
      setModalOpen(false);
      setFormData({ name: "", relation: "", class: "", school: "", dob: "", siblingStudentId: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add sibling");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/students/operations/${studentId}/siblings/${id}`, authHeaders());
      setSiblings((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sibling removed");
    } catch {
      toast.error("Failed to remove sibling");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return <div className="p-6"><LoadingSkeleton variant="card" count={3} /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Siblings"
        subtitle="Manage sibling relationships"
        icon={<Users className="w-6 h-6" />}
        actions={
          <button
            onClick={() => { setModalOpen(true); setFormData({ name: "", relation: "", class: "", school: "", dob: "", siblingStudentId: "" }); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Sibling
          </button>
        }
      />

      {/* Student Header */}
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

      {/* Siblings List */}
      <div className="mt-4 space-y-3">
        {siblings.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No Siblings Recorded"
              description="Add sibling information to track family connections"
            />
          </div>
        ) : (
          siblings.map((sibling) => (
            <div
              key={sibling.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-white">{sibling.name}</p>
                    {sibling.siblingStudentId && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Link2 className="w-3 h-3" /> Linked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {sibling.relation} {sibling.class ? `| Class: ${sibling.class}` : ""} {sibling.school ? `| ${sibling.school}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sibling.siblingStudentId && (
                  <button
                    onClick={() => navigate(`/students/${sibling.siblingStudentId}`)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    title="View Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirm(sibling.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Sibling</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Link existing student toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLinkMode(!linkMode)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${linkMode ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"}`}
                >
                  <Link2 className="w-3 h-3 inline mr-1" />
                  Link Existing Student
                </button>
              </div>

              {/* Search for existing student */}
              {linkMode && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student in school..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                      {searchResults.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => selectLinkedStudent(s)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm border-b last:border-b-0 border-slate-100 dark:border-slate-700"
                        >
                          <span className="font-medium">{s.firstName} {s.lastName}</span>
                          <span className="text-slate-400 ml-2">({s.admissionNo})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Sibling's full name"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Relation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relation *</label>
                <select
                  value={formData.relation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, relation: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Relation</option>
                  <option value="Elder Brother">Elder Brother</option>
                  <option value="Younger Brother">Younger Brother</option>
                  <option value="Elder Sister">Elder Sister</option>
                  <option value="Younger Sister">Younger Sister</option>
                  <option value="Twin">Twin</option>
                </select>
              </div>

              {/* Class & School */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData((prev) => ({ ...prev, class: e.target.value }))}
                    placeholder="e.g., 8th"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">School</label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData((prev) => ({ ...prev, school: e.target.value }))}
                    placeholder="School name"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Sibling
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          title="Remove Sibling"
          message="Are you sure you want to remove this sibling relationship?"
          confirmLabel="Remove"
          variant="danger"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import { FiBookOpen, FiPlus, FiCalendar } from "react-icons/fi";

interface ClassItem { id: string; name: string; section?: string; }

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}
function normalizeId(item: any): string { return item?.id || item?._id || ""; }
function Spinner() { return (<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>); }

export default function HomeworkPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", classId: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(getFullUrl("/api/class"), { headers: getAuthHeaders() })
      .then((res) => {
        const data = res.data?.data?.data || res.data?.data || [];
        setClasses(Array.isArray(data) ? data : []);
      }).catch(() => toast.error("Failed to load classes"));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    axios.get(getFullUrl("/api/communication/notices"), { headers: getAuthHeaders(), params: { classId: selectedClass, type: "HOMEWORK" } })
      .then((res) => {
        const data = res.data?.data?.data || res.data?.data || [];
        setHomework(Array.isArray(data) ? data : []);
      }).catch(() => { setHomework([]); }).finally(() => setLoading(false));
  }, [selectedClass]);

  async function handleCreate() {
    if (!form.title || !form.classId) { toast.error("Title and class are required"); return; }
    setSubmitting(true);
    try {
      await axios.post(getFullUrl("/api/communication/notices"), { ...form, type: "HOMEWORK" }, { headers: getAuthHeaders() });
      toast.success("Homework created!");
      setShowCreate(false);
      setForm({ title: "", description: "", dueDate: "", classId: "" });
      if (selectedClass) {
        const res = await axios.get(getFullUrl("/api/communication/notices"), { headers: getAuthHeaders(), params: { classId: selectedClass, type: "HOMEWORK" } });
        const data = res.data?.data?.data || res.data?.data || [];
        setHomework(Array.isArray(data) ? data : []);
      }
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to create homework"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Homework</h2>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"><FiPlus size={16} /> Create</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
        <select className="w-full sm:w-64 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">-- Select Class --</option>
          {classes.map((cls) => (<option key={normalizeId(cls)} value={normalizeId(cls)}>{cls.name} {cls.section ? `(${cls.section})` : ""}</option>))}
        </select>
      </div>

      {loading ? <Spinner /> : homework.length > 0 ? (
        <div className="space-y-3">
          {homework.map((hw: any, i: number) => (
            <div key={normalizeId(hw) || i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{hw.title || "Homework"}</h3>
                  <p className="text-sm text-gray-500 mt-1">{hw.description || "No description"}</p>
                </div>
                {hw.dueDate && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1"><FiCalendar size={12} />{new Date(hw.dueDate).toLocaleDateString("en-IN")}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : selectedClass ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200"><FiBookOpen className="mx-auto text-4xl mb-3 text-gray-300" /><p>No homework found for this class.</p></div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200"><FiBookOpen className="mx-auto text-4xl mb-3 text-gray-300" /><p>Select a class to view homework.</p></div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create Homework</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={form.classId} onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))}>
                  <option value="">-- Select --</option>
                  {classes.map((cls) => (<option key={normalizeId(cls)} value={normalizeId(cls)}>{cls.name}</option>))}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleCreate} disabled={submitting} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{submitting ? "Creating..." : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

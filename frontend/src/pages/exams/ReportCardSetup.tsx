import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown, Loader2, Plus, Save } from "lucide-react";
import { getFullUrl } from "../../utils/url";

interface SkillItem {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface TemplateSkill {
  skillId: string;
  sortOrder: number;
}

interface TemplateData {
  id: string;
  name: string;
  layout: string;
  isActive: boolean;
  skills: TemplateSkill[];
}

const LAYOUTS = [
  { value: "GRADE", label: "With Grade" },
  { value: "NO_GRADE", label: "Without Grade" },
  { value: "NEW", label: "New Layout (Life Skills + Health)" },
];

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

export default function ReportCardSetup() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exam, setExam] = useState<any>(null);
  const [masters, setMasters] = useState<SkillItem[]>([]);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [name, setName] = useState("");
  const [layout, setLayout] = useState("GRADE");
  const [selected, setSelected] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const exRes = await axios.get(getFullUrl(`/api/exam/${id}`), { headers });
      const ex = exRes.data?.data || exRes.data;
      setExam(ex);
      const scopeQs = `classId=${ex?.classId}&academicYearId=${ex?.academicYearId}`;
      const [skillRes, tplRes] = await Promise.all([
        axios.get(getFullUrl(`/api/exam/report-card-skills?includeInactive=true&${scopeQs}`), { headers }),
        axios.get(getFullUrl(`/api/exam/${id}/report-card-template`), { headers }),
      ]);

      const list = skillRes.data?.data || [];
      setMasters(Array.isArray(list) ? list : []);

      const tpl: TemplateData | null = tplRes.data?.data || null;
      setTemplate(tpl);
      if (tpl) {
        setName(tpl.name || "");
        setLayout(tpl.layout || "GRADE");
        const ordered = [...(tpl.skills || [])].sort((a, b) => a.sortOrder - b.sortOrder);
        setSelected(ordered.map((s) => s.skillId));
      } else {
        setName(ex?.name ? `${ex.name} Report Card` : "Report Card");
        setLayout("GRADE");
        setSelected([]);
      }
    } catch {
      toast.error("Failed to load report card setup");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const addSkill = async () => {
    const skillName = newSkill.trim();
    if (!skillName) return;
    try {
      await axios.post(
        getFullUrl(`/api/exam/report-card-skills`),
        { name: skillName, sortOrder: masters.length + 1 },
        { headers }
      );
      setNewSkill("");
      toast.success("Skill added");
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add skill");
    }
  };

  const renameSkill = async (s: SkillItem) => {
    const next = window.prompt("Skill name", s.name);
    if (!next || !next.trim() || next.trim() === s.name) return;
    try {
      await axios.put(getFullUrl(`/api/exam/report-card-skills/${s.id}`), { name: next.trim() }, { headers });
      toast.success("Skill renamed");
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to rename skill");
    }
  };

  const toggleSkillActive = async (s: SkillItem) => {
    try {
      await axios.put(getFullUrl(`/api/exam/report-card-skills/${s.id}`), { isActive: !s.isActive }, { headers });
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update skill");
    }
  };

  const toggleInTemplate = (skillId: string) => {
    setSelected((prev) =>
      prev.includes(skillId) ? prev.filter((x) => x !== skillId) : [...prev, skillId]
    );
  };

  const moveInTemplate = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= selected.length) return;
    const copy = [...selected];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    setSelected(copy);
  };

  const saveAll = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const tplRes = await axios.put(
        getFullUrl(`/api/exam/${id}/report-card-template`),
        { name, layout },
        { headers }
      );
      const templateId = tplRes.data?.data?.id || template?.id;
      if (!templateId) throw new Error("Template id missing");

      await axios.put(
        getFullUrl(`/api/exam/report-card-template/${templateId}/skills`),
        { skillIds: selected },
        { headers }
      );
      toast.success("Report card setup saved");
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const masterById = new Map(masters.map((m) => [m.id, m]));
  const activeMasters = masters.filter((m) => m.isActive);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => navigate("/exams")}
          className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Card Setup</h1>
          {exam && (
            <p className="mt-1 text-sm text-gray-500">
              {exam.name} {exam.session ? `• ${exam.session}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* 1. Layout and name */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">1. Layout</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Template name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Layout</label>
            <select className={inputClass} value={layout} onChange={(e) => setLayout(e.target.value)}>
              {LAYOUTS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Skill master (DB list) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">2. Skill list (admin master)</h2>
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="New skill name"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addSkill();
            }}
          />
          <button
            onClick={addSkill}
            className="inline-flex items-center gap-1 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {masters.length === 0 ? (
          <p className="text-sm text-gray-500">Abhi koi skill nahi hai. Upar se add karein.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {masters.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className={s.isActive ? "text-gray-800" : "text-gray-400 line-through"}>{s.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => renameSkill(s)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                    Rename
                  </button>
                  <button onClick={() => toggleSkillActive(s)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                    {s.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Skills shown on this report card, in order */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">3. Skills on this report card</h2>

        <div>
          <p className="text-xs text-gray-500 mb-2">Chunein kaunsi skills dikhengi:</p>
          {activeMasters.length === 0 ? (
            <p className="text-sm text-gray-500">Koi active skill nahi hai.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activeMasters.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={selected.includes(s.id)}
                    onChange={() => toggleInTemplate(s.id)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Order (report card par isi tarah dikhegi):</p>
            <ol className="space-y-1">
              {selected.map((sid, index) => (
                <li key={sid} className="flex items-center justify-between text-sm border rounded px-3 py-1.5">
                  <span>
                    {index + 1}. {masterById.get(sid)?.name || "Unknown skill"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveInTemplate(index, -1)}
                      disabled={index === 0}
                      className="p-1 border rounded disabled:opacity-40"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveInTemplate(index, 1)}
                      disabled={index === selected.length - 1}
                      className="p-1 border rounded disabled:opacity-40"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <button
        onClick={saveAll}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Report Card Setup
      </button>
    </div>
  );
}

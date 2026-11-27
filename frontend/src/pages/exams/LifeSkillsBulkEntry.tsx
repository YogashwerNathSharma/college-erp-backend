import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Search } from "lucide-react";
import { getFullUrl } from "../../utils/url";

interface Skill {
  id: string;
  name: string;
}
interface Student {
  studentId: string;
  studentName: string;
  admissionNo: string;
}
interface Value {
  studentId: string;
  skillName: string;
  term1Value: string | null;
  term2Value: string | null;
}

// Desktop table cell input
const cellInput =
  "w-24 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500";

// Mobile input: taller, touch friendly
const mobileInput =
  "w-full min-h-[44px] border border-gray-300 rounded-lg px-3 py-2 text-base text-center focus:outline-none focus:ring-2 focus:ring-primary-500";

export default function LifeSkillsBulkEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exam, setExam] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  // key: `${studentId}|${skillName}` -> { term1, term2 }
  const [cells, setCells] = useState<Record<string, { term1: string; term2: string }>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const key = (sid: string, skill: string) => `${sid}|${skill}`;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [exRes, bulkRes] = await Promise.all([
          axios.get(getFullUrl(`/api/exam/${id}`), { headers }),
          axios.get(getFullUrl(`/api/exam/report-card-bulk/${id}`), { headers }),
        ]);
        setExam(exRes.data?.data || exRes.data);

        const d = bulkRes.data?.data || {};
        setSkills(Array.isArray(d.skills) ? d.skills : []);
        setStudents(Array.isArray(d.students) ? d.students : []);

        const map: Record<string, { term1: string; term2: string }> = {};
        (d.values || []).forEach((v: Value) => {
          map[key(v.studentId, v.skillName)] = {
            term1: v.term1Value || "",
            term2: v.term2Value || "",
          };
        });
        setCells(map);
      } catch {
        toast.error("Life skill entry load nahi hua");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const setCell = (sid: string, skill: string, term: "term1" | "term2", value: string) => {
    setCells((prev) => {
      const k = key(sid, skill);
      const cur = prev[k] || { term1: "", term2: "" };
      return { ...prev, [k]: { ...cur, [term]: value } };
    });
  };

  const getCell = (sid: string, skill: string) => cells[key(sid, skill)] || { term1: "", term2: "" };

  // Search by name or admission number (works for both table and card view)
  const visibleStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.studentName || "").toLowerCase().includes(q) ||
        (s.admissionNo || "").toLowerCase().includes(q)
    );
  }, [students, query]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Always save every student's values, even when a search filter is active
      const payload = students.flatMap((s) =>
        skills.map((sk) => ({
          studentId: s.studentId,
          skillName: sk.name,
          term1Value: getCell(s.studentId, sk.name).term1,
          term2Value: getCell(s.studentId, sk.name).term2,
        }))
      );
      await axios.post(getFullUrl(`/api/exam/report-card-bulk/${id}`), { rows: payload }, { headers });
      toast.success("Life skills saved for the class");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const emptySkills = skills.length === 0;

  return (
    <div className="p-3 md:p-6 pb-24 md:pb-6">
      {/* Header: wraps on small screens */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center min-w-0">
          <button
            onClick={() => navigate("/exams")}
            className="mr-2 md:mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Life Skills Entry</h1>
            {exam && (
              <p className="text-xs md:text-sm text-gray-500 truncate">
                {exam.name} • {exam.session || ""}
              </p>
            )}
          </div>
        </div>
        {/* Desktop save button (mobile uses the sticky bar below) */}
        <button
          onClick={handleSave}
          disabled={saving || emptySkills}
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Life Skills
        </button>
      </div>

      {emptySkills ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          Admin ne abhi skills set nahi ki hain. Report Card Setup mein add karein.
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          Is class mein koi student nahi mila.
        </div>
      ) : (
        <>
          {/* Search: name or admission number */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Student ya admission no. search karein"
              className="w-full min-h-[44px] pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Mobile: one card per student, skills stacked */}
          <div className="md:hidden space-y-3">
            {visibleStudents.map((s, idx) => (
              <div key={s.studentId} className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs text-gray-400 mt-1">{students.indexOf(s) + 1}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 break-words">{s.studentName}</div>
                    <div className="text-xs text-gray-500">{s.admissionNo}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {skills.map((sk) => (
                    <div key={sk.id} className="border-t pt-2">
                      <div className="text-sm font-medium text-gray-700 mb-1">{sk.name}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-gray-500 mb-0.5">TERM - 1st</label>
                          <input
                            className={mobileInput}
                            value={getCell(s.studentId, sk.name).term1}
                            onChange={(e) => setCell(s.studentId, sk.name, "term1", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500 mb-0.5">TERM - 2nd</label>
                          <input
                            className={mobileInput}
                            value={getCell(s.studentId, sk.name).term2}
                            onChange={(e) => setCell(s.studentId, sk.name, "term2", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {visibleStudents.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">Koi student nahi mila.</p>
            )}
          </div>

          {/* Desktop: Marks-Entry style grid */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-auto max-h-[70vh]">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left sticky left-0 bg-gray-50 min-w-[50px]">#</th>
                  <th className="px-3 py-2 text-left sticky left-[50px] bg-gray-50 min-w-[180px]">Student</th>
                  {skills.map((sk) => (
                    <th key={sk.id} className="px-3 py-2 text-center min-w-[230px]">
                      <div className="font-semibold text-gray-700">{sk.name}</div>
                      <div className="flex justify-center gap-2 text-[11px] text-gray-500 mt-1">
                        <span className="w-24 text-center">TERM - 1st</span>
                        <span className="w-24 text-center">TERM - 2nd</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleStudents.map((s) => (
                  <tr key={s.studentId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 sticky left-0 bg-white">{students.indexOf(s) + 1}</td>
                    <td className="px-3 py-2 sticky left-[50px] bg-white">
                      <div className="font-medium text-gray-900">{s.studentName}</div>
                      <div className="text-xs text-gray-500">{s.admissionNo}</div>
                    </td>
                    {skills.map((sk) => (
                      <td key={sk.id} className="px-3 py-2">
                        <div className="flex justify-center gap-2">
                          <input
                            className={cellInput}
                            value={getCell(s.studentId, sk.name).term1}
                            onChange={(e) => setCell(s.studentId, sk.name, "term1", e.target.value)}
                          />
                          <input
                            className={cellInput}
                            value={getCell(s.studentId, sk.name).term2}
                            onChange={(e) => setCell(s.studentId, sk.name, "term2", e.target.value)}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Mobile sticky save bar */}
      {!emptySkills && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 z-20">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Life Skills
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { getFullUrl } from "../../utils/url";

interface SkillItem {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface StudentOption {
  id: string;
  name: string;
  admissionNo: string;
}

interface SkillValue {
  term1: string;
  term2: string;
}

interface HealthValue {
  height: string;
  weight: string;
  bloodGroup: string;
  dentalHygiene: string;
  passedPromotedToClass: string;
  schoolReopen: string;
}

const emptyHealth: HealthValue = {
  height: "",
  weight: "",
  bloodGroup: "",
  dentalHygiene: "",
  passedPromotedToClass: "",
  schoolReopen: "",
};

const inputClass =
  "w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

export default function LifeSkillsEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exam, setExam] = useState<any>(null);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [values, setValues] = useState<Record<string, SkillValue>>({});
  const [health, setHealth] = useState<HealthValue>(emptyHealth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load exam, skill master (from DB) and students of the exam's class/section
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const examRes = await axios.get(getFullUrl(`/api/exam/${id}`), { headers });
        const ex = examRes.data?.data || examRes.data;
        setExam(ex);

        const safe = (p: Promise<any>) => p.then((r) => r).catch(() => null);
        const [skillRes, marksRes, tplRes] = await Promise.all([
          safe(axios.get(getFullUrl(`/api/exam/report-card-skills?classId=${ex?.classId}&academicYearId=${ex?.academicYearId}`), { headers })),
          safe(axios.get(getFullUrl(`/api/exam/${id}/marks`), { headers })),
          safe(axios.get(getFullUrl(`/api/exam/${id}/report-card-template`), { headers })),
        ]);

        const skillList: SkillItem[] = skillRes?.data?.data || [];
        const tpl = tplRes?.data?.data || null;
        // If admin set up a template for this exam, show only its skills, in its order
        const tplIds: string[] = (tpl?.skills || []).map((s: any) => s.skillId);
        const visible: SkillItem[] = tplIds.length
          ? (tplIds
              .map((sid) => skillList.find((s) => s.id === sid))
              .filter(Boolean) as SkillItem[])
          : skillList;
        setSkills(Array.isArray(visible) ? visible : []);

        if (!marksRes) {
          toast.error("Students load nahi hue. Backend check karein.");
        }
        const marksData = marksRes?.data?.data || marksRes?.data || {};
        const stuList = Array.isArray(marksData.students) ? marksData.students : [];
        setStudents(
          stuList.map((s: any) => ({
            id: s.studentId,
            name: s.studentName || "",
            admissionNo: s.admissionNo || "",
          }))
        );
      } catch {
        toast.error("Failed to load life skills data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // When a student is picked, load their saved values
  useEffect(() => {
    if (!studentId || !exam?.academicYearId) {
      setValues({});
      setHealth(emptyHealth);
      return;
    }
    axios
      .get(
        getFullUrl(`/api/exam/report-card-extras/${studentId}?academicYearId=${exam.academicYearId}`),
        { headers }
      )
      .then((res) => {
        const d = res.data?.data || {};
        const map: Record<string, SkillValue> = {};
        (d.lifeSkills || []).forEach((s: any) => {
          map[s.skillName] = { term1: s.term1Value || "", term2: s.term2Value || "" };
        });
        setValues(map);
        const h = d.health;
        setHealth(
          h
            ? {
                height: h.height || "",
                weight: h.weight || "",
                bloodGroup: h.bloodGroup || "",
                dentalHygiene: h.dentalHygiene || "",
                passedPromotedToClass: h.passedPromotedToClass || "",
                schoolReopen: h.schoolReopen || "",
              }
            : emptyHealth
        );
      })
      .catch(() => toast.error("Failed to load student's saved data"));
  }, [studentId, exam?.academicYearId]);

  const setSkillValue = (skillName: string, term: "term1" | "term2", value: string) => {
    setValues((prev) => ({
      ...prev,
      [skillName]: { term1: prev[skillName]?.term1 || "", term2: prev[skillName]?.term2 || "", [term]: value },
    }));
  };

  const handleSave = async () => {
    if (!studentId || !exam?.academicYearId) {
      toast.error("Please select a student");
      return;
    }
    setSaving(true);
    try {
      const skillsPayload = skills.map((s) => ({
        skillName: s.name,
        term1Value: values[s.name]?.term1 ?? "",
        term2Value: values[s.name]?.term2 ?? "",
      }));
      await axios.post(
        getFullUrl(`/api/exam/report-card-extras/${studentId}/life-skills`),
        { academicYearId: exam.academicYearId, skills: skillsPayload },
        { headers }
      );
      await axios.post(
        getFullUrl(`/api/exam/report-card-extras/${studentId}/health`),
        { academicYearId: exam.academicYearId, health },
        { headers }
      );
      toast.success("Life skills saved");
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/exams")}
          className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Life Skills & Health</h1>
          {exam && (
            <p className="mt-1 text-sm text-gray-500">
              {exam.name} • {exam.session || ""}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Student</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
        >
          <option value="">-- Select Student --</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.admissionNo ? `(${s.admissionNo})` : ""}
            </option>
          ))}
        </select>
      </div>

      {studentId && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Class Teacher Evaluation</h2>
            {skills.length === 0 ? (
              <p className="text-sm text-gray-500">
                Skill list khali hai. Pehle admin skills add karein.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-2 py-2">Skill</th>
                    <th className="px-2 py-2 w-40">TERM - 1st</th>
                    <th className="px-2 py-2 w-40">TERM - 2nd</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="px-2 py-2">{s.name}</td>
                      <td className="px-2 py-1">
                        <input
                          className={inputClass}
                          value={values[s.name]?.term1 || ""}
                          onChange={(e) => setSkillValue(s.name, "term1", e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className={inputClass}
                          value={values[s.name]?.term2 || ""}
                          onChange={(e) => setSkillValue(s.name, "term2", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Health Status</h2>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["height", "Height"],
                  ["weight", "Weight"],
                  ["bloodGroup", "Blood Group"],
                  ["dentalHygiene", "Dental Hygiene"],
                  ["passedPromotedToClass", "Passed and Promoted to Class"],
                  ["schoolReopen", "School Reopen"],
                ] as [keyof HealthValue, string][]
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    className={inputClass}
                    value={health[key]}
                    onChange={(e) => setHealth({ ...health, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getFullUrl } from "../../utils/url";
import { FiUsers } from "react-icons/fi";

interface ClassItem { id: string; name: string; section?: string; }
interface Student { id: string; firstName: string; lastName: string; rollNumber?: string; }
interface Exam { id: string; name: string; classId?: string; subjects?: { subjectId: string; subjectName: string; maxMarks: number }[]; }
interface MarkRecord { studentId: string; marks: number; }

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function normalizeId(item: any): string {
  return item?.id || item?._id || "";
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

export default function MarksEntryPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(getFullUrl("/api/class"), { headers: getAuthHeaders() }),
      axios.get(getFullUrl("/api/exam"), { headers: getAuthHeaders() }),
    ]).then(([classRes, examRes]) => {
      const classData = classRes.data?.data?.data || classRes.data?.data || [];
      const examData = examRes.data?.data?.data || examRes.data?.data || [];
      setClasses(Array.isArray(classData) ? classData : []);
      setExams(Array.isArray(examData) ? examData : []);
    }).catch(() => toast.error("Failed to load data"));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    axios.get(getFullUrl("/api/students"), { headers: getAuthHeaders(), params: { classId: selectedClass } })
      .then((res) => {
        const data = res.data?.data?.data || res.data?.data || [];
        const studentList: Student[] = Array.isArray(data) ? data : [];
        setStudents(studentList);
        const initial: Record<string, number> = {};
        studentList.forEach((s) => { initial[normalizeId(s)] = 0; });
        setMarks(initial);
      }).catch(() => toast.error("Failed to load students")).finally(() => setLoading(false));
  }, [selectedClass]);

  const selectedExamObj = useMemo(() => exams.find((e) => normalizeId(e) === selectedExam), [exams, selectedExam]);

  async function handleSubmit() {
    if (!selectedClass || !selectedExam || !selectedSubject) { toast.error("Please select class, exam, and subject"); return; }
    setSubmitting(true);
    try {
      const records: MarkRecord[] = Object.entries(marks).map(([studentId, m]) => ({ studentId, marks: m }));
      await axios.post(getFullUrl("/api/exam/marks"), { examId: selectedExam, classId: selectedClass, subjectId: selectedSubject, marks: records }, { headers: getAuthHeaders() });
      toast.success("Marks submitted successfully!");
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to submit marks"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Enter Marks</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map((cls) => (<option key={normalizeId(cls)} value={normalizeId(cls)}>{cls.name} {cls.section ? `(${cls.section})` : ""}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
              <option value="">-- Select Exam --</option>
              {exams.map((exam) => (<option key={normalizeId(exam)} value={normalizeId(exam)}>{exam.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
            <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">-- Select Subject --</option>
              {selectedExamObj?.subjects?.map((sub) => (<option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName} (Max: {sub.maxMarks})</option>))}
            </select>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : students.length > 0 && selectedSubject ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><p className="text-sm font-medium text-gray-700">Enter marks for {students.length} student{students.length !== 1 ? "s" : ""}</p></div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {students.map((student) => {
              const sid = normalizeId(student);
              return (
                <div key={sid} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">{student.firstName?.[0] || "S"}</div>
                    <div><p className="text-sm font-medium text-gray-800">{student.firstName} {student.lastName}</p>{student.rollNumber && <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>}</div>
                  </div>
                  <input type="number" min={0} max={selectedExamObj?.subjects?.find((s) => s.subjectId === selectedSubject)?.maxMarks || 100} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={marks[sid] ?? 0} onChange={(e) => setMarks((prev) => ({ ...prev, [sid]: Number(e.target.value) }))} />
                </div>
              );
            })}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{submitting ? "Submitting..." : "Submit Marks"}</button>
          </div>
        </div>
      ) : selectedClass && selectedExam && selectedSubject ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200"><FiUsers className="mx-auto text-4xl mb-3 text-gray-300" /><p>No students found in this class.</p></div>
      ) : null}
    </div>
  );
}

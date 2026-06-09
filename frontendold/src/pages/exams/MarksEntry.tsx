
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, ClipboardList } from "lucide-react";

interface SubjectInfo {
  _id: string;
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
}

interface StudentMark {
  subjectId: string;
  marks: number | null;
  isAbsent: boolean;
}

interface Student {
  _id: string;
  name: string;
  admissionNo: string;
  marks: StudentMark[];
}

interface Exam {
  _id: string;
  name: string;
  type: string;
  class?: { _id: string; name: string };
}

const MarksEntry: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exam, setExam] = useState<Exam | null>(null);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMarksData();
  }, [id]);

  const fetchMarksData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/exam/${id}/marks`,
        { headers }
      );
      const data = res.data?.data || res.data;

      setExam(data.exam || null);
      setSubjects(data.subjects || []);

      // Initialize student marks
    const studentList = (data.students || []).map((student: any) => {
  const marks = (data.subjects || []).map((sub: any) => {
    // ✅ marks is an object like { "subjectId123": { marksObtained, isAbsent } }
    const existingMark = student.marks?.[sub.subjectId];
    return {
      subjectId: sub.subjectId,
      marks: existingMark?.marksObtained ?? null,
      isAbsent: existingMark?.isAbsent ?? false,
    };
  });
  return {
    _id: student.studentId,
    name: student.studentName,
    admissionNo: student.admissionNo,
    marks,
  };
});
      setStudents(studentList);
    } catch (error) {
      toast.error("Failed to load marks data");
    } finally {
      setLoading(false);
    }
  };

  const updateMarks = (
    studentIndex: number,
    subjectIndex: number,
    value: number | null
  ) => {
    setStudents((prev) =>
      prev.map((student, sIdx) => {
        if (sIdx !== studentIndex) return student;
        const newMarks = [...student.marks];
        newMarks[subjectIndex] = {
          ...newMarks[subjectIndex],
          marks: value,
          isAbsent: false,
        };
        return { ...student, marks: newMarks };
      })
    );
  };

  const toggleAbsent = (studentIndex: number, subjectIndex: number) => {
    setStudents((prev) =>
      prev.map((student, sIdx) => {
        if (sIdx !== studentIndex) return student;
        const newMarks = [...student.marks];
        const isAbsent = !newMarks[subjectIndex].isAbsent;
        newMarks[subjectIndex] = {
          ...newMarks[subjectIndex],
          isAbsent,
          marks: isAbsent ? null : newMarks[subjectIndex].marks,
        };
        return { ...student, marks: newMarks };
      })
    );
  };

  const getMarkColor = (
    marks: number | null,
    passingMarks: number,
    isAbsent: boolean
  ) => {
    if (isAbsent) return "bg-gray-100 text-gray-500";
    if (marks === null || marks === undefined) return "";
    if (marks < passingMarks) return "bg-red-50 border-red-300 text-red-700";
    return "";
  };

  const handleSave = async () => {
  setSaving(true);
  try {
    const marks: any[] = [];
    students.forEach((student) => {
      student.marks.forEach((m) => {
        if (m.subjectId) {
          marks.push({
            studentId: student._id,
            subjectId: m.subjectId,
            marksObtained: m.isAbsent ? 0 : (m.marks ?? 0),
            isAbsent: m.isAbsent,
          });
        }
      });
    });

    if (marks.length === 0) {
      toast.error("No marks to save");
      setSaving(false);
      return;
    }

    const payload = { examId: id, marks };

    const res = await axios.post("http://localhost:5000/api/exam/marks", payload, {
      headers,
    });
    
    // ✅ Force toast + navigate
    toast.success(res.data?.message || "Marks saved successfully!");
    navigate(`/exams/${id}/results`);  // ← Results page pe jaao
    
  } catch (error: any) {
    console.error("Save error:", error);
    const msg = error.response?.data?.message || "Failed to save marks";
    toast.error(msg);
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-gray-600">Loading marks data...</span>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate("/exams")}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No subjects configured
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Please add subjects to this exam before entering marks.
            </p>
            <button
              onClick={() => navigate(`/exams/${id}/subjects`)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Subjects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/exams")}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
              {exam && (
                <p className="mt-1 text-sm text-gray-500">
                  {exam.name} • {exam.class?.name || ""} •{" "}
                  {exam.type?.replace("_", " ")}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Marks
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
            <span className="text-gray-600">Below passing marks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">Absent</span>
          </div>
        </div>

        {/* Marks Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[50px]">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[50px] bg-gray-50 z-10 min-w-[180px]">
                    Student
                  </th>
                  {subjects.map((sub) => (
                    <th
                      key={sub._id || sub.subjectId}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]"
                    >
                      <div>{sub.subjectName}</div>
                      <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                        Max: {sub.maxMarks} | Pass: {sub.passingMarks}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={subjects.length + 2}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No students found for this exam
                    </td>
                  </tr>
                ) : (
                  students.map((student, sIdx) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-500 sticky left-0 bg-white z-10">
                        {sIdx + 1}
                      </td>
                      <td className="px-4 py-2 sticky left-[50px] bg-white z-10">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.admissionNo}
                        </div>
                      </td>
                      {subjects.map((sub, subIdx) => {
                        const mark = student.marks[subIdx];
                        return (
                          <td
                            key={sub._id || sub.subjectId}
                            className="px-2 py-2 text-center"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="number"
                                value={mark?.marks ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                    ? Number(e.target.value)
                                    : null;
                                  if (val !== null && val > sub.maxMarks) {
                                    toast.error(
                                      `Max marks for ${sub.subjectName} is ${sub.maxMarks}`
                                    );
                                    return;
                                  }
                                  updateMarks(sIdx, subIdx, val);
                                }}
                                disabled={mark?.isAbsent}
                                min={0}
                                max={sub.maxMarks}
                                className={`w-20 text-center rounded-md border shadow-sm text-sm py-1 focus:border-indigo-500 focus:ring-indigo-500 ${getMarkColor(
                                  mark?.marks ?? null,
                                  sub.passingMarks,
                                  mark?.isAbsent ?? false
                                )}`}
                                placeholder="--"
                              />
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mark?.isAbsent ?? false}
                                  onChange={() => toggleAbsent(sIdx, subIdx)}
                                  className="h-3 w-3 text-gray-600 rounded border-gray-300 focus:ring-gray-500"
                                />
                                <span className="text-[10px] text-gray-500">
                                  Absent
                                </span>
                              </label>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {students.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-500">
                {students.length} student(s) • {subjects.length} subject(s)
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Marks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksEntry;


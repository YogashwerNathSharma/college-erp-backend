
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FileSpreadsheet, Layers, Loader2, ArrowLeft } from "lucide-react";

interface ExamOption {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
}

interface StudentOption {
  id: string;
  name: string;
  admissionNo: string;
}

const templateLabels: Record<string, string> = {
  "half-yearly-grade": "Half Yearly (With Grade)",
  "half-yearly-no-grade": "Half Yearly (Without Grade)",
  "annual-grade": "Annual (With Grade)",
  "annual-no-grade": "Annual (Without Grade)",
  "consolidated-grade": "Consolidated (With Grade)",
  "consolidated-no-grade": "Consolidated (Without Grade)",
};

const templateIcons: Record<string, string> = {
  "half-yearly-grade": "half",
  "half-yearly-no-grade": "half",
  "annual-grade": "annual",
  "annual-no-grade": "annual",
  "consolidated-grade": "consolidated",
  "consolidated-no-grade": "consolidated",
};

export default function ReportCardSelect() {
  const YN_UDP_API = window.location.hostname !== "localhost"
  ? "https://yn-udp.onrender.com/api"
  : "http://localhost:5001/api";

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const template = searchParams.get("template") || "annual-grade";
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exams, setExams] = useState<ExamOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("all");

  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<any>(null);

  // Fetch custom report card templates from YN-UDP
  useEffect(() => {
    const tenantId = localStorage.getItem("tenantId") || "000000000000000000000000";
    axios.get(`${YN_UDP_API}/templates?tenantId=${tenantId}&type=report-card`).catch(() => null)
      .then((res: any) => {
        if (res?.data?.data?.length) { setCustomTemplates(res.data.data); return; }
        return axios.get(`${YN_UDP_API}/templates?tenantId=000000000000000000000000`).catch(() => null);
      })
      .then((res: any) => { if (res?.data?.data?.length) setCustomTemplates(res.data.data); });
  }, []);

  // Fetch exams
  useEffect(() => {
    setLoadingExams(true);
    axios
      .get("/api/exam", { headers })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setExams(Array.isArray(list) ? list : []);
      })
      .catch(() => toast.error("Failed to load exams"))
      .finally(() => setLoadingExams(false));
  }, []);

  // Fetch classes
  useEffect(() => {
    setLoadingClasses(true);
    axios
      .get("/api/class", { headers })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setClasses(Array.isArray(list) ? list : []);
      })
      .catch(() => toast.error("Failed to load classes"))
      .finally(() => setLoadingClasses(false));
  }, []);

  // Fetch sections when class changes
  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setStudents([]);
      setSelectedSection("");
      setSelectedStudent("all");
      return;
    }
    setLoadingSections(true);
    axios
      .get(`/api/section?classId=${selectedClass}`, { headers })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setSections(Array.isArray(list) ? list : []);
      })
      .catch(() => toast.error("Failed to load sections"))
      .finally(() => setLoadingSections(false));
  }, [selectedClass]);

  // Fetch students when section changes
  useEffect(() => {
    if (!selectedSection) {
      setStudents([]);
      setSelectedStudent("all");
      return;
    }
    setLoadingStudents(true);
    axios
      .get(`/api/enrollment?classId=${selectedClass}&sectionId=${selectedSection}`, { headers })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const studentList = Array.isArray(list)
          ? list.map((item: any) => ({
              id: item.studentId || item.student?.id || item.id,
              name: item.student?.name || item.name || "",
              admissionNo: item.student?.admissionNo || item.admissionNo || "",
            }))
          : [];
        setStudents(studentList);
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoadingStudents(false));
  }, [selectedSection]);

  const handleGenerate = () => {
    if (!selectedExam) {
      toast.error("Please select an exam");
      return;
    }
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }
    if (!selectedSection) {
      toast.error("Please select a section");
      return;
    }

    if (selectedStudent && selectedStudent !== "all") {
      // Single student
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) {
        window.location.href = `/print/report-card/${selectedExam}/${selectedStudent}?template=${template}`;
      } else {
        navigate(`/exams/${selectedExam}/report-card/${selectedStudent}?template=${template}`);
      }
    } else {
      // All students - bulk print route on mobile
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) {
        window.location.href = `/print/report-card/${selectedExam}/bulk?template=${template}&classId=${selectedClass}&sectionId=${selectedSection}`;
      } else {
        navigate(`/exams/${selectedExam}/report-card/all?template=${template}&classId=${selectedClass}&sectionId=${selectedSection}`);
      }
    }
  };

  const isConsolidated = template.startsWith("consolidated");
  const IconComponent = isConsolidated ? Layers : FileSpreadsheet;

  return (
    <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
      {/* Back Button & Title */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/reports")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Generate Report Card</h1>
        <p className="text-gray-500 text-sm mt-1">
          Select exam, class, section and student to generate report card
        </p>
      </div>

      {/* Template Indicator */}
      <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-primary-200 rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-primary-600 shadow-sm">
          <IconComponent size={24} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">
            Selected Template
          </p>
          <p className="text-lg font-bold text-gray-800">
            {templateLabels[template] || template}
          </p>
        </div>
      </div>

      {/* YN-UDP Custom Template Integration */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Report Card Design</h3>
          <div className="flex gap-1">
            <button onClick={() => setUseCustomTemplate(false)} className={`px-3 py-1 text-xs font-medium rounded ${!useCustomTemplate ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Built-in Templates</button>
            <button onClick={() => setUseCustomTemplate(true)} className={`px-3 py-1 text-xs font-medium rounded ${useCustomTemplate ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>✨ Custom (YN-UDP)</button>
            <a href="https://yn-udp.onrender.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs font-medium rounded bg-gray-100 text-blue-600 hover:bg-blue-50 border border-blue-200">+ Create New</a>
          </div>
        </div>
        {useCustomTemplate && (
          <div>
            {customTemplates.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {customTemplates.map((tmpl: any) => (
                  <div key={tmpl.id} onClick={() => setSelectedCustomTemplate(tmpl)} className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${selectedCustomTemplate?.id === tmpl.id ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200 hover:border-gray-400"}`}>
                    <div className="h-14 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center"><span className="text-xl">📋</span></div>
                    <div className="p-2"><div className="text-xs font-medium text-gray-800 truncate">{tmpl.name}</div><div className="text-[10px] text-gray-500">{tmpl.pageWidth}×{tmpl.pageHeight}</div></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-2">No custom report card templates</p>
                <a href="https://yn-udp.onrender.com" target="_blank" className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">✨ Open Designer</a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-2xl">
        <div className="space-y-5">
          {/* Exam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Exam <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loadingExams}
            >
              <option value="">
                {loadingExams ? "Loading exams..." : "-- Select Exam --"}
              </option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection("");
                setSelectedStudent("all");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loadingClasses}
            >
              <option value="">
                {loadingClasses ? "Loading classes..." : "-- Select Class --"}
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Section <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setSelectedStudent("all");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!selectedClass || loadingSections}
            >
              <option value="">
                {loadingSections
                  ? "Loading sections..."
                  : !selectedClass
                  ? "Select class first"
                  : "-- Select Section --"}
              </option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!selectedSection || loadingStudents}
            >
              <option value="all">
                {loadingStudents
                  ? "Loading students..."
                  : !selectedSection
                  ? "Select section first"
                  : "All Students"}
              </option>
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.name} {stu.admissionNo ? `(${stu.admissionNo})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div className="pt-3">
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedExam || !selectedClass || !selectedSection}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Generate Report Card
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 max-w-2xl text-xs text-gray-400">
        <p>
          <strong>Tip:</strong> Select "All Students" to generate printable report cards for the entire section.
          Individual student selection generates a single report card.
        </p>
      </div>
    </div>
  );
}

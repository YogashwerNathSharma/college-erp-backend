
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFullUrl } from "../../utils/url";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

interface ScheduleItem {
  id: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  shift?: string;
}

interface ExamDetail {
  id: string;
  name: string;
  type: string;
  className: string;
  classId: string;
  startDate: string;
  endDate: string;
  schedules: ScheduleItem[];
}

interface SchoolInfo {
  schoolName: string;
  addressLine1?: string;
  logoUrl?: string;
}

const ExamSchedulePrint: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examName = searchParams.get("examName") || "";
  const classFilter = searchParams.get("classId") || "";

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const printRef = useRef<HTMLDivElement>(null);

  const [exams, setExams] = useState<ExamDetail[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({ schoolName: "" });
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(classFilter);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, siteRes, classRes] = await Promise.all([
        axios.get(getFullUrl("/api/exam"), { headers }),
        axios.get(getFullUrl("/api/site/site-content")).catch(() => ({
          data: { schoolName: "School" },
        })),
        axios.get(getFullUrl("/api/class"), { headers }),
      ]);

      const allExams = examsRes.data?.data || examsRes.data || [];
      setSchoolInfo(siteRes.data || { schoolName: "School" });
      setClasses(classRes.data?.data || classRes.data || []);

      // Filter exams by name if provided
      const filteredExams = examName
        ? allExams.filter((e: any) => e.name === examName)
        : allExams;

      // Fetch schedule for each exam
      const examsWithSchedule: ExamDetail[] = [];
      for (const exam of filteredExams) {
        try {
          const schedRes = await axios.get(
            getFullUrl(`/api/exam/${exam.id}/schedule`),
            { headers }
          );
          const schedules = schedRes.data?.data || schedRes.data || [];
          examsWithSchedule.push({
            ...exam,
            schedules,
          });
        } catch {
          examsWithSchedule.push({ ...exam, schedules: [] });
        }
      }

      setExams(examsWithSchedule);
    } catch (error) {
      toast.error("Failed to load exam schedule");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Exam Schedule - ${examName || "All"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .header img { max-height: 60px; margin-bottom: 8px; }
            .header h1 { margin: 0; font-size: 22px; }
            .header h2 { margin: 5px 0 0; font-size: 16px; font-weight: normal; color: #555; }
            .header p { margin: 3px 0 0; font-size: 12px; color: #777; }
            .class-section { margin-bottom: 30px; page-break-inside: avoid; }
            .class-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; background: #f5f5f5; padding: 8px 12px; border-left: 4px solid #4f46e5; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #4f46e5; color: white; font-weight: 600; }
            tr:nth-child(even) { background: #f9f9f9; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContents}
          <div class="footer">
            Generated on ${new Date().toLocaleDateString("en-IN")} | ${schoolInfo.schoolName}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const filteredExams = selectedClass
    ? exams.filter((e) => e.classId === selectedClass)
    : exams;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDay = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/exams")}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Exam Schedule {examName ? `— ${examName}` : ""}
              </h1>
              <p className="text-sm text-gray-500">
                Class-wise exam timetable for print & distribution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Schedule
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef}>
          {/* Header with logo */}
          <div className="header" style={{ textAlign: "center", marginBottom: 24, borderBottom: "2px solid #333", paddingBottom: 15 }}>
            {schoolInfo.logoUrl && (
              <img
                src={schoolInfo.logoUrl}
                alt="Logo"
                style={{ maxHeight: 60, marginBottom: 8 }}
              />
            )}
            <h1 style={{ margin: 0, fontSize: 22 }}>{schoolInfo.schoolName}</h1>
            {schoolInfo.addressLine1 && (
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#777" }}>
                {schoolInfo.addressLine1}
              </p>
            )}
            <h2 style={{ margin: "8px 0 0", fontSize: 16, fontWeight: "normal" }}>
              Examination Schedule {examName ? `— ${examName}` : ""}
            </h2>
          </div>

          {/* Class-wise tables */}
          {filteredExams.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No exams found with schedule data.</p>
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div key={exam.id} className="class-section" style={{ marginBottom: 30, pageBreakInside: "avoid" }}>
                <div
                  className="class-title"
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    marginBottom: 10,
                    background: "#f5f5f5",
                    padding: "8px 12px",
                    borderLeft: "4px solid #4f46e5",
                  }}
                >
                  Class: {exam.className || "N/A"} — {exam.name} ({exam.type || "Exam"})
                </div>

                {exam.schedules.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#999", paddingLeft: 12 }}>
                    No schedule added for this exam.
                  </p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid #ddd", padding: "8px 12px", background: "#4f46e5", color: "white", fontSize: 13 }}>
                          #
                        </th>
                        <th style={{ border: "1px solid #ddd", padding: "8px 12px", background: "#4f46e5", color: "white", fontSize: 13 }}>
                          Subject
                        </th>
                        <th style={{ border: "1px solid #ddd", padding: "8px 12px", background: "#4f46e5", color: "white", fontSize: 13 }}>
                          Date
                        </th>
                        <th style={{ border: "1px solid #ddd", padding: "8px 12px", background: "#4f46e5", color: "white", fontSize: 13 }}>
                          Day
                        </th>
                        <th style={{ border: "1px solid #ddd", padding: "8px 12px", background: "#4f46e5", color: "white", fontSize: 13 }}>
                          Time
                        </th>
                        <th style={{ border: "1px solid #ddd", padding: "8px 12px", background: "#4f46e5", color: "white", fontSize: 13 }}>
                          Shift
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.schedules.map((sched, idx) => (
                        <tr key={sched.id} style={{ background: idx % 2 === 0 ? "white" : "#f9f9f9" }}>
                          <td style={{ border: "1px solid #ddd", padding: "8px 12px", fontSize: 13 }}>
                            {idx + 1}
                          </td>
                          <td style={{ border: "1px solid #ddd", padding: "8px 12px", fontSize: 13, fontWeight: 500 }}>
                            {sched.subjectName || "—"}
                          </td>
                          <td style={{ border: "1px solid #ddd", padding: "8px 12px", fontSize: 13 }}>
                            {formatDate(sched.examDate)}
                          </td>
                          <td style={{ border: "1px solid #ddd", padding: "8px 12px", fontSize: 13 }}>
                            {formatDay(sched.examDate)}
                          </td>
                          <td style={{ border: "1px solid #ddd", padding: "8px 12px", fontSize: 13 }}>
                            {sched.startTime} — {sched.endTime}
                          </td>
                          <td style={{ border: "1px solid #ddd", padding: "8px 12px", fontSize: 13 }}>
                            Shift {sched.shift || "1"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSchedulePrint;


import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, ClipboardList, Printer, ChevronLeft, ChevronRight } from "lucide-react";

import { getFullUrl } from "../../utils/url";
import { useAcademicYear } from "../../context/AcademicYearContext";

interface SubjectInfo {
  _id: string;
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
}

// Attendance status for a student in a subject.
// PRESENT = appeared, others = did not appear (shown on the register as AB/L/M).
type MarkStatus = "PRESENT" | "ABSENT" | "LEAVE" | "MEDICAL";

interface StudentMark {
  subjectId: string;
  marks: number | null;
  isAbsent: boolean;
  status: MarkStatus;
}

interface Student {
  _id: string;
  name: string;
  admissionNo: string;
  sectionId?: string | null;
  sectionName?: string;
  marks: StudentMark[];
}

interface Exam {
  _id: string;
  name: string;
  type: string;
  class?: { _id: string; name: string } | null;
  className?: string;
  academicYear?: { _id: string; name: string } | null;
  session?: string;
}

interface SectionOption {
  id: string;
  name: string;
}

interface GradeBand {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
}

// What to show in the mark list / register:
//   "marks" = only marks, "grade" = only grade, "both" = marks + grade
type GradeDisplay = "marks" | "grade" | "both";

const MarksEntry: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  // Current session / academic year (shown on the printed register)
  const { selectedAcademicYear } = useAcademicYear();

  const [exam, setExam] = useState<Exam | null>(null);
  // Class name resolved on the client (so the register shows the class even if
  // the backend hasn't been rebuilt to populate exam.className yet).
  const [resolvedClassName, setResolvedClassName] = useState<string>("");
  // Academic-year / session label resolved on the client (same reasoning).
  const [resolvedSession, setResolvedSession] = useState<string>("");
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Grade scale for this exam (falls back to tenant default scale).
  // Loaded from the admin's own Grade Settings (/api/grade?examId=...).
  const [gradeScale, setGradeScale] = useState<GradeBand[]>([]);

  // Filters / view controls
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "single">("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Report-card style column control for the mark list / register
  const [gradeDisplay, setGradeDisplay] = useState<GradeDisplay>("both");
  const showMarks = gradeDisplay !== "grade";
  const showGrade = gradeDisplay !== "marks";

  // User-defined subject column order (array of subjectIds), persisted per-exam
  const [subjectOrder, setSubjectOrder] = useState<string[]>([]);
  const [arrangeMode, setArrangeMode] = useState(false);

  useEffect(() => {
    fetchMarksData();
  }, [id]);

  const orderStorageKey = `marksEntry:subjectOrder:${id}`;

  const fetchMarksData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(getFullUrl(`/api/exam/${id}/marks`),
        { headers }
      );
      const data = res.data?.data || res.data;

      setExam(data.exam || null);
      setSubjects(data.subjects || []);
      setSections(data.sections || []);

      // Resolve the class name for the register header. Prefer what the backend
      // already sent; otherwise look it up from the class list using classId.
      const ex: any = data.exam || {};
      const directName = ex.className || ex.class?.name || "";
      if (directName) {
        setResolvedClassName(directName);
      } else {
        const classId = ex.classId || ex.class?._id || ex.class?.id || "";
        if (classId) {
          try {
            const cRes = await axios.get(getFullUrl("/api/class"), { headers });
            const list = cRes.data?.data || cRes.data || [];
            const match = (Array.isArray(list) ? list : []).find(
              (c: any) => (c.id || c._id) === classId
            );
            setResolvedClassName(match?.name || "");
          } catch {
            setResolvedClassName("");
          }
        } else {
          setResolvedClassName("");
        }
      }

      // Resolve the session (academic year) label for the header. Prefer what
      // the backend sent, else match the exam's academicYearId against the year
      // list, else fall back to the current/active year.
      const directSession = ex.session || ex.academicYear?.name || "";
      if (directSession) {
        setResolvedSession(directSession);
      } else {
        try {
          const yRes = await axios.get(getFullUrl("/api/academic"), { headers });
          const years = yRes.data?.data || yRes.data || [];
          const arr = Array.isArray(years) ? years : [];
          const yearId = ex.academicYearId || ex.academicYear?._id || ex.academicYear?.id || "";
          const match =
            (yearId && arr.find((y: any) => (y.id || y._id) === yearId)) ||
            arr.find((y: any) => y.isCurrent) ||
            arr.find((y: any) => y.isActive) ||
            arr[0];
          setResolvedSession(match?.name || "");
        } catch {
          setResolvedSession("");
        }
      }
      // Default single-subject selection = first subject
      if (data.subjects?.length) setSelectedSubjectId(data.subjects[0].subjectId);

      // Fetch the grade scale CREATED FOR THIS EXAM (falls back to tenant
      // default automatically on the backend if this exam has no own scale).
      try {
        const gRes = await axios.get(getFullUrl(`/api/grade?examId=${id}`), { headers });
        const gList = gRes.data?.data || gRes.data || [];
        setGradeScale(
          (Array.isArray(gList) ? gList : []).map((g: any) => ({
            grade: g.grade,
            minPercentage: g.minPercent ?? g.minPercentage ?? 0,
            maxPercentage: g.maxPercent ?? g.maxPercentage ?? 100,
          }))
        );
      } catch {
        setGradeScale([]);
      }

      // Initialize subject order: use saved order if valid, else natural order
      const naturalOrder: string[] = (data.subjects || []).map((s: any) => s.subjectId);
      let initialOrder = naturalOrder;
      try {
        const saved = localStorage.getItem(orderStorageKey);
        if (saved) {
          const parsed: string[] = JSON.parse(saved);
          // Keep only ids that still exist, then append any new subjects at the end
          const filtered = parsed.filter((sid) => naturalOrder.includes(sid));
          const missing = naturalOrder.filter((sid) => !filtered.includes(sid));
          initialOrder = [...filtered, ...missing];
        }
      } catch {
        initialOrder = naturalOrder;
      }
      setSubjectOrder(initialOrder);

      // Initialize student marks
    const studentList = (data.students || []).map((student: any) => {
  const marks = (data.subjects || []).map((sub: any) => {
    // ✅ marks is an object like { "subjectId123": { marksObtained, isAbsent } }
    const existingMark = student.marks?.[sub.subjectId];
    const st: MarkStatus =
      (existingMark?.status as MarkStatus) ||
      (existingMark?.isAbsent ? "ABSENT" : "PRESENT");
    return {
      subjectId: sub.subjectId,
      marks: existingMark?.marksObtained ?? null,
      isAbsent: st !== "PRESENT",
      status: st,
    };
  });
  return {
    _id: student.studentId,
    name: student.studentName,
    admissionNo: student.admissionNo,
    sectionId: student.sectionId ?? null,
    sectionName: student.sectionName ?? "",
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
          status: "PRESENT",
        };
        return { ...student, marks: newMarks };
      })
    );
  };

  // Set attendance status for a cell. Non-PRESENT statuses clear the marks
  // (the student did not appear) and keep isAbsent in sync for the backend.
  const setStatus = (
    studentIndex: number,
    subjectIndex: number,
    status: MarkStatus
  ) => {
    setStudents((prev) =>
      prev.map((student, sIdx) => {
        if (sIdx !== studentIndex) return student;
        const newMarks = [...student.marks];
        const didNotAppear = status !== "PRESENT";
        newMarks[subjectIndex] = {
          ...newMarks[subjectIndex],
          status,
          isAbsent: didNotAppear,
          marks: didNotAppear ? null : newMarks[subjectIndex].marks,
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

  // ─── Grade / total / percentage helpers ───
  // The admin's grade scale for this exam is defined in RAW MARKS of a single
  // subject (e.g. SA1 subjects are out of 60 → A+ = 55–60 marks, B+ = 45–49;
  // FA subjects are out of 20 → a different scale). So we match the student's
  // RAW MARKS directly against the band's min/max — NOT a 0–100 percentage.
  //
  // STRICT matching: a grade is assigned ONLY when the marks fall inside a
  // band the admin actually defined (min ≤ marks ≤ max). Outside every band
  // → no grade ("-"); we never invent a grade the user didn't configure.
  const gradeForMarks = (marks: number): string => {
    if (!gradeScale.length) return "";
    const v = Math.round(marks * 100) / 100; // guard tiny float drift
    const band = gradeScale.find(
      (g) => v >= g.minPercentage && v <= g.maxPercentage
    );
    return band?.grade ?? "";
  };

  // Per-subject grade — matched on the subject's raw marks.
  const subjectGrade = (
    marks: number | null,
    isAbsent: boolean,
    maxMarks: number,
    status?: MarkStatus
  ): string => {
    const st = (status || (isAbsent ? "ABSENT" : "PRESENT")) as MarkStatus;
    if (st !== "PRESENT") return STATUS_SHORT[st] || "AB";
    if (marks === null || marks === undefined || maxMarks <= 0) return "";
    return gradeForMarks(marks);
  };

  // Aggregate a student's total, max total, percentage and overall grade
  // across the currently visible subjects.
  const studentSummary = (student: Student) => {
    let total = 0;
    let maxTotal = 0;
    let gradedCount = 0; // subjects that count toward the average (not absent)
    visibleSubjects.forEach((sub) => {
      const m = student.marks.find((mm) => mm.subjectId === sub.subjectId);
      maxTotal += sub.maxMarks;
      if (m && !m.isAbsent && m.marks !== null && m.marks !== undefined) {
        total += m.marks;
        gradedCount += 1;
      }
    });
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    // Overall grade uses the AVERAGE marks per subject, because the grade
    // scale is defined on a single-subject scale (e.g. out of 60). This keeps
    // the overall grade on the same scale the admin configured.
    const avgPerSubject = gradedCount > 0 ? total / gradedCount : 0;
    return {
      total,
      maxTotal,
      percentage,
      grade: gradeForMarks(avgPerSubject),
    };
  };

  const handleSave = async () => {
  setSaving(true);
  try {
    const marks: any[] = [];
    students.forEach((student) => {
      student.marks.forEach((m) => {
        if (m.subjectId) {
          const didNotAppear = m.status !== "PRESENT";
          marks.push({
            studentId: student._id,
            subjectId: m.subjectId,
            marksObtained: didNotAppear ? 0 : (m.marks ?? 0),
            isAbsent: didNotAppear,
            status: m.status,
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

    const res = await axios.post(getFullUrl("/api/exam/marks"), payload, {
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

  // ─── Subject ordering helpers ───
  const persistOrder = (order: string[]) => {
    try {
      localStorage.setItem(orderStorageKey, JSON.stringify(order));
    } catch {
      /* ignore storage errors */
    }
  };

  const moveSubject = (subjectId: string, direction: "left" | "right") => {
    setSubjectOrder((prev) => {
      const idx = prev.indexOf(subjectId);
      if (idx === -1) return prev;
      const swapWith = direction === "left" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      persistOrder(next);
      return next;
    });
  };

  const resetSubjectOrder = () => {
    const natural = subjects.map((s) => s.subjectId);
    setSubjectOrder(natural);
    persistOrder(natural);
    toast.success("Subject order reset to default");
  };

  // ─── Derived: which subjects/students are visible based on filters ───
  // Subjects in user-defined order
  const orderedSubjects: SubjectInfo[] = subjectOrder
    .map((sid) => subjects.find((s) => s.subjectId === sid))
    .filter((s): s is SubjectInfo => Boolean(s));

  // Subject columns: all (register, ordered) or a single selected subject (dropdown)
  const visibleSubjects =
    viewMode === "single"
      ? orderedSubjects.filter((s) => s.subjectId === selectedSubjectId)
      : orderedSubjects;

  // Students filtered by selected section (class + section wise)
  const visibleStudents = selectedSection
    ? students.filter((st) => st.sectionId === selectedSection)
    : students;

  // Display helpers for a single subject cell (used by print + screen)
  // Short code shown on the printed register for a non-PRESENT status.
  const STATUS_SHORT: Record<MarkStatus, string> = {
    PRESENT: "",
    ABSENT: "AB",
    LEAVE: "L",
    MEDICAL: "M",
  };
  const marksText = (m?: StudentMark): string => {
    const st = (m?.status || (m?.isAbsent ? "ABSENT" : "PRESENT")) as MarkStatus;
    if (st !== "PRESENT") return STATUS_SHORT[st] || "AB";
    if (m?.marks !== null && m?.marks !== undefined) return String(m.marks);
    return "-";
  };

  // ─── Print the currently selected class/section register ───
  const handlePrint = () => {
    if (visibleStudents.length === 0) {
      toast.error("No students to print");
      return;
    }

    const sectionName = selectedSection
      ? sections.find((s) => s.id === selectedSection)?.name || ""
      : "All Sections";

    const className = exam?.className || exam?.class?.name || resolvedClassName || "";
    const examName = exam?.name || "";

    // ── Multi-tenant branding (works for ANY school that logs in) ──
    // Pulled live from the logged-in tenant + user, so the register
    // automatically reflects the current school's name, logo and the
    // person who printed it. Nothing is hard-coded.
    let tenant: any = {};
    let currentUser: any = {};
    try { tenant = JSON.parse(localStorage.getItem("tenant") || "{}"); } catch {}
    try { currentUser = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}

    const schoolName = (tenant.schoolName || tenant.name || "School Name");
    const schoolAddress = tenant.address || "";

    // Resolve logo to an absolute URL (handles "/uploads/x.png", "x.png", full URL)
    const API_BASE =
      (import.meta as any).env?.VITE_API_URL ||
      (window.location.hostname !== "localhost"
        ? "https://college-erp-backend-91zi.onrender.com"
        : "");
    const rawLogo = tenant.logoUrl || tenant.logo || "";
    const logoUrl = rawLogo
      ? rawLogo.startsWith("http")
        ? rawLogo
        : rawLogo.startsWith("/")
        ? `${API_BASE}${rawLogo}`
        : `${API_BASE}/uploads/${rawLogo}`
      : "";

    // Who printed it + their role (Admin / Teacher / Principal / …)
    const printedByName =
      currentUser.name || currentUser.firstName || currentUser.username || "User";
    const roleRaw = (currentUser.role || currentUser.designation || "").toString();
    const printedByRole = roleRaw
      ? roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1).toLowerCase().replace(/_/g, " ")
      : "";

    // Session / academic year label (e.g. "2025-2026").
    // Prefer the exam's own academic year from the backend; fall back to the
    // globally selected academic year.
    const sessionLabel =
      exam?.session || selectedAcademicYear?.name || resolvedSession || "";

    const now = new Date();
    const printedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const printedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

    // How many sub-columns each subject occupies (Marks and/or Grade)
    const perSubjectCols = (showMarks ? 1 : 0) + (showGrade ? 1 : 0);
    const bothCols = showMarks && showGrade;

    // ── Header ──
    // When both marks & grade show, we use a two-row header: subject name
    // spans two sub-columns (Marks | Grade); otherwise a single header row.
    let theadHtml = "";
    if (bothCols) {
      const subjTop = visibleSubjects
        .map(
          (sub) =>
            `<th class="sub" colspan="2">${sub.subjectName}<br/><span class="muted">Max ${sub.maxMarks} | Pass ${sub.passingMarks}</span></th>`
        )
        .join("");
      const subjBottom = visibleSubjects
        .map(() => `<th class="muted">Marks</th><th class="muted">Grade</th>`)
        .join("");
      theadHtml = `
      <tr>
        <th rowspan="2" style="min-width:36px">#</th>
        <th rowspan="2" style="text-align:left;min-width:160px">Student</th>
        ${subjTop}
        ${showMarks ? `<th rowspan="2" style="min-width:60px">Total</th><th rowspan="2" style="min-width:50px">%</th>` : ""}
        ${showGrade ? `<th rowspan="2" style="min-width:46px">Grade</th>` : ""}
      </tr>
      <tr>${subjBottom}</tr>`;
    } else {
      const label = showGrade ? "Grade" : "Marks";
      const subjTop = visibleSubjects
        .map(
          (sub) =>
            `<th class="sub">${sub.subjectName}<br/><span class="muted">${label}${showMarks ? ` • Max ${sub.maxMarks} | Pass ${sub.passingMarks}` : ""}</span></th>`
        )
        .join("");
      theadHtml = `
      <tr>
        <th style="min-width:36px">#</th>
        <th style="text-align:left;min-width:160px">Student</th>
        ${subjTop}
        ${showMarks ? `<th style="min-width:60px">Total</th><th style="min-width:50px">%</th>` : ""}
        ${showGrade ? `<th style="min-width:46px">Grade</th>` : ""}
      </tr>`;
    }

    // ── Body ──
    const bodyRows = visibleStudents
      .map((student, idx) => {
        const summary = studentSummary(student);
        const cells = visibleSubjects
          .map((sub) => {
            const m = student.marks.find((mm) => mm.subjectId === sub.subjectId);
            const g = subjectGrade(m?.marks ?? null, m?.isAbsent ?? false, sub.maxMarks, m?.status);
            const fail =
              !m?.isAbsent &&
              m?.marks !== null &&
              m?.marks !== undefined &&
              m.marks < sub.passingMarks;
            let out = "";
            if (showMarks) out += `<td class="num ${fail ? "fail" : ""}">${marksText(m)}</td>`;
            if (showGrade) out += `<td class="num"><span class="gr">${g || "-"}</span></td>`;
            return out;
          })
          .join("");
        return `<tr>
          <td class="num">${idx + 1}</td>
          <td class="name">${student.name}<br/><span class="muted">${student.admissionNo}</span></td>
          ${cells}
          ${showMarks ? `<td class="num tot">${summary.total}<span class="muted">/${summary.maxTotal}</span></td><td class="num">${summary.percentage.toFixed(1)}%</td>` : ""}
          ${showGrade ? `<td class="num"><span class="gr">${summary.grade || "-"}</span></td>` : ""}
        </tr>`;
      })
      .join("");

    // Logo tag (falls back to a colored initial badge when no logo is set)
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="Logo" class="logo" crossorigin="anonymous" />`
      : `<div class="logo logo-fallback">${schoolName.charAt(0).toUpperCase()}</div>`;

    // Title shown under the school name, e.g. "SA-1 TERM EXAMINATION (2026-2027)".
    // Uppercased for a clean exam-register look; session shown in parentheses
    // using the exam's own academic year (current academic year).
    // Title: exam name + EXAMINATION + (session). "TERM" (examType) is
    // intentionally omitted per requirement, e.g. "SA1 EXAMINATION (2026-27)".
    const titleLine = (
      `${examName} EXAMINATION` +
      (sessionLabel ? ` (${sessionLabel})` : "")
    ).toUpperCase();

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Marks Register - ${className} ${sectionName}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24px; }
  .head { text-align: center; margin-bottom: 16px; }
  .head h1 { font-size: 20px; margin: 0 0 4px; }
  .head h2 { font-size: 15px; margin: 0 0 2px; font-weight: 600; }
  .head .meta { font-size: 12px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #333; padding: 5px 6px; font-size: 12px; }
  th { background: #f0f0f0; text-align: center; }
  th.sub { min-width: 70px; }
  td.num { text-align: center; }
  td.name { text-align: left; }
  td.fail { color: #c00; font-weight: 700; }
  .muted { color: #666; font-size: 10px; font-weight: 400; }
  .gr { color: #1d4ed8; font-weight: 700; }
  td.tot { font-weight: 700; }
  .foot { margin-top: 24px; display: flex; justify-content: space-between; font-size: 12px; color: #444; }
  /* Multi-tenant print header */
  .ph { display: flex; align-items: center; justify-content: space-between;
        border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
  .ph .logo { width: 58px; height: 58px; object-fit: contain; border-radius: 4px; }
  .ph .logo-fallback { display: flex; align-items: center; justify-content: center;
        background: #1d4ed8; color: #fff; font-weight: 700; font-size: 24px; }
  .ph .center { flex: 1; text-align: center; padding: 0 14px; }
  .ph .center h1 { font-size: 20px; margin: 0; font-weight: 700;
        letter-spacing: .5px; text-transform: uppercase; }
  .ph .center .addr { font-size: 11px; color: #444; margin: 3px 0 0; }
  .ph .center .exam { font-size: 14px; font-weight: 600; margin: 6px 0 0; }
  .ph .center .meta { font-size: 12px; color: #333; margin: 4px 0 0; }
  .ph .right { text-align: right; font-size: 10px; color: #555; width: 150px; flex-shrink: 0; }
  .ph .right p { margin: 0 0 3px; }
  .legend { margin-top: 14px; font-size: 10px; color: #555; }
  .legend b { color: #111; }
  @media print { body { margin: 10mm; } }
</style>
</head>
<body>
  <div class="ph">
    <div style="flex-shrink:0;width:150px;">${logoHtml}</div>
    <div class="center">
      <h1>${schoolName}</h1>
      ${schoolAddress ? `<div class="addr">${schoolAddress}</div>` : ""}
      <div class="exam">${titleLine}</div>
      <div class="meta">Class: ${className || "—"} &nbsp;|&nbsp; Section: ${sectionName} &nbsp;|&nbsp; Students: ${visibleStudents.length}</div>
    </div>
    <div class="right">
      <p><strong>Printed by:</strong> ${printedByName}${printedByRole ? ` (${printedByRole})` : ""}</p>
      <p><strong>Date:</strong> ${printedDate}</p>
      <p><strong>Time:</strong> ${printedTime}</p>
    </div>
  </div>
  <table>
    <thead>${theadHtml}</thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
  <div class="legend">
    <b>Legend:</b> AB = Absent &nbsp;•&nbsp; L = Leave &nbsp;•&nbsp; M = Medical
    &nbsp;(students who did not appear for the exam)
  </div>
  <div class="foot">
    <span>Printed: ${printedDate} ${printedTime}</span>
    <span>Signature: ____________________</span>
  </div>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups to print.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
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
              className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
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
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Print the selected class/section register"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Marks
            </button>
          </div>
        </div>

        {/* ─── Filters: Section + Subject view mode + Grade display ─── */}
        <div className="flex flex-wrap items-end gap-3 mb-4 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          {/* Section filter */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[140px]"
            >
              <option value="">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>

          {/* View mode toggle */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Subject View</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "all" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                All Subjects (Register)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "single" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                Single Subject
              </button>
            </div>
          </div>

          {/* Single-subject dropdown (only in single mode) */}
          {viewMode === "single" && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Select Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[160px]"
              >
                {orderedSubjects.map((sub) => (
                  <option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Marks / Grade / Both display toggle (report-card style) */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Show</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {([
                { key: "marks", label: "Marks only" },
                { key: "grade", label: "Grade only" },
                { key: "both", label: "Marks + Grade" },
              ] as { key: GradeDisplay; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setGradeDisplay(opt.key)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${gradeDisplay === opt.key ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Arrange subjects (only meaningful in register / all mode) */}
          {viewMode === "all" && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Subject Order</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setArrangeMode((v) => !v)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${arrangeMode ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
                >
                  {arrangeMode ? "Done Arranging" : "Arrange Subjects"}
                </button>
                {arrangeMode && (
                  <button
                    type="button"
                    onClick={resetSubjectOrder}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
            <span className="text-gray-600">Below passing marks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">Absent</span>
          </div>
          <span className="text-gray-500">
            {gradeScale.length
              ? "Grades come from your Grade Settings for this exam."
              : "No grade scale set — grades will show as “-”."}
          </span>
          {arrangeMode && viewMode === "all" && (
            <span className="text-primary-600 font-medium">
              Use the ◀ ▶ arrows on each subject header to reorder columns. Order is saved automatically.
            </span>
          )}
        </div>

        {/* Marks Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Capped-height viewport: fill a student and move left/right across
              subjects (student name stays frozen on the left) and up/down across
              students (header stays frozen on top) — all inside this box, so the
              whole page no longer scrolls while entering marks. */}
          <div className="overflow-auto max-h-[70vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-40 min-w-[50px]">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[50px] bg-gray-50 z-40 min-w-[180px]">
                    Student
                  </th>
                  {visibleSubjects.map((sub, colIdx) => (
                    <th
                      key={sub._id || sub.subjectId}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]"
                    >
                      {arrangeMode && viewMode === "all" && (
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <button
                            type="button"
                            onClick={() => moveSubject(sub.subjectId, "left")}
                            disabled={colIdx === 0}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSubject(sub.subjectId, "right")}
                            disabled={colIdx === visibleSubjects.length - 1}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move right"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div>{sub.subjectName}</div>
                      <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                        Max: {sub.maxMarks} | Pass: {sub.passingMarks}
                      </div>
                      {/* Marks / Grade sub-labels */}
                      {(showMarks || showGrade) && (
                        <div className="flex justify-center gap-6 mt-1 text-[9px] text-gray-400 font-normal">
                          {showMarks && <span className="w-20 text-center">Marks</span>}
                          {showGrade && <span className="w-10 text-center">Grade</span>}
                        </div>
                      )}
                    </th>
                  ))}
                  {showMarks && (
                    <>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">
                        %
                      </th>
                    </>
                  )}
                  {showGrade && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">
                      Grade
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleSubjects.length + 5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No students found for this exam
                    </td>
                  </tr>
                ) : (
                  visibleStudents.map((student, rowIdx) => {
                    // Real index into the unfiltered students array (for updates)
                    const sIdx = students.findIndex((s) => s._id === student._id);
                    const summary = studentSummary(student);
                    return (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-500 sticky left-0 bg-white z-20">
                        {rowIdx + 1}
                      </td>
                      <td className="px-4 py-2 sticky left-[50px] bg-white z-20">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.admissionNo}
                        </div>
                      </td>
                      {visibleSubjects.map((sub) => {
                        // Real index into this student's marks array (by subjectId)
                        const subIdx = student.marks.findIndex((m) => m.subjectId === sub.subjectId);
                        const mark = student.marks[subIdx];
                        const g = subjectGrade(
                          mark?.marks ?? null,
                          mark?.isAbsent ?? false,
                          sub.maxMarks,
                          mark?.status
                        );
                        const curStatus: MarkStatus =
                          mark?.status || (mark?.isAbsent ? "ABSENT" : "PRESENT");
                        return (
                          <td
                            key={sub._id || sub.subjectId}
                            className="px-2 py-2 text-center align-top"
                          >
                            <div className="flex items-start justify-center gap-2">
                              {/* Marks column (input stays available for entry) */}
                              {showMarks && (
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
                                    disabled={curStatus !== "PRESENT"}
                                    min={0}
                                    max={sub.maxMarks}
                                    className={`w-20 text-center rounded-md border shadow-sm text-sm py-1 focus:border-primary-500 focus:ring-primary-500 ${getMarkColor(
                                      mark?.marks ?? null,
                                      sub.passingMarks,
                                      mark?.isAbsent ?? false
                                    )}`}
                                    placeholder="--"
                                  />
                                  {/* Attendance status: Present / Absent / Leave / Medical */}
                                  <select
                                    value={curStatus}
                                    onChange={(e) =>
                                      setStatus(sIdx, subIdx, e.target.value as MarkStatus)
                                    }
                                    title="Attendance status for this subject"
                                    className={`w-20 text-[10px] rounded-md border shadow-sm py-0.5 px-1 focus:border-primary-500 focus:ring-primary-500 ${
                                      curStatus !== "PRESENT"
                                        ? "bg-gray-100 text-gray-700 border-gray-300"
                                        : "text-gray-500 border-gray-200"
                                    }`}
                                  >
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="LEAVE">Leave</option>
                                    <option value="MEDICAL">Medical</option>
                                  </select>
                                </div>
                              )}
                              {/* Grade column */}
                              {showGrade && (
                                <div className="w-10 flex items-center justify-center pt-1">
                                  <span className="text-xs font-semibold text-primary-600">
                                    {g || "-"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      {showMarks && (
                        <>
                          <td className="px-3 py-2 text-center whitespace-nowrap align-top">
                            <span className="text-sm font-semibold text-gray-900">
                              {summary.total}
                            </span>
                            <span className="text-xs text-gray-400">
                              /{summary.maxTotal}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center align-top">
                            <span className="text-sm font-medium text-gray-700">
                              {summary.percentage.toFixed(1)}%
                            </span>
                          </td>
                        </>
                      )}
                      {showGrade && (
                        <td className="px-3 py-2 text-center align-top">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800">
                            {summary.grade || "-"}
                          </span>
                        </td>
                      )}
                    </tr>
                    );
                  })
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Marks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksEntry;

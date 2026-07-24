import { getFullUrl } from "../../utils/url";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Users,
  Printer,
  Search,
  Download,
  ArrowLeftRight,
  ClipboardList,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CLASS_COLORS = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  { bg: "#fce7f3", border: "#ec4899", text: "#9d174d" },
  { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
  { bg: "#f3e8ff", border: "#a855f7", text: "#6b21a8" },
  { bg: "#ccfbf1", border: "#14b8a6", text: "#115e59" },
  { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  { bg: "#fef9c3", border: "#eab308", text: "#854d0e" },
  { bg: "#e2e8f0", border: "#64748b", text: "#334155" },
  { bg: "#fdf2f8", border: "#d946ef", text: "#86198f" },
  { bg: "#ecfeff", border: "#06b6d4", text: "#155e75" },
];

const SEATS_PER_BENCH = 3;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Exam {
  id: string;
  name: string;
  classId?: string;
  academicYearId?: string;
  className?: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  capacity?: number;
}

interface Seat {
  seatNumber: string;
  studentId?: string;
  studentName?: string;
  fatherName?: string;
  roomId?: string;
  roomName?: string;
  rollNo?: string;
  className?: string;
  sectionName?: string;
  assigned: boolean;
  locked?: boolean;
}

interface ScheduleItem {
  id: string;
  subjectName: string;
  examDate?: string;
  date: string;
  startTime: string;
  endTime?: string;
  roomName: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const SeatingArrangementPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ─── State ─────────────────────────────────────────────────
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classStudentCounts, setClassStudentCounts] = useState<Record<string, number>>({});
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [tenant, setTenant] = useState<any>(null);

  // Swap state
  const [swapMode, setSwapMode] = useState(false);
  const [swapStudent1, setSwapStudent1] = useState<string | null>(null);

  // ─── Computed ──────────────────────────────────────────────
  const totalCapacity = useMemo(() =>
    selectedRoomIds.reduce((sum, rid) => sum + (rooms.find(r => r.id === rid)?.capacity || 40), 0),
    [selectedRoomIds, rooms]
  );

  const totalStudents = useMemo(() =>
    Object.values(classStudentCounts).reduce((a, b) => a + b, 0),
    [classStudentCounts]
  );

  const classColorMap = useMemo(() => {
    const map: Record<string, typeof CLASS_COLORS[0]> = {};
    selectedClassIds.forEach((id, idx) => {
      map[id] = CLASS_COLORS[idx % CLASS_COLORS.length];
    });
    classes.forEach(cls => {
      if (map[cls.id]) map[cls.name] = map[cls.id];
    });
    return map;
  }, [selectedClassIds, classes]);

  // Filter seats by search and room
  const displaySeats = useMemo(() => {
    let filtered = seats.filter(s => s.assigned);
    if (filterRoom) filtered = filtered.filter(s => s.roomName === filterRoom);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        (s.studentName || "").toLowerCase().includes(q) ||
        (s.rollNo || "").toLowerCase().includes(q) ||
        (s.className || "").toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [seats, filterRoom, searchQuery]);

  // Group seats by room
  const roomGroups = useMemo(() => {
    const groups: Record<string, Seat[]> = {};
    displaySeats.forEach(seat => {
      const rName = seat.roomName || "Unassigned";
      if (!groups[rName]) groups[rName] = [];
      groups[rName].push(seat);
    });
    return groups;
  }, [displaySeats]);

  // ─── Effects ───────────────────────────────────────────────
  useEffect(() => {
    fetchExams();
    fetchRooms();
    fetchClasses();
    fetchTenant();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchSchedules();
  }, [selectedExam]);

  useEffect(() => {
    if (selectedClassIds.length > 0) fetchClassCounts();
    else setClassStudentCounts({});
  }, [selectedClassIds, selectedExam]);

  // ─── API Calls ─────────────────────────────────────────────
  const fetchTenant = async () => {
    try {
      const res = await axios.get("/api/settings", { headers });
      setTenant(res.data?.data?.tenant || JSON.parse(localStorage.getItem("tenant") || "{}"));
    } catch {
      setTenant(JSON.parse(localStorage.getItem("tenant") || "{}"));
    }
  };

  const fetchExams = async () => {
    try {
      const res = await axios.get("/api/exam", { headers });
      const raw = res.data?.data || res.data || [];
      setExams(Array.isArray(raw) ? raw : raw.exams || []);
    } catch {
      toast.error("Failed to load exams");
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get("/api/room", { headers });
      setRooms(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load rooms");
    }
  };

  const fetchClasses = async () => {
    try {
      let academicYearId = "";
      try {
        const ayRes = await axios.get("/api/academic", { headers });
        const years = ayRes.data?.data || ayRes.data || [];
        const active = years.find((y: any) => y.isCurrent || y.isActive);
        if (active) academicYearId = active.id;
      } catch {}
      const res = await axios.get("/api/class", {
        headers,
        params: academicYearId ? { academicYearId } : undefined,
      });
      setClasses(res.data?.data || res.data || []);
    } catch {}
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`/api/exam/${selectedExam}/schedule`, { headers });
      const raw = res.data?.data || res.data || [];
      setSchedules((Array.isArray(raw) ? raw : []).map((sch: any) => ({
        ...sch,
        date: sch.date || sch.examDate || "",
      })));
    } catch {}
  };

  const fetchClassCounts = async () => {
    try {
      const counts: Record<string, number> = {};
      const exam = exams.find(e => e.id === selectedExam);
      let academicYearId = exam?.academicYearId || "";
      
      // Fallback: get active academic year if exam doesn't have it
      if (!academicYearId) {
        try {
          const ayRes = await axios.get("/api/academic", { headers });
          const years = ayRes.data?.data || ayRes.data || [];
          const active = years.find((y: any) => y.isCurrent || y.isActive);
          if (active) academicYearId = active.id;
        } catch {}
      }
      const ayParam = academicYearId ? `&academicYearId=${academicYearId}` : "";
      for (const classId of selectedClassIds) {
        const res = await axios.get(`/api/enrollment/count?classId=${classId}${ayParam}`, { headers });
        counts[classId] = res.data?.count || res.data?.data || 0;
      }
      setClassStudentCounts(counts);
    } catch {}
  };

  const fetchSeating = async () => {
    setLoading(true);
    try {
      let allSeats: Seat[] = [];
      const schedulesToFetch = schedules.length > 0 ? schedules : [];

      if (schedulesToFetch.length === 0) {
        // Try fetching by exam ID directly (temp schedule case)
        const schRes = await axios.get(`/api/exam/${selectedExam}/schedule`, { headers });
        const rawSch = schRes.data?.data || schRes.data || [];
        const mapped = (Array.isArray(rawSch) ? rawSch : []).map((s: any) => ({ ...s, date: s.date || s.examDate || "" }));
        setSchedules(mapped);
        for (const sch of mapped) {
          const seatRes = await axios.get(`/api/exam/seating/${sch.id}`, { headers });
          const raw = seatRes.data?.data || seatRes.data || {};
          const rawSeats = Array.isArray(raw) ? raw : raw.seats || [];
          allSeats.push(...rawSeats.map(mapSeat));
        }
      } else {
        for (const sch of schedulesToFetch) {
          try {
            const seatRes = await axios.get(`/api/exam/seating/${sch.id}`, { headers });
            const raw = seatRes.data?.data || seatRes.data || {};
            const rawSeats = Array.isArray(raw) ? raw : raw.seats || [];
            allSeats.push(...rawSeats.map(mapSeat));
          } catch {}
        }
      }
      setSeats(allSeats);
    } catch {
      setSeats([]);
    } finally {
      setLoading(false);
    }
  };

  const mapSeat = (s: any): Seat => ({
    seatNumber: s.seatNumber || s.seatNo || "",
    studentId: s.studentId || "",
    studentName: s.studentName || "",
    fatherName: s.fatherName || "",
    roomId: s.roomId || "",
    roomName: s.roomName || "",
    rollNo: s.rollNo || s.admissionNo || "",
    className: s.className || "",
    sectionName: s.sectionName || "",
    assigned: s.assigned ?? !!s.studentId,
    locked: s.locked || false,
  });

  // ─── Generate Seating ──────────────────────────────────────
  const handleGenerate = async () => {
    if (generating) return;
    if (!selectedExam) return toast.error("Select an exam");
    if (selectedRoomIds.length === 0) return toast.error("Select at least one room");
    if (selectedClassIds.length === 0) return toast.error("Select at least one class");

    // Calculate benches from room capacity
    const perRoomCapacity = selectedRoomIds.map(rid => rooms.find(r => r.id === rid)?.capacity || 40);
    const maxPerRoom = Math.max(...perRoomCapacity);
    const benches = Math.ceil(maxPerRoom / SEATS_PER_BENCH);

    setGenerating(true);
    try {
      const scheduleId = schedules.length > 0 ? schedules[0].id : selectedExam;
      const copyToIds = schedules.length > 1 ? schedules.slice(1).map(s => s.id) : undefined;

      const res = await axios.post("/api/exam/seating/generate-custom", {
        examScheduleId: scheduleId,
        roomId: selectedRoomIds[0],
        roomIds: selectedRoomIds,
        capacity: maxPerRoom,
        rows: benches,
        cols: SEATS_PER_BENCH,
        classIds: selectedClassIds,
        mixClasses: true,
        copyToScheduleIds: copyToIds,
      }, { headers });

      const result = res.data?.data || res.data || {};
      if (result.unassigned > 0) {
        toast.error(`${result.unassigned} students unassigned — add more rooms!`);
      } else {
        toast.success(`✅ ${result.total} students seated across ${result.roomsUsed || selectedRoomIds.length} room(s)`);
      }
      await fetchSeating();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate seating");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Swap Students ─────────────────────────────────────────
  const handleSeatClick = (seat: Seat) => {
    if (!swapMode || !seat.studentId) return;
    if (!swapStudent1) {
      setSwapStudent1(seat.studentId);
      toast(`Selected: ${seat.studentName}. Now click second student to swap.`, { icon: "🔄" });
    } else {
      if (swapStudent1 === seat.studentId) {
        setSwapStudent1(null);
        return;
      }
      // Perform swap locally
      const newSeats = seats.map(s => {
        if (s.studentId === swapStudent1) {
          const target = seats.find(t => t.studentId === seat.studentId)!;
          return { ...s, studentName: target.studentName, studentId: target.studentId, rollNo: target.rollNo, className: target.className, sectionName: target.sectionName, fatherName: target.fatherName };
        }
        if (s.studentId === seat.studentId) {
          const source = seats.find(t => t.studentId === swapStudent1)!;
          return { ...s, studentName: source.studentName, studentId: source.studentId, rollNo: source.rollNo, className: source.className, sectionName: source.sectionName, fatherName: source.fatherName };
        }
        return s;
      });
      setSeats(newSeats);
      toast.success("Students swapped!");
      setSwapStudent1(null);
      setSwapMode(false);
    }
  };

  // ─── Print ─────────────────────────────────────────────────
  const handlePrint = () => {
    const examName = exams.find(e => e.id === selectedExam)?.name || "Exam";
    const schoolName = tenant?.name || "School Name";
    const logoUrl = getFullUrl(tenant?.logoUrl);
    const schoolAddress = tenant?.address || "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Please allow popups");

    // Use ALL assigned seats grouped by room (ignore search/filter)
    const allAssigned = seats.filter(s => s.assigned);
    const printRoomGroups: Record<string, Seat[]> = {};
    allAssigned.forEach(s => {
      const rName = s.roomName || "Room";
      if (!printRoomGroups[rName]) printRoomGroups[rName] = [];
      printRoomGroups[rName].push(s);
    });

    const roomPages = Object.entries(printRoomGroups).map(([roomName, roomSeats]) => {
      const benchCount = Math.ceil(roomSeats.length / SEATS_PER_BENCH);
      let benchesHTML = "";

      for (let b = 0; b < benchCount; b++) {
        const benchSeats = roomSeats.slice(b * SEATS_PER_BENCH, (b + 1) * SEATS_PER_BENCH);
        let cellsHTML = "";
        for (let s = 0; s < SEATS_PER_BENCH; s++) {
          const seat = benchSeats[s];
          if (seat) {
            const color = getSeatColor(seat.className || "");
            cellsHTML += `<td class="seat-cell" style="background:${color.bg};border-color:${color.border};">
              <div class="sname">${seat.studentName}</div>
              <div class="sinfo">${seat.className || ""}${seat.sectionName ? " / " + seat.sectionName : ""} • Roll: ${seat.rollNo || "-"}</div>
              <div class="sfather">F: ${seat.fatherName || "-"}</div>
            </td>`;
          } else {
            cellsHTML += `<td class="seat-cell empty">Empty</td>`;
          }
        }
        benchesHTML += `<tr><td class="bench-label">B${b + 1}</td>${cellsHTML}</tr>`;
      }

      return `<div class="page">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" class="logo"/>` : ""}
          <div class="school-info"><div class="school">${schoolName}</div>${schoolAddress ? `<div class="address">${schoolAddress}</div>` : ""}</div>
          <div style="width:50px"></div>
        </div>
        <h2>EXAM SEATING ARRANGEMENT</h2>
        <div class="meta"><span><b>Exam:</b> ${examName}</span><span><b>Room:</b> ${roomName}</span><span><b>Total Students:</b> ${roomSeats.length}</span><span><b>Benches:</b> ${benchCount}</span></div>
        <table class="grid-table">
          <thead><tr><th class="bench-hdr"></th><th class="col-hdr">Left</th><th class="col-hdr">Middle</th><th class="col-hdr">Right</th></tr></thead>
          <tbody>${benchesHTML}</tbody>
        </table>
        <div class="footer">
          <div class="sign-block"><div class="sign-line"></div><div>Class Teacher</div></div>
          <div class="sign-block"><div class="sign-line"></div><div>Invigilator</div></div>
          <div class="sign-block"><div class="sign-line"></div><div>Principal</div></div>
        </div>
      </div>`;
    }).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Seating - ${examName}</title>
    <style>
      @page{size:A4 landscape;margin:10mm}
      body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;font-size:11px}
      .page{page-break-after:always;padding:12px}
      .page:last-child{page-break-after:auto}
      .header{display:flex;align-items:center;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:8px}
      .logo{width:50px;height:50px;object-fit:contain;margin-right:10px}
      .school-info{flex:1;text-align:center}
      .school{font-size:16px;font-weight:bold;text-transform:uppercase}
      .address{font-size:9px;color:#555}
      h2{text-align:center;font-size:13px;margin:6px auto;border:1px solid #333;padding:3px 18px;width:fit-content}
      .meta{display:flex;justify-content:space-between;font-size:11px;margin-bottom:10px}
      .grid-table{width:100%;border-collapse:collapse}
      .bench-hdr{width:40px;background:#f8f8f8;text-align:center;font-weight:bold;font-size:9px;padding:4px}
      .col-hdr{text-align:center;font-weight:bold;font-size:10px;padding:6px;background:#f0f0f0;border:1px solid #ccc}
      .bench-label{width:40px;text-align:center;font-weight:bold;font-size:10px;color:#555;border:1px solid #ddd;background:#fafafa;padding:4px}
      .seat-cell{border:1.5px solid #ccc;padding:6px 8px;text-align:center;vertical-align:middle;width:30%}
      .seat-cell.empty{color:#bbb;font-style:italic;border-style:dashed}
      .sname{font-weight:bold;font-size:11px;margin-bottom:2px}
      .sinfo{font-size:9px;color:#444}
      .sfather{font-size:8px;color:#777;margin-top:1px}
      .footer{display:flex;justify-content:space-between;margin-top:20px;padding-top:10px;border-top:1px solid #ddd}
      .sign-block{text-align:center;font-size:10px}
      .sign-line{width:110px;border-top:1.5px solid #333;margin:28px auto 4px}
    </style></head><body>${roomPages}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  // ─── Export Excel ──────────────────────────────────────────
  const handleExportExcel = () => {
    const examName = exams.find(e => e.id === selectedExam)?.name || "Exam";
    let csv = "S.No,Seat No,Student Name,Father Name,Class,Section,Roll No,Room\n";
    seats.filter(s => s.assigned).forEach((s, idx) => {
      csv += `${idx + 1},"${s.seatNumber}","${s.studentName}","${s.fatherName || ""}","${s.className || ""}","${s.sectionName || ""}","${s.rollNo || ""}","${s.roomName || ""}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Seating_${examName.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel/CSV exported!");
  };

  // ─── Attendance Register Print ─────────────────────────────
  const handleAttendancePrint = () => {
    const examName = exams.find(e => e.id === selectedExam)?.name || "Exam";
    const schoolName = tenant?.name || "School Name";
    const logoUrl = getFullUrl(tenant?.logoUrl);
    const schoolAddress = tenant?.address || "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Please allow popups");

    // Use ALL assigned seats (ignore search/filter)
    const allAssigned = seats.filter(s => s.assigned);
    const printRoomGroups: Record<string, Seat[]> = {};
    allAssigned.forEach(s => {
      const rName = s.roomName || "Room";
      if (!printRoomGroups[rName]) printRoomGroups[rName] = [];
      printRoomGroups[rName].push(s);
    });

    const roomPages = Object.entries(printRoomGroups).map(([roomName, roomSeats]) => {
      const rowsHTML = roomSeats.map((s, idx) => {
        const benchNo = Math.ceil((idx + 1) / SEATS_PER_BENCH);
        const positions = ["L", "M", "R"];
        const seatPos = positions[idx % SEATS_PER_BENCH];
        return `<tr>
          <td style="text-align:center">${idx + 1}</td>
          <td style="text-align:center">B${benchNo}-${seatPos}</td>
          <td style="text-align:center">${benchNo}</td>
          <td style="text-align:center">${s.rollNo || "-"}</td>
          <td><strong>${s.studentName || "-"}</strong></td>
          <td style="text-align:center">${s.className || ""}</td>
          <td style="text-align:center">${s.sectionName || "-"}</td>
          <td>${s.fatherName || "-"}</td>
          <td></td>
          <td style="text-align:center"></td>
        </tr>`;
      }
      ).join("");

      return `<div class="page">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" class="logo"/>` : ""}
          <div class="school-info"><div class="school">${schoolName}</div>${schoolAddress ? `<div class="address">${schoolAddress}</div>` : ""}</div>
          <div style="width:50px"></div>
        </div>
        <h2>EXAM ATTENDANCE REGISTER</h2>
        <div class="meta"><span><b>Exam:</b> ${examName}</span><span><b>Room:</b> ${roomName}</span><span><b>Total Students:</b> ${roomSeats.length}</span><span><b>Date:</b> ____________</span></div>
        <table>
          <thead><tr><th>S.No</th><th>Seat No</th><th>Bench</th><th>Roll No</th><th>Student Name</th><th>Class</th><th>Section</th><th>Father's Name</th><th>Signature</th><th>P/A</th></tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
        <div class="footer">
          <div class="sign-block"><div class="sign-line"></div><div>Invigilator</div></div>
          <div class="sign-block"><div class="sign-line"></div><div>Controller of Exam</div></div>
          <div class="sign-block"><div class="sign-line"></div><div>Principal</div></div>
        </div>
      </div>`;
    }).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Attendance - ${examName}</title>
    <style>
      @page{size:A4;margin:10mm}
      body{font-family:'Times New Roman',serif;margin:0;padding:0}
      .page{page-break-after:always;padding:10px}
      .page:last-child{page-break-after:auto}
      .header{display:flex;align-items:center;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:8px}
      .logo{width:50px;height:50px;object-fit:contain;margin-right:10px}
      .school-info{flex:1;text-align:center}
      .school{font-size:16px;font-weight:bold;text-transform:uppercase}
      .address{font-size:9px;color:#555}
      h2{text-align:center;font-size:13px;margin:6px auto;border:1px solid #333;padding:3px 16px;width:fit-content}
      .meta{display:flex;justify-content:space-between;font-size:10px;margin-bottom:8px;padding:0 4px}
      table{width:100%;border-collapse:collapse;font-size:10px;margin-top:4px}
      th,td{border:1px solid #333;padding:5px 6px}
      th{background:#f0f0f0;font-size:9px;text-align:center;font-weight:bold}
      .footer{display:flex;justify-content:space-between;margin-top:24px;padding-top:8px}
      .sign-block{text-align:center;font-size:10px}
      .sign-line{width:110px;border-top:1.5px solid #333;margin:28px auto 4px}
    </style></head><body>${roomPages}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  // ─── Get seat color ────────────────────────────────────────
  const getSeatColor = (className: string) => {
    if (classColorMap[className]) return classColorMap[className];
    return { bg: "#f0fdf4", border: "#16a34a", text: "#166534" };
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/exams")} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Exam Seating Plan</h1>
              <p className="text-xs sm:text-sm text-gray-500">Generate seating with class mixing — no same-class adjacency</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* STEP 1-3: CONFIGURATION */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Step 1: Select Exam */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mr-2">1</span>
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => { setSelectedExam(e.target.value); setSeats([]); }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">-- Choose Exam --</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} {exam.className ? `(${exam.className})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Rooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mr-2">2</span>
                Select Room(s)
              </label>
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {rooms.map(room => (
                  <label key={room.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoomIds.includes(room.id)}
                      onChange={(e) => {
                        setSelectedRoomIds(e.target.checked
                          ? [...selectedRoomIds, room.id]
                          : selectedRoomIds.filter(id => id !== room.id)
                        );
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">{room.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{room.capacity || 40} seats</span>
                  </label>
                ))}
              </div>
              {selectedRoomIds.length > 0 && (
                <p className="text-xs text-indigo-600 mt-1.5 font-medium">
                  {selectedRoomIds.length} room(s) • Total: {totalCapacity} seats
                </p>
              )}
            </div>

            {/* Step 3: Select Classes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mr-2">3</span>
                Select Classes to Mix
              </label>
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {[...classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map((cls, idx) => {
                  const isSelected = selectedClassIds.includes(cls.id);
                  const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                  return (
                    <label
                      key={cls.id}
                      className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-all ${
                        isSelected ? "ring-1" : "hover:bg-gray-50"
                      }`}
                      style={isSelected ? { backgroundColor: color.bg, borderColor: color.border, ringColor: color.border } : {}}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setSelectedClassIds(prev =>
                          prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                        )}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{cls.name}</span>
                      {isSelected && classStudentCounts[cls.id] !== undefined && (
                        <span className="text-xs font-semibold" style={{ color: color.text }}>
                          {classStudentCounts[cls.id]} students
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {selectedClassIds.length > 0 && (
                <p className="text-xs mt-1.5 font-medium text-gray-600">
                  {selectedClassIds.length} class(es) • {totalStudents} students
                  {totalStudents > totalCapacity && totalCapacity > 0 && (
                    <span className="text-red-500 ml-1">⚠ {totalStudents - totalCapacity} won't fit!</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Rules Info + Generate Button */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-gray-500 space-y-0.5">
              <p>✅ No same class on same bench (3 seats: L, M, R)</p>
              <p>✅ No same class on adjacent benches (front/back)</p>
              <p>✅ Rooms filled sequentially</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedExam || selectedRoomIds.length === 0 || selectedClassIds.length === 0}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm whitespace-nowrap"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Generate Seating Plan
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* RESULTS */}
        {/* ═══════════════════════════════════════════════════ */}
        {seats.length > 0 && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-lg font-bold text-indigo-700">{seats.filter(s => s.assigned).length}</p>
                <p className="text-xs text-gray-500">Students Seated</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-lg font-bold text-green-700">{Object.keys(roomGroups).length}</p>
                <p className="text-xs text-gray-500">Rooms Used</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-lg font-bold text-purple-700">{selectedClassIds.length}</p>
                <p className="text-xs text-gray-500">Classes Mixed</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-lg font-bold text-gray-700">{Math.max(0, totalCapacity - seats.filter(s => s.assigned).length)}</p>
                <p className="text-xs text-gray-500">Seats Remaining</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 mb-5 flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student name or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border-gray-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Room Filter */}
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="rounded-lg border-gray-200 text-sm py-2 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Rooms</option>
                {Object.keys(roomGroups).map(rName => (
                  <option key={rName} value={rName}>{rName}</option>
                ))}
              </select>

              {/* Actions */}
              <button
                onClick={() => { setSwapMode(!swapMode); setSwapStudent1(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  swapMode ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {swapMode ? "Cancel Swap" : "Swap"}
              </button>

              <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>

              <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>

              <button onClick={handleAttendancePrint} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                <ClipboardList className="w-3.5 h-3.5" />
                Attendance
              </button>

              <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                <Download className="w-3.5 h-3.5" />
                Excel
              </button>
            </div>

            {/* Class Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedClassIds.map((id, idx) => {
                const cls = classes.find(c => c.id === id);
                const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md"
                    style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color.border }}></span>
                    {cls?.name || id}
                  </span>
                );
              })}
            </div>

            {/* ─── Room-wise Seating Grid ──────────────────── */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              Object.entries(roomGroups).map(([roomName, roomSeats]) => {
                const benchCount = Math.ceil(roomSeats.length / SEATS_PER_BENCH);
                return (
                  <div key={roomName} className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                    {/* Room Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                          📍 {roomName}
                        </span>
                        <span className="text-xs text-gray-500">{roomSeats.length} students • {benchCount} benches</span>
                      </div>
                    </div>

                    {/* Bench Grid: 3 columns */}
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px]">
                        {/* Column Headers */}
                        <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 mb-2">
                          <div className="text-xs text-gray-400 text-center font-medium"></div>
                          <div className="text-xs text-gray-500 text-center font-semibold bg-gray-50 rounded py-1">Left</div>
                          <div className="text-xs text-gray-500 text-center font-semibold bg-gray-50 rounded py-1">Middle</div>
                          <div className="text-xs text-gray-500 text-center font-semibold bg-gray-50 rounded py-1">Right</div>
                        </div>

                        {/* Benches */}
                        {Array.from({ length: benchCount }).map((_, benchIdx) => {
                          const benchSeats = roomSeats.slice(benchIdx * SEATS_PER_BENCH, (benchIdx + 1) * SEATS_PER_BENCH);
                          return (
                            <div key={benchIdx} className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 mb-2">
                              {/* Bench Label */}
                              <div className="flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-50 rounded">
                                B{benchIdx + 1}
                              </div>
                              {/* 3 Seats */}
                              {[0, 1, 2].map(seatIdx => {
                                const seat = benchSeats[seatIdx];
                                if (!seat) {
                                  return (
                                    <div key={seatIdx} className="border border-dashed border-gray-200 rounded-lg p-2 text-center min-h-[60px] flex items-center justify-center">
                                      <span className="text-xs text-gray-300">Empty</span>
                                    </div>
                                  );
                                }
                                const color = getSeatColor(seat.className || "");
                                const isSwapSelected = swapStudent1 === seat.studentId;
                                return (
                                  <div
                                    key={seatIdx}
                                    onClick={() => handleSeatClick(seat)}
                                    className={`rounded-lg p-2.5 transition-all min-h-[60px] ${
                                      swapMode ? "cursor-pointer hover:scale-105 hover:shadow-md" : ""
                                    } ${isSwapSelected ? "ring-2 ring-amber-400 scale-105 shadow-md" : ""}`}
                                    style={{ backgroundColor: color.bg, border: `1.5px solid ${color.border}` }}
                                  >
                                    <p className="text-xs font-bold truncate" style={{ color: color.text }}>
                                      {seat.studentName}
                                    </p>
                                    <p className="text-[10px] text-gray-600 truncate mt-0.5">
                                      {seat.className} {seat.sectionName ? `/ ${seat.sectionName}` : ""} • Roll: {seat.rollNo || "-"}
                                    </p>
                                    <p className="text-[9px] text-gray-400 truncate">
                                      F: {seat.fatherName || "-"}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && seats.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {selectedExam ? "No seating generated yet. Configure above and click Generate." : "Select an exam to get started."}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SeatingArrangementPage;

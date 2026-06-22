import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Grid3X3,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  Printer,
  Palette,
  Filter,
  Sparkles,
  Settings2,
  Info,
  Rows3,
  Columns3,
  ClipboardList,
} from "lucide-react";

const YN_UDP_API = "http://localhost:5001/api";

const getTenantId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.tenantId || "";
  } catch {
    return "";
  }
};

const getFullUrl = (path: string | undefined | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${path}`;
  return `/uploads/${path}`;
};

// Class colors for visual grid
const CLASS_COLORS = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" }, // blue
  { bg: "#dcfce7", border: "#22c55e", text: "#166534" }, // green
  { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" }, // amber
  { bg: "#fce7f3", border: "#ec4899", text: "#9d174d" }, // pink
  { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" }, // indigo
  { bg: "#f3e8ff", border: "#a855f7", text: "#6b21a8" }, // purple
  { bg: "#ccfbf1", border: "#14b8a6", text: "#115e59" }, // teal
  { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" }, // red
  { bg: "#fef9c3", border: "#eab308", text: "#854d0e" }, // yellow
  { bg: "#e2e8f0", border: "#64748b", text: "#334155" }, // slate
];

interface Exam {
  id: string;
  name: string;
  className?: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface ScheduleItem {
  id: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime?: string;
  roomName: string;
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
}

interface SeatingStats {
  totalCapacity: number;
  assigned: number;
  available: number;
}

interface YnTemplate {
  id: string;
  name: string;
  type: string;
}

const SeatingArrangementPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Core State

  const [selectedExam, setSelectedExam] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [stats, setStats] = useState<SeatingStats>({
    totalCapacity: 0,
    assigned: 0,
    available: 0,
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // NEW: Configuration State
  const [customCapacity, setCustomCapacity] = useState<number>(40);
  const [customRows, setCustomRows] = useState<number>(5);
  const [customCols, setCustomCols] = useState<number>(8);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classStudentCounts, setClassStudentCounts] = useState<Record<string, number>>({});
  const [mixClasses, setMixClasses] = useState(true);
  const [seatingPlanType, setSeatingPlanType] = useState<"same" | "daily">("same"); // same = one plan for all days, daily = different each day
  const [aiInstruction, setAiInstruction] = useState("");
  const [showConfig, setShowConfig] = useState(true);

  // Filter state for viewing
  const [filterClass, setFilterClass] = useState("");

  // YN-UDP State
  const [ynTemplates, setYnTemplates] = useState<YnTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [ynLoading, setYnLoading] = useState(false);
  const [showYnModal, setShowYnModal] = useState(false);

  // Tenant info for print
  const [tenant, setTenant] = useState<any>(null);

  // Track which rooms are already assigned (full/partial)
  const [roomAssignedCount, setRoomAssignedCount] = useState<Record<string, number>>({});

  // Class color map
  const [classColorMap, setClassColorMap] = useState<Record<string, typeof CLASS_COLORS[0]>>({});

  // Attendance Sheet State
  const [attendanceRoom, setAttendanceRoom] = useState("");
  const [papersPerDay, setPapersPerDay] = useState<"single" | "two">("single");
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");

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
    if (selectedSchedule) fetchSeating();
    if (selectedSchedule && selectedSchedule !== "__ALL__") fetchRoomUsage();
  }, [selectedSchedule]);

  useEffect(() => {
    if (selectedExam && selectedSchedule === "__ALL__") fetchRoomUsageForAllSchedules();
  }, [selectedSchedule]);

  // Update capacity when rows/cols change
  useEffect(() => {
    setCustomCapacity(customRows * customCols);
  }, [customRows, customCols]);





  // Build class color map when classes selected
  useEffect(() => {
    const map: Record<string, typeof CLASS_COLORS[0]> = {};
    selectedClassIds.forEach((id, idx) => {
      map[id] = CLASS_COLORS[idx % CLASS_COLORS.length];
    });
    // Also map class names
    classes.forEach((cls) => {
      if (map[cls.id]) {
        map[cls.name] = map[cls.id];
      }
    });
    setClassColorMap(map);
  }, [selectedClassIds, classes]);

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

  const fetchClasses = async () => {
    try {
      const res = await axios.get("/api/class", { headers });
      setClasses(res.data?.data || res.data || []);
    } catch {
      // Silently fail
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

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`/api/exam/${selectedExam}/schedule`, { headers });
      setSchedules(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load schedules");
    }
  };

  const fetchSeating = async () => {
    setLoading(true);
    try {
      // If "Full Schedule" selected, fetch seating for all schedules and merge
      if (selectedSchedule === "__ALL__") {
        let allSeats: Seat[] = [];
        for (const sch of schedules) {
          try {
            const res = await axios.get(`/api/exam/seating/${sch.id}`, { headers });
            const raw = res.data?.data || res.data || {};
            const rawSeats = Array.isArray(raw) ? raw : raw.seats || [];
            const schSeats: Seat[] = rawSeats.map((s: any) => ({
              seatNumber: s.seatNumber || s.seatNo || "",
              studentId: s.studentId || "",
              studentName: s.studentName || "",
              fatherName: s.fatherName || "",
              roomName: s.roomName || "",
              rollNo: s.rollNo || s.admissionNo || "",
              className: s.className || "",
              sectionName: s.sectionName || "",
              assigned: s.assigned ?? !!s.studentId,
            }));
            allSeats = [...allSeats, ...schSeats];
          } catch {}
        }
        // Cap display to total grid capacity across all rooms
        const totalCap = customRows * customCols * Math.max(selectedRoomIds.length, 1);
        const cappedSeats = allSeats.slice(0, totalCap);
        setSeats(cappedSeats);
        const assignedAll = cappedSeats.filter((s) => s.assigned).length;
        setStats({ totalCapacity: totalCap, assigned: assignedAll, available: totalCap - assignedAll });
        setLoading(false);
        return;
      }

      const res = await axios.get(`/api/exam/seating/${selectedSchedule}`, { headers });
      const raw = res.data?.data || res.data || {};
      const rawSeats = Array.isArray(raw) ? raw : raw.seats || [];

      // Map backend response to frontend Seat interface
      const allAssignedSeats: Seat[] = rawSeats.map((s: any) => ({
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
      }));

      // Store ALL assigned seats (all rooms) — display will group by room
      setSeats(allAssignedSeats);

      const totalSlots = customRows * customCols * Math.max(selectedRoomIds.length, 1);
      const assignedCount = allAssignedSeats.length;
      setStats({
        totalCapacity: totalSlots,
        assigned: assignedCount,
        available: totalSlots - assignedCount,
      });
    } catch {
      setSeats([]);
      setStats({ totalCapacity: 0, assigned: 0, available: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Toggle class selection
  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  // Fetch student count per class when selection changes
  useEffect(() => {
    const fetchClassCounts = async () => {
      if (selectedClassIds.length === 0) {
        setClassStudentCounts({});
        return;
      }
      try {
        const counts: Record<string, number> = {};
        for (const classId of selectedClassIds) {
          const res = await axios.get(`/api/enrollment/count?classId=${classId}`, { headers });
          counts[classId] = res.data?.count || res.data?.data || 0;
        }
        setClassStudentCounts(counts);
      } catch {
        // Silently fail
      }
    };
    fetchClassCounts();
  }, [selectedClassIds]);

  // Fetch how many students are already assigned per room for current schedule
  const fetchRoomUsage = async () => {
    try {
      const res = await axios.get(`/api/exam/seating/${selectedSchedule}`, { headers });
      const raw = res.data?.data || res.data || {};
      const rawSeats = Array.isArray(raw) ? raw : raw.seats || [];
      // Count by roomName
      const counts: Record<string, number> = {};
      rawSeats.forEach((s: any) => {
        const rName = s.roomName || "";
        if (rName) counts[rName] = (counts[rName] || 0) + 1;
      });
      setRoomAssignedCount(counts);
    } catch {
      setRoomAssignedCount({});
    }
  };

  const fetchRoomUsageForAllSchedules = async () => {
    const counts: Record<string, number> = {};
    for (const sch of schedules) {
      try {
        const res = await axios.get(`/api/exam/seating/${sch.id}`, { headers });
        const raw = res.data?.data || res.data || {};
        const rawSeats = Array.isArray(raw) ? raw : raw.seats || [];
        rawSeats.forEach((s: any) => {
          const rName = s.roomName || "";
          if (rName) counts[rName] = (counts[rName] || 0) + 1;
        });
      } catch {}
    }
    setRoomAssignedCount(counts);
  };

  // ═══════════════════════════════════════════
  // GENERATE CUSTOM SEATING
  // ═══════════════════════════════════════════
  const handleGenerateCustom = async () => {
    if (generating) return; // Prevent double-click
    if (!selectedSchedule) {
      toast.error("Please select an exam schedule");
      return;
    }
    if (selectedRoomIds.length === 0) {
      toast.error("Please select at least one room");
      return;
    }
    if (selectedClassIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    setGenerating(true);
    try {
      // If "Full Schedule" selected, generate for all schedules
      if (selectedSchedule === "__ALL__") {
        let successCount = 0;

        if (seatingPlanType === "same") {
          // SAME seating for all days — generate once, copy to all schedules
          // Generate for first schedule
          const firstRes = await axios.post(
            "/api/exam/seating/generate-custom",
            {
              examScheduleId: schedules[0].id,
              roomId: selectedRoomIds[0],
              roomIds: selectedRoomIds,
              capacity: customCapacity,
              rows: customRows,
              cols: customCols,
              classIds: selectedClassIds,
              mixClasses,
              aiInstruction: aiInstruction.trim() || undefined,
              copyToScheduleIds: schedules.slice(1).map(s => s.id),
            },
            { headers }
          );
          successCount = schedules.length;
          toast.success(`Same seating plan applied to all ${successCount} schedules!`);
        } else {
          // DAILY CHANGE — different seating each day (shuffle)
          for (const sch of schedules) {
            try {
              await axios.post(
                "/api/exam/seating/generate-custom",
                {
                  examScheduleId: sch.id,
                  roomId: selectedRoomIds[0],
                  roomIds: selectedRoomIds,
                  capacity: customCapacity,
                  rows: customRows,
                  cols: customCols,
                  classIds: selectedClassIds,
                  mixClasses,
                  aiInstruction: "random shuffle " + (aiInstruction.trim() || ""),
                },
                { headers }
              );
              successCount++;
            } catch {}
          }
          toast.success(`Different seating generated for ${successCount}/${schedules.length} schedules!`);
        }
      } else {
        const res = await axios.post(
          "/api/exam/seating/generate-custom",
          {
            examScheduleId: selectedSchedule,
            roomId: selectedRoomIds[0],
            roomIds: selectedRoomIds,
            capacity: customCapacity,
            rows: customRows,
            cols: customCols,
            classIds: selectedClassIds,
            mixClasses,
            aiInstruction: aiInstruction.trim() || undefined,
          },
          { headers }
        );
        const result = res.data?.data || res.data || {};
        if (result.unassigned > 0) {
          toast.error(`${result.unassigned} students could not be assigned — add more rooms!`);
        } else {
          const roomInfo = result.roomAssignments?.map((r: any) => `${r.roomName}: ${r.count}`).join(", ") || "";
          toast.success(`Seating generated! Total: ${result.total} students. ${roomInfo ? `(${roomInfo})` : ""}`);
        }
      }
      fetchSeating();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to generate seating";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  // ═══════════════════════════════════════════
  // AI AUTO-ARRANGE
  // ═══════════════════════════════════════════
  const handleAiArrange = async () => {
    if (!selectedSchedule) {
      toast.error("Please select an exam schedule");
      return;
    }
    if (selectedRoomIds.length === 0) {
      toast.error("Please select at least one room");
      return;
    }
    if (selectedClassIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }
    if (!aiInstruction.trim()) {
      toast.error("Please write AI instructions for auto-arrangement");
      return;
    }

    setGenerating(true);
    try {
      await axios.post(
        "/api/exam/seating/ai-arrange",
        {
          examScheduleId: selectedSchedule,
          roomId: selectedRoomIds[0],
          roomIds: selectedRoomIds,
          capacity: customCapacity,
          rows: customRows,
          cols: customCols,
          classIds: selectedClassIds,
          mixClasses,
          aiInstruction: aiInstruction.trim(),
        },
        { headers }
      );
      toast.success("AI seating arrangement done!");
      fetchSeating();
    } catch (error: any) {
      const msg = error.response?.data?.message || "AI arrangement failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };


  // Total available seats (0 if no rooms selected)
  const totalAvailableSeats = selectedRoomIds.length > 0 ? customRows * customCols * selectedRoomIds.length : 0;
  const perRoomSeats = selectedRoomIds.length > 0 ? customRows * customCols : 0;

  // ALWAYS cap displayed seats to grid capacity
  const gridCapacity = selectedRoomIds.length > 0 ? customRows * customCols * selectedRoomIds.length : 0;
  const filteredSeats = filterClass
    ? seats.filter((s) => s.roomName === filterClass)
    : seats;

  // Get class color for a seat
  const getSeatColor = (seat: Seat) => {
    if (!seat.assigned) return { bg: "#f9fafb", border: "#d1d5db", text: "#6b7280" };
    const className = seat.className || "";
    // Try matching by className in the color map
    if (classColorMap[className]) return classColorMap[className];
    // Default green
    return { bg: "#f0fdf4", border: "#16a34a", text: "#166534" };
  };

  // ═══════════════════════════════════════════
  // NORMAL PRINT
  // ═══════════════════════════════════════════
  const handleNormalPrint = () => {
    const examName = exams.find((e) => e.id === selectedExam)?.name || "Exam";
    const schedule = schedules.find((s) => s.id === selectedSchedule);
    const logoUrl = getFullUrl(tenant?.logoUrl);
    const schoolName = tenant?.name || "School Name";
    const schoolAddress = tenant?.address || "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups for printing");
      return;
    }

    // Group seats by room
    const roomGroups: Record<string, typeof seats> = {};
    seats.filter(s => s.assigned).forEach((seat) => {
      const rName = seat.roomName || "Room";
      if (!roomGroups[rName]) roomGroups[rName] = [];
      roomGroups[rName].push(seat);
    });

    // Legend HTML
    const legendHTML = selectedClassIds.map((id, idx) => {
      const cls = classes.find((c) => c.id === id);
      const color = CLASS_COLORS[idx % CLASS_COLORS.length];
      return '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;"><span style="width:10px;height:10px;background:' + color.bg + ';border:1px solid ' + color.border + ';border-radius:2px;display:inline-block;"></span><span style="font-size:10px;">' + (cls?.name || id) + '</span></span>';
    }).join("");

    // Logo HTML
    const logoHTML = logoUrl ? '<img src="' + logoUrl + '" class="logo" />' : '<div style="width:56px;"></div>';
    const addressHTML = schoolAddress ? '<div class="school-address">' + schoolAddress + '</div>' : '';

    // Build room pages
    const gridSize = customRows * customCols;
    const roomPages = Object.entries(roomGroups).map(([roomName, roomSeats]) => {
      // Pad with empty seats
      const padded = [...roomSeats];
      while (padded.length < gridSize) {
        const i = padded.length;
        const rChar = String.fromCharCode(65 + Math.floor(i / customCols));
        const cNum = (i % customCols) + 1;
        padded.push({ seatNumber: rChar + "" + cNum, assigned: false } as any);
      }

      const seatsHTML = padded.slice(0, gridSize).map((seat) => {
        const color = getSeatColor(seat);
        if (seat.assigned) {
          return '<div style="border:1.5px solid ' + color.border + ';border-radius:6px;padding:5px;text-align:center;background:' + color.bg + ';min-height:55px;display:flex;flex-direction:column;justify-content:center;">' +
            '<div style="font-weight:bold;font-size:11px;color:' + color.text + '">' + seat.seatNumber + '</div>' +
            '<div style="font-size:10px;font-weight:600;color:#333;margin-top:2px;">' + (seat.studentName || '') + '</div>' +
            '<div style="font-size:8px;color:#555;">F: ' + (seat.fatherName || '') + '</div>' +
            '<div style="font-size:8px;color:' + color.text + ';margin-top:1px;">' + (seat.className || '') + '/' + (seat.sectionName || '') + ' | Roll: ' + (seat.rollNo || '') + '</div>' +
            '</div>';
        } else {
          return '<div style="border:1.5px dashed #ddd;border-radius:6px;padding:5px;text-align:center;min-height:55px;display:flex;flex-direction:column;justify-content:center;">' +
            '<div style="font-size:9px;color:#ccc;">' + seat.seatNumber + ' (Empty)</div></div>';
        }
      }).join("");

      return '<div class="room-page">' +
        '<div class="header">' + logoHTML +
        '<div class="school-info"><div class="school-name">' + schoolName + '</div>' + addressHTML + '</div>' +
        '<div style="width:56px;"></div></div>' +
        '<div style="text-align:center;"><div class="title">SEATING ARRANGEMENT</div></div>' +
        '<div class="meta">' +
        '<span><strong>Exam:</strong> ' + examName + '</span>' +
        '<span><strong>Subject:</strong> ' + (schedule?.subjectName || 'All') + '</span>' +
        '<span><strong>Date:</strong> ' + (schedule?.date ? new Date(schedule.date).toLocaleDateString("en-IN") : "N/A") + '</span>' +
        '<span><strong>Room:</strong> ' + roomName + '</span>' +
        '<span><strong>Filled:</strong> ' + roomSeats.length + '/' + gridSize + '</span>' +
        '</div>' +
        '<div class="legend">' + legendHTML + '</div>' +
        '<div class="grid">' + seatsHTML + '</div>' +
        '<div class="footer">' +
        '<div class="sign-block"><div class="sign-line"></div><div class="sign-name">Class Teacher</div><div class="sign-title">Signature</div></div>' +
        '<div class="sign-block"><div class="sign-line"></div><div class="sign-name">Principal</div><div class="sign-title">Signature & Seal</div></div>' +
        '</div></div>';
    }).join("");

    const htmlContent = '<!DOCTYPE html><html><head><title>Seating Arrangement - ' + examName + '</title>' +
      '<style>' +
      '@page { size: A4 landscape; margin: 10mm; }' +
      'body { font-family: Times New Roman, serif; margin: 0; padding: 0; }' +
      '.room-page { padding: 14px; page-break-after: always; }' +
      '.room-page:last-child { page-break-after: auto; }' +
      '.header { display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 10px; }' +
      '.logo { width: 50px; height: 50px; object-fit: contain; margin-right: 12px; }' +
      '.school-info { flex: 1; text-align: center; }' +
      '.school-name { font-size: 16px; font-weight: bold; text-transform: uppercase; }' +
      '.school-address { font-size: 9px; color: #555; }' +
      '.title { font-size: 14px; font-weight: bold; border: 1px solid #666; display: inline-block; padding: 3px 16px; margin: 6px 0; }' +
      '.meta { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 10px; }' +
      '.legend { margin-bottom: 8px; padding: 4px 0; border-bottom: 1px solid #eee; }' +
      '.grid { display: grid; grid-template-columns: repeat(' + customCols + ', 1fr); gap: 4px; margin: 8px 0; }' +
      '.footer { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 8px; border-top: 1px solid #ddd; }' +
      '.sign-block { text-align: center; }' +
      '.sign-line { width: 120px; border-top: 1.5px solid #222; margin: 30px auto 4px; }' +
      '.sign-name { font-size: 10px; font-weight: bold; }' +
      '.sign-title { font-size: 9px; color: #555; }' +
      '</style></head><body>' + roomPages + '</body></html>';

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  // ═══════════════════════════════════════════
  // YN-UDP PRINT
  // ═══════════════════════════════════════════
  const handleYnUdpPrint = async () => {
    try {
      setYnLoading(true);
      const res = await axios.get(`${YN_UDP_API}/templates`, {
        params: { tenantId: getTenantId(), type: "custom" },
      });
      setYnTemplates(res.data?.data || []);
      setShowYnModal(true);
    } catch {
      toast.error("YN-UDP server not available. Start it on port 5001.");
    } finally {
      setYnLoading(false);
    }
  };

  const handleYnRender = async () => {
    if (!selectedTemplate) {
      toast.error("Select a template");
      return;
    }
    try {
      const examName = exams.find((e) => e.id === selectedExam)?.name || "";
      const schedule = schedules.find((s) => s.id === selectedSchedule);
      const roomName = selectedRoomIds.map((id) => rooms.find((r) => r.id === id)?.name || "").filter(Boolean).join(", ") || "";
      const res = await axios.post(`${YN_UDP_API}/templates/${selectedTemplate}/render`, {
        data: {
          school_name: tenant?.name || "",
          school_logo: getFullUrl(tenant?.logoUrl) || "",
          school_address: tenant?.address || "",
          exam_name: examName,
          subject_name: schedule?.subjectName || "",
          exam_date: schedule?.date || "",
          room_name: roomName,
          total_seats: filteredSeats.length.toString(),
          assigned_seats: filteredSeats.filter((s) => s.assigned).length.toString(),
        },
      });
      // Open rendered in new window
      const rendered = res.data?.data || res.data;
      toast.success("Template rendered! Opening...");
      window.open(`${YN_UDP_API.replace("/api", "")}/editor/${selectedTemplate}`, "_blank");
      setShowYnModal(false);
    } catch {
      toast.error("Failed to render template");
    }
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/exams")}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seating Arrangement</h1>
              <p className="mt-1 text-sm text-gray-500">
                Configure capacity, select classes, and generate smart seating plans
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {seats.length > 0 && (
              <>
                <button
                  onClick={handleNormalPrint}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={handleYnUdpPrint}
                  disabled={ynLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                >
                  <Palette className="w-4 h-4" />
                  YN-UDP Print
                </button>
              </>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* CONFIGURATION PANEL */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div
            className="flex items-center justify-between px-5 py-3 border-b border-gray-100 cursor-pointer"
            onClick={() => setShowConfig(!showConfig)}
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-800">Seating Configuration</h2>
            </div>
            <span className="text-xs text-gray-400">{showConfig ? "▲ Hide" : "▼ Show"}</span>
          </div>

          {showConfig && (
            <div className="p-5 space-y-5">
              {/* Row 1: Exam / Schedule / Room */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => {
                      setSelectedExam(e.target.value);
                      setSelectedSchedule("");
                      setSeats([]);
                    }}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">-- Select Exam --</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name} {exam.className ? `(${exam.className})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Schedule</label>
                  <select
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    disabled={!selectedExam}
                  >
                    <option value="">-- Select Schedule --</option>
                    <option value="__ALL__">📋 Full Schedule (All Subjects)</option>
                    {schedules.map((sch) => (
                      <option key={sch.id} value={sch.id}>
                        {sch.subjectName} - {sch.date ? new Date(sch.date).toLocaleDateString() : "No date"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Room(s)</label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                    {rooms.length === 0 ? (
                      <p className="text-xs text-gray-400 py-1">No rooms found</p>
                    ) : (
                      rooms.map((room) => (
                        <label
                          key={room.id}
                          className={`flex items-center gap-2 py-1 px-1 rounded cursor-pointer ${
                            roomAssignedCount[room.name] && roomAssignedCount[room.name] >= (room.capacity || 999)
                              ? "bg-green-50 opacity-60"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoomIds.includes(room.id)}
                            disabled={
                              roomAssignedCount[room.name] !== undefined && roomAssignedCount[room.name] >= (room.capacity || 999) && !selectedRoomIds.includes(room.id)
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoomIds([...selectedRoomIds, room.id]);
                              } else {
                                setSelectedRoomIds(selectedRoomIds.filter((id) => id !== room.id));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 flex-1">{room.name}</span>
                          {roomAssignedCount[room.name] !== undefined && roomAssignedCount[room.name] > 0 ? (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              roomAssignedCount[room.name] >= (room.capacity || 999)
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {roomAssignedCount[room.name]} assigned
                            </span>
                          ) : null}
                        </label>
                      ))
                    )}
                  </div>
                  {selectedRoomIds.length > 0 && (
                    <p className="text-xs text-indigo-500 mt-1">{selectedRoomIds.length} room(s) selected</p>
                  )}
                </div>
              </div>

              {/* Row 2: Custom Capacity + Classes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Custom Capacity */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Grid3X3 className="w-4 h-4 text-indigo-500" />
                    Room Layout (Custom Capacity)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Total Seats</label>
                      <input
                        type="number"
                        value={customCapacity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setCustomCapacity(val);
                          // Auto-adjust rows based on cols
                          setCustomRows(Math.ceil(val / customCols));
                        }}
                        min={1}
                        max={500}
                        className="w-full rounded-lg border-gray-300 text-sm font-semibold text-center focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                        <Rows3 className="w-3 h-3" /> Rows
                      </label>
                      <input
                        type="number"
                        value={customRows}
                        onChange={(e) => setCustomRows(parseInt(e.target.value) || 1)}
                        min={1}
                        max={50}
                        className="w-full rounded-lg border-gray-300 text-sm text-center focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                        <Columns3 className="w-3 h-3" /> Columns
                      </label>
                      <input
                        type="number"
                        value={customCols}
                        onChange={(e) => setCustomCols(parseInt(e.target.value) || 1)}
                        min={1}
                        max={20}
                        className="w-full rounded-lg border-gray-300 text-sm text-center focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Layout: {customRows} rows × {customCols} cols = {selectedRoomIds.length > 0 ? customRows * customCols : 0} seats
                  </p>
                </div>

                {/* Classes Multi-Select */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-green-500" />
                    Select Classes (Students will be mixed)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {classes.map((cls, idx) => {
                      const isSelected = selectedClassIds.includes(cls.id);
                      const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                      return (
                        <label
                          key={cls.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs ${
                            isSelected
                              ? "border-2 font-semibold"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          style={
                            isSelected
                              ? { borderColor: color.border, backgroundColor: color.bg, color: color.text }
                              : {}
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClass(cls.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {selectedClassIds.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedClassIds.map((cid) => {
                          const cls = classes.find((c) => c.id === cid);
                          const count = classStudentCounts[cid] || 0;
                          return (
                            <span key={cid} className="text-[10px] bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
                              {cls?.name || "?"}: <strong>{count}</strong>
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-indigo-700 font-semibold">
                        Total Students: {Object.values(classStudentCounts).reduce((a, b) => a + b, 0)} | 
                        Available Seats: {totalAvailableSeats}
                        {Object.values(classStudentCounts).reduce((a, b) => a + b, 0) > totalAvailableSeats && selectedRoomIds.length > 0 && (
                          <span className="text-red-500 ml-2">
                            ⚠️ {Object.values(classStudentCounts).reduce((a, b) => a + b, 0) - totalAvailableSeats} students won't fit — add more rooms!
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Mix toggle */}
              <div className="flex items-center gap-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mixClasses}
                    onChange={() => setMixClasses(!mixClasses)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Mix classes (no same-class students sit adjacent)
                  </span>
                </label>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  Recommended
                </span>
              </div>

              {/* Row 3b: Seating Plan Type (Same vs Daily Change) */}
              <div className="flex items-center gap-4 px-1 py-2">
                <span className="text-sm font-medium text-gray-700">Seating Plan:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="seatingPlanType"
                    value="same"
                    checked={seatingPlanType === "same"}
                    onChange={() => setSeatingPlanType("same")}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">Same for all days</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="seatingPlanType"
                    value="daily"
                    checked={seatingPlanType === "daily"}
                    onChange={() => setSeatingPlanType("daily")}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">Change daily (shuffle per day)</span>
                </label>
              </div>

              {/* Row 4: AI Instruction */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
                <h3 className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Instructions (Optional)
                </h3>
                <textarea
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder='e.g., "Alternate class 5 and class 6 students in every row" or "Put class 7 in first 3 rows, class 8 in last 3 rows" or "Random shuffle but no same-class adjacent"'
                  rows={2}
                  className="w-full rounded-lg border-purple-200 text-sm focus:border-purple-500 focus:ring-purple-500 placeholder-purple-300 resize-none"
                />
                <div className="flex items-center gap-1 mt-1.5">
                  <Info className="w-3 h-3 text-purple-400" />
                  <p className="text-[10px] text-purple-400">
                    Keywords: "alternate", "random", "row", "reverse" — AI will arrange based on instructions
                  </p>
                </div>
              </div>

              {/* Row 5: Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleGenerateCustom}
                  disabled={generating || !selectedSchedule || selectedRoomIds.length === 0 || selectedClassIds.length === 0}
                  className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Generate Seating
                </button>
                <button
                  onClick={handleAiArrange}
                  disabled={generating || !selectedSchedule || selectedRoomIds.length === 0 || selectedClassIds.length === 0 || !aiInstruction.trim()}
                  className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI Auto-Arrange
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* STATS CARDS */}
        {/* ═══════════════════════════════════════════ */}
        {seats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Grid3X3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Capacity</p>
                  <p className="text-xl font-bold text-gray-900">{totalAvailableSeats}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assigned</p>
                  <p className="text-xl font-bold text-gray-900">{seats.filter(s => s.assigned).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-xl font-bold text-gray-900">{Math.max(0, totalAvailableSeats - seats.filter(s => s.assigned).length)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Classes Mixed</p>
                  <p className="text-xl font-bold text-gray-900">{selectedClassIds.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* FILTER + LEGEND */}
        {/* ═══════════════════════════════════════════ */}
        {seats.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Filter */}
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All Rooms</option>
                  {selectedRoomIds.map((id) => {
                      const room = rooms.find((r) => r.id === id);
                      return (
                        <option key={id} value={room?.name || ""}>
                          {room?.name || "Unknown"}
                        </option>
                      );
                    })}
                </select>
                <span className="text-xs text-gray-400">
                  Showing {seats.filter(s => s.assigned).length} assigned of {totalAvailableSeats} total seats ({selectedRoomIds.length} rooms)
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 flex-wrap">
                {selectedClassIds.map((id, idx) => {
                  const cls = classes.find((c) => c.id === id);
                  const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md"
                      style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: color.border }}
                      ></span>
                      {cls?.name || id}
                    </span>
                  );
                })}
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 px-2 py-1 rounded-md bg-gray-50 border border-gray-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gray-300"></span>
                  Empty
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SEATING GRID */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-indigo-500" />
              Seating Layout
              {seats.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">
                  ({customRows}×{customCols} grid)
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="ml-2 text-sm text-gray-500">Loading seating...</span>
            </div>
          ) : filteredSeats.length === 0 ? (
            <div className="text-center py-20">
              <Grid3X3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {selectedSchedule
                  ? "No seating data. Configure above and generate."
                  : "Select an exam and schedule to view/generate seating arrangement."}
              </p>
            </div>
          ) : (
            <div>
              {/* ROOM-WISE CARD GRIDS */}
              {(() => {
                // Group seats by room
                if (!filteredSeats || filteredSeats.length === 0) {
                  return (
                    <div className="text-center text-gray-400 py-8">
                      No seating arrangement generated yet. Click &quot;Generate Seating&quot; to create one.
                    </div>
                  );
                }
                const roomGroups: Record<string, typeof filteredSeats> = {};
                filteredSeats.forEach((seat) => {
                  const rName = seat.roomName || "Unassigned";
                  if (!roomGroups[rName]) roomGroups[rName] = [];
                  roomGroups[rName].push(seat);
                });
                const roomNames = Object.keys(roomGroups);
                
                // If no rooms after grouping
                if (roomNames.length === 0) {
                  return (
                    <div className="text-center text-gray-400 py-8">
                      No seating data available.
                    </div>
                  );
                }

                return roomNames.map((roomName, roomIdx) => {
                  const roomSeats = roomGroups[roomName];
                  // Pad with empty seats up to grid capacity
                  const gridSize = customRows * customCols;
                  const paddedSeats = [...roomSeats];
                  while (paddedSeats.length < gridSize) {
                    const i = paddedSeats.length;
                    const row = String.fromCharCode(65 + Math.floor(i / customCols));
                    const col = (i % customCols) + 1;
                    paddedSeats.push({ seatNumber: `${row}${col}`, assigned: false });
                  }

                  return (
                    <div key={roomIdx} className="mb-8">
                      {/* Room Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                        <span className="text-sm font-bold text-gray-800 bg-indigo-50 px-3 py-1 rounded-lg">
                          📍 {roomName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {roomSeats.filter(s => s.assigned).length} / {gridSize} seats filled
                        </span>
                      </div>
                      {/* Grid */}
                      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${customCols}, minmax(0, 1fr))` }}>
                        {paddedSeats.slice(0, gridSize).map((seat, idx) => {
                          const color = getSeatColor(seat);
                          return (
                            <div
                              key={idx}
                              className={`rounded-xl p-3 transition-all hover:shadow-md ${
                                seat.assigned ? "border-2 shadow-sm" : "border-2 border-dashed"
                              }`}
                              style={{
                                borderColor: color.border,
                                backgroundColor: seat.assigned ? color.bg : "#fafafa",
                              }}
                            >
                              {seat.assigned ? (
                                <>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: color.border + '30', color: color.text }}>
                                      {seat.seatNumber}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
                                      {seat.className}/{seat.sectionName}
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-800 truncate">{seat.studentName}</p>
                                  <p className="text-[10px] text-gray-500 truncate">F: {seat.fatherName}</p>
                                  <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                                    <span>Roll: {seat.rollNo}</span>
                                    <span>{seat.roomName}</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-16">
                                  <span className="text-xs text-gray-300">{seat.seatNumber} (Empty)</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
              <div className="mt-3 text-xs text-gray-400 text-right">
                Showing {filteredSeats.filter((s) => s.assigned).length} assigned / {customRows * customCols * Math.max(selectedRoomIds.length, 1)} total seats
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* EXAM ATTENDANCE SHEET */}
        {/* ═══════════════════════════════════════════ */}
        {seats.length > 0 && seats.filter((s) => s.assigned).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-orange-500" />
              Exam Attendance Sheet
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Room selector for attendance */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
                <select
                  value={attendanceRoom}
                  onChange={(e) => setAttendanceRoom(e.target.value)}
                  className="w-full rounded-lg border-gray-300 text-sm focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="">-- All Rooms --</option>
                  {selectedRoomIds.map((id) => {
                    const rm = rooms.find((r) => r.id === id);
                    return rm ? (
                      <option key={rm.id} value={rm.name}>{rm.name}</option>
                    ) : null;
                  })}
                </select>
              </div>

              {/* Papers per day */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Papers per day</label>
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="papersPerDay"
                      checked={papersPerDay === "single"}
                      onChange={() => setPapersPerDay("single")}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Single Paper</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="papersPerDay"
                      checked={papersPerDay === "two"}
                      onChange={() => setPapersPerDay("two")}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Two Papers</span>
                  </label>
                </div>
              </div>

              {/* Date Range for Attendance */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Exam Start Date</label>
                <input
                  type="date"
                  value={manualStartDate}
                  onChange={(e) => setManualStartDate(e.target.value)}
                  className="w-full rounded-lg border-gray-300 text-sm focus:border-orange-500 focus:ring-orange-500"
                />
                <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">Exam End Date</label>
                <input
                  type="date"
                  value={manualEndDate}
                  onChange={(e) => setManualEndDate(e.target.value)}
                  className="w-full rounded-lg border-gray-300 text-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              {/* Print Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const examName = exams.find((e) => e.id === selectedExam)?.name || "Exam";
                    const logoUrl = getFullUrl(tenant?.logoUrl);
                    const roomLabel = attendanceRoom || selectedRoomIds.map((id) => rooms.find((r) => r.id === id)?.name || "").filter(Boolean).join(", ") || "All Rooms";

                    // Get unique dates from schedules OR generate from manual date range
                    let examDates = [...new Set(schedules.map((s) => s.date).filter(Boolean))].sort();

                    // If no dates from schedule, use manual date range
                    if (examDates.length === 0 && manualStartDate && manualEndDate) {
                      const start = new Date(manualStartDate);
                      const end = new Date(manualEndDate);
                      const dates: string[] = [];
                      const current = new Date(start);
                      while (current <= end) {
                        dates.push(current.toISOString().split("T")[0]);
                        current.setDate(current.getDate() + 1);
                      }
                      examDates = dates;
                    }

                    if (examDates.length === 0) {
                      toast.error("No dates found! Please set exam Start Date and End Date.");
                      return;
                    }

                    // Filter students by selected room, cap to grid capacity
                    const maxPerRoom = customRows * customCols;
                    let attendStudents = seats.filter((s) => s.assigned);
                    if (attendanceRoom) {
                      attendStudents = attendStudents.filter((s) => s.roomName === attendanceRoom);
                    }
                    // HARD CAP: never exceed room capacity
                    attendStudents = attendStudents.slice(0, maxPerRoom);

                    // Build date header columns
                    const dateHeaders = examDates.map((d) => {
                      const dateStr = new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                      if (papersPerDay === "two") {
                        return `<th style="border:1px solid #ccc;padding:3px 4px;font-size:9px;text-align:center;" colspan="2">${dateStr}</th>`;
                      }
                      return `<th style="border:1px solid #ccc;padding:3px 4px;font-size:9px;text-align:center;">${dateStr}</th>`;
                    }).join("");

                    // Sub-headers for two papers
                    const subHeaders = papersPerDay === "two"
                      ? `<tr>${examDates.map(() => `<th style="border:1px solid #ccc;padding:2px;font-size:8px;text-align:center;">P1</th><th style="border:1px solid #ccc;padding:2px;font-size:8px;text-align:center;">P2</th>`).join("")}</tr>`
                      : "";

                    const colsPerDate = papersPerDay === "two" ? 2 : 1;
                    const totalDateCols = examDates.length * colsPerDate;

                    // Build student rows
                    const rowsHTML = attendStudents.map((s, idx) => {
                      const dateCells = Array(totalDateCols).fill(`<td style="border:1px solid #ccc;padding:8px;text-align:center;"></td>`).join("");
                      return `<tr><td style="border:1px solid #ccc;padding:4px 6px;font-size:11px;text-align:center;">${idx + 1}</td><td style="border:1px solid #ccc;padding:4px 6px;font-size:11px;">${s.studentName || "-"}</td><td style="border:1px solid #ccc;padding:4px 6px;font-size:11px;text-align:center;">${s.className || ""}/${s.sectionName || ""}</td><td style="border:1px solid #ccc;padding:4px 6px;font-size:11px;text-align:center;">${s.rollNo || "-"}</td>${dateCells}</tr>`;
                    }).join("");

                    const dateRange = examDates.length > 0 ? `${new Date(examDates[0]).toLocaleDateString("en-IN")} to ${new Date(examDates[examDates.length - 1]).toLocaleDateString("en-IN")}` : "N/A";

                    const pw = window.open("", "_blank");
                    if (!pw) { toast.error("Allow popups"); return; }
                    pw.document.write(`<!DOCTYPE html><html><head><title>Attendance - ${examName}</title><style>@page{size:A4 landscape;margin:10mm;}body{font-family:'Times New Roman',serif;padding:14px;margin:0;}.header{display:flex;align-items:center;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:10px;}.logo{width:50px;height:50px;object-fit:contain;margin-right:12px;}.school-info{flex:1;text-align:center;}.school-name{font-size:17px;font-weight:bold;text-transform:uppercase;}.school-addr{font-size:9px;color:#555;}table{width:100%;border-collapse:collapse;margin-top:10px;}.footer{display:flex;justify-content:space-between;margin-top:24px;padding-top:8px;border-top:1px solid #ddd;}.sign-block{text-align:center;}.sign-line{width:120px;border-top:1.5px solid #222;margin:30px auto 3px;}.sign-name{font-size:10px;font-weight:bold;}</style></head><body><div class="header">${logoUrl ? `<img src="${logoUrl}" class="logo" />` : '<div style="width:50px;"></div>'}<div class="school-info"><div class="school-name">${tenant?.name || "School"}</div>${tenant?.address ? `<div class="school-addr">${tenant.address}</div>` : ""}</div><div style="width:50px;"></div></div><div style="text-align:center;margin-bottom:8px;"><strong style="font-size:14px;border:1px solid #666;padding:3px 16px;">EXAM ATTENDANCE REGISTER</strong></div><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px;"><span><b>Exam:</b> ${examName}</span><span><b>Room:</b> ${roomLabel}</span><span><b>Period:</b> ${dateRange}</span><span><b>Students:</b> ${attendStudents.length}</span></div><table><thead><tr><th style="border:1px solid #ccc;padding:4px;font-size:9px;" rowspan="${papersPerDay === 'two' ? 2 : 1}">S.No</th><th style="border:1px solid #ccc;padding:4px;font-size:9px;" rowspan="${papersPerDay === 'two' ? 2 : 1}">Student Name</th><th style="border:1px solid #ccc;padding:4px;font-size:9px;" rowspan="${papersPerDay === 'two' ? 2 : 1}">Class/Sec</th><th style="border:1px solid #ccc;padding:4px;font-size:9px;" rowspan="${papersPerDay === 'two' ? 2 : 1}">Roll No</th>${dateHeaders}</tr>${subHeaders}</thead><tbody>${rowsHTML}</tbody></table><div class="footer"><div class="sign-block"><div class="sign-line"></div><div class="sign-name">Invigilator</div></div><div class="sign-block"><div class="sign-line"></div><div class="sign-name">Class Teacher</div></div><div class="sign-block"><div class="sign-line"></div><div class="sign-name">Principal</div></div></div></body></html>`);
                    pw.document.close();
                    setTimeout(() => pw.print(), 400);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print Attendance Sheet
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-400">
              Generates attendance register based on exam schedule dates ({schedules.length} schedule(s), {[...new Set(schedules.map((s) => s.date).filter(Boolean))].length} unique date(s)).
              {papersPerDay === "two" && " Two columns per date (Paper 1 & Paper 2)."}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* YN-UDP TEMPLATE MODAL */}
        {/* ═══════════════════════════════════════════ */}
        {showYnModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Print via YN-UDP Template
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                {ynTemplates.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    No templates found. Create one in YN-UDP Designer first.
                  </p>
                ) : (
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">-- Select Template --</option>
                    {ynTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowYnModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleYnRender}
                  disabled={!selectedTemplate}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Render & Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingArrangementPage;

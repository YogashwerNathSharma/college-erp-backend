import { getFullUrl } from '../../utils/url';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Minus, Trash2, ChevronUp, ChevronDown,
  Printer, RefreshCw, Loader2, Save, RotateCcw,
  AlertCircle, CheckCircle, Users, BookOpen, Building2, Settings2, XCircle, ClipboardList,
} from 'lucide-react';

const COLORS = [
  { bg: '#dbeafe', bd: '#3b82f6', tx: '#1e40af' },
  { bg: '#dcfce7', bd: '#22c55e', tx: '#166534' },
  { bg: '#fef3c7', bd: '#f59e0b', tx: '#92400e' },
  { bg: '#fce7f3', bd: '#ec4899', tx: '#9d174d' },
  { bg: '#e0e7ff', bd: '#6366f1', tx: '#3730a3' },
  { bg: '#f3e8ff', bd: '#a855f7', tx: '#6b21a8' },
  { bg: '#ccfbf1', bd: '#14b8a6', tx: '#115e59' },
  { bg: '#fee2e2', bd: '#ef4444', tx: '#991b1b' },
  { bg: '#fef9c3', bd: '#eab308', tx: '#854d0e' },
  { bg: '#e2e8f0', bd: '#64748b', tx: '#334155' },
  { bg: '#fdf2f8', bd: '#d946ef', tx: '#86198f' },
  { bg: '#ecfeff', bd: '#06b6d4', tx: '#155e75' },
];

interface ClassItem    { id: string; name: string; }
interface ExamItem     { id: string; name: string; }
interface RoomItem     { id: string; name: string; capacity?: number; }
interface ScheduleItem { id: string; subjectName: string; date: string; }
interface BenchSlot    { id: string; classIds: string[]; }
interface RoomConf     { roomId: string; rows: number; benches: number; }
interface Seat {
  studentId?: string; studentName?: string; rollNo?: string; fatherName?: string;
  roomName?: string; roomId?: string; className?: string; sectionName?: string;
  rowNo?: number; benchNo?: number; seatInBench?: number;
  seatNumber?: string; seatNo?: string; assigned?: boolean;
}

const STEPS = [
  { n: 1, label: 'Setup',    Icon: BookOpen },
  { n: 2, label: 'Pattern',  Icon: Settings2 },
  { n: 3, label: 'Rooms',    Icon: Building2 },
  { n: 4, label: 'Generate', Icon: Users },
];

function parseSeatCode(seatNo?: string): { rowNo: number; benchNo: number; seatInBench: number } {
  if (!seatNo) return { rowNo: 1, benchNo: 1, seatInBench: 1 };
  const m = seatNo.match(/R(\d+)-B(\d+)-S(\d+)/i);
  if (m) return { rowNo: parseInt(m[1], 10), benchNo: parseInt(m[2], 10), seatInBench: parseInt(m[3], 10) };
  return { rowNo: 1, benchNo: 1, seatInBench: 1 };
}

function enrichSeats(raw: Seat[]): Seat[] {
  return raw.map(seat => {
    const code = seat.seatNo || seat.seatNumber || '';
    const parsed = parseSeatCode(code);
    return {
      ...seat,
      seatNumber: code,
      rowNo:       seat.rowNo       ?? parsed.rowNo,
      benchNo:     seat.benchNo     ?? parsed.benchNo,
      seatInBench: seat.seatInBench ?? parsed.seatInBench,
    };
  });
}

function triggerPrint(html: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  } else {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open(); doc.write(html); doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 600);
    }
  }
}

const SeatingArrangementPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [step, setStep] = useState(1);
  const [wholeExamMode, setWholeExamMode] = useState(false);

  // Step 1
  const [exams,            setExams]            = useState<ExamItem[]>([]);
  const [selectedExam,     setSelectedExam]     = useState('');
  const [schedules,        setSchedules]        = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [classes,          setClasses]          = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Step 2
  const [benchSlots, setBenchSlots] = useState<BenchSlot[]>([]);

  // Step 3
  const [allRooms,  setAllRooms]  = useState<RoomItem[]>([]);
  const [roomConfs, setRoomConfs] = useState<RoomConf[]>([]);

  // Step 4
  const [generating, setGenerating] = useState(false);
  const [genResult,  setGenResult]  = useState<any>(null);
  const [genError,   setGenError]   = useState<string>('');
  const [seats,      setSeats]      = useState<Seat[]>([]);
  const [loading,    setLoading]    = useState(false);

  // Attendance register
  const [attendanceData,    setAttendanceData]    = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const classColorMap = useMemo(() => {
    const m: Record<string, typeof COLORS[0]> = {};
    classes.forEach((c, i) => { m[c.id] = COLORS[i % COLORS.length]; m[c.name] = COLORS[i % COLORS.length]; });
    return m;
  }, [classes]);

  const uniqueExams = useMemo(() => {
    const seen = new Set<string>();
    return exams.filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true; });
  }, [exams]);

  const assignedClassIds = useMemo(() => benchSlots.flatMap(s => s.classIds), [benchSlots]);
  const maxSeatPerBench  = useMemo(() => benchSlots.reduce((m, s) => Math.max(m, s.classIds.length), 0), [benchSlots]);
  const totalCapacity    = useMemo(() => roomConfs.reduce((a, r) => a + r.rows * r.benches * maxSeatPerBench, 0), [roomConfs, maxSeatPerBench]);

  const seatGrouped = useMemo(() => {
    const g: Record<string, Record<number, Record<number, Seat[]>>> = {};
    seats.forEach(s => {
      const rm = s.roomName || 'Unknown';
      const row = s.rowNo ?? 1;
      const bench = s.benchNo ?? 1;
      if (!g[rm]) g[rm] = {};
      if (!g[rm][row]) g[rm][row] = {};
      if (!g[rm][row][bench]) g[rm][row][bench] = [];
      g[rm][row][bench].push(s);
    });
    return g;
  }, [seats]);

  useEffect(() => { fetchExams(); fetchRooms(); fetchClasses(); }, []);
  useEffect(() => { if (selectedExam) fetchSchedules(); }, [selectedExam]);
  useEffect(() => {
    if (step === 4 && selectedSchedule && seats.length === 0) fetchSeating(selectedSchedule);
  }, [step]);

  const fetchExams = async () => {
    try {
      const r = await axios.get(getFullUrl('/api/exam'), { headers });
      const d = r.data?.data;
      setExams(Array.isArray(d) ? d : d?.exams || r.data || []);
    } catch { toast.error('Failed to load exams'); }
  };
  const fetchRooms = async () => {
    try {
      const r = await axios.get(getFullUrl('/api/room'), { headers });
      setAllRooms(r.data?.data || r.data || []);
    } catch { toast.error('Failed to load rooms'); }
  };
  const fetchClasses = async () => {
    try {
      const r = await axios.get(getFullUrl('/api/class'), { headers });
      setClasses(r.data?.data || r.data || []);
    } catch {}
  };
  const fetchSchedules = async () => {
    try {
      const r = await axios.get(getFullUrl(`/api/exam/${selectedExam}/schedule`), { headers });
      const d = r.data?.data || r.data || [];
      setSchedules((Array.isArray(d) ? d : []).map((s: any) => ({ ...s, date: s.date || s.examDate || '' })));
    } catch {}
  };
  const fetchSeating = async (scheduleId: string) => {
    setLoading(true);
    try {
      let raw: Seat[] = [];
      try {
        const r = await axios.get(getFullUrl(`/api/exam/seating-detail/${scheduleId}`), { headers });
        raw = r.data?.data || [];
      } catch {
        const r = await axios.get(getFullUrl(`/api/exam/seating/${scheduleId}`), { headers });
        const d = r.data?.data || r.data || {};
        raw = Array.isArray(d) ? d : d.seats || [];
      }
      setSeats(enrichSeats(raw));
    } catch { setSeats([]); }
    finally { setLoading(false); }
  };

  const fetchAttendanceRegister = async () => {
    if (!selectedExam) return toast.error('Select an exam first');
    setLoadingAttendance(true);
    try {
      const r = await axios.get(getFullUrl(`/api/exam/attendance-register/${selectedExam}`), { headers });
      setAttendanceData(r.data?.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load attendance register');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Pattern actions
  const autoGeneratePattern = () => {
    if (!selectedClassIds.length) return toast.error('Select classes first');
    const slots: BenchSlot[] = [];
    for (let i = 0; i < selectedClassIds.length; i += 3)
      slots.push({ id: `s${Date.now()}-${i}`, classIds: selectedClassIds.slice(i, i + 3) });
    setBenchSlots(slots);
    toast.success('Pattern auto-generated');
  };
  const addBenchSlot      = () => setBenchSlots(p => [...p, { id: `s${Date.now()}`, classIds: [] }]);
  const removeBenchSlot   = (id: string) => setBenchSlots(p => p.filter(s => s.id !== id));
  const moveSlot = (idx: number, dir: -1 | 1) => setBenchSlots(p => {
    const n = [...p]; const t = idx + dir;
    if (t < 0 || t >= n.length) return p;
    [n[idx], n[t]] = [n[t], n[idx]]; return n;
  });
  const addClassToSlot      = (id: string, cid: string) => setBenchSlots(p => p.map(s => s.id === id ? { ...s, classIds: [...s.classIds, cid] } : s));
  const removeClassFromSlot = (id: string, cid: string) => setBenchSlots(p => p.map(s => s.id === id ? { ...s, classIds: s.classIds.filter(c => c !== cid) } : s));
  const savePattern  = () => { localStorage.setItem('erp_bench_pattern', JSON.stringify(benchSlots)); toast.success('Pattern saved!'); };
  const loadPattern  = () => { const d = localStorage.getItem('erp_bench_pattern'); if (!d) return toast.error('No saved pattern'); setBenchSlots(JSON.parse(d)); toast.success('Pattern loaded!'); };

  const toggleRoom  = (room: RoomItem) => setRoomConfs(p => p.find(r => r.roomId === room.id) ? p.filter(r => r.roomId !== room.id) : [...p, { roomId: room.id, rows: 5, benches: 10 }]);
  const updateRoom  = (roomId: string, field: 'rows' | 'benches', val: number) => setRoomConfs(p => p.map(r => r.roomId === roomId ? { ...r, [field]: Math.max(1, val) } : r));
  const toggleClass = (id: string) => setSelectedClassIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleGenerate = async () => {
    if (!wholeExamMode && !selectedSchedule) return toast.error('Select a schedule');
    if (wholeExamMode && !selectedExam)      return toast.error('Select an exam');
    if (!selectedClassIds.length) return toast.error('Select classes');
    if (!benchSlots.length)       return toast.error('Design bench pattern first');
    if (!roomConfs.length)        return toast.error('Configure at least one room');

    setGenerating(true); setGenResult(null); setGenError(''); setSeats([]);

    const benchPatternPayload = benchSlots.map((s, i) => ({ benchSlot: i + 1, classIds: s.classIds }));
    const roomConfigsPayload  = roomConfs.map(r => ({ roomId: r.roomId, rows: r.rows, benches: r.benches }));

    try {
      let res;
      if (wholeExamMode) {
        res = await axios.post(
          getFullUrl('/api/exam/seating/generate-whole-exam'),
          { examId: selectedExam, classIds: selectedClassIds, benchPattern: benchPatternPayload, roomConfigs: roomConfigsPayload },
          { headers, timeout: 120000 }
        );
      } else {
        res = await axios.post(
          getFullUrl('/api/exam/seating/generate-interleaved'),
          { examScheduleId: selectedSchedule, classIds: selectedClassIds, benchPattern: benchPatternPayload, roomConfigs: roomConfigsPayload },
          { headers, timeout: 60000 }
        );
      }
      const result = res.data?.data;
      setGenResult(result);
      toast.success(result?.message || 'Seating generated!');
      if (!wholeExamMode) await fetchSeating(selectedSchedule);
      else if (schedules.length > 0) await fetchSeating(schedules[0].id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Generation failed.';
      setGenError(msg);
      toast.error(msg, { duration: 8000 });
    } finally {
      setGenerating(false);
    }
  };

  // ─── PRINT BUILDERS ──────────────────────────────────────

  const buildRoomChartHTML = () => {
    let h = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Room Chart</title><style>
@page{size:A4 landscape;margin:8mm}
body{font-family:Arial;font-size:9px}
.page{page-break-after:always;padding:4mm}
h2{text-align:center;font-size:13px;color:#1e3a8a;margin:0 0 4px}
.board{text-align:center;margin-bottom:6px}.board span{background:#1e3a8a;color:#fff;padding:2px 20px;border-radius:20px;font-size:8px}
.row-wrap{margin-bottom:5px}.rl{font-size:8px;color:#888;font-weight:bold;margin-bottom:2px}
.benches{display:flex;flex-wrap:wrap;gap:3px}
.bench{border:1px solid #ccc;border-radius:3px;overflow:hidden;min-width:70px}
.bh{background:#e8eaf6;text-align:center;font-size:7px;padding:1px;font-weight:bold;color:#3730a3}
.seats{display:flex}.seat{flex:1;padding:2px 1px;text-align:center;border-right:1px solid #e5e7eb}.seat:last-child{border-right:none}
.sn{font-weight:bold;font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sr{font-size:7px;color:#6b7280}.sc{font-size:7px;font-weight:bold}
</style></head><body>`;
    Object.entries(seatGrouped).forEach(([rm, rowMap]) => {
      h += `<div class="page"><h2>${rm}</h2><div class="board"><span>BOARD / DOOR</span></div>`;
      Object.entries(rowMap).sort(([a],[b])=>+a-+b).forEach(([row, bm]) => {
        h += `<div class="row-wrap"><div class="rl">Row ${row}</div><div class="benches">`;
        Object.entries(bm).sort(([a],[b])=>+a-+b).forEach(([bn, bs]) => {
          const sorted = [...bs].sort((a,b)=>(a.seatInBench??0)-(b.seatInBench??0));
          h += `<div class="bench"><div class="bh">B${bn}</div><div class="seats">`;
          sorted.forEach(s => { h += `<div class="seat"><div class="sn">${(s.studentName||'').split(' ')[0]||'—'}</div><div class="sr">${s.rollNo||''}</div><div class="sc">${s.className||''}</div></div>`; });
          h += `</div></div>`;
        });
        h += `</div></div>`;
      });
      h += `</div>`;
    });
    return h + `</body></html>`;
  };

  const buildStudentSlipsHTML = () => {
    // Group by room for room-wise printing
    const byRoom: Record<string, Seat[]> = {};
    seats.forEach(s => {
      const rn = s.roomName || 'Unknown';
      if (!byRoom[rn]) byRoom[rn] = [];
      byRoom[rn].push(s);
    });

    let h = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Student Seat Slips</title><style>
@page{size:A4;margin:8mm}
body{font-family:Arial;font-size:9px}
.room-header{font-size:13px;font-weight:bold;color:#1e3a8a;text-align:center;margin:8px 0 6px;border-bottom:2px solid #1e3a8a;padding-bottom:4px}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-bottom:8mm}
.slip{border:1.5px solid #1e3a8a;border-radius:4px;padding:6px}
.stitle{font-size:10px;font-weight:bold;text-align:center;color:#1e3a8a;border-bottom:1px solid #ddd;margin-bottom:4px;padding-bottom:2px}
.row{display:flex;justify-content:space-between;margin:1.5px 0}
.lbl{color:#888}.val{font-weight:bold;text-align:right;max-width:65%}
.seat-big{font-size:14px;font-weight:bold;color:#1e3a8a;text-align:center;margin:4px 0 2px;letter-spacing:1px}
</style></head><body>`;

    Object.entries(byRoom).forEach(([roomName, roomSeats]) => {
      // Sort room seats by seatNo
      const sorted = [...roomSeats].sort((a, b) => (a.seatNumber || '').localeCompare(b.seatNumber || '', undefined, { numeric: true }));
      h += `<div class="room-header">Room: ${roomName}</div><div class="grid">`;
      sorted.forEach(s => {
        h += `<div class="slip">
          <div class="stitle">SEAT SLIP</div>
          <div class="seat-big">${s.seatNumber || s.seatNo || '—'}</div>
          ${[
            ['Name',    s.studentName || ''],
            ['Roll No', s.rollNo || ''],
            ['Class',   s.className || ''],
            ['Section', s.sectionName || ''],
            ['Room',    roomName],
            ['F/Name',  s.fatherName || ''],
          ].map(([l,v]) => `<div class="row"><span class="lbl">${l}:</span><span class="val">${v}</span></div>`).join('')}
        </div>`;
      });
      h += `</div>`;
    });
    return h + `</body></html>`;
  };

  const buildInvigilatorHTML = () => {
    let h = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invigilator Report</title><style>
@page{size:A4;margin:10mm}
body{font-family:Arial;font-size:9px}
.page{page-break-after:always}
h2{text-align:center;font-size:13px;color:#1e3a8a;margin:0 0 8px}
table{width:100%;border-collapse:collapse}
th{background:#1e3a8a;color:#fff;padding:3px 5px;font-size:8px;text-align:left}
td{padding:3px 5px;border-bottom:1px solid #e5e7eb;font-size:8px}
tr:nth-child(even){background:#f8fafc}
</style></head><body>`;
    Object.entries(seatGrouped).forEach(([rm, rowMap]) => {
      const all = Object.values(rowMap).flatMap(bm => Object.values(bm).flat())
        .sort((a,b)=>{ if((a.rowNo??0)!==(b.rowNo??0))return(a.rowNo??0)-(b.rowNo??0); if((a.benchNo??0)!==(b.benchNo??0))return(a.benchNo??0)-(b.benchNo??0); return(a.seatInBench??0)-(b.seatInBench??0); });
      h += `<div class="page"><h2>${rm} — Invigilator Sheet</h2>
        <table><thead><tr><th>#</th><th>Seat No</th><th>Roll No</th><th>Student Name</th><th>Class/Sec</th><th>Father Name</th><th>Signature</th></tr></thead><tbody>`;
      all.forEach((s,i) => {
        h += `<tr><td>${i+1}</td><td>${s.seatNumber||''}</td><td>${s.rollNo||''}</td><td>${s.studentName||''}</td><td>${s.className||''}${s.sectionName ? ' / '+s.sectionName : ''}</td><td>${s.fatherName||''}</td><td style="width:55px"></td></tr>`;
      });
      h += `</tbody></table></div>`;
    });
    return h + `</body></html>`;
  };

  const buildAttendanceRegisterHTML = () => {
    if (!attendanceData) return '';
    const { exam, schedules: scheds, rooms } = attendanceData;
    let h = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Attendance Register</title><style>
@page{size:A4 landscape;margin:8mm}
body{font-family:Arial;font-size:8px}
.page{page-break-after:always}
h2{text-align:center;font-size:12px;color:#1e3a8a;margin:0 0 2px}
h3{font-size:10px;color:#374151;margin:0 0 4px}
.meta{text-align:center;font-size:8px;color:#6b7280;margin-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:7.5px}
th{background:#1e3a8a;color:#fff;padding:3px 4px;text-align:center;border:1px solid #1e40af}
td{padding:2px 4px;border:1px solid #d1d5db;text-align:center}
.name-cell{text-align:left;min-width:80px}
tr:nth-child(even){background:#f9fafb}
</style></head><body>`;

    rooms.forEach((room: any) => {
      h += `<div class="page">
        <h2>${exam.name} — Attendance Register</h2>
        <h3>Room: ${room.roomName}</h3>
        <div class="meta">Total Students: ${room.students.length}</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Seat</th>
              <th>Roll No</th>
              <th class="name-cell">Student Name</th>
              <th>Class/Sec</th>
              <th>Subject (Exam Date)</th>
              ${scheds.map((sch: any) => `<th>${sch.subjectName}<br/>${new Date(sch.examDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</th>`).join('')}
            </tr>
          </thead>
          <tbody>`;
      room.students.forEach((st: any, idx: number) => {
        h += `<tr>
          <td>${idx + 1}</td>
          <td>${st.seatNo || ''}</td>
          <td>${st.rollNo || ''}</td>
          <td class="name-cell">${st.studentName || ''}</td>
          <td>${st.className || ''}${st.sectionName ? '/' + st.sectionName : ''}</td>
          <td></td>
          ${scheds.map(() => `<td style="min-width:28px"></td>`).join('')}
        </tr>`;
      });
      h += `</tbody></table></div>`;
    });
    return h + `</body></html>`;
  };

  const canGoStep2 = !!selectedSchedule && selectedClassIds.length > 0;
  const canGoStep3 = benchSlots.length > 0 && benchSlots.every(s => s.classIds.length > 0);
  const canGoStep4 = roomConfs.length > 0;

  // In whole-exam mode step 1 only needs exam + classes (no schedule required)
  const canGoStep2WholeExam = !!selectedExam && selectedClassIds.length > 0;

  const goNext = () => {
    const ok2 = wholeExamMode ? canGoStep2WholeExam : canGoStep2;
    if (step === 1 && !ok2) return toast.error(wholeExamMode ? 'Select exam & at least one class' : 'Select exam, schedule & at least one class');
    if (step === 2 && !canGoStep3) return toast.error('Each bench slot needs at least one class');
    if (step === 3 && !canGoStep4) return toast.error('Select at least one room');
    setStep(s => Math.min(4, s + 1));
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button onClick={() => setWholeExamMode(false)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${!wholeExamMode ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}>
          Single Schedule
        </button>
        <button onClick={() => setWholeExamMode(true)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${wholeExamMode ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}>
          Whole Exam (All Subjects at Once)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Term</label>
          <select value={selectedExam} onChange={e => { setSelectedExam(e.target.value); setSelectedSchedule(''); }}
            className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2">
            <option value="">-- Select Exam --</option>
            {uniqueExams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        {!wholeExamMode && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject / Schedule</label>
            <select value={selectedSchedule} onChange={e => setSelectedSchedule(e.target.value)}
              disabled={!selectedExam}
              className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 disabled:opacity-50">
              <option value="">-- Select Schedule --</option>
              {schedules.map(s => <option key={s.id} value={s.id}>{s.subjectName}{s.date ? ` — ${new Date(s.date).toLocaleDateString('en-IN')}` : ''}</option>)}
            </select>
          </div>
        )}
      </div>

      {wholeExamMode && schedules.length > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800">
          <strong>{schedules.length} subject schedules found.</strong> Same seating plan will be applied to all of them.
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-gray-600">Classes <span className="text-gray-400 font-normal">(order matters)</span></label>
          <span className="text-xs text-indigo-600">{selectedClassIds.length} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {classes.map((cls, idx) => {
            const c = COLORS[idx % COLORS.length];
            const sel = selectedClassIds.includes(cls.id);
            const order = selectedClassIds.indexOf(cls.id) + 1;
            return (
              <button key={cls.id} onClick={() => toggleClass(cls.id)}
                style={sel ? { background: c.bg, borderColor: c.bd, color: c.tx } : {}}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${sel ? '' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`}>
                {sel && <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold" style={{ background: c.bd }}>{order}</span>}
                {cls.name}
              </button>
            );
          })}
        </div>
        {selectedClassIds.length > 0 && (
          <div className="flex gap-3 mt-2">
            <button onClick={() => setSelectedClassIds([])} className="text-xs text-red-500 hover:underline">Clear all</button>
            <button onClick={() => setSelectedClassIds(classes.map(c => c.id))} className="text-xs text-indigo-500 hover:underline">Select all</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Bench Pattern Designer</h3>
          <p className="text-xs text-gray-500 mt-0.5">Which classes sit on each bench slot. Pattern repeats across all rows & rooms.</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={loadPattern} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl hover:bg-gray-50"><RotateCcw className="w-3 h-3" /> Load</button>
          <button onClick={savePattern} className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-indigo-300 text-indigo-700 rounded-xl hover:bg-indigo-50"><Save className="w-3 h-3" /> Save</button>
          <button onClick={autoGeneratePattern} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><RefreshCw className="w-3 h-3" /> Auto (3/slot)</button>
        </div>
      </div>
      <div className="space-y-2">
        {benchSlots.map((slot, idx) => (
          <div key={slot.id} className="border border-gray-200 rounded-2xl p-3 bg-gray-50">
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center gap-0.5 pt-0.5">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">{idx+1}</div>
                <button onClick={() => moveSlot(idx,-1)} disabled={idx===0} className="p-0.5 text-gray-400 disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
                <button onClick={() => moveSlot(idx,1)} disabled={idx===benchSlots.length-1} className="p-0.5 text-gray-400 disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 mb-1">Bench Slot {idx+1}</div>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[26px]">
                  {slot.classIds.length === 0
                    ? <span className="text-[10px] text-gray-400 italic">No classes assigned</span>
                    : slot.classIds.map(cid => {
                        const cls = classes.find(c => c.id === cid);
                        const col = classColorMap[cid] || COLORS[0];
                        return (
                          <span key={cid} style={{ background: col.bg, borderColor: col.bd, color: col.tx }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold">
                            {cls?.name}<button onClick={() => removeClassFromSlot(slot.id, cid)} className="opacity-60 hover:opacity-100">×</button>
                          </span>
                        );
                      })}
                </div>
                <select value="" onChange={e => { if (e.target.value) addClassToSlot(slot.id, e.target.value); }}
                  className="text-xs border border-gray-300 rounded-xl px-2 py-1 bg-white max-w-[180px]">
                  <option value="">+ Add class</option>
                  {selectedClassIds.filter(cid => !slot.classIds.includes(cid)).map(cid => {
                    const cls = classes.find(c => c.id === cid);
                    return <option key={cid} value={cid}>{cls?.name}</option>;
                  })}
                </select>
              </div>
              <button onClick={() => removeBenchSlot(slot.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addBenchSlot} className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl hover:border-indigo-400 hover:text-indigo-600 text-xs w-full justify-center">
        <Plus className="w-3.5 h-3.5" /> Add Bench Slot
      </button>
      {benchSlots.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
          <strong>Pattern:</strong>{' '}
          {benchSlots.map((s, i) => `Bench ${i+1} → ${s.classIds.map(id => classes.find(c => c.id === id)?.name || '?').join(', ')}`).join('  |  ')}
          {' '}| repeats
        </div>
      )}
      {(() => { const un = selectedClassIds.filter(id => !assignedClassIds.includes(id)); return un.length > 0 ? (
        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-xl text-xs text-yellow-800 flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span><strong>Not in any slot:</strong> {un.map(id => classes.find(c=>c.id===id)?.name).join(', ')}</span>
        </div>
      ) : null; })()}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800">Room Configuration</h3>
        <p className="text-xs text-gray-500 mt-0.5">Each room can have different rows and benches.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[{v:roomConfs.length,l:'Rooms',col:'#4f46e5'},{v:totalCapacity,l:'Total Seats',col:'#059669'},{v:selectedClassIds.length,l:'Classes',col:'#d97706'}].map(({v,l,col})=>(
          <div key={l} className="border rounded-xl p-2.5" style={{borderColor:col+'33',background:col+'0d'}}>
            <div className="text-lg font-bold" style={{color:col}}>{v}</div>
            <div className="text-[10px] mt-0.5" style={{color:col+'aa'}}>{l}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {allRooms.map(room => {
          const conf = roomConfs.find(r => r.roomId === room.id);
          const sel = !!conf;
          const cap = conf ? conf.rows * conf.benches * maxSeatPerBench : 0;
          return (
            <div key={room.id} className={`border rounded-2xl p-3 transition-all ${sel ? 'border-indigo-300 bg-indigo-50/60' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={sel} onChange={() => toggleRoom(room)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm font-semibold text-gray-800 flex-1">{room.name}</span>
                {room.capacity && <span className="text-[10px] text-gray-400">Max {room.capacity}</span>}
                {sel && cap > 0 && <span className="text-[10px] text-indigo-600 font-medium">{cap} seats</span>}
              </div>
              {sel && conf && (
                <div className="mt-3 pl-7 grid grid-cols-2 gap-3">
                  {(['rows','benches'] as const).map(field => (
                    <div key={field}>
                      <label className="text-[10px] font-semibold text-gray-500 block mb-1">{field === 'rows' ? 'Rows' : 'Benches/Row'}</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateRoom(room.id, field, conf[field]-1)} className="w-6 h-6 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"><Minus className="w-2.5 h-2.5" /></button>
                        <input type="number" min={1} max={50} value={conf[field]} onChange={e => updateRoom(room.id, field, +e.target.value)} className="w-12 text-center text-sm border border-gray-300 rounded-lg py-0.5" />
                        <button onClick={() => updateRoom(room.id, field, conf[field]+1)} className="w-6 h-6 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"><Plus className="w-2.5 h-2.5" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="col-span-2 text-[10px] text-indigo-600">{conf.rows} × {conf.benches} × {maxSeatPerBench} = <strong>{cap} seats</strong></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Pre-Generation Checklist</h3>
        <div className="space-y-1.5">
          {[
            { ok: wholeExamMode ? !!selectedExam : !!selectedSchedule, label: wholeExamMode ? 'Exam selected' : 'Schedule selected' },
            { ok: selectedClassIds.length > 0, label: `${selectedClassIds.length} classes selected` },
            { ok: canGoStep3,                  label: `${benchSlots.length} bench slots configured` },
            { ok: roomConfs.length > 0,        label: `${roomConfs.length} rooms configured` },
            { ok: totalCapacity > 0,           label: `${totalCapacity} total seats available` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {item.ok ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
              <span className={item.ok ? 'text-gray-700' : 'text-red-500'}>{item.label}</span>
            </div>
          ))}
        </div>

        {wholeExamMode && (
          <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
            <strong>Whole Exam Mode:</strong> One click generates seats for all {schedules.length} subject schedules using the same room plan.
          </div>
        )}

        <button onClick={handleGenerate}
          disabled={generating || !canGoStep3 || !canGoStep4 || (wholeExamMode ? !selectedExam : !selectedSchedule)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          {generating ? 'Generating... please wait' : wholeExamMode ? 'Generate for Whole Exam' : 'Generate Seating Arrangement'}
        </button>
      </div>

      {genError && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-red-700">Generation Failed</div>
              <div className="text-xs text-red-600 mt-1 break-words">{genError}</div>
            </div>
          </div>
        </div>
      )}

      {genResult && (
        <div className={`p-4 rounded-2xl border ${genResult.unassignedCount > 0 ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
          <div className="flex items-center gap-2">
            {genResult.unassignedCount > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{genResult.message}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>Assigned: <strong>{genResult.totalAssigned}</strong></div>
            {genResult.schedulesProcessed && <div>Schedules: <strong>{genResult.schedulesProcessed}</strong></div>}
          </div>
        </div>
      )}

      {/* Print buttons */}
      {seats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => triggerPrint(buildRoomChartHTML())}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" /> Room Chart
          </button>
          <button onClick={() => triggerPrint(buildStudentSlipsHTML())}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" /> Student Slips
          </button>
          <button onClick={() => triggerPrint(buildInvigilatorHTML())}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" /> Invigilator Sheet
          </button>
        </div>
      )}

      {/* Attendance Register section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Attendance Register</h3>
            <p className="text-xs text-gray-500 mt-0.5">Room-wise register with all exam dates — print for invigilators</p>
          </div>
          <button onClick={fetchAttendanceRegister} disabled={loadingAttendance || !selectedExam}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
            {loadingAttendance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardList className="w-3.5 h-3.5" />}
            {loadingAttendance ? 'Loading...' : 'Load Register'}
          </button>
        </div>
        {attendanceData && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              <strong>{attendanceData.rooms?.length}</strong> rooms &nbsp;·&nbsp;
              <strong>{attendanceData.schedules?.length}</strong> subjects &nbsp;·&nbsp;
              <strong>{attendanceData.rooms?.reduce((a: number, r: any) => a + r.students.length, 0)}</strong> students
            </div>
            <button onClick={() => triggerPrint(buildAttendanceRegisterHTML())}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold">
              <Printer className="w-3.5 h-3.5" /> Print Attendance Register
            </button>
          </div>
        )}
      </div>

      {/* Seating view */}
      {loading
        ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
        : seats.length > 0 && Object.entries(seatGrouped).map(([roomName, rowMap]) => (
            <div key={roomName} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-800">{roomName}</h3>
                <span className="text-xs text-gray-400">({Object.values(rowMap).flatMap(bm=>Object.values(bm)).flat().length} students)</span>
              </div>
              <div className="text-center mb-3">
                <span className="inline-block px-8 py-1 bg-gray-800 text-white text-[9px] rounded-full tracking-widest">BOARD / DOOR</span>
              </div>
              {Object.entries(rowMap).sort(([a],[b])=>+a-+b).map(([rowNum, benchMap]) => (
                <div key={rowNum} className="mb-4">
                  <div className="text-[10px] font-bold text-gray-500 mb-1.5">Row {rowNum}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(benchMap).sort(([a],[b])=>+a-+b).map(([benchNum, bSeats]) => {
                      const sorted = [...bSeats].sort((a,b)=>(a.seatInBench??0)-(b.seatInBench??0));
                      return (
                        <div key={benchNum} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="text-[8px] text-center text-indigo-600 bg-indigo-50 py-0.5 font-bold border-b border-indigo-100">B{benchNum}</div>
                          <div className="flex">
                            {sorted.map(seat => {
                              const col = classColorMap[seat.className||''] || {bg:'#f1f5f9',bd:'#94a3b8',tx:'#475569'};
                              return (
                                <div key={`${seat.rowNo}-${seat.benchNo}-${seat.seatInBench}`}
                                  style={{ background: col.bg, borderRight: `1px solid ${col.bd}` }}
                                  className="flex flex-col items-center px-1.5 py-1.5 min-w-[40px] last:border-r-0">
                                  <span className="text-[8px] font-bold truncate w-full text-center" style={{color:col.tx}}>{(seat.studentName||'').split(' ')[0]||'—'}</span>
                                  <span className="text-[7px] text-gray-400">{seat.rollNo}</span>
                                  <span className="text-[7px] font-semibold mt-0.5" style={{color:col.tx}}>{seat.className}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))
      }
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/exams')} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dynamic Exam Seating Engine</h1>
            <p className="text-xs text-gray-500">Pattern-based • Roll number wise • Per-room configurable</p>
          </div>
        </div>

        <div className="flex bg-white border border-gray-200 rounded-2xl p-1 mb-5">
          {STEPS.map(({ n, label, Icon }) => {
            const active = step === n;
            const done   = step > n;
            return (
              <button key={n} onClick={() => { if (n < step || (n===2&&(wholeExamMode?canGoStep2WholeExam:canGoStep2))||(n===3&&canGoStep3)||(n===4&&canGoStep4)) setStep(n); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${active ? 'bg-indigo-600 text-white shadow' : done ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-400'}`}>
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{n}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex justify-between">
          <button onClick={() => setStep(s => Math.max(1, s-1))} disabled={step===1}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-30">← Back</button>
          {step < 4 && (
            <button onClick={goNext} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Next →</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatingArrangementPage;

import { getFullUrl } from '../../utils/url';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, Users, Printer, Search, Plus, Minus } from 'lucide-react';

// ─── Class color palette ───────────────────────────────────────────────────────
const CLASS_COLORS = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  { bg: '#ccfbf1', border: '#14b8a6', text: '#115e59' },
  { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  { bg: '#e2e8f0', border: '#64748b', text: '#334155' },
  { bg: '#fdf2f8', border: '#d946ef', text: '#86198f' },
  { bg: '#ecfeff', border: '#06b6d4', text: '#155e75' },
];

interface Exam { id: string; name: string; }
interface ClassItem { id: string; name: string; }
interface Room { id: string; name: string; capacity?: number; }
interface Seat {
  seatNumber: string;
  studentId?: string;
  studentName?: string;
  rollNo?: string;
  roomId?: string;
  roomName?: string;
  className?: string;
  assigned: boolean;
  rowNo?: number;
  benchNo?: number;
  seatInBench?: number;
}
interface ScheduleItem {
  id: string;
  subjectName: string;
  date: string;
}

// ─────────────────────────────────────────────────────────────────────────────
const SeatingArrangementPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [rows, setRows] = useState(5);
  const [benchesPerRow, setBenchesPerRow] = useState(10);

  // Map: classId → color
  const classColorMap = useMemo(() => {
    const m: Record<string, typeof CLASS_COLORS[0]> = {};
    selectedClassIds.forEach((id, idx) => { m[id] = CLASS_COLORS[idx % CLASS_COLORS.length]; });
    return m;
  }, [selectedClassIds]);

  // className → color (for display after generation)
  const classNameColorMap = useMemo(() => {
    const m: Record<string, typeof CLASS_COLORS[0]> = {};
    selectedClassIds.forEach((id, idx) => {
      const cls = classes.find(c => c.id === id);
      if (cls) m[cls.name] = CLASS_COLORS[idx % CLASS_COLORS.length];
    });
    return m;
  }, [selectedClassIds, classes]);

  // Unique exam terms
  const uniqueExamTerms = useMemo(() => {
    const seen = new Set<string>();
    return exams.filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true; });
  }, [exams]);

  // Filtered seats
  const displaySeats = useMemo(() => {
    let list = seats.filter(s => s.assigned);
    if (filterRoom) list = list.filter(s => s.roomName === filterRoom);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q) ||
        (s.className || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [seats, filterRoom, searchQuery]);

  // Group: room → row → bench → seats[]
  const grouped = useMemo(() => {
    const g: Record<string, Record<number, Record<number, Seat[]>>> = {};
    displaySeats.forEach(s => {
      const rm = s.roomName || 'Unassigned';
      const r = s.rowNo ?? 1;
      const b = s.benchNo ?? 1;
      if (!g[rm]) g[rm] = {};
      if (!g[rm][r]) g[rm][r] = {};
      if (!g[rm][r][b]) g[rm][r][b] = [];
      g[rm][r][b].push(s);
    });
    return g;
  }, [displaySeats]);

  const resultRooms = useMemo(() => Object.keys(grouped), [grouped]);

  useEffect(() => { fetchExams(); fetchRooms(); fetchClasses(); }, []);
  useEffect(() => { if (selectedExam) fetchSchedules(); }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await axios.get(getFullUrl('/api/exam'), { headers });
      const raw = res.data?.data;
      setExams(Array.isArray(raw) ? raw : raw?.exams || res.data || []);
    } catch { toast.error('Failed to load exams'); }
  };
  const fetchRooms = async () => {
    try {
      const res = await axios.get(getFullUrl('/api/room'), { headers });
      setRooms(res.data?.data || res.data || []);
    } catch { toast.error('Failed to load rooms'); }
  };
  const fetchClasses = async () => {
    try {
      const res = await axios.get(getFullUrl('/api/class'), { headers });
      setClasses(res.data?.data || res.data || []);
    } catch {}
  };
  const fetchSchedules = async () => {
    try {
      const res = await axios.get(getFullUrl(`/api/exam/${selectedExam}/schedule`), { headers });
      const raw = res.data?.data || res.data || [];
      setSchedules((Array.isArray(raw) ? raw : []).map((s: any) => ({
        ...s, date: s.date || s.examDate || '',
      })));
    } catch {}
  };
  const fetchSeating = async (scheduleId: string) => {
    setLoading(true);
    try {
      // Try enriched endpoint first, fall back to basic
      let raw: any[] = [];
      try {
        const res = await axios.get(getFullUrl(`/api/exam/seating-detail/${scheduleId}`), { headers });
        raw = res.data?.data || [];
      } catch {
        const res = await axios.get(getFullUrl(`/api/exam/seating/${scheduleId}`), { headers });
        const d = res.data?.data || res.data || {};
        raw = Array.isArray(d) ? d : d.seats || [];
      }
      setSeats(raw.map(mapSeat));
    } catch { setSeats([]); }
    finally { setLoading(false); }
  };

  const mapSeat = (s: any): Seat => ({
    seatNumber: s.seatNo || s.seatNumber || '',
    studentId: s.studentId || '',
    studentName: s.studentName || '',
    rollNo: s.rollNo || s.admissionNo || '',
    roomId: s.roomId || '',
    roomName: s.roomName || '',
    className: s.className || '',
    assigned: s.assigned ?? !!s.studentId,
    rowNo: typeof s.rowNo === 'number' ? s.rowNo : 1,
    benchNo: typeof s.benchNo === 'number' ? s.benchNo : 1,
    seatInBench: typeof s.seatInBench === 'number' ? s.seatInBench : 1,
  });

  const handleGenerate = async () => {
    if (generating) return;
    if (!selectedSchedule) return toast.error('Schedule select karo');
    if (selectedRoomIds.length === 0) return toast.error('Kam se kam ek room select karo');
    if (selectedClassIds.length === 0) return toast.error('Kam se kam ek class select karo');
    setGenerating(true);
    try {
      await axios.post(
        getFullUrl('/api/exam/seating/generate-interleaved'),
        { examScheduleId: selectedSchedule, roomIds: selectedRoomIds, classIds: selectedClassIds, rows, benchesPerRow, seatsPerBench: 3, groupSize: 3 },
        { headers }
      );
      toast.success('Seating arrangement generated!');
      fetchSeating(selectedSchedule);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate seating');
    } finally { setGenerating(false); }
  };

  const toggleRoom = (id: string) =>
    setSelectedRoomIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleClass = (id: string) =>
    setSelectedClassIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('/exams')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Seating Arrangement</h1>
            <p className="text-xs text-gray-500">Bench 1 → Cls1,2,3 | Bench 2 → Cls4,5,6 | repeat</p>
          </div>
          {seats.length > 0 && (
            <button onClick={() => window.print()}
              className="ml-auto flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium print:hidden">
              <Printer className="w-4 h-4" /> Print
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 print:hidden space-y-4">

          {/* Row 1: Exam + Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Term</label>
              <select value={selectedExam}
                onChange={e => { setSelectedExam(e.target.value); setSelectedSchedule(''); setSeats([]); }}
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5">
                <option value="">-- Select Exam --</option>
                {uniqueExamTerms.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Schedule</label>
              <select value={selectedSchedule}
                onChange={e => { setSelectedSchedule(e.target.value); if (e.target.value) fetchSeating(e.target.value); }}
                disabled={!selectedExam}
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5">
                <option value="">-- Select Schedule --</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName}{s.date ? ` — ${new Date(s.date).toLocaleDateString('en-IN')}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Rows + Benches per row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Rows: <span className="text-indigo-600 font-bold">{rows}</span>
              </label>
              <div className="flex items-center gap-1">
                <button onClick={() => setRows(r => Math.max(1, r - 1))}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                <input type="number" min={1} max={50} value={rows}
                  onChange={e => setRows(Math.max(1, +e.target.value))}
                  className="w-14 text-center text-sm border border-gray-300 rounded-lg py-1" />
                <button onClick={() => setRows(r => Math.min(50, r + 1))}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Benches/Row: <span className="text-indigo-600 font-bold">{benchesPerRow}</span>
              </label>
              <div className="flex items-center gap-1">
                <button onClick={() => setBenchesPerRow(b => Math.max(1, b - 1))}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                <input type="number" min={1} max={20} value={benchesPerRow}
                  onChange={e => setBenchesPerRow(Math.max(1, +e.target.value))}
                  className="w-14 text-center text-sm border border-gray-300 rounded-lg py-1" />
                <button onClick={() => setBenchesPerRow(b => Math.min(20, b + 1))}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
          </div>

          {/* Room selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rooms</label>
            <div className="flex flex-wrap gap-1.5">
              {rooms.map(rm => (
                <button key={rm.id} onClick={() => toggleRoom(rm.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedRoomIds.includes(rm.id)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}>{rm.name}</button>
              ))}
            </div>
          </div>

          {/* Class selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Classes <span className="text-gray-400 font-normal">(order matters)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {classes.map((cls, idx) => {
                const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                const sel = selectedClassIds.includes(cls.id);
                return (
                  <button key={cls.id} onClick={() => toggleClass(cls.id)}
                    style={sel ? { background: color.bg, borderColor: color.border, color: color.text } : {}}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      sel ? '' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}>{cls.name}</button>
                );
              })}
            </div>
          </div>

          {/* Pattern preview */}
          {selectedClassIds.length > 0 && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <strong>Pattern:</strong>{' '}
              {Array.from({ length: Math.min(4, Math.ceil(selectedClassIds.length / 3)) }, (_, gi) => {
                const grp = selectedClassIds.slice(gi * 3, gi * 3 + 3)
                  .map(id => classes.find(c => c.id === id)?.name).filter(Boolean);
                return `Bench ${gi * 2 + 1} → ${grp.join(', ')}`;
              }).join(' | ')}
              {' '}| then repeats
            </div>
          )}

          {/* Generate */}
          <button onClick={handleGenerate} disabled={generating || !selectedSchedule}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate Seating'}
          </button>
        </div>

        {/* Results */}
        {seats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Stats + Search + Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-4 print:hidden">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="w-4 h-4 text-indigo-500" />
                {displaySeats.length} students
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Search..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1 w-44" />
              </div>
              {resultRooms.length > 1 && (
                <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1">
                  <option value="">All Rooms</option>
                  {resultRooms.map(r => <option key={r}>{r}</option>)}
                </select>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>
            ) : (
              Object.entries(grouped).map(([roomName, rowMap]) => (
                <div key={roomName} className="mb-8">
                  {/* Room header */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      {roomName}
                    </h3>
                    <span className="text-xs text-gray-400">
                      ({Object.values(rowMap).flatMap(b => Object.values(b)).flat().length} students)
                    </span>
                  </div>

                  {/* BOARD */}
                  <div className="text-center mb-3">
                    <span className="inline-block px-8 py-1 bg-gray-800 text-white text-xs rounded-full tracking-widest">BOARD / DOOR</span>
                  </div>

                  {/* Rows */}
                  {Object.entries(rowMap).sort(([a], [b]) => +a - +b).map(([rowNum, benchMap]) => (
                    <div key={rowNum} className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 mb-1.5">Row {rowNum}</div>
                      {/* Benches in a row — horizontal */}
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(benchMap).sort(([a], [b]) => +a - +b).map(([benchNum, benchSeats]) => {
                          const sorted = [...benchSeats].sort((a, b) => (a.seatInBench ?? 0) - (b.seatInBench ?? 0));
                          return (
                            <div key={benchNum} className="border border-gray-200 rounded-lg overflow-hidden" style={{ minWidth: 110 }}>
                              {/* Bench label */}
                              <div className="text-center text-[9px] font-semibold text-gray-400 bg-gray-50 py-0.5 border-b border-gray-200">
                                Bench {benchNum}
                              </div>
                              {/* Seats — VERTICAL stack (like real bench seats side by side) */}
                              <div className="flex">
                                {sorted.map(seat => {
                                  const color = classNameColorMap[seat.className || ''] || { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' };
                                  return (
                                    <div key={seat.seatNumber}
                                      style={{ background: color.bg, borderRight: `1px solid ${color.border}` }}
                                      className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 text-center min-w-[36px]">
                                      <div className="text-[9px] font-bold truncate w-full text-center" style={{ color: color.text }}>
                                        {seat.studentName?.split(' ')[0] || '—'}
                                      </div>
                                      <div className="text-[8px] text-gray-400 truncate w-full text-center">{seat.rollNo}</div>
                                      <div className="text-[8px] font-semibold mt-0.5" style={{ color: color.text }}>{seat.className}</div>
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
            )}

            {/* Legend */}
            {selectedClassIds.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 print:hidden border-t pt-3">
                <span className="text-xs text-gray-500 mr-1">Legend:</span>
                {selectedClassIds.map((id, idx) => {
                  const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                  const cls = classes.find(c => c.id === id);
                  return (
                    <span key={id} style={{ background: color.bg, borderColor: color.border, color: color.text }}
                      className="px-2 py-0.5 rounded-full border text-xs font-medium">{cls?.name}</span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingArrangementPage;

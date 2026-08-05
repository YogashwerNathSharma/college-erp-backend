import { getFullUrl } from '../../utils/url';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Users,
  Printer,
  Search,
  Plus,
  Minus,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
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

interface Exam {
  id: string;
  name: string;
  classId?: string;
  academicYearId?: string;
  className?: string;
}

interface ClassItem { id: string; name: string; }
interface Room { id: string; name: string; capacity?: number; }
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
  rowNo?: number;
  benchNo?: number;
  seatInBench?: number;
}
interface ScheduleItem {
  id: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime?: string;
  roomName: string;
}

// ═══════════════════════════════════════════════════════════════════
const SeatingArrangementPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Core state
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

  // Room config: rows, benchesPerRow
  // User can add/remove rows and benches
  const [rows, setRows] = useState(5);
  const [benchesPerRow, setBenchesPerRow] = useState(10);
  const [seatsPerBench] = useState(3); // always 3 (left, middle, right)
  const [groupSize] = useState(3); // 3 classes per bench rotation

  // Unique exam terms (grouped by name for multi-class exams)
  const uniqueExamTerms = useMemo(() => {
    const map = new Map<string, { name: string; ids: string[] }>();
    exams.forEach(e => {
      const ex = map.get(e.name);
      if (ex) ex.ids.push(e.id);
      else map.set(e.name, { name: e.name, ids: [e.id] });
    });
    return Array.from(map.values());
  }, [exams]);

  // Class color map
  const classColorMap = useMemo(() => {
    const m: Record<string, (typeof CLASS_COLORS)[0]> = {};
    selectedClassIds.forEach((id, idx) => {
      m[id] = CLASS_COLORS[idx % CLASS_COLORS.length];
    });
    classes.forEach(cls => { if (m[cls.id]) m[cls.name] = m[cls.id]; });
    return m;
  }, [selectedClassIds, classes]);

  // Filter seats
  const displaySeats = useMemo(() => {
    let filtered = seats.filter(s => s.assigned);
    if (filterRoom) filtered = filtered.filter(s => s.roomName === filterRoom);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q) ||
        (s.className || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [seats, filterRoom, searchQuery]);

  // Group seats by room then by row
  const seatsByRoomAndRow = useMemo(() => {
    const byRoom: Record<string, Record<number, Seat[]>> = {};
    displaySeats.forEach(seat => {
      const rName = seat.roomName || 'Unassigned';
      const row = seat.rowNo || 1;
      if (!byRoom[rName]) byRoom[rName] = {};
      if (!byRoom[rName][row]) byRoom[rName][row] = [];
      byRoom[rName][row].push(seat);
    });
    return byRoom;
  }, [displaySeats]);

  // Distinct room names in result
  const resultRooms = useMemo(() => Object.keys(seatsByRoomAndRow), [seatsByRoomAndRow]);

  // ──── Effects
  useEffect(() => {
    fetchExams();
    fetchRooms();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchSchedules();
  }, [selectedExam]);

  // ──── API Calls
  const fetchExams = async () => {
    try {
      const res = await axios.get(getFullUrl('/api/exam'), { headers });
      setExams(Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.exams || res.data || []);
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
        ...s,
        date: s.date || s.examDate || '',
      })));
    } catch {}
  };

  const fetchSeating = async (scheduleId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(getFullUrl(`/api/exam/seating/${scheduleId}`), { headers });
      const raw = res.data?.data || res.data || {};
      const rawSeats = Array.isArray(raw) ? raw : raw.seats || [];
      setSeats(rawSeats.map(mapSeat));
    } catch { setSeats([]); }
    finally { setLoading(false); }
  };

  const mapSeat = (s: any): Seat => ({
    seatNumber: s.seatNumber || '',
    studentId: s.studentId || '',
    studentName: s.studentName || '',
    fatherName: s.fatherName || '',
    roomId: s.roomId || '',
    roomName: s.roomName || '',
    rollNo: s.rollNo || s.admissionNo || '',
    className: s.className || '',
    sectionName: s.sectionName || '',
    assigned: s.assigned ?? !!s.studentId,
    rowNo: s.rowNo || 1,
    benchNo: s.benchNo || 1,
    seatInBench: s.seatInBench || 1,
  });

  // ──── Generate Seating
  const handleGenerate = async () => {
    if (generating) return;
    if (!selectedSchedule) return toast.error('Please select a schedule');
    if (selectedRoomIds.length === 0) return toast.error('Select at least one room');
    if (selectedClassIds.length === 0) return toast.error('Select at least one class');

    setGenerating(true);
    try {
      await axios.post(
        getFullUrl('/api/exam/seating/generate-interleaved'),
        {
          examScheduleId: selectedSchedule,
          roomIds: selectedRoomIds,
          classIds: selectedClassIds,
          rows,
          benchesPerRow,
          seatsPerBench,
          groupSize,
        },
        { headers }
      );
      toast.success('Seating arrangement generated!');
      fetchSeating(selectedSchedule);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate seating');
    } finally {
      setGenerating(false);
    }
  };

  // ──── Print
  const handlePrint = () => window.print();

  // Room toggle
  const toggleRoom = (id: string) =>
    setSelectedRoomIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Class toggle
  const toggleClass = (id: string) =>
    setSelectedClassIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/exams')} className="mr-4 p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seating Arrangement</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Interleaved pattern: Class 1,2,3 → Bench 1 │ Class 4,5,6 → Bench 2 │ repeat
            </p>
          </div>
          {seats.length > 0 && (
            <button
              onClick={handlePrint}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 print:hidden"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          )}
        </div>

        {/* Controls grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Exam term */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Term</label>
              <select
                value={selectedExam}
                onChange={e => { setSelectedExam(e.target.value); setSelectedSchedule(''); setSeats([]); }}
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm"
              >
                <option value="">-- Select Exam --</option>
                {uniqueExamTerms.map(t => (
                  <option key={t.ids[0]} value={t.ids[0]}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Schedule (Subject)</label>
              <select
                value={selectedSchedule}
                onChange={e => { setSelectedSchedule(e.target.value); if (e.target.value) fetchSeating(e.target.value); }}
                disabled={!selectedExam}
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm"
              >
                <option value="">-- Select Schedule --</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName} {s.date ? `- ${new Date(s.date).toLocaleDateString('en-IN')}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Rows control */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Rows per Room: <span className="text-indigo-600">{rows}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRows(r => Math.max(1, r - 1))}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                ><Minus className="w-4 h-4" /></button>
                <input
                  type="number"
                  min={1} max={50}
                  value={rows}
                  onChange={e => setRows(Math.max(1, Number(e.target.value)))}
                  className="w-16 text-center text-sm border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => setRows(r => Math.min(50, r + 1))}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                ><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Benches per row control */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Benches per Row: <span className="text-indigo-600">{benchesPerRow}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBenchesPerRow(b => Math.max(1, b - 1))}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                ><Minus className="w-4 h-4" /></button>
                <input
                  type="number"
                  min={1} max={20}
                  value={benchesPerRow}
                  onChange={e => setBenchesPerRow(Math.max(1, Number(e.target.value)))}
                  className="w-16 text-center text-sm border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => setBenchesPerRow(b => Math.min(20, b + 1))}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                ><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Room selection */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">Select Rooms</label>
            <div className="flex flex-wrap gap-2">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => toggleRoom(room.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedRoomIds.includes(room.id)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {room.name} {room.capacity ? `(${room.capacity})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Class selection */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Select Classes (order matters for pattern)
            </label>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls, idx) => {
                const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                const selected = selectedClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    style={selected ? { background: color.bg, borderColor: color.border, color: color.text } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selected ? '' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {cls.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pattern info */}
          {selectedClassIds.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <strong>Pattern:</strong>
              {' '}Bench 1 → {selectedClassIds.slice(0, 3).map(id => classes.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
              {selectedClassIds.length > 3 && <>
                {' '}│ Bench 2 → {selectedClassIds.slice(3, 6).map(id => classes.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
              </>}
              {' '}│ then repeats. Same student never adjacent same/prev/next class in same bench.
            </div>
          )}

          {/* Generate button */}
          <div className="mt-4">
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedSchedule}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate Seating'}
            </button>
          </div>
        </div>

        {/* Seats Grid */}
        {seats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium">{seats.filter(s => s.assigned).length} students assigned</span>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 ml-auto">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student / roll / class..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="text-sm border-gray-300 rounded-lg w-56"
                />
              </div>
              {/* Room filter */}
              {resultRooms.length > 1 && (
                <select
                  value={filterRoom}
                  onChange={e => setFilterRoom(e.target.value)}
                  className="text-sm border-gray-300 rounded-lg"
                >
                  <option value="">All Rooms</option>
                  {resultRooms.map(r => <option key={r}>{r}</option>)}
                </select>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
            ) : (
              Object.entries(seatsByRoomAndRow).map(([roomName, rowMap]) => (
                <div key={roomName} className="mb-8">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    🏫 {roomName}
                  </h3>

                  {/* DOOR indicator */}
                  <div className="text-center mb-2">
                    <span className="inline-block px-6 py-1 bg-gray-800 text-white text-xs rounded-full">BOARD / DOOR</span>
                  </div>

                  {Object.entries(rowMap)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([rowNum, rowSeats]) => {
                      // Group by benchNo
                      const benchMap: Record<number, Seat[]> = {};
                      rowSeats.forEach(s => {
                        const bn = s.benchNo || 1;
                        if (!benchMap[bn]) benchMap[bn] = [];
                        benchMap[bn].push(s);
                      });
                      return (
                        <div key={rowNum} className="mb-3">
                          <div className="text-xs text-gray-400 mb-1 font-medium">Row {rowNum}</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(benchMap)
                              .sort(([a], [b]) => Number(a) - Number(b))
                              .map(([benchNum, benchSeats]) => (
                                <div
                                  key={benchNum}
                                  className="border border-gray-200 rounded-lg p-1.5 bg-gray-50 min-w-[140px]"
                                >
                                  <div className="text-[10px] text-gray-400 mb-1 text-center">Bench {benchNum}</div>
                                  <div className="flex gap-1">
                                    {benchSeats
                                      .sort((a, b) => (a.seatInBench || 0) - (b.seatInBench || 0))
                                      .map(seat => {
                                        const color = classColorMap[seat.className || ''] || CLASS_COLORS[0];
                                        return (
                                          <div
                                            key={seat.seatNumber}
                                            style={{ background: color.bg, borderColor: color.border }}
                                            className="flex-1 border rounded p-1 text-center text-[10px] min-w-[42px]"
                                          >
                                            <div className="font-semibold truncate" style={{ color: color.text }}>
                                              {seat.studentName?.split(' ')[0] || '—'}
                                            </div>
                                            <div className="text-gray-500">{seat.rollNo}</div>
                                            <div style={{ color: color.text }} className="text-[9px]">
                                              {seat.className}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))
            )}

            {/* Legend */}
            {selectedClassIds.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                {selectedClassIds.map((id, idx) => {
                  const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                  const cls = classes.find(c => c.id === id);
                  return (
                    <span
                      key={id}
                      style={{ background: color.bg, borderColor: color.border, color: color.text }}
                      className="px-2 py-0.5 rounded-full border text-xs font-medium"
                    >{cls?.name}</span>
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

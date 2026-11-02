import { getFullUrl } from '../../utils/url';
import { AdmitCardDetail as SharedAdmitCardDetail, printAdmitCards, AdmitCardLayout } from '../../utils/admitCardPrint';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Printer,
  Eye,
  X,
  CreditCard,
  RefreshCw,
  Trash2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
interface Exam { id: string; name: string; className?: string; }
interface ClassItem { id: string; name: string; }
interface AdmitCardItem {
  id: string;
  examId: string;
  studentId: string;
  student?: { id: string; name: string; rollNo: string; photoUrl?: string; fatherName?: string; className?: string; };
  rollNo: string;
  isGenerated: boolean;
}
type AdmitCardDetail = SharedAdmitCardDetail;

type PrintMode = 'single' | 'class' | 'school';



// ═══════════════════════════════════════════════════════════════════
const AdmitCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramExamId } = useParams<{ id: string }>();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState(paramExamId || '');
  const [admitCards, setAdmitCards] = useState<AdmitCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>('school');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [viewingCard, setViewingCard] = useState<AdmitCardDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [singlePrinting, setSinglePrinting] = useState(false);

  // ── Configurable print layout (orientation + grid of columns × rows) ──
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [columns, setColumns] = useState(1);
  const [rows, setRows] = useState(3);

  useEffect(() => { fetchExams(); fetchClasses(); }, []);
  useEffect(() => { if (paramExamId) setSelectedExam(paramExamId); }, [paramExamId]);
  useEffect(() => { if (selectedExam) fetchAdmitCards(); }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await axios.get(getFullUrl('/api/exam'), { headers });
      const raw = res.data?.data || res.data || [];
      setExams(Array.isArray(raw) ? raw : raw.exams || []);
    } catch { toast.error('Failed to load exams'); }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(getFullUrl('/api/class'), { headers });
      setClasses(res.data?.data || res.data || []);
    } catch {}
  };

  const fetchAdmitCards = async () => {
    setLoading(true);
    try {
      const examName = exams.find(e => e.id === selectedExam)?.name;
      const relatedIds = exams.filter(e => e.name === examName).map(e => e.id);
      const allCards: AdmitCardItem[] = [];
      await Promise.all(relatedIds.map(async examId => {
        const res = await axios.get(getFullUrl(`/api/exam/${examId}/admit-cards`), { headers });
        allCards.push(...(res.data?.data || res.data || []));
      }));
      setAdmitCards(allCards);
    } catch { toast.error('Failed to load admit cards'); }
    finally { setLoading(false); }
  };

  const handleGenerateAll = async () => {
    if (!selectedExam) return toast.error('Please select an exam');
    setGenerating(true);
    try {
      const examName = exams.find(e => e.id === selectedExam)?.name;
      const relatedIds = exams.filter(e => e.name === examName).map(e => e.id);
      await Promise.all(relatedIds.map(examId =>
        axios.post(getFullUrl('/api/exam/admit-cards/generate'), { examId }, { headers })
      ));
      toast.success('Admit cards generated!');
      fetchAdmitCards();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate admit cards');
    } finally { setGenerating(false); }
  };

  const handleDeleteAll = async () => {
    if (!selectedExam || !confirm('Delete ALL admit cards? This cannot be undone.')) return;
    try {
      const examName = exams.find(e => e.id === selectedExam)?.name;
      const relatedIds = exams.filter(e => e.name === examName).map(e => e.id);
      await Promise.all(relatedIds.map(examId =>
        axios.delete(getFullUrl(`/api/exam/${examId}/admit-cards`), { headers })
      ));
      toast.success('Deleted'); setAdmitCards([]);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const filteredCards = (() => {
    if (printMode === 'single' && selectedStudent)
      return admitCards.filter(c => c.studentId === selectedStudent || c.student?.id === selectedStudent);
    if (printMode === 'class' && selectedClass)
      return admitCards.filter(c => c.student?.className === selectedClass);
    return admitCards;
  })();

  const handleView = async (examId: string, studentId: string) => {
    setViewLoading(true);
    setViewingCard(null);
    try {
      const res = await axios.get(getFullUrl(`/api/exam/${examId}/admit-card/${studentId}`), { headers });
      setViewingCard(res.data?.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load admit card');
    } finally { setViewLoading(false); }
  };

  // ─────────────────────────────────────────────────
  // Render cards into a print window and trigger print
  // Uses the SHARED admit-card printer so the Admit Card page and the
  // "Admit Card Register" report produce byte-identical output.
  // ─────────────────────────────────────────────────
  const printCards = (allCards: AdmitCardDetail[], title: string) => {
    const layout: AdmitCardLayout = { orientation, columns, rows };
    printAdmitCards(allCards, title, (msg) => toast.error(msg), layout);
  };

  // ─────────────────────────────────────────────────
  // SINGLE CARD PRINT
  // ─────────────────────────────────────────────────
  const handleSinglePrint = () => {
    if (!viewingCard) return;
    setSinglePrinting(true);
    printCards([viewingCard], `Admit Card — ${viewingCard.student?.name || ''}`);
    setSinglePrinting(false);
  };

  // ─────────────────────────────────────────────────
  // BULK PRINT — fetches full data then prints 3 per page
  // Falls back to individual fetches if bulk API fails
  // ─────────────────────────────────────────────────
  const handleBulkPrint = async () => {
    if (filteredCards.length === 0) return toast.error('No admit cards to print');
    if (printMode === 'single' && !selectedStudent) return toast.error('Please select a student');

    setBulkPrinting(true);
    const loadingToast = toast.loading(`Loading ${filteredCards.length} admit cards…`);

    try {
      let allCards: AdmitCardDetail[] = [];

      // ── Try bulk API first ──────────────────────────────
      const examName = exams.find(e => e.id === selectedExam)?.name || '';
      const classObj = printMode === 'class' && selectedClass
        ? classes.find(c => c.name === selectedClass)
        : undefined;

      try {
        const res = await axios.get(getFullUrl('/api/exam/admit-cards/bulk'), {
          headers,
          params: {
            examName,
            ...(classObj?.id ? { classId: classObj.id } : {}),
          },
          timeout: 30000,
        });
        allCards = res.data?.data || res.data || [];

        // Filter client-side for single student mode
        if (printMode === 'single' && selectedStudent) {
          allCards = allCards.filter(c => c.admitCard?.studentId === selectedStudent);
        }

        // If class mode, filter client-side too (in case backend doesn't filter)
        if (printMode === 'class' && selectedClass && allCards.length > filteredCards.length) {
          const studentIdsInClass = filteredCards.map(c => c.studentId);
          allCards = allCards.filter(c => studentIdsInClass.includes(c.admitCard?.studentId));
        }
      } catch (bulkErr: any) {
        // ── Fallback: fetch each card individually ──────────
        console.warn('Bulk API failed, falling back to individual fetches:', bulkErr?.message);
        toast.loading(`Bulk fetch failed, loading individually…`, { id: loadingToast });

        const cardsToFetch = filteredCards.slice(0, 50); // limit to 50 for safety
        const results = await Promise.allSettled(
          cardsToFetch.map(card =>
            axios.get(getFullUrl(`/api/exam/${card.examId}/admit-card/${card.student?.id || card.studentId}`), { headers })
              .then(r => r.data?.data || r.data)
          )
        );
        allCards = results
          .filter((r): r is PromiseFulfilledResult<AdmitCardDetail> => r.status === 'fulfilled' && !!r.value)
          .map(r => r.value);
      }

      toast.dismiss(loadingToast);

      if (allCards.length === 0) {
        toast.error('No admit card data found. Please generate admit cards first.');
        return;
      }

      const pages = Math.ceil(allCards.length / Math.max(1, columns * rows));
      toast.success(`Opening print window: ${allCards.length} cards on ${pages} page${pages > 1 ? 's' : ''}…`);

      printCards(allCards, `Admit Cards — ${examName}`);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || err.message || 'Failed to load admit cards for printing');
    } finally {
      setBulkPrinting(false);
    }
  };

  // ─────────────────────────────────────────────────
  // Modal preview (JSX)
  // ─────────────────────────────────────────────────
  // Safely format a date that may arrive as an ISO string, a Date, or an
  // already-formatted "dd/mm/yyyy" string. Never shows "Invalid Date".
  const safeDate = (val?: string): string => {
    if (!val) return '';
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN');
    // Already a human string (e.g. "02/11/2026") — show as-is.
    return String(val);
  };

  const renderAdmitCardJSX = (data: AdmitCardDetail) => {
    const logoUrl = getFullUrl(data.tenant?.logoUrl);
    const photoUrl = getFullUrl(data.student?.photoUrl);
    const initials = (data.student?.name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
    return (
      <div className="border-2 border-gray-300 rounded-xl p-5 bg-white text-sm">
        {/* School Header — Logo Left, Name Center, Right spacer for symmetry */}
        <div className="flex items-center gap-3 mb-3">
          {logoUrl && <img src={logoUrl} className="w-14 h-14 object-contain" alt="logo" />}
          <div className="flex-1 text-center leading-tight">
            <div className="font-bold text-base">{data.tenant?.name}</div>
            {data.tenant?.address && <div className="text-xs text-gray-500">{data.tenant.address}</div>}
            {data.tenant?.phone && <div className="text-xs text-gray-500">Ph: {data.tenant.phone}</div>}
          </div>
          {/* Right spacer to balance the logo and truly center the text */}
          <div className="w-14 flex-shrink-0"></div>
        </div>
        {/* ADMIT CARD title — full width centered */}
        <div className="bg-blue-900 text-white text-center rounded py-2 px-4 mb-3">
          <div className="font-bold text-sm">ADMIT CARD</div>
          <div className="text-xs">{data.exam?.name}</div>
        </div>
        {/* Student Info — 3 rows with 2 columns + Photo on right */}
        <div className="flex gap-4 mb-4 items-start">
          <table className="flex-1 text-xs border-collapse">
            <tbody>
              <tr>
                <td className="text-gray-500 pr-2 py-0.5 whitespace-nowrap">Name:</td>
                <td className="font-medium py-0.5 pr-4">{data.student?.name}</td>
                <td className="text-gray-500 pr-2 py-0.5 whitespace-nowrap">Roll No:</td>
                <td className="font-medium py-0.5">{data.student?.rollNo}</td>
              </tr>
              <tr>
                <td className="text-gray-500 pr-2 py-0.5 whitespace-nowrap">Father:</td>
                <td className="font-medium py-0.5 pr-4">{data.student?.fatherName}</td>
                <td className="text-gray-500 pr-2 py-0.5 whitespace-nowrap">Adm No:</td>
                <td className="font-medium py-0.5">{data.student?.admissionNo}</td>
              </tr>
              <tr>
                <td className="text-gray-500 pr-2 py-0.5 whitespace-nowrap">Class:</td>
                <td className="font-medium py-0.5 pr-4">{`${data.student?.class?.name || ''}${data.student?.section?.name ? ' - ' + data.student.section.name : ''}`}</td>
                <td className="text-gray-500 pr-2 py-0.5 whitespace-nowrap">DOB:</td>
                <td className="font-medium py-0.5">{safeDate(data.student?.dob)}</td>
              </tr>
              {data.allottedRoom && (
                <tr>
                  <td className="text-gray-500 pr-2 py-0.5 whitespace-nowrap">Room:</td>
                  <td className="font-medium py-0.5" colSpan={3}>{data.allottedRoom}{data.seatNo ? ` (Seat: ${data.seatNo})` : ''}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="w-20 h-24 border rounded flex items-center justify-center bg-gray-50 text-lg font-semibold text-gray-400 flex-shrink-0 overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                className="w-full h-full object-cover"
                alt="photo"
                onError={(e) => {
                  // Hide the broken image and reveal the initials fallback behind it.
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent && !parent.querySelector('.photo-fallback')) {
                    const span = document.createElement('span');
                    span.className = 'photo-fallback';
                    span.textContent = initials || 'Photo';
                    parent.appendChild(span);
                  }
                }}
              />
            ) : (
              <span className="photo-fallback">{initials || 'Photo'}</span>
            )}
          </div>
        </div>
        {data.schedule?.length > 0 && (
          <table className="w-full text-xs border-collapse mb-3">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-1.5 text-left">Subject</th>
                <th className="p-1.5 text-left">Date</th>
                <th className="p-1.5 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.schedule.map((s, i) => (
                <tr key={i} className="border-b">
                  <td className="p-1.5">{s.subject?.name}</td>
                  <td className="p-1.5">{safeDate(s.examDate)}</td>
                  <td className="p-1.5">{s.startTime} – {s.endTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex justify-around text-xs text-center mt-4">
          <div><div className="border-t border-gray-400 w-24 mb-1"></div>Class Teacher</div>
          <div><div className="border-t border-gray-400 w-24 mb-1"></div>Principal</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <button onClick={() => navigate('/exams')} className="mr-4 p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admit Cards</h1>
              <p className="text-sm text-gray-500">Generate and print student admit cards</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Exam</label>
                <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="w-full text-sm border-gray-300 rounded-lg shadow-sm">
                  <option value="">-- Select Exam --</option>
                  {[...new Map(exams.map(e => [e.name, e])).values()].map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Print Mode</label>
                <div className="flex gap-1">
                  {(['school', 'class', 'single'] as PrintMode[]).map(m => (
                    <button key={m} onClick={() => setPrintMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${printMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}
                    >{m}</button>
                  ))}
                </div>
              </div>

              {printMode === 'class' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Class</label>
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="text-sm border-gray-300 rounded-lg">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {printMode === 'single' && (
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Student</label>
                  <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full text-sm border-gray-300 rounded-lg">
                    <option value="">-- Select Student --</option>
                    {admitCards.map(c => (
                      <option key={c.studentId} value={c.studentId}>{c.student?.name || c.studentId}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── Print Layout: orientation + columns × rows ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Orientation</label>
                <div className="flex gap-1">
                  {(['portrait', 'landscape'] as const).map(o => (
                    <button key={o} onClick={() => setOrientation(o)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${orientation === o ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}
                    >{o}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Layout (per page)</label>
                <div className="flex items-end gap-2">
                  <div>
                    <span className="block text-[10px] text-gray-400 mb-0.5">Columns</span>
                    <input type="number" min={1} max={6} value={columns}
                      onChange={e => setColumns(Math.min(6, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-16 text-sm border-gray-300 rounded-lg" />
                  </div>
                  <span className="pb-2 text-gray-400">×</span>
                  <div>
                    <span className="block text-[10px] text-gray-400 mb-0.5">Rows</span>
                    <input type="number" min={1} max={10} value={rows}
                      onChange={e => setRows(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-16 text-sm border-gray-300 rounded-lg" />
                  </div>
                  <span className="pb-2 text-xs text-gray-500 whitespace-nowrap">= {columns * rows} / page</span>
                </div>
                {/* Quick presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {([
                    { label: '1×3 (Portrait)', o: 'portrait', c: 1, r: 3 },
                    { label: '2×2 (Portrait)', o: 'portrait', c: 2, r: 2 },
                    { label: '2×4 = 8', o: 'portrait', c: 2, r: 4 },
                    { label: '3×4 = 12', o: 'portrait', c: 3, r: 4 },
                    { label: '2 col (Landscape)', o: 'landscape', c: 2, r: 2 },
                    { label: '3 col (Landscape)', o: 'landscape', c: 3, r: 2 },
                  ] as const).map(preset => {
                    const active = orientation === preset.o && columns === preset.c && rows === preset.r;
                    return (
                      <button key={preset.label}
                        onClick={() => { setOrientation(preset.o); setColumns(preset.c); setRows(preset.r); }}
                        className={`px-2 py-0.5 rounded-md text-[11px] border ${active ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'}`}
                      >{preset.label}</button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleGenerateAll} disabled={generating || !selectedExam}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Generate All
                </button>
                {admitCards.length > 0 && (
                  <button onClick={handleBulkPrint} disabled={bulkPrinting || (printMode === 'single' && !selectedStudent)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {bulkPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    {bulkPrinting ? 'Loading...' : `Print ${printMode === 'school' ? 'All' : printMode === 'class' ? 'Class' : 'Selected'} (${filteredCards.length})`}
                  </button>
                )}
                {admitCards.length > 0 && (
                  <button onClick={handleDeleteAll} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b">
              <h2 className="text-base font-semibold text-gray-800">
                Student Admit Cards
                {filteredCards.length !== admitCards.length && (
                  <span className="ml-2 text-xs text-gray-400">(showing {filteredCards.length} of {admitCards.length})</span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
            ) : !selectedExam ? (
              <div className="text-center py-12 text-gray-400">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <div>Select an exam to view admit cards</div>
              </div>
            ) : admitCards.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <div>No admit cards found. Click &quot;Generate All&quot; to create them.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Roll No</th>
                      <th className="px-4 py-3 text-left">Class</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCards.map((card, idx) => (
                      <tr key={card.id || card.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium">{card.student?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{card.student?.rollNo || card.rollNo}</td>
                        <td className="px-4 py-3 text-gray-600">{card.student?.className || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${card.isGenerated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {card.isGenerated ? 'Generated' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleView(card.examId, card.student?.id || card.studentId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {(viewingCard || viewLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {viewLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : viewingCard ? (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <span className="font-semibold">Admit Card Preview</span>
                  <div className="flex gap-2">
                    <button onClick={handleSinglePrint} disabled={singlePrinting}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">
                      {singlePrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                      Print
                    </button>
                    <button onClick={() => setViewingCard(null)} className="p-2 rounded-lg hover:bg-gray-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-5">{renderAdmitCardJSX(viewingCard)}</div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default AdmitCardPage;

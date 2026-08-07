import { getFullUrl } from '../../utils/url';
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
  Users,
  Filter,
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
interface AdmitCardDetail {
  admitCard: any;
  student: {
    name: string; fatherName: string; motherName: string;
    rollNo: string; admissionNo: string; dob: string;
    photoUrl?: string;
    class?: { name: string };
    section?: { name: string } | null;
  };
  exam: { name: string; type: string; class?: { name: string }; section?: { name: string } | null; };
  tenant: { name: string; address: string; phone: string; email: string; logoUrl?: string; };
  schedule: { examDate: string; startTime: string; endTime: string; subject: { name: string }; room: { name: string }; }[];
}
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

  // Filtered cards
  const filteredCards = (() => {
    if (printMode === 'single' && selectedStudent)
      return admitCards.filter(c => c.studentId === selectedStudent || c.student?.id === selectedStudent);
    if (printMode === 'class' && selectedClass)
      return admitCards.filter(c => c.student?.className === selectedClass);
    return admitCards;
  })();

  // FIX: when the same exam name spans multiple classes, admitCards can hold
  // cards from several different examId records at once. Always use the
  // specific card's own examId (not the dropdown's selectedExam) so "View"
  // hits the correct exam/student combination instead of 404-ing.
  const handleView = async (examId: string, studentId: string) => {
    setViewLoading(true);
    setViewingCard(null);
    try {
      const res = await axios.get(getFullUrl(`/api/exam/${examId}/admit-card/${studentId}`), { headers });
      setViewingCard(res.data?.data || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load admit card');
    }
    finally { setViewLoading(false); }
  };

  // ─────────────────────────────────────────────────
  // FAST BULK PRINT — uses single batch API call instead of N sequential calls
  // FIXED:
  //   1) "single" mode now filters the bulk response down to the selected
  //      student instead of printing every student's card.
  //   2) Print is triggered only after all images have finished loading
  //      (or after a safety timeout), so photos/logos are not blank.
  // ─────────────────────────────────────────────────
  const handleBulkPrint = async () => {
    if (filteredCards.length === 0) return toast.error('No admit cards to print');
    if (printMode === 'single' && !selectedStudent) return toast.error('Please select a student');

    // FIX (mobile/Safari popup blocking): open the window synchronously,
    // inside the click handler, BEFORE any await. If we open it after the
    // API call finishes, the browser no longer considers it a direct
    // result of the user's tap/click and silently blocks the popup.
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups for printing'); return; }
    printWindow.document.write('<!DOCTYPE html><html><body style="font-family:Arial;padding:40px;text-align:center;color:#555;">Preparing admit cards…</body></html>');

    setBulkPrinting(true);
    try {
      // Single bulk API call
      const examName = exams.find(e => e.id === selectedExam)?.name || '';
      const classId = printMode === 'class' && selectedClass
        ? classes.find(c => c.name === selectedClass)?.id
        : undefined;

      const res = await axios.get(
        getFullUrl('/api/exam/admit-cards/bulk'),
        {
          headers,
          params: {
            examName,
            ...(classId ? { classId } : {}),
          },
        }
      );
      let allCards: AdmitCardDetail[] = res.data?.data || res.data || [];

      // FIX: the bulk endpoint only supports filtering by exam/class on the
      // server. For "single student" mode we must filter client-side by the
      // student actually selected in the dropdown, otherwise every student
      // in the exam/class gets printed.
      if (printMode === 'single' && selectedStudent) {
        allCards = allCards.filter(
          (c) => c.admitCard?.studentId === selectedStudent
        );
      }

      if (allCards.length === 0) {
        toast.error('No admit card data found');
        printWindow.close();
        return;
      }

      let cardsHTML = '';
      for (let i = 0; i < allCards.length; i += 2) {
        const c1 = renderAdmitCardHTML(allCards[i]);
        const c2 = i + 1 < allCards.length ? renderAdmitCardHTML(allCards[i + 1]) : '';
        cardsHTML += `<div class="page">${c1}${c2}</div>`;
      }

      printWindow.document.write(`
        <!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Admit Cards — ${examName}</title>
        <style>
          @page { size: A4; margin: 8mm; }
          body { margin:0; font-family: Arial, sans-serif; }
          .page { page-break-after: always; display: flex; flex-direction: column; gap: 8px; padding: 8px; }
          .card { border: 2px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
          .school-header { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
          .school-header img { width:50px; height:50px; object-fit:contain; }
          .school-name { font-size:14px; font-weight:bold; text-align:center; flex:1; }
          .school-sub { font-size:10px; text-align:center; color:#555; }
          .title-bar { background:#1e3a8a; color:white; text-align:center; padding:4px; border-radius:4px; margin:6px 0; }
          .title-bar h2 { margin:0; font-size:13px; }
          .title-bar p { margin:0; font-size:10px; }
          .info-photo { display:flex; gap:10px; }
          .info-grid { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:2px 8px; font-size:10px; }
          .info-row { display:flex; gap:4px; }
          .label { color:#555; white-space:nowrap; }
          .value { font-weight:600; }
          .photo { width:60px; height:75px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; border-radius:4px; overflow:hidden; font-size:9px; color:#888; }
          .photo img { width:100%; height:100%; object-fit:cover; }
          table { width:100%; border-collapse:collapse; margin-top:6px; font-size:9px; }
          th { background:#1e3a8a; color:white; padding:3px 5px; text-align:left; }
          td { padding:3px 5px; border-bottom:1px solid #ddd; }
          .sigs { display:flex; justify-content:space-around; margin-top:10px; text-align:center; font-size:9px; }
          .sig-line { border-top:1px solid #333; width:100px; margin:0 auto 3px; }
        </style>
        </head><body>${cardsHTML}</body></html>
      `);
      printWindow.document.close();

      // FIX: wait for every <img> to finish loading (or error out) before
      // triggering print, with a safety timeout so it never hangs forever.
      const waitForImagesThenPrint = () => {
        const images = Array.from(printWindow.document.images);
        if (images.length === 0) {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
          return;
        }

        let remaining = images.length;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        };
        const onOneDone = () => {
          remaining -= 1;
          if (remaining <= 0) finish();
        };

        images.forEach((img) => {
          if (img.complete) {
            onOneDone();
          } else {
            img.addEventListener('load', onOneDone);
            img.addEventListener('error', onOneDone);
          }
        });

        // Safety net in case an image never fires load/error
        setTimeout(finish, 3000);
      };

      printWindow.onload = waitForImagesThenPrint;
      // In case onload already fired before we attached the handler
      setTimeout(waitForImagesThenPrint, 100);

      toast.success(`Printing ${allCards.length} admit card${allCards.length > 1 ? 's' : ''}...`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load admit cards for printing');
      printWindow.close();
    } finally {
      setBulkPrinting(false);
    }
  };

  // Render a single admit card as HTML string for print
  const renderAdmitCardHTML = (data: AdmitCardDetail): string => {
    const logoUrl = getFullUrl(data.tenant?.logoUrl);
    const photoUrl = getFullUrl(data.student?.photoUrl);
    const scheduleRows = (data.schedule || []).map(s => `
      <tr>
        <td>${s.subject?.name || ''}</td>
        <td>${s.examDate ? new Date(s.examDate).toLocaleDateString('en-IN') : ''}</td>
        <td>${s.startTime || ''} – ${s.endTime || ''}</td>
      </tr>`).join('');
    return `
      <div class="card">
        <div class="school-header">
          ${logoUrl ? `<img src="${logoUrl}" />` : ''}
          <div style="flex:1">
            <div class="school-name">${data.tenant?.name || 'School Name'}</div>
            ${data.tenant?.address ? `<div class="school-sub">${data.tenant.address}</div>` : ''}
            ${data.tenant?.phone ? `<div class="school-sub">Ph: ${data.tenant.phone}</div>` : ''}
          </div>
        </div>
        <div class="title-bar">
          <h2>ADMIT CARD</h2>
          <p>${data.exam?.name || ''}</p>
        </div>
        <div class="info-photo">
          <div class="info-grid">
            <div class="info-row"><span class="label">Name:</span><span class="value">${data.student?.name || ''}</span></div>
            <div class="info-row"><span class="label">Father:</span><span class="value">${data.student?.fatherName || ''}</span></div>
            <div class="info-row"><span class="label">Class:</span><span class="value">${data.student?.class?.name || data.exam?.class?.name || ''}${data.student?.section?.name ? ' - ' + data.student.section.name : ''}</span></div>
            <div class="info-row"><span class="label">Roll No:</span><span class="value">${data.student?.rollNo || ''}</span></div>
            <div class="info-row"><span class="label">Mother:</span><span class="value">${data.student?.motherName || ''}</span></div>
            <div class="info-row"><span class="label">Adm No:</span><span class="value">${data.student?.admissionNo || ''}</span></div>
            <div class="info-row"><span class="label">DOB:</span><span class="value">${data.student?.dob ? new Date(data.student.dob).toLocaleDateString('en-IN') : ''}</span></div>
          </div>
          <div class="photo">
            ${photoUrl ? `<img src="${photoUrl}" />` : 'Photo'}
          </div>
        </div>
        ${scheduleRows ? `
          <table>
            <thead><tr><th>Subject</th><th>Date</th><th>Time</th></tr></thead>
            <tbody>${scheduleRows}</tbody>
          </table>` : ''}
        <div class="sigs">
          <div><div class="sig-line"></div>Class Teacher</div>
          <div><div class="sig-line"></div>Principal</div>
        </div>
      </div>`;
  };

  // Render admit card in modal (JSX)
  const renderAdmitCardJSX = (data: AdmitCardDetail) => {
    const logoUrl = getFullUrl(data.tenant?.logoUrl);
    const photoUrl = getFullUrl(data.student?.photoUrl);
    return (
      <div className="border-2 border-gray-300 rounded-xl p-5 bg-white text-sm">
        {/* School Header */}
        <div className="flex items-start gap-3 mb-3">
          {logoUrl && <img src={logoUrl} className="w-14 h-14 object-contain" alt="logo" />}
          <div className="flex-1 text-center">
            <div className="font-bold text-base">{data.tenant?.name}</div>
            {data.tenant?.address && <div className="text-xs text-gray-500">{data.tenant.address}</div>}
            {data.tenant?.phone && <div className="text-xs text-gray-500">Ph: {data.tenant.phone}</div>}
          </div>
        </div>
        <div className="bg-blue-900 text-white text-center rounded p-1 mb-3">
          <div className="font-bold text-sm">ADMIT CARD</div>
          <div className="text-xs">{data.exam?.name}</div>
        </div>
        <div className="flex gap-3 mb-3">
          <table className="flex-1 text-xs">
            <tbody>
              {[['Name', data.student?.name], ['Father', data.student?.fatherName], ['Class', `${data.student?.class?.name || ''}${data.student?.section?.name ? ' - ' + data.student.section.name : ''}`], ['Roll No', data.student?.rollNo], ['Adm No', data.student?.admissionNo], ['DOB', data.student?.dob ? new Date(data.student.dob).toLocaleDateString('en-IN') : '']]
                .map(([l, v]) => (
                  <tr key={l as string}><td className="text-gray-500 pr-2 whitespace-nowrap">{l}:</td><td className="font-medium">{v}</td></tr>
                ))}
            </tbody>
          </table>
          <div className="w-16 h-20 border rounded flex items-center justify-center bg-gray-50 text-xs text-gray-400">
            {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" alt="photo" /> : 'Photo'}
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
                  <td className="p-1.5">{s.examDate ? new Date(s.examDate).toLocaleDateString('en-IN') : ''}</td>
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
          {/* Header */}
          <div className="flex items-center mb-6">
            <button onClick={() => navigate('/exams')} className="mr-4 p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admit Cards</h1>
              <p className="text-sm text-gray-500">Generate and print student admit cards</p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex flex-wrap items-end gap-4">
              {/* Exam selector */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Exam</label>
                <select
                  value={selectedExam}
                  onChange={e => setSelectedExam(e.target.value)}
                  className="w-full text-sm border-gray-300 rounded-lg shadow-sm"
                >
                  <option value="">-- Select Exam --</option>
                  {[...new Map(exams.map(e => [e.name, e])).values()].map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
              </div>

              {/* Print mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Print Mode</label>
                <div className="flex gap-1">
                  {(['school', 'class', 'single'] as PrintMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setPrintMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${
                        printMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'
                      }`}
                    >{m}</button>
                  ))}
                </div>
              </div>

              {/* Class filter (class mode) */}
              {printMode === 'class' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Class</label>
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="text-sm border-gray-300 rounded-lg"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Student filter (single mode) */}
              {printMode === 'single' && (
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Student</label>
                  <select
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-lg"
                  >
                    <option value="">-- Select Student --</option>
                    {admitCards.map(c => (
                      <option key={c.studentId} value={c.studentId}>
                        {c.student?.name || c.studentId}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateAll}
                  disabled={generating || !selectedExam}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Generate All
                </button>
                {admitCards.length > 0 && (
                  <button
                    onClick={handleBulkPrint}
                    disabled={bulkPrinting || (printMode === 'single' && !selectedStudent)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {bulkPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    {bulkPrinting ? 'Loading...' : `Print ${printMode === 'school' ? 'All' : printMode === 'class' ? 'Class' : 'Selected'} (${filteredCards.length})`}
                  </button>
                )}
                {admitCards.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Admit Cards Table */}
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
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            card.isGenerated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {card.isGenerated ? 'Generated' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleView(card.examId, card.student?.id || card.studentId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100"
                          >
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

      {/* Single Admit Card Modal */}
      {(viewingCard || viewLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {viewLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : viewingCard ? (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b print:hidden">
                  <span className="font-semibold">Admit Card Preview</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm"
                    >
                      <Printer className="w-4 h-4" /> Print
                    </button>
                    <button
                      onClick={() => setViewingCard(null)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
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

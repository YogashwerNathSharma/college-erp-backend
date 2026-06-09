
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiPrinter,
  FiEdit2,
  FiTrash2,
  FiZap,
  FiGrid,
  FiRefreshCw,
  FiLayers,
} from "react-icons/fi";
import TimetableForm from "./TimetableForm";
import TimetablePrint from "./TimetablePrint";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const DAY_LABELS: Record<string, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat",
};
const DAY_LABELS_FULL: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday",
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface TimetableEntry {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  day: string;
  period: number;
  subject: { id: string; name: string };
  teacher: { id: string; name: string };
}

interface ClassItem { id: string; name: string; }
interface SectionItem { id: string; name: string; classId?: string; }

const TimetablePage = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null);
  const [prefillDay, setPrefillDay] = useState("");
  const [prefillPeriod, setPrefillPeriod] = useState(0);
  const [showPrint, setShowPrint] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Bulk Generate
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSelectedClasses, setBulkSelectedClasses] = useState<string[]>([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Fetch classes
  useEffect(() => {
    axios.get("/api/class").then((res) => {
      const data = res.data?.data || res.data?.classes || res.data;
      setClasses(Array.isArray(data) ? data : []);
    }).catch(() => toast.error("Failed to load classes"));
  }, []);

  // Fetch sections
  useEffect(() => {
    if (!selectedClass) { setSections([]); setSelectedSection(""); return; }
    axios.get("/api/section", { params: { classId: selectedClass } }).then((res) => {
      const data = res.data?.data || res.data?.sections || res.data;
      setSections(Array.isArray(data) ? data : []);
    }).catch(() => toast.error("Failed to load sections"));
    setSelectedSection("");
  }, [selectedClass]);

  // Fetch timetable
  useEffect(() => {
    if (!selectedClass || !selectedSection) { setTimetable([]); return; }
    fetchTimetable();
  }, [selectedClass, selectedSection]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/timetable", {
        params: { classId: selectedClass, sectionId: selectedSection },
      });
      setTimetable(res.data);
    } catch { toast.error("Failed to load timetable"); }
    finally { setLoading(false); }
  };

  const getEntry = (day: string, period: number) =>
    timetable.find((e) => e.day === day && e.period === period);

  const handleCellClick = (day: string, period: number) => {
    const entry = getEntry(day, period);
    if (entry) { setEditEntry(entry); }
    else { setEditEntry(null); setPrefillDay(day); setPrefillPeriod(period); }
    setShowForm(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this entry?")) return;
    try {
      await axios.delete(`/api/timetable/${id}`);
      toast.success("Deleted"); fetchTimetable();
    } catch { toast.error("Failed to delete"); }
  };

  const handleFormSuccess = () => { setShowForm(false); setEditEntry(null); fetchTimetable(); };

  // ⚡ AUTO GENERATE
  const handleAutoGenerate = async () => {
    if (!selectedClass || !selectedSection) { toast.error("Select class and section"); return; }

    if (timetable.length > 0) {
      if (!confirm("Existing timetable will be cleared. Continue?")) return;
      try { setClearing(true); await axios.post("/api/timetable/clear", { classId: selectedClass, sectionId: selectedSection }); }
      catch (err: any) { toast.error(err?.response?.data?.message || "Failed to clear"); setClearing(false); return; }
      setClearing(false);
    }

    setGenerating(true);
    try {
      const res = await axios.post("/api/timetable/auto-generate", { classId: selectedClass, sectionId: selectedSection });
      toast.success(`✅ ${res.data.filledSlots}/${res.data.totalSlots} slots filled!`);
      if (res.data.emptySlots > 0) toast(`⚠️ ${res.data.emptySlots} empty (teacher conflicts)`, { icon: "ℹ️", duration: 5000 });
      fetchTimetable();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to generate"); }
    finally { setGenerating(false); }
  };

  // 🆕 BULK GENERATE
  const handleBulkGenerate = async () => {
    if (bulkSelectedClasses.length === 0) { toast.error("Select at least one class"); return; }
    setBulkGenerating(true);
    try {
      const res = await axios.post("/api/timetable/bulk-generate", { classIds: bulkSelectedClasses });
      const { summary } = res.data;
      toast.success(`✅ ${summary.success} done, ${summary.skipped} skipped, ${summary.errors} errors`);
      if (selectedClass && selectedSection) fetchTimetable();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Bulk generate failed"); }
    finally { setBulkGenerating(false); }
  };

  const toggleBulkClass = (id: string) => {
    setBulkSelectedClasses((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // 🖨️ BULK PRINT — all selected classes in one PDF (page-break per class)
  const handleBulkPrint = async () => {
    if (bulkSelectedClasses.length === 0) {
      toast.error("Select at least one class to print");
      return;
    }

    toast("Fetching timetables for printing...", { icon: "🖨️" });

    try {
      // Fetch sections for selected classes
      const sectionsRes = await axios.get("/api/section", { params: { classIds: bulkSelectedClasses.join(",") } });
      let allSections = sectionsRes.data?.data || sectionsRes.data || [];
      if (!Array.isArray(allSections)) allSections = [];

      // If section API doesn't support classIds param, fetch individually
      if (allSections.length === 0) {
        const sectionPromises = bulkSelectedClasses.map((cid) =>
          axios.get("/api/section", { params: { classId: cid } }).then((r) => r.data?.data || r.data || [])
        );
        const results = await Promise.all(sectionPromises);
        allSections = results.flat();
      }

      // Fetch timetable for each section
      const timetablePromises = allSections.map((sec: any) =>
        axios.get("/api/timetable", { params: { classId: sec.classId || sec.class?.id, sectionId: sec.id } })
          .then((r) => ({
            className: classes.find((c) => c.id === (sec.classId || sec.class?.id))?.name || "Class",
            sectionName: sec.name,
            entries: r.data || [],
          }))
          .catch(() => ({ className: "Class", sectionName: sec.name, entries: [] }))
      );

      const allTimetables = await Promise.all(timetablePromises);
      const nonEmpty = allTimetables.filter((t) => t.entries.length > 0);

      if (nonEmpty.length === 0) {
        toast.error("No timetable data found for selected classes");
        return;
      }

      // Get tenant info
      let tenant: any = {};
      try { tenant = JSON.parse(localStorage.getItem("tenant") || "{}"); } catch {}
      const schoolName = tenant?.schoolName || tenant?.name || "School";
      const schoolLogo = tenant?.logoUrl || "";
      const schoolAddress = tenant?.address || "";
      const schoolPhone = tenant?.phone || "";
      const schoolEmail = tenant?.email || "";

      const logoHTML = schoolLogo ? '<img src="' + schoolLogo + '" style="width:60px;height:60px;object-fit:contain;" />' : "";
      let contactLine = "";
      if (schoolPhone || schoolEmail) {
        contactLine = '<p style="font-size:10px;color:#777;">' + (schoolPhone ? "Ph: " + schoolPhone : "") + (schoolPhone && schoolEmail ? " | " : "") + (schoolEmail ? "Email: " + schoolEmail : "") + "</p>";
      }

      // Build ALL classes on ONE page (no page breaks)
      let tablesHTML = "";
      nonEmpty.forEach((tt, idx) => {
        let tableRows = "";
        DAYS.forEach((day) => {
          let cells = '<td style="border:1px solid #333;padding:3px 5px;font-weight:bold;background:#f8f8f8;font-size:9px;">' + DAY_LABELS_FULL[day] + '</td>';
          PERIODS.forEach((period) => {
            const entry = tt.entries.find((e: any) => e.day === day && e.period === period);
            cells += entry
              ? '<td style="border:1px solid #333;padding:2px 3px;text-align:center;"><div style="font-weight:bold;font-size:9px;">' + entry.subject.name + '</div><div style="font-size:7px;color:#555;">' + entry.teacher.name + '</div></td>'
              : '<td style="border:1px solid #333;padding:2px;text-align:center;color:#ccc;font-size:9px;">—</td>';
          });
          tableRows += "<tr>" + cells + "</tr>";
        });

        tablesHTML += '<div style="margin-top:' + (idx > 0 ? '15px' : '0') + ';">' +
          '<h3 style="font-size:11px;font-weight:bold;margin:0 0 4px 0;padding:3px 8px;background:#eef;border-left:3px solid #333;">Class: ' + tt.className + ' | Section: ' + tt.sectionName + '</h3>' +
          '<table style="width:100%;border-collapse:collapse;"><thead><tr><th style="border:1px solid #333;padding:3px;background:#f0f0f0;font-size:9px;">Day</th>' +
          PERIODS.map((p) => '<th style="border:1px solid #333;padding:3px;background:#f0f0f0;font-size:9px;">P' + p + '</th>').join("") +
          '</tr></thead><tbody>' + tableRows + '</tbody></table>' +
          '</div>';
      });

      // Single header + all tables + single footer
      const headerHTML = '<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:12px;">' +
        '<div>' + logoHTML + '</div>' +
        '<div style="text-align:center;flex:1;"><h1 style="font-size:18px;margin:0;font-weight:bold;text-transform:uppercase;">' + schoolName + '</h1>' +
        (schoolAddress ? '<p style="font-size:9px;color:#555;">' + schoolAddress + '</p>' : '') + contactLine +
        '<p style="font-size:11px;font-weight:bold;margin-top:4px;">Weekly Timetable</p></div>' +
        '<div style="font-size:9px;color:#555;text-align:right;">Date: ' + new Date().toLocaleDateString("en-IN") + '</div></div>';

      const footerHTML = '<div style="margin-top:20px;display:flex;justify-content:space-between;"><div style="border-top:1px solid #333;padding-top:4px;min-width:130px;text-align:center;font-size:10px;">Class Teacher</div><div style="border-top:1px solid #333;padding-top:4px;min-width:130px;text-align:center;font-size:10px;">Principal</div></div>';

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write('<!DOCTYPE html><html><head><title>Timetable - All Classes</title><style>@media print { @page { margin: 8mm; size: landscape; } }</style></head><body style="font-family:Arial,sans-serif;padding:12px;">' + headerHTML + tablesHTML + footerHTML + '<script>window.print();<\/script></body></html>');
      printWindow.document.close();

    } catch (err: any) {
      toast.error("Failed to fetch timetables for printing");
    }
  };

  // CLEAR ALL
  const handleClearAll = async () => {
    if (!selectedClass || !selectedSection) return;
    if (!confirm("Delete ALL entries for this class/section?")) return;
    setClearing(true);
    try {
      await axios.post("/api/timetable/clear", { classId: selectedClass, sectionId: selectedSection });
      toast.success("Cleared"); fetchTimetable();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setClearing(false); }
  };

  const selectedClassName = classes.find((c) => c.id === selectedClass)?.name || "";
  const selectedSectionName = sections.find((s) => s.id === selectedSection)?.name || "";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            <FiLayers /> Bulk Generate
          </button>
          {selectedClass && selectedSection && timetable.length > 0 && (
            <button onClick={() => setShowPrint(true)} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
              <FiPrinter /> Print
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" disabled={!selectedClass}>
              <option value="">Select Section</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedClass && selectedSection && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleAutoGenerate} disabled={generating || clearing}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 shadow-sm">
              <FiZap /> {generating ? "Generating..." : "⚡ Auto Generate"}
            </button>
            <button onClick={() => { setEditEntry(null); setPrefillDay(""); setPrefillPeriod(0); setShowForm(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm">
              <FiGrid /> Custom Add
            </button>
            {timetable.length > 0 && (
              <button onClick={handleClearAll} disabled={clearing}
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-100 ml-auto">
                <FiRefreshCw /> {clearing ? "Clearing..." : "Clear All"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {selectedClass && selectedSection ? (
        loading || generating ? (
          <div className="flex flex-col items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            {generating && <p className="mt-3 text-sm text-gray-500">Generating...</p>}
          </div>
        ) : timetable.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-200 px-3 py-3 text-left text-sm font-semibold text-gray-700 w-20">Day</th>
                    {PERIODS.map((p) => (
                      <th key={p} className="border border-gray-200 px-2 py-3 text-center text-sm font-semibold text-gray-700">Period {p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700 text-sm bg-gray-50">{DAY_LABELS[day]}</td>
                      {PERIODS.map((period) => {
                        const entry = getEntry(day, period);
                        return (
                          <td key={`${day}-${period}`} onClick={() => handleCellClick(day, period)}
                            className={`border border-gray-200 px-2 py-2 text-center cursor-pointer transition group relative min-w-[100px] ${entry ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-green-50"}`}>
                            {entry ? (
                              <div className="relative">
                                <div className="text-xs font-semibold text-blue-800 truncate">{entry.subject.name}</div>
                                <div className="text-[11px] text-gray-500 truncate">{entry.teacher.name}</div>
                                <div className="absolute top-0 right-0 hidden group-hover:flex gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); setEditEntry(entry); setShowForm(true); }}
                                    className="p-0.5 bg-white rounded shadow text-blue-600"><FiEdit2 size={12} /></button>
                                  <button onClick={(e) => handleDelete(entry.id, e)}
                                    className="p-0.5 bg-white rounded shadow text-red-600"><FiTrash2 size={12} /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-300 group-hover:text-green-500 flex items-center justify-center"><FiPlus size={16} /></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 border rounded"></span>Assigned</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white border rounded"></span>Empty</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
            <FiGrid size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600 mb-2">No timetable entries yet</p>
            <p className="text-sm">Use "Auto Generate" or "Custom Add"</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          <p className="text-lg">Select Class & Section to view timetable</p>
        </div>
      )}

      {/* BULK GENERATE MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Bulk Generate Timetable</h2>
              <button onClick={() => setShowBulkModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Select classes to generate timetable. Teacher conflicts are handled automatically.
              </p>

              {/* Select All / Clear */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Select Classes:</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBulkSelectedClasses(classes.map((c) => c.id))}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Select All</button>
                  <span className="text-gray-300">|</span>
                  <button type="button" onClick={() => setBulkSelectedClasses([])}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium">Clear</button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {classes.map((c) => (
                  <label key={c.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
                      bulkSelectedClasses.includes(c.id) ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"
                    }`}>
                    <input type="checkbox" checked={bulkSelectedClasses.includes(c.id)} onChange={() => toggleBulkClass(c.id)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">{c.name}</span>
                  </label>
                ))}
              </div>

              {bulkSelectedClasses.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-800">
                  <strong>{bulkSelectedClasses.length} classes selected</strong>
                  <br /><span className="text-xs text-indigo-600">✅ One teacher = one class at a time</span>
                </div>
              )}

              <div className="flex gap-3 pt-2 flex-wrap">
                <button onClick={() => setShowBulkModal(false)}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleBulkGenerate} disabled={bulkGenerating || bulkSelectedClasses.length === 0}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <FiZap />
                  {bulkGenerating ? "Generating..." : "🚀 Generate All"}
                </button>
                <button onClick={handleBulkPrint} disabled={bulkSelectedClasses.length === 0}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <FiPrinter />
                  🖨️ Print All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TimetableForm classId={selectedClass} sectionId={selectedSection} editEntry={editEntry}
          prefillDay={prefillDay} prefillPeriod={prefillPeriod}
          onClose={() => { setShowForm(false); setEditEntry(null); }} onSuccess={handleFormSuccess} />
      )}

      {/* Print */}
      {showPrint && (
        <TimetablePrint timetable={timetable} className={selectedClassName}
          sectionName={selectedSectionName} onClose={() => setShowPrint(false)} />
      )}
    </div>
  );
};

export default TimetablePage;


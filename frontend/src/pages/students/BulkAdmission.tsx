import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/enterprise";
import { getFullUrl } from "../../utils/url";

type Option = { id: string; name: string; isActive?: boolean };
type ImportResult = { totalRows: number; successCount: number; failedCount: number; errors: { row: number; field?: string; message: string }[]; importedStudentIds?: string[] };
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export default function BulkAdmission() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(getFullUrl("/api/academic"), auth());
        const data = res.data?.data || [];
        const mapped = data.map((x: any) => ({ id: x.id, name: x.name || x.year || x.title || x.id }));
        setYears(mapped);
        const active = data.find((x: any) => x.isActive);
        if (active) setAcademicYearId(active.id);
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Could not load academic years");
      } finally { setLoadingOptions(false); }
    })();
  }, []);

  const parsePreview = async (selected: File) => {
    const buffer = await selected.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const preferred = workbook.Sheets["Student_List"] || workbook.Sheets[workbook.SheetNames[0]];
    if (!preferred) throw new Error("No worksheet found");
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(preferred, { defval: "" });
    if (!rows.length) throw new Error("The Excel file has no data rows");
    setHeaders(Object.keys(rows[0]));
    setPreview(rows.slice(0, 5));
  };

  const handleFile = async (selected: File) => {
    if (!/\.(xlsx|xls|csv)$/i.test(selected.name)) return toast.error("Please select .xlsx, .xls or .csv");
    if (selected.size > 10 * 1024 * 1024) return toast.error("Maximum file size is 10 MB");
    try { await parsePreview(selected); setFile(selected); setResult(null); toast.success("Real Excel file loaded. Preview is ready."); }
    catch (e: any) { setFile(null); toast.error(e.message || "Could not read the Excel file"); }
  };

  const downloadTemplate = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/students/operations/excel/template"), { ...auth(), responseType: "blob" });
      const url = URL.createObjectURL(res.data); const a = document.createElement("a"); a.href = url; a.download = "student-import-template.xlsx"; a.click(); URL.revokeObjectURL(url);
    } catch (e: any) { toast.error(e.response?.data?.message || "Template download failed"); }
  };

  const startImport = async () => {
    if (!file) return toast.error("Select your real Excel file first");
    if (!academicYearId) return toast.error("Select the academic year before importing");
    setImporting(true); setResult(null);
    try {
      const form = new FormData(); form.append("file", file); form.append("academicYearId", academicYearId);
      const res = await axios.post(getFullUrl("/api/import-export/real-student-import"), form, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = res.data?.data as ImportResult; setResult(data);
      if (data.failedCount === 0) toast.success(`${data.successCount} students imported/updated successfully`);
      else toast.error(`${data.successCount} imported/updated, ${data.failedCount} failed. Review errors below.`);
    } catch (e: any) { toast.error(e.response?.data?.message || "Real student import failed"); }
    finally { setImporting(false); }
  };

  const reset = () => { setFile(null); setPreview([]); setHeaders([]); setResult(null); if (inputRef.current) inputRef.current.value = ""; };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Real Student Excel Import" subtitle="Import your RMS student list; Class/Section are read automatically from the Excel Class column" icon={<Upload className="w-5 h-5" />} breadcrumbs={[{ label: "Students", path: "/students" }, { label: "Bulk Admission" }]} actions={<button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700"><Download className="w-4 h-4" />Download ERP Template</button>} />
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900"><b>Safe import:</b> existing students are matched by Admission Number when present; matching records are updated and their current academic-year enrollment is moved to the Excel Class/Section. Demo data is not deleted automatically.</div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        <label className="text-sm font-medium block">Academic Year<select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} disabled={loadingOptions} className="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"><option value="">Select academic year</option>{years.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <div className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400" onClick={() => inputRef.current?.click()}><FileSpreadsheet className="w-12 h-12 mx-auto text-indigo-600 mb-3" /><p className="font-semibold">{file ? file.name : "Choose your real RMS Excel file"}</p><p className="text-sm text-slate-500 mt-1">Supports Student_List.xlsx, .xlsx, .xls or .csv — maximum 10 MB</p><input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} /></div>
        {headers.length > 0 && <div><div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><h3 className="font-semibold">Preview — first 5 rows</h3></div><div className="overflow-x-auto border rounded-xl"><table className="min-w-full text-sm"><thead><tr className="bg-slate-50 dark:bg-slate-800">{headers.slice(0, 10).map(h => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{preview.map((row,i)=><tr key={i} className="border-t">{headers.slice(0,10).map(h=><td key={h} className="px-3 py-2 whitespace-nowrap">{String(row[h] ?? "")}</td>)}</tr>)}</tbody></table></div>{headers.length>10 && <p className="text-xs text-slate-500 mt-2">Showing first 10 columns; all columns are processed by the real-data importer.</p>}</div>}
        <div className="flex gap-3"><button onClick={startImport} disabled={!file || !academicYearId || importing} className="flex-1 flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50">{importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing real data…</> : <><Upload className="w-4 h-4" />Import Real Students</>}</button><button onClick={reset} className="px-5 py-3 rounded-xl border">Reset</button></div>
      </div>
      {result && <div className="bg-white dark:bg-slate-900 rounded-2xl border p-6 space-y-4"><h3 className="text-lg font-semibold">Import Result</h3><div className="grid grid-cols-3 gap-4"><div className="p-4 rounded-xl bg-slate-50"><b>{result.totalRows}</b><div className="text-xs">Total rows</div></div><div className="p-4 rounded-xl bg-emerald-50"><b className="text-emerald-700">{result.successCount}</b><div className="text-xs">Imported / Updated</div></div><div className="p-4 rounded-xl bg-red-50"><b className="text-red-700">{result.failedCount}</b><div className="text-xs">Failed</div></div></div>{result.errors?.length>0&&<div className="max-h-80 overflow-y-auto space-y-2"><div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200"><AlertTriangle className="w-4 h-4 text-amber-500" />Rows requiring correction</div>{result.errors.map((e,i)=><div key={i} className="flex gap-2 p-2 rounded-lg bg-red-50 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><span>Row {e.row}: <b>{e.field || "general"}</b> — {e.message}</span></div>)}</div>}</div>}
    </div>
  );
}

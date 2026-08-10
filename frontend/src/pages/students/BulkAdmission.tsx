import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/enterprise";
import { getFullUrl } from "../../utils/url";

type Option = { id: string; name: string; isActive?: boolean };
type ImportResult = {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: { row: number; field: string; message: string }[];
  createdStudents?: string[];
};

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

export default function BulkAdmission() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(getFullUrl("/api/academic"), auth());
        const data = res.data?.data || [];
        setYears(data.map((x: any) => ({ id: x.id, name: x.name || x.year || x.title || x.id })));
        const active = data.find((x: any) => x.isActive);
        if (active) setAcademicYearId(active.id);
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Could not load academic years");
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!academicYearId) return;
    setClassId("");
    setSectionId("");
    setSections([]);
    axios.get(getFullUrl(`/api/class?academicYearId=${encodeURIComponent(academicYearId)}`), auth())
      .then((res) => setClasses((res.data?.data || []).map((x: any) => ({ id: x.id, name: x.name, isActive: x.isActive }))))
      .catch((e) => toast.error(e.response?.data?.message || "Could not load classes"));
  }, [academicYearId]);

  useEffect(() => {
    if (!academicYearId || !classId) return;
    setSectionId("");
    axios.get(getFullUrl(`/api/section?academicYearId=${encodeURIComponent(academicYearId)}&classId=${encodeURIComponent(classId)}`), auth())
      .then((res) => setSections((res.data?.data || []).map((x: any) => ({ id: x.id, name: x.name, isActive: x.isActive }))))
      .catch((e) => toast.error(e.response?.data?.message || "Could not load sections"));
  }, [academicYearId, classId]);

  const parsePreview = async (selected: File) => {
    const buffer = await selected.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("No worksheet found");
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (!rows.length) throw new Error("The Excel file has no data rows");
    const cols = Object.keys(rows[0]);
    setHeaders(cols);
    setPreview(rows.slice(0, 5));
  };

  const handleFile = async (selected: File) => {
    const allowed = /\.(xlsx|xls|csv)$/i.test(selected.name);
    if (!allowed) return toast.error("Please select .xlsx, .xls or .csv");
    if (selected.size > 10 * 1024 * 1024) return toast.error("Maximum file size is 10 MB");
    try {
      await parsePreview(selected);
      setFile(selected);
      setResult(null);
      toast.success("Excel file loaded. Preview is ready.");
    } catch (e: any) {
      setFile(null);
      toast.error(e.message || "Could not read the Excel file");
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/students/operations/excel/template"), {
        ...auth(), responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Template download failed");
    }
  };

  const startImport = async () => {
    if (!file) return toast.error("Select an Excel file first");
    if (!academicYearId || !classId || !sectionId) {
      return toast.error("Select academic year, class and section before importing");
    }

    setImporting(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("academicYearId", academicYearId);
      form.append("classId", classId);
      form.append("sectionId", sectionId);

      const res = await axios.post(getFullUrl("/api/students/operations/excel/import"), form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = res.data?.data as ImportResult;
      setResult(data);
      if (data.failedCount === 0) toast.success(`${data.successCount} students imported successfully`);
      else toast.error(`${data.successCount} imported, ${data.failedCount} failed. Review errors below.`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Student import failed");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null); setPreview([]); setHeaders([]); setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Bulk Student Import"
        subtitle="Import real student data directly from Excel into the selected class and section"
        icon={<Upload className="w-5 h-5" />}
        breadcrumbs={[{ label: "Students", path: "/students" }, { label: "Bulk Admission" }]}
        actions={<button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700"><Download className="w-4 h-4" />Download Excel Template</button>}
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm font-medium">Academic Year
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} disabled={loadingOptions} className="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800">
              <option value="">Select academic year</option>
              {years.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Class
            <select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!academicYearId} className="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800">
              <option value="">Select class</option>
              {classes.filter((x) => x.isActive !== false).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Section
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId} className="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800">
              <option value="">Select section</option>
              {sections.filter((x) => x.isActive !== false).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
        </div>

        <div className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400" onClick={() => inputRef.current?.click()}>
          <FileSpreadsheet className="w-12 h-12 mx-auto text-indigo-600 mb-3" />
          <p className="font-semibold">{file ? file.name : "Choose your real Excel file"}</p>
          <p className="text-sm text-slate-500 mt-1">.xlsx, .xls or .csv — maximum 10 MB</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {headers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><h3 className="font-semibold">Preview — first 5 rows</h3></div>
            <div className="overflow-x-auto border rounded-xl">
              <table className="min-w-full text-sm"><thead><tr className="bg-slate-50 dark:bg-slate-800">{headers.slice(0, 10).map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>{preview.map((row, i) => <tr key={i} className="border-t">{headers.slice(0, 10).map((h) => <td key={h} className="px-3 py-2 whitespace-nowrap">{String(row[h] ?? "")}</td>)}</tr>)}</tbody>
              </table>
            </div>
            {headers.length > 10 && <p className="text-xs text-slate-500 mt-2">Showing first 10 columns in preview; all columns are sent to the Excel import engine.</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={startImport} disabled={!file || !academicYearId || !classId || !sectionId || importing} className="flex-1 flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50">
            {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing real data…</> : <><Upload className="w-4 h-4" />Import Students</>}
          </button>
          <button onClick={reset} className="px-5 py-3 rounded-xl border">Reset</button>
        </div>
      </div>

      {result && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-6 space-y-4">
          <h3 className="text-lg font-semibold">Import Result</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50"><b>{result.totalRows}</b><div className="text-xs">Total rows</div></div>
            <div className="p-4 rounded-xl bg-emerald-50"><b className="text-emerald-700">{result.successCount}</b><div className="text-xs">Imported</div></div>
            <div className="p-4 rounded-xl bg-red-50"><b className="text-red-700">{result.failedCount}</b><div className="text-xs">Failed</div></div>
          </div>
          {result.errors?.length > 0 && <div className="max-h-80 overflow-y-auto space-y-2"><div className="flex items-center gap-2 font-medium"><AlertTriangle className="w-4 h-4 text-amber-500" />Rows requiring correction</div>{result.errors.map((e, i) => <div key={i} className="flex gap-2 p-2 rounded-lg bg-red-50 text-sm"><XCircle className="w-4 h-4 text-red-500 shrink-0" />Row {e.row}: {e.field} — {e.message}</div>)}</div>}
        </div>
      )}
    </div>
  );
}

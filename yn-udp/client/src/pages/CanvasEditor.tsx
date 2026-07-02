import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft, Save, Loader2, Type, Square, Circle as CircleIcon, Minus, Trash2, Tag,
  Copy, Clipboard, CopyPlus, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Triangle, Image as ImageIcon, Droplets, Frame, SeparatorHorizontal,
  ArrowUpToLine, ArrowDownToLine,
  Grid3X3, Magnet, ZoomIn, ZoomOut, Undo2, Redo2, Sparkles, X,
  Diamond, Heart, Star, Pentagon, Hexagon, ArrowRight,
  Eye, Printer,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface CanvasElement {
  id: string;
  type: "text" | "rect" | "circle" | "line" | "triangle" | "image" | "field" | "star" | "diamond" | "pentagon" | "hexagon" | "arrow" | "heart";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right";
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  imageSrc?: string;
}

type RibbonTab = "home" | "insert" | "design" | "format" | "page" | "ai";

const FONTS = [
  "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana",
  "Poppins", "Roboto", "Inter", "Montserrat", "Open Sans",
  "Lato", "Raleway", "Oswald", "Playfair Display", "Merriweather",
  "Nunito", "Ubuntu", "Roboto Mono", "Source Code Pro", "Dancing Script",
  "Pacifico", "Lobster", "Bebas Neue", "Comic Sans MS", "Impact",
  "Tahoma", "Trebuchet MS", "Lucida Console", "Garamond", "Palatino",
];
const FONT_SIZES = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 42, 48, 54, 56, 60, 64, 72, 80, 96, 120];

// 48 standard colors organized by hue
const STANDARD_COLORS = [
  // Row 1 - Darks
  "#000000","#1a1a1a","#333333","#4d4d4d","#666666","#808080","#999999","#b3b3b3","#cccccc","#e6e6e6","#f2f2f2","#ffffff",
  // Row 2 - Reds
  "#4a0000","#800000","#cc0000","#ff0000","#ff4444","#ff7777","#001a4d","#003399","#0055ff","#4488ff","#77aaff","#aaccff",
  // Row 3 - Greens/Yellows
  "#004d00","#008000","#00cc00","#33ff33","#77ff77","#aaffaa","#4d4d00","#808000","#cccc00","#ffff00","#ffff55","#ffffaa",
  // Row 4 - Purples/Pinks
  "#2d004d","#5500aa","#7700ff","#9944ff","#bb77ff","#ddaaff","#4d0026","#990052","#ff0080","#ff44aa","#ff77cc","#ffaaee",
];

const GRADIENT_PRESETS = [
  { name: "Blue Sky", from: "#667eea", to: "#764ba2" },
  { name: "Sunset", from: "#f093fb", to: "#f5576c" },
  { name: "Ocean", from: "#4facfe", to: "#00f2fe" },
  { name: "Forest", from: "#38ef7d", to: "#11998e" },
  { name: "Gold", from: "#f7971e", to: "#ffd200" },
  { name: "Midnight", from: "#2c3e50", to: "#4ca1af" },
];

const PAGE_PRESETS = [
  { name: "A4 Portrait", w: 794, h: 1123 },
  { name: "A4 Landscape", w: 1123, h: 794 },
  { name: "ID Card (CR80)", w: 382, h: 243 },
  { name: "ID Card Vertical", w: 243, h: 382 },
  { name: "Certificate", w: 794, h: 1123 },
  { name: "Receipt", w: 794, h: 600 },
  { name: "Letter", w: 816, h: 1056 },
  { name: "Custom", w: 0, h: 0 },
];

const THEMES = [
  { name: "Professional Blue", bg: "#f0f4ff", accent: "#1e40af" },
  { name: "Classic Gold", bg: "#fffbeb", accent: "#b45309" },
  { name: "Modern Green", bg: "#f0fdf4", accent: "#166534" },
  { name: "Elegant Purple", bg: "#faf5ff", accent: "#6b21a8" },
  { name: "Warm Red", bg: "#fef2f2", accent: "#991b1b" },
  { name: "Clean White", bg: "#ffffff", accent: "#374151" },
];

const DB_FIELDS: Record<string, string[]> = {
  "Student": ["student_name","first_name","last_name","father_name","mother_name","dob","gender","class_name","section_name","roll_number","admission_no","sr_no","address","city","state","pincode","phone","email","photo","blood_group","category","religion","caste","nationality","aadhar_no","emergency_contact"],
  "Parent": ["father_name","mother_name","guardian_name","father_occupation","mother_occupation","father_phone","mother_phone","father_email","mother_email","parent_address","annual_income"],
  "School": ["school_name","school_logo","school_address","school_phone","school_email","school_website","principal_name","principal_signature","school_affiliation","school_code","district","board_name"],
  "Exam": ["exam_name","exam_type","subject_name","marks_obtained","max_marks","grade","percentage","rank","result_status","total_marks","pass_marks","exam_date","remarks"],
  "Fee": ["total_fee","paid_amount","balance_amount","due_date","receipt_no","payment_mode","payment_date","fee_month","fee_type","discount","fine_amount","transaction_id"],
  "Attendance": ["total_days","present_days","absent_days","attendance_percentage","leave_days","late_days","month_name"],
  "Teacher": ["teacher_name","teacher_phone","teacher_email","teacher_subject","teacher_designation","teacher_qualification","employee_id"],
  "Transport": ["bus_number","route_name","stop_name","driver_name","driver_phone","pickup_time","drop_time"],
  "Library": ["book_name","book_id","issue_date","return_date","fine","author_name","isbn"],
  "General": ["current_date","academic_year","serial_number","qr_code","barcode","page_number","watermark_text","session","term","month_year"],
};

let idCounter = 0;
const genId = () => `el_${++idCounter}_${Date.now()}`;

// Template type to page size mapping
const TEMPLATE_SIZE_MAP: Record<string, { w: number; h: number }> = {
  "certificate": { w: 794, h: 1123 },
  "id-card": { w: 382, h: 550 },
  "receipt": { w: 794, h: 600 },
  "report-card": { w: 794, h: 1123 },
  "admit-card": { w: 794, h: 560 },
  "notification": { w: 794, h: 600 },
  "custom": { w: 794, h: 1123 },
};

// ═══════════════════════════════════════
// ADVANCED COLOR PICKER (Fixed position)
// ═══════════════════════════════════════
function AdvancedColorPicker({ value, onChange, label }: { value: string; onChange: (c: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value || "#000000");
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const [recentColors, setRecentColors] = useState<string[]>(["#000000","#ff0000","#0000ff","#00cc00","#ffcc00","#8b00ff","#ff8c00","#1e90ff"]);

  useEffect(() => { setHex(value || "#000000"); hexToRgb(value || "#000000"); }, [value]);

  const hexToRgb = (h: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if (result) { setR(parseInt(result[1], 16)); setG(parseInt(result[2], 16)); setB(parseInt(result[3], 16)); }
  };

  const rgbToHex = (r: number, g: number, b: number) => "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");

  const updateFromRgb = (nr: number, ng: number, nb: number) => {
    setR(nr); setG(ng); setB(nb);
    setHex(rgbToHex(nr, ng, nb));
  };

  const applyColor = (color: string) => {
    onChange(color);
    setRecentColors(prev => [color, ...prev.filter(c => c !== color)].slice(0, 8));
    setOpen(false);
  };

  const openPicker = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popupHeight = 480;
      const popupWidth = 300;
      const rightSpace = window.innerWidth - rect.right;
      const bottomSpace = window.innerHeight - rect.top;
      const top = bottomSpace < popupHeight ? Math.max(8, window.innerHeight - popupHeight - 10) : rect.top;
      if (rightSpace > popupWidth + 20) {
        setPopupPos({ top, left: rect.right + 8 });
      } else {
        setPopupPos({ top, left: Math.max(8, rect.left - 150) });
      }
    }
    setOpen(!open);
  };

  return (
    <>
      <div className="flex flex-col items-center">
        {label && <span className="text-[9px] text-gray-500 mb-0.5">{label}</span>}
        <button ref={btnRef} onClick={openPicker} className="w-7 h-7 rounded border-2 border-gray-300 shadow-sm hover:border-blue-400 transition-colors" style={{ backgroundColor: value || "#000" }} title={label || "Color"} />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[300px] max-h-[calc(100vh-20px)] overflow-y-auto" style={{ top: popupPos.top, left: popupPos.left }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Color Picker</span>
              <button onClick={() => setOpen(false)} className="p-0.5 hover:bg-gray-100 rounded"><X size={14} /></button>
            </div>
            <div className="mb-3">
              <span className="text-[10px] text-gray-500 font-medium">Recent</span>
              <div className="flex gap-1 mt-1">
                {recentColors.map((c, i) => (
                  <button key={i} onClick={() => applyColor(c)} className="w-6 h-6 rounded border border-gray-200 hover:scale-125 transition-transform" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="mb-3">
              <span className="text-[10px] text-gray-500 font-medium">Standard Colors</span>
              <div className="grid grid-cols-12 gap-0.5 mt-1">
                {STANDARD_COLORS.map((c, i) => (
                  <button key={i} onClick={() => applyColor(c)} className="w-5 h-5 rounded-sm border border-gray-200 hover:scale-125 hover:z-10 transition-transform" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
            <div className="mb-3">
              <span className="text-[10px] text-gray-500 font-medium">Gradients</span>
              <div className="flex gap-1 mt-1">
                {GRADIENT_PRESETS.map((grd, i) => (
                  <button key={i} onClick={() => applyColor(grd.from)} className="w-10 h-6 rounded border border-gray-200 hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${grd.from}, ${grd.to})` }} title={grd.name} />
                ))}
              </div>
            </div>
            <div className="border-t pt-3">
              <span className="text-[10px] text-gray-500 font-medium">Custom Color</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-10 h-10 rounded border border-gray-300" style={{ backgroundColor: hex }} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] w-6 text-gray-500">HEX</span>
                    <input value={hex} onChange={e => { setHex(e.target.value); hexToRgb(e.target.value); }} className="flex-1 text-xs border rounded px-1.5 py-0.5 font-mono" />
                  </div>
                  <div className="flex gap-1">
                    <div className="flex items-center gap-0.5"><span className="text-[10px] text-red-500 font-bold">R</span><input type="number" min="0" max="255" value={r} onChange={e => updateFromRgb(+e.target.value, g, b)} className="w-10 text-[10px] border rounded px-1 py-0.5" /></div>
                    <div className="flex items-center gap-0.5"><span className="text-[10px] text-green-500 font-bold">G</span><input type="number" min="0" max="255" value={g} onChange={e => updateFromRgb(r, +e.target.value, b)} className="w-10 text-[10px] border rounded px-1 py-0.5" /></div>
                    <div className="flex items-center gap-0.5"><span className="text-[10px] text-blue-500 font-bold">B</span><input type="number" min="0" max="255" value={b} onChange={e => updateFromRgb(r, g, +e.target.value)} className="w-10 text-[10px] border rounded px-1 py-0.5" /></div>
                  </div>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <input type="range" min="0" max="255" value={r} onChange={e => updateFromRgb(+e.target.value, g, b)} className="w-full h-2 accent-red-500" />
                <input type="range" min="0" max="255" value={g} onChange={e => updateFromRgb(r, +e.target.value, b)} className="w-full h-2 accent-green-500" />
                <input type="range" min="0" max="255" value={b} onChange={e => updateFromRgb(r, g, +e.target.value)} className="w-full h-2 accent-blue-500" />
              </div>
              <button onClick={() => applyColor(hex)} className="mt-2 w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">Apply Color</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════
// AI TEMPLATE GENERATOR
// ═══════════════════════════════════════
function generateAITemplate(type: string, style: string, pageW: number, pageH: number): CanvasElement[] {
  const els: CanvasElement[] = [];
  const base = { rotation: 0, opacity: 1, fontFamily: "Arial", fontWeight: "normal" as const, fontStyle: "normal" as const, textDecoration: "none" as const, textAlign: "center" as const, fill: "transparent", stroke: "#000000", strokeWidth: 2, borderRadius: 0 };

  const accentColor = style === "Professional" ? "#1e40af" : style === "Modern" ? "#059669" : style === "Classic" ? "#92400e" : style === "Colorful" ? "#7c3aed" : "#374151";
  const headerBg = style === "Professional" ? "#1e3a5f" : style === "Modern" ? "#064e3b" : style === "Classic" ? "#78350f" : style === "Colorful" ? "#5b21b6" : "#1f2937";

  if (type === "certificate") {
    els.push({ ...base, id: genId(), type: "rect", x: 20, y: 20, width: pageW - 40, height: pageH - 40, stroke: accentColor, strokeWidth: 4, fill: "transparent" });
    els.push({ ...base, id: genId(), type: "rect", x: 35, y: 35, width: pageW - 70, height: pageH - 70, stroke: accentColor, strokeWidth: 1, fill: "transparent" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 200, y: 80, width: 400, height: 40, text: "{{school_name}}", fontSize: 28, fontWeight: "bold", color: headerBg, textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 200, y: 140, width: 400, height: 30, text: "{{school_address}}", fontSize: 14, color: "#666666", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "line", x: 100, y: 180, width: pageW - 200, height: 3, stroke: accentColor, strokeWidth: 2 });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 250, y: 220, width: 500, height: 50, text: "CERTIFICATE OF ACHIEVEMENT", fontSize: 36, fontWeight: "bold", color: accentColor, textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 250, y: 320, width: 500, height: 30, text: "This is to certify that", fontSize: 18, color: "#333333", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: pageW / 2 - 200, y: 370, width: 400, height: 40, text: "{{student_name}}", fontSize: 32, fontWeight: "bold", color: headerBg, textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 200, y: 430, width: 400, height: 25, text: "of Class {{class_name}} - Section {{section_name}}", fontSize: 16, color: "#333333", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 250, y: 480, width: 500, height: 60, text: "has successfully completed the academic year with distinction.", fontSize: 16, color: "#555555", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 80, y: pageH - 180, width: 200, height: 25, text: "Date: {{current_date}}", fontSize: 14, color: "#333333", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 280, y: pageH - 180, width: 200, height: 25, text: "{{principal_name}}", fontSize: 14, color: "#333333", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 280, y: pageH - 155, width: 200, height: 20, text: "Principal", fontSize: 12, color: "#666666", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "line", x: pageW - 290, y: pageH - 185, width: 200, height: 2, stroke: "#333333", strokeWidth: 1 });
  }

  else if (type === "id-card") {
    els.push({ ...base, id: genId(), type: "rect", x: 0, y: 0, width: pageW, height: pageH, fill: "#ffffff", stroke: "#dddddd", strokeWidth: 1, borderRadius: 12 });
    els.push({ ...base, id: genId(), type: "rect", x: 0, y: 0, width: pageW, height: pageH * 0.22, fill: headerBg, stroke: "transparent", strokeWidth: 0, borderRadius: 0 });
    els.push({ ...base, id: genId(), type: "field", x: 10, y: 15, width: pageW - 20, height: 22, text: "{{school_name}}", fontSize: 14, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 10, y: 40, width: pageW - 20, height: 18, text: "{{school_address}}", fontSize: 9, color: "#ffffffcc", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: 10, y: 62, width: pageW - 20, height: 18, text: "STUDENT ID CARD", fontSize: 10, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "rect", x: pageW / 2 - 35, y: pageH * 0.25, width: 70, height: 85, fill: "#f3f4f6", stroke: accentColor, strokeWidth: 2, borderRadius: 4 });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 30, y: pageH * 0.25 + 30, width: 60, height: 20, text: "PHOTO", fontSize: 10, color: "#9ca3af", textAlign: "center" });
    const fieldY = pageH * 0.52;
    els.push({ ...base, id: genId(), type: "field", x: 15, y: fieldY, width: pageW - 30, height: 18, text: "{{student_name}}", fontSize: 13, fontWeight: "bold", color: "#111827", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 15, y: fieldY + 25, width: pageW - 30, height: 15, text: "Class: {{class_name}} | Sec: {{section_name}}", fontSize: 10, color: "#4b5563", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 15, y: fieldY + 48, width: pageW - 30, height: 15, text: "Roll No: {{roll_number}}", fontSize: 10, color: "#4b5563", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 15, y: fieldY + 70, width: pageW - 30, height: 15, text: "Adm No: {{admission_no}}", fontSize: 10, color: "#4b5563", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 15, y: fieldY + 92, width: pageW - 30, height: 15, text: "DOB: {{dob}}", fontSize: 10, color: "#4b5563", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "rect", x: 0, y: pageH - 30, width: pageW, height: 30, fill: headerBg, stroke: "transparent", strokeWidth: 0 });
    els.push({ ...base, id: genId(), type: "field", x: 10, y: pageH - 24, width: pageW - 20, height: 15, text: "{{school_phone}}", fontSize: 8, color: "#ffffffcc", textAlign: "center" });
  }

  else if (type === "receipt") {
    els.push({ ...base, id: genId(), type: "rect", x: 0, y: 0, width: pageW, height: 80, fill: headerBg, stroke: "transparent", strokeWidth: 0 });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 15, width: pageW - 40, height: 30, text: "{{school_name}}", fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 48, width: pageW - 40, height: 20, text: "{{school_address}} | {{school_phone}}", fontSize: 11, color: "#ffffffcc", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 100, y: 100, width: 200, height: 30, text: "FEE RECEIPT", fontSize: 20, fontWeight: "bold", color: accentColor, textAlign: "center" });
    els.push({ ...base, id: genId(), type: "line", x: 30, y: 140, width: pageW - 60, height: 2, stroke: "#e5e7eb", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 155, width: 250, height: 20, text: "Receipt No: {{receipt_no}}", fontSize: 12, color: "#374151", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: pageW - 250, y: 155, width: 220, height: 20, text: "Date: {{current_date}}", fontSize: 12, color: "#374151", textAlign: "right" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 195, width: 400, height: 20, text: "Student: {{student_name}}", fontSize: 13, fontWeight: "bold", color: "#111827", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 220, width: 300, height: 18, text: "Class: {{class_name}} | Section: {{section_name}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 243, width: 300, height: 18, text: "Admission No: {{admission_no}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "rect", x: 30, y: 280, width: pageW - 60, height: 30, fill: "#f3f4f6", stroke: "#e5e7eb", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: 40, y: 285, width: 200, height: 20, text: "Description", fontSize: 11, fontWeight: "bold", color: "#374151", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 180, y: 285, width: 100, height: 20, text: "Amount", fontSize: 11, fontWeight: "bold", color: "#374151", textAlign: "right" });
    els.push({ ...base, id: genId(), type: "rect", x: 30, y: 310, width: pageW - 60, height: 30, fill: "transparent", stroke: "#e5e7eb", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: 40, y: 317, width: 200, height: 18, text: "Tuition Fee", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: pageW - 180, y: 317, width: 100, height: 18, text: "{{total_fee}}", fontSize: 11, color: "#4b5563", textAlign: "right" });
    els.push({ ...base, id: genId(), type: "rect", x: 30, y: 360, width: pageW - 60, height: 30, fill: accentColor + "15", stroke: accentColor, strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: 40, y: 367, width: 200, height: 18, text: "Total Paid", fontSize: 12, fontWeight: "bold", color: accentColor, textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: pageW - 200, y: 367, width: 120, height: 18, text: "₹ {{paid_amount}}", fontSize: 13, fontWeight: "bold", color: accentColor, textAlign: "right" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 410, width: 300, height: 18, text: "Balance: ₹ {{balance_amount}}", fontSize: 11, color: "#dc2626", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "line", x: pageW - 230, y: 500, width: 180, height: 2, stroke: "#333", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 230, y: 505, width: 180, height: 18, text: "Authorized Signature", fontSize: 10, color: "#666", textAlign: "center" });
  }

  else if (type === "report-card") {
    els.push({ ...base, id: genId(), type: "rect", x: 0, y: 0, width: pageW, height: 100, fill: headerBg, stroke: "transparent", strokeWidth: 0 });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 15, width: pageW - 40, height: 30, text: "{{school_name}}", fontSize: 24, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 50, width: pageW - 40, height: 20, text: "{{school_address}}", fontSize: 11, color: "#ffffffcc", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: 20, y: 73, width: pageW - 40, height: 20, text: "PROGRESS REPORT CARD", fontSize: 13, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "rect", x: 20, y: 115, width: pageW - 40, height: 80, fill: "#f9fafb", stroke: "#e5e7eb", strokeWidth: 1, borderRadius: 6 });
    els.push({ ...base, id: genId(), type: "field", x: 35, y: 125, width: 300, height: 18, text: "Name: {{student_name}}", fontSize: 12, color: "#111827", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 35, y: 148, width: 200, height: 18, text: "Class: {{class_name}} - {{section_name}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 35, y: 170, width: 200, height: 18, text: "Roll No: {{roll_number}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: pageW / 2, y: 148, width: 200, height: 18, text: "Adm No: {{admission_no}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: pageW / 2, y: 170, width: 200, height: 18, text: "Session: {{academic_year}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 210, width: pageW - 40, height: 25, text: "Exam: {{exam_name}}", fontSize: 14, fontWeight: "bold", color: accentColor, textAlign: "center" });
    els.push({ ...base, id: genId(), type: "rect", x: 20, y: 250, width: pageW - 40, height: 28, fill: accentColor, stroke: "transparent", strokeWidth: 0 });
    els.push({ ...base, id: genId(), type: "text", x: 30, y: 255, width: 200, height: 18, text: "Subject", fontSize: 11, fontWeight: "bold", color: "#ffffff", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 50, y: 255, width: 80, height: 18, text: "Max", fontSize: 11, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 + 50, y: 255, width: 80, height: 18, text: "Obtained", fontSize: 11, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 120, y: 255, width: 80, height: 18, text: "Grade", fontSize: 11, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    for (let i = 0; i < 5; i++) {
      const rowY = 280 + i * 28;
      els.push({ ...base, id: genId(), type: "rect", x: 20, y: rowY, width: pageW - 40, height: 28, fill: i % 2 === 0 ? "#f9fafb" : "#ffffff", stroke: "#e5e7eb", strokeWidth: 1 });
      els.push({ ...base, id: genId(), type: "field", x: 30, y: rowY + 5, width: 200, height: 18, text: "{{subject_name}}", fontSize: 11, color: "#374151", textAlign: "left" });
      els.push({ ...base, id: genId(), type: "field", x: pageW / 2 - 50, y: rowY + 5, width: 80, height: 18, text: "{{max_marks}}", fontSize: 11, color: "#374151", textAlign: "center" });
      els.push({ ...base, id: genId(), type: "field", x: pageW / 2 + 50, y: rowY + 5, width: 80, height: 18, text: "{{marks_obtained}}", fontSize: 11, color: "#374151", textAlign: "center" });
      els.push({ ...base, id: genId(), type: "field", x: pageW - 120, y: rowY + 5, width: 80, height: 18, text: "{{grade}}", fontSize: 11, color: accentColor, textAlign: "center" });
    }
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 440, width: pageW - 40, height: 25, text: "Overall: {{percentage}}% | Grade: {{grade}} | Result: {{result_status}}", fontSize: 13, fontWeight: "bold", color: accentColor, textAlign: "center" });
    els.push({ ...base, id: genId(), type: "line", x: 40, y: pageH - 130, width: 150, height: 2, stroke: "#333", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: 40, y: pageH - 125, width: 150, height: 18, text: "Class Teacher", fontSize: 10, color: "#666", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "line", x: pageW - 200, y: pageH - 130, width: 150, height: 2, stroke: "#333", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 200, y: pageH - 125, width: 150, height: 18, text: "Principal", fontSize: 10, color: "#666", textAlign: "center" });
  }

  else if (type === "admit-card") {
    els.push({ ...base, id: genId(), type: "rect", x: 0, y: 0, width: pageW, height: 70, fill: headerBg, stroke: "transparent", strokeWidth: 0 });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 12, width: pageW - 40, height: 28, text: "{{school_name}}", fontSize: 20, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 42, width: pageW - 40, height: 18, text: "{{school_address}} | Phone: {{school_phone}}", fontSize: 10, color: "#ffffffcc", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "rect", x: pageW / 2 - 80, y: 80, width: 160, height: 28, fill: accentColor + "20", stroke: accentColor, strokeWidth: 1.5, borderRadius: 4 });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 75, y: 85, width: 150, height: 20, text: "ADMIT CARD", fontSize: 14, fontWeight: "bold", color: accentColor, textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: pageW / 2 - 100, y: 115, width: 200, height: 18, text: "{{exam_name}}", fontSize: 12, fontWeight: "bold", color: "#333333", textAlign: "center" });
    // Student info (2 columns)
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 150, width: 300, height: 18, text: "Name: {{student_name}}", fontSize: 11, color: "#111827", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: pageW / 2 + 20, y: 150, width: 250, height: 18, text: "Class: {{class_name}} - {{section_name}}", fontSize: 11, color: "#111827", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 172, width: 300, height: 18, text: "Father: {{father_name}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: pageW / 2 + 20, y: 172, width: 250, height: 18, text: "Roll No: {{roll_number}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 194, width: 300, height: 18, text: "Mother: {{mother_name}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: pageW / 2 + 20, y: 194, width: 250, height: 18, text: "Adm No: {{admission_no}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    // Photo placeholder
    els.push({ ...base, id: genId(), type: "rect", x: pageW - 100, y: 140, width: 70, height: 85, fill: "#f3f4f6", stroke: accentColor, strokeWidth: 1.5, borderRadius: 4 });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 95, y: 175, width: 60, height: 16, text: "PHOTO", fontSize: 9, color: "#9ca3af", textAlign: "center" });
    // Schedule table header
    els.push({ ...base, id: genId(), type: "rect", x: 30, y: 235, width: pageW - 60, height: 24, fill: accentColor, stroke: "transparent", strokeWidth: 0 });
    els.push({ ...base, id: genId(), type: "text", x: 40, y: 239, width: 200, height: 16, text: "Subject", fontSize: 10, fontWeight: "bold", color: "#ffffff", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 50, y: 239, width: 100, height: 16, text: "Date", fontSize: 10, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 200, y: 239, width: 100, height: 16, text: "Time", fontSize: 10, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    // Sample rows
    for (let i = 0; i < 4; i++) {
      const rowY = 260 + i * 24;
      els.push({ ...base, id: genId(), type: "rect", x: 30, y: rowY, width: pageW - 60, height: 24, fill: i % 2 === 0 ? "#f9fafb" : "#ffffff", stroke: "#e5e7eb", strokeWidth: 1 });
      els.push({ ...base, id: genId(), type: "field", x: 40, y: rowY + 4, width: 200, height: 16, text: "{{subject_name}}", fontSize: 10, color: "#374151", textAlign: "left" });
      els.push({ ...base, id: genId(), type: "field", x: pageW / 2 - 50, y: rowY + 4, width: 100, height: 16, text: "{{exam_date}}", fontSize: 10, color: "#374151", textAlign: "center" });
      els.push({ ...base, id: genId(), type: "field", x: pageW - 200, y: rowY + 4, width: 100, height: 16, text: "{{exam_time}}", fontSize: 10, color: "#374151", textAlign: "center" });
    }
    // Signatures
    els.push({ ...base, id: genId(), type: "line", x: 40, y: pageH - 80, width: 130, height: 2, stroke: "#333", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: 40, y: pageH - 75, width: 130, height: 16, text: "Class Teacher", fontSize: 10, color: "#666", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "line", x: pageW - 180, y: pageH - 80, width: 130, height: 2, stroke: "#333", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 180, y: pageH - 75, width: 130, height: 16, text: "Principal", fontSize: 10, color: "#666", textAlign: "center" });
  }

  else if (type === "notification") {
    els.push({ ...base, id: genId(), type: "rect", x: 0, y: 0, width: pageW, height: 80, fill: headerBg, stroke: "transparent", strokeWidth: 0 });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 15, width: pageW - 40, height: 28, text: "{{school_name}}", fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: 20, y: 46, width: pageW - 40, height: 18, text: "{{school_address}}", fontSize: 10, color: "#ffffffcc", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "line", x: 30, y: 95, width: pageW - 60, height: 2, stroke: "#e5e7eb", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: pageW / 2 - 100, y: 110, width: 200, height: 28, text: "NOTICE", fontSize: 20, fontWeight: "bold", color: accentColor, textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: pageW - 200, y: 115, width: 170, height: 18, text: "Date: {{current_date}}", fontSize: 11, color: "#666666", textAlign: "right" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 155, width: 300, height: 18, text: "Ref No: {{notification_ref}}", fontSize: 11, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 190, width: pageW - 60, height: 22, text: "Subject: {{notification_title}}", fontSize: 13, fontWeight: "bold", color: "#111827", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "text", x: 30, y: 230, width: pageW - 60, height: 18, text: "Dear Parents/Students,", fontSize: 12, color: "#333333", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "field", x: 30, y: 260, width: pageW - 60, height: 200, text: "{{notification_body}}", fontSize: 12, color: "#4b5563", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "text", x: 30, y: 480, width: 200, height: 18, text: "Regards,", fontSize: 12, color: "#333333", textAlign: "left" });
    els.push({ ...base, id: genId(), type: "line", x: pageW - 200, y: pageH - 80, width: 150, height: 2, stroke: "#333", strokeWidth: 1 });
    els.push({ ...base, id: genId(), type: "text", x: pageW - 200, y: pageH - 75, width: 150, height: 18, text: "Principal", fontSize: 11, fontWeight: "bold", color: "#333", textAlign: "center" });
    els.push({ ...base, id: genId(), type: "field", x: pageW - 200, y: pageH - 58, width: 150, height: 16, text: "{{school_name}}", fontSize: 9, color: "#666", textAlign: "center" });
  }

  return els;
}

// ═══════════════════════════════════════
// MAIN EDITOR
// ═══════════════════════════════════════
export default function CanvasEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [templateType, setTemplateType] = useState("id-card");
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number; handle?: string } | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");
  const [pageWidth, setPageWidth] = useState(794);
  const [pageHeight, setPageHeight] = useState(1123);
  const [pageBg, setPageBg] = useState("#ffffff");
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [zoom, setZoom] = useState(70);
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showShapesPanel, setShowShapesPanel] = useState(false);
  const [showWordArtPanel, setShowWordArtPanel] = useState(false);
  const [showChartsPanel, setShowChartsPanel] = useState(false);
  const [showDesignTemplates, setShowDesignTemplates] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showBordersPanel, setShowBordersPanel] = useState(false);

  // AI Generate state
  const [aiType, setAiType] = useState("certificate");
  const [aiStyle, setAiStyle] = useState("Professional");
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const selectedEl = elements.find(e => e.id === selected) || null;

  // ═══ HISTORY ═══
  const pushHistory = useCallback((els: CanvasElement[]) => {
    setHistory(prev => { const h = prev.slice(0, historyIdx + 1); h.push(JSON.parse(JSON.stringify(els))); return h; });
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const undo = () => { if (historyIdx <= 0) return; const i = historyIdx - 1; setHistoryIdx(i); setElements(JSON.parse(JSON.stringify(history[i]))); };
  const redo = () => { if (historyIdx >= history.length - 1) return; const i = historyIdx + 1; setHistoryIdx(i); setElements(JSON.parse(JSON.stringify(history[i]))); };

  // ═══ LOAD TEMPLATE ═══
  useEffect(() => {
    const load = async () => {
      if (id) {
        try {
          const res = await axios.get(`${API}/api/templates/${id}`);
          const t = res.data.data;
          setTemplateName(t.name || "Untitled");
          if (t.type) setTemplateType(t.type);
          if (t.canvasJSON?.elements) setElements(t.canvasJSON.elements);
          if (t.canvasJSON?.pageBg) setPageBg(t.canvasJSON.pageBg);
          if (t.pageWidth) setPageWidth(t.pageWidth);
          if (t.pageHeight) setPageHeight(t.pageHeight);
        } catch { toast.error("Template not found"); }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  // ═══ DRAW CANVAS ═══
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = pageBg;
    ctx.fillRect(0, 0, pageWidth, pageHeight);
    if (showGrid) {
      ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 0.5;
      for (let x = 0; x < pageWidth; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, pageHeight); ctx.stroke(); }
      for (let y = 0; y < pageHeight; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(pageWidth, y); ctx.stroke(); }
    }
    elements.forEach((el) => {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;
      if (el.rotation) { const cx = el.x + el.width / 2, cy = el.y + el.height / 2; ctx.translate(cx, cy); ctx.rotate((el.rotation * Math.PI) / 180); ctx.translate(-cx, -cy); }
      if (el.type === "rect") {
        const r = el.borderRadius || 0;
        ctx.beginPath();
        if (r > 0) { ctx.moveTo(el.x + r, el.y); ctx.arcTo(el.x + el.width, el.y, el.x + el.width, el.y + el.height, r); ctx.arcTo(el.x + el.width, el.y + el.height, el.x, el.y + el.height, r); ctx.arcTo(el.x, el.y + el.height, el.x, el.y, r); ctx.arcTo(el.x, el.y, el.x + el.width, el.y, r); ctx.closePath(); }
        else { ctx.rect(el.x, el.y, el.width, el.height); }
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        if (el.stroke && el.stroke !== "transparent") { ctx.strokeStyle = el.stroke; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke(); }
      } else if (el.type === "circle") {
        ctx.beginPath(); ctx.ellipse(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "triangle") {
        ctx.beginPath(); ctx.moveTo(el.x + el.width / 2, el.y); ctx.lineTo(el.x + el.width, el.y + el.height); ctx.lineTo(el.x, el.y + el.height); ctx.closePath();
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "star") {
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        const outerR = Math.min(el.width, el.height) / 2, innerR = outerR * 0.4;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI / 2) * -1 + (Math.PI / 5) * i;
          const method = i === 0 ? "moveTo" : "lineTo";
          ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        ctx.closePath();
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "diamond") {
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        ctx.beginPath(); ctx.moveTo(cx, el.y); ctx.lineTo(el.x + el.width, cy); ctx.lineTo(cx, el.y + el.height); ctx.lineTo(el.x, cy); ctx.closePath();
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "pentagon") {
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2, r = Math.min(el.width, el.height) / 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI / 2) * -1 + (2 * Math.PI / 5) * i;
          const method = i === 0 ? "moveTo" : "lineTo";
          ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        ctx.closePath();
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "hexagon") {
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2, r = Math.min(el.width, el.height) / 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (2 * Math.PI / 6) * i - Math.PI / 6;
          const method = i === 0 ? "moveTo" : "lineTo";
          ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        ctx.closePath();
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "arrow") {
        const midY = el.y + el.height / 2;
        const headLen = Math.min(el.width * 0.3, 30);
        ctx.beginPath();
        ctx.moveTo(el.x, midY - el.height * 0.2); ctx.lineTo(el.x + el.width - headLen, midY - el.height * 0.2);
        ctx.lineTo(el.x + el.width - headLen, midY - el.height * 0.5); ctx.lineTo(el.x + el.width, midY);
        ctx.lineTo(el.x + el.width - headLen, midY + el.height * 0.5); ctx.lineTo(el.x + el.width - headLen, midY + el.height * 0.2);
        ctx.lineTo(el.x, midY + el.height * 0.2); ctx.closePath();
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "heart") {
        const cx = el.x + el.width / 2, w = el.width, h = el.height;
        ctx.beginPath();
        ctx.moveTo(cx, el.y + h * 0.3);
        ctx.bezierCurveTo(cx, el.y, el.x, el.y, el.x, el.y + h * 0.3);
        ctx.bezierCurveTo(el.x, el.y + h * 0.6, cx, el.y + h * 0.7, cx, el.y + h);
        ctx.bezierCurveTo(cx, el.y + h * 0.7, el.x + w, el.y + h * 0.6, el.x + w, el.y + h * 0.3);
        ctx.bezierCurveTo(el.x + w, el.y, cx, el.y, cx, el.y + h * 0.3);
        ctx.closePath();
        if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "line") {
        ctx.beginPath(); ctx.moveTo(el.x, el.y + el.height / 2); ctx.lineTo(el.x + el.width, el.y + el.height / 2);
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "text" || el.type === "field") {
        const weight = el.fontWeight === "bold" ? "bold" : "", style = el.fontStyle === "italic" ? "italic" : "";
        ctx.font = `${style} ${weight} ${el.fontSize || 18}px ${el.fontFamily || "Arial"}`;
        ctx.fillStyle = el.color || (el.type === "field" ? "#6366f1" : "#000");
        ctx.textAlign = (el.textAlign as CanvasTextAlign) || "left";
        let textX = el.x;
        if (el.textAlign === "center") textX = el.x + el.width / 2;
        else if (el.textAlign === "right") textX = el.x + el.width;
        if (el.type === "field") { const tw = ctx.measureText(el.text || "").width; ctx.fillStyle = "#eef2ff"; ctx.fillRect(el.x - 2, el.y - 1, Math.max(tw + 4, el.width), (el.fontSize || 18) + 4); ctx.fillStyle = "#6366f1"; }
        // Multiline text support
        const lines = (el.text || "").split("\n");
        const lineHeight = (el.fontSize || 18) * 1.3;
        lines.forEach((line, idx) => {
          ctx.fillText(line, textX, el.y + (el.fontSize || 18) + idx * lineHeight);
        });
        if (el.textDecoration === "underline") { const tw = ctx.measureText(el.text || "").width; ctx.beginPath(); ctx.moveTo(el.x, el.y + (el.fontSize || 18) + 2); ctx.lineTo(el.x + tw, el.y + (el.fontSize || 18) + 2); ctx.strokeStyle = el.color || "#000"; ctx.lineWidth = 1; ctx.stroke(); }
      } else if (el.type === "image" && el.imageSrc) { const img = new window.Image(); img.src = el.imageSrc; try { ctx.drawImage(img, el.x, el.y, el.width, el.height); } catch {} }
      ctx.restore();
      if (el.id === selected) {
        ctx.setLineDash([4, 3]); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 1.5; ctx.strokeRect(el.x - 4, el.y - 4, el.width + 8, el.height + 8); ctx.setLineDash([]);
        [[el.x - 4, el.y - 4],[el.x + el.width / 2 - 3, el.y - 4],[el.x + el.width, el.y - 4],[el.x - 4, el.y + el.height / 2 - 3],[el.x + el.width, el.y + el.height / 2 - 3],[el.x - 4, el.y + el.height],[el.x + el.width / 2 - 3, el.y + el.height],[el.x + el.width, el.y + el.height]].forEach(([hx, hy]) => { ctx.fillStyle = "#fff"; ctx.fillRect(hx, hy, 7, 7); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 1.5; ctx.strokeRect(hx, hy, 7, 7); });
      }
    });
    ctx.restore();
  }, [elements, selected, pageWidth, pageHeight, pageBg, showGrid]);

  // ═══ MOUSE ═══
  const getPos = (e: React.MouseEvent) => { const r = canvasRef.current?.getBoundingClientRect(); if (!r) return { x: 0, y: 0 }; const s = zoom / 100; return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };
  const handleMouseDown = (e: React.MouseEvent) => {
    setContextMenu(null);
    const { x, y } = getPos(e);
    // Check resize handles first (if element is selected)
    if (selected) {
      const sel = elements.find(el => el.id === selected);
      if (sel) {
        const handleSize = 8;
        const handles = [
          { name: "nw", hx: sel.x - 4, hy: sel.y - 4 },
          { name: "n", hx: sel.x + sel.width / 2 - 3, hy: sel.y - 4 },
          { name: "ne", hx: sel.x + sel.width, hy: sel.y - 4 },
          { name: "w", hx: sel.x - 4, hy: sel.y + sel.height / 2 - 3 },
          { name: "e", hx: sel.x + sel.width, hy: sel.y + sel.height / 2 - 3 },
          { name: "sw", hx: sel.x - 4, hy: sel.y + sel.height },
          { name: "s", hx: sel.x + sel.width / 2 - 3, hy: sel.y + sel.height },
          { name: "se", hx: sel.x + sel.width, hy: sel.y + sel.height },
        ];
        for (const h of handles) {
          if (x >= h.hx - 2 && x <= h.hx + handleSize + 2 && y >= h.hy - 2 && y <= h.hy + handleSize + 2) {
            setDragging({ id: sel.id, offsetX: x, offsetY: y, handle: h.name });
            return;
          }
        }
      }
    }
    // Normal element selection + drag
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (x >= el.x - 5 && x <= el.x + el.width + 5 && y >= el.y - 5 && y <= el.y + el.height + 5) {
        setSelected(el.id);
        setDragging({ id: el.id, offsetX: x - el.x, offsetY: y - el.y });
        return;
      }
    }
    setSelected(null);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const { x, y } = getPos(e);
    if (dragging.handle) {
      // RESIZE mode
      const el = elements.find(e => e.id === dragging.id);
      if (!el) return;
      const dx = x - dragging.offsetX;
      const dy = y - dragging.offsetY;
      let newX = el.x, newY = el.y, newW = el.width, newH = el.height;
      const h = dragging.handle;
      if (h.includes("e")) { newW = Math.max(20, el.width + dx); }
      if (h.includes("w")) { newX = el.x + dx; newW = Math.max(20, el.width - dx); }
      if (h.includes("s")) { newH = Math.max(20, el.height + dy); }
      if (h.includes("n")) { newY = el.y + dy; newH = Math.max(20, el.height - dy); }
      if (snapToGrid) { newX = Math.round(newX / 20) * 20; newY = Math.round(newY / 20) * 20; newW = Math.round(newW / 20) * 20; newH = Math.round(newH / 20) * 20; }
      setElements(prev => prev.map(el => el.id === dragging.id ? { ...el, x: newX, y: newY, width: newW, height: newH } : el));
      setDragging({ ...dragging, offsetX: x, offsetY: y });
    } else {
      // MOVE mode
      let nx = x - dragging.offsetX, ny = y - dragging.offsetY;
      if (snapToGrid) { nx = Math.round(nx / 20) * 20; ny = Math.round(ny / 20) * 20; }
      setElements(prev => prev.map(el => el.id === dragging.id ? { ...el, x: nx, y: ny } : el));
    }
  };
  const handleMouseUp = () => { if (dragging) pushHistory(elements); setDragging(null); };
  const handleDoubleClick = (e: React.MouseEvent) => { const { x, y } = getPos(e); for (let i = elements.length - 1; i >= 0; i--) { const el = elements[i]; if ((el.type === "text" || el.type === "field") && x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) { setEditingText(el.id); return; } } };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    for (let i = elements.length - 1; i >= 0; i--) { const el = elements[i]; if (x >= el.x - 5 && x <= el.x + el.width + 5 && y >= el.y - 5 && y <= el.y + el.height + 5) { setSelected(el.id); setContextMenu({ x: e.clientX, y: e.clientY }); return; } }
    setContextMenu(null);
  };


  // ═══ ELEMENT OPS ═══
  const addElement = (el: Partial<CanvasElement> & { type: CanvasElement["type"] }) => { const n: CanvasElement = { id: genId(), x: 80, y: 80, width: 150, height: 100, rotation: 0, opacity: 1, fontFamily: "Arial", fontSize: 20, fontWeight: "normal", fontStyle: "normal", textDecoration: "none", textAlign: "left", color: "#000000", fill: "transparent", stroke: "#000000", strokeWidth: 2, borderRadius: 0, ...el }; setElements(prev => { const u = [...prev, n]; setTimeout(() => pushHistory(u), 0); return u; }); setSelected(n.id); };
  const batchAdd = (els: (Partial<CanvasElement> & { type: CanvasElement["type"] })[]) => { const newEls = els.map(el => ({ id: genId(), x: 80, y: 80, width: 150, height: 100, rotation: 0, opacity: 1, fontFamily: "Arial", fontSize: 20, fontWeight: "normal", fontStyle: "normal", textDecoration: "none", textAlign: "left", color: "#000000", fill: "transparent", stroke: "#000000", strokeWidth: 2, borderRadius: 0, ...el } as CanvasElement)); const u = [...elements, ...newEls]; setElements(u); setSelected(newEls[newEls.length - 1]?.id || null); pushHistory(u); };
  const updateEl = (id: string, props: Partial<CanvasElement>) => setElements(prev => prev.map(el => el.id === id ? { ...el, ...props } : el));
  const commitUpdate = () => pushHistory(elements);
  const deleteSelected = () => { if (!selected) return; const u = elements.filter(el => el.id !== selected); setElements(u); setSelected(null); pushHistory(u); };
  const copyEl = () => { if (selectedEl) setClipboard({ ...selectedEl }); };
  const pasteEl = () => { if (!clipboard) return; addElement({ ...clipboard, id: genId(), x: clipboard.x + 20, y: clipboard.y + 20 }); };
  const duplicateEl = () => { if (selectedEl) addElement({ ...selectedEl, id: genId(), x: selectedEl.x + 20, y: selectedEl.y + 20 }); };
  const bringToFront = () => { if (!selected) return; const u = [...elements.filter(e => e.id !== selected), elements.find(e => e.id === selected)!]; setElements(u); pushHistory(u); };
  const sendToBack = () => { if (!selected) return; const u = [elements.find(e => e.id === selected)!, ...elements.filter(e => e.id !== selected)]; setElements(u); pushHistory(u); };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => addElement({ type: "image", width: 200, height: 150, imageSrc: ev.target?.result as string }); r.readAsDataURL(f); };

  // ═══ AI GENERATE ═══
  const handleAIGenerate = async () => {
    setAiGenerating(true);
    const size = TEMPLATE_SIZE_MAP[aiType] || { w: 794, h: 1123 };
    setPageWidth(size.w);
    setPageHeight(size.h);

    try {
      // Call Gemini AI via backend
      const res = await axios.post(`${API}/api/ai/generate`, {
        type: aiType,
        style: aiStyle,
        description: aiDescription,
        pageWidth: size.w,
        pageHeight: size.h,
      });

      if (res.data.success && res.data.data) {
        setElements(res.data.data);
        pushHistory(res.data.data);
        toast.success("✨ AI Design generated! Customize as needed.");
      } else {
        throw new Error(res.data.message || "AI generation failed");
      }
    } catch (err: any) {
      console.error("AI Generate failed, using local fallback:", err.message);
      // Fallback to local template generator
      const generated = generateAITemplate(aiType, aiStyle, size.w, size.h);
      setElements(generated);
      pushHistory(generated);
      toast.error("AI unavailable — used local template. Check API key.");
    } finally {
      setAiGenerating(false);
    }
  };

  // ═══ AI TYPE CHANGE → AUTO PAGE SIZE ═══
  const handleAiTypeChange = (type: string) => {
    setAiType(type);
    const size = TEMPLATE_SIZE_MAP[type];
    if (size) {
      setPageWidth(size.w);
      setPageHeight(size.h);
    }
  };

  // ═══ PREVIEW & PRINT ═══
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Print Preview - ${templateName}</title><style>@media print { body { margin: 0; } img { width: 100%; height: auto; max-width: ${pageWidth}px; } } body { display: flex; justify-content: center; align-items: flex-start; padding: 20px; background: #f0f0f0; } .container { background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); } img { display: block; }</style></head><body><div class="container"><img src="${dataUrl}" /></div><script>setTimeout(() => window.print(), 500);</script></body></html>`);
    win.document.close();
  };

  // ═══ SAVE ═══
  const saveTemplate = async () => { setSaving(true); try { const p = { name: templateName, canvasJSON: { elements, pageBg }, pageWidth, pageHeight, tenantId: import.meta.env.VITE_TENANT_ID || "000000000000000000000000" }; if (id) { await axios.put(`${API}/api/templates/${id}`, { ...p, type: templateType }); } else { await axios.post(`${API}/api/templates`, { ...p, type: templateType }); } toast.success("Saved!"); } catch(err: any) { console.error("Save error:", err?.response?.data || err); toast.error(err?.response?.data?.message || "Save failed"); } finally { setSaving(false); } };


  // ═══ KEYBOARD ═══
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editingText) return;
      if (e.key === "Delete" || e.key === "Backspace") { if (selected) deleteSelected(); }
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === "c") { e.preventDefault(); copyEl(); }
      if (e.ctrlKey && e.key === "v") { e.preventDefault(); pasteEl(); }
      if (e.ctrlKey && e.key === "a") { e.preventDefault(); setSelected(elements.length > 0 ? elements[0].id : null); }
      if (e.ctrlKey && e.key === "d") { e.preventDefault(); duplicateEl(); }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); saveTemplate(); }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); handlePrint(); }
      if (e.key === "F1") { e.preventDefault(); setShowShortcutsHelp(true); }
      if (e.key === "Escape") { setSelected(null); setShowShapesPanel(false); setShowWordArtPanel(false); setShowChartsPanel(false); setShowDesignTemplates(false); setShowShortcutsHelp(false); setShowBordersPanel(false); }
      // Arrow keys to nudge selected element
      if (selected && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dir = e.key === "ArrowUp" ? { y: -step } : e.key === "ArrowDown" ? { y: step } : e.key === "ArrowLeft" ? { x: -step } : { x: step };
        setElements(prev => prev.map(el => el.id === selected ? { ...el, x: el.x + (dir.x || 0), y: el.y + (dir.y || 0) } : el));
      }
      // + / - to zoom
      if (e.key === "+" || e.key === "=") { setZoom(z => Math.min(200, z + 10)); }
      if (e.key === "-") { setZoom(z => Math.max(25, z - 10)); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [selected, editingText, elements, historyIdx, clipboard]);

  // ═══ RIBBON ═══
  const renderRibbon = () => {
    switch (activeTab) {
      case "home": return (
        <div className="flex items-center gap-1 h-full">
          <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
            <div className="flex gap-1"><button onClick={copyEl} className="p-1.5 hover:bg-blue-50 rounded" title="Copy"><Copy size={14}/></button><button onClick={pasteEl} className="p-1.5 hover:bg-blue-50 rounded" title="Paste"><Clipboard size={14}/></button><button onClick={duplicateEl} className="p-1.5 hover:bg-blue-50 rounded" title="Duplicate"><CopyPlus size={14}/></button></div>
            <span className="text-[9px] text-gray-400">Clipboard</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
            <div className="flex items-center gap-1">
              <select value={selectedEl?.fontFamily || "Arial"} onChange={e => { if (selected) { updateEl(selected, { fontFamily: e.target.value }); commitUpdate(); }}} className="text-xs border rounded px-1 py-0.5 w-32">{FONTS.map(f => <option key={f} value={f}>{f}</option>)}</select>
              <select value={selectedEl?.fontSize || 20} onChange={e => { if (selected) { updateEl(selected, { fontSize: +e.target.value }); commitUpdate(); }}} className="text-xs border rounded px-1 py-0.5 w-16">{FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => { if (selected) { updateEl(selected, { fontWeight: selectedEl?.fontWeight === "bold" ? "normal" : "bold" }); commitUpdate(); }}} className={`p-1 rounded ${selectedEl?.fontWeight === "bold" ? "bg-blue-100" : "hover:bg-gray-100"}`}><Bold size={13}/></button>
              <button onClick={() => { if (selected) { updateEl(selected, { fontStyle: selectedEl?.fontStyle === "italic" ? "normal" : "italic" }); commitUpdate(); }}} className={`p-1 rounded ${selectedEl?.fontStyle === "italic" ? "bg-blue-100" : "hover:bg-gray-100"}`}><Italic size={13}/></button>
              <button onClick={() => { if (selected) { updateEl(selected, { textDecoration: selectedEl?.textDecoration === "underline" ? "none" : "underline" }); commitUpdate(); }}} className={`p-1 rounded ${selectedEl?.textDecoration === "underline" ? "bg-blue-100" : "hover:bg-gray-100"}`}><Underline size={13}/></button>
              <AdvancedColorPicker value={selectedEl?.color || "#000000"} onChange={c => { if (selected) { updateEl(selected, { color: c }); commitUpdate(); }}} label="Color" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
            <div className="flex gap-0.5">
              <button onClick={() => { if (selected) { updateEl(selected, { textAlign: "left" }); commitUpdate(); }}} className={`p-1 rounded ${selectedEl?.textAlign === "left" ? "bg-blue-100" : "hover:bg-gray-100"}`}><AlignLeft size={13}/></button>
              <button onClick={() => { if (selected) { updateEl(selected, { textAlign: "center" }); commitUpdate(); }}} className={`p-1 rounded ${selectedEl?.textAlign === "center" ? "bg-blue-100" : "hover:bg-gray-100"}`}><AlignCenter size={13}/></button>
              <button onClick={() => { if (selected) { updateEl(selected, { textAlign: "right" }); commitUpdate(); }}} className={`p-1 rounded ${selectedEl?.textAlign === "right" ? "bg-blue-100" : "hover:bg-gray-100"}`}><AlignRight size={13}/></button>
            </div>
            <span className="text-[9px] text-gray-400">Align</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3">
            <div className="flex gap-1"><button onClick={undo} className="p-1.5 hover:bg-blue-50 rounded"><Undo2 size={14}/></button><button onClick={redo} className="p-1.5 hover:bg-blue-50 rounded"><Redo2 size={14}/></button></div>
            <span className="text-[9px] text-gray-400">History</span>
          </div>
        </div>
      );
      case "insert": return (
        <div className="flex items-center gap-1 h-full overflow-x-auto">
          {/* Text & Shapes */}
          <div className="flex flex-col items-center gap-0.5 px-2 border-r border-gray-200">
            <div className="flex gap-0.5 flex-wrap max-w-[200px]">
              <button onClick={() => addElement({ type: "text", text: "Text", width: 200, height: 30 })} className="p-1 hover:bg-blue-50 rounded" title="Text Box"><Type size={14}/></button>
              <button onClick={() => addElement({ type: "rect", width: 150, height: 100 })} className="p-1 hover:bg-blue-50 rounded" title="Rectangle"><Square size={14}/></button>
              <button onClick={() => addElement({ type: "circle", width: 100, height: 100 })} className="p-1 hover:bg-blue-50 rounded" title="Circle"><CircleIcon size={14}/></button>
              <button onClick={() => addElement({ type: "triangle", width: 120, height: 100 })} className="p-1 hover:bg-blue-50 rounded" title="Triangle"><Triangle size={14}/></button>
              <button onClick={() => addElement({ type: "line", width: 200, height: 4 })} className="p-1 hover:bg-blue-50 rounded" title="Line"><Minus size={14}/></button>
              <button onClick={() => addElement({ type: "star", width: 100, height: 100, fill: "#fbbf24", stroke: "#d97706" })} className="p-1 hover:bg-blue-50 rounded" title="Star"><Star size={14}/></button>
              <button onClick={() => addElement({ type: "arrow", width: 150, height: 60, fill: "#3b82f6", stroke: "#1d4ed8" })} className="p-1 hover:bg-blue-50 rounded" title="Arrow"><ArrowRight size={14}/></button>
              <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-blue-50 rounded" title="Picture"><ImageIcon size={14}/></button>
              <button onClick={() => setShowShapesPanel(!showShapesPanel)} className={`p-1 rounded text-[9px] font-medium ${showShapesPanel ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 text-blue-600"}`} title="More Shapes">▼</button>
            </div>
            <span className="text-[9px] text-gray-400">Shapes</span>
          </div>
          {/* Word Art */}
          <div className="flex flex-col items-center gap-0.5 px-2 border-r border-gray-200">
            <button onClick={() => setShowWordArtPanel(!showWordArtPanel)} className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${showWordArtPanel ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 border"}`} title="Word Art"><span className="font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">A</span> WordArt</button>
            <span className="text-[9px] text-gray-400">Text</span>
          </div>
          {/* Charts */}
          <div className="flex flex-col items-center gap-0.5 px-2 border-r border-gray-200">
            <button onClick={() => setShowChartsPanel(!showChartsPanel)} className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${showChartsPanel ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 border"}`} title="Chart">📊 Chart</button>
            <span className="text-[9px] text-gray-400">Charts</span>
          </div>
          {/* Design Templates */}
          <div className="flex flex-col items-center gap-0.5 px-2 border-r border-gray-200">
            <button onClick={() => setShowDesignTemplates(!showDesignTemplates)} className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${showDesignTemplates ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50 border"}`} title="Design Templates">🎨 Templates</button>
            <span className="text-[9px] text-gray-400">Quick Design</span>
          </div>
          {/* DB Fields */}
          <div className="flex flex-col items-center gap-0.5 px-2 border-r border-gray-200">
            <select onChange={e => { if (e.target.value) addElement({ type: "field", text: `{{${e.target.value}}}`, width: 200, height: 25, fontSize: 16, color: "#6366f1" }); e.target.value = ""; }} className="text-xs border rounded px-2 py-1 w-40" defaultValue=""><option value="" disabled>+ DB Field</option>{Object.entries(DB_FIELDS).map(([cat, fields]) => (<optgroup key={cat} label={cat}>{fields.map(f => <option key={f} value={f}>{`{{${f}}}`}</option>)}</optgroup>))}</select>
            <span className="text-[9px] text-gray-400">DB Fields</span>
          </div>
          {/* Decorations */}
          <div className="flex flex-col items-center gap-0.5 px-2">
            <div className="flex gap-0.5">
              <button onClick={() => addElement({ type: "text", text: "WATERMARK", width: 400, height: 60, fontSize: 56, color: "#00000012", rotation: -30, fontWeight: "bold", textAlign: "center" })} className="p-1 hover:bg-blue-50 rounded" title="Watermark"><Droplets size={14}/></button>
              <button onClick={() => setShowBordersPanel(!showBordersPanel)} className={`p-1 rounded ${showBordersPanel ? "bg-blue-100" : "hover:bg-blue-50"}`} title="Borders (50+ styles)"><Frame size={14}/></button>
              <button onClick={() => addElement({ type: "line", x: 50, y: 200, width: pageWidth - 100, height: 2, stroke: "#ccc", strokeWidth: 1 })} className="p-1 hover:bg-blue-50 rounded" title="Divider"><SeparatorHorizontal size={14}/></button>
            </div>
            <span className="text-[9px] text-gray-400">Decorations</span>
          </div>
        </div>
      );
      case "design": return (
        <div className="flex items-center gap-1 h-full">
          <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
            <div className="flex items-center gap-2">
              <AdvancedColorPicker value={pageBg} onChange={setPageBg} label="Background" />
              <button onClick={() => bgInputRef.current?.click()} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">BG Image</button>
            </div>
            <span className="text-[9px] text-gray-400">Page Background</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3">
            <div className="flex gap-1">{THEMES.map(t => (<button key={t.name} onClick={() => setPageBg(t.bg)} className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition-transform flex flex-col overflow-hidden" title={t.name}><div className="flex-1" style={{ backgroundColor: t.accent }}></div><div className="flex-1" style={{ backgroundColor: t.bg }}></div></button>))}</div>
            <span className="text-[9px] text-gray-400">Themes</span>
          </div>
        </div>
      );
      case "format": return (
        <div className="flex items-center gap-1 h-full">
          {selectedEl ? (<>
            <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
              <div className="flex gap-1 items-center"><label className="text-[10px] text-gray-500">X</label><input type="number" value={Math.round(selectedEl.x)} onChange={e => { updateEl(selected!, { x: +e.target.value }); commitUpdate(); }} className="w-12 text-xs border rounded px-1 py-0.5"/><label className="text-[10px] text-gray-500">Y</label><input type="number" value={Math.round(selectedEl.y)} onChange={e => { updateEl(selected!, { y: +e.target.value }); commitUpdate(); }} className="w-12 text-xs border rounded px-1 py-0.5"/><label className="text-[10px] text-gray-500">W</label><input type="number" value={Math.round(selectedEl.width)} onChange={e => { updateEl(selected!, { width: +e.target.value }); commitUpdate(); }} className="w-12 text-xs border rounded px-1 py-0.5"/><label className="text-[10px] text-gray-500">H</label><input type="number" value={Math.round(selectedEl.height)} onChange={e => { updateEl(selected!, { height: +e.target.value }); commitUpdate(); }} className="w-12 text-xs border rounded px-1 py-0.5"/></div>
              <span className="text-[9px] text-gray-400">Position & Size</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
              <div className="flex gap-2 items-center">
                <AdvancedColorPicker value={selectedEl.fill || "transparent"} onChange={c => { updateEl(selected!, { fill: c }); commitUpdate(); }} label="Fill" />
                <AdvancedColorPicker value={selectedEl.stroke || "#000000"} onChange={c => { updateEl(selected!, { stroke: c }); commitUpdate(); }} label="Stroke" />
                <div className="flex flex-col"><span className="text-[10px] text-gray-500">SW</span><input type="range" min="0" max="10" value={selectedEl.strokeWidth || 2} onChange={e => { updateEl(selected!, { strokeWidth: +e.target.value }); commitUpdate(); }} className="w-14 h-3"/></div>
                <div className="flex flex-col"><span className="text-[10px] text-gray-500">Opacity</span><input type="range" min="0" max="100" value={(selectedEl.opacity || 1) * 100} onChange={e => { updateEl(selected!, { opacity: +e.target.value / 100 }); commitUpdate(); }} className="w-14 h-3"/></div>
                <div className="flex flex-col"><span className="text-[10px] text-gray-500">Rot°</span><input type="number" value={selectedEl.rotation || 0} onChange={e => { updateEl(selected!, { rotation: +e.target.value }); commitUpdate(); }} className="w-10 text-xs border rounded px-1 py-0.5"/></div>
              </div>
              <span className="text-[9px] text-gray-400">Appearance</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-3">
              <div className="flex gap-0.5"><button onClick={bringToFront} className="p-1 hover:bg-blue-50 rounded"><ArrowUpToLine size={13}/></button><button onClick={sendToBack} className="p-1 hover:bg-blue-50 rounded"><ArrowDownToLine size={13}/></button><button onClick={deleteSelected} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={13}/></button></div>
              <span className="text-[9px] text-gray-400">Arrange</span>
            </div>
          </>) : <p className="text-xs text-gray-400 px-4">Select an element to format</p>}
        </div>
      );
      case "page": return (
        <div className="flex items-center gap-1 h-full">
          <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
            <select value={templateType} onChange={e => setTemplateType(e.target.value)} className="text-xs border rounded px-2 py-1">
              <option value="certificate">Certificate</option><option value="id-card">ID Card</option><option value="report-card">Report Card</option><option value="admit-card">Admit Card</option><option value="notification">Notification</option><option value="custom">Custom</option>
            </select>
            <span className="text-[9px] text-gray-400">Template Type</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
            <div className="flex gap-1 items-center"><select onChange={e => { const p = PAGE_PRESETS[+e.target.value]; if (p.w) { setPageWidth(p.w); setPageHeight(p.h); }}} className="text-xs border rounded px-1 py-0.5 w-28">{PAGE_PRESETS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}</select><input type="number" value={pageWidth} onChange={e => setPageWidth(+e.target.value)} className="w-14 text-xs border rounded px-1 py-0.5"/> x <input type="number" value={pageHeight} onChange={e => setPageHeight(+e.target.value)} className="w-14 text-xs border rounded px-1 py-0.5"/></div>
            <span className="text-[9px] text-gray-400">Page Size</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 border-r border-gray-200">
            <div className="flex gap-2 items-center"><label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="w-3 h-3"/><Grid3X3 size={13}/>Grid</label><label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} className="w-3 h-3"/><Magnet size={13}/>Snap</label></div>
            <span className="text-[9px] text-gray-400">Grid & Snap</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3">
            <div className="flex gap-1">
              <button onClick={() => setShowPreview(true)} className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-blue-50" title="Preview"><Eye size={13}/> Preview</button>
              <button onClick={handlePrint} className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-blue-50" title="Print"><Printer size={13}/> Print</button>
            </div>
            <span className="text-[9px] text-gray-400">Preview & Print</span>
          </div>
        </div>
      );
      case "ai": return (
        <div className="flex items-center gap-3 h-full px-3 py-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex gap-1">
              {["certificate","id-card","report-card","admit-card","notification","custom"].map(t => (
                <button key={t} onClick={() => handleAiTypeChange(t)} className={`px-2.5 py-1 text-xs rounded font-medium ${aiType === t ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t.replace("-"," ").replace(/\b\w/g, l => l.toUpperCase())}</button>
              ))}
            </div>
            <span className="text-[9px] text-gray-400">Template Type (auto-resizes canvas)</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <select value={aiStyle} onChange={e => setAiStyle(e.target.value)} className="text-xs border rounded px-2 py-1">
              {["Professional","Modern","Classic","Minimalist","Colorful"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-[9px] text-gray-400">Style</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <input
              value={aiDescription} onChange={e => setAiDescription(e.target.value)}
              placeholder="Describe your design... (e.g. blue theme, school name on top, photo on left)"
              className="text-xs border border-purple-200 rounded-lg px-3 py-1.5 w-72 focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-gray-400"
            />
            <span className="text-[9px] text-gray-400">Description (optional)</span>
          </div>
          <button onClick={handleAIGenerate} disabled={aiGenerating} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 shadow-md">
            {aiGenerating ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
            {aiGenerating ? "Generating..." : "AI Generate"}
          </button>
        </div>
      );
    }
  };

  // ═══ RENDER ═══
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-100"><Loader2 size={32} className="animate-spin text-blue-600"/></div>;
  const scale = zoom / 100;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden select-none">
      {/* TITLE BAR */}
      <div className="h-10 bg-[#1e3a5f] flex items-center justify-between px-3">
        <div className="flex items-center gap-2"><button onClick={() => navigate("/")} className="p-1 hover:bg-white/10 rounded text-white"><ArrowLeft size={16}/></button><input value={templateName} onChange={e => setTemplateName(e.target.value)} className="text-sm font-medium text-white bg-transparent border-none outline-none w-60"/></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowShortcutsHelp(true)} className="p-1 hover:bg-white/10 rounded text-white/70 text-xs font-bold" title="Keyboard Shortcuts (F1)">?</button>
          <button onClick={() => setShowPreview(true)} className="p-1 hover:bg-white/10 rounded text-white/70" title="Preview"><Eye size={14}/></button>
          <button onClick={handlePrint} className="p-1 hover:bg-white/10 rounded text-white/70" title="Print"><Printer size={14}/></button>
          <button onClick={undo} className="p-1 hover:bg-white/10 rounded text-white/70"><Undo2 size={14}/></button>
          <button onClick={redo} className="p-1 hover:bg-white/10 rounded text-white/70"><Redo2 size={14}/></button>
          <button onClick={saveTemplate} disabled={saving} className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded">{saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Save</button>
        </div>
      </div>
      {/* RIBBON - Tabs are always visible, content below */}
      <div className="bg-[#f8f9fa] border-b border-gray-200">
        <div className="flex h-7 items-end px-2 gap-0.5">
          {(["home","insert","design","format","page","ai"] as RibbonTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1 text-xs font-medium rounded-t transition-colors ${tab === "ai" ? (activeTab === tab ? "bg-white border border-b-0 border-purple-300 text-purple-700" : "text-purple-600 hover:text-purple-800 hover:bg-purple-50") : (activeTab === tab ? "bg-white border border-b-0 border-gray-200 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100")}`}>
              {tab === "ai" ? <span className="flex items-center gap-1"><Sparkles size={11}/>AI Generate</span> : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="min-h-[64px] bg-white border-b border-gray-200 px-3 flex items-center overflow-x-auto">{renderRibbon()}</div>
      </div>
      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto flex items-start justify-center p-6 bg-[#e8e8e8]" style={{ backgroundImage: "radial-gradient(circle, #ccc 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
            <div className="shadow-2xl relative">
              <canvas ref={canvasRef} width={pageWidth} height={pageHeight} className={`block ${dragging?.handle ? (dragging.handle === "nw" || dragging.handle === "se" ? "cursor-nwse-resize" : dragging.handle === "ne" || dragging.handle === "sw" ? "cursor-nesw-resize" : dragging.handle === "n" || dragging.handle === "s" ? "cursor-ns-resize" : "cursor-ew-resize") : "cursor-crosshair"}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onDoubleClick={handleDoubleClick} onContextMenu={handleContextMenu}/>
              {editingText && (() => { const el = elements.find(e => e.id === editingText); if (!el) return null; return (<textarea autoFocus value={el.text || ""} onChange={e => updateEl(editingText, { text: e.target.value })} onBlur={() => { setEditingText(null); commitUpdate(); }} onKeyDown={e => { if (e.key === "Escape") { setEditingText(null); commitUpdate(); }}} className="absolute border-2 border-blue-400 bg-white/90 px-1 outline-none resize-none" style={{ left: el.x * scale, top: el.y * scale, fontSize: (el.fontSize || 18) * scale, fontFamily: el.fontFamily, width: el.width * scale, minHeight: el.height * scale }}/>); })()}
            </div>
          </div>
        </div>
        {/* RIGHT PANEL */}
        <div className="w-52 bg-white border-l overflow-y-auto">
          {selectedEl && (<div className="p-3 border-b"><h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Properties</h3><div className="grid grid-cols-2 gap-1"><div><label className="text-[9px] text-gray-400">X</label><input type="number" value={Math.round(selectedEl.x)} onChange={e => updateEl(selected!, { x: +e.target.value })} onBlur={commitUpdate} className="w-full text-xs border rounded px-1 py-0.5"/></div><div><label className="text-[9px] text-gray-400">Y</label><input type="number" value={Math.round(selectedEl.y)} onChange={e => updateEl(selected!, { y: +e.target.value })} onBlur={commitUpdate} className="w-full text-xs border rounded px-1 py-0.5"/></div><div><label className="text-[9px] text-gray-400">W</label><input type="number" value={Math.round(selectedEl.width)} onChange={e => updateEl(selected!, { width: +e.target.value })} onBlur={commitUpdate} className="w-full text-xs border rounded px-1 py-0.5"/></div><div><label className="text-[9px] text-gray-400">H</label><input type="number" value={Math.round(selectedEl.height)} onChange={e => updateEl(selected!, { height: +e.target.value })} onBlur={commitUpdate} className="w-full text-xs border rounded px-1 py-0.5"/></div></div>{(selectedEl.type === "text" || selectedEl.type === "field") && (<div className="mt-2"><label className="text-[9px] text-gray-400">Text</label><textarea value={selectedEl.text || ""} onChange={e => updateEl(selected!, { text: e.target.value })} onBlur={commitUpdate} className="w-full text-xs border rounded px-1 py-0.5 min-h-[40px] resize-y"/></div>)}</div>)}
          <div className="p-3"><h3 className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Tag size={10}/> DB Fields</h3><p className="text-[10px] text-gray-400 mb-2">Click to insert</p>{Object.entries(DB_FIELDS).map(([cat, fields]) => (<div key={cat} className="mb-2"><p className="text-[9px] font-semibold text-gray-500 uppercase mb-0.5">{cat}</p><div className="space-y-0.5">{fields.map(f => (<button key={f} onClick={() => addElement({ type: "field", text: `{{${f}}}`, width: 180, height: 22, fontSize: 14, color: "#6366f1" })} className="w-full text-left px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-mono truncate">{`{{${f}}}`}</button>))}</div></div>))}</div>
        </div>
      </div>
      {/* STATUS BAR */}
      <div className="h-6 bg-[#1e3a5f] flex items-center justify-between px-3 text-[10px] text-white/70">
        <div className="flex items-center gap-4"><span>Elements: {elements.length}</span>{selectedEl && <span>Selected: {selectedEl.type}</span>}</div>
        <div className="flex items-center gap-2"><span>{pageWidth} × {pageHeight}</span><button onClick={() => setZoom(z => Math.max(25, z - 10))} className="hover:text-white"><ZoomOut size={12}/></button><span className="w-8 text-center">{zoom}%</span><button onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:text-white"><ZoomIn size={12}/></button></div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
      <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setPageBg(`url(${ev.target?.result})`); r.readAsDataURL(f); }}}/>
      
      
      {/* SHAPES PANEL - PowerPoint Style */}
      {showShapesPanel && (
        <>
          <div className="fixed inset-0 z-[9980]" onClick={() => setShowShapesPanel(false)} />
          <div className="fixed z-[9981] top-28 left-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[480px] max-h-[75vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-sm">Shapes</h3><button onClick={() => setShowShapesPanel(false)} className="p-1 hover:bg-gray-100 rounded"><X size={14}/></button></div>
            
            {/* Lines */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 mt-2">Lines</p>
            <div className="flex flex-wrap gap-1 mb-2">
              <button onClick={() => { addElement({ type: "line", width: 200, height: 3, stroke: "#000", strokeWidth: 2 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Line"><div className="w-6 h-0.5 bg-gray-700"></div></button>
              <button onClick={() => { addElement({ type: "line", width: 200, height: 3, stroke: "#000", strokeWidth: 4 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Thick Line"><div className="w-6 h-1 bg-gray-700"></div></button>
              <button onClick={() => { addElement({ type: "line", width: 200, height: 3, stroke: "#000", strokeWidth: 1 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Thin Line"><div className="w-6 border-t border-gray-700"></div></button>
              <button onClick={() => { addElement({ type: "line", width: 200, height: 3, stroke: "#000", strokeWidth: 2 }); addElement({ type: "line", x: 80, y: 90, width: 200, height: 3, stroke: "#000", strokeWidth: 2 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Double Line"><div className="flex flex-col gap-0.5"><div className="w-6 h-0.5 bg-gray-700"></div><div className="w-6 h-0.5 bg-gray-700"></div></div></button>
              <button onClick={() => { addElement({ type: "arrow", width: 150, height: 40, fill: "#374151", stroke: "#000" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Arrow">→</button>
            </div>

            {/* Rectangles */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 mt-2">Rectangles</p>
            <div className="flex flex-wrap gap-1 mb-2">
              <button onClick={() => { addElement({ type: "rect", width: 150, height: 100 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Rectangle"><div className="w-6 h-4 border-2 border-gray-600"></div></button>
              <button onClick={() => { addElement({ type: "rect", width: 150, height: 100, borderRadius: 8 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Rounded Rectangle"><div className="w-6 h-4 border-2 border-gray-600 rounded"></div></button>
              <button onClick={() => { addElement({ type: "rect", width: 150, height: 100, borderRadius: 20 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Pill Shape"><div className="w-7 h-3 border-2 border-gray-600 rounded-full"></div></button>
              <button onClick={() => { addElement({ type: "rect", width: 100, height: 100 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Square"><div className="w-5 h-5 border-2 border-gray-600"></div></button>
              <button onClick={() => { addElement({ type: "rect", width: 100, height: 100, borderRadius: 50 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Rounded Square"><div className="w-5 h-5 border-2 border-gray-600 rounded-lg"></div></button>
            </div>

            {/* Basic Shapes */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 mt-2">Basic Shapes</p>
            <div className="flex flex-wrap gap-1 mb-2">
              <button onClick={() => { addElement({ type: "circle", width: 100, height: 100 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Circle"><div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div></button>
              <button onClick={() => { addElement({ type: "circle", width: 150, height: 80 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Oval"><div className="w-7 h-4 border-2 border-gray-600 rounded-full"></div></button>
              <button onClick={() => { addElement({ type: "triangle", width: 120, height: 100 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Triangle">△</button>
              <button onClick={() => { addElement({ type: "triangle", width: 120, height: 100, rotation: 180 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Inverted Triangle">▽</button>
              <button onClick={() => { addElement({ type: "diamond", width: 100, height: 120 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Diamond">◇</button>
              <button onClick={() => { addElement({ type: "pentagon", width: 100, height: 100 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Pentagon">⬠</button>
              <button onClick={() => { addElement({ type: "hexagon", width: 100, height: 100 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Hexagon">⬡</button>
              <button onClick={() => { addElement({ type: "heart", width: 80, height: 80, fill: "#ef4444", stroke: "#dc2626" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Heart">♥</button>
              <button onClick={() => { addElement({ type: "circle", width: 80, height: 80, fill: "transparent", stroke: "#000", strokeWidth: 8 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Ring">◎</button>
              <button onClick={() => { addElement({ type: "rect", width: 80, height: 100, fill: "transparent", stroke: "#000", strokeWidth: 2 }); addElement({ type: "line", x: 80, y: 130, width: 80, height: 2, stroke: "#000" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Cross">✚</button>
            </div>

            {/* Stars & Banners */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 mt-2">Stars & Banners</p>
            <div className="flex flex-wrap gap-1 mb-2">
              <button onClick={() => { addElement({ type: "star", width: 80, height: 80, fill: "#fbbf24", stroke: "#d97706" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Star">★</button>
              <button onClick={() => { addElement({ type: "star", width: 100, height: 100, fill: "#fbbf24", stroke: "#d97706" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Large Star">⭐</button>
              <button onClick={() => { addElement({ type: "star", width: 60, height: 60, fill: "#f97316", stroke: "#ea580c" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center text-xs" title="Small Star">✦</button>
              <button onClick={() => { addElement({ type: "rect", width: 200, height: 40, fill: "#1e40af", stroke: "transparent", borderRadius: 4 }); addElement({ type: "text", x: 80, y: 88, width: 200, height: 30, text: "BANNER", fontSize: 16, fontWeight: "bold", color: "#ffffff", textAlign: "center" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center text-xs" title="Banner">🏷️</button>
              <button onClick={() => { addElement({ type: "rect", width: 160, height: 35, fill: "#dc2626", stroke: "transparent", borderRadius: 20 }); addElement({ type: "text", x: 80, y: 86, width: 160, height: 25, text: "RIBBON", fontSize: 13, fontWeight: "bold", color: "#ffffff", textAlign: "center" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center text-xs" title="Ribbon">🎀</button>
            </div>

            {/* Block Arrows */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 mt-2">Block Arrows</p>
            <div className="flex flex-wrap gap-1 mb-2">
              <button onClick={() => { addElement({ type: "arrow", width: 150, height: 60, fill: "#3b82f6", stroke: "#1d4ed8" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Right Arrow">➡</button>
              <button onClick={() => { addElement({ type: "arrow", width: 150, height: 60, fill: "#3b82f6", stroke: "#1d4ed8", rotation: 180 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Left Arrow">⬅</button>
              <button onClick={() => { addElement({ type: "arrow", width: 60, height: 150, fill: "#10b981", stroke: "#059669", rotation: -90 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Up Arrow">⬆</button>
              <button onClick={() => { addElement({ type: "arrow", width: 60, height: 150, fill: "#ef4444", stroke: "#dc2626", rotation: 90 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Down Arrow">⬇</button>
              <button onClick={() => { addElement({ type: "arrow", width: 100, height: 40, fill: "#6366f1", stroke: "#4f46e5" }); addElement({ type: "arrow", x: 80, y: 130, width: 100, height: 40, fill: "#6366f1", stroke: "#4f46e5", rotation: 180 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Double Arrow">↔</button>
            </div>

            {/* Flowchart */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 mt-2">Flowchart</p>
            <div className="flex flex-wrap gap-1 mb-2">
              <button onClick={() => { addElement({ type: "rect", width: 140, height: 60, fill: "#dbeafe", stroke: "#3b82f6", borderRadius: 4 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Process"><div className="w-6 h-3 border border-blue-500 bg-blue-100"></div></button>
              <button onClick={() => { addElement({ type: "diamond", width: 100, height: 100, fill: "#fef3c7", stroke: "#f59e0b" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Decision">◆</button>
              <button onClick={() => { addElement({ type: "rect", width: 140, height: 50, fill: "#dcfce7", stroke: "#22c55e", borderRadius: 25 }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Start/End"><div className="w-6 h-3 border border-green-500 bg-green-100 rounded-full"></div></button>
              <button onClick={() => { addElement({ type: "rect", width: 120, height: 80, fill: "#fce7f3", stroke: "#ec4899" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Data"><div className="w-5 h-4 border border-pink-500 bg-pink-100 skew-x-[-10deg]"></div></button>
              <button onClick={() => { addElement({ type: "circle", width: 60, height: 60, fill: "#e0e7ff", stroke: "#6366f1" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Connector"><div className="w-4 h-4 border border-indigo-500 bg-indigo-100 rounded-full"></div></button>
            </div>

            {/* Callouts */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 mt-2">Callouts & Speech</p>
            <div className="flex flex-wrap gap-1 mb-2">
              <button onClick={() => { addElement({ type: "rect", width: 180, height: 80, fill: "#fffbeb", stroke: "#f59e0b", borderRadius: 12 }); addElement({ type: "text", x: 80, y: 95, width: 180, height: 20, text: "Callout text here", fontSize: 12, color: "#92400e", textAlign: "center" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Callout">💬</button>
              <button onClick={() => { addElement({ type: "rect", width: 180, height: 80, fill: "#f0fdf4", stroke: "#22c55e", borderRadius: 16 }); addElement({ type: "text", x: 80, y: 95, width: 180, height: 20, text: "Note", fontSize: 12, color: "#166534", textAlign: "center" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Note">📝</button>
              <button onClick={() => { addElement({ type: "circle", width: 50, height: 50, fill: "#fef2f2", stroke: "#ef4444", strokeWidth: 3 }); addElement({ type: "text", x: 80, y: 93, width: 50, height: 30, text: "!", fontSize: 24, fontWeight: "bold", color: "#ef4444", textAlign: "center" }); setShowShapesPanel(false); }} className="w-9 h-9 border rounded hover:bg-blue-50 flex items-center justify-center" title="Alert">⚠️</button>
            </div>
          </div>
        </>
      )}

{/* WORD ART PANEL */}
      {showWordArtPanel && (
        <>
          <div className="fixed inset-0 z-[9980]" onClick={() => setShowWordArtPanel(false)} />
          <div className="fixed z-[9981] top-32 left-40 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[420px]">
            <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-sm">Word Art Styles</h3><button onClick={() => setShowWordArtPanel(false)} className="p-1 hover:bg-gray-100 rounded"><X size={14}/></button></div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { text: "WordArt", font: "Impact", size: 36, color: "#1e40af", stroke: "#1e3a5f", style: "Shadow Blue" },
                { text: "WordArt", font: "Georgia", size: 36, color: "#b45309", stroke: "#78350f", style: "Gold Classic" },
                { text: "WordArt", font: "Arial", size: 36, color: "#059669", stroke: "#064e3b", style: "Green Modern" },
                { text: "WordArt", font: "Poppins", size: 36, color: "#7c3aed", stroke: "#5b21b6", style: "Purple Bold" },
                { text: "WordArt", font: "Playfair Display", size: 36, color: "#dc2626", stroke: "#7f1d1d", style: "Red Elegant" },
                { text: "WordArt", font: "Lobster", size: 36, color: "#0891b2", stroke: "#164e63", style: "Teal Script" },
                { text: "WordArt", font: "Bebas Neue", size: 42, color: "#000000", stroke: "#374151", style: "Black Bold" },
                { text: "WordArt", font: "Oswald", size: 36, color: "#ea580c", stroke: "#9a3412", style: "Orange Strong" },
                { text: "WordArt", font: "Dancing Script", size: 36, color: "#be185d", stroke: "#9d174d", style: "Pink Script" },
                { text: "WordArt", font: "Montserrat", size: 36, color: "#4f46e5", stroke: "#3730a3", style: "Indigo Clean" },
                { text: "WordArt", font: "Raleway", size: 36, color: "#059669", stroke: "#047857", style: "Outline" },
                { text: "WordArt", font: "Pacifico", size: 32, color: "#f59e0b", stroke: "#d97706", style: "Fun Yellow" },
              ].map((wa, i) => (
                <button key={i} onClick={() => { addElement({ type: "text", text: "Your Text", width: 300, height: 50, fontSize: wa.size, fontFamily: wa.font, fontWeight: "bold", color: wa.color, textAlign: "center" }); setShowWordArtPanel(false); }} className="p-2 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all" title={wa.style}>
                  <span style={{ fontFamily: wa.font, fontSize: "14px", color: wa.color, fontWeight: "bold" }}>Abc</span>
                  <p className="text-[8px] text-gray-400 mt-0.5">{wa.style}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* BORDERS PANEL - 50+ Border Styles */}
      {showBordersPanel && (
        <>
          <div className="fixed inset-0 z-[9980]" onClick={() => setShowBordersPanel(false)} />
          <div className="fixed z-[9981] top-28 right-20 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[520px] max-h-[75vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-sm">Borders & Frames (Click to Apply)</h3><button onClick={() => setShowBordersPanel(false)} className="p-1 hover:bg-gray-100 rounded"><X size={14}/></button></div>
            
            {/* Simple Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Simple Borders</p>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {[
                { name: "Thin", s: "#000000", w: 1 },
                { name: "Medium", s: "#000000", w: 2 },
                { name: "Thick", s: "#000000", w: 3 },
                { name: "Extra Thick", s: "#000000", w: 5 },
                { name: "Blue Thin", s: "#1e40af", w: 2 },
                { name: "Blue Thick", s: "#1e40af", w: 4 },
                { name: "Red", s: "#dc2626", w: 2 },
                { name: "Red Thick", s: "#dc2626", w: 4 },
                { name: "Green", s: "#16a34a", w: 2 },
                { name: "Green Thick", s: "#16a34a", w: 4 },
                { name: "Gold", s: "#b45309", w: 2 },
                { name: "Gold Thick", s: "#b45309", w: 4 },
                { name: "Purple", s: "#7c3aed", w: 2 },
                { name: "Purple Thick", s: "#7c3aed", w: 4 },
                { name: "Gray", s: "#6b7280", w: 2 },
                { name: "Gray Thick", s: "#6b7280", w: 4 },
                { name: "Navy", s: "#1e3a5f", w: 3 },
                { name: "Maroon", s: "#7f1d1d", w: 3 },
              ].map((b, i) => (
                <button key={i} onClick={() => { addElement({ type: "rect", x: 15, y: 15, width: pageWidth - 30, height: pageHeight - 30, stroke: b.s, strokeWidth: b.w, fill: "transparent" }); setShowBordersPanel(false); }} className="h-12 border rounded hover:bg-blue-50 flex items-center justify-center p-1" title={b.name}><div className="w-full h-full border-2 rounded" style={{ borderColor: b.s, borderWidth: `${Math.min(b.w, 3)}px` }}></div></button>
              ))}
            </div>

            {/* Double Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Double Borders</p>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {[
                { name: "Double Black", s: "#000000", w1: 2, w2: 1, gap: 8 },
                { name: "Double Blue", s: "#1e40af", w1: 3, w2: 1, gap: 10 },
                { name: "Double Gold", s: "#b45309", w1: 3, w2: 1, gap: 10 },
                { name: "Double Red", s: "#dc2626", w1: 2, w2: 1, gap: 8 },
                { name: "Double Green", s: "#16a34a", w1: 2, w2: 1, gap: 8 },
                { name: "Double Purple", s: "#7c3aed", w1: 3, w2: 1, gap: 10 },
                { name: "Classic Frame", s: "#000000", w1: 4, w2: 1, gap: 12 },
                { name: "Elegant Blue", s: "#1e3a5f", w1: 4, w2: 2, gap: 12 },
                { name: "Royal Gold", s: "#92400e", w1: 4, w2: 2, gap: 14 },
                { name: "Premium Black", s: "#111827", w1: 5, w2: 2, gap: 15 },
                { name: "Navy Double", s: "#1e3a5f", w1: 3, w2: 1, gap: 8 },
                { name: "Bronze", s: "#78350f", w1: 3, w2: 1, gap: 10 },
              ].map((b, i) => (
                <button key={i} onClick={() => { addElement({ type: "rect", x: 15, y: 15, width: pageWidth - 30, height: pageHeight - 30, stroke: b.s, strokeWidth: b.w1, fill: "transparent" }); addElement({ type: "rect", x: 15 + b.gap, y: 15 + b.gap, width: pageWidth - 30 - b.gap * 2, height: pageHeight - 30 - b.gap * 2, stroke: b.s, strokeWidth: b.w2, fill: "transparent" }); setShowBordersPanel(false); }} className="h-12 border rounded hover:bg-blue-50 flex items-center justify-center p-1" title={b.name}><div className="w-full h-full border-2 rounded relative" style={{ borderColor: b.s }}><div className="absolute inset-1 border rounded" style={{ borderColor: b.s }}></div></div></button>
              ))}
            </div>

            {/* Triple & Decorative Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Triple & Decorative</p>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {[
                { name: "Triple Black", s: "#000000" },
                { name: "Triple Blue", s: "#1e40af" },
                { name: "Triple Gold", s: "#b45309" },
                { name: "Triple Green", s: "#16a34a" },
                { name: "Triple Red", s: "#dc2626" },
                { name: "Triple Navy", s: "#1e3a5f" },
              ].map((b, i) => (
                <button key={i} onClick={() => { addElement({ type: "rect", x: 10, y: 10, width: pageWidth - 20, height: pageHeight - 20, stroke: b.s, strokeWidth: 3, fill: "transparent" }); addElement({ type: "rect", x: 20, y: 20, width: pageWidth - 40, height: pageHeight - 40, stroke: b.s, strokeWidth: 1, fill: "transparent" }); addElement({ type: "rect", x: 28, y: 28, width: pageWidth - 56, height: pageHeight - 56, stroke: b.s, strokeWidth: 2, fill: "transparent" }); setShowBordersPanel(false); }} className="h-12 border rounded hover:bg-blue-50 flex items-center justify-center p-1" title={b.name}><div className="w-full h-full border-2 rounded relative" style={{ borderColor: b.s }}><div className="absolute inset-0.5 border rounded" style={{ borderColor: b.s }}><div className="absolute inset-0.5 border rounded" style={{ borderColor: b.s }}></div></div></div></button>
              ))}
            </div>

            {/* Rounded Corner Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Rounded Borders</p>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {[
                { name: "Rounded Black", s: "#000000", r: 15, w: 2 },
                { name: "Rounded Blue", s: "#1e40af", r: 15, w: 3 },
                { name: "Rounded Gold", s: "#b45309", r: 20, w: 3 },
                { name: "Rounded Red", s: "#dc2626", r: 12, w: 2 },
                { name: "Rounded Green", s: "#16a34a", r: 20, w: 3 },
                { name: "Rounded Purple", s: "#7c3aed", r: 15, w: 3 },
                { name: "Pill Black", s: "#000000", r: 30, w: 2 },
                { name: "Pill Blue", s: "#1e40af", r: 30, w: 3 },
                { name: "Pill Gold", s: "#b45309", r: 30, w: 3 },
                { name: "Pill Green", s: "#16a34a", r: 30, w: 2 },
                { name: "Soft Gray", s: "#9ca3af", r: 20, w: 1 },
                { name: "Soft Blue", s: "#93c5fd", r: 20, w: 2 },
              ].map((b, i) => (
                <button key={i} onClick={() => { addElement({ type: "rect", x: 20, y: 20, width: pageWidth - 40, height: pageHeight - 40, stroke: b.s, strokeWidth: b.w, fill: "transparent", borderRadius: b.r }); setShowBordersPanel(false); }} className="h-12 border rounded hover:bg-blue-50 flex items-center justify-center p-1" title={b.name}><div className="w-full h-full rounded-lg border-2" style={{ borderColor: b.s }}></div></button>
              ))}
            </div>

            {/* Certificate Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Certificate Borders</p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { name: "Classic Certificate", s1: "#b45309", s2: "#d97706", w1: 4, w2: 1 },
                { name: "Formal Blue", s1: "#1e3a5f", s2: "#3b82f6", w1: 4, w2: 2 },
                { name: "Elegant Black", s1: "#000000", s2: "#6b7280", w1: 5, w2: 1 },
                { name: "Royal Purple", s1: "#5b21b6", s2: "#8b5cf6", w1: 4, w2: 2 },
              ].map((b, i) => (
                <button key={i} onClick={() => { addElement({ type: "rect", x: 15, y: 15, width: pageWidth - 30, height: pageHeight - 30, stroke: b.s1, strokeWidth: b.w1, fill: "transparent" }); addElement({ type: "rect", x: 30, y: 30, width: pageWidth - 60, height: pageHeight - 60, stroke: b.s2, strokeWidth: b.w2, fill: "transparent" }); addElement({ type: "rect", x: 25, y: 25, width: 20, height: 20, fill: b.s1, stroke: "transparent" }); addElement({ type: "rect", x: pageWidth - 45, y: 25, width: 20, height: 20, fill: b.s1, stroke: "transparent" }); addElement({ type: "rect", x: 25, y: pageHeight - 45, width: 20, height: 20, fill: b.s1, stroke: "transparent" }); addElement({ type: "rect", x: pageWidth - 45, y: pageHeight - 45, width: 20, height: 20, fill: b.s1, stroke: "transparent" }); setShowBordersPanel(false); }} className="h-14 border rounded hover:bg-blue-50 flex flex-col items-center justify-center p-1" title={b.name}><div className="w-full h-full border-2 rounded relative" style={{ borderColor: b.s1 }}><div className="absolute inset-1 border" style={{ borderColor: b.s2 }}></div></div><span className="text-[7px] text-gray-500 mt-0.5">{b.name}</span></button>
              ))}
            </div>

            {/* Star Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Star & Corner Borders</p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { name: "Star Corners Gold", color: "#b45309", emoji: "★" },
                { name: "Star Corners Blue", color: "#1e40af", emoji: "★" },
                { name: "Star Corners Red", color: "#dc2626", emoji: "★" },
                { name: "Star Corners Purple", color: "#7c3aed", emoji: "★" },
                { name: "Diamond Corners Gold", color: "#b45309", emoji: "◆" },
                { name: "Diamond Corners Blue", color: "#1e40af", emoji: "◆" },
                { name: "Heart Corners Red", color: "#dc2626", emoji: "♥" },
                { name: "Heart Corners Pink", color: "#ec4899", emoji: "♥" },
              ].map((b, i) => (
                <button key={i} onClick={() => {
                  batchAdd([
                    { type: "rect", x: 20, y: 20, width: pageWidth - 40, height: pageHeight - 40, stroke: b.color, strokeWidth: 3, fill: "transparent" },
                    { type: "text", x: 12, y: 5, width: 30, height: 30, text: b.emoji, fontSize: 22, color: b.color, textAlign: "center" },
                    { type: "text", x: pageWidth - 42, y: 5, width: 30, height: 30, text: b.emoji, fontSize: 22, color: b.color, textAlign: "center" },
                    { type: "text", x: 12, y: pageHeight - 38, width: 30, height: 30, text: b.emoji, fontSize: 22, color: b.color, textAlign: "center" },
                    { type: "text", x: pageWidth - 42, y: pageHeight - 38, width: 30, height: 30, text: b.emoji, fontSize: 22, color: b.color, textAlign: "center" },
                  ]);
                  setShowBordersPanel(false);
                }} className="h-14 border rounded hover:bg-blue-50 flex flex-col items-center justify-center p-1" title={b.name}>
                  <div className="w-full h-full border-2 rounded relative" style={{ borderColor: b.color }}>
                    <span className="absolute -top-1 -left-0.5 text-[10px]" style={{ color: b.color }}>{b.emoji}</span>
                    <span className="absolute -top-1 -right-0.5 text-[10px]" style={{ color: b.color }}>{b.emoji}</span>
                    <span className="absolute -bottom-1 -left-0.5 text-[10px]" style={{ color: b.color }}>{b.emoji}</span>
                    <span className="absolute -bottom-1 -right-0.5 text-[10px]" style={{ color: b.color }}>{b.emoji}</span>
                  </div>
                  <span className="text-[7px] text-gray-500 mt-0.5">{b.name.split(" ").slice(0,2).join(" ")}</span>
                </button>
              ))}
            </div>

            {/* Emoji Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Emoji & Fun Borders</p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { name: "Flower Border", emoji: "🌸", lineColor: "#ec4899" },
                { name: "Leaf Border", emoji: "🍃", lineColor: "#16a34a" },
                { name: "Star Sparkle", emoji: "✨", lineColor: "#f59e0b" },
                { name: "Music Notes", emoji: "🎵", lineColor: "#6366f1" },
                { name: "Books", emoji: "📚", lineColor: "#92400e" },
                { name: "Pencil", emoji: "✏️", lineColor: "#f97316" },
                { name: "Trophy", emoji: "🏆", lineColor: "#b45309" },
                { name: "Medal", emoji: "🎖️", lineColor: "#1e40af" },
                { name: "Rainbow", emoji: "🌈", lineColor: "#7c3aed" },
                { name: "Ribbon", emoji: "🎀", lineColor: "#ec4899" },
                { name: "Crown", emoji: "👑", lineColor: "#b45309" },
                { name: "Graduation", emoji: "🎓", lineColor: "#1e3a5f" },
              ].map((b, i) => (
                <button key={i} onClick={() => {
                  batchAdd([
                    { type: "rect", x: 20, y: 20, width: pageWidth - 40, height: pageHeight - 40, stroke: b.lineColor, strokeWidth: 2, fill: "transparent" },
                    { type: "text", x: pageWidth / 2 - 15, y: 3, width: 30, height: 30, text: b.emoji, fontSize: 20, textAlign: "center" },
                    { type: "text", x: 5, y: pageHeight / 2 - 15, width: 30, height: 30, text: b.emoji, fontSize: 20, textAlign: "center" },
                    { type: "text", x: pageWidth - 35, y: pageHeight / 2 - 15, width: 30, height: 30, text: b.emoji, fontSize: 20, textAlign: "center" },
                    { type: "text", x: pageWidth / 2 - 15, y: pageHeight - 35, width: 30, height: 30, text: b.emoji, fontSize: 20, textAlign: "center" },
                    { type: "text", x: 5, y: 3, width: 30, height: 30, text: b.emoji, fontSize: 20, textAlign: "center" },
                    { type: "text", x: pageWidth - 35, y: 3, width: 30, height: 30, text: b.emoji, fontSize: 20, textAlign: "center" },
                    { type: "text", x: 5, y: pageHeight - 35, width: 30, height: 30, text: b.emoji, fontSize: 20, textAlign: "center" },
                    { type: "text", x: pageWidth - 35, y: pageHeight - 35, width: 30, height: 30, text: b.emoji, fontSize: 20, textAlign: "center" },
                  ]);
                  setShowBordersPanel(false);
                }} className="h-14 border rounded hover:bg-blue-50 flex flex-col items-center justify-center p-1" title={b.name}>
                  <span className="text-lg">{b.emoji}</span>
                  <span className="text-[7px] text-gray-500">{b.name}</span>
                </button>
              ))}
            </div>

            {/* Stylish / Decorative Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Stylish & Decorative</p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { name: "Art Deco Gold", s1: "#b45309", s2: "#d97706", style: "deco" },
                { name: "Art Deco Blue", s1: "#1e3a5f", s2: "#3b82f6", style: "deco" },
                { name: "Ornate Red", s1: "#991b1b", s2: "#dc2626", style: "ornate" },
                { name: "Ornate Purple", s1: "#5b21b6", s2: "#8b5cf6", style: "ornate" },
                { name: "Fancy Green", s1: "#166534", s2: "#22c55e", style: "fancy" },
                { name: "Fancy Navy", s1: "#1e3a5f", s2: "#60a5fa", style: "fancy" },
                { name: "Victorian Gold", s1: "#78350f", s2: "#fbbf24", style: "victorian" },
                { name: "Victorian Black", s1: "#000000", s2: "#6b7280", style: "victorian" },
              ].map((b, i) => (
                <button key={i} onClick={() => {
                  // Outer thick border
                  addElement({ type: "rect", x: 10, y: 10, width: pageWidth - 20, height: pageHeight - 20, stroke: b.s1, strokeWidth: 4, fill: "transparent" });
                  // Middle decorative lines
                  addElement({ type: "rect", x: 18, y: 18, width: pageWidth - 36, height: pageHeight - 36, stroke: b.s2, strokeWidth: 1, fill: "transparent" });
                  // Inner border
                  addElement({ type: "rect", x: 30, y: 30, width: pageWidth - 60, height: pageHeight - 60, stroke: b.s1, strokeWidth: 2, fill: "transparent" });
                  // Corner decorations (small squares)
                  [{x: 10, y: 10}, {x: pageWidth-26, y: 10}, {x: 10, y: pageHeight-26}, {x: pageWidth-26, y: pageHeight-26}].forEach(pos => {
                    addElement({ type: "rect", x: pos.x, y: pos.y, width: 16, height: 16, fill: b.s1, stroke: b.s2, strokeWidth: 1 });
                  });
                  // Top & bottom center decorations
                  addElement({ type: "line", x: pageWidth/2 - 60, y: 22, width: 120, height: 2, stroke: b.s2, strokeWidth: 2 });
                  addElement({ type: "line", x: pageWidth/2 - 60, y: pageHeight - 24, width: 120, height: 2, stroke: b.s2, strokeWidth: 2 });
                  setShowBordersPanel(false);
                }} className="h-14 border rounded hover:bg-blue-50 flex flex-col items-center justify-center p-1" title={b.name}>
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 border-2 rounded" style={{ borderColor: b.s1 }}></div>
                    <div className="absolute inset-1 border rounded" style={{ borderColor: b.s2 }}></div>
                    <div className="absolute inset-[6px] border rounded" style={{ borderColor: b.s1 }}></div>
                  </div>
                  <span className="text-[7px] text-gray-500 mt-0.5">{b.name.split(" ").slice(0,2).join(" ")}</span>
                </button>
              ))}
            </div>

            {/* Gradient Fill Borders */}
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Colored Fill Borders</p>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {[
                { name: "Blue Header", fill: "#1e40af", pos: "top" },
                { name: "Green Header", fill: "#166534", pos: "top" },
                { name: "Red Header", fill: "#991b1b", pos: "top" },
                { name: "Gold Header", fill: "#78350f", pos: "top" },
                { name: "Purple Header", fill: "#5b21b6", pos: "top" },
                { name: "Navy Header", fill: "#1e3a5f", pos: "top" },
                { name: "Blue Footer", fill: "#1e40af", pos: "bottom" },
                { name: "Green Footer", fill: "#166534", pos: "bottom" },
                { name: "Blue Both", fill: "#1e40af", pos: "both" },
                { name: "Gold Both", fill: "#78350f", pos: "both" },
                { name: "Navy Both", fill: "#1e3a5f", pos: "both" },
                { name: "Purple Both", fill: "#5b21b6", pos: "both" },
              ].map((b, i) => (
                <button key={i} onClick={() => {
                  addElement({ type: "rect", x: 15, y: 15, width: pageWidth - 30, height: pageHeight - 30, stroke: b.fill, strokeWidth: 2, fill: "transparent" });
                  if (b.pos === "top" || b.pos === "both") {
                    addElement({ type: "rect", x: 0, y: 0, width: pageWidth, height: 60, fill: b.fill, stroke: "transparent" });
                  }
                  if (b.pos === "bottom" || b.pos === "both") {
                    addElement({ type: "rect", x: 0, y: pageHeight - 40, width: pageWidth, height: 40, fill: b.fill, stroke: "transparent" });
                  }
                  setShowBordersPanel(false);
                }} className="h-10 border rounded hover:bg-blue-50 flex items-center justify-center p-0.5" title={b.name}>
                  <div className="w-full h-full rounded overflow-hidden border border-gray-200">
                    {(b.pos === "top" || b.pos === "both") && <div className="h-1.5" style={{ backgroundColor: b.fill }}></div>}
                    <div className="flex-1"></div>
                    {(b.pos === "bottom" || b.pos === "both") && <div className="h-1" style={{ backgroundColor: b.fill }}></div>}
                  </div>
                </button>
              ))}
            </div>

          </div>
        </>
      )}

{/* CHARTS PANEL */}
      {showChartsPanel && (
        <>
          <div className="fixed inset-0 z-[9980]" onClick={() => setShowChartsPanel(false)} />
          <div className="fixed z-[9981] top-32 left-60 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[380px]">
            <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-sm">Insert Chart (Visual Placeholder)</h3><button onClick={() => setShowChartsPanel(false)} className="p-1 hover:bg-gray-100 rounded"><X size={14}/></button></div>
            <p className="text-[10px] text-gray-500 mb-3">Charts are added as visual placeholders. Connect real data when printing.</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Bar Chart", emoji: "📊", elements: () => { addElement({ type: "rect", x: 100, y: 200, width: 300, height: 200, fill: "#f8fafc", stroke: "#e2e8f0", strokeWidth: 1, borderRadius: 8 }); addElement({ type: "rect", x: 130, y: 300, width: 30, height: 80, fill: "#3b82f6", stroke: "transparent" }); addElement({ type: "rect", x: 180, y: 260, width: 30, height: 120, fill: "#10b981", stroke: "transparent" }); addElement({ type: "rect", x: 230, y: 280, width: 30, height: 100, fill: "#f59e0b", stroke: "transparent" }); addElement({ type: "rect", x: 280, y: 240, width: 30, height: 140, fill: "#ef4444", stroke: "transparent" }); addElement({ type: "rect", x: 330, y: 310, width: 30, height: 70, fill: "#8b5cf6", stroke: "transparent" }); } },
                { name: "Pie Chart", emoji: "🥧", elements: () => { addElement({ type: "circle", x: 150, y: 200, width: 180, height: 180, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }); addElement({ type: "circle", x: 180, y: 230, width: 80, height: 80, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }); addElement({ type: "text", x: 150, y: 400, width: 180, height: 20, text: "{{chart_title}}", fontSize: 12, textAlign: "center", color: "#374151" }); } },
                { name: "Line Chart", emoji: "📈", elements: () => { addElement({ type: "rect", x: 100, y: 200, width: 300, height: 200, fill: "#f8fafc", stroke: "#e2e8f0", strokeWidth: 1, borderRadius: 8 }); addElement({ type: "line", x: 120, y: 350, width: 260, height: 2, stroke: "#e2e8f0" }); addElement({ type: "line", x: 120, y: 300, width: 260, height: 2, stroke: "#e2e8f0" }); addElement({ type: "text", x: 150, y: 410, width: 200, height: 18, text: "{{chart_data}}", fontSize: 11, textAlign: "center", color: "#6b7280" }); } },
                { name: "Progress Bar", emoji: "▓", elements: () => { addElement({ type: "rect", x: 100, y: 300, width: 300, height: 24, fill: "#e5e7eb", stroke: "transparent", borderRadius: 12 }); addElement({ type: "rect", x: 100, y: 300, width: 210, height: 24, fill: "#3b82f6", stroke: "transparent", borderRadius: 12 }); addElement({ type: "text", x: 100, y: 280, width: 300, height: 18, text: "{{percentage}}% Complete", fontSize: 12, color: "#374151", textAlign: "center" }); } },
                { name: "Score Card", emoji: "🏆", elements: () => { addElement({ type: "rect", x: 120, y: 200, width: 200, height: 120, fill: "#f0f9ff", stroke: "#bae6fd", strokeWidth: 2, borderRadius: 12 }); addElement({ type: "text", x: 120, y: 220, width: 200, height: 50, text: "{{score}}", fontSize: 42, fontWeight: "bold", color: "#1e40af", textAlign: "center" }); addElement({ type: "text", x: 120, y: 280, width: 200, height: 20, text: "{{label}}", fontSize: 13, color: "#64748b", textAlign: "center" }); } },
                { name: "Table", emoji: "📋", elements: () => { for (let r = 0; r < 4; r++) { addElement({ type: "rect", x: 100, y: 200 + r * 30, width: 350, height: 30, fill: r === 0 ? "#1e40af" : r % 2 === 0 ? "#f8fafc" : "#ffffff", stroke: "#e2e8f0", strokeWidth: 1 }); addElement({ type: "text", x: 110, y: 205 + r * 30, width: 100, height: 20, text: r === 0 ? "Subject" : "{{subject}}", fontSize: 10, color: r === 0 ? "#ffffff" : "#374151", fontWeight: r === 0 ? "bold" : "normal", textAlign: "left" }); addElement({ type: "text", x: 250, y: 205 + r * 30, width: 80, height: 20, text: r === 0 ? "Marks" : "{{marks}}", fontSize: 10, color: r === 0 ? "#ffffff" : "#374151", fontWeight: r === 0 ? "bold" : "normal", textAlign: "center" }); addElement({ type: "text", x: 360, y: 205 + r * 30, width: 80, height: 20, text: r === 0 ? "Grade" : "{{grade}}", fontSize: 10, color: r === 0 ? "#ffffff" : "#374151", fontWeight: r === 0 ? "bold" : "normal", textAlign: "center" }); } } },
              ].map((chart, i) => (
                <button key={i} onClick={() => { chart.elements(); setShowChartsPanel(false); }} className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 text-center transition-all">
                  <span className="text-2xl">{chart.emoji}</span>
                  <p className="text-[10px] text-gray-600 mt-1">{chart.name}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* DESIGN TEMPLATES PANEL */}
      {showDesignTemplates && (
        <>
          <div className="fixed inset-0 z-[9980]" onClick={() => setShowDesignTemplates(false)} />
          <div className="fixed z-[9981] top-32 left-40 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[450px] max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-sm">Quick Design Templates</h3><button onClick={() => setShowDesignTemplates(false)} className="p-1 hover:bg-gray-100 rounded"><X size={14}/></button></div>
            <p className="text-[10px] text-gray-500 mb-3">Pre-designed layouts - click to apply</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Header + Footer", desc: "School header with colored footer bar", apply: () => { setPageWidth(794); setPageHeight(1123); addElement({ type: "rect", x: 0, y: 0, width: 794, height: 80, fill: "#1e3a5f", stroke: "transparent" }); addElement({ type: "field", x: 20, y: 20, width: 754, height: 30, text: "{{school_name}}", fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "center" }); addElement({ type: "field", x: 20, y: 52, width: 754, height: 18, text: "{{school_address}}", fontSize: 10, color: "#ffffffbb", textAlign: "center" }); addElement({ type: "rect", x: 0, y: 1090, width: 794, height: 33, fill: "#1e3a5f", stroke: "transparent" }); addElement({ type: "field", x: 20, y: 1095, width: 754, height: 18, text: "{{school_phone}} | {{school_email}}", fontSize: 9, color: "#ffffffcc", textAlign: "center" }); } },
                { name: "Bordered A4", desc: "Double border with corner decorations", apply: () => { setPageWidth(794); setPageHeight(1123); addElement({ type: "rect", x: 15, y: 15, width: 764, height: 1093, stroke: "#1e40af", strokeWidth: 3, fill: "transparent" }); addElement({ type: "rect", x: 25, y: 25, width: 744, height: 1073, stroke: "#1e40af", strokeWidth: 1, fill: "transparent" }); } },
                { name: "ID Card Front", desc: "Standard CR80 ID card with photo", apply: () => { setPageWidth(382); setPageHeight(550); const hBg = "#1e3a5f"; addElement({ type: "rect", x: 0, y: 0, width: 382, height: 120, fill: hBg, stroke: "transparent" }); addElement({ type: "field", x: 10, y: 20, width: 362, height: 24, text: "{{school_name}}", fontSize: 14, fontWeight: "bold", color: "#ffffff", textAlign: "center" }); addElement({ type: "text", x: 10, y: 75, width: 362, height: 16, text: "STUDENT IDENTITY CARD", fontSize: 10, fontWeight: "bold", color: "#ffffff", textAlign: "center" }); addElement({ type: "rect", x: 151, y: 135, width: 80, height: 95, fill: "#f3f4f6", stroke: "#1e40af", strokeWidth: 2, borderRadius: 4 }); addElement({ type: "field", x: 30, y: 260, width: 322, height: 20, text: "{{student_name}}", fontSize: 14, fontWeight: "bold", color: "#111827", textAlign: "center" }); addElement({ type: "field", x: 30, y: 290, width: 322, height: 16, text: "Class: {{class_name}} | Roll: {{roll_number}}", fontSize: 10, color: "#4b5563", textAlign: "center" }); addElement({ type: "rect", x: 0, y: 520, width: 382, height: 30, fill: hBg, stroke: "transparent" }); } },
                { name: "Fee Receipt", desc: "Professional receipt with table", apply: () => { setPageWidth(794); setPageHeight(600); addElement({ type: "rect", x: 0, y: 0, width: 794, height: 70, fill: "#1e3a5f", stroke: "transparent" }); addElement({ type: "field", x: 20, y: 15, width: 754, height: 28, text: "{{school_name}}", fontSize: 20, fontWeight: "bold", color: "#ffffff", textAlign: "center" }); addElement({ type: "text", x: 250, y: 85, width: 294, height: 24, text: "FEE RECEIPT", fontSize: 18, fontWeight: "bold", color: "#1e40af", textAlign: "center" }); addElement({ type: "line", x: 30, y: 120, width: 734, height: 2, stroke: "#e5e7eb" }); } },
                { name: "Report Card", desc: "Full marks table with header", apply: () => { setPageWidth(794); setPageHeight(1123); addElement({ type: "rect", x: 0, y: 0, width: 794, height: 90, fill: "#1e3a5f", stroke: "transparent" }); addElement({ type: "field", x: 20, y: 15, width: 754, height: 28, text: "{{school_name}}", fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "center" }); addElement({ type: "text", x: 20, y: 60, width: 754, height: 18, text: "PROGRESS REPORT CARD", fontSize: 12, fontWeight: "bold", color: "#ffffff", textAlign: "center" }); } },
                { name: "Certificate", desc: "Elegant certificate with borders", apply: () => { setPageWidth(794); setPageHeight(1123); addElement({ type: "rect", x: 20, y: 20, width: 754, height: 1083, stroke: "#b45309", strokeWidth: 4, fill: "transparent" }); addElement({ type: "rect", x: 35, y: 35, width: 724, height: 1053, stroke: "#b45309", strokeWidth: 1, fill: "transparent" }); addElement({ type: "text", x: 150, y: 150, width: 494, height: 50, text: "CERTIFICATE", fontSize: 42, fontWeight: "bold", color: "#b45309", textAlign: "center" }); } },
              ].map((tmpl, i) => (
                <button key={i} onClick={() => { tmpl.apply(); setShowDesignTemplates(false); toast.success("Template applied!"); }} className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-all">
                  <p className="text-xs font-semibold text-gray-800">{tmpl.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{tmpl.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* KEYBOARD SHORTCUTS HELP (F1) */}
      {showShortcutsHelp && (
        <>
          <div className="fixed inset-0 z-[9990] bg-black/50" onClick={() => setShowShortcutsHelp(false)} />
          <div className="fixed z-[9991] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">⌨️ Keyboard Shortcuts</h3><button onClick={() => setShowShortcutsHelp(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16}/></button></div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {[
                ["Ctrl + S", "Save"],
                ["Ctrl + Z", "Undo"],
                ["Ctrl + Y", "Redo"],
                ["Ctrl + C", "Copy"],
                ["Ctrl + V", "Paste"],
                ["Ctrl + D", "Duplicate"],
                ["Ctrl + A", "Select All"],
                ["Ctrl + P", "Print"],
                ["Delete / Backspace", "Delete Element"],
                ["Escape", "Deselect / Close panels"],
                ["Arrow Keys", "Nudge 1px"],
                ["Shift + Arrow", "Nudge 10px"],
                ["+  /  -", "Zoom In / Out"],
                ["F1", "Show this help"],
                ["Double-click", "Edit text"],
                ["Right-click", "Context menu"],
              ].map(([key, action], i) => (
                <div key={i} className="flex justify-between py-1 border-b border-gray-100">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono">{key}</kbd>
                  <span className="text-gray-600 text-xs">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

{/* CONTEXT MENU (Right-click) */}
      {contextMenu && selected && (
        <>
          <div className="fixed inset-0 z-[9990]" onClick={() => setContextMenu(null)} />
          <div className="fixed z-[9991] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]" style={{ top: contextMenu.y, left: contextMenu.x }}>
            <button onClick={() => { copyEl(); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"><Copy size={14}/> Copy</button>
            <button onClick={() => { duplicateEl(); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"><CopyPlus size={14}/> Duplicate</button>
            <hr className="my-1" />
            <button onClick={() => { bringToFront(); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"><ArrowUpToLine size={14}/> Bring to Front</button>
            <button onClick={() => { sendToBack(); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"><ArrowDownToLine size={14}/> Send to Back</button>
            <hr className="my-1" />
            <button onClick={() => { deleteSelected(); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
          </div>
        </>
      )}

      {/* FLOATING DELETE BUTTON when element selected */}
      {selected && !editingText && !contextMenu && !showPreview && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex gap-2 bg-white rounded-full shadow-lg border px-3 py-1.5">
          <button onClick={duplicateEl} className="p-1.5 hover:bg-blue-50 rounded-full" title="Duplicate (Ctrl+D)"><CopyPlus size={16} className="text-blue-600"/></button>
          <button onClick={deleteSelected} className="p-1.5 hover:bg-red-50 rounded-full" title="Delete (Del)"><Trash2 size={16} className="text-red-500"/></button>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-[90vw] max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview - {templateName}</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"><Printer size={14}/> Print</button>
                <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded"><X size={18}/></button>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden inline-block">
              <canvas ref={el => {
                if (!el || !canvasRef.current) return;
                const srcCtx = canvasRef.current.getContext("2d");
                if (!srcCtx) return;
                el.width = pageWidth;
                el.height = pageHeight;
                const dstCtx = el.getContext("2d");
                if (dstCtx) dstCtx.drawImage(canvasRef.current, 0, 0);
              }} width={pageWidth} height={pageHeight} style={{ maxWidth: "100%", height: "auto" }} />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">Size: {pageWidth} × {pageHeight}px | Print to check actual size before saving</p>
          </div>
        </div>
      )}
    </div>
  );
}

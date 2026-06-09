
import { useState, useRef } from "react";
import { FiX, FiPrinter } from "react-icons/fi";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const DAY_LABELS: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface TimetableEntry {
  id: string;
  day: string;
  period: number;
  subject: { id: string; name: string };
  teacher: { id: string; name: string };
}

interface TenantInfo {
  name?: string;
  schoolName?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface Props {
  timetable: TimetableEntry[];
  className: string;
  sectionName: string;
  onClose: () => void;
}

const TimetablePrint = ({ timetable, className, sectionName, onClose }: Props) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Tenant info from localStorage (same pattern as PrintStudents)
  const [tenant] = useState<TenantInfo | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("tenant") || "null");
    } catch {
      return null;
    }
  });

  const getEntry = (day: string, period: number) =>
    timetable.find((e) => e.day === day && e.period === period);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const schoolName = tenant?.schoolName || tenant?.name || "School";
    const schoolLogo = tenant?.logoUrl || "";
    const schoolAddress = tenant?.address || "";
    const schoolPhone = tenant?.phone || "";
    const schoolEmail = tenant?.email || "";
    const printDate = new Date().toLocaleDateString("en-IN");
    const printTime = new Date().toLocaleTimeString("en-IN");

    // Build logo HTML
    const logoHTML = schoolLogo
      ? '<img src="' + schoolLogo + '" alt="Logo" style="width:60px;height:60px;object-fit:contain;border-radius:4px;" />'
      : "";

    // Build contact line
    let contactLine = "";
    if (schoolPhone || schoolEmail) {
      contactLine = '<p style="font-size:10px;color:#777;margin:2px 0;">';
      if (schoolPhone) contactLine += "Ph: " + schoolPhone;
      if (schoolPhone && schoolEmail) contactLine += " | ";
      if (schoolEmail) contactLine += "Email: " + schoolEmail;
      contactLine += "</p>";
    }

    // Build table
    let tableHeaderCells = '<th style="border:1px solid #333;padding:6px 4px;background:#f0f0f0;font-weight:bold;font-size:12px;">Day</th>';
    PERIODS.forEach((p) => {
      tableHeaderCells += '<th style="border:1px solid #333;padding:6px 4px;background:#f0f0f0;font-weight:bold;font-size:12px;text-align:center;">Period ' + p + '</th>';
    });

    let tableRows = "";
    DAYS.forEach((day) => {
      let cells = '<td style="border:1px solid #333;padding:6px 8px;font-weight:bold;background:#f8f8f8;width:80px;">' + DAY_LABELS[day] + '</td>';
      PERIODS.forEach((period) => {
        const entry = timetable.find((e) => e.day === day && e.period === period);
        if (entry) {
          cells += '<td style="border:1px solid #333;padding:6px 4px;text-align:center;"><div style="font-weight:bold;font-size:11px;">' + entry.subject.name + '</div><div style="font-size:9px;color:#555;">' + entry.teacher.name + '</div></td>';
        } else {
          cells += '<td style="border:1px solid #333;padding:6px 4px;text-align:center;color:#ccc;">—</td>';
        }
      });
      tableRows += '<tr>' + cells + '</tr>';
    });

    const tableHTML = '<table style="width:100%;border-collapse:collapse;margin-top:10px;"><thead><tr>' + tableHeaderCells + '</tr></thead><tbody>' + tableRows + '</tbody></table>';

    const htmlContent = [
      "<!DOCTYPE html><html><head>",
      "<title>Timetable - " + className + " " + sectionName + "</title>",
      "<style>@media print { body { padding: 10px; } @page { margin: 10mm; size: landscape; } }</style>",
      "</head><body style='font-family:Arial,sans-serif;padding:20px;'>",

      // HEADER with logo
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:15px;">',

      // LEFT LOGO
      '<div style="width:80px;">' + logoHTML + '</div>',

      // CENTER SCHOOL INFO
      '<div style="text-align:center;flex:1;">',
      '<h1 style="font-size:22px;margin:0;font-weight:bold;text-transform:uppercase;">' + schoolName + '</h1>',
      schoolAddress ? '<p style="font-size:11px;color:#555;margin:2px 0;">' + schoolAddress + '</p>' : '',
      contactLine,
      '<p style="font-size:14px;font-weight:bold;margin-top:8px;">Weekly Timetable — Class: ' + className + ' | Section: ' + sectionName + '</p>',
      '</div>',

      // RIGHT PRINT INFO
      '<div style="text-align:right;font-size:10px;color:#555;line-height:1.8;">',
      '<div><strong>Date:</strong> ' + printDate + '</div>',
      '<div><strong>Time:</strong> ' + printTime + '</div>',
      '</div>',

      '</div>',

      // TABLE
      tableHTML,

      // FOOTER
      '<div style="margin-top:30px;display:flex;justify-content:space-between;">',
      '<div style="border-top:1px solid #333;padding-top:5px;min-width:150px;text-align:center;font-size:11px;">Class Teacher</div>',
      '<div style="border-top:1px solid #333;padding-top:5px;min-width:150px;text-align:center;font-size:11px;">Principal</div>',
      '</div>',

      '<script>window.print();<\/script>',
      '</body></html>',
    ].join("\n");

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            Print Preview — {className} ({sectionName})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <FiPrinter /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div ref={printRef} className="p-6">
          {/* School Header with Logo — same layout as PrintStudents */}
          <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
            {/* LEFT — Logo */}
            <div className="flex-shrink-0">
              {tenant?.logoUrl && (
                <img src={tenant.logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded" />
              )}
            </div>

            {/* CENTER — School Info */}
            <div className="text-center flex-1 px-4">
              <h1 className="text-xl font-bold uppercase">
                {tenant?.schoolName || tenant?.name || "School Name"}
              </h1>
              {tenant?.address && <p className="text-[11px] text-gray-600">{tenant.address}</p>}
              {(tenant?.phone || tenant?.email) && (
                <p className="text-[10px] text-gray-500">
                  {tenant?.phone ? `Ph: ${tenant.phone}` : ""}
                  {tenant?.phone && tenant?.email ? " | " : ""}
                  {tenant?.email ? `Email: ${tenant.email}` : ""}
                </p>
              )}
              <p className="text-base font-semibold mt-2">
                Weekly Timetable — Class: {className} | Section: {sectionName}
              </p>
            </div>

            {/* RIGHT — Date/Time */}
            <div className="text-right text-[10px] text-gray-600 leading-relaxed flex-shrink-0">
              <p><strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}</p>
              <p><strong>Time:</strong> {new Date().toLocaleTimeString("en-IN")}</p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-gray-800">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 px-3 py-2 text-sm font-bold">Day</th>
                {PERIODS.map((p) => (
                  <th key={p} className="border border-gray-800 px-2 py-2 text-sm font-bold">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="border border-gray-800 px-3 py-2 font-bold text-sm bg-gray-50">
                    {DAY_LABELS[day]}
                  </td>
                  {PERIODS.map((period) => {
                    const entry = getEntry(day, period);
                    return (
                      <td key={`${day}-${period}`} className="border border-gray-800 px-2 py-2 text-center">
                        {entry ? (
                          <>
                            <div className="text-xs font-bold">{entry.subject.name}</div>
                            <div className="text-[10px] text-gray-600">{entry.teacher.name}</div>
                          </>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex justify-between mt-8">
            <div className="border-t border-gray-800 pt-2 w-40 text-center text-sm">Class Teacher</div>
            <div className="border-t border-gray-800 pt-2 w-40 text-center text-sm">Principal</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetablePrint;


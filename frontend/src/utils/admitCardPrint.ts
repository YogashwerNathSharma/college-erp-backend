// ═══════════════════════════════════════════════════════════════════════════
// SHARED ADMIT-CARD PRINT
// ───────────────────────────────────────────────────────────────────────────
// Single source of truth for how a printed admit card looks. EVERY place that
// prints admit cards (Admit Card page — single / class / school bulk — AND the
// "Admit Card Register" report in Exam Reports) imports from here, so the exact
// same card layout is produced everywhere. Do NOT duplicate this markup.
//
// Layout is configurable: orientation (portrait / landscape) and a grid of
// columns × rows per page (e.g. 2×4 = 8 cards per A4 page, 4,4 arrangement).
// ═══════════════════════════════════════════════════════════════════════════

import { getFullUrl } from "./url";

// Safely format a date that may be ISO, a Date, or an already-formatted string.
const safeDate = (val?: string): string => {
  if (!val) return "";
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toLocaleDateString("en-IN");
  return String(val);
};

// Initials from a name, used for the photo fallback.
const nameInitials = (name?: string): string =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] || "").toUpperCase())
    .join("");

// Full detail shape returned by `/api/exam/:examId/admit-card/:studentId`
// and (as an array) by `/api/exam/admit-cards/bulk`.
export interface AdmitCardDetail {
  admitCard?: any;
  allottedRoom?: string;
  seatNo?: string;
  student: {
    name: string;
    fatherName?: string;
    motherName?: string;
    rollNo?: string;
    admissionNo?: string;
    dob?: string;
    photoUrl?: string;
    class?: { name: string };
    section?: { name: string } | null;
  };
  exam: { name: string; type?: string; class?: { name: string }; section?: { name: string } | null };
  tenant: { name: string; address?: string; phone?: string; email?: string; logoUrl?: string };
  schedule: {
    examDate: string;
    startTime: string;
    endTime: string;
    subject: { name: string };
    room?: { name: string };
  }[];
}

// User-configurable print layout.
export interface AdmitCardLayout {
  orientation?: "portrait" | "landscape";
  columns?: number; // cards per row
  rows?: number;    // rows per page
}

// Default layout: portrait, 1 column × 3 rows = 3 cards per page (old behaviour).
export const DEFAULT_LAYOUT: Required<AdmitCardLayout> = {
  orientation: "portrait",
  columns: 1,
  rows: 3,
};

// Kept for backwards-compatibility (old imports). No longer used internally.
export const CARDS_PER_PAGE = 3;

// Build the print stylesheet for a given layout. The grid is driven by the
// chosen columns × rows so the cards tile the page evenly.
const buildStyles = (layout: Required<AdmitCardLayout>): string => {
  const { orientation, columns, rows } = layout;
  // Gap between cards (mm). Account for it when sizing card height.
  const gap = 3;
  return `
  @page { size: A4 ${orientation}; margin: 6mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: Arial, sans-serif; }

  .page {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(${columns}, 1fr);
    grid-auto-rows: 1fr;
    gap: ${gap}mm;
    page-break-after: always;
    break-after: page;
    /* Fill the printable height so rows divide evenly. A4 printable height is
       ~285mm portrait / ~198mm landscape after 6mm margins. */
    height: ${orientation === "portrait" ? 285 : 198}mm;
  }
  .page:last-child { page-break-after: avoid; break-after: avoid; }

  .card {
    border: 1.5px solid #333;
    border-radius: 5px;
    padding: 5px 8px 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .school-header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
  .school-header img { width: 36px; height: 36px; object-fit: contain; }
  .school-header .spacer { width: 36px; flex-shrink: 0; }
  .school-info { flex: 1; text-align: center; }
  .school-name { font-size: 11px; font-weight: bold; }
  .school-sub { font-size: 8px; color: #555; }
  .title-bar { background: #1e3a8a !important; color: white !important; text-align: center; padding: 2px 4px; border-radius: 3px; margin: 3px 0; }
  .title-bar h2 { margin: 0; font-size: 10px; }
  .title-bar p  { margin: 0; font-size: 8px; }
  .info-photo { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 3px; }
  .info-table { flex: 1; border-collapse: collapse; font-size: 8px; }
  .info-table td { padding: 1px 2px; }
  .info-table .lbl { color: #555; white-space: nowrap; font-weight: 600; width: 30%; }
  .photo { width: 50px; height: 60px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; border-radius: 3px; overflow: hidden; font-size: 7px; color: #888; text-align: center; flex-shrink: 0; margin-right: 5px; }
  .photo img { width: 100%; height: 100%; object-fit: cover; }
  .schedule-table { width: 100%; border-collapse: collapse; font-size: 7.5px; margin-top: 2px; }
  .schedule-table th { background: #1e3a8a !important; color: white !important; padding: 2px 3px; text-align: left; }
  .schedule-table td { padding: 2px 3px; border-bottom: 0.5px solid #ddd; }
  .sigs { display: flex; justify-content: space-between; margin-top: auto; padding: 8px 15px 0; font-size: 7.5px; text-align: center; }
  .sig-line { border-top: 0.5px solid #333; width: 70px; margin: 0 auto 2px; }
`;
};

// The canonical portrait 1×3 stylesheet (kept exported for backwards-compat).
export const ADMIT_CARD_PRINT_STYLES = buildStyles(DEFAULT_LAYOUT);

// Render ONE admit card to an HTML string (the canonical card markup).
export const renderAdmitCardHTML = (data: AdmitCardDetail): string => {
  const logoUrl = getFullUrl(data.tenant?.logoUrl);
  const photoUrl = getFullUrl(data.student?.photoUrl);
  const photoFallback = nameInitials(data.student?.name) || "Photo";
  const scheduleRows = (data.schedule || [])
    .map(
      (s) => `
      <tr>
        <td>${s.subject?.name || ""}</td>
        <td>${safeDate(s.examDate)}</td>
        <td>${s.startTime || ""} – ${s.endTime || ""}</td>
      </tr>`
    )
    .join("");

  return `
    <div class="card">
      <div class="school-header">
        ${logoUrl ? `<img src="${logoUrl}" alt="logo" />` : ""}
        <div class="school-info">
          <div class="school-name">${data.tenant?.name || "School Name"}</div>
          ${data.tenant?.address ? `<div class="school-sub">${data.tenant.address}</div>` : ""}
          ${data.tenant?.phone ? `<div class="school-sub">Ph: ${data.tenant.phone}</div>` : ""}
        </div>
        <div class="spacer"></div>
      </div>
      <div class="title-bar">
        <h2>ADMIT CARD</h2>
        <p>${data.exam?.name || ""}</p>
      </div>
      <div class="info-photo">
        <table class="info-table">
          <tr>
            <td class="lbl">Name</td><td>: ${data.student?.name || ""}</td>
            <td class="lbl" style="padding-left:8px">Roll No</td><td>: ${data.student?.rollNo || ""}</td>
          </tr>
          <tr>
            <td class="lbl">Father</td><td>: ${data.student?.fatherName || ""}</td>
            <td class="lbl" style="padding-left:8px">Adm No</td><td>: ${data.student?.admissionNo || ""}</td>
          </tr>
          <tr>
            <td class="lbl">Class</td><td>: ${data.student?.class?.name || data.exam?.class?.name || ""}${data.student?.section?.name ? " - " + data.student.section.name : ""}</td>
            <td class="lbl" style="padding-left:8px">DOB</td><td>: ${safeDate(data.student?.dob)}</td>
          </tr>
          ${data.allottedRoom ? `<tr><td class="lbl">Room</td><td colspan="3">: ${data.allottedRoom}${data.seatNo ? " (Seat: " + data.seatNo + ")" : ""}</td></tr>` : ""}
        </table>
        <div class="photo">${photoUrl ? `<img src="${photoUrl}" alt="photo" onerror="this.style.display='none';this.parentNode.innerText=this.getAttribute('data-fb');" data-fb="${photoFallback}" />` : photoFallback}</div>
      </div>
      ${
        scheduleRows
          ? `
        <table class="schedule-table">
          <thead><tr><th>Subject</th><th>Date</th><th>Time</th></tr></thead>
          <tbody>${scheduleRows}</tbody>
        </table>`
          : ""
      }
      <div class="sigs">
        <div><div class="sig-line"></div>Class Teacher</div>
        <div><div class="sig-line"></div>Principal</div>
      </div>
    </div>`;
};

// Open a print window and render the given admit cards using the chosen layout
// (orientation + columns × rows per page). Waits for images (logo / photos) to
// load before invoking print.
export const printAdmitCards = (
  allCards: AdmitCardDetail[],
  title: string,
  onError?: (msg: string) => void,
  layout?: AdmitCardLayout
): boolean => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    onError?.("Popup blocked! Please allow popups for this site and try again.");
    return false;
  }

  // Resolve layout with sane bounds (1-6 columns, 1-10 rows).
  const resolved: Required<AdmitCardLayout> = {
    orientation: layout?.orientation || DEFAULT_LAYOUT.orientation,
    columns: Math.min(6, Math.max(1, layout?.columns || DEFAULT_LAYOUT.columns)),
    rows: Math.min(10, Math.max(1, layout?.rows || DEFAULT_LAYOUT.rows)),
  };
  const perPage = resolved.columns * resolved.rows;

  let pagesHTML = "";
  for (let i = 0; i < allCards.length; i += perPage) {
    const chunk = allCards.slice(i, i + perPage);
    pagesHTML += `<div class="page">${chunk.map(renderAdmitCardHTML).join("")}</div>`;
  }

  // Write the full document in one shot. Writing synchronously (not relying on
  // window.onload, which can fail to fire for about:blank windows and leave the
  // print preview stuck on "Loading preview…") is more reliable.
  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${title}</title>
    <style>${buildStyles(resolved)}</style>
    </head><body>${pagesHTML}</body></html>
  `);
  printWindow.document.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed || printWindow.closed) return;
    printed = true;
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      /* ignore */
    }
  };

  const waitForImagesThenPrint = () => {
    const images = Array.from(printWindow.document.images);
    if (images.length === 0) {
      triggerPrint();
      return;
    }
    let remaining = images.length;
    const onOne = () => {
      if (--remaining <= 0) triggerPrint();
    };
    images.forEach((img) => {
      if (img.complete) onOne();
      else {
        img.addEventListener("load", onOne);
        img.addEventListener("error", onOne);
      }
    });
    // Hard fallback so it never hangs on "Loading preview…" if an image stalls.
    setTimeout(triggerPrint, 3000);
  };

  // Document is already written & closed, so images are discoverable now.
  // Give the layout a tick, then wait for images. Also a last-resort timeout.
  setTimeout(waitForImagesThenPrint, 200);
  setTimeout(triggerPrint, 5000);
  return true;
};

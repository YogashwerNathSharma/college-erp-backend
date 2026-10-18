/**
 * ═══════════════════════════════════════════════════════════════
 * UNIFIED PRINT HEADER — Used by ALL print pages across the ERP
 * ═══════════════════════════════════════════════════════════════
 * 
 * Format (LOCKED):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [LOGO]    Tenant Name              Printed by: Admin Name   │
 * │           Tenant Address            Date: DD/MM/YYYY        │
 * │                                     Time: HH:MM AM/PM       │
 * └─────────────────────────────────────────────────────────────┘
 */

export const getPrintHeaderHTML = (): string => {
  const tenant = JSON.parse(localStorage.getItem("tenant") || "{}");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const schoolName = tenant.name || tenant.schoolName || "School Name";
  const address = tenant.address || "";
  const logoUrl = tenant.logoUrl
    ? tenant.logoUrl.startsWith("http")
      ? tenant.logoUrl
      : tenant.logoUrl
    : "";

  const adminName = user.name || user.firstName || "Admin";
  const now = new Date();
  const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:15px;">
      <!-- LEFT: Logo -->
      <div style="flex-shrink:0;width:60px;">
        ${logoUrl ? `<img src="${logoUrl}" style="width:55px;height:55px;object-fit:contain;border-radius:4px;" crossorigin="anonymous" />` : `<div style="width:55px;height:55px;background:#4f46e5;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px;">${schoolName.charAt(0)}</div>`}
      </div>
      <!-- CENTER: School Name + Address -->
      <div style="flex:1;text-align:center;padding:0 15px;">
        <h1 style="margin:0;font-size:18px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;">${schoolName}</h1>
        ${address ? `<p style="margin:3px 0 0;font-size:11px;color:#444;">${address}</p>` : ""}
      </div>
      <!-- RIGHT: Printed by + Date/Time -->
      <div style="flex-shrink:0;text-align:right;font-size:10px;color:#555;min-width:130px;">
        <p style="margin:0;"><strong>Printed by:</strong> ${adminName}</p>
        <p style="margin:3px 0 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin:3px 0 0;"><strong>Time:</strong> ${time}</p>
      </div>
    </div>
  `;
};

/**
 * Full print page wrapper with header
 * Use: const html = wrapWithPrintHeader("Fee Record", bodyHTML);
 */
export const wrapWithPrintHeader = (title: string, bodyHTML: string, totalRecords?: number): string => {
  const header = getPrintHeaderHTML();

  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 15mm; font-size: 12px; color: #222; }
    @media print {
      body { padding: 10mm; }
      @page { size: A4; margin: 10mm; }
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; font-size: 11px; }
    th { background: #f0f0f0; font-weight: 600; }
    .no-print { }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  ${header}
  <div style="margin-bottom:10px;">
    <h2 style="font-size:14px;font-weight:bold;margin:0;">${title}</h2>
    ${totalRecords !== undefined ? `<p style="font-size:10px;color:#666;margin-top:2px;">Total Records: ${totalRecords}</p>` : ""}
  </div>
  ${bodyHTML}
</body>
</html>`;
};

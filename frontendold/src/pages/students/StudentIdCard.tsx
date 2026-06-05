
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface StudentData {
  id?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  admissionNo?: string;
  class?: { name?: string };
  section?: { name?: string };
  fatherName?: string;
  fatherPhone?: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
}

interface PatternProps {
  student: StudentData;
  tenant: any;
  academicYearName: string;
  orientation: "landscape" | "portrait";
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `http://localhost:5000${path}`;
  return `http://localhost:5000/uploads/${path}`;
};

// FIX 2 (PDF): Convert an image URL to a base64 data URL for html2canvas
const imgToDataURL = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!src || src.startsWith("data:")) { resolve(src); return; }
    fetch(src)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => resolve(src));
  });
};

// ─── Pattern 1: Leadership Blue ───────────────────────────────────────────────

const Pattern1: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#1a237e";
  const ACCENT = "#ffd700";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Diagonal gold stripe */}
      <div style={{ position: "absolute", top: -30, left: -30, width: 100, height: h + 60, background: ACCENT, opacity: 0.15, transform: "rotate(25deg)", zIndex: 1 }} />
      {/* Corner accents */}
      <svg style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} width="50" height="50"><path d="M0,0 Q25,10 10,40" fill="none" stroke={ACCENT} strokeWidth="2" /></svg>
      <svg style={{ position: "absolute", bottom: 0, right: 0, zIndex: 1 }} width="50" height="50"><path d="M50,50 Q25,40 40,10" fill="none" stroke={ACCENT} strokeWidth="2" /></svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`, margin: "2px 10px" }} />

      {/* Photo — FIX 1: removed crossOrigin="anonymous" so browser displays the image */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>

      {/* ID */}
      <div style={{ textAlign: "center", fontSize: 10, color: ACCENT, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 2: Innovate Teal ─────────────────────────────────────────────────

const Pattern2: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#00695c";
  const LIGHT = "#b2dfdb";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Geometric triangles */}
      <svg style={{ position: "absolute", top: 0, right: 0, zIndex: 1 }} width="100" height="100">
        <polygon points="100,0 60,0 100,40" fill={LIGHT} opacity="0.6" />
        <polygon points="100,20 80,0 100,0" fill={PRIMARY} opacity="0.2" />
        <polygon points="70,10 90,10 80,30" fill={LIGHT} opacity="0.4" />
        <polygon points="50,30 70,30 60,50" fill={PRIMARY} opacity="0.15" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: PRIMARY, margin: "2px 10px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 3: Aristo Gold ───────────────────────────────────────────────────

const Pattern3: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#5d4037";
  const GOLD = "#c8a415";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fffdf5", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Gold header accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${GOLD}, ${PRIMARY}, ${GOLD})`, zIndex: 2 }} />

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "12px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: GOLD, margin: "2px 10px" }} />

      {/* Photo with laurel wreath */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ position: "relative" }}>
          {/* Laurel SVG */}
          <svg style={{ position: "absolute", top: -8, left: -12, width: photoW + 24, height: photoH + 16 }} viewBox="0 0 120 130">
            <path d="M15,65 Q5,50 15,35 Q20,45 18,55 Z" fill={GOLD} opacity="0.5" />
            <path d="M12,80 Q2,65 12,50 Q17,60 15,70 Z" fill={GOLD} opacity="0.4" />
            <path d="M18,95 Q8,80 18,65 Q23,75 21,85 Z" fill={GOLD} opacity="0.3" />
            <path d="M105,65 Q115,50 105,35 Q100,45 102,55 Z" fill={GOLD} opacity="0.5" />
            <path d="M108,80 Q118,65 108,50 Q103,60 105,70 Z" fill={GOLD} opacity="0.4" />
            <path d="M102,95 Q112,80 102,65 Q97,75 99,85 Z" fill={GOLD} opacity="0.3" />
          </svg>
          <div style={{ width: photoW, height: photoH, border: `2.5px solid ${GOLD}`, borderRadius: 6, overflow: "hidden", background: "#eee", position: "relative" }}>
            {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
          </div>
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: GOLD, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 4: Wisdom Purple ─────────────────────────────────────────────────

const Pattern4: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#4a148c";
  const GOLD = "#ffd700";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Purple + gold blob top-right */}
      <svg style={{ position: "absolute", top: -20, right: -20, zIndex: 1 }} width="120" height="120">
        <ellipse cx="80" cy="40" rx="50" ry="35" fill={PRIMARY} opacity="0.12" />
        <ellipse cx="60" cy="60" rx="30" ry="25" fill={GOLD} opacity="0.15" />
      </svg>
      {/* Blob bottom-left */}
      <svg style={{ position: "absolute", bottom: -20, left: -20, zIndex: 1 }} width="100" height="100">
        <ellipse cx="30" cy="60" rx="40" ry="30" fill={PRIMARY} opacity="0.1" />
        <ellipse cx="50" cy="40" rx="25" ry="20" fill={GOLD} opacity="0.12" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: `linear-gradient(90deg, ${PRIMARY}, ${GOLD})`, margin: "2px 10px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: GOLD, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 5: Bluebird Sky ──────────────────────────────────────────────────

const Pattern5: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#1565c0";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #e3f2fd 0%, #fff 40%)", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Blue leaf/branch top-right */}
      <svg style={{ position: "absolute", top: 5, right: 40, zIndex: 1 }} width="60" height="60">
        <path d="M30,50 Q20,35 30,20 Q35,30 32,40 Z" fill={PRIMARY} opacity="0.15" />
        <path d="M35,45 Q25,30 35,15 Q40,25 37,35 Z" fill={PRIMARY} opacity="0.1" />
        <path d="M40,40 Q33,28 42,15 Q45,25 42,33 Z" fill={PRIMARY} opacity="0.12" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: PRIMARY, margin: "2px 10px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 6: NextGen Green ─────────────────────────────────────────────────

const Pattern6: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#1b5e20";
  const ACCENT = "#ff6d00";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Circuit-board lines */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
        <line x1="120" y1="140" x2="120" y2="180" stroke={PRIMARY} strokeWidth="0.5" opacity="0.2" />
        <line x1="120" y1="180" x2="160" y2="180" stroke={PRIMARY} strokeWidth="0.5" opacity="0.2" />
        <line x1="120" y1="140" x2="80" y2="140" stroke={PRIMARY} strokeWidth="0.5" opacity="0.2" />
        <line x1="80" y1="140" x2="80" y2="160" stroke={PRIMARY} strokeWidth="0.5" opacity="0.2" />
        <circle cx="160" cy="180" r="2" fill={ACCENT} opacity="0.4" />
        <circle cx="80" cy="160" r="2" fill={ACCENT} opacity="0.4" />
        <line x1="120" y1="100" x2="180" y2="100" stroke={PRIMARY} strokeWidth="0.5" opacity="0.15" />
        <line x1="180" y1="100" x2="180" y2="70" stroke={PRIMARY} strokeWidth="0.5" opacity="0.15" />
        <circle cx="180" cy="70" r="2" fill={ACCENT} opacity="0.3" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`, margin: "2px 10px" }} />

      {/* Hexagonal photo frame */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, clipPath: "polygon(50% 0%, 100% 10%, 100% 90%, 50% 100%, 0% 90%, 0% 10%)", overflow: "hidden", background: "#eee", border: `2px solid ${PRIMARY}` }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: ACCENT, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 7: Shining Star Maroon ───────────────────────────────────────────

const Pattern7: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#4e342e";
  const GOLD = "#c8a415";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Gold thin border frame inside card */}
      <div style={{ position: "absolute", top: 6, left: 6, right: 6, bottom: 6, border: `1.5px solid ${GOLD}`, borderRadius: 6, zIndex: 1 }} />

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "14px 14px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: GOLD, margin: "2px 14px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: GOLD, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 18px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 12, left: 18, right: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 8: Emerald Green ─────────────────────────────────────────────────

const Pattern8: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#004d40";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #fff 70%, #e0f2f1 100%)", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Dotted circles around photo area */}
      <svg style={{ position: "absolute", top: isPortrait ? 55 : 30, left: "50%", transform: "translateX(-50%)", zIndex: 1 }} width="140" height="140">
        <circle cx="70" cy="70" r="65" fill="none" stroke={PRIMARY} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.2" />
        <circle cx="70" cy="70" r="55" fill="none" stroke={PRIMARY} strokeWidth="0.5" strokeDasharray="2,4" opacity="0.15" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: PRIMARY, margin: "2px 10px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 9: Horizon Orange ────────────────────────────────────────────────

const Pattern9: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#e65100";
  const BLUE = "#1565c0";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Large abstract blobs at bottom */}
      <svg style={{ position: "absolute", bottom: -20, left: -20, zIndex: 1 }} width="130" height="100">
        <ellipse cx="40" cy="60" rx="55" ry="40" fill={PRIMARY} opacity="0.12" />
        <ellipse cx="70" cy="50" rx="30" ry="25" fill={BLUE} opacity="0.1" />
      </svg>
      <svg style={{ position: "absolute", bottom: -10, right: -20, zIndex: 1 }} width="110" height="80">
        <ellipse cx="60" cy="50" rx="45" ry="35" fill={BLUE} opacity="0.12" />
        <ellipse cx="40" cy="40" rx="25" ry="20" fill={PRIMARY} opacity="0.1" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: `linear-gradient(90deg, ${PRIMARY}, ${BLUE})`, margin: "2px 10px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: BLUE, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 10: Glorious Nature ──────────────────────────────────────────────

const Pattern10: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#1b5e20";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Leaf illustrations top-right */}
      <svg style={{ position: "absolute", top: 0, right: 0, zIndex: 1 }} width="80" height="80">
        <path d="M70,10 Q55,20 60,35 Q65,20 70,10 Z" fill={PRIMARY} opacity="0.15" />
        <path d="M55,5 Q40,18 48,30 Q52,15 55,5 Z" fill={PRIMARY} opacity="0.12" />
        <path d="M75,25 Q62,35 67,48 Q72,33 75,25 Z" fill={PRIMARY} opacity="0.1" />
      </svg>
      {/* Leaf illustrations bottom-left */}
      <svg style={{ position: "absolute", bottom: 0, left: 0, zIndex: 1 }} width="80" height="80">
        <path d="M10,70 Q25,60 20,45 Q15,60 10,70 Z" fill={PRIMARY} opacity="0.15" />
        <path d="M25,75 Q40,62 32,50 Q28,65 25,75 Z" fill={PRIMARY} opacity="0.12" />
        <path d="M5,55 Q18,45 13,32 Q8,47 5,55 Z" fill={PRIMARY} opacity="0.1" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: PRIMARY, margin: "2px 10px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 11: Red Classic ──────────────────────────────────────────────────

const Pattern11: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#b71c1c";
  const GOLD = "#c8a415";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Red diagonal thick stripe top-left */}
      <div style={{ position: "absolute", top: -40, left: -40, width: 100, height: 140, background: PRIMARY, opacity: 0.12, transform: "rotate(30deg)", zIndex: 1 }} />
      {/* Gold thin border */}
      <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, border: `1px solid ${GOLD}`, borderRadius: 7, zIndex: 1, opacity: 0.6 }} />

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "12px 12px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: PRIMARY, margin: "2px 12px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: GOLD, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 12: Blue Geometric ───────────────────────────────────────────────

const Pattern12: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#0d47a1";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Geometric triangles scattered */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
        <polygon points="200,20 220,20 210,40" fill={PRIMARY} opacity="0.08" />
        <polygon points="30,300 50,300 40,320" fill={PRIMARY} opacity="0.08" />
        <polygon points="180,350 200,340 190,360" fill={PRIMARY} opacity="0.06" />
        <polygon points="10,50 30,45 20,65" fill={PRIMARY} opacity="0.07" />
        <polygon points="220,150 240,145 230,165" fill={PRIMARY} opacity="0.05" />
        <polygon points="50,200 70,195 60,215" fill={PRIMARY} opacity="0.06" />
        <rect x="200" y="280" width="15" height="15" fill={PRIMARY} opacity="0.05" transform="rotate(45, 207, 287)" />
        <rect x="20" y="150" width="12" height="12" fill={PRIMARY} opacity="0.06" transform="rotate(30, 26, 156)" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: PRIMARY, margin: "2px 10px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 13: Pink Blossom ─────────────────────────────────────────────────

const Pattern13: React.FC<PatternProps> = ({ student, tenant, academicYearName, orientation }) => {
  const photoUrl = getFullUrl(student.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#880e4f";

  const photoW = isPortrait ? 90 : 70;
  const photoH = isPortrait ? 110 : 85;

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      {/* Pink circles/flowers scattered */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
        <circle cx="200" cy="30" r="15" fill={PRIMARY} opacity="0.06" />
        <circle cx="30" cy="320" r="20" fill={PRIMARY} opacity="0.06" />
        <circle cx="210" cy="350" r="12" fill={PRIMARY} opacity="0.05" />
        <circle cx="20" cy="80" r="10" fill={PRIMARY} opacity="0.05" />
        <circle cx="220" cy="200" r="8" fill={PRIMARY} opacity="0.04" />
        <circle cx="50" cy="220" r="14" fill={PRIMARY} opacity="0.05" />
        <circle cx="180" cy="100" r="6" fill={PRIMARY} opacity="0.06" />
        <circle cx="60" cy="140" r="9" fill={PRIMARY} opacity="0.04" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "10px 10px 4px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "SCHOOL NAME"}</div>
          <div style={{ fontSize: 7, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: PRIMARY, margin: "2px 10px" }} />

      {/* Photo */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: isPortrait ? 10 : 6, position: "relative", zIndex: 2 }}>
        <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: 6, overflow: "hidden", background: "#eee" }}>
          {photoUrl ? <img src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
        {(student.firstName || "").charAt(0).toUpperCase() + (student.firstName || "").slice(1).toLowerCase()} {(student.lastName || "").charAt(0).toUpperCase() + (student.lastName || "").slice(1).toLowerCase()}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
        ID No: {student.admissionNo || "N/A"}
      </div>

      {/* Details */}
      <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Class", value: student.class?.name?.replace(/class\s*/i, "") || "N/A" },
          { label: "Section", value: student.section?.name?.replace(/section\s*/i, "") || "N/A" },
          { label: "Father", value: student.fatherName || "N/A" },
          { label: "DOB", value: student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "N/A" },
          { label: "Phone", value: student.fatherPhone || "N/A" },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 55 }}>• {item.label}</span>
            <span style={{ margin: "0 4px" }}>:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />
          <div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern Maps ─────────────────────────────────────────────────────────────

const patternComponents: Record<number, React.FC<PatternProps>> = {
  1: Pattern1,
  2: Pattern2,
  3: Pattern3,
  4: Pattern4,
  5: Pattern5,
  6: Pattern6,
  7: Pattern7,
  8: Pattern8,
  9: Pattern9,
  10: Pattern10,
  11: Pattern11,
  12: Pattern12,
  13: Pattern13,
};

const patternLabels: Record<number, string> = {
  1: "Leadership Blue",
  2: "Innovate Teal",
  3: "Aristo Gold",
  4: "Wisdom Purple",
  5: "Bluebird Sky",
  6: "NextGen Green",
  7: "Shining Star Maroon",
  8: "Emerald Green",
  9: "Horizon Orange",
  10: "Glorious Nature",
  11: "Red Classic",
  12: "Blue Geometric",
  13: "Pink Blossom",
};

const patternColors: Record<number, string> = {
  1: "#1a237e",
  2: "#00695c",
  3: "#5d4037",
  4: "#4a148c",
  5: "#1565c0",
  6: "#1b5e20",
  7: "#4e342e",
  8: "#004d40",
  9: "#e65100",
  10: "#1b5e20",
  11: "#b71c1c",
  12: "#0d47a1",
  13: "#880e4f",
};

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentIdCardPage: React.FC = () => {
  const [mode, setMode] = useState<"individual" | "class">("individual");
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("portrait");
  const [cardsPerPage, setCardsPerPage] = useState<number>(6);
  const [selectedPattern, setSelectedPattern] = useState<number>(1);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [tenant, setTenant] = useState<any>(null);
  const [showCards, setShowCards] = useState<boolean>(false);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchClasses = async () => {
    try {
      const res = await axios.get("/api/class");
      setClasses(res.data.data || []);
    } catch (err) { console.error("Failed to fetch classes", err); }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await axios.get(`/api/section?classId=${classId}`);
      setSections(res.data.data || []);
    } catch (err) { console.error("Failed to fetch sections", err); }
  };

  const mapStudentData = (student: any): StudentData => {
    const enrollment = student.enrollments?.[0];
    return {
      ...student,
      id: student.id || student._id,
      photoUrl: student.photoUrl || student.photo || null,
      class: enrollment?.class || student.class,
      section: enrollment?.section || student.section,
      academicYear: enrollment?.academicYear || student.academicYear,
      fatherPhone: student.fatherPhone || student.phone || null,
      dob: student.dob || null,
      address: student.address || null,
    };
  };

  const fetchStudentsByClass = async (classId: string, sectionId: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/students?classId=${classId}&sectionId=${sectionId}&limit=100`);
      const raw = res.data?.data?.students || res.data?.data || [];
      setStudents(raw.map((s: any) => mapStudentData(s)));
    } catch (err) { console.error("Failed to fetch students", err); }
    finally { setLoading(false); }
  };

  const fetchSingleStudent = async (studentId: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/students/${studentId}`);
      setSelectedStudent(mapStudentData(res.data?.data || res.data));
      setShowCards(true);
    } catch (err) { console.error("Failed to fetch student", err); }
    finally { setLoading(false); }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get("/api/academic");
      const years = res.data.data || [];
      const active = years.find((y: any) => y.isActive);
      if (active?.name) setActiveAcademicYear(active.name);
    } catch (err) { console.error("Failed to fetch academic years", err); }
  };

  const loadTenant = () => {
    try { const raw = localStorage.getItem("tenant"); if (raw) setTenant(JSON.parse(raw)); } catch (err) {}
  };

  useEffect(() => { loadTenant(); fetchClasses(); fetchAcademicYears(); }, []);
  useEffect(() => { if (selectedClass) { setSections([]); setSelectedSection(""); setStudents([]); setSelectedStudent(null); setShowCards(false); fetchSections(selectedClass); } }, [selectedClass]);
  useEffect(() => { if (selectedClass && selectedSection) { setStudents([]); setSelectedStudent(null); setShowCards(false); fetchStudentsByClass(selectedClass, selectedSection); } }, [selectedSection]);

  const handleStudentSelect = (student: StudentData) => { fetchSingleStudent(student.id || (student as any)._id); };
  const handleGenerateClass = () => { if (students.length === 0) return; setShowCards(true); };
  const handlePrint = () => { window.print(); };

  // FIX 2 (PDF): Pre-convert images to base64, capture at exact card size, then restore
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10; const gap = 5; const cols = 2;
      const usableW = pageW - margin * 2;
      const cardW = (usableW - gap) / cols;
      const cards = printRef.current.querySelectorAll(".id-card") as NodeListOf<HTMLElement>;
      let currentX = margin, currentY = margin, colIndex = 0, rowHeight = 0;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardNativeW = card.offsetWidth;
        const cardNativeH = card.offsetHeight;

        // Convert all image srcs to base64 data URLs so html2canvas can read them
        const imgs = Array.from(card.querySelectorAll("img") as NodeListOf<HTMLImageElement>);
        const origSrcs = imgs.map((img) => img.src);
        await Promise.all(
          imgs.map(async (img, idx) => {
            if (origSrcs[idx]) {
              imgs[idx].src = await imgToDataURL(origSrcs[idx]);
            }
          })
        );

        const canvas = await html2canvas(card, {
          scale: 3,
          backgroundColor: "#ffffff",
          logging: false,
          // FIX 2: Clamp capture to the card's declared pixel dimensions
          width: cardNativeW,
          height: cardNativeH,
        });

        // Restore original srcs
        imgs.forEach((img, idx) => { img.src = origSrcs[idx]; });

        const ratio = cardNativeH / cardNativeW;
        const cardH = cardW * ratio;
        if (currentY + cardH > pageH - margin && colIndex === 0) { pdf.addPage(); currentY = margin; }
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", currentX, currentY, cardW, cardH);
        rowHeight = Math.max(rowHeight, cardH);
        colIndex++;
        if (colIndex >= cols) {
          colIndex = 0; currentX = margin; currentY += rowHeight + gap; rowHeight = 0;
          if (currentY > pageH - margin - 20) { pdf.addPage(); currentY = margin; }
        } else {
          currentX += cardW + gap;
        }
      }
      pdf.save(`ID_Cards_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) { console.error("PDF error:", err); }
  };

  const cardsToDisplay: StudentData[] = mode === "individual" ? (selectedStudent ? [selectedStudent] : []) : students;
  const PatternComponent = patternComponents[selectedPattern] || patternComponents[1];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
   <style>{`
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body * { visibility: hidden; }
    .print-area, .print-area * { visibility: visible !important; }
    .print-area {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 194mm !important;
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
      gap: 6mm !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }
    body, html { margin: 0 !important; padding: 0 !important; background: white !important; }
    .id-card {
      box-shadow: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      flex-shrink: 0 !important;
    }
    .no-print { display: none !important; }
  }
`}</style>

      <div className="no-print bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Student ID Card Generator</h1>
          {activeAcademicYear && <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">Active Year: {activeAcademicYear}</div>}
        </div>
      </div>

      <div className="no-print bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setMode("individual"); setShowCards(false); setSelectedStudent(null); }} className={`px-4 py-2 rounded-md text-sm font-medium transition ${mode === "individual" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Individual</button>
          <button onClick={() => { setMode("class"); setShowCards(false); setSelectedStudent(null); }} className={`px-4 py-2 rounded-md text-sm font-medium transition ${mode === "class" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Class-wise</button>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Class</label><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px]"><option value="">Select Class</option>{classes.map((c: any) => (<option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>))}</select></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Section</label><select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px]" disabled={!selectedClass}><option value="">Select Section</option>{sections.map((s: any) => (<option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>))}</select></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Orientation</label><div className="flex gap-1"><button onClick={() => setOrientation("portrait")} className={`px-3 py-2 text-xs rounded-md font-medium transition ${orientation === "portrait" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Portrait</button><button onClick={() => setOrientation("landscape")} className={`px-3 py-2 text-xs rounded-md font-medium transition ${orientation === "landscape" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Landscape</button></div></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Cards/Page</label><select value={cardsPerPage} onChange={(e) => setCardsPerPage(Number(e.target.value))} className="border border-gray-300 rounded-md px-3 py-2 text-sm"><option value={4}>4</option><option value={6}>6</option><option value={8}>8</option><option value={10}>10</option></select></div>
          {mode === "class" && <button onClick={handleGenerateClass} disabled={students.length === 0} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition disabled:opacity-50">Generate All Cards</button>}
          {showCards && cardsToDisplay.length > 0 && (<><button onClick={handleDownloadPDF} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition">Download PDF</button><button onClick={handlePrint} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition">Print</button></>)}
        </div>
      </div>

      <div className="no-print bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Card Pattern</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
          {[1,2,3,4,5,6,7,8,9,10,11,12,13].map((num) => (
            <div key={num} onClick={() => setSelectedPattern(num)} className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${selectedPattern === num ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-400"}`}>
              <div style={{ background: patternColors[num], height: 40 }} />
              <div className="p-1 text-center"><div className="text-xs font-medium text-gray-700 truncate">{patternLabels[num]}</div></div>
            </div>
          ))}
        </div>
      </div>

      {mode === "individual" && students.length > 0 && !showCards && (
        <div className="no-print bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Select a Student ({students.length} found)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
            {students.map((s) => (
              <div key={s.id || (s as any)._id} onClick={() => handleStudentSelect(s)} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {getFullUrl(s.photoUrl) ? <img src={getFullUrl(s.photoUrl)!} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">{s.firstName?.[0]}{s.lastName?.[0]}</div>}
                </div>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-800 truncate">{s.firstName} {s.lastName}</div><div className="text-xs text-gray-500">{s.admissionNo}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCards && cardsToDisplay.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div ref={printRef} className="print-area" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, padding: 16 }}>
            {cardsToDisplay.slice(0, cardsPerPage).map((student) => (<PatternComponent key={student.id || (student as any)._id} student={student} tenant={tenant} academicYearName={activeAcademicYear} orientation={orientation} />))}
          </div>
          {cardsToDisplay.length > cardsPerPage && <div className="no-print text-center mt-3 text-sm text-gray-500">Showing {cardsPerPage} of {cardsToDisplay.length} cards.</div>}
        </div>
      )}

      {!showCards && students.length === 0 && selectedSection && !loading && <div className="no-print bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">No students found.</div>}
      {loading && <div className="no-print bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">Loading...</div>}
    </div>
  );
};

export default StudentIdCardPage;

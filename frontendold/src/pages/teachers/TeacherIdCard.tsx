
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PrintSignature from "../../components/PrintSignature";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface TeacherData {
  id?: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  phone?: string;
  email?: string;
  subjects?: any[] | string;
  qualification?: string;
  teacherId?: string;
  employeeId?: string;
  photo?: string;
  photoUrl?: string;
  dateOfJoining?: string;
  bloodGroup?: string;
  designation?: string;
  department?: string;
  address?: string;
}

interface PatternProps {
  teacher: TeacherData;
  tenant: any;
  academicYearName: string;
  orientation: "landscape" | "portrait";
  photoShape?: "rectangle" | "circle";
}

// ─── Helper ─────────────────────────────────────────────────────────────────

const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${path}`;
  return `/uploads/${path}`;
};

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

const capitalizeName = (name: string | undefined) => {
  if (!name) return "";
  return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
};

// ─── Shared: Detail Items ───────────────────────────────────────────────────

const getDetailItems = (teacher: TeacherData) => [
  { label: "Father Name", value: teacher.fatherName || "N/A" },
  { label: "Designation", value: teacher.designation || "Teacher" },
  { label: "Phone", value: teacher.phone || "N/A" },
  { label: "Address", value: teacher.address || "N/A" },
];

// ─── Pattern 1: Professional Navy ────────────────────────────────────────────

const Pattern1: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#1b2a4a";
  const ACCENT = "#d4af37";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #ffffff 0%, #e8ecf4 100%)", border: `2.5px solid ${PRIMARY}`, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", top: 6, left: 6, right: 6, bottom: 6, border: `1.5px solid ${PRIMARY}`, borderRadius: 6, zIndex: 1 }} />
      {/* Diagonal gold stripes */}
      <div style={{ position: "absolute", top: -50, left: -50, width: 100, height: h + 60, background: ACCENT, opacity: 0.12, transform: "rotate(25deg)", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: -50, right: -50, width: 100, height: h + 60, background: ACCENT, opacity: 0.12, transform: "rotate(25deg)", zIndex: 0 }} />
      {/* Corner accents */}
      <svg style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} width="50" height="70"><path d="M0,0 Q25,10 10,40" fill="none" stroke={ACCENT} strokeWidth="4" /></svg>
      <svg style={{ position: "absolute", bottom: 0, right: 0, zIndex: 1 }} width="50" height="70"><path d="M50,50 Q25,40 40,10" fill="none" stroke={ACCENT} strokeWidth="4" /></svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 80 : 8, right: 8, background: PRIMARY, color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "20px 20px 6px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 9, color: "#333", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`, margin: "2px 10px" }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "4px 0 2px", position: "relative", zIndex: 2 }}>
        <span style={{ background: PRIMARY, color: ACCENT, fontSize: 9, fontWeight: 700, padding: "2px 12px", borderRadius: 3, letterSpacing: 1 }}>TEACHER</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2.5px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#eee" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: ACCENT, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2.5px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#eee" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: ACCENT, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 2: Modern Gradient ──────────────────────────────────────────────

const Pattern2: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#5b21b6";
  const SECONDARY = "#1d4ed8";
  const LIGHT = "#ede9fe";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${LIGHT} 0%, #dbeafe 100%)`, border: `2px solid ${PRIMARY}`, borderRadius: 12, boxShadow: "0 4px 12px rgba(91,33,182,0.2)", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Top gradient bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`, zIndex: 1 }} />
      {/* Floating circles */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
        <circle cx="30" cy="60" r="25" fill={PRIMARY} opacity="0.05" />
        <circle cx={w - 40} cy={h - 50} r="30" fill={SECONDARY} opacity="0.06" />
        <circle cx={w / 2} cy={h - 30} r="18" fill={PRIMARY} opacity="0.04" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 56 : 56, right: 10, background: "rgba(255,255,255,0.9)", color: PRIMARY, padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header on gradient */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "12px 16px 8px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#e0e7ff", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "6px 0 4px", position: "relative", zIndex: 2 }}>
        <span style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 14px", borderRadius: 10, letterSpacing: 1 }}>TEACHING STAFF</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `3px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 10, overflow: "hidden", background: "#fff", boxShadow: "0 2px 8px rgba(91,33,182,0.2)" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: SECONDARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "6px 14px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `3px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 10, overflow: "hidden", background: "#fff", boxShadow: "0 2px 8px rgba(91,33,182,0.2)" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: SECONDARY, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: SECONDARY, fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 3: Classic Red ──────────────────────────────────────────────────

const Pattern3: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#b91c1c";
  const ACCENT = "#fef2f2";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#ffffff", border: `2.5px solid ${PRIMARY}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(185,28,28,0.15)", fontFamily: "'Georgia', serif" }}>
      {/* Double border */}
      <div style={{ position: "absolute", top: 4, left: 4, right: 4, bottom: 4, border: `1px solid ${PRIMARY}`, borderRadius: 5, zIndex: 1 }} />
      <div style={{ position: "absolute", top: 7, left: 7, right: 7, bottom: 7, border: `0.5px solid ${PRIMARY}`, borderRadius: 4, opacity: 0.4, zIndex: 1 }} />
      {/* Top red bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: PRIMARY, zIndex: 2 }} />
      {/* Bottom red bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: PRIMARY, zIndex: 2 }} />
      {/* Side stripes */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: PRIMARY, zIndex: 2 }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 3, height: "100%", background: PRIMARY, zIndex: 2 }} />

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 75 : 12, right: 12, background: PRIMARY, color: "#fff", padding: "3px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "18px 18px 6px", gap: 8 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 38, height: 38, borderRadius: 4, objectFit: "cover", border: `1px solid ${PRIMARY}` }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: PRIMARY, lineHeight: 1.2, textTransform: "uppercase" }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#555", lineHeight: 1.3 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 1.5, background: PRIMARY, margin: "4px 12px", opacity: 0.7 }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "4px 0 2px", position: "relative", zIndex: 2 }}>
        <span style={{ background: ACCENT, color: PRIMARY, fontSize: 9, fontWeight: 700, padding: "2px 14px", borderRadius: 3, border: `1px solid ${PRIMARY}`, letterSpacing: 1 }}>TEACHER ID CARD</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 4, overflow: "hidden", background: "#fef2f2" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "#666", fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "6px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 4, overflow: "hidden", background: "#fef2f2" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: PRIMARY, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: "#666", fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 4: Emerald Green ────────────────────────────────────────────────

const Pattern4: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#065f46";
  const ACCENT = "#a8a29e";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #ecfdf5 0%, #ffffff 50%, #f0fdf4 100%)", border: `2px solid ${PRIMARY}`, borderRadius: 10, boxShadow: "0 2px 8px rgba(6,95,70,0.15)", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Left green sidebar */}
      <div style={{ position: "absolute", top: 0, left: 0, width: isPortrait ? 8 : 6, height: "100%", background: `linear-gradient(180deg, ${PRIMARY}, #10b981)`, zIndex: 2 }} />
      {/* Leaf SVG decoration */}
      <svg style={{ position: "absolute", bottom: 10, right: 10, zIndex: 0, opacity: 0.08 }} width="80" height="80" viewBox="0 0 80 80">
        <path d="M40 0 C60 20, 80 40, 40 80 C0 40, 20 20, 40 0Z" fill={PRIMARY} />
      </svg>
      {/* Silver corner accents */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 40, height: 40, borderBottom: `2px solid ${ACCENT}`, borderLeft: `2px solid ${ACCENT}`, borderRadius: "0 0 0 40px", opacity: 0.4, zIndex: 1 }} />

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 78 : 8, right: 10, background: PRIMARY, color: "#fff", padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "18px 18px 6px 22px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${PRIMARY}` }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#555", lineHeight: 1.3 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 1.5, background: `linear-gradient(90deg, ${PRIMARY}, #10b981, transparent)`, margin: "3px 14px 3px 22px" }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "3px 0", position: "relative", zIndex: 2 }}>
        <span style={{ background: PRIMARY, color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 12px", borderRadius: 10, letterSpacing: 1 }}>FACULTY MEMBER</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2.5px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 8, overflow: "hidden", background: "#ecfdf5" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "#10b981", fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "5px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px 6px 22px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2.5px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 8, overflow: "hidden", background: "#ecfdf5" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: PRIMARY, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 22, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 5: Sunset Orange ────────────────────────────────────────────────

const Pattern5: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#c2410c";
  const DARK = "#1c1917";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #fff7ed 0%, #ffffff 60%, #fef3c7 100%)", border: `2px solid ${PRIMARY}`, borderRadius: 10, boxShadow: "0 2px 8px rgba(194,65,12,0.15)", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Top wave */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 0 }} viewBox="0 0 380 40" preserveAspectRatio="none">
        <path d={`M0,0 L${w},0 L${w},25 Q${w * 0.75},40 ${w * 0.5},30 Q${w * 0.25},20 0,35 Z`} fill={PRIMARY} opacity="0.9" />
      </svg>
      {/* Bottom wave */}
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", zIndex: 0 }} viewBox="0 0 380 30" preserveAspectRatio="none">
        <path d={`M0,30 L${w},30 L${w},10 Q${w * 0.75},0 ${w * 0.5},8 Q${w * 0.25},16 0,5 Z`} fill={PRIMARY} opacity="0.8" />
      </svg>
      {/* Sun circle decoration */}
      <div style={{ position: "absolute", top: isPortrait ? 50 : 30, right: isPortrait ? -20 : -10, width: 60, height: 60, borderRadius: "50%", background: PRIMARY, opacity: 0.06, zIndex: 0 }} />

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 78 : 8, right: 10, background: DARK, color: "#fb923c", padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "14px 16px 6px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", border: "2px solid #fff" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#fed7aa", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 1.5, background: `linear-gradient(90deg, ${PRIMARY}, #f97316, transparent)`, margin: "6px 12px" }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "3px 0", position: "relative", zIndex: 2 }}>
        <span style={{ background: DARK, color: "#fb923c", fontSize: 8, fontWeight: 700, padding: "2px 12px", borderRadius: 3, letterSpacing: 1 }}>TEACHER</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2.5px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 8, overflow: "hidden", background: "#fff7ed" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: DARK, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "5px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2.5px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 8, overflow: "hidden", background: "#fff7ed" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: PRIMARY, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: PRIMARY, fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: DARK }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${DARK}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 6: Royal Purple ─────────────────────────────────────────────────

const Pattern6: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#581c87";
  const ACCENT = "#d4af37";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #faf5ff 0%, #f3e8ff 50%, #faf5ff 100%)", border: `2.5px solid ${PRIMARY}`, borderRadius: 10, boxShadow: "0 2px 10px rgba(88,28,135,0.2)", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Ornamental border */}
      <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, border: `1.5px solid ${ACCENT}`, borderRadius: 7, zIndex: 1 }} />
      {/* Top decorative arch */}
      <svg style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", zIndex: 1 }} width="120" height="30">
        <path d="M0,30 Q60,0 120,30" fill="none" stroke={ACCENT} strokeWidth="2" />
      </svg>
      {/* Bottom decorative arch */}
      <svg style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", zIndex: 1 }} width="120" height="30">
        <path d="M0,0 Q60,30 120,0" fill="none" stroke={ACCENT} strokeWidth="2" />
      </svg>
      {/* Crown decoration */}
      <svg style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 0, opacity: 0.06 }} width="60" height="40" viewBox="0 0 60 40">
        <path d="M5,35 L15,10 L30,25 L45,10 L55,35 Z" fill={PRIMARY} />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 78 : 8, right: 10, background: PRIMARY, color: ACCENT, padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "18px 18px 6px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${ACCENT}` }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#666", lineHeight: 1.3 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: `linear-gradient(90deg, ${ACCENT}, ${PRIMARY}, ${ACCENT})`, margin: "3px 14px" }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "4px 0 2px", position: "relative", zIndex: 2 }}>
        <span style={{ background: PRIMARY, color: ACCENT, fontSize: 9, fontWeight: 700, padding: "2px 14px", borderRadius: 3, letterSpacing: 1.5 }}>TEACHER</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `3px solid ${ACCENT}`, borderRadius: photoShape === "circle" ? "50%" : 8, overflow: "hidden", background: "#faf5ff", boxShadow: `0 0 0 2px ${PRIMARY}` }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: ACCENT, fontWeight: 700, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "5px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `3px solid ${ACCENT}`, borderRadius: photoShape === "circle" ? "50%" : 8, overflow: "hidden", background: "#faf5ff", boxShadow: `0 0 0 2px ${PRIMARY}` }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: ACCENT, fontWeight: 700 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 7: Tech Blue ────────────────────────────────────────────────────

const Pattern7: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#0369a1";
  const LIGHT = "#e0f2fe";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, #f0f9ff 0%, ${LIGHT} 100%)`, border: `2px solid ${PRIMARY}`, borderRadius: 10, boxShadow: "0 2px 8px rgba(3,105,161,0.15)", fontFamily: "'Courier New', monospace" }}>
      {/* Geometric grid pattern */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.04 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 35} x2={w} y2={i * 35} stroke={PRIMARY} strokeWidth="1" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 35} y1="0" x2={i * 35} y2={h} stroke={PRIMARY} strokeWidth="1" />
        ))}
      </svg>
      {/* Circuit-like decoration */}
      <svg style={{ position: "absolute", top: 10, right: 10, zIndex: 0, opacity: 0.08 }} width="60" height="60">
        <circle cx="30" cy="30" r="4" fill={PRIMARY} />
        <line x1="30" y1="34" x2="30" y2="55" stroke={PRIMARY} strokeWidth="2" />
        <line x1="34" y1="30" x2="55" y2="30" stroke={PRIMARY} strokeWidth="2" />
        <circle cx="55" cy="30" r="3" fill="none" stroke={PRIMARY} strokeWidth="1.5" />
        <circle cx="30" cy="55" r="3" fill="none" stroke={PRIMARY} strokeWidth="1.5" />
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 78 : 8, right: 10, background: PRIMARY, color: "#fff", padding: "3px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, zIndex: 3, fontFamily: "monospace" }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "18px 16px 6px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", border: `2px solid ${PRIMARY}` }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: PRIMARY, lineHeight: 1.2, fontFamily: "'Segoe UI', sans-serif" }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#555", lineHeight: 1.3 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: PRIMARY, margin: "3px 12px", opacity: 0.6 }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "3px 0", position: "relative", zIndex: 2 }}>
        <span style={{ background: "transparent", color: PRIMARY, fontSize: 8, fontWeight: 700, padding: "2px 12px", borderRadius: 3, border: `1.5px solid ${PRIMARY}`, letterSpacing: 2, fontFamily: "monospace" }}>&lt;TEACHER /&gt;</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#f0f9ff" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2, fontFamily: "'Segoe UI', sans-serif" }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "#0284c7", fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "5px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#f0f9ff" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: PRIMARY, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, fontFamily: "'Segoe UI', sans-serif" }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: "#0284c7", fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 8: Elegant Black ────────────────────────────────────────────────

const Pattern8: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#18181b";
  const ACCENT = "#d4af37";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: `linear-gradient(160deg, ${PRIMARY} 0%, #27272a 50%, #1f1f23 100%)`, border: `2px solid ${ACCENT}`, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.3)", fontFamily: "'Segoe UI', sans-serif", color: "#fff" }}>
      {/* Inner gold border */}
      <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, border: `1px solid ${ACCENT}`, borderRadius: 7, zIndex: 1, opacity: 0.5 }} />
      {/* Diamond pattern */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.03 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <React.Fragment key={i}>
            <line x1={i * 50} y1="0" x2={i * 50 + h} y2={h} stroke="#fff" strokeWidth="0.5" />
            <line x1={i * 50} y1={h} x2={i * 50 + h} y2="0" stroke="#fff" strokeWidth="0.5" />
          </React.Fragment>
        ))}
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 78 : 8, right: 10, background: ACCENT, color: PRIMARY, padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "18px 16px 6px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${ACCENT}` }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: ACCENT, lineHeight: 1.2 }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#a1a1aa", lineHeight: 1.3 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 1.5, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, margin: "3px 14px" }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "4px 0 2px", position: "relative", zIndex: 2 }}>
        <span style={{ background: "transparent", color: ACCENT, fontSize: 9, fontWeight: 700, padding: "2px 14px", borderRadius: 3, border: `1px solid ${ACCENT}`, letterSpacing: 2 }}>TEACHER</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2.5px solid ${ACCENT}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#27272a" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: "#fff", position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: ACCENT, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "5px 16px", fontSize: 10, color: "#e4e4e7", position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: ACCENT, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2.5px solid ${ACCENT}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#27272a" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: ACCENT, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: ACCENT, fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9, color: "#e4e4e7" }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: ACCENT, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: ACCENT }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#71717a", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${ACCENT}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#a1a1aa" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 9: Fresh Teal ───────────────────────────────────────────────────

const Pattern9: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#0d9488";
  const LIGHT = "#f0fdfa";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#ffffff", border: `2px solid ${PRIMARY}`, borderRadius: 14, boxShadow: "0 2px 8px rgba(13,148,136,0.12)", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Minimal top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${PRIMARY}, #14b8a6, #5eead4)`, zIndex: 2 }} />
      {/* Subtle dots pattern */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.03 }}>
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 30 + 15} cy={row * 40 + 20} r="2" fill={PRIMARY} />
          ))
        )}
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 72 : 8, right: 10, background: LIGHT, color: PRIMARY, padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, zIndex: 3, border: `1px solid ${PRIMARY}` }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "16px 16px 6px", gap: 8 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#555", lineHeight: 1.3 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 1, background: PRIMARY, margin: "4px 14px", opacity: 0.3 }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "4px 0 2px", position: "relative", zIndex: 2 }}>
        <span style={{ background: LIGHT, color: PRIMARY, fontSize: 9, fontWeight: 700, padding: "3px 16px", borderRadius: 12, border: `1px solid ${PRIMARY}` }}>TEACHER</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 10, overflow: "hidden", background: LIGHT }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: "#1f2937", position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "5px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span style={{ color: "#374151" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 10, overflow: "hidden", background: LIGHT }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: PRIMARY, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: PRIMARY, fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span style={{ color: "#374151" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 10: Corporate Gray ──────────────────────────────────────────────

const Pattern10: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#374151";
  const ACCENT = "#2563eb";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)", border: `2px solid ${PRIMARY}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(55,65,81,0.15)", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Top blue accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: ACCENT, zIndex: 2 }} />
      {/* Right side blue strip */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: ACCENT, zIndex: 2 }} />
      {/* Subtle diagonal lines */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.02 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={i} x1={i * 25 - 50} y1="0" x2={i * 25 + h} y2={h} stroke={PRIMARY} strokeWidth="1" />
        ))}
      </svg>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 75 : 10, right: 10, background: ACCENT, color: "#fff", padding: "3px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "18px 16px 6px", gap: 6 }}>
        {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: PRIMARY, lineHeight: 1.2, textTransform: "uppercase" }}>{tenant?.name || "INSTITUTION NAME"}</div>
          <div style={{ fontSize: 8, color: "#6b7280", lineHeight: 1.3 }}>{tenant?.address || ""}</div>
        </div>
      </div>

      <div style={{ height: 2, background: `linear-gradient(90deg, ${ACCENT}, ${PRIMARY})`, margin: "3px 12px" }} />

      {/* TEACHER badge */}
      <div style={{ textAlign: "center", margin: "4px 0 2px", position: "relative", zIndex: 2 }}>
        <span style={{ background: PRIMARY, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 14px", borderRadius: 3, letterSpacing: 1 }}>STAFF ID</span>
      </div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 4, overflow: "hidden", background: "#f9fafb" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: ACCENT, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "5px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 65 }}>• {item.label}</span>
                <span style={{ margin: "0 4px" }}>:</span>
                <span style={{ color: "#4b5563" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 4, overflow: "hidden", background: "#f9fafb" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
              <div style={{ fontSize: 8, color: ACCENT, fontWeight: 600 }}>ID: {teacher.employeeId || teacher.teacherId || "N/A"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: ACCENT, fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: PRIMARY, minWidth: 58 }}>• {item.label}</span>
                    <span style={{ margin: "0 3px" }}>:</span>
                    <span style={{ color: "#4b5563" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
          {!tenant?.principalSignUrl && <div style={{ width: 50, borderTop: `1px solid ${PRIMARY}` }} />}
          {tenant?.principalSignUrl ? <img src={getFullUrl(tenant.principalSignUrl)} crossOrigin="anonymous" style={{ width: 50, height: 20, objectFit: "contain", mixBlendMode: "darken" }} /> : null}<div style={{ fontSize: 7, color: "#555" }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 11: School Classic Green ─────────────────────────────────────────

const Pattern11: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const signatureUrl = getFullUrl(tenant?.principalSignUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#166534";
  const GOLD = "#b8860b";
  const LIGHT_GREEN = "#f0fdf4";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#ffffff", border: `3px solid ${PRIMARY}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(22,101,52,0.2)", fontFamily: "'Georgia', serif" }}>
      {/* Double border */}
      <div style={{ position: "absolute", top: 4, left: 4, right: 4, bottom: 4, border: `2px solid ${PRIMARY}`, borderRadius: 5, zIndex: 1 }} />
      <div style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, border: `1px solid ${GOLD}`, borderRadius: 3, zIndex: 1 }} />
      {/* Watermark logo */}
      {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: isPortrait ? 140 : 100, height: isPortrait ? 140 : 100, objectFit: "contain", opacity: 0.06, zIndex: 0 }} />}
      {/* Green banner header */}
      <div style={{ position: "relative", zIndex: 2, background: `linear-gradient(135deg, ${PRIMARY}, #15803d)`, padding: "10px 14px 8px", borderBottom: `3px solid ${GOLD}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${GOLD}` }} />}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, lineHeight: 1.2, textTransform: "uppercase", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{tenant?.name || "INSTITUTION NAME"}</div>
            <div style={{ fontSize: 8, color: "#dcfce7", lineHeight: 1.2, marginTop: 1 }}>{tenant?.address || ""}</div>
          </div>
        </div>
        {/* Ribbon-style STAFF IDENTITY CARD label */}
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span style={{ background: GOLD, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 16px", borderRadius: 2, letterSpacing: 1.5 }}>STAFF IDENTITY CARD</span>
        </div>
      </div>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 72 : 6, right: 14, background: GOLD, color: "#fff", padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `3px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: LIGHT_GREEN, boxShadow: `0 0 0 2px ${GOLD}` }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ padding: "6px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 700, color: PRIMARY, minWidth: 70 }}>{item.label}</span>
                <span style={{ margin: "0 4px", color: GOLD }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "8px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `3px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: LIGHT_GREEN, boxShadow: `0 0 0 2px ${GOLD}` }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 700, color: PRIMARY, minWidth: 60 }}>{item.label}</span>
                    <span style={{ margin: "0 3px", color: GOLD }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer with signature */}
      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {signatureUrl ? (
            <img src={signatureUrl} crossOrigin="anonymous" style={{ width: 55, height: 22, objectFit: "contain", mixBlendMode: "darken" }} />
          ) : (
            <div style={{ width: 60, borderTop: `1.5px solid ${PRIMARY}`, marginBottom: 2 }} />
          )}
          <div style={{ fontSize: 7, color: PRIMARY, fontWeight: 600 }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 12: Official Maroon ──────────────────────────────────────────────

const Pattern12: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const signatureUrl = getFullUrl(tenant?.principalSignUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#7f1d1d";
  const GOLD = "#d4af37";
  const CREAM = "#fef7ed";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: CREAM, border: `3px solid ${PRIMARY}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(127,29,29,0.2)", fontFamily: "'Georgia', serif" }}>
      {/* Double border */}
      <div style={{ position: "absolute", top: 4, left: 4, right: 4, bottom: 4, border: `1.5px solid ${PRIMARY}`, borderRadius: 5, zIndex: 1 }} />
      <div style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, border: `1px solid ${GOLD}`, borderRadius: 3, opacity: 0.7, zIndex: 1 }} />
      {/* Corner ornaments */}
      <svg style={{ position: "absolute", top: 6, left: 6, zIndex: 1 }} width="30" height="30"><path d="M0,0 L20,0 Q10,10 0,20 Z" fill={GOLD} opacity="0.3" /></svg>
      <svg style={{ position: "absolute", top: 6, right: 6, zIndex: 1 }} width="30" height="30"><path d="M30,0 L10,0 Q20,10 30,20 Z" fill={GOLD} opacity="0.3" /></svg>
      <svg style={{ position: "absolute", bottom: 6, left: 6, zIndex: 1 }} width="30" height="30"><path d="M0,30 L20,30 Q10,20 0,10 Z" fill={GOLD} opacity="0.3" /></svg>
      <svg style={{ position: "absolute", bottom: 6, right: 6, zIndex: 1 }} width="30" height="30"><path d="M30,30 L10,30 Q20,20 30,10 Z" fill={GOLD} opacity="0.3" /></svg>

      {/* Maroon header */}
      <div style={{ position: "relative", zIndex: 2, background: `linear-gradient(135deg, ${PRIMARY}, #991b1b)`, padding: "10px 14px 8px", borderBottom: `2px solid ${GOLD}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `2px solid ${GOLD}` }} />}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", lineHeight: 1.2, textTransform: "uppercase" }}>{tenant?.name || "INSTITUTION NAME"}</div>
            <div style={{ fontSize: 8, color: "#fecaca", lineHeight: 1.2, marginTop: 1 }}>{tenant?.address || ""}</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span style={{ background: GOLD, color: PRIMARY, fontSize: 9, fontWeight: 700, padding: "2px 14px", borderRadius: 2, letterSpacing: 1.2 }}>STAFF IDENTITY CARD</span>
        </div>
      </div>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 72 : 6, right: 14, background: PRIMARY, color: GOLD, padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2.5px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#fff", boxShadow: `0 0 0 2px ${GOLD}` }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: PRIMARY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: GOLD, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "6px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 700, color: PRIMARY, minWidth: 70 }}>{item.label}</span>
                <span style={{ margin: "0 4px", color: GOLD }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "8px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2.5px solid ${PRIMARY}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#fff", boxShadow: `0 0 0 2px ${GOLD}` }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: GOLD, fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 700, color: PRIMARY, minWidth: 60 }}>{item.label}</span>
                    <span style={{ margin: "0 3px", color: GOLD }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer with signature */}
      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: PRIMARY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {signatureUrl ? (
            <img src={signatureUrl} crossOrigin="anonymous" style={{ width: 55, height: 22, objectFit: "contain", mixBlendMode: "darken" }} />
          ) : (
            <div style={{ width: 60, borderTop: `1.5px solid ${PRIMARY}`, marginBottom: 2 }} />
          )}
          <div style={{ fontSize: 7, color: PRIMARY, fontWeight: 600 }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 13: Tri-Color Badge ──────────────────────────────────────────────

const Pattern13: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const signatureUrl = getFullUrl(tenant?.principalSignUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const SAFFRON = "#f97316";
  const GREEN = "#16a34a";
  const NAVY = "#1e3a5f";

  const photoW = isPortrait ? 85 : 65;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 105 : 80);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#ffffff", border: `2px solid ${NAVY}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(30,58,95,0.15)", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Tri-color top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, display: "flex", zIndex: 2 }}>
        <div style={{ flex: 1, background: SAFFRON }} />
        <div style={{ flex: 1, background: "#ffffff" }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>
      {/* Tri-color bottom stripe */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, display: "flex", zIndex: 2 }}>
        <div style={{ flex: 1, background: SAFFRON }} />
        <div style={{ flex: 1, background: "#ffffff" }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, padding: "14px 14px 4px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `2px solid ${SAFFRON}` }} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, lineHeight: 1.2, textTransform: "uppercase" }}>{tenant?.name || "INSTITUTION NAME"}</div>
            <div style={{ fontSize: 8, color: "#555", lineHeight: 1.2 }}>{tenant?.address || ""}</div>
          </div>
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{ background: `linear-gradient(90deg, ${SAFFRON}, ${GREEN})`, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 14px", borderRadius: 10, letterSpacing: 1 }}>STAFF IDENTITY CARD</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1.5, background: `linear-gradient(90deg, ${SAFFRON}, #fff, ${GREEN})`, margin: "4px 12px" }} />

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 70 : 8, right: 12, background: NAVY, color: "#fff", padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `3px solid ${NAVY}`, borderRadius: photoShape === "circle" ? "50%" : "50%", overflow: "hidden", background: "#f8fafc" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: NAVY, position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: GREEN, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "6px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: NAVY, minWidth: 65 }}>{item.label}</span>
                <span style={{ margin: "0 4px", color: SAFFRON }}>:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "6px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `3px solid ${NAVY}`, borderRadius: photoShape === "circle" ? "50%" : "50%", overflow: "hidden", background: "#f8fafc" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: GREEN, fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: NAVY, minWidth: 58 }}>{item.label}</span>
                    <span style={{ margin: "0 3px", color: SAFFRON }}>:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer with signature */}
      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: NAVY }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#666", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {signatureUrl ? (
            <img src={signatureUrl} crossOrigin="anonymous" style={{ width: 55, height: 22, objectFit: "contain", mixBlendMode: "darken" }} />
          ) : (
            <div style={{ width: 60, borderTop: `1.5px solid ${NAVY}`, marginBottom: 2 }} />
          )}
          <div style={{ fontSize: 7, color: NAVY, fontWeight: 600 }}>Authorized Signature</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 14: Modern Minimal Card ──────────────────────────────────────────

const Pattern14: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const signatureUrl = getFullUrl(tenant?.principalSignUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const PRIMARY = "#1e40af";
  const LIGHT = "#eff6ff";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#ffffff", border: `1.5px solid #e2e8f0`, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Thin colored top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: PRIMARY, zIndex: 2 }} />
      {/* Subtle side accent */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: `linear-gradient(180deg, ${PRIMARY}, transparent)`, zIndex: 2 }} />

      {/* Header - school name large */}
      <div style={{ position: "relative", zIndex: 2, padding: "16px 16px 6px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />}
          <div style={{ fontSize: 15, fontWeight: 800, color: PRIMARY, lineHeight: 1.2 }}>{tenant?.name || "INSTITUTION NAME"}</div>
        </div>
        <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>{tenant?.address || ""}</div>
        <div style={{ marginTop: 4 }}>
          <span style={{ background: LIGHT, color: PRIMARY, fontSize: 9, fontWeight: 600, padding: "3px 12px", borderRadius: 12, border: `1px solid ${PRIMARY}` }}>STAFF IDENTITY CARD</span>
        </div>
      </div>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: 8, right: 12, background: LIGHT, color: PRIMARY, padding: "2px 8px", borderRadius: 8, fontSize: 9, fontWeight: 600, border: `1px solid ${PRIMARY}`, zIndex: 3 }}>{academicYearName}</div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `2px solid #e2e8f0`, borderRadius: photoShape === "circle" ? "50%" : 12, overflow: "hidden", background: "#f8fafc" }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 14, fontWeight: 700, color: "#1e293b", position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: PRIMARY, fontWeight: 500, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "8px 18px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 3, padding: "2px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontWeight: 600, color: "#475569", minWidth: 65 }}>{item.label}</span>
                <span style={{ margin: "0 6px", color: "#94a3b8" }}>:</span>
                <span style={{ color: "#1e293b" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "8px 16px", gap: 14, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `2px solid #e2e8f0`, borderRadius: photoShape === "circle" ? "50%" : 12, overflow: "hidden", background: "#f8fafc" }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 10 }}>Photo</div>}
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: PRIMARY, fontWeight: 500 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 2, padding: "1px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontWeight: 600, color: "#475569", minWidth: 58 }}>{item.label}</span>
                    <span style={{ margin: "0 4px", color: "#94a3b8" }}>:</span>
                    <span style={{ color: "#1e293b" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer with signature */}
      <div style={{ position: "absolute", bottom: 12, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: "#94a3b8" }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#94a3b8", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {signatureUrl ? (
            <img src={signatureUrl} crossOrigin="anonymous" style={{ width: 55, height: 22, objectFit: "contain", mixBlendMode: "darken" }} />
          ) : (
            <div style={{ width: 60, borderTop: `1.5px solid #475569`, marginBottom: 2 }} />
          )}
          <div style={{ fontSize: 7, color: "#475569", fontWeight: 600 }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ─── Pattern 15: Premium Dark ─────────────────────────────────────────────────

const Pattern15: React.FC<PatternProps> = ({ teacher, tenant, academicYearName, orientation, photoShape }) => {
  const photoUrl = getFullUrl(teacher.photoUrl);
  const logoUrl = getFullUrl(tenant?.logoUrl);
  const signatureUrl = getFullUrl(tenant?.principalSignUrl);
  const isPortrait = orientation === "portrait";
  const w = isPortrait ? 240 : 380;
  const h = isPortrait ? 380 : 240;
  const BG = "#1e293b";
  const GOLD = "#d4af37";
  const DARK = "#0f172a";

  const photoW = isPortrait ? 90 : 70;
  const photoH = photoShape === "circle" ? photoW : (isPortrait ? 110 : 85);

  return (
    <div className="id-card" style={{ width: w, height: h, position: "relative", overflow: "hidden", background: `linear-gradient(160deg, ${BG} 0%, ${DARK} 100%)`, border: `2.5px solid ${GOLD}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", fontFamily: "'Georgia', serif" }}>
      {/* Inner gold border */}
      <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, border: `1px solid ${GOLD}`, borderRadius: 5, opacity: 0.5, zIndex: 1 }} />
      {/* Subtle diagonal gold lines */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.04 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={i} x1={i * 30 - 20} y1="0" x2={i * 30 + h} y2={h} stroke={GOLD} strokeWidth="1" />
        ))}
      </svg>
      {/* Corner gold accents */}
      <svg style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} width="40" height="40"><path d="M0,0 L30,0 L0,30 Z" fill={GOLD} opacity="0.15" /></svg>
      <svg style={{ position: "absolute", bottom: 0, right: 0, zIndex: 1 }} width="40" height="40"><path d="M40,40 L10,40 L40,10 Z" fill={GOLD} opacity="0.15" /></svg>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, padding: "14px 14px 6px", textAlign: "center", borderBottom: `1.5px solid ${GOLD}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {logoUrl && <img src={logoUrl} crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `2px solid ${GOLD}` }} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, lineHeight: 1.2, textTransform: "uppercase", letterSpacing: 0.5 }}>{tenant?.name || "INSTITUTION NAME"}</div>
            <div style={{ fontSize: 8, color: "#94a3b8", lineHeight: 1.2, marginTop: 1 }}>{tenant?.address || ""}</div>
          </div>
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{ border: `1px solid ${GOLD}`, color: GOLD, fontSize: 9, fontWeight: 700, padding: "2px 14px", borderRadius: 3, letterSpacing: 1.5 }}>STAFF IDENTITY CARD</span>
        </div>
      </div>

      {/* Academic Year Badge */}
      <div style={{ position: "absolute", top: isPortrait ? 72 : 8, right: 12, background: GOLD, color: DARK, padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, zIndex: 3 }}>{academicYearName}</div>

      {isPortrait ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10, position: "relative", zIndex: 2 }}>
            <div style={{ width: photoW, height: photoH, border: `3px solid ${GOLD}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#334155", boxShadow: `0 0 8px rgba(212,175,55,0.3)` }}>
              {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 10 }}>Photo</div>}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: 700, color: "#ffffff", position: "relative", zIndex: 2 }}>
            {capitalizeName(teacher.name)}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: GOLD, fontWeight: 600, position: "relative", zIndex: 2 }}>
            {teacher.designation || "Faculty"}
          </div>
          <div style={{ padding: "6px 16px", fontSize: 10, position: "relative", zIndex: 2 }}>
            {getDetailItems(teacher).map((item, idx) => (
              <div key={idx} style={{ display: "flex", marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: GOLD, minWidth: 65 }}>{item.label}</span>
                <span style={{ margin: "0 4px", color: "#64748b" }}>:</span>
                <span style={{ color: "#e2e8f0" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", padding: "8px 14px", gap: 12, flex: 1, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: photoW, height: photoH, border: `3px solid ${GOLD}`, borderRadius: photoShape === "circle" ? "50%" : 6, overflow: "hidden", background: "#334155", boxShadow: `0 0 8px rgba(212,175,55,0.3)` }}>
                {photoUrl ? <img src={photoUrl} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 10 }}>Photo</div>}
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                {capitalizeName(teacher.name)}
              </div>
              <div style={{ fontSize: 9, color: GOLD, fontWeight: 600 }}>{teacher.designation || "Faculty"}</div>
              <div style={{ fontSize: 9 }}>
                {getDetailItems(teacher).map((item, idx) => (
                  <div key={idx} style={{ display: "flex", marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, color: GOLD, minWidth: 58 }}>{item.label}</span>
                    <span style={{ margin: "0 3px", color: "#64748b" }}>:</span>
                    <span style={{ color: "#e2e8f0" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer with signature */}
      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            {[4,8,6,10,4,8,6,10,4,8,6,4,10,6,8,4,8,6,10,4].map((bh, i) => (
              <div key={i} style={{ width: 1.5, height: bh, background: GOLD }} />
            ))}
          </div>
          <div style={{ fontSize: 6, color: "#64748b", marginTop: 1 }}>Barcode</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {signatureUrl ? (
            <img src={signatureUrl} crossOrigin="anonymous" style={{ width: 55, height: 22, objectFit: "contain", mixBlendMode: "darken" }} />
          ) : (
            <div style={{ width: 60, borderTop: `1.5px solid ${GOLD}`, marginBottom: 2 }} />
          )}
          <div style={{ fontSize: 7, color: GOLD, fontWeight: 600 }}>Principal</div>
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
  14: Pattern14,
  15: Pattern15,
};

const patternLabels: Record<number, string> = {
  1: "Professional Navy",
  2: "Modern Gradient",
  3: "Classic Red",
  4: "Emerald Green",
  5: "Sunset Orange",
  6: "Royal Purple",
  7: "Tech Blue",
  8: "Elegant Black",
  9: "Fresh Teal",
  10: "Corporate Gray",
  11: "School Classic Green",
  12: "Official Maroon",
  13: "Tri-Color Badge",
  14: "Modern Minimal Card",
  15: "Premium Dark",
};

const patternColors: Record<number, string> = {
  1: "#1b2a4a",
  2: "#5b21b6",
  3: "#b91c1c",
  4: "#065f46",
  5: "#c2410c",
  6: "#581c87",
  7: "#0369a1",
  8: "#18181b",
  9: "#0d9488",
  10: "#374151",
  11: "#166534",
  12: "#7f1d1d",
  13: "#f97316",
  14: "#ffffff",
  15: "#1e293b",
};


// ─── Custom Template Card (YN-UDP) ───────────────────────────────────────────
const CustomTemplateCard: React.FC<{ template: any; teacher: any; tenant: any; academicYearName: string }> = ({ template, teacher, tenant, academicYearName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fillPlaceholder = (text: string) => {
    if (!text) return text;
    const name = teacher.name || `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();
    return text
      .replace(/\{\{school_name\}\}/g, tenant?.name || "")
      .replace(/\{\{school_address\}\}/g, tenant?.address || "")
      .replace(/\{\{school_phone\}\}/g, tenant?.phone || "")
      .replace(/\{\{school_email\}\}/g, tenant?.email || "")
      .replace(/\{\{teacher_name\}\}/g, name)
      .replace(/\{\{student_name\}\}/g, name)
      .replace(/\{\{first_name\}\}/g, teacher.firstName || "")
      .replace(/\{\{last_name\}\}/g, teacher.lastName || "")
      .replace(/\{\{father_name\}\}/g, teacher.fatherName || "")
      .replace(/\{\{phone\}\}/g, teacher.phone || "")
      .replace(/\{\{email\}\}/g, teacher.email || "")
      .replace(/\{\{class_name\}\}/g, teacher.designation || "Teacher")
      .replace(/\{\{section_name\}\}/g, "")
      .replace(/\{\{roll_number\}\}/g, teacher.employeeId || "")
      .replace(/\{\{admission_no\}\}/g, teacher.employeeId || "")
      .replace(/\{\{dob\}\}/g, teacher.dob ? new Date(teacher.dob).toLocaleDateString("en-IN") : "")
      .replace(/\{\{academic_year\}\}/g, academicYearName || "")
      .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString("en-IN"))
      .replace(/\{\{[^}]+\}\}/g, "");
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template?.canvasJSON?.elements) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = template.canvasJSON.pageBg || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    template.canvasJSON.elements.forEach((el: any) => {
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
        if (el.stroke && el.stroke !== "transparent") { ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke(); }
      } else if (el.type === "line") {
        ctx.beginPath(); ctx.moveTo(el.x, el.y + el.height / 2); ctx.lineTo(el.x + el.width, el.y + el.height / 2);
        ctx.strokeStyle = el.stroke || "#000"; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
      } else if (el.type === "text" || el.type === "field") {
        const text = fillPlaceholder(el.text || "");
        const weight = el.fontWeight === "bold" ? "bold" : "";
        const fStyle = el.fontStyle === "italic" ? "italic" : "";
        ctx.font = `${fStyle} ${weight} ${el.fontSize || 14}px ${el.fontFamily || "Arial"}`;
        ctx.fillStyle = el.color || "#000000";
        const align = el.textAlign || "left";
        ctx.textAlign = align as any;
        let textX = el.x;
        if (align === "center") textX = el.x + el.width / 2;
        else if (align === "right") textX = el.x + el.width;
        ctx.fillText(text, textX, el.y + (el.fontSize || 14));
      }
      ctx.restore();
    });
  }, [template, teacher, tenant, academicYearName]);
  const w = template?.pageWidth || 382;
  const h = template?.pageHeight || 550;
  return (
    <div style={{ width: w * 0.55, height: h * 0.55, margin: "4px" }}>
      <canvas ref={canvasRef} width={w} height={h} style={{ width: "100%", height: "100%", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherIdCardPage: React.FC = () => {
  const [mode, setMode] = useState<"individual" | "all">("individual");
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherData[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("portrait");
  const [photoShape, setPhotoShape] = useState<"rectangle" | "circle">("rectangle");
  const [cardsPerPage, setCardsPerPage] = useState<number>(6);
  const [selectedPattern, setSelectedPattern] = useState<number>(1);
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<any>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [tenant, setTenant] = useState<any>(null);
  const [showCards, setShowCards] = useState<boolean>(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  const printRef = useRef<HTMLDivElement>(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/teacher", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Response: { success, data: { data: [...teachers], meta: {...} } }
      const raw = res.data?.data;
      const teacherList = Array.isArray(raw) ? raw : (raw?.data || raw?.teachers || []);
      setTeachers(teacherList);
      setFilteredTeachers(teacherList);
    } catch (err) {
      console.error("Failed to fetch teachers", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get("/api/academic");
      const years = res.data.data || [];
      const active = years.find((y: any) => y.isActive);
      if (active?.name) setActiveAcademicYear(active.name);
    } catch (err) {
      console.error("Failed to fetch academic years", err);
    }
  };

  const loadTenant = () => {
    try {
      const raw = localStorage.getItem("tenant");
      if (raw) setTenant(JSON.parse(raw));
    } catch (err) {}
  };

  const fetchPrincipalSignature = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/signature", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const signatures = res.data?.data || res.data || [];
      const sigArray = Array.isArray(signatures) ? signatures : [];
      // First try "principal" match, else use first active signature
      const principalSig = sigArray.find(
        (s: any) => s.isActive && s.title?.toLowerCase().includes("principal")
      ) || sigArray.find((s: any) => s.isActive);
      if (principalSig?.imageUrl) {
        setTenant((prev: any) => ({ ...prev, principalSignUrl: principalSig.imageUrl }));
      }
    } catch (err) {
      console.error("Failed to fetch signatures", err);
    }
  };

  
  // Fetch custom templates from YN-UDP Designer
  useEffect(() => {
    const fetchCustomTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const tenantId = localStorage.getItem("tenantId") || "000000000000000000000000";
        let res = await axios.get(`/api/designer/templates?tenantId=${tenantId}&type=id-card`).catch(() => null);
        if (!res?.data?.data?.length) {
          res = await axios.get(`/api/designer/templates?tenantId=000000000000000000000000&type=id-card`).catch(() => null);
        }
        if (!res?.data?.data?.length) {
          res = await axios.get(`/api/designer/templates?tenantId=000000000000000000000000`).catch(() => null);
        }
        if (res?.data?.success) {
          setCustomTemplates(res.data.data || []);
        }
      } catch (err) {
        console.log("YN-UDP templates not available:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchCustomTemplates();
  }, []);

useEffect(() => {
    loadTenant();
    fetchTeachers();
    fetchAcademicYears();
    fetchPrincipalSignature();
  }, []);

  useEffect(() => {
    let result = [...teachers];
    if (departmentFilter) {
      result = result.filter((t) => t.department?.toLowerCase().includes(departmentFilter.toLowerCase()));
    }
    if (subjectFilter) {
      result = result.filter((t) => {
        const subjects = Array.isArray(t.subjects)
          ? t.subjects.map((s: any) => typeof s === "string" ? s : (s.name || "")).join(", ")
          : (t.subjects || "");
        return subjects.toLowerCase().includes(subjectFilter.toLowerCase());
      });
    }
    setFilteredTeachers(result);
  }, [departmentFilter, subjectFilter, teachers]);

  const departments = [...new Set(teachers.map((t) => t.department).filter(Boolean))] as string[];
  const allSubjects = [...new Set(
    teachers.flatMap((t) => Array.isArray(t.subjects)
      ? t.subjects.map((s: any) => typeof s === "string" ? s : (s.name || ""))
      : (t.subjects ? [t.subjects] : []))
  )] as string[];

  const handleTeacherSelect = (teacher: TeacherData) => {
    setSelectedTeacher(teacher);
    setShowCards(true);
  };

  const handleGenerateAll = () => {
    if (filteredTeachers.length === 0) return;
    setShowCards(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const gap = 3;
      const cols = 3;
      const rows = 3;
      const usableW = pageW - margin * 2;
      const cardW = (usableW - gap * (cols - 1)) / cols;
      const cards = printRef.current.querySelectorAll(".id-card") as NodeListOf<HTMLElement>;
      let currentX = margin, currentY = margin, colIndex = 0, rowHeight = 0;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardNativeW = card.offsetWidth;
        const cardNativeH = card.offsetHeight;

        const imgs = Array.from(card.querySelectorAll("img") as NodeListOf<HTMLImageElement>);
        const origSrcs = imgs.map((img) => img.src);
        await Promise.all(
          imgs.map(async (img, idx) => {
            if (origSrcs[idx]) {
              img.src = await imgToDataURL(origSrcs[idx]);
            }
          })
        );

        const canvas = await html2canvas(card, {
          scale: 3,
          backgroundColor: "#ffffff",
          logging: false,
          width: cardNativeW,
          height: cardNativeH,
        });

        imgs.forEach((img, idx) => { img.src = origSrcs[idx]; });

        const ratio = cardNativeH / cardNativeW;
        const usableH = pageH - margin * 2;
        const cardH = (usableH - gap * (rows - 1)) / rows;
        if (currentY + cardH > pageH - margin) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", currentX, currentY, cardW, cardH);
        rowHeight = Math.max(rowHeight, cardH);
        colIndex++;
        if (colIndex >= cols) {
          colIndex = 0;
          currentX = margin;
          currentY += rowHeight + gap;
          rowHeight = 0;
          if (currentY > pageH - margin - 20) {
            pdf.addPage();
            currentY = margin;
          }
        } else {
          currentX += cardW + gap;
        }
      }
      pdf.save(`Teacher_ID_Cards_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  const cardsToDisplay: TeacherData[] = mode === "individual" ? (selectedTeacher ? [selectedTeacher] : []) : filteredTeachers;
  const PatternComponent = patternComponents[selectedPattern] || patternComponents[1];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 5mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 3mm !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            align-items: start !important;
            justify-items: center !important;
          }
          .id-card {
            width: 63mm !important;
            height: 92mm !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          body, html { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Teacher ID Card Generator</h1>
          {activeAcademicYear && <div className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">Active Year: {activeAcademicYear}</div>}
        </div>
      </div>

      <div className="no-print bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setMode("individual"); setShowCards(false); setSelectedTeacher(null); }} className={`px-4 py-2 rounded-md text-sm font-medium transition ${mode === "individual" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Individual</button>
          <button onClick={() => { setMode("all"); setShowCards(false); setSelectedTeacher(null); }} className={`px-4 py-2 rounded-md text-sm font-medium transition ${mode === "all" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>All Teachers</button>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Department</label><select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px]"><option value="">All Departments</option>{departments.map((d) => (<option key={d} value={d}>{d}</option>))}</select></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Subject</label><select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px]"><option value="">All Subjects</option>{allSubjects.map((s) => (<option key={s} value={s}>{s}</option>))}</select></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Orientation</label><div className="flex gap-1"><button onClick={() => setOrientation("portrait")} className={`px-3 py-2 text-xs rounded-md font-medium transition ${orientation === "portrait" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}>Portrait</button><button onClick={() => setOrientation("landscape")} className={`px-3 py-2 text-xs rounded-md font-medium transition ${orientation === "landscape" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}>Landscape</button></div></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Photo Shape</label><div className="flex gap-1"><button onClick={() => setPhotoShape("rectangle")} className={`px-3 py-2 text-xs rounded-md font-medium transition ${photoShape === "rectangle" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}>Rectangle</button><button onClick={() => setPhotoShape("circle")} className={`px-3 py-2 text-xs rounded-md font-medium transition ${photoShape === "circle" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}>Circle</button></div></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Cards/Page</label><select value={cardsPerPage} onChange={(e) => setCardsPerPage(Number(e.target.value))} className="border border-gray-300 rounded-md px-3 py-2 text-sm"><option value={4}>4</option><option value={6}>6</option><option value={8}>8</option><option value={10}>10</option></select></div>
          {mode === "all" && <button onClick={handleGenerateAll} disabled={filteredTeachers.length === 0} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition disabled:opacity-50">Generate All Cards</button>}
          {showCards && cardsToDisplay.length > 0 && (<><button onClick={handleDownloadPDF} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition">Download PDF</button><button onClick={handlePrint} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition">Print</button></>)}
        </div>
      </div>

      <div className="no-print bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Select Card Pattern</h3>
          <div className="flex gap-1">
            <button onClick={() => setUseCustomTemplate(false)} className={`px-3 py-1 text-xs font-medium rounded ${!useCustomTemplate ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Built-in Patterns</button>
            <button onClick={() => setUseCustomTemplate(true)} className={`px-3 py-1 text-xs font-medium rounded ${useCustomTemplate ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>✨ Custom (YN-UDP Designer)</button>
            <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs font-medium rounded bg-gray-100 text-blue-600 hover:bg-blue-50 border border-blue-200">+ Create New</a>
          </div>
        </div>
        
        {!useCustomTemplate ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((num) => (
              <div key={num} onClick={() => { setSelectedPattern(num); setSelectedCustomTemplate(null); }} className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${selectedPattern === num && !selectedCustomTemplate ? "border-primary-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-400"}`}>
                <div style={{ background: patternColors[num], height: 40 }} />
                <div className="p-1 text-center"><div className="text-xs font-medium text-gray-700 truncate">{patternLabels[num]}</div></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {loadingTemplates ? (
              <div className="text-center py-8 text-gray-500 text-sm">Loading custom templates...</div>
            ) : customTemplates.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {customTemplates.map((tmpl: any) => (
                  <div key={tmpl.id} onClick={() => { (async () => { try { const r = await axios.get(`/api/designer/templates/${tmpl.id}`); if (r.data.success) setSelectedCustomTemplate(r.data.data); else setSelectedCustomTemplate(tmpl); } catch(e) { setSelectedCustomTemplate(tmpl); } })(); setSelectedPattern(0); }} className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${selectedCustomTemplate?.id === tmpl.id ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200 hover:border-gray-400"}`}>
                    <div className="h-20 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-800 truncate">{tmpl.name}</div>
                      <div className="text-[10px] text-gray-500">{tmpl.pageWidth}×{tmpl.pageHeight}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-2">No custom templates found</p>
                <p className="text-gray-400 text-xs mb-3">Create templates in YN-UDP Designer first</p>
                <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">✨ Open YN-UDP Designer</a>
              </div>
            )}
          </div>
        )}
      </div>

      {mode === "individual" && filteredTeachers.length > 0 && !showCards && (
        <div className="no-print bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Select a Teacher ({filteredTeachers.length} found)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
            {filteredTeachers.map((t) => (
              <div key={t.id || t._id} onClick={() => handleTeacherSelect(t)} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {getFullUrl(t.photo) ? <img src={getFullUrl(t.photo)!} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">{t.name?.[0]}</div>}
                </div>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-800 truncate">{t.name}</div><div className="text-xs text-gray-500">{t.teacherId || t.designation || ""}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCards && cardsToDisplay.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div ref={printRef} className="print-area" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, padding: 16 }}>
            {cardsToDisplay.slice(0, cardsPerPage).map((teacher) => (selectedCustomTemplate ? <CustomTemplateCard key={teacher.id || teacher._id} template={selectedCustomTemplate} teacher={teacher} tenant={tenant} academicYearName={activeAcademicYear} /> : <PatternComponent key={teacher.id || teacher._id} teacher={teacher} tenant={tenant} academicYearName={activeAcademicYear} orientation={orientation} photoShape={photoShape} />))}
          </div>
          <PrintSignature />
          {cardsToDisplay.length > cardsPerPage && <div className="no-print text-center mt-3 text-sm text-gray-500">Showing {cardsPerPage} of {cardsToDisplay.length} cards.</div>}
        </div>
      )}

      {!showCards && filteredTeachers.length === 0 && !loading && <div className="no-print bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">No teachers found.</div>}
      {loading && <div className="no-print bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">Loading...</div>}
    </div>
  );
};

export default TeacherIdCardPage;

import { useState, useEffect } from "react";
import axios from "axios";

interface SignatureData {
  id: string;
  title: string;
  personName: string;
  designation: string;
  imageUrl: string;
  isActive: boolean;
}

interface PrintSignatureProps {
  /** Use inline styles instead of Tailwind (for popup print windows) */
  inline?: boolean;
  /** Hide on screen, show only on print (default true) */
  printOnly?: boolean;
}

const API = import.meta.env.VITE_API_URL || "/api";

export default function PrintSignature({ inline = false, printOnly = true }: PrintSignatureProps) {
  const [signature, setSignature] = useState<SignatureData | null>(null);

  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/signature`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const signatures: SignatureData[] = res.data?.data || res.data || [];
        // Find principal signature or first active one
        const principal =
          signatures.find(
            (s) => s.title?.toLowerCase().includes("principal") && s.isActive
          ) ||
          signatures.find((s) => s.isActive) ||
          signatures[0];
        setSignature(principal || null);
      } catch (err) {
        console.error("Failed to fetch signature", err);
      }
    };
    fetchSignature();
  }, []);

  if (!signature) return null;

  const imageUrl = signature.imageUrl
    ? signature.imageUrl.startsWith("http")
      ? signature.imageUrl
      : `${signature.imageUrl}`
    : null;

  // Inline style version (for components that use style props)
  if (inline) {
    return (
      <div
        style={{ textAlign: "center", marginTop: "8px" }}
        className={printOnly ? "hidden print:block" : ""}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Signature"
            style={{ height: "48px", margin: "0 auto", mixBlendMode: "darken" }}
          />
        )}
        <div
          style={{
            width: "140px",
            borderTop: "1.5px solid #222",
            margin: "4px auto 0",
            paddingTop: "4px",
          }}
        >
          <p style={{ fontSize: "11px", fontWeight: "bold", margin: 0 }}>
            {signature.personName || "Principal"}
          </p>
          {signature.designation && (
            <p style={{ fontSize: "10px", color: "#555", margin: 0 }}>
              {signature.designation}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Tailwind version (for regular React components using window.print)
  return (
    <div
      className={`${printOnly ? "hidden print:block" : ""} text-center mt-2`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Signature"
          className="h-12 mx-auto"
          style={{ mixBlendMode: "darken" }}
        />
      )}
      <div className="w-36 border-t-[1.5px] border-black mx-auto mt-1 pt-1">
        <p className="text-[11px] font-bold m-0">
          {signature.personName || "Principal"}
        </p>
        {signature.designation && (
          <p className="text-[10px] text-gray-600 m-0">{signature.designation}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Returns signature HTML string for popup print windows.
 * Call this async function and inject the returned HTML into your print template.
 */
export async function getPrintSignatureHTML(): Promise<string> {
  try {
    const token = localStorage.getItem("token");
    const API_URL = import.meta.env?.VITE_API_URL || "/api";
    const res = await axios.get(`${API_URL}/signature`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const signatures: SignatureData[] = res.data?.data || res.data || [];
    const principal =
      signatures.find(
        (s) => s.title?.toLowerCase().includes("principal") && s.isActive
      ) ||
      signatures.find((s) => s.isActive) ||
      signatures[0];

    if (!principal) return "";

    const imageUrl = principal.imageUrl
      ? principal.imageUrl.startsWith("http")
        ? principal.imageUrl
        : `${principal.imageUrl}`
      : null;

    return `
      <div style="text-align:center;margin-top:8px;">
        ${imageUrl ? `<img src="${imageUrl}" alt="Signature" style="height:48px;margin:0 auto;display:block;mix-blend-mode:darken;" />` : ""}
        <div style="width:140px;border-top:1.5px solid #222;margin:4px auto 0;padding-top:4px;">
          <p style="font-size:11px;font-weight:bold;margin:0;">${principal.personName || "Principal"}</p>
          ${principal.designation ? `<p style="font-size:10px;color:#555;margin:0;">${principal.designation}</p>` : ""}
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Failed to fetch signature for print", err);
    return "";
  }
}

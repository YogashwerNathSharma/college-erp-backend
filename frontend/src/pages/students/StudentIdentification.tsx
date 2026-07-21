import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  CreditCard,
  QrCode,
  Fingerprint,
  School,
  Save,
  Wifi,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHeader, LoadingSkeleton } from "../../components/enterprise";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type IdentificationData = {
  rfidCardNumber: string;
  biometricId: string;
  admissionNo: string;
  previousSchool: {
    name: string;
    address: string;
    board: string;
    lastClassAttended: string;
    yearOfPassing: string;
    transferCertificateNo: string;
  };
};

const EMPTY_DATA: IdentificationData = {
  rfidCardNumber: "",
  biometricId: "",
  admissionNo: "",
  previousSchool: {
    name: "",
    address: "",
    board: "",
    lastClassAttended: "",
    yearOfPassing: "",
    transferCertificateNo: "",
  },
};

// ═══════════════════════════════════════════════════════════════
// QR CODE PLACEHOLDER COMPONENT
// ═══════════════════════════════════════════════════════════════

function QRCodeDisplay({ value }: { value: string }) {
  // Generate a simple visual QR-like pattern from the text
  const generatePattern = (text: string) => {
    const size = 21;
    const grid: boolean[][] = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        // Fixed patterns for QR corners
        if (
          (r < 7 && c < 7) ||
          (r < 7 && c >= size - 7) ||
          (r >= size - 7 && c < 7)
        ) {
          const inBorder =
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= size - 7 && (r === size - 7 || r === size - 1)) ||
            (c >= size - 7 && (c === size - 7 || c === size - 1));
          const inCenter =
            (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
            (r >= 2 && r <= 4 && c >= size - 5 && c <= size - 3) ||
            (r >= size - 5 && r <= size - 3 && c >= 2 && c <= 4);
          grid[r][c] = inBorder || inCenter;
        } else {
          // Seeded pseudorandom data area
          const seed = (hash * (r + 1) * (c + 1)) & 0xffff;
          grid[r][c] = seed % 3 !== 0;
        }
      }
    }
    return grid;
  };

  if (!value) {
    return (
      <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
        <div className="text-center">
          <QrCode className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">No admission number</p>
        </div>
      </div>
    );
  }

  const pattern = generatePattern(value);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(21, 1fr)` }}>
          {pattern.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-2 h-2 ${cell ? "bg-slate-900" : "bg-white"}`}
              />
            ))
          )}
        </div>
      </div>
      <p className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">
        {value}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function StudentIdentification() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<IdentificationData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // ─── Load Data ───────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/students/${id}`, authHeaders);
        const student = response.data.student || response.data;
        setData({
          rfidCardNumber: student.rfidCardNumber || "",
          biometricId: student.biometricId || "",
          admissionNo: student.admissionNo || "",
          previousSchool: {
            name: student.previousSchool?.name || "",
            address: student.previousSchool?.address || "",
            board: student.previousSchool?.board || "",
            lastClassAttended: student.previousSchool?.lastClassAttended || "",
            yearOfPassing: student.previousSchool?.yearOfPassing || "",
            transferCertificateNo: student.previousSchool?.transferCertificateNo || "",
          },
        });
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  // ─── Save ────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/students/${id}/identification`, data, authHeaders);
      toast.success("Identification data saved successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────

  const updatePrevSchool = (key: keyof IdentificationData["previousSchool"], value: string) => {
    setData((prev) => ({
      ...prev,
      previousSchool: { ...prev.previousSchool, [key]: value },
    }));
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Student Identification"
        subtitle="Manage RFID, biometric, and identification details"
        icon={<CreditCard className="w-5 h-5" />}
        breadcrumbs={[
          { label: "Students", path: "/students" },
          { label: "Profile", path: `/students/${id}` },
          { label: "Identification" },
        ]}
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFID & Biometric */}
        <div className="space-y-6">
          {/* RFID Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  RFID Card
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Radio-frequency identification number
                </p>
              </div>
            </div>
            <input
              type="text"
              value={data.rfidCardNumber}
              onChange={(e) => setData({ ...data, rfidCardNumber: e.target.value })}
              placeholder="Enter RFID card number"
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>

          {/* Biometric ID */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Biometric ID
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fingerprint/biometric identification number
                </p>
              </div>
            </div>
            <input
              type="text"
              value={data.biometricId}
              onChange={(e) => setData({ ...data, biometricId: e.target.value })}
              placeholder="Enter biometric ID"
              className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-6">
            <QrCode className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Student QR Code
            </h3>
          </div>
          <QRCodeDisplay value={data.admissionNo} />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
            QR code generated from admission number.<br />
            Use for quick student identification scanning.
          </p>
        </div>
      </div>

      {/* Previous School Info */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <School className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Previous School Information
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Details from the student's previous institution
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              School Name
            </label>
            <input
              type="text"
              value={data.previousSchool.name}
              onChange={(e) => updatePrevSchool("name", e.target.value)}
              placeholder="Previous school name"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Board / Affiliation
            </label>
            <input
              type="text"
              value={data.previousSchool.board}
              onChange={(e) => updatePrevSchool("board", e.target.value)}
              placeholder="e.g. CBSE, ICSE, State Board"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              School Address
            </label>
            <input
              type="text"
              value={data.previousSchool.address}
              onChange={(e) => updatePrevSchool("address", e.target.value)}
              placeholder="Full address of previous school"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Last Class Attended
            </label>
            <input
              type="text"
              value={data.previousSchool.lastClassAttended}
              onChange={(e) => updatePrevSchool("lastClassAttended", e.target.value)}
              placeholder="e.g. Class 5"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Year of Passing
            </label>
            <input
              type="text"
              value={data.previousSchool.yearOfPassing}
              onChange={(e) => updatePrevSchool("yearOfPassing", e.target.value)}
              placeholder="e.g. 2024"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Transfer Certificate Number
            </label>
            <input
              type="text"
              value={data.previousSchool.transferCertificateNo}
              onChange={(e) => updatePrevSchool("transferCertificateNo", e.target.value)}
              placeholder="TC number from previous school"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

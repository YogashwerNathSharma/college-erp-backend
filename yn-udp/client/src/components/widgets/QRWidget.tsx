/**
 * YN-UDP QR Code & Barcode Widget
 * Drag-drop QR codes that auto-generate from student/document data
 *
 * Features:
 * - QR Code generation from {{placeholders}} or custom text
 * - Barcode (Code128, Code39, EAN13) generation
 * - Real-time preview updates
 * - Configurable: size, colors, error correction level
 * - Properties panel for editing QR/Barcode config
 */

import { useState, useEffect, useCallback } from "react";
import {
  QrCode,
  Barcode,
  RefreshCw,
  Check,
  X,
  Palette,
  Maximize2,
  ShieldCheck,
} from "lucide-react";
import {
  createQRObject,
  updateQRObject,
  generateQRDataUrl,
  generateBarcodeDataUrl,
  QRConfig,
} from "../../utils/widgetHelpers";

// ===========================
// DATA SOURCE OPTIONS
// ===========================

const QR_DATA_SOURCES = [
  { key: "{{admission_no}}", label: "Admission Number", category: "Student" },
  { key: "{{student_id}}", label: "Student ID", category: "Student" },
  { key: "{{sr_no}}", label: "SR Number", category: "Student" },
  { key: "{{aadhar_no}}", label: "Aadhar Number", category: "Student" },
  { key: "{{roll_number}}", label: "Roll Number", category: "Student" },
  { key: "{{verification_url}}", label: "Verification URL", category: "General" },
  { key: "{{certificate_url}}", label: "Certificate Verification", category: "General" },
  { key: "{{receipt_no}}", label: "Receipt Number", category: "Fee" },
  { key: "{{school_website}}", label: "School Website", category: "School" },
  { key: "custom", label: "Custom Text", category: "Custom" },
];

const BARCODE_FORMATS = [
  { value: "CODE128", label: "Code 128 (Universal)" },
  { value: "CODE39", label: "Code 39" },
  { value: "EAN13", label: "EAN-13 (Product)" },
  { value: "EAN8", label: "EAN-8" },
  { value: "UPC", label: "UPC-A" },
  { value: "ITF14", label: "ITF-14" },
];

const ERROR_CORRECTION_LEVELS = [
  { value: "L" as const, label: "Low (7%)", description: "Smallest QR, least redundancy" },
  { value: "M" as const, label: "Medium (15%)", description: "Good balance" },
  { value: "Q" as const, label: "Quartile (25%)", description: "Better error recovery" },
  { value: "H" as const, label: "High (30%)", description: "Best error recovery, largest QR" },
];

// ===========================
// QR/BARCODE INSERT DIALOG
// ===========================

interface QRInsertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: Partial<QRConfig>) => void;
}

export function QRInsertDialog({ isOpen, onClose, onInsert }: QRInsertDialogProps) {
  const [mode, setMode] = useState<"qr" | "barcode">("qr");
  const [dataSource, setDataSource] = useState("{{admission_no}}");
  const [customText, setCustomText] = useState("");
  const [size, setSize] = useState(150);
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [barcodeFormat, setBarcodeFormat] = useState("CODE128");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Generate preview
  useEffect(() => {
    const generatePreview = async () => {
      const text = dataSource === "custom" ? (customText || "SAMPLE DATA") : dataSource;
      if (mode === "qr") {
        const url = await generateQRDataUrl(text, {
          size: 120,
          darkColor,
          lightColor,
          errorCorrectionLevel: errorCorrection,
        });
        setPreviewUrl(url);
      } else {
        const url = generateBarcodeDataUrl(
          text.replace(/\{\{|\}\}/g, "").substring(0, 15) || "1234567890",
          { format: barcodeFormat, height: 50 }
        );
        setPreviewUrl(url);
      }
    };
    generatePreview();
  }, [mode, dataSource, customText, darkColor, lightColor, errorCorrection, barcodeFormat]);

  const handleInsert = () => {
    const data = dataSource === "custom" ? customText : dataSource;
    onInsert({
      data,
      size,
      darkColor,
      lightColor,
      errorCorrectionLevel: errorCorrection,
      type: mode,
      barcodeFormat: mode === "barcode" ? barcodeFormat : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl w-[550px] max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {mode === "qr" ? (
              <QrCode size={20} className="text-green-400" />
            ) : (
              <Barcode size={20} className="text-purple-400" />
            )}
            <h3 className="text-white font-semibold text-lg">
              Insert {mode === "qr" ? "QR Code" : "Barcode"}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode Toggle */}
          <div className="flex bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setMode("qr")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                mode === "qr"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <QrCode size={16} />
              QR Code
            </button>
            <button
              onClick={() => setMode("barcode")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                mode === "barcode"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Barcode size={16} />
              Barcode
            </button>
          </div>

          {/* Data Source */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">Data Source</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              {QR_DATA_SOURCES.map((src) => (
                <option key={src.key} value={src.key}>
                  [{src.category}] {src.label} — {src.key}
                </option>
              ))}
            </select>
            {dataSource === "custom" && (
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-2"
                placeholder="Enter custom text or URL..."
              />
            )}
          </div>

          {/* QR-specific options */}
          {mode === "qr" && (
            <>
              {/* Error Correction */}
              <div>
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  Error Correction Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ERROR_CORRECTION_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setErrorCorrection(level.value)}
                      className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${
                        errorCorrection === level.value
                          ? "bg-green-600 border-green-500 text-white"
                          : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                      }`}
                      title={level.description}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Foreground</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                    />
                    <span className="text-gray-400 text-xs">{darkColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                    />
                    <span className="text-gray-400 text-xs">{lightColor}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Barcode-specific options */}
          {mode === "barcode" && (
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Barcode Format
              </label>
              <select
                value={barcodeFormat}
                onChange={(e) => setBarcodeFormat(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {BARCODE_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Size */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">
              Size: {size}px
            </label>
            <input
              type="range"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full accent-blue-500"
              min={50}
              max={300}
              step={10}
            />
            <div className="flex justify-between text-gray-500 text-xs mt-1">
              <span>50px</span>
              <span>300px</span>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">Preview</label>
            <div className="bg-white rounded-lg p-4 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`${mode} preview`}
                  className="max-w-[200px] max-h-[200px]"
                />
              ) : (
                <div className="text-gray-400 text-sm">Generating preview...</div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className={`px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 transition-colors ${
              mode === "qr"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            <Check size={16} />
            Insert {mode === "qr" ? "QR Code" : "Barcode"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================
// QR/BARCODE PROPERTIES PANEL
// ===========================

interface QRPropertiesPanelProps {
  canvas: any;
  activeObject: any;
}

export function QRPropertiesPanel({ canvas, activeObject }: QRPropertiesPanelProps) {
  const [config, setConfig] = useState<QRConfig | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const type = activeObject?.data?.type;
    if (type === "qrcode" || type === "barcode") {
      setConfig(activeObject.data.qrConfig);
    }
  }, [activeObject]);

  const handleUpdate = async (updates: Partial<QRConfig>) => {
    if (!config || !canvas || !activeObject || isUpdating) return;
    setIsUpdating(true);

    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    try {
      await updateQRObject(canvas, activeObject, newConfig);
    } catch (err) {
      console.error("Failed to update QR:", err);
    }

    setIsUpdating(false);
  };

  if (!config) return null;

  const isQR = config.type !== "barcode";

  return (
    <div className="space-y-3 p-3 border-t border-gray-700">
      <div className="flex items-center gap-2 font-medium text-sm">
        {isQR ? (
          <>
            <QrCode size={16} className="text-green-400" />
            <span className="text-green-400">QR Code Properties</span>
          </>
        ) : (
          <>
            <Barcode size={16} className="text-purple-400" />
            <span className="text-purple-400">Barcode Properties</span>
          </>
        )}
      </div>

      {/* Data Source */}
      <div>
        <label className="text-gray-400 text-xs">Data Source</label>
        <select
          value={
            QR_DATA_SOURCES.some((s) => s.key === config.data)
              ? config.data
              : "custom"
          }
          onChange={(e) => {
            if (e.target.value === "custom") {
              handleUpdate({ data: "" });
            } else {
              handleUpdate({ data: e.target.value });
            }
          }}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
        >
          {QR_DATA_SOURCES.map((src) => (
            <option key={src.key} value={src.key}>
              {src.label}
            </option>
          ))}
        </select>
        {!QR_DATA_SOURCES.some((s) => s.key === config.data) && (
          <input
            type="text"
            value={config.data}
            onChange={(e) => handleUpdate({ data: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-1"
            placeholder="Custom text..."
          />
        )}
      </div>

      {/* Size */}
      <div>
        <label className="text-gray-400 text-xs">Size: {config.size}px</label>
        <input
          type="range"
          value={config.size}
          onChange={(e) => handleUpdate({ size: parseInt(e.target.value) })}
          className="w-full accent-blue-500 mt-0.5"
          min={50}
          max={300}
          step={10}
        />
      </div>

      {/* QR-specific */}
      {isQR && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-400 text-xs">Dark Color</label>
              <input
                type="color"
                value={config.darkColor}
                onChange={(e) => handleUpdate({ darkColor: e.target.value })}
                className="w-full h-6 rounded cursor-pointer border border-gray-600 mt-0.5"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs">Light Color</label>
              <input
                type="color"
                value={config.lightColor}
                onChange={(e) => handleUpdate({ lightColor: e.target.value })}
                className="w-full h-6 rounded cursor-pointer border border-gray-600 mt-0.5"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs">Error Correction</label>
            <select
              value={config.errorCorrectionLevel}
              onChange={(e) =>
                handleUpdate({ errorCorrectionLevel: e.target.value as "L" | "M" | "Q" | "H" })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
            >
              {ERROR_CORRECTION_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Barcode-specific */}
      {!isQR && (
        <div>
          <label className="text-gray-400 text-xs">Format</label>
          <select
            value={config.barcodeFormat || "CODE128"}
            onChange={(e) => handleUpdate({ barcodeFormat: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
          >
            {BARCODE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={() => handleUpdate(config)}
        disabled={isUpdating}
        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={12} className={isUpdating ? "animate-spin" : ""} />
        Regenerate
      </button>
    </div>
  );
}

// ===========================
// QR TOOLBAR BUTTON
// ===========================

interface QRToolbarButtonProps {
  canvas: any;
}

export function QRToolbarButton({ canvas }: QRToolbarButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleInsert = async (config: Partial<QRConfig>) => {
    if (!canvas) return;
    await createQRObject(canvas, config);
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all group relative"
        title="QR Code / Barcode"
      >
        <QrCode size={18} />
        <span className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          QR / Barcode
        </span>
      </button>
      <QRInsertDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onInsert={handleInsert}
      />
    </>
  );
}

export default QRToolbarButton;

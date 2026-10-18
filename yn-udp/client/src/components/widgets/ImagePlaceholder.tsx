/**
 * YN-UDP Image Placeholder Widget
 * {{student_photo}}, {{school_logo}}, {{signature}} placeholders that auto-fill
 *
 * Features:
 * - Adds dashed-border rectangle with placeholder text
 * - Data source dropdown (student_photo, school_logo, signatures, stamp)
 * - Configurable: width, height, border radius, border style
 * - On bulk generate: replaces with actual image from DB URL
 * - Fallback: default avatar/placeholder if image not found
 */

import { useState, useEffect } from "react";
import {
  ImageIcon,
  User,
  PenTool,
  Stamp,
  Building2,
  Check,
  X,
  Maximize2,
  Palette,
} from "lucide-react";
import {
  createImagePlaceholderObject,
  updateImagePlaceholder,
  IMAGE_PLACEHOLDER_SOURCES,
  ImagePlaceholderConfig,
} from "../../utils/widgetHelpers";

// ===========================
// IMAGE PLACEHOLDER INSERT DIALOG
// ===========================

interface ImagePlaceholderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: Partial<ImagePlaceholderConfig>) => void;
}

export function ImagePlaceholderDialog({
  isOpen,
  onClose,
  onInsert,
}: ImagePlaceholderDialogProps) {
  const [dataSource, setDataSource] = useState("student_photo");
  const [width, setWidth] = useState(90);
  const [height, setHeight] = useState(120);
  const [placeholderText, setPlaceholderText] = useState("Student Photo");
  const [borderColor, setBorderColor] = useState("#6b7280");
  const [borderRadius, setBorderRadius] = useState(4);
  const [borderStyle, setBorderStyle] = useState<"solid" | "dashed" | "dotted">("dashed");
  const [backgroundColor, setBackgroundColor] = useState("#f3f4f6");

  // Auto-update dimensions and text when data source changes
  useEffect(() => {
    const source = IMAGE_PLACEHOLDER_SOURCES.find((s) => s.key === dataSource);
    if (source) {
      setWidth(source.defaultWidth);
      setHeight(source.defaultHeight);
      setPlaceholderText(source.label);
    }
  }, [dataSource]);

  const handleInsert = () => {
    onInsert({
      dataSource,
      width,
      height,
      placeholderText,
      borderColor,
      borderRadius,
      borderStyle,
      backgroundColor,
      borderWidth: 2,
    });
    onClose();
  };

  const getSourceIcon = (key: string) => {
    switch (key) {
      case "student_photo":
        return <User size={14} />;
      case "school_logo":
        return <Building2 size={14} />;
      case "signature_principal":
      case "signature_class_teacher":
      case "signature_exam_controller":
        return <PenTool size={14} />;
      case "stamp":
        return <Stamp size={14} />;
      default:
        return <ImageIcon size={14} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl w-[520px] max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <ImageIcon size={20} className="text-orange-400" />
            <h3 className="text-white font-semibold text-lg">Insert Image Placeholder</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Data Source Selection */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">
              Image Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_PLACEHOLDER_SOURCES.map((source) => (
                <button
                  key={source.key}
                  onClick={() => setDataSource(source.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
                    dataSource === source.key
                      ? "bg-orange-600/20 border-orange-500 text-orange-300"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <span className="text-lg">{source.icon}</span>
                  <div>
                    <div className="font-medium text-xs">{source.label}</div>
                    <div className="text-gray-500 text-[10px]">
                      {source.defaultWidth}×{source.defaultHeight}px
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 50)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
                min={30}
                max={500}
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Height (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 50)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
                min={30}
                max={500}
              />
            </div>
          </div>

          {/* Placeholder Text */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Placeholder Text</label>
            <input
              type="text"
              value={placeholderText}
              onChange={(e) => setPlaceholderText(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
              placeholder="Text shown inside placeholder"
            />
          </div>

          {/* Border Style */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">Border Style</label>
            <div className="flex gap-2">
              {(["dashed", "solid", "dotted"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setBorderStyle(style)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm capitalize transition-colors ${
                    borderStyle === style
                      ? "bg-blue-600/20 border-blue-500 text-blue-300"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <div
                    className="w-full h-0.5 mb-1"
                    style={{
                      borderTop: `2px ${style} ${borderStyle === style ? "#60a5fa" : "#6b7280"}`,
                    }}
                  />
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Colors & Radius */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Border Color</label>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-full h-8 rounded cursor-pointer border border-gray-600"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Background</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-8 rounded cursor-pointer border border-gray-600"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Radius</label>
              <input
                type="number"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
                min={0}
                max={50}
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">Preview</label>
            <div className="bg-white rounded-lg p-6 flex items-center justify-center">
              <div
                style={{
                  width: `${Math.min(width, 200)}px`,
                  height: `${Math.min(height, 200)}px`,
                  border: `2px ${borderStyle} ${borderColor}`,
                  borderRadius: `${borderRadius}px`,
                  backgroundColor: backgroundColor,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <span className="text-2xl">
                  {IMAGE_PLACEHOLDER_SOURCES.find((s) => s.key === dataSource)?.icon || "🖼️"}
                </span>
                <span
                  style={{ fontSize: "9px", color: "#6b7280", textAlign: "center", padding: "0 4px" }}
                >
                  {placeholderText}
                </span>
                <span style={{ fontSize: "8px", color: "#9ca3af" }}>
                  {width}×{height}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-900 rounded-lg p-3 flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">ℹ️</span>
            <p className="text-gray-400 text-xs leading-relaxed">
              During bulk generation, this placeholder will be replaced with the actual image from the
              database. The field <code className="bg-gray-700 px-1 py-0.5 rounded text-blue-300">
                {`{{${dataSource}}}`}
              </code> will resolve to the student/school image URL.
              If no image is found, a default placeholder will be used.
            </p>
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
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors"
          >
            <Check size={16} />
            Insert Placeholder
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================
// IMAGE PLACEHOLDER PROPERTIES PANEL
// ===========================

interface ImagePlaceholderPropertiesPanelProps {
  canvas: any;
  activeObject: any;
}

export function ImagePlaceholderPropertiesPanel({
  canvas,
  activeObject,
}: ImagePlaceholderPropertiesPanelProps) {
  const [config, setConfig] = useState<ImagePlaceholderConfig | null>(null);

  useEffect(() => {
    if (activeObject?.data?.type === "image_placeholder") {
      setConfig(activeObject.data.placeholderConfig);
    }
  }, [activeObject]);

  const handleUpdate = async (updates: Partial<ImagePlaceholderConfig>) => {
    if (!config || !canvas || !activeObject) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await updateImagePlaceholder(canvas, activeObject, newConfig);
  };

  if (!config) return null;

  const sourceInfo = IMAGE_PLACEHOLDER_SOURCES.find((s) => s.key === config.dataSource);

  return (
    <div className="space-y-3 p-3 border-t border-gray-700">
      <div className="flex items-center gap-2 text-orange-400 font-medium text-sm">
        <ImageIcon size={16} />
        <span>Image Placeholder</span>
      </div>

      {/* Data Source */}
      <div>
        <label className="text-gray-400 text-xs">Data Source</label>
        <select
          value={config.dataSource}
          onChange={(e) => {
            const source = IMAGE_PLACEHOLDER_SOURCES.find((s) => s.key === e.target.value);
            handleUpdate({
              dataSource: e.target.value,
              placeholderText: source?.label || config.placeholderText,
              width: source?.defaultWidth || config.width,
              height: source?.defaultHeight || config.height,
            });
          }}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
        >
          {IMAGE_PLACEHOLDER_SOURCES.map((source) => (
            <option key={source.key} value={source.key}>
              {source.icon} {source.label}
            </option>
          ))}
        </select>
      </div>

      {/* Field Key Display */}
      <div className="bg-gray-900 rounded px-2 py-1.5 flex items-center justify-between">
        <span className="text-gray-400 text-xs">Field:</span>
        <code className="text-blue-300 text-xs">{`{{${config.dataSource}}}`}</code>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Width</label>
          <input
            type="number"
            value={config.width}
            onChange={(e) => handleUpdate({ width: parseInt(e.target.value) || 50 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
            min={30}
            max={500}
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Height</label>
          <input
            type="number"
            value={config.height}
            onChange={(e) => handleUpdate({ height: parseInt(e.target.value) || 50 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
            min={30}
            max={500}
          />
        </div>
      </div>

      {/* Placeholder Text */}
      <div>
        <label className="text-gray-400 text-xs">Placeholder Text</label>
        <input
          type="text"
          value={config.placeholderText}
          onChange={(e) => handleUpdate({ placeholderText: e.target.value })}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
        />
      </div>

      {/* Border Style */}
      <div>
        <label className="text-gray-400 text-xs">Border Style</label>
        <div className="flex gap-1 mt-0.5">
          {(["dashed", "solid", "dotted"] as const).map((style) => (
            <button
              key={style}
              onClick={() => handleUpdate({ borderStyle: style })}
              className={`flex-1 px-2 py-1 text-[10px] rounded capitalize transition-colors ${
                config.borderStyle === style
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Border</label>
          <input
            type="color"
            value={config.borderColor}
            onChange={(e) => handleUpdate({ borderColor: e.target.value })}
            className="w-full h-6 rounded cursor-pointer border border-gray-600 mt-0.5"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Background</label>
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
            className="w-full h-6 rounded cursor-pointer border border-gray-600 mt-0.5"
          />
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <label className="text-gray-400 text-xs">
          Border Radius: {config.borderRadius}px
        </label>
        <input
          type="range"
          value={config.borderRadius}
          onChange={(e) => handleUpdate({ borderRadius: parseInt(e.target.value) })}
          className="w-full accent-blue-500 mt-0.5"
          min={0}
          max={50}
        />
      </div>
    </div>
  );
}

// ===========================
// IMAGE PLACEHOLDER TOOLBAR BUTTON
// ===========================

interface ImagePlaceholderToolbarButtonProps {
  canvas: any;
}

export function ImagePlaceholderToolbarButton({ canvas }: ImagePlaceholderToolbarButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleInsert = async (config: Partial<ImagePlaceholderConfig>) => {
    if (!canvas) return;
    await createImagePlaceholderObject(canvas, config);
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all group relative"
        title="Image Placeholder"
      >
        <ImageIcon size={18} />
        <span className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          Image Field
        </span>
      </button>
      <ImagePlaceholderDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onInsert={handleInsert}
      />
    </>
  );
}

export default ImagePlaceholderToolbarButton;

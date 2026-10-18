// ══════════════════════════════════════════════════════
// YN-UDP — Right Properties Panel
// Shows properties of selected element (position, size, font, colors)
// ══════════════════════════════════════════════════════

import { useState } from "react";
import {
  Move,
  Maximize2,
  RotateCw,
  Type,
  Palette,
  Eye,
  Layers,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface PropertiesPanelProps {
  selectedObject: any;
  onPropertyChange: (property: string, value: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
  "Noto Sans Devanagari",
  "Mangal",
];

export default function PropertiesPanel({
  selectedObject,
  onPropertyChange,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"position" | "style" | "text">("position");

  if (!selectedObject) {
    return (
      <div className="w-64 bg-gray-900 border-l border-gray-700 p-4 flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center">
          कोई element select करें<br />
          <span className="text-xs text-gray-600">Properties यहाँ दिखेंगी</span>
        </p>
      </div>
    );
  }

  const isText = selectedObject.type === "textbox" || selectedObject.type === "i-text" || selectedObject.type === "text";

  return (
    <div className="w-64 bg-gray-900 border-l border-gray-700 overflow-y-auto">
      {/* Header with Actions */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
            {selectedObject.type || "Element"}
          </span>
          <div className="flex gap-1">
            <button onClick={onDuplicate} title="Duplicate" className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded">
              <Copy size={14} />
            </button>
            <button onClick={onDelete} title="Delete" className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Layer controls */}
        <div className="flex gap-1">
          <button onClick={onBringForward} title="Bring Forward" className="flex-1 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded flex items-center justify-center gap-1">
            <ArrowUp size={12} /> Front
          </button>
          <button onClick={onSendBackward} title="Send Backward" className="flex-1 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded flex items-center justify-center gap-1">
            <ArrowDown size={12} /> Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {["position", "style", ...(isText ? ["text"] : [])].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-xs font-medium capitalize ${
              activeTab === tab ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3">
        {/* ─── POSITION TAB ─── */}
        {activeTab === "position" && (
          <>
            {/* Position */}
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Move size={12} /> Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-gray-600">X</span>
                  <input
                    type="number"
                    value={Math.round(selectedObject.left || 0)}
                    onChange={(e) => onPropertyChange("left", Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-600">Y</span>
                  <input
                    type="number"
                    value={Math.round(selectedObject.top || 0)}
                    onChange={(e) => onPropertyChange("top", Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Maximize2 size={12} /> Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-gray-600">W</span>
                  <input
                    type="number"
                    value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
                    onChange={(e) => onPropertyChange("width", Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-600">H</span>
                  <input
                    type="number"
                    value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
                    onChange={(e) => onPropertyChange("height", Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <RotateCw size={12} /> Rotation
              </label>
              <input
                type="number"
                value={Math.round(selectedObject.angle || 0)}
                onChange={(e) => onPropertyChange("angle", Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                min={0}
                max={360}
              />
            </div>

            {/* Opacity */}
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Eye size={12} /> Opacity
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedObject.opacity ?? 1}
                onChange={(e) => onPropertyChange("opacity", Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-gray-500">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
            </div>

            {/* Lock */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Lock Position</span>
              <button
                onClick={() => onPropertyChange("lockMovementX", !selectedObject.lockMovementX)}
                className={`p-1.5 rounded ${selectedObject.lockMovementX ? "bg-red-900/50 text-red-400" : "bg-gray-800 text-gray-400"}`}
              >
                {selectedObject.lockMovementX ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
          </>
        )}

        {/* ─── STYLE TAB ─── */}
        {activeTab === "style" && (
          <>
            {/* Fill Color */}
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Palette size={12} /> Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedObject.fill || "#000000"}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  className="w-8 h-8 rounded border border-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedObject.fill || "#000000"}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>

            {/* Stroke */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stroke / Border</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedObject.stroke || "#000000"}
                  onChange={(e) => onPropertyChange("stroke", e.target.value)}
                  className="w-8 h-8 rounded border border-gray-700 cursor-pointer"
                />
                <input
                  type="number"
                  value={selectedObject.strokeWidth || 0}
                  onChange={(e) => onPropertyChange("strokeWidth", Number(e.target.value))}
                  className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  min={0}
                  max={20}
                  placeholder="Width"
                />
              </div>
            </div>

            {/* Border Radius (for rect) */}
            {(selectedObject.type === "rect") && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Border Radius</label>
                <input
                  type="number"
                  value={selectedObject.rx || 0}
                  onChange={(e) => {
                    onPropertyChange("rx", Number(e.target.value));
                    onPropertyChange("ry", Number(e.target.value));
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  min={0}
                  max={100}
                />
              </div>
            )}

            {/* Shadow */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Shadow</label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => onPropertyChange("shadow", null)}
                  className="py-1 text-[10px] bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white"
                >
                  None
                </button>
                <button
                  onClick={() => onPropertyChange("shadow", "2px 2px 5px rgba(0,0,0,0.3)")}
                  className="py-1 text-[10px] bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white"
                >
                  Small
                </button>
                <button
                  onClick={() => onPropertyChange("shadow", "4px 4px 10px rgba(0,0,0,0.5)")}
                  className="py-1 text-[10px] bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white"
                >
                  Large
                </button>
              </div>
            </div>
          </>
        )}

        {/* ─── TEXT TAB ─── */}
        {activeTab === "text" && isText && (
          <>
            {/* Font Family */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Font Family</label>
              <select
                value={selectedObject.fontFamily || "Arial"}
                onChange={(e) => onPropertyChange("fontFamily", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
              <input
                type="number"
                value={selectedObject.fontSize || 16}
                onChange={(e) => onPropertyChange("fontSize", Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                min={8}
                max={200}
              />
            </div>

            {/* Bold / Italic / Underline */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Style</label>
              <div className="flex gap-1">
                <button
                  onClick={() => onPropertyChange("fontWeight", selectedObject.fontWeight === "bold" ? "normal" : "bold")}
                  className={`p-2 rounded ${selectedObject.fontWeight === "bold" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => onPropertyChange("fontStyle", selectedObject.fontStyle === "italic" ? "normal" : "italic")}
                  className={`p-2 rounded ${selectedObject.fontStyle === "italic" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  <Italic size={14} />
                </button>
                <button
                  onClick={() => onPropertyChange("underline", !selectedObject.underline)}
                  className={`p-2 rounded ${selectedObject.underline ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  <Underline size={14} />
                </button>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Alignment</label>
              <div className="flex gap-1">
                {[
                  { value: "left", icon: AlignLeft },
                  { value: "center", icon: AlignCenter },
                  { value: "right", icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => onPropertyChange("textAlign", value)}
                    className={`p-2 rounded ${selectedObject.textAlign === value ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Type size={12} /> Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedObject.fill || "#000000"}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  className="w-8 h-8 rounded border border-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedObject.fill || "#000000"}
                  onChange={(e) => onPropertyChange("fill", e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Line Height</label>
              <input
                type="number"
                value={selectedObject.lineHeight || 1.2}
                onChange={(e) => onPropertyChange("lineHeight", Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

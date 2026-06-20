import { useState, useEffect } from "react";
import { fabric } from "fabric";
import { FONT_FAMILIES, FONT_SIZES } from "../utils/templateTypes";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
} from "lucide-react";

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringFront: () => void;
  onSendBack: () => void;
}

export default function PropertiesPanel({
  canvas,
  selectedObject,
  onDelete,
  onDuplicate,
  onBringFront,
  onSendBack,
}: PropertiesPanelProps) {
  const [props, setProps] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    angle: 0,
    opacity: 100,
    fill: "#000000",
    stroke: "#000000",
    strokeWidth: 0,
    fontSize: 20,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    underline: false,
    textAlign: "left",
  });

  useEffect(() => {
    if (!selectedObject) return;

    const obj = selectedObject as any;
    setProps({
      left: Math.round(obj.left || 0),
      top: Math.round(obj.top || 0),
      width: Math.round(obj.getScaledWidth?.() || obj.width || 0),
      height: Math.round(obj.getScaledHeight?.() || obj.height || 0),
      angle: Math.round(obj.angle || 0),
      opacity: Math.round((obj.opacity || 1) * 100),
      fill: obj.fill || "#000000",
      stroke: obj.stroke || "#000000",
      strokeWidth: obj.strokeWidth || 0,
      fontSize: obj.fontSize || 20,
      fontFamily: obj.fontFamily || "Arial",
      fontWeight: obj.fontWeight || "normal",
      fontStyle: obj.fontStyle || "normal",
      underline: obj.underline || false,
      textAlign: obj.textAlign || "left",
    });
  }, [selectedObject]);

  const updateObject = (key: string, value: any) => {
    if (!canvas || !selectedObject) return;

    const obj = selectedObject as any;

    switch (key) {
      case "left":
        obj.set("left", Number(value));
        break;
      case "top":
        obj.set("top", Number(value));
        break;
      case "width":
        const scaleX = Number(value) / (obj.width || 1);
        obj.set("scaleX", scaleX);
        break;
      case "height":
        const scaleY = Number(value) / (obj.height || 1);
        obj.set("scaleY", scaleY);
        break;
      case "angle":
        obj.set("angle", Number(value));
        break;
      case "opacity":
        obj.set("opacity", Number(value) / 100);
        break;
      case "fill":
        obj.set("fill", value);
        break;
      case "stroke":
        obj.set("stroke", value);
        break;
      case "strokeWidth":
        obj.set("strokeWidth", Number(value));
        break;
      case "fontSize":
        obj.set("fontSize", Number(value));
        break;
      case "fontFamily":
        obj.set("fontFamily", value);
        break;
      case "fontWeight":
        obj.set("fontWeight", value === "bold" ? "bold" : "normal");
        break;
      case "fontStyle":
        obj.set("fontStyle", value === "italic" ? "italic" : "normal");
        break;
      case "underline":
        obj.set("underline", value);
        break;
      case "textAlign":
        obj.set("textAlign", value);
        break;
    }

    obj.setCoords();
    canvas.renderAll();
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  if (!selectedObject) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <div className="text-center text-gray-400 mt-10">
          <p className="text-sm">Select an element to</p>
          <p className="text-sm">edit its properties</p>
        </div>
      </div>
    );
  }

  const isText = selectedObject.type === "i-text" || selectedObject.type === "text" || selectedObject.type === "textbox";

  return (
    <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 capitalize">
          {selectedObject.type || "Element"} Properties
        </h3>
      </div>

      <div className="p-3 space-y-4">
        {/* Actions */}
        <div className="flex gap-1">
          <button onClick={onDuplicate} className="flex-1 p-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="Duplicate">
            <Copy size={14} className="mx-auto" />
          </button>
          <button onClick={onBringFront} className="flex-1 p-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="Bring Front">
            <ArrowUp size={14} className="mx-auto" />
          </button>
          <button onClick={onSendBack} className="flex-1 p-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="Send Back">
            <ArrowDown size={14} className="mx-auto" />
          </button>
          <button onClick={onDelete} className="flex-1 p-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded" title="Delete">
            <Trash2 size={14} className="mx-auto" />
          </button>
        </div>

        {/* Position */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-[10px] text-gray-400">X</span>
              <input
                type="number"
                value={props.left}
                onChange={(e) => updateObject("left", e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400">Y</span>
              <input
                type="number"
                value={props.top}
                onChange={(e) => updateObject("top", e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-[10px] text-gray-400">W</span>
              <input
                type="number"
                value={props.width}
                onChange={(e) => updateObject("width", e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400">H</span>
              <input
                type="number"
                value={props.height}
                onChange={(e) => updateObject("height", e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rotation & Opacity */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rotation</label>
            <input
              type="number"
              value={props.angle}
              onChange={(e) => updateObject("angle", e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded mt-1 focus:ring-1 focus:ring-blue-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Opacity %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={props.opacity}
              onChange={(e) => updateObject("opacity", e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded mt-1 focus:ring-1 focus:ring-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Text Properties */}
        {isText && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Font</label>
              <select
                value={props.fontFamily}
                onChange={(e) => updateObject("fontFamily", e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded mt-1 focus:ring-1 focus:ring-blue-400 outline-none"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Font Size</label>
              <select
                value={props.fontSize}
                onChange={(e) => updateObject("fontSize", e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded mt-1 focus:ring-1 focus:ring-blue-400 outline-none"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>

            {/* Bold / Italic / Underline */}
            <div className="flex gap-1">
              <button
                onClick={() => updateObject("fontWeight", props.fontWeight === "bold" ? "normal" : "bold")}
                className={`p-2 rounded ${props.fontWeight === "bold" ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => updateObject("fontStyle", props.fontStyle === "italic" ? "normal" : "italic")}
                className={`p-2 rounded ${props.fontStyle === "italic" ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => updateObject("underline", !props.underline)}
                className={`p-2 rounded ${props.underline ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                <Underline size={14} />
              </button>
              <button
                onClick={() => updateObject("textAlign", "left")}
                className={`p-2 rounded ${props.textAlign === "left" ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => updateObject("textAlign", "center")}
                className={`p-2 rounded ${props.textAlign === "center" ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => updateObject("textAlign", "right")}
                className={`p-2 rounded ${props.textAlign === "right" ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                <AlignRight size={14} />
              </button>
            </div>
          </>
        )}

        {/* Colors */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fill Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={typeof props.fill === "string" ? props.fill : "#000000"}
              onChange={(e) => updateObject("fill", e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={typeof props.fill === "string" ? props.fill : ""}
              onChange={(e) => updateObject("fill", e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stroke</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={props.stroke || "#000000"}
              onChange={(e) => updateObject("stroke", e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="number"
              min="0"
              max="20"
              value={props.strokeWidth}
              onChange={(e) => updateObject("strokeWidth", e.target.value)}
              className="w-16 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
              placeholder="Width"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

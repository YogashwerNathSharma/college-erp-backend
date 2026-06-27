// ══════════════════════════════════════════════════════
// YN-UDP — Left Canvas Toolbar
// Tools: Select, Text, Shapes, Image, DB Fields, etc.
// ══════════════════════════════════════════════════════

import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Triangle,
  Minus,
  Image,
  Database,
  Droplets,
  ImagePlus,
} from "lucide-react";
import { ToolType } from "../utils/templateTypes";

interface CanvasToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const tools: { type: ToolType; icon: any; label: string; shortcut?: string }[] = [
  { type: "select", icon: MousePointer2, label: "Select (V)", shortcut: "V" },
  { type: "text", icon: Type, label: "Text (T)", shortcut: "T" },
  { type: "rect", icon: Square, label: "Rectangle (R)", shortcut: "R" },
  { type: "circle", icon: Circle, label: "Circle (C)", shortcut: "C" },
  { type: "triangle", icon: Triangle, label: "Triangle", shortcut: "" },
  { type: "line", icon: Minus, label: "Line (L)", shortcut: "L" },
  { type: "image", icon: Image, label: "Image (I)", shortcut: "I" },
  { type: "field", icon: Database, label: "DB Field (F)", shortcut: "F" },
  { type: "watermark", icon: Droplets, label: "Watermark", shortcut: "" },
];

export default function CanvasToolbar({ activeTool, onToolChange }: CanvasToolbarProps) {
  return (
    <div className="w-14 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-3 gap-1">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.type;

        return (
          <button
            key={tool.type}
            onClick={() => onToolChange(tool.type)}
            title={tool.label}
            className={`
              w-10 h-10 flex items-center justify-center rounded-lg transition-all
              ${isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }
            `}
          >
            <Icon size={18} />
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-8 h-px bg-gray-700 my-2" />

      {/* Background button */}
      <button
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
              const event = new CustomEvent("yn-udp-bg-upload", { detail: { file } });
              window.dispatchEvent(event);
            }
          };
          input.click();
        }}
        title="Set Background Image"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
      >
        <ImagePlus size={18} />
      </button>
    </div>
  );
}

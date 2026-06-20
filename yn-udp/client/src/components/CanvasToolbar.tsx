import { useState } from "react";
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  Triangle,
  Image,
  Database,
  Droplets,
  PaintBucket,
} from "lucide-react";

interface CanvasToolbarProps {
  onAddText: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddLine: () => void;
  onAddTriangle: () => void;
  onAddImage: () => void;
  onAddField: () => void;
  onAddWatermark: () => void;
  onSetBackground: () => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

interface ToolButton {
  id: string;
  icon: any;
  label: string;
  action: () => void;
}

export default function CanvasToolbar({
  onAddText,
  onAddRect,
  onAddCircle,
  onAddLine,
  onAddTriangle,
  onAddImage,
  onAddField,
  onAddWatermark,
  onSetBackground,
  activeTool,
  setActiveTool,
}: CanvasToolbarProps) {
  const tools: ToolButton[] = [
    { id: "select", icon: MousePointer2, label: "Select", action: () => setActiveTool("select") },
    { id: "text", icon: Type, label: "Text", action: onAddText },
    { id: "rect", icon: Square, label: "Rectangle", action: onAddRect },
    { id: "circle", icon: Circle, label: "Circle", action: onAddCircle },
    { id: "line", icon: Minus, label: "Line", action: onAddLine },
    { id: "triangle", icon: Triangle, label: "Triangle", action: onAddTriangle },
    { id: "image", icon: Image, label: "Image", action: onAddImage },
    { id: "field", icon: Database, label: "DB Field", action: onAddField },
    { id: "watermark", icon: Droplets, label: "Watermark", action: onAddWatermark },
    { id: "background", icon: PaintBucket, label: "Background", action: onSetBackground },
  ];

  return (
    <div className="w-14 bg-gray-900 flex flex-col items-center py-3 gap-1 border-r border-gray-700">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={tool.action}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all group relative ${
              isActive
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            title={tool.label}
          >
            <Icon size={18} />
            {/* Tooltip */}
            <span className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {tool.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

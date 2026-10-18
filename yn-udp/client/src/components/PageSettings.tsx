import { X } from "lucide-react";
import { PAGE_SIZES } from "../utils/templateTypes";

interface PageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  pageWidth: number;
  pageHeight: number;
  onApply: (width: number, height: number) => void;
}

export default function PageSettings({ isOpen, onClose, pageWidth, pageHeight, onApply }: PageSettingsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Page Size</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Presets */}
        <div className="p-4 space-y-2">
          <label className="text-sm font-medium text-gray-600">Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_SIZES.map((size) => (
              <button
                key={size.name}
                onClick={() => {
                  onApply(size.width, size.height);
                  onClose();
                }}
                className={`p-3 text-left rounded-lg border transition-all ${
                  pageWidth === size.width && pageHeight === size.height
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-700">{size.name}</div>
                <div className="text-[11px] text-gray-400">{size.width} × {size.height} px</div>
              </button>
            ))}
          </div>

          {/* Custom size */}
          <div className="pt-3 border-t mt-3">
            <label className="text-sm font-medium text-gray-600">Custom Size</label>
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <span className="text-[10px] text-gray-400">Width (px)</span>
                <input
                  type="number"
                  defaultValue={pageWidth}
                  id="custom-width"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-gray-400">Height (px)</span>
                <input
                  type="number"
                  defaultValue={pageHeight}
                  id="custom-height"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  const w = parseInt((document.getElementById("custom-width") as HTMLInputElement)?.value || "794");
                  const h = parseInt((document.getElementById("custom-height") as HTMLInputElement)?.value || "1123");
                  onApply(w, h);
                  onClose();
                }}
                className="self-end px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { fabric } from "fabric";
import { X, Printer } from "lucide-react";
import { SAMPLE_DATA } from "../utils/sampleData";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasJSON: any;
  pageWidth: number;
  pageHeight: number;
}

export default function PreviewModal({ isOpen, onClose, canvasJSON, pageWidth, pageHeight }: PreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !canvasJSON) return;

    // Create preview canvas
    const previewCanvas = new fabric.Canvas(canvasRef.current, {
      width: pageWidth,
      height: pageHeight,
      selection: false,
    });
    fabricRef.current = previewCanvas;

    // Replace placeholders in JSON
    let jsonStr = JSON.stringify(canvasJSON);
    Object.keys(SAMPLE_DATA).forEach((key) => {
      const placeholder = `{{${key}}}`;
      const value = SAMPLE_DATA[key];
      jsonStr = jsonStr.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
    });

    const modifiedJSON = JSON.parse(jsonStr);

    // Load into canvas
    previewCanvas.loadFromJSON(modifiedJSON, () => {
      previewCanvas.renderAll();
      // Make all objects non-interactive
      previewCanvas.getObjects().forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      previewCanvas.renderAll();
    });

    return () => {
      previewCanvas.dispose();
    };
  }, [isOpen, canvasJSON, pageWidth, pageHeight]);

  const handlePrint = () => {
    if (!fabricRef.current) return;
    
    const dataUrl = fabricRef.current.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Template</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; }
                img { width: 100%; page-break-after: always; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (!isOpen) return null;

  // Scale to fit viewport
  const maxViewWidth = Math.min(window.innerWidth - 200, 900);
  const maxViewHeight = window.innerHeight - 200;
  const scale = Math.min(maxViewWidth / pageWidth, maxViewHeight / pageHeight, 1);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Preview (with Sample Data)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Printer size={14} />
              Print
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Canvas Preview */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100 flex items-center justify-center">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <canvas ref={canvasRef} className="shadow-lg" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Fields replaced with sample data. In production, actual student/school data will be used.
          </p>
        </div>
      </div>
    </div>
  );
}

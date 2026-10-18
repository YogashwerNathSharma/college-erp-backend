import { fabric } from "fabric";
import { Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

interface LayersPanelProps {
  canvas: fabric.Canvas | null;
  objects: fabric.Object[];
  selectedObject: fabric.Object | null;
  onSelectObject: (obj: fabric.Object) => void;
  onRefresh: () => void;
}

export default function LayersPanel({
  canvas,
  objects,
  selectedObject,
  onSelectObject,
  onRefresh,
}: LayersPanelProps) {
  if (!canvas) return null;

  const getObjectLabel = (obj: fabric.Object, index: number): string => {
    const data = (obj as any).data;
    if (data?.type === "field") return `Field: {{${data.fieldKey}}}`;
    if (data?.type === "watermark") return "Watermark";
    if (obj.type === "i-text" || obj.type === "text") {
      const text = (obj as fabric.IText).text || "";
      return `Text: "${text.substring(0, 15)}${text.length > 15 ? "..." : ""}"`;
    }
    if (obj.type === "rect") return `Rectangle ${index + 1}`;
    if (obj.type === "circle") return `Circle ${index + 1}`;
    if (obj.type === "triangle") return `Triangle ${index + 1}`;
    if (obj.type === "line") return `Line ${index + 1}`;
    if (obj.type === "image") return `Image ${index + 1}`;
    return `Object ${index + 1}`;
  };

  const toggleVisibility = (obj: fabric.Object) => {
    obj.visible = !obj.visible;
    canvas.renderAll();
    onRefresh();
  };

  const toggleLock = (obj: fabric.Object) => {
    const isLocked = !obj.selectable;
    obj.selectable = isLocked;
    obj.evented = isLocked;
    canvas.renderAll();
    onRefresh();
  };

  const moveUp = (obj: fabric.Object) => {
    canvas.bringForward(obj);
    canvas.renderAll();
    onRefresh();
  };

  const moveDown = (obj: fabric.Object) => {
    canvas.sendBackwards(obj);
    canvas.renderAll();
    onRefresh();
  };

  const removeObject = (obj: fabric.Object) => {
    canvas.remove(obj);
    canvas.renderAll();
    onRefresh();
  };

  // Reverse so top-most layer shows first
  const reversedObjects = [...objects].reverse();

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="px-3 py-2 border-b bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Layers ({objects.length})
        </h4>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {reversedObjects.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No elements on canvas</p>
        ) : (
          reversedObjects.map((obj, idx) => {
            const originalIdx = objects.length - 1 - idx;
            const isSelected = obj === selectedObject;
            return (
              <div
                key={idx}
                onClick={() => {
                  onSelectObject(obj);
                  canvas.setActiveObject(obj);
                  canvas.renderAll();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer border-b border-gray-50 ${
                  isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-gray-50"
                }`}
              >
                <span className="flex-1 truncate text-gray-700">
                  {getObjectLabel(obj, originalIdx)}
                </span>
                <div className="flex gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(obj); }}
                    className="p-0.5 hover:bg-gray-200 rounded"
                    title={obj.visible !== false ? "Hide" : "Show"}
                  >
                    {obj.visible !== false ? <Eye size={10} /> : <EyeOff size={10} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveUp(obj); }}
                    className="p-0.5 hover:bg-gray-200 rounded"
                    title="Move Up"
                  >
                    <ArrowUp size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveDown(obj); }}
                    className="p-0.5 hover:bg-gray-200 rounded"
                    title="Move Down"
                  >
                    <ArrowDown size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeObject(obj); }}
                    className="p-0.5 hover:bg-red-100 rounded text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import * as fabricModule from "fabric";
const fabric = (fabricModule as any).fabric || fabricModule;
import { getCategoryColor, FIELD_MAPPINGS } from "./fieldMappings";

// Create a text element
export const createText = (canvas: fabric.Canvas, text: string = "Double-click to edit") => {
  const textObj = new fabric.IText(text, {
    left: canvas.getWidth() / 2 - 100,
    top: canvas.getHeight() / 2 - 20,
    fontSize: 20,
    fontFamily: "Arial",
    fill: "#000000",
    editable: true,
  });
  canvas.add(textObj);
  canvas.setActiveObject(textObj);
  canvas.renderAll();
  return textObj;
};

// Create a rectangle
export const createRect = (canvas: fabric.Canvas) => {
  const rect = new fabric.Rect({
    left: canvas.getWidth() / 2 - 75,
    top: canvas.getHeight() / 2 - 50,
    width: 150,
    height: 100,
    fill: "transparent",
    stroke: "#000000",
    strokeWidth: 2,
    rx: 0,
    ry: 0,
  });
  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.renderAll();
  return rect;
};

// Create a circle
export const createCircle = (canvas: fabric.Canvas) => {
  const circle = new fabric.Circle({
    left: canvas.getWidth() / 2 - 50,
    top: canvas.getHeight() / 2 - 50,
    radius: 50,
    fill: "transparent",
    stroke: "#000000",
    strokeWidth: 2,
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.renderAll();
  return circle;
};

// Create a line
export const createLine = (canvas: fabric.Canvas) => {
  const line = new fabric.Line([100, 200, 400, 200], {
    stroke: "#000000",
    strokeWidth: 2,
    selectable: true,
  });
  canvas.add(line);
  canvas.setActiveObject(line);
  canvas.renderAll();
  return line;
};

// Create a triangle
export const createTriangle = (canvas: fabric.Canvas) => {
  const triangle = new fabric.Triangle({
    left: canvas.getWidth() / 2 - 50,
    top: canvas.getHeight() / 2 - 50,
    width: 100,
    height: 100,
    fill: "transparent",
    stroke: "#000000",
    strokeWidth: 2,
  });
  canvas.add(triangle);
  canvas.setActiveObject(triangle);
  canvas.renderAll();
  return triangle;
};

// Create a DB field placeholder
export const createFieldPlaceholder = (canvas: fabric.Canvas, fieldKey: string) => {
  const field = FIELD_MAPPINGS.find((f) => f.key === fieldKey);
  if (!field) return;

  const color = getCategoryColor(field.category);
  const displayText = `{{${fieldKey}}}`;

  const textObj = new fabric.IText(displayText, {
    left: canvas.getWidth() / 2 - 60,
    top: canvas.getHeight() / 2,
    fontSize: 14,
    fontFamily: "Arial",
    fill: color,
    fontWeight: "bold",
    backgroundColor: `${color}15`,
    padding: 4,
    editable: false,
    data: { type: "field", fieldKey, category: field.category },
  } as any);

  canvas.add(textObj);
  canvas.setActiveObject(textObj);
  canvas.renderAll();
  return textObj;
};

// Add image from URL or file
export const addImageToCanvas = (canvas: fabric.Canvas, url: string) => {
  fabric.Image.fromURL(url, (img) => {
    const maxWidth = canvas.getWidth() * 0.5;
    const maxHeight = canvas.getHeight() * 0.5;
    
    if (img.width && img.height) {
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      img.scale(scale);
    }

    img.set({
      left: canvas.getWidth() / 2 - (img.getScaledWidth() || 100) / 2,
      top: canvas.getHeight() / 2 - (img.getScaledHeight() || 100) / 2,
    });

    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
  }, { crossOrigin: "anonymous" });
};

// Set canvas background color
export const setCanvasBackground = (canvas: fabric.Canvas, color: string) => {
  canvas.setBackgroundColor(color, () => {
    canvas.renderAll();
  });
};

// Set canvas background image
export const setCanvasBackgroundImage = (canvas: fabric.Canvas, url: string) => {
  fabric.Image.fromURL(url, (img) => {
    img.scaleToWidth(canvas.getWidth());
    img.scaleToHeight(canvas.getHeight());
    canvas.setBackgroundImage(img, () => {
      canvas.renderAll();
    });
  }, { crossOrigin: "anonymous" });
};

// Add watermark text
export const addWatermark = (canvas: fabric.Canvas, text: string = "WATERMARK") => {
  const watermark = new fabric.Text(text, {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    fontSize: 60,
    fontFamily: "Arial",
    fill: "rgba(0,0,0,0.08)",
    angle: -30,
    originX: "center",
    originY: "center",
    selectable: true,
    data: { type: "watermark" },
  } as any);

  canvas.add(watermark);
  canvas.renderAll();
  return watermark;
};

// Copy selected objects
export const copySelected = (canvas: fabric.Canvas): Promise<fabric.Object | null> => {
  return new Promise((resolve) => {
    const active = canvas.getActiveObject();
    if (!active) {
      resolve(null);
      return;
    }
    active.clone((cloned: fabric.Object) => {
      resolve(cloned);
    });
  });
};

// Paste cloned object
export const pasteObject = (canvas: fabric.Canvas, clipboard: fabric.Object | null) => {
  if (!clipboard) return;
  
  clipboard.clone((cloned: fabric.Object) => {
    canvas.discardActiveObject();
    cloned.set({
      left: (cloned.left || 0) + 20,
      top: (cloned.top || 0) + 20,
      evented: true,
    });

    if ((cloned as any).type === "activeSelection") {
      (cloned as fabric.ActiveSelection).canvas = canvas;
      (cloned as fabric.ActiveSelection).forEachObject((obj: fabric.Object) => {
        canvas.add(obj);
      });
      cloned.setCoords();
    } else {
      canvas.add(cloned);
    }

    canvas.setActiveObject(cloned);
    canvas.requestRenderAll();
  });
};

// Bring object to front
export const bringToFront = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject();
  if (active) {
    canvas.bringToFront(active);
    canvas.renderAll();
  }
};

// Send object to back
export const sendToBack = (canvas: fabric.Canvas) => {
  const active = canvas.getActiveObject();
  if (active) {
    canvas.sendToBack(active);
    canvas.renderAll();
  }
};

// Delete selected objects
export const deleteSelected = (canvas: fabric.Canvas) => {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length) {
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  }
};

// Generate thumbnail from canvas
export const generateThumbnail = (canvas: fabric.Canvas): string => {
  const dataURL = canvas.toDataURL({
    format: "png",
    quality: 0.3,
    multiplier: 0.2,
  });
  return dataURL;
};

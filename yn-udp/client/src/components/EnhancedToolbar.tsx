import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  // File
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  Download,
  // Insert
  Type,
  Image,
  Square,
  Circle,
  Minus,
  Hexagon,
  Table2,
  QrCode,
  ImagePlus,
  PenTool,
  // Format
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  // Arrange
  ArrowUpToLine,
  ArrowDownToLine,
  Group,
  Ungroup,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  // Page
  Plus,
  Trash2,
  FileText,
  RotateCw,
  // View
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Ruler,
  Magnet,
  Maximize,
  // Tools
  Layers,
  LayoutTemplate,
  History,
  Lock,
  Printer,
  ChevronDown,
  Undo2,
  Redo2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ToolbarAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

interface ToolbarDropdown {
  id: string;
  icon: React.ReactNode;
  label: string;
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    divider?: boolean;
  }>;
}

interface EnhancedToolbarProps {
  canvas: fabric.Canvas | null;
  // Page Management
  onAddPage?: () => void;
  onDeletePage?: () => void;
  onPageSizeChange?: (size: string) => void;
  currentPageSize?: string;
  totalPages?: number;
  currentPage?: number;
  // File Operations
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onExport?: () => void;
  // Tools
  onBulkGenerate?: () => void;
  onTemplateLibrary?: () => void;
  onVersionHistory?: () => void;
  onAccessControl?: () => void;
  onPrint?: () => void;
  // Insert Widgets
  onInsertTable?: () => void;
  onInsertQR?: () => void;
  onInsertImageField?: () => void;
  onInsertSignature?: () => void;
  // View
  showGrid?: boolean;
  showRulers?: boolean;
  snapToGrid?: boolean;
  onToggleGrid?: () => void;
  onToggleRulers?: () => void;
  onToggleSnap?: () => void;
  // State
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

// ─────────────────────────────────────────────────────────────
// Dropdown Menu Component
// ─────────────────────────────────────────────────────────────

const DropdownMenu: React.FC<{
  trigger: React.ReactNode;
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    onClick: () => void;
    divider?: boolean;
    disabled?: boolean;
  }>;
  align?: 'left' | 'right';
}> = ({ trigger, items, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute top-full mt-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          } bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-50`}
        >
          {items.map((item) =>
            item.divider ? (
              <div key={item.id} className="border-t border-gray-100 my-1" />
            ) : (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-gray-400 ml-4">{item.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Toolbar Button Component
// ─────────────────────────────────────────────────────────────

const ToolBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
}> = ({ icon, label, shortcut, onClick, active, disabled, size = 'md' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    className={`inline-flex items-center justify-center rounded-md transition-colors ${
      size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
    } ${
      active
        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {icon}
  </button>
);

// ─────────────────────────────────────────────────────────────
// Divider Component
// ─────────────────────────────────────────────────────────────

const Divider: React.FC = () => (
  <div className="w-px h-6 bg-gray-200 mx-1" />
);

// ─────────────────────────────────────────────────────────────
// Font Selector Component
// ─────────────────────────────────────────────────────────────

const FONTS = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Comic Sans MS',
  'Impact',
  'Lucida Console',
  'Palatino',
  'Garamond',
  'Bookman',
  'Noto Sans',
  'Roboto',
  'Open Sans',
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];

// ─────────────────────────────────────────────────────────────
// Enhanced Toolbar Component
// ─────────────────────────────────────────────────────────────

const EnhancedToolbar: React.FC<EnhancedToolbarProps> = ({
  canvas,
  onAddPage,
  onDeletePage,
  onPageSizeChange,
  currentPageSize = 'A4 Portrait',
  totalPages = 1,
  currentPage = 1,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExport,
  onBulkGenerate,
  onTemplateLibrary,
  onVersionHistory,
  onAccessControl,
  onPrint,
  onInsertTable,
  onInsertQR,
  onInsertImageField,
  onInsertSignature,
  showGrid = false,
  showRulers = false,
  snapToGrid = false,
  onToggleGrid,
  onToggleRulers,
  onToggleSnap,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  zoom = 100,
  onZoomChange,
}) => {
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState('left');

  // Sync with selected object
  useEffect(() => {
    if (!canvas) return;
    const updateFromSelection = () => {
      const active = canvas.getActiveObject();
      if (active && (active.type === 'textbox' || active.type === 'i-text' || active.type === 'text')) {
        setCurrentFont((active as any).fontFamily || 'Arial');
        setCurrentFontSize((active as any).fontSize || 16);
        setIsBold((active as any).fontWeight === 'bold');
        setIsItalic((active as any).fontStyle === 'italic');
        setIsUnderline((active as any).underline || false);
        setTextAlign((active as any).textAlign || 'left');
      }
    };
    canvas.on('selection:created', updateFromSelection);
    canvas.on('selection:updated', updateFromSelection);
    return () => {
      canvas.off('selection:created', updateFromSelection);
      canvas.off('selection:updated', updateFromSelection);
    };
  }, [canvas]);

  // ─── Canvas Operations ──────────────────────────────────────

  const addText = useCallback(() => {
    if (!canvas) return;
    const text = new fabric.IText('Double-click to edit', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: '#000000',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }, [canvas]);

  const addImage = useCallback(() => {
    if (!canvas) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        fabric.Image.fromURL(ev.target?.result as string, (img) => {
          img.scaleToWidth(200);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [canvas]);

  const addRect = useCallback(() => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 100,
      fill: 'transparent',
      stroke: '#333333',
      strokeWidth: 2,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }, [canvas]);

  const addCircle = useCallback(() => {
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: '#333333',
      strokeWidth: 2,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  }, [canvas]);

  const addLine = useCallback(() => {
    if (!canvas) return;
    const line = new fabric.Line([50, 50, 250, 50], {
      stroke: '#333333',
      strokeWidth: 2,
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  }, [canvas]);

  const addPolygon = useCallback(() => {
    if (!canvas) return;
    const points = [
      { x: 50, y: 0 },
      { x: 100, y: 38 },
      { x: 82, y: 100 },
      { x: 18, y: 100 },
      { x: 0, y: 38 },
    ];
    const polygon = new fabric.Polygon(points, {
      left: 100,
      top: 100,
      fill: 'transparent',
      stroke: '#333333',
      strokeWidth: 2,
    });
    canvas.add(polygon);
    canvas.setActiveObject(polygon);
    canvas.renderAll();
  }, [canvas]);

  // Format Operations
  const toggleBold = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject() as any;
    if (!obj || !['textbox', 'i-text', 'text'].includes(obj.type)) return;
    obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
    setIsBold(obj.fontWeight === 'bold');
    canvas.renderAll();
  }, [canvas]);

  const toggleItalic = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject() as any;
    if (!obj || !['textbox', 'i-text', 'text'].includes(obj.type)) return;
    obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
    setIsItalic(obj.fontStyle === 'italic');
    canvas.renderAll();
  }, [canvas]);

  const toggleUnderline = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject() as any;
    if (!obj || !['textbox', 'i-text', 'text'].includes(obj.type)) return;
    obj.set('underline', !obj.underline);
    setIsUnderline(obj.underline);
    canvas.renderAll();
  }, [canvas]);

  const changeFont = useCallback(
    (font: string) => {
      if (!canvas) return;
      const obj = canvas.getActiveObject() as any;
      if (!obj || !['textbox', 'i-text', 'text'].includes(obj.type)) return;
      obj.set('fontFamily', font);
      setCurrentFont(font);
      canvas.renderAll();
    },
    [canvas]
  );

  const changeFontSize = useCallback(
    (size: number) => {
      if (!canvas) return;
      const obj = canvas.getActiveObject() as any;
      if (!obj || !['textbox', 'i-text', 'text'].includes(obj.type)) return;
      obj.set('fontSize', size);
      setCurrentFontSize(size);
      canvas.renderAll();
    },
    [canvas]
  );

  const changeTextAlign = useCallback(
    (align: string) => {
      if (!canvas) return;
      const obj = canvas.getActiveObject() as any;
      if (!obj || !['textbox', 'i-text', 'text'].includes(obj.type)) return;
      obj.set('textAlign', align);
      setTextAlign(align);
      canvas.renderAll();
    },
    [canvas]
  );

  // Arrange Operations
  const bringToFront = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.bringToFront(obj);
      canvas.renderAll();
    }
  }, [canvas]);

  const sendToBack = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.sendToBack(obj);
      canvas.renderAll();
    }
  }, [canvas]);

  const groupSelected = useCallback(() => {
    if (!canvas) return;
    const activeSelection = canvas.getActiveObject();
    if (activeSelection && activeSelection.type === 'activeSelection') {
      (activeSelection as fabric.ActiveSelection).toGroup();
      canvas.renderAll();
    }
  }, [canvas]);

  const ungroupSelected = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'group') {
      (activeObject as fabric.Group).toActiveSelection();
      canvas.renderAll();
    }
  }, [canvas]);

  // Alignment
  const alignObjects = useCallback(
    (alignment: string) => {
      if (!canvas) return;
      const activeSelection = canvas.getActiveObject();
      if (!activeSelection) return;

      if (activeSelection.type === 'activeSelection') {
        const objects = (activeSelection as fabric.ActiveSelection).getObjects();
        const bounds = activeSelection.getBoundingRect();

        objects.forEach((obj) => {
          switch (alignment) {
            case 'left':
              obj.set('left', bounds.left);
              break;
            case 'center':
              obj.set('left', bounds.left + bounds.width / 2 - (obj.width! * obj.scaleX!) / 2);
              break;
            case 'right':
              obj.set('left', bounds.left + bounds.width - obj.width! * obj.scaleX!);
              break;
            case 'top':
              obj.set('top', bounds.top);
              break;
            case 'middle':
              obj.set('top', bounds.top + bounds.height / 2 - (obj.height! * obj.scaleY!) / 2);
              break;
            case 'bottom':
              obj.set('top', bounds.top + bounds.height - obj.height! * obj.scaleY!);
              break;
          }
        });
        canvas.renderAll();
      }
    },
    [canvas]
  );

  // Zoom
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min((zoom || 100) + 10, 400);
    onZoomChange?.(newZoom);
    if (canvas) {
      canvas.setZoom(newZoom / 100);
      canvas.renderAll();
    }
  }, [canvas, zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max((zoom || 100) - 10, 25);
    onZoomChange?.(newZoom);
    if (canvas) {
      canvas.setZoom(newZoom / 100);
      canvas.renderAll();
    }
  }, [canvas, zoom, onZoomChange]);

  const handleZoomFit = useCallback(() => {
    onZoomChange?.(100);
    if (canvas) {
      canvas.setZoom(1);
      canvas.renderAll();
    }
  }, [canvas, onZoomChange]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm">
      {/* Top Row: File + Main Tools */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-100">
        {/* File Group */}
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">
              File <ChevronDown className="w-3 h-3" />
            </button>
          }
          items={[
            { id: 'new', label: 'New Template', icon: <FilePlus className="w-3.5 h-3.5" />, shortcut: 'Ctrl+N', onClick: onNew || (() => {}) },
            { id: 'open', label: 'Open', icon: <FolderOpen className="w-3.5 h-3.5" />, shortcut: 'Ctrl+O', onClick: onOpen || (() => {}) },
            { id: 'd1', label: '', onClick: () => {}, divider: true },
            { id: 'save', label: 'Save', icon: <Save className="w-3.5 h-3.5" />, shortcut: 'Ctrl+S', onClick: onSave || (() => {}) },
            { id: 'saveas', label: 'Save As...', icon: <SaveAll className="w-3.5 h-3.5" />, shortcut: 'Ctrl+Shift+S', onClick: onSaveAs || (() => {}) },
            { id: 'd2', label: '', onClick: () => {}, divider: true },
            { id: 'export', label: 'Export...', icon: <Download className="w-3.5 h-3.5" />, shortcut: 'Ctrl+E', onClick: onExport || (() => {}) },
            { id: 'print', label: 'Print', icon: <Printer className="w-3.5 h-3.5" />, shortcut: 'Ctrl+P', onClick: onPrint || (() => {}) },
          ]}
        />

        <Divider />

        {/* Undo/Redo */}
        <ToolBtn icon={<Undo2 className="w-4 h-4" />} label="Undo" shortcut="Ctrl+Z" onClick={onUndo || (() => {})} disabled={!canUndo} />
        <ToolBtn icon={<Redo2 className="w-4 h-4" />} label="Redo" shortcut="Ctrl+Y" onClick={onRedo || (() => {})} disabled={!canRedo} />

        <Divider />

        {/* Insert Group */}
        <ToolBtn icon={<Type className="w-4 h-4" />} label="Insert Text" shortcut="T" onClick={addText} />
        <ToolBtn icon={<Image className="w-4 h-4" />} label="Insert Image" onClick={addImage} />

        <DropdownMenu
          trigger={
            <button className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900" title="Shapes">
              <Square className="w-4 h-4" />
              <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
            </button>
          }
          items={[
            { id: 'rect', label: 'Rectangle', icon: <Square className="w-3.5 h-3.5" />, onClick: addRect },
            { id: 'circle', label: 'Circle', icon: <Circle className="w-3.5 h-3.5" />, onClick: addCircle },
            { id: 'line', label: 'Line', icon: <Minus className="w-3.5 h-3.5" />, onClick: addLine },
            { id: 'polygon', label: 'Polygon', icon: <Hexagon className="w-3.5 h-3.5" />, onClick: addPolygon },
          ]}
        />

        <ToolBtn icon={<Table2 className="w-4 h-4" />} label="Insert Table" onClick={onInsertTable || (() => {})} />
        <ToolBtn icon={<QrCode className="w-4 h-4" />} label="QR Code" onClick={onInsertQR || (() => {})} />
        <ToolBtn icon={<ImagePlus className="w-4 h-4" />} label="Image Placeholder" onClick={onInsertImageField || (() => {})} />
        <ToolBtn icon={<PenTool className="w-4 h-4" />} label="Signature Field" onClick={onInsertSignature || (() => {})} />

        <Divider />

        {/* Arrange Group */}
        <ToolBtn icon={<ArrowUpToLine className="w-4 h-4" />} label="Bring to Front" onClick={bringToFront} />
        <ToolBtn icon={<ArrowDownToLine className="w-4 h-4" />} label="Send to Back" onClick={sendToBack} />
        <ToolBtn icon={<Group className="w-4 h-4" />} label="Group" shortcut="Ctrl+G" onClick={groupSelected} />
        <ToolBtn icon={<Ungroup className="w-4 h-4" />} label="Ungroup" shortcut="Ctrl+Shift+G" onClick={ungroupSelected} />

        <DropdownMenu
          trigger={
            <button className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900" title="Align">
              <AlignHorizontalJustifyCenter className="w-4 h-4" />
              <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
            </button>
          }
          items={[
            { id: 'align-left', label: 'Align Left', icon: <AlignStartVertical className="w-3.5 h-3.5" />, onClick: () => alignObjects('left') },
            { id: 'align-center', label: 'Align Center', icon: <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />, onClick: () => alignObjects('center') },
            { id: 'align-right', label: 'Align Right', icon: <AlignEndVertical className="w-3.5 h-3.5" />, onClick: () => alignObjects('right') },
            { id: 'd1', label: '', onClick: () => {}, divider: true },
            { id: 'align-top', label: 'Align Top', icon: <AlignStartHorizontal className="w-3.5 h-3.5" />, onClick: () => alignObjects('top') },
            { id: 'align-middle', label: 'Align Middle', icon: <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />, onClick: () => alignObjects('middle') },
            { id: 'align-bottom', label: 'Align Bottom', icon: <AlignEndHorizontal className="w-3.5 h-3.5" />, onClick: () => alignObjects('bottom') },
          ]}
        />

        <Divider />

        {/* Page Group */}
        <ToolBtn icon={<Plus className="w-4 h-4" />} label="Add Page" onClick={onAddPage || (() => {})} />
        <ToolBtn icon={<Trash2 className="w-4 h-4" />} label="Delete Page" onClick={onDeletePage || (() => {})} disabled={totalPages <= 1} />

        <DropdownMenu
          trigger={
            <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded border border-gray-200">
              {currentPageSize} <ChevronDown className="w-3 h-3" />
            </button>
          }
          items={[
            { id: 'a4-p', label: 'A4 Portrait', onClick: () => onPageSizeChange?.('a4-portrait') },
            { id: 'a4-l', label: 'A4 Landscape', onClick: () => onPageSizeChange?.('a4-landscape') },
            { id: 'letter-p', label: 'Letter Portrait', onClick: () => onPageSizeChange?.('letter-portrait') },
            { id: 'letter-l', label: 'Letter Landscape', onClick: () => onPageSizeChange?.('letter-landscape') },
            { id: 'id-card', label: 'ID Card (CR80)', onClick: () => onPageSizeChange?.('cr80') },
            { id: 'a3', label: 'A3 (Certificate)', onClick: () => onPageSizeChange?.('a3-portrait') },
            { id: 'a5', label: 'A5 (Receipt)', onClick: () => onPageSizeChange?.('a5-portrait') },
            { id: 'custom', label: 'Custom Size...', onClick: () => onPageSizeChange?.('custom') },
          ]}
        />

        <span className="text-xs text-gray-500 mx-2">
          Page {currentPage}/{totalPages}
        </span>

        <Divider />

        {/* View Group */}
        <ToolBtn icon={<ZoomOut className="w-4 h-4" />} label="Zoom Out" shortcut="Ctrl+-" onClick={handleZoomOut} />
        <span className="text-xs text-gray-600 w-10 text-center">{zoom}%</span>
        <ToolBtn icon={<ZoomIn className="w-4 h-4" />} label="Zoom In" shortcut="Ctrl+=" onClick={handleZoomIn} />
        <ToolBtn icon={<Maximize className="w-4 h-4" />} label="Fit to View" onClick={handleZoomFit} />

        <ToolBtn icon={<Grid3X3 className="w-4 h-4" />} label="Toggle Grid" onClick={onToggleGrid || (() => {})} active={showGrid} />
        <ToolBtn icon={<Ruler className="w-4 h-4" />} label="Toggle Rulers" onClick={onToggleRulers || (() => {})} active={showRulers} />
        <ToolBtn icon={<Magnet className="w-4 h-4" />} label="Snap to Grid" onClick={onToggleSnap || (() => {})} active={snapToGrid} />

        <Divider />

        {/* Tools Group */}
        <ToolBtn icon={<Layers className="w-4 h-4" />} label="Bulk Generate" onClick={onBulkGenerate || (() => {})} />
        <ToolBtn icon={<LayoutTemplate className="w-4 h-4" />} label="Templates" onClick={onTemplateLibrary || (() => {})} />
        <ToolBtn icon={<History className="w-4 h-4" />} label="Version History" onClick={onVersionHistory || (() => {})} />
        <ToolBtn icon={<Lock className="w-4 h-4" />} label="Access Control" onClick={onAccessControl || (() => {})} />
      </div>

      {/* Bottom Row: Format (text-specific) */}
      <div className="flex items-center gap-1 px-3 py-1">
        {/* Font Family */}
        <select
          value={currentFont}
          onChange={(e) => changeFont(e.target.value)}
          className="h-7 px-2 text-xs border border-gray-200 rounded bg-white text-gray-700 min-w-[120px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
        >
          {FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          value={currentFontSize}
          onChange={(e) => changeFontSize(Number(e.target.value))}
          className="h-7 px-2 text-xs border border-gray-200 rounded bg-white text-gray-700 w-16 focus:outline-none focus:ring-1 focus:ring-indigo-300"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <Divider />

        {/* Bold / Italic / Underline */}
        <ToolBtn icon={<Bold className="w-4 h-4" />} label="Bold" shortcut="Ctrl+B" onClick={toggleBold} active={isBold} size="sm" />
        <ToolBtn icon={<Italic className="w-4 h-4" />} label="Italic" shortcut="Ctrl+I" onClick={toggleItalic} active={isItalic} size="sm" />
        <ToolBtn icon={<Underline className="w-4 h-4" />} label="Underline" shortcut="Ctrl+U" onClick={toggleUnderline} active={isUnderline} size="sm" />

        <Divider />

        {/* Text Align */}
        <ToolBtn icon={<AlignLeft className="w-4 h-4" />} label="Align Left" onClick={() => changeTextAlign('left')} active={textAlign === 'left'} size="sm" />
        <ToolBtn icon={<AlignCenter className="w-4 h-4" />} label="Align Center" onClick={() => changeTextAlign('center')} active={textAlign === 'center'} size="sm" />
        <ToolBtn icon={<AlignRight className="w-4 h-4" />} label="Align Right" onClick={() => changeTextAlign('right')} active={textAlign === 'right'} size="sm" />
        <ToolBtn icon={<AlignJustify className="w-4 h-4" />} label="Justify" onClick={() => changeTextAlign('justify')} active={textAlign === 'justify'} size="sm" />

        <Divider />

        {/* Text Color */}
        <div className="relative">
          <input
            type="color"
            defaultValue="#000000"
            onChange={(e) => {
              if (!canvas) return;
              const obj = canvas.getActiveObject() as any;
              if (obj && ['textbox', 'i-text', 'text'].includes(obj.type)) {
                obj.set('fill', e.target.value);
                canvas.renderAll();
              }
            }}
            className="w-7 h-7 rounded cursor-pointer border border-gray-200"
            title="Text Color"
          />
        </div>

        {/* Fill Color */}
        <div className="relative">
          <input
            type="color"
            defaultValue="#ffffff"
            onChange={(e) => {
              if (!canvas) return;
              const obj = canvas.getActiveObject() as any;
              if (obj && ['rect', 'circle', 'polygon'].includes(obj.type)) {
                obj.set('fill', e.target.value);
                canvas.renderAll();
              }
            }}
            className="w-7 h-7 rounded cursor-pointer border border-gray-200"
            title="Fill Color"
          />
        </div>

        {/* Stroke Color */}
        <div className="relative">
          <input
            type="color"
            defaultValue="#333333"
            onChange={(e) => {
              if (!canvas) return;
              const obj = canvas.getActiveObject() as any;
              if (obj) {
                obj.set('stroke', e.target.value);
                canvas.renderAll();
              }
            }}
            className="w-7 h-7 rounded cursor-pointer border border-gray-200"
            title="Stroke/Border Color"
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedToolbar;

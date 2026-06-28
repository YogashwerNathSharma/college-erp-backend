/**
 * YN-UDP Table Widget
 * Adds data tables to certificates/reports (marks table, fee breakup, attendance)
 * 
 * Features:
 * - Insert Table dialog (rows, columns, headers)
 * - Creates Fabric.js Group of rectangles + text objects
 * - Properties panel for editing table config
 * - Support for {{field}} placeholders in cells
 * - Support for looped data: {{#marks}}...{{/marks}}
 * - Double-click to edit cell content
 * - Resize table → cells auto-adjust
 */

import { useState, useEffect, useCallback } from "react";
import {
  Table2,
  Plus,
  Minus,
  Palette,
  Type,
  GripVertical,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import {
  createTableObject,
  updateTableObject,
  getDefaultTableConfig,
  TableConfig,
} from "../../utils/widgetHelpers";

// ===========================
// TABLE INSERT DIALOG
// ===========================

interface TableInsertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (config: TableConfig) => void;
}

export function TableInsertDialog({ isOpen, onClose, onInsert }: TableInsertDialogProps) {
  const [config, setConfig] = useState<TableConfig>(getDefaultTableConfig());
  const [headers, setHeaders] = useState<string[]>(["Subject", "Max Marks", "Obtained", "Grade"]);

  const presets = [
    {
      name: "Marks Table",
      config: {
        ...getDefaultTableConfig(),
        headers: ["Subject", "Max Marks", "Obtained", "Grade"],
        loopField: "marks",
      },
    },
    {
      name: "Fee Breakup",
      config: {
        ...getDefaultTableConfig(),
        rows: 6,
        cols: 3,
        headers: ["Fee Head", "Amount", "Due Date"],
        loopField: "fee_items",
      },
    },
    {
      name: "Attendance Summary",
      config: {
        ...getDefaultTableConfig(),
        rows: 12,
        cols: 4,
        headers: ["Month", "Working Days", "Present", "Absent"],
        loopField: "attendance",
      },
    },
    {
      name: "Co-Curricular",
      config: {
        ...getDefaultTableConfig(),
        rows: 5,
        cols: 3,
        headers: ["Activity", "Grade", "Remarks"],
        loopField: "activities",
      },
    },
    {
      name: "Custom Table",
      config: getDefaultTableConfig(),
    },
  ];

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
    setConfig({ ...config, headers: newHeaders });
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Col ${headers.length + 1}`];
    setHeaders(newHeaders);
    setConfig({ ...config, cols: config.cols + 1, headers: newHeaders });
  };

  const removeColumn = () => {
    if (config.cols <= 1) return;
    const newHeaders = headers.slice(0, -1);
    setHeaders(newHeaders);
    setConfig({ ...config, cols: config.cols - 1, headers: newHeaders });
  };

  const handlePreset = (preset: typeof presets[0]) => {
    setConfig(preset.config);
    setHeaders(preset.config.headers);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl w-[600px] max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Table2 size={20} className="text-blue-400" />
            <h3 className="text-white font-semibold text-lg">Insert Table</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Presets */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">
              Quick Presets
            </label>
            <div className="grid grid-cols-5 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePreset(preset)}
                  className="px-2 py-1.5 text-xs rounded-md bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white transition-colors border border-gray-600"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Rows</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfig({ ...config, rows: Math.max(1, config.rows - 1) })}
                  className="p-1 bg-gray-700 rounded hover:bg-gray-600 text-gray-300"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={config.rows}
                  onChange={(e) => setConfig({ ...config, rows: parseInt(e.target.value) || 1 })}
                  className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center text-sm"
                  min={1}
                  max={50}
                />
                <button
                  onClick={() => setConfig({ ...config, rows: config.rows + 1 })}
                  className="p-1 bg-gray-700 rounded hover:bg-gray-600 text-gray-300"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Columns</label>
              <div className="flex items-center gap-2">
                <button onClick={removeColumn} className="p-1 bg-gray-700 rounded hover:bg-gray-600 text-gray-300">
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={config.cols}
                  onChange={(e) => {
                    const cols = parseInt(e.target.value) || 1;
                    setConfig({ ...config, cols });
                  }}
                  className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center text-sm"
                  min={1}
                  max={10}
                />
                <button onClick={addColumn} className="p-1 bg-gray-700 rounded hover:bg-gray-600 text-gray-300">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Cell Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Cell Width (px)</label>
              <input
                type="number"
                value={config.cellWidth}
                onChange={(e) => setConfig({ ...config, cellWidth: parseInt(e.target.value) || 80 })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                min={50}
                max={300}
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Cell Height (px)</label>
              <input
                type="number"
                value={config.cellHeight}
                onChange={(e) => setConfig({ ...config, cellHeight: parseInt(e.target.value) || 25 })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                min={20}
                max={100}
              />
            </div>
          </div>

          {/* Headers */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">
              Column Headers
            </label>
            <div className="space-y-2">
              {headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-500" />
                  <span className="text-gray-500 text-xs w-5">{idx + 1}</span>
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(idx, e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    placeholder={`Column ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Styling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Header Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.headerBg}
                  onChange={(e) => setConfig({ ...config, headerBg: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                />
                <span className="text-gray-400 text-xs">{config.headerBg}</span>
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Border Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.borderColor}
                  onChange={(e) => setConfig({ ...config, borderColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                />
                <span className="text-gray-400 text-xs">{config.borderColor}</span>
              </div>
            </div>
          </div>

          {/* Loop Field */}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">
              Loop Data Field (for bulk generation)
            </label>
            <input
              type="text"
              value={config.loopField || ""}
              onChange={(e) => setConfig({ ...config, loopField: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              placeholder='e.g., "marks" for {{#marks}}...{{/marks}}'
            />
            <p className="text-gray-500 text-xs mt-1">
              This field&apos;s array data will populate rows during bulk generation
            </p>
          </div>

          {/* Font */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Font Size</label>
              <input
                type="number"
                value={config.fontSize}
                onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) || 12 })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                min={8}
                max={24}
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Font Family</label>
              <select
                value={config.fontFamily}
                onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="px-4 pb-2">
          <label className="text-gray-300 text-sm font-medium mb-2 block">Preview</label>
          <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  {headers.slice(0, config.cols).map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-1.5 text-white font-semibold border border-gray-600"
                      style={{ backgroundColor: config.headerBg }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.min(config.rows, 3) }).map((_, row) => (
                  <tr key={row} className={row % 2 === 1 ? "bg-gray-800" : ""}>
                    {Array.from({ length: config.cols }).map((_, col) => (
                      <td key={col} className="px-3 py-1 text-gray-400 border border-gray-700">
                        {config.loopField
                          ? `{{${headers[col]?.toLowerCase().replace(/\s+/g, "_") || "field"}}}`
                          : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                {config.rows > 3 && (
                  <tr>
                    <td colSpan={config.cols} className="text-center text-gray-500 py-1 border border-gray-700">
                      ...{config.rows - 3} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
            onClick={() => {
              onInsert(config);
              onClose();
            }}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Check size={16} />
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================
// TABLE PROPERTIES PANEL
// ===========================

interface TablePropertiesPanelProps {
  canvas: any;
  activeObject: any;
}

export function TablePropertiesPanel({ canvas, activeObject }: TablePropertiesPanelProps) {
  const [config, setConfig] = useState<TableConfig | null>(null);

  useEffect(() => {
    if (activeObject?.data?.type === "table") {
      setConfig(activeObject.data.tableConfig);
    }
  }, [activeObject]);

  const handleUpdate = (updates: Partial<TableConfig>) => {
    if (!config || !canvas || !activeObject) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    updateTableObject(canvas, activeObject, newConfig);
  };

  if (!config) return null;

  return (
    <div className="space-y-3 p-3 border-t border-gray-700">
      <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
        <Table2 size={16} />
        <span>Table Properties</span>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Rows</label>
          <input
            type="number"
            value={config.rows}
            onChange={(e) => handleUpdate({ rows: parseInt(e.target.value) || 1 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
            min={1}
            max={50}
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Columns</label>
          <input
            type="number"
            value={config.cols}
            onChange={(e) => handleUpdate({ cols: parseInt(e.target.value) || 1 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
            min={1}
            max={10}
          />
        </div>
      </div>

      {/* Cell Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Cell Width</label>
          <input
            type="number"
            value={config.cellWidth}
            onChange={(e) => handleUpdate({ cellWidth: parseInt(e.target.value) || 80 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Cell Height</label>
          <input
            type="number"
            value={config.cellHeight}
            onChange={(e) => handleUpdate({ cellHeight: parseInt(e.target.value) || 25 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
          />
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Header BG</label>
          <input
            type="color"
            value={config.headerBg}
            onChange={(e) => handleUpdate({ headerBg: e.target.value })}
            className="w-full h-6 rounded cursor-pointer border border-gray-600 mt-0.5"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Border Color</label>
          <input
            type="color"
            value={config.borderColor}
            onChange={(e) => handleUpdate({ borderColor: e.target.value })}
            className="w-full h-6 rounded cursor-pointer border border-gray-600 mt-0.5"
          />
        </div>
      </div>

      {/* Font */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Font Size</label>
          <input
            type="number"
            value={config.fontSize}
            onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) || 12 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
            min={8}
            max={24}
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Padding</label>
          <input
            type="number"
            value={config.cellPadding}
            onChange={(e) => handleUpdate({ cellPadding: parseInt(e.target.value) || 4 })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
            min={2}
            max={20}
          />
        </div>
      </div>

      {/* Loop Field */}
      <div>
        <label className="text-gray-400 text-xs">Loop Field</label>
        <input
          type="text"
          value={config.loopField || ""}
          onChange={(e) => handleUpdate({ loopField: e.target.value })}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-0.5"
          placeholder="e.g., marks"
        />
      </div>

      {/* Reset */}
      <button
        onClick={() => handleUpdate(getDefaultTableConfig())}
        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
      >
        <RotateCcw size={12} />
        Reset to Default
      </button>
    </div>
  );
}

// ===========================
// TABLE TOOLBAR BUTTON
// ===========================

interface TableToolbarButtonProps {
  canvas: any;
}

export function TableToolbarButton({ canvas }: TableToolbarButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleInsert = (config: TableConfig) => {
    if (!canvas) return;
    const tableGroup = createTableObject(canvas, config);
    canvas.add(tableGroup);
    canvas.setActiveObject(tableGroup);
    canvas.renderAll();
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all group relative"
        title="Insert Table"
      >
        <Table2 size={18} />
        <span className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          Table
        </span>
      </button>
      <TableInsertDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onInsert={handleInsert}
      />
    </>
  );
}

export default TableToolbarButton;

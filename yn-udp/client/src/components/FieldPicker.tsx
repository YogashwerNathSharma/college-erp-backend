import { useState } from "react";
import { X, Search } from "lucide-react";
import { FIELD_MAPPINGS, FIELD_CATEGORIES, FieldCategory, FieldMapping } from "../utils/fieldMappings";

interface FieldPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fieldKey: string) => void;
}

export default function FieldPicker({ isOpen, onClose, onSelect }: FieldPickerProps) {
  const [activeCategory, setActiveCategory] = useState<FieldCategory>("Student");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredFields = FIELD_MAPPINGS.filter((f) => {
    const matchesCategory = f.category === activeCategory;
    const matchesSearch = search === "" || 
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Insert Database Field</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
          {FIELD_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                activeCategory === cat.name
                  ? "text-white"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-200"
              }`}
              style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Fields List */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
          {filteredFields.map((field) => (
            <button
              key={field.key}
              onClick={() => {
                onSelect(field.key);
                onClose();
              }}
              className="p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                {field.label}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                {`{{${field.key}}}`}
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="p-3 border-t bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Click a field to insert it on the canvas. It will be replaced with real data during print.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  FileText,
  Layout,
  CreditCard,
  BookOpen,
  Receipt,
  Ticket,
  Mail,
  Star,
  Download,
  Eye,
  ChevronRight,
  Filter,
  Grid3X3,
  List,
} from 'lucide-react';
import {
  PREBUILT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TemplateDefinition,
  TemplateCategory,
  searchTemplates,
  getTemplatesByCategory,
} from '../data/prebuilt-templates';
import { Page } from './PageManager';

// ─── Props ───────────────────────────────────────────────────────────────────

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (pages: Page[]) => void;
}

// ─── Category Icons ─────────────────────────────────────────────────────────

const categoryIconMap: Record<TemplateCategory, React.ReactNode> = {
  transfer_certificate: <FileText size={18} />,
  character_certificate: <Star size={18} />,
  bonafide: <BookOpen size={18} />,
  id_card_student: <CreditCard size={18} />,
  id_card_staff: <CreditCard size={18} />,
  report_card_cbse: <Layout size={18} />,
  report_card_icse: <Layout size={18} />,
  fee_receipt: <Receipt size={18} />,
  admit_card: <Ticket size={18} />,
  admission_letter: <Mail size={18} />,
};

// ─── Component ───────────────────────────────────────────────────────────────

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ isOpen, onClose, onLoadTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDefinition | null>(null);
  const [selectedPreviewPage, setSelectedPreviewPage] = useState(0);

  // ─── Filtered Templates ─────────────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    let results = PREBUILT_TEMPLATES;

    if (searchQuery.trim()) {
      results = searchTemplates(searchQuery);
    }

    if (selectedCategory !== 'all') {
      results = results.filter((t) => t.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory]);

  // ─── Load Template into Canvas ──────────────────────────────────────────

  const handleLoadTemplate = useCallback(
    (template: TemplateDefinition) => {
      const pages: Page[] = template.pages.map((p, index) => ({
        id: `page_${Date.now()}_${index}`,
        name: template.pages.length > 1 ? `${template.name} - Page ${index + 1}` : template.name,
        width: p.width,
        height: p.height,
        canvasJSON: p.canvasJSON,
      }));
      onLoadTemplate(pages);
      onClose();
    },
    [onLoadTemplate, onClose]
  );

  // ─── Preview Modal ──────────────────────────────────────────────────────

  const renderPreviewModal = () => {
    if (!previewTemplate) return null;
    const page = previewTemplate.pages[selectedPreviewPage];

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
        <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl w-[750px] max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <div>
              <h3 className="text-lg font-semibold text-white">{previewTemplate.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{previewTemplate.description}</p>
            </div>
            <button
              onClick={() => setPreviewTemplate(null)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Preview Canvas */}
          <div className="flex-1 overflow-auto p-5 flex items-center justify-center bg-slate-900/50">
            <div
              className="bg-white rounded shadow-lg overflow-hidden"
              style={{
                width: Math.min(page.width * 0.8, 550),
                height: Math.min(page.height * 0.8, 550),
                transform: `scale(${Math.min(550 / page.width, 550 / page.height, 0.8)})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Render preview - just show object descriptions for now */}
              <div className="w-full h-full relative p-2 overflow-hidden" style={{ fontSize: '6px' }}>
                {(page.canvasJSON as any).objects?.slice(0, 20).map((obj: any, i: number) => (
                  <div
                    key={i}
                    className="absolute border border-slate-200 rounded-sm flex items-center justify-center text-slate-500 overflow-hidden"
                    style={{
                      left: `${(obj.left / page.width) * 100}%`,
                      top: `${(obj.top / page.height) * 100}%`,
                      width: `${((obj.width || obj.radius * 2 || 50) / page.width) * 100}%`,
                      height: `${((obj.height || obj.radius * 2 || 20) / page.height) * 100}%`,
                      backgroundColor: obj.fill && obj.fill !== 'transparent' ? obj.fill : undefined,
                      fontSize: obj.fontSize ? `${Math.max(obj.fontSize * 0.5, 4)}px` : '5px',
                      color: obj.fill && obj.type === 'textbox' ? obj.fill : '#666',
                      fontWeight: obj.fontWeight || 'normal',
                      textAlign: obj.textAlign || 'left',
                    }}
                  >
                    {obj.type === 'textbox' ? (
                      <span className="truncate px-0.5">{(obj.text || '').substring(0, 40)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page Navigation (for multi-page templates) */}
          {previewTemplate.pages.length > 1 && (
            <div className="flex items-center justify-center gap-2 py-2 border-t border-slate-700">
              {previewTemplate.pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPreviewPage(idx)}
                  className={`px-3 py-1 text-xs rounded ${
                    idx === selectedPreviewPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Page {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>
                {previewTemplate.pages.length} page{previewTemplate.pages.length > 1 ? 's' : ''}
              </span>
              <span>
                {page.width} × {page.height} pt
              </span>
              <span className="flex gap-1">
                {previewTemplate.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
                    {tag}
                  </span>
                ))}
              </span>
            </div>
            <button
              onClick={() => {
                handleLoadTemplate(previewTemplate);
                setPreviewTemplate(null);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={14} />
              Use This Template
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-[680px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layout size={22} className="text-blue-400" />
              Template Library
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {PREBUILT_TEMPLATES.length} pre-built templates ready to use
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b border-slate-700/50 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates... (e.g., TC, ID Card, Fee)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Filters + View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All
              </button>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === cat.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {cat.icon} {cat.label.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Template Grid/List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText size={48} className="mb-3 opacity-30" />
              <p className="text-sm">No templates found</p>
              <p className="text-xs mt-1">Try different search terms or category</p>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPreview={() => {
                    setPreviewTemplate(template);
                    setSelectedPreviewPage(0);
                  }}
                  onLoad={() => handleLoadTemplate(template)}
                />
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <TemplateListItem
                  key={template.id}
                  template={template}
                  onPreview={() => {
                    setPreviewTemplate(template);
                    setSelectedPreviewPage(0);
                  }}
                  onLoad={() => handleLoadTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-500 text-center">
            Click a template to preview • Double-click to load directly • Templates use {'{{placeholders}}'} for data
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </>
  );
};

// ─── Template Card (Grid View) ──────────────────────────────────────────────

interface TemplateCardProps {
  template: TemplateDefinition;
  onPreview: () => void;
  onLoad: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onPreview, onLoad }) => {
  const page = template.pages[0];
  const isCard = page.width < 300; // ID cards are small
  const category = TEMPLATE_CATEGORIES.find((c) => c.key === template.category);

  return (
    <div
      className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer"
      onClick={onPreview}
      onDoubleClick={onLoad}
    >
      {/* Preview Area */}
      <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden">
        {/* Stylized preview */}
        <div
          className="bg-white rounded shadow-md flex items-center justify-center"
          style={{
            width: isCard ? 80 : 70,
            height: isCard ? 50 : 90,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {categoryIconMap[template.category] || <FileText size={20} />}
            <div className="w-10 h-0.5 bg-slate-200 rounded" />
            <div className="w-8 h-0.5 bg-slate-200 rounded" />
            <div className="w-12 h-0.5 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Multi-page indicator */}
        {template.pages.length > 1 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
            {template.pages.length} pages
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            title="Preview"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLoad();
            }}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            title="Use Template"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{template.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">
            {category?.icon} {category?.label}
          </span>
          <span className="text-[10px] text-slate-500">
            {page.width}×{page.height}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Template List Item (List View) ─────────────────────────────────────────

interface TemplateListItemProps {
  template: TemplateDefinition;
  onPreview: () => void;
  onLoad: () => void;
}

const TemplateListItem: React.FC<TemplateListItemProps> = ({ template, onPreview, onLoad }) => {
  const page = template.pages[0];
  const category = TEMPLATE_CATEGORIES.find((c) => c.key === template.category);

  return (
    <div
      className="group flex items-center gap-4 p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500/50 transition-all cursor-pointer"
      onClick={onPreview}
      onDoubleClick={onLoad}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300">
        {categoryIconMap[template.category] || <FileText size={18} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white truncate">{template.name}</h3>
        <p className="text-xs text-slate-400 truncate">{template.description}</p>
      </div>

      {/* Meta */}
      <div className="flex-shrink-0 flex items-center gap-3 text-xs text-slate-500">
        <span>{template.pages.length}p</span>
        <span>
          {page.width}×{page.height}
        </span>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
          title="Preview"
        >
          <Eye size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoad();
          }}
          className="p-1.5 hover:bg-blue-600 rounded text-slate-400 hover:text-white"
          title="Use Template"
        >
          <Download size={14} />
        </button>
      </div>

      <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
    </div>
  );
};

export default TemplateLibrary;

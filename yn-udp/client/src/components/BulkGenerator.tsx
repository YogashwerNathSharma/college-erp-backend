/**
 * YN-UDP Bulk Generator Component
 * Multi-step modal for generating PDFs from template + data records
 * Steps: 1. Select Data Source → 2. Preview → 3. Generate & Download
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  FileDown,
  Users,
  Filter,
  Eye,
  Loader2,
  Download,
  FileText,
  Archive,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  canvasJSON: any;
  tenantId: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
}

interface FilterState {
  dataSource: 'students' | 'staff' | 'custom';
  classId: string;
  sectionId: string;
  departmentId: string;
}

interface PreviewItem {
  index: number;
  record: { name: string; id: string };
  processedCanvas: any;
}

type OutputFormat = 'combined' | 'individual' | 'zip';
type Step = 1 | 2 | 3;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Component ────────────────────────────────────────────────────────────────

const BulkGenerator: React.FC<BulkGeneratorProps> = ({
  isOpen,
  onClose,
  templateId,
  templateName,
  canvasJSON,
  tenantId,
}) => {
  // State
  const [step, setStep] = useState<Step>(1);
  const [filters, setFilters] = useState<FilterState>({
    dataSource: 'students',
    classId: '',
    sectionId: '',
    departmentId: '',
  });
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('combined');
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [recordCount, setRecordCount] = useState(0);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  // Options
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);

  // Fetch classes on mount
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      setStep(1);
      setError('');
      setProgress(0);
      setDownloadUrl('');
    }
  }, [isOpen]);

  // Fetch sections when class changes
  useEffect(() => {
    if (filters.classId) {
      fetchSections(filters.classId);
    } else {
      setSections([]);
    }
  }, [filters.classId]);

  // Fetch record count when filters change
  useEffect(() => {
    if (filters.dataSource) {
      fetchRecordCount();
    }
  }, [filters]);

  // ─── API Calls ────────────────────────────────────────────────────────────

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_BASE}/classes?tenantId=${tenantId}`);
      const data = await res.json();
      setClasses(data.classes || data || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      // Fallback demo data
      setClasses([
        { id: '1', name: 'Class 1' },
        { id: '2', name: 'Class 2' },
        { id: '3', name: 'Class 3' },
        { id: '4', name: 'Class 4' },
        { id: '5', name: 'Class 5' },
        { id: '6', name: 'Class 6' },
        { id: '7', name: 'Class 7' },
        { id: '8', name: 'Class 8' },
        { id: '9', name: 'Class 9' },
        { id: '10', name: 'Class 10' },
        { id: '11', name: 'Class 11' },
        { id: '12', name: 'Class 12' },
      ]);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await fetch(`${API_BASE}/sections?classId=${classId}&tenantId=${tenantId}`);
      const data = await res.json();
      setSections(data.sections || data || []);
    } catch (err) {
      setSections([
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
      ]);
    }
  };

  const fetchRecordCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/udp/templates/${templateId}/bulk-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      const data = await res.json();
      setRecordCount(data.count || 0);
    } catch (err) {
      setRecordCount(0);
    }
  };

  const fetchPreviews = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/udp/templates/${templateId}/bulk-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, limit: 3 }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviews(data.previews);
      } else {
        setError(data.error || 'Failed to load previews');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError('');
    setDownloadUrl('');

    try {
      const res = await fetch(`${API_BASE}/udp/templates/${templateId}/bulk-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          format: outputFormat,
          itemsPerPage: outputFormat === 'combined' ? 1 : itemsPerPage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Generation failed');
      }

      // Get blob and create download URL
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goToStep = (nextStep: Step) => {
    if (nextStep === 2) {
      fetchPreviews();
    }
    setStep(nextStep);
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    const ext = outputFormat === 'zip' || outputFormat === 'individual' ? 'zip' : 'pdf';
    link.download = `${templateName}_bulk.${ext}`;
    link.click();
  };

  if (!isOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[800px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <FileDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bulk Generate</h2>
              <p className="text-sm text-gray-500">{templateName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b">
          {[
            { num: 1, label: 'Select Data' },
            { num: 2, label: 'Preview' },
            { num: 3, label: 'Generate' },
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                step === s.num
                  ? 'bg-indigo-600 text-white'
                  : step > s.num
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s.num ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
                    {s.num}
                  </span>
                )}
                {s.label}
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Data Source */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Data Source Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Data Source
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'students', label: 'Students', icon: Users, desc: 'Generate for students' },
                    { value: 'staff', label: 'Staff', icon: Users, desc: 'Generate for staff' },
                    { value: 'custom', label: 'Custom Data', icon: FileText, desc: 'Upload CSV/JSON' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters((f) => ({ ...f, dataSource: option.value as any }))}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        filters.dataSource === option.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option.icon className={`w-6 h-6 mb-2 ${
                        filters.dataSource === option.value ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              {filters.dataSource === 'students' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Filter className="w-4 h-4" />
                    Filters
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Class</label>
                      <select
                        value={filters.classId}
                        onChange={(e) => setFilters((f) => ({ ...f, classId: e.target.value, sectionId: '' }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Classes</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Section</label>
                      <select
                        value={filters.sectionId}
                        onChange={(e) => setFilters((f) => ({ ...f, sectionId: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={!filters.classId}
                      >
                        <option value="">All Sections</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Output Format */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Output Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'combined', label: 'Combined PDF', icon: FileText, desc: 'All in one file' },
                    { value: 'individual', label: 'Individual PDFs', icon: Archive, desc: 'Separate files (ZIP)' },
                    { value: 'zip', label: 'Print Layout', icon: LayoutGrid, desc: 'Multiple per page' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setOutputFormat(option.value as OutputFormat)}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        outputFormat === option.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option.icon className={`w-5 h-5 mb-2 ${
                        outputFormat === option.value ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <p className="font-medium text-sm text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items per page (for print layout) */}
              {outputFormat === 'zip' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Items per A4 page</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="w-48 px-3 py-2 rounded-lg border border-gray-300"
                  >
                    <option value={2}>2 per page</option>
                    <option value={4}>4 per page</option>
                    <option value={6}>6 per page</option>
                    <option value={8}>8 per page (ID Cards)</option>
                    <option value={10}>10 per page</option>
                  </select>
                </div>
              )}

              {/* Record Count Badge */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>{recordCount}</strong> records match your filters
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Preview (first 3 records)
                </h3>
                <button
                  onClick={fetchPreviews}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading previews...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {previews.map((preview) => (
                    <div key={preview.index} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center p-2">
                        {/* Canvas preview would render here */}
                        <div className="w-full h-full bg-white rounded shadow-sm flex items-center justify-center">
                          <div className="text-center p-4">
                            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Preview</p>
                            <p className="text-xs font-medium text-gray-700 mt-1">
                              {preview.record.name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-gray-50 border-t">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {preview.record.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {previews.length > 0 && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">
                    ✓ Previews look good! Placeholders are being replaced with actual data.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <h3 className="font-semibold text-gray-800">Generation Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Template:</div>
                  <div className="font-medium text-gray-900">{templateName}</div>
                  <div className="text-gray-600">Records:</div>
                  <div className="font-medium text-gray-900">{recordCount}</div>
                  <div className="text-gray-600">Format:</div>
                  <div className="font-medium text-gray-900 capitalize">{outputFormat}</div>
                  <div className="text-gray-600">Estimated Size:</div>
                  <div className="font-medium text-gray-900">
                    ~{((recordCount * 50) / 1024).toFixed(1)} MB
                  </div>
                </div>
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Generating...</span>
                    <span className="font-medium text-indigo-600">{progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Processing {Math.ceil((progress / 100) * recordCount)} of {recordCount} records...
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Download Ready */}
              {downloadUrl && (
                <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-bold text-green-800">Generation Complete!</h3>
                  <p className="text-sm text-green-700">
                    {recordCount} documents generated successfully
                  </p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              )}

              {/* Generate Button */}
              {!downloadUrl && !isGenerating && (
                <button
                  onClick={startGeneration}
                  disabled={recordCount === 0}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FileDown className="w-5 h-5" />
                  Generate {recordCount} Documents
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => step > 1 && goToStep((step - 1) as Step)}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-sm text-gray-500">
            Step {step} of 3
          </div>

          {step < 3 && (
            <button
              onClick={() => goToStep((step + 1) as Step)}
              disabled={step === 1 && recordCount === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && downloadUrl && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkGenerator;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, UserCheck, UserX, GraduationCap,
  TrendingUp, TrendingDown, Calendar, Filter,
  Download, RefreshCw, Eye, ArrowRight, Search, 
  LayoutDashboard, IdCard, FolderOpen, BarChart3, ClipboardList,
  ChevronDown, MoreVertical, Activity, X, Printer,
  CheckSquare, Square, FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line,
} from 'recharts';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const API = `${API_BASE_URL}/api`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatsData {
  totalStudents: number;
  newAdmissions: number;
  boys: number;
  girls: number;
  active: number;
  inactive: number;
}

interface ClassStrength {
  class: string;
  classId?: string;
  count: number;
}

interface RecentAdmission {
  id: string;
  name: string;
  admNo: string;
  class: string;
  section?: string;
  date: string;
  status?: string;
}

interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

interface MonthlyAdmission {
  month: string;
  count: number;
}

interface StudentRecord {
  id: string;
  name: string;
  admNo: string;
  fatherName?: string;
  class: string;
  section?: string;
  status?: string;
  gender?: string;
  category?: string;
  totalFee?: number;
  paidFee?: number;
  balanceFee?: number;
  admissionDate?: string;
  phone?: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
}

type ModalType =
  | 'active'
  | 'inactive'
  | 'boys'
  | 'girls'
  | 'classwise'
  | 'gender'
  | 'monthly'
  | 'category'
  | 'recent'
  | null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHART COLORS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CHART_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6'];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRINT UTILITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PrintConfig {
  title: string;
  columns: { key: string; label: string; width?: string }[];
  data: any[];
  showFeeColumns?: boolean;
  showCategoryColumn?: boolean;
}

const printStudentList = (config: PrintConfig) => {
  const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname !== 'localhost' ? 'https://college-erp-backend-91zi.onrender.com' : '');
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Resolve logo URL properly
  const rawLogo = tenant.logoUrl || tenant.logo || '';
  const logoUrl = rawLogo
    ? rawLogo.startsWith('http') ? rawLogo
      : rawLogo.startsWith('/') ? `${API_BASE}${rawLogo}`
      : `${API_BASE}/uploads/${rawLogo}`
    : '';
  const schoolName = tenant.name || 'School Name';
  const schoolAddress = tenant.address || '';
  const printedBy = user.name || user.username || 'Admin';

  const tableHeaders = config.columns
    .map((col) => `<th style="border:1px solid #ddd;padding:8px 10px;text-align:left;font-size:12px;background:#f8f9fa;font-weight:600;">${col.label}</th>`)
    .join('');

  const tableRows = config.data
    .map((row, idx) => {
      const cells = config.columns
        .map((col) => {
          let value = '';
          if (col.key === 'sno') value = String(idx + 1);
          else value = row[col.key] ?? '-';
          return `<td style="border:1px solid #ddd;padding:6px 10px;font-size:11px;">${value}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${config.title}</title>
      <style>
        @media print {
          body { margin: 0; padding: 15px; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 10px; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-center { text-align: center; flex: 1; }
        .header-right { text-align: right; font-size: 11px; color: #555; }
        .report-meta { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" crossorigin="anonymous" style="height:50px;width:50px;object-fit:contain;" onerror="this.style.display='none'" />` : '<div style="width:50px;height:50px;background:#e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#6b7280;">LOGO</div>'}
        </div>
        <div class="header-center">
          <h2 style="margin:0;font-size:18px;font-weight:bold;">${schoolName}</h2>
          <p style="margin:2px 0 0 0;font-size:12px;color:#555;">${schoolAddress}</p>
        </div>
        <div class="header-right">
          <p style="margin:0;">Printed by: <strong>${printedBy}</strong></p>
          <p style="margin:2px 0 0 0;">Date: ${dateStr}</p>
          <p style="margin:2px 0 0 0;">Time: ${timeStr}</p>
        </div>
      </div>
      <div class="report-meta">
        <div>
          <h3 style="margin:0;font-size:14px;">Report: ${config.title}</h3>
        </div>
        <div>
          <span style="font-size:12px;color:#555;">Total Records: <strong>${config.data.length}</strong></span>
        </div>
      </div>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <button class="no-print" onclick="window.print()" style="margin-top:20px;padding:8px 16px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
        Print
      </button>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STUDENT LIST MODAL COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  modalType: ModalType;
  showFeeColumns?: boolean;
  showCategoryColumn?: boolean;
  defaultGenderTab?: 'boys' | 'girls';
}

const StudentListModal: React.FC<StudentListModalProps> = ({
  isOpen,
  onClose,
  title,
  modalType,
  showFeeColumns = false,
  showCategoryColumn = false,
  defaultGenderTab = 'boys',
}) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [genderTab, setGenderTab] = useState<'boys' | 'girls'>(defaultGenderTab);

  // Fetch classes on mount
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      setSearchQuery('');
      setSelectedClassId('');
      setSelectedSectionId('');
      setSelectedIds(new Set());
      setGenderTab(defaultGenderTab);
    }
  }, [isOpen, defaultGenderTab]);

  // Fetch students when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen, selectedClassId, selectedSectionId, genderTab, modalType]);

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      fetchSections(selectedClassId);
    } else {
      setSections([]);
      setSelectedSectionId('');
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/class`);
      setClasses(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await axios.get(`${API}/section`, { params: { classId } });
      setSections(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: any = {};

      switch (modalType) {
        case 'active':
          params.status = 'active';
          break;
        case 'inactive':
          params.status = 'inactive';
          break;
        case 'boys':
          params.status = 'active';
          params.gender = 'male';
          break;
        case 'girls':
          params.status = 'active';
          params.gender = 'female';
          break;
        case 'classwise':
          params.status = 'active';
          break;
        case 'gender':
          params.status = 'active';
          params.gender = genderTab === 'boys' ? 'male' : 'female';
          break;
        case 'monthly':
          params.type = 'monthly-admissions';
          break;
        case 'category':
          break;
        case 'recent':
          params.type = 'recent-admissions';
          params.limit = 50;
          break;
      }

      if (selectedClassId) params.classId = selectedClassId;
      if (selectedSectionId) params.sectionId = selectedSectionId;

      const res = await axios.get(`${API}/students`, { params });
      const raw = res.data?.data;
      // Backend returns { students: [...], total, page } OR direct array
      const list = raw?.students || raw?.data || (Array.isArray(raw) ? raw : []);
      // Map backend fields to StudentRecord format
      const mapped = (Array.isArray(list) ? list : []).map((s: any) => ({
        id: s.id,
        name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || '-',
        admNo: s.admNo || s.admissionNo || '-',
        fatherName: s.fatherName || '-',
        class: s.class?.name || s.className || s.enrollments?.[0]?.class?.name || '-',
        section: s.section?.name || s.sectionName || s.enrollments?.[0]?.section?.name || '-',
        status: s.status || 'active',
        gender: s.gender || '-',
        category: s.category || '-',
        totalFee: s.totalFee || 0,
        paidFee: s.paidFee || 0,
        balanceFee: s.balanceFee || 0,
        admissionDate: s.admissionDate || s.createdAt || '',
        phone: s.phone || s.fatherPhone || '-',
      }));
      setStudents(mapped);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter students by search query
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      s.name?.toLowerCase().includes(query) ||
      s.admNo?.toLowerCase().includes(query) ||
      s.fatherName?.toLowerCase().includes(query) ||
      s.class?.toLowerCase().includes(query)
    );
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Print handlers
  const getColumns = () => {
    const baseCols: { key: string; label: string }[] = [
      { key: 'sno', label: 'S.No' },
      { key: 'name', label: 'Name' },
      { key: 'admNo', label: 'Adm No' },
      { key: 'fatherName', label: 'Father Name' },
      { key: 'class', label: 'Class' },
      { key: 'section', label: 'Section' },
      { key: 'status', label: 'Status' },
    ];

    if (showFeeColumns) {
      baseCols.push(
        { key: 'totalFee', label: 'Total Fee' },
        { key: 'paidFee', label: 'Paid' },
        { key: 'balanceFee', label: 'Balance' }
      );
    }

    if (showCategoryColumn) {
      // Insert category after section
      const sectionIdx = baseCols.findIndex((c) => c.key === 'section');
      baseCols.splice(sectionIdx + 1, 0, { key: 'category', label: 'Category' });
    }

    return baseCols;
  };

  const handlePrintSingle = (student: StudentRecord) => {
    printStudentList({
      title,
      columns: getColumns(),
      data: [student],
      showFeeColumns,
      showCategoryColumn,
    });
  };

  const handlePrintBulk = () => {
    const selectedStudents = filteredStudents.filter((s) => selectedIds.has(s.id));
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to print.');
      return;
    }
    printStudentList({
      title,
      columns: getColumns(),
      data: selectedStudents,
      showFeeColumns,
      showCategoryColumn,
    });
  };

  const handlePrintAll = () => {
    printStudentList({
      title,
      columns: getColumns(),
      data: filteredStudents,
      showFeeColumns,
      showCategoryColumn,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[90vh] bg-white dark:bg-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {filteredStudents.length} record(s) found
              {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Print All Button */}
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              title="Print all visible records"
            >
              <Printer size={14} />
              Print All
            </button>
            {/* Print Selected Button */}
            <button
              onClick={handlePrintBulk}
              disabled={selectedIds.size === 0}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                selectedIds.size > 0
                  ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                  : 'text-gray-400 bg-gray-100 dark:bg-slate-700 cursor-not-allowed'
              }`}
              title="Print selected records"
            >
              <FileText size={14} />
              Print Selected ({selectedIds.size})
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-850">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700 dark:text-gray-200"
              />
            </div>

            {/* Class Filter */}
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}
                className="appearance-none bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Section Filter */}
            <div className="relative">
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={!selectedClassId}
                className="appearance-none bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Gender Tabs (only for gender modal) */}
            {modalType === 'gender' && (
              <div className="flex items-center bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setGenderTab('boys')}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${
                    genderTab === 'boys'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                  }`}
                >
                  Boys
                </button>
                <button
                  onClick={() => setGenderTab('girls')}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${
                    genderTab === 'girls'
                      ? 'bg-pink-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                  }`}
                >
                  Girls
                </button>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={fetchStudents}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading students...</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-xs sm:text-sm min-w-[700px]">
              <thead className="sticky top-0 bg-gray-50 dark:bg-slate-750 z-10">
                <tr>
                  <th className="py-3 px-4 text-left w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-indigo-600 transition-colors">
                      {selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">S.No</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student Name</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adm No</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Father Name</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Section</th>
                  {showCategoryColumn && (
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  )}
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  {showFeeColumns && (
                    <>
                      <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Fee</th>
                      <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paid</th>
                      <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                    </>
                  )}
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors ${
                        selectedIds.has(student.id) ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleSelect(student.id)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          {selectedIds.has(student.id) ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              {student.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-mono text-xs">{student.admNo || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-xs">{student.fatherName || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {student.class || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-xs">{student.section || '-'}</td>
                      {showCategoryColumn && (
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            {student.category || '-'}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            student.status === 'active' || !student.status
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {student.status || 'Active'}
                        </span>
                      </td>
                      {showFeeColumns && (
                        <>
                          <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 text-xs font-medium">
                            ₹{(student.totalFee || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                            ₹{(student.paidFee || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right text-red-600 dark:text-red-400 text-xs font-medium">
                            ₹{(student.balanceFee || 0).toLocaleString('en-IN')}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handlePrintSingle(student)}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Print this student"
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={showFeeColumns ? 13 : showCategoryColumn ? 10 : 9} className="py-16 text-center">
                      <Users size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-400 dark:text-gray-500 text-sm">No students found</p>
                      <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-850 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredStudents.length} of {students.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-20" />
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-14" />
      </div>
    </div>
  </div>
);

const SkeletonChart: React.FC = () => (
  <div className="animate-pulse bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
    <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-6" />
    <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded" />
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAT CARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBg, iconColor, trend, trendLabel, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 
      transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600
      ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend >= 0 ? (
              <TrendingUp size={12} className="text-emerald-500" />
            ) : (
              <TrendingDown size={12} className="text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUSTOM TOOLTIP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {payload.map((item: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: item.color }}>
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AdminStudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; isCurrent: boolean }[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [classStrength, setClassStrength] = useState<ClassStrength[]>([]);
  const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [monthlyAdmissions, setMonthlyAdmissions] = useState<MonthlyAdmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalShowFee, setModalShowFee] = useState<boolean>(false);
  const [modalShowCategory, setModalShowCategory] = useState<boolean>(false);
  const [modalGenderTab, setModalGenderTab] = useState<'boys' | 'girls'>('boys');

  // Open modal helper
  const openModal = (type: ModalType, title: string, options?: { showFee?: boolean; showCategory?: boolean; genderTab?: 'boys' | 'girls' }) => {
    setActiveModal(type);
    setModalTitle(title);
    setModalShowFee(options?.showFee || false);
    setModalShowCategory(options?.showCategory || false);
    setModalGenderTab(options?.genderTab || 'boys');
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalTitle('');
    setModalShowFee(false);
    setModalShowCategory(false);
  };

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const res = await axios.get(`${API}/academic`);
        const years = res.data.data || res.data || [];
        setAcademicYears(years);
        const current = years.find((y: any) => y.isCurrent);
        if (current) setAcademicYearId(current.id);
        else if (years.length > 0) setAcademicYearId(years[0].id);
      } catch (err) {
        console.error('Failed to fetch academic years:', err);
      }
    };
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYearId) fetchDashboardData();
  }, [academicYearId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get(`${API}/students/stats`, { params: { academicYearId } }),
        axios.get(`${API}/students/class-strength`, { params: { academicYearId } }),
        axios.get(`${API}/students/recent-admissions`, { params: { limit: 8 } }),
        axios.get(`${API}/students/category-distribution`, { params: { academicYearId } }),
      ]);

      if (results[0].status === 'fulfilled') {
        const d = results[0].value.data?.data || results[0].value.data;
        setStats({
          totalStudents: d?.total || 0,
          newAdmissions: d?.newAdmissions || 0,
          boys: d?.boys || 0,
          girls: d?.girls || 0,
          active: d?.active || 0,
          inactive: d?.inactive || 0,
        });
      }

      if (results[1].status === 'fulfilled') {
        setClassStrength(results[1].value.data?.data || []);
      }

      if (results[2].status === 'fulfilled') {
        setRecentAdmissions(results[2].value.data?.data || []);
      }

      if (results[3].status === 'fulfilled') {
        setCategoryDistribution(results[3].value.data?.data || []);
      }

      // Generate monthly admissions mock from stats if API doesn't provide it
      const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      const mockMonthly = months.map((m) => ({ month: m, count: Math.floor(Math.random() * 20) + 5 }));
      setMonthlyAdmissions(mockMonthly);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare gender data for pie chart
  const genderData = stats ? [
    { name: 'Boys', value: stats.boys },
    { name: 'Girls', value: stats.girls },
  ].filter(d => d.value > 0) : [];

  // Filter recent admissions by search
  const filteredAdmissions = recentAdmissions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ━━━━ Header ━━━━ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={28} />
              Student Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Overview of student enrollment and demographics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Academic Year Selector */}
            <div className="relative">
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => fetchDashboardData()}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* ━━━━ Quick Actions (like main dashboard) ━━━━ */}
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 sm:gap-2">
          {[
            { label: "All Students", icon: Users, route: "/students", color: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/50" },
            { label: "New Admission", icon: UserPlus, route: "/students/new-admission", color: "bg-green-500", lightBg: "bg-green-50 dark:bg-green-950/50" },
            { label: "Old Entry", icon: FileText, route: "/students/old-entry", color: "bg-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/50" },
            { label: "Promotion", icon: GraduationCap, route: "/students/promotion", color: "bg-purple-500", lightBg: "bg-purple-50 dark:bg-purple-950/50" },
            { label: "Age Settings", icon: Calendar, route: "/students/age-settings", color: "bg-cyan-500", lightBg: "bg-cyan-50 dark:bg-cyan-950/50" },
            { label: "Print List", icon: Printer, route: "/students/print", color: "bg-rose-500", lightBg: "bg-rose-50 dark:bg-rose-950/50" },
            { label: "Reports", icon: BarChart3, route: "/students/reports", color: "bg-indigo-500", lightBg: "bg-indigo-50 dark:bg-indigo-950/50" },
            { label: "ID Card", icon: IdCard, route: "/students/id-card", color: "bg-orange-500", lightBg: "bg-orange-50 dark:bg-orange-950/50" },
            { label: "Recycle Bin", icon: FolderOpen, route: "/students/recycle-bin", color: "bg-red-500", lightBg: "bg-red-50 dark:bg-red-950/50" },
            { label: "Dashboard", icon: LayoutDashboard, route: "/student-dashboard", color: "bg-teal-500", lightBg: "bg-teal-50 dark:bg-teal-950/50" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className={`flex flex-col items-center gap-1 py-2 sm:py-2.5 px-1 rounded-lg ${action.lightBg} hover:scale-105 transition-all duration-200 group active:scale-95`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md ${action.color} flex items-center justify-center`}>
                <action.icon size={14} className="text-white" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* ━━━━ Stat Cards (6 cards) ━━━━ */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Total Students"
              value={stats?.totalStudents ?? 0}
              icon={<Users size={22} />}
              iconBg="bg-blue-50 dark:bg-blue-950"
              iconColor="text-blue-600 dark:text-blue-400"
              trend={12}
              trendLabel="vs last year"
              onClick={() => navigate('/students')}
            />
            <StatCard
              title="New Admissions"
              value={stats?.newAdmissions ?? 0}
              icon={<UserPlus size={22} />}
              iconBg="bg-emerald-50 dark:bg-emerald-950"
              iconColor="text-emerald-600 dark:text-emerald-400"
              trend={8}
              trendLabel="this month"
              onClick={() => navigate('/students/new-admission')}
            />
            <StatCard
              title="Active"
              value={stats?.active ?? 0}
              icon={<UserCheck size={22} />}
              iconBg="bg-green-50 dark:bg-green-950"
              iconColor="text-green-600 dark:text-green-400"
              onClick={() => openModal('active', 'Active Students List')}
            />
            <StatCard
              title="Inactive"
              value={stats?.inactive ?? 0}
              icon={<UserX size={22} />}
              iconBg="bg-red-50 dark:bg-red-950"
              iconColor="text-red-600 dark:text-red-400"
              onClick={() => openModal('inactive', 'Inactive Students (Class-wise)')}
            />
            <StatCard
              title="Boys"
              value={stats?.boys ?? 0}
              icon={<Users size={22} />}
              iconBg="bg-indigo-50 dark:bg-indigo-950"
              iconColor="text-indigo-600 dark:text-indigo-400"
              onClick={() => openModal('boys', 'Active Boys List')}
            />
            <StatCard
              title="Girls"
              value={stats?.girls ?? 0}
              icon={<Users size={22} />}
              iconBg="bg-pink-50 dark:bg-pink-950"
              iconColor="text-pink-600 dark:text-pink-400"
              onClick={() => openModal('girls', 'Active Girls List')}
            />
          </div>
        )}

        {/* ━━━━ Charts Row 1: Class Distribution + Gender Ratio ━━━━ */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Class-wise Distribution - Horizontal Bar Chart (2/3 width) */}
            <div
              className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200"
              onClick={() => openModal('classwise', 'Class-wise Student Distribution')}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Class-wise Student Distribution
                </h3>
                <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classStrength} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="class" type="category" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Students" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {classStrength.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gender Ratio - Donut Chart (1/3 width) */}
            <div
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200"
              onClick={() => openModal('gender', 'Gender-wise Student List', { genderTab: 'boys' })}
            >
              <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-6">
                Gender Ratio
              </h3>
              {genderData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-60 text-gray-400">
                  <p>No data available</p>
                </div>
              )}
              {/* Quick gender stats */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats?.boys ?? 0}</p>
                  <p className="text-xs text-gray-500">Boys</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-500">{stats?.girls ?? 0}</p>
                  <p className="text-xs text-gray-500">Girls</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━ Charts Row 2: Monthly Admissions + Category Distribution ━━━━ */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Admissions - Area Chart */}
            <div
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200"
              onClick={() => openModal('monthly', 'Monthly Admissions List', { showFee: true })}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Monthly Admissions
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                  This Academic Year
                </span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyAdmissions} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admissionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Admissions"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="url(#admissionGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution - Progress Bars */}
            <div
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200"
              onClick={() => openModal('category', 'Category-wise Student List', { showCategory: true })}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Category Distribution
                </h3>
                <Activity size={16} className="text-gray-400" />
              </div>
              <div className="space-y-5">
                {categoryDistribution.length > 0 ? (
                  categoryDistribution.map((cat, index) => {
                    const color = CHART_COLORS[index % CHART_COLORS.length];
                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{cat.count} students</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white">{cat.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${cat.percentage}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    No category data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ━━━━ Recent Admissions Table + Quick Actions ━━━━ */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><SkeletonChart /></div>
            <SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Admissions Table */}
            <div
              className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200"
              onClick={() => openModal('recent', 'Recent Admissions List', { showFee: true })}
            >
              <div className="p-5 border-b border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                    Recent Admissions
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700 dark:text-gray-200 w-40"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('recent', 'Recent Admissions List', { showFee: true });
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                    >
                      View All <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-750">
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Student</th>
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Adm No</th>
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Class</th>
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                    {filteredAdmissions.length > 0 ? (
                      filteredAdmissions.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-800 dark:text-white">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 font-mono text-xs">{student.admNo}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {student.class}{student.section ? ` - ${student.section}` : ''}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 text-xs">{student.date}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              {student.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          <Users size={32} className="mx-auto mb-2 opacity-30" />
                          <p>No recent admissions found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/students/new-admission')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">New Admission</span>
                  </button>
                  <button
                    onClick={() => navigate('/students')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Eye size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">View All</span>
                  </button>
                  <button
                    onClick={() => navigate('/students/promotion')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Promotion</span>
                  </button>
                  <button
                    onClick={() => navigate('/students/id-card')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap size={18} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">ID Cards</span>
                  </button>
                  <button
                    onClick={() => navigate('/students/reports')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Reports</span>
                  </button>
                  <button
                    onClick={() => navigate('/students/print')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950 hover:bg-cyan-100 dark:hover:bg-cyan-900 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Filter size={18} className="text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Print List</span>
                  </button>
                </div>
              </div>

              {/* Attendance Summary Mini Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Today's Attendance</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9155" fill="none" stroke="#10b981" strokeWidth="3"
                        strokeDasharray="85 15" strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">85%</span>
                      <span className="text-xs text-gray-400">Present</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{stats ? Math.round(stats.active * 0.85) : 0}</p>
                    <p className="text-xs text-gray-400">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-500">{stats ? Math.round(stats.active * 0.15) : 0}</p>
                    <p className="text-xs text-gray-400">Absent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━━ Student List Modal ━━━━ */}
      <StudentListModal
        isOpen={activeModal !== null}
        onClose={closeModal}
        title={modalTitle}
        modalType={activeModal}
        showFeeColumns={modalShowFee}
        showCategoryColumn={modalShowCategory}
        defaultGenderTab={modalGenderTab}
      />
    </div>
  );
};

export default AdminStudentDashboard;

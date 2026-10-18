import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import {
  FolderOpen,
  File,
  Upload,
  Search,
  Grid3X3,
  List,
  Plus,
  Trash2,
  Download,
  Eye,
  Move,
  MoreVertical,
  Image,
  FileText,
  FileSpreadsheet,
  Film,
  Music,
  Archive,
  HardDrive,
  FolderPlus,
  ChevronRight,
  Home,
  X,
  Check,
  RefreshCw,
  SortAsc,
  Filter,
} from "lucide-react";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface FileItem {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  extension: string;
  category: string;
  folderId?: string;
  description?: string;
  tags: string[];
  uploadedByName?: string;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  color?: string;
  fileCount: number;
  subFolderCount: number;
  createdAt: string;
}

interface FileStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  totalSizeFormatted: string;
  categoryBreakdown: { category: string; count: number; size: number; sizeFormatted: string }[];
  recentFiles: FileItem[];
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(mimeType: string, extension: string) {
  if (mimeType.startsWith("image/")) return { icon: Image, color: "text-pink-500 bg-pink-50 dark:bg-pink-950" };
  if (mimeType.startsWith("video/")) return { icon: Film, color: "text-purple-500 bg-purple-50 dark:bg-purple-950" };
  if (mimeType.startsWith("audio/")) return { icon: Music, color: "text-orange-500 bg-orange-50 dark:bg-orange-950" };
  if (mimeType.includes("pdf")) return { icon: FileText, color: "text-red-500 bg-red-50 dark:bg-red-950" };
  if (mimeType.includes("spreadsheet") || ["xlsx", "xls", "csv"].includes(extension))
    return { icon: FileSpreadsheet, color: "text-green-500 bg-green-50 dark:bg-green-950" };
  if (mimeType.includes("document") || ["doc", "docx", "txt"].includes(extension))
    return { icon: FileText, color: "text-blue-500 bg-blue-50 dark:bg-blue-950" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension))
    return { icon: Archive, color: "text-amber-500 bg-amber-50 dark:bg-amber-950" };
  return { icon: File, color: "text-gray-500 bg-gray-50 dark:bg-gray-950" };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "All Files" },
  ]);

  // View
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("GENERAL");

  // ─────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, [currentFolderId, search, filterCategory]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (currentFolderId) params.folderId = currentFolderId;
      else params.folderId = "root";
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;

      const res = await axios.get(getFullUrl("/api/files"), { params });
      setFiles(res.data.data);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const params: any = {};
      if (currentFolderId) params.parentId = currentFolderId;

      const res = await axios.get(getFullUrl("/api/files/folders"), { params });
      setFolders(res.data.data);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(getFullUrl("/api/files/stats"));
      setStats(res.data.data);
    } catch (error) {
      console.error("Failed to fetch file stats:", error);
    }
  };

  // ─────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => formData.append("files", file));
      formData.append("category", uploadCategory);
      if (currentFolderId) formData.append("folderId", currentFolderId);

      await axios.post(getFullUrl("/api/files/upload"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchFiles();
      fetchStats();
      setShowUploadModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await axios.post(getFullUrl("/api/files/folder"), {
        name: newFolderName,
        parentId: currentFolderId,
      });
      setNewFolderName("");
      setShowFolderModal(false);
      fetchFolders();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create folder");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await axios.delete(getFullUrl(`/api/files/${fileId}`));
      fetchFiles();
      fetchStats();
      if (selectedFile?.id === fileId) setSelectedFile(null);
    } catch (error) {
      alert("Failed to delete file");
    }
  };

  const handleNavigateFolder = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    setSelectedFile(null);
  };

  const handleBreadcrumbClick = (index: number) => {
    const crumb = breadcrumbs[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setSelectedFile(null);
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all your documents, photos, and files
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Upload size={16} />
            Upload Files
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <File size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Files</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalFiles}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                <FolderOpen size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Folders</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalFolders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
                <HardDrive size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Storage Used</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalSizeFormatted}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                <Image size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Categories</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.categoryBreakdown.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-x-auto">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1 flex-shrink-0">
                {idx > 0 && <ChevronRight size={14} className="text-gray-400" />}
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
                    idx === breadcrumbs.length - 1
                      ? "font-medium text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {idx === 0 ? <Home size={14} /> : crumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Search + Filters + View Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">All</option>
              <option value="STUDENT_PHOTO">Student Photos</option>
              <option value="DOCUMENT">Documents</option>
              <option value="CERTIFICATE">Certificates</option>
              <option value="HOMEWORK">Homework</option>
              <option value="STAFF">Staff</option>
              <option value="GENERAL">General</option>
            </select>
            <div className="flex border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 ${viewMode === "list" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* File Grid / List */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Folders</h3>
                  <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" : "space-y-2"}>
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => handleNavigateFolder(folder)}
                        className={`cursor-pointer rounded-xl border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm transition-all ${
                          viewMode === "grid" ? "p-4 text-center" : "p-3 flex items-center gap-3"
                        }`}
                      >
                        <div className={`${viewMode === "grid" ? "mx-auto mb-2" : ""} w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center`}>
                          <FolderOpen size={20} className="text-amber-500" />
                        </div>
                        <div className={viewMode === "grid" ? "" : "flex-1"}>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{folder.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {folder.fileCount} files · {folder.subFolderCount} folders
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Files</h3>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {files.map((file) => {
                        const { icon: FileIcon, color } = getFileIcon(file.mimeType, file.extension);
                        const isImage = file.mimeType.startsWith("image/");
                        return (
                          <div
                            key={file.id}
                            onClick={() => setSelectedFile(file)}
                            className={`cursor-pointer rounded-xl border transition-all p-3 ${
                              selectedFile?.id === file.id
                                ? "border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-900"
                                : "border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700"
                            }`}
                          >
                            {/* Thumbnail / Icon */}
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-700 flex items-center justify-center mb-2">
                              {isImage ? (
                                <img
                                  src={getFullUrl(file.url)}
                                  alt={file.originalName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              ) : (
                                <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                                  <FileIcon size={24} />
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{file.originalName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {files.map((file) => {
                        const { icon: FileIcon, color } = getFileIcon(file.mimeType, file.extension);
                        return (
                          <div
                            key={file.id}
                            onClick={() => setSelectedFile(file)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              selectedFile?.id === file.id
                                ? "bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-700"
                                : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                              <FileIcon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.originalName}</p>
                              <p className="text-xs text-gray-400">{file.uploadedByName || "Unknown"} · {formatDate(file.createdAt)}</p>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {folders.length === 0 && files.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <FolderOpen size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">This folder is empty</p>
                  <p className="text-xs mt-1">Upload files or create a folder to get started</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* File Detail Panel (desktop) */}
        {selectedFile && (
          <div className="hidden lg:block w-72 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">File Details</h3>
              <button onClick={() => setSelectedFile(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={14} className="text-gray-500" />
              </button>
            </div>

            {/* Preview */}
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-700 flex items-center justify-center mb-4">
              {selectedFile.mimeType.startsWith("image/") ? (
                <img src={getFullUrl(selectedFile.url)} alt={selectedFile.originalName} className="w-full h-full object-cover" />
              ) : (
                (() => {
                  const { icon: FI, color } = getFileIcon(selectedFile.mimeType, selectedFile.extension);
                  return (
                    <div className={`w-16 h-16 rounded-xl ${color} flex items-center justify-center`}>
                      <FI size={32} />
                    </div>
                  );
                })()
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium">Name</p>
                <p className="text-sm text-gray-900 dark:text-white break-all">{selectedFile.originalName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Size</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{formatFileSize(selectedFile.size)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Type</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.mimeType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Category</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Uploaded By</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.uploadedByName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Date</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(selectedFile.createdAt)}</p>
              </div>
              {selectedFile.tags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedFile.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <a
                href={getFullUrl(selectedFile.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <Eye size={14} /> View
              </a>
              <a
                href={getFullUrl(selectedFile.url)}
                download={selectedFile.originalName}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <Download size={14} /> Download
              </a>
              <button
                onClick={() => handleDeleteFile(selectedFile.id)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-red-600"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upload Files</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="GENERAL">General</option>
                  <option value="STUDENT_PHOTO">Student Photo</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="HOMEWORK">Homework</option>
                  <option value="STAFF">Staff</option>
                  <option value="ATTACHMENT">Attachment</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Max 50MB per file · Images, PDFs, Documents, Archives
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  style={{ position: "relative" }}
                />
                <label className="mt-3 inline-block">
                  <input type="file" multiple onChange={handleUpload} className="hidden" />
                  <span className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                    {uploading ? "Uploading..." : "Choose Files"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Folder</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white mb-4"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowFolderModal(false); setNewFolderName(""); }}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

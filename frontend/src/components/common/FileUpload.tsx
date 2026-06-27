import { useState, useRef } from "react";
import { HiUpload, HiX } from "react-icons/hi";

//////////////////////////////////////////////////////
// 📁 FILE UPLOAD COMPONENT
//////////////////////////////////////////////////////

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  label?: string;
}

export default function FileUpload({
  onFileSelect,
  accept = "*",
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  label = "Upload File",
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const oversized = selected.filter((f) => f.size > maxSize);

    if (oversized.length) {
      setError(`File(s) exceed max size of ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
      return;
    }

    setError("");
    setFiles(selected);
    onFileSelect(selected);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFileSelect(updated);
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition"
      >
        <HiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-400 mt-1">Click or drag files here</p>
      </div>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />

      {error && <p className="text-xs text-red-600">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700 truncate">{file.name}</span>
              <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500">
                <HiX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

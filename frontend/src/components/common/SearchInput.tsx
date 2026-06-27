import { useState, useEffect } from "react";
import { HiSearch, HiX } from "react-icons/hi";

//////////////////////////////////////////////////////
// 🔍 SEARCH INPUT COMPONENT
//////////////////////////////////////////////////////

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
}

export default function SearchInput({
  value: externalValue,
  onChange,
  placeholder = "Search...",
  debounce = 300,
  className = "",
}: SearchInputProps) {
  const [value, setValue] = useState(externalValue || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(value);
    }, debounce);
    return () => clearTimeout(timer);
  }, [value, debounce]);

  useEffect(() => {
    if (externalValue !== undefined) setValue(externalValue);
  }, [externalValue]);

  return (
    <div className={`relative ${className}`}>
      <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
      />
      {value && (
        <button onClick={() => setValue("")} className="absolute right-3 top-1/2 -translate-y-1/2">
          <HiX className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText =
    selected.length === 0
      ? `All ${label}`
      : selected.length === options.length
        ? `All ${label}`
        : `${selected.length} Selected`;

  return (
    <div ref={containerRef} className={`relative min-w-[200px] ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#18181B] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-zinc-300 hover:border-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/50"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-zinc-500">{label}:</span>
          <span className="truncate">{displayText}</span>
        </div>
        <div className="flex items-center gap-1">
          {selected.length > 0 && selected.length < options.length && (
            <div
              role="button"
              onClick={clearSelection}
              className="p-0.5 hover:bg-white/10 rounded-full transition-colors mr-1"
            >
              <X size={14} className="text-zinc-500 hover:text-zinc-300" />
            </div>
          )}
          <ChevronDown
            size={16}
            className={`text-zinc-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181B] border border-white/5 rounded-lg shadow-xl shadow-black/50 overflow-hidden z-50 py-1 max-h-[300px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-purple-500/10 text-purple-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-purple-500 border-purple-500"
                      : "border-zinc-600 group-hover:border-zinc-500"
                  }`}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
                <span className="flex-1">{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

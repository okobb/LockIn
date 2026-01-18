import React, { useState } from "react";
import { Upload, File, X } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  accept?: string;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  accept = "application/pdf,image/*,video/*,text/*",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-[#18181B] border border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500/20 text-purple-400">
            <File size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-100 line-clamp-1">
              {selectedFile.name}
            </p>
            <p className="text-xs text-zinc-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed transition-all cursor-pointer",
        isDragOver
          ? "border-purple-500 bg-purple-500/5"
          : "border-zinc-700 hover:border-zinc-500 hover:bg-[#18181B]",
      )}
    >
      <input
        type="file"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
      />

      <div className="p-3 mb-3 rounded-full bg-zinc-800 text-zinc-400">
        <Upload size={24} />
      </div>
      <p className="text-sm font-medium text-zinc-200 mb-1">
        Click to upload or drag and drop
      </p>
      <p className="text-xs text-zinc-500">
        PDF, Images, Video, Text (max 10MB)
      </p>
    </div>
  );
};

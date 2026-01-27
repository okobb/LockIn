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
      <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-primary/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/20 text-primary">
            <File size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
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
          ? "border-primary bg-primary/5"
          : "border-border hover:border-foreground/50 hover:bg-muted/50",
      )}
    >
      <input
        type="file"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
      />

      <div className="p-3 mb-3 rounded-full bg-muted text-muted-foreground">
        <Upload size={24} />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        Click to upload or drag and drop
      </p>
      <p className="text-xs text-muted-foreground">
        PDF, Images, Video, Text (max 10MB)
      </p>
    </div>
  );
};

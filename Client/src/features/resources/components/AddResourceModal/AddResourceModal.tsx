import React, { useState } from "react";
import { X, Link, File, Loader2 } from "lucide-react";
import { useResourceMutations } from "../../hooks/useResources";
import { type CreateResourceRequest, type Difficulty } from "../../types";
import { DragDropZone } from "../DragDropZone/DragDropZone";
import { cn } from "../../../../lib/utils";

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createResource } = useResourceMutations();
  const [activeTab, setActiveTab] = useState<"link" | "file">("link");

  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateResourceRequest = {
      title: title || undefined,
      notes: notes || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      difficulty: (difficulty as Difficulty) || undefined,
    };

    if (activeTab === "link") {
      if (!url) return;
      payload.url = url;
    } else {
      if (!file) return;
      payload.file = file;
    }

    createResource.mutate(payload, {
      onSuccess: () => {
        onClose();
        setUrl("");
        setFile(null);
        setTitle("");
        setNotes("");
        setTags("");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#121214]">
          <h2 className="text-lg font-semibold text-zinc-100">
            Add New Resource
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex p-1 mx-6 mt-6 bg-[#18181B] rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab("link")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === "link"
                ? "bg-[#27272A] text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            <Link size={16} />
            Link
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === "file"
                ? "bg-[#27272A] text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            <File size={16} />
            File Upload
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            {activeTab === "link" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#18181B] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            ) : (
              <DragDropZone
                selectedFile={file}
                onFileSelect={setFile}
                onClear={() => setFile(null)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Title (Optional)
              </label>
              <input
                type="text"
                placeholder={
                  activeTab === "link"
                    ? "Auto-generated if empty"
                    : "File name will be used"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#18181B] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Tags
              </label>
              <input
                type="text"
                placeholder="React, Design..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-[#18181B] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full bg-[#18181B] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
              >
                <option value="">Select Level...</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Add some context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#18181B] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createResource.isPending ||
                (activeTab === "link" && !url) ||
                (activeTab === "file" && !file)
              }
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-purple-900/20"
            >
              {createResource.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Add to Library"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

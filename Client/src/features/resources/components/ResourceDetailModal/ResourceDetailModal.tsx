import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Target,
  Plus,
  Calendar,
  Clock,
  Tag,
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  Globe,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type Resource } from "../../types";
import { cn } from "../../../../lib/utils";
import { resourceApi } from "../../api/resourceApi";
import { useSessionContext } from "../../../focus/context/SessionContext";

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  article: BookOpen,
  video: Video,
  document: FileText,
  image: ImageIcon,
  website: Globe,
  documentation: BookOpen,
};

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { activeSession } = useSessionContext();
  const activeSessionId = activeSession?.sessionId;
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen || !resource) return null;

  const TypeIcon = typeIcons[resource.type] || Globe;

  const handleAction = async () => {
    if (!resource.url) return;

    if (activeSessionId) {
      // Add to active session
      setIsAdding(true);
      try {
        await resourceApi.addToSession(
          activeSessionId,
          resource.title,
          resource.url,
        );
        onClose();
      } catch (error) {
        console.error("Failed to add to session", error);
      } finally {
        setIsAdding(false);
      }
    } else {
      navigate("/context-save", {
        state: {
          initialTabs: [
            {
              title: resource.title,
              url: resource.url || resource.file_path,
            },
          ],
        },
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-6 border-b border-white/5 bg-[#121214]">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-white/5 text-purple-400 ring-1 ring-white/10 h-fit">
              <TypeIcon size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-zinc-100 leading-tight">
                {resource.title}
              </h2>
              <a
                href={resource.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-purple-400 transition-colors w-fit"
              >
                {resource.source_domain || "External Link"}
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-[#18181B] border border-white/5 space-y-1">
              <div className="text-xs text-zinc-500 uppercase font-medium flex items-center gap-1.5">
                <Target size={12} /> Difficulty
              </div>
              <div className="text-sm font-medium text-zinc-200 capitalize">
                {resource.difficulty || "—"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#18181B] border border-white/5 space-y-1">
              <div className="text-xs text-zinc-500 uppercase font-medium flex items-center gap-1.5">
                <Clock size={12} /> Time
              </div>
              <div className="text-sm font-medium text-zinc-200">
                {resource.estimated_time_minutes
                  ? `${resource.estimated_time_minutes} min`
                  : "—"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#18181B] border border-white/5 space-y-1">
              <div className="text-xs text-zinc-500 uppercase font-medium flex items-center gap-1.5">
                <Calendar size={12} /> Added
              </div>
              <div className="text-sm font-medium text-zinc-200">
                {new Date(resource.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Summary
            </h3>
            <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
              {resource.summary || resource.notes || "No summary provided."}
            </p>
          </div>

          {resource.tags && resource.tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Tag size={14} /> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/5 text-zinc-300 rounded-full text-xs border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-[#121214] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-3 w-full sm:w-auto">
            <a
              href={resource.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#18181B] hover:bg-[#202022] text-zinc-200 rounded-xl transition-colors text-sm font-medium border border-white/5"
            >
              Open Site <ExternalLink size={16} />
            </a>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleAction}
              disabled={isAdding}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-purple-900/20",
                activeSessionId
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-purple-600 hover:bg-purple-500",
              )}
            >
              {isAdding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : activeSessionId ? (
                <>
                  <Plus size={16} /> Add to Active Context
                </>
              ) : (
                <>
                  <Target size={16} /> Start Focus Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

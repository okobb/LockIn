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
  Trash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type Resource } from "../../types";
import { cn } from "../../../../lib/utils";
import { resourceApi } from "../../api/resourceApi";
import { useSessionContext } from "../../../focus/context/SessionContext";
import { useResourceMutations } from "../../hooks/useResources";
import { useModal } from "../../../../shared/context/ModalContext";

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

const Spinner = ({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="60"
      strokeDashoffset="20"
      className="opacity-25"
    />
    <path
      d="M12 2C6.47715 2 2 6.47715 2 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

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
  const { deleteResource } = useResourceMutations();
  const { open } = useModal();
  const activeSessionId = activeSession?.sessionId;
  const [isAdding, setIsAdding] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);

  const handleDelete = async () => {
    if (
      !resource ||
      !window.confirm("Are you sure you want to delete this resource?")
    )
      return;

    try {
      await deleteResource.mutateAsync(resource.id);
      onClose();
      open({
        type: "info",
        title: "Resource Deleted",
        message: "Resource has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete resource", error);
      open({
        type: "error",
        title: "Deletion Failed",
        message: "Failed to delete resource. Please try again.",
      });
    }
  };

  // Detect file types
  const getFileExtension = (path: string | null | undefined) => {
    if (!path) return "";
    return path.split(".").pop()?.toLowerCase() || "";
  };

  const textExtensions = [
    "txt",
    "md",
    "json",
    "js",
    "ts",
    "jsx",
    "tsx",
    "py",
    "css",
    "html",
    "xml",
    "yaml",
    "yml",
    "csv",
    "log",
  ];
  const isTextFile =
    resource?.file_path &&
    textExtensions.includes(getFileExtension(resource.file_path));

  React.useEffect(() => {
    if (!resource) return;

    const fetchUrl = async () => {
      if (!resource.file_path) return;

      setLoadingUrl(true);
      setTextContent(null);
      try {
        const { url } = await resourceApi.getDownloadUrl(resource.id);
        setSignedUrl(url);

        // If it's a text file, fetch the content
        const ext = getFileExtension(resource.file_path);
        if (textExtensions.includes(ext)) {
          const response = await fetch(url);
          if (response.ok) {
            const text = await response.text();
            setTextContent(text);
          }
        }
      } catch (err) {
        console.error("Failed to fetch signed URL", err);
      } finally {
        setLoadingUrl(false);
      }
    };

    if (resource.file_path && !resource.url) {
      fetchUrl();
    } else if (resource.url) {
      setSignedUrl(resource.url);
    } else {
      setSignedUrl(null);
    }
  }, [resource?.id, resource?.file_path, resource?.url]);

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

  const isPDF = resource.file_path?.toLowerCase().endsWith(".pdf");
  const isImage = resource.type === "image";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
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
                href={signedUrl || resource.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-purple-400 transition-colors w-fit"
              >
                {resource.source_domain || "Resource File"}
                {resource.url && <ExternalLink size={12} />}
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

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar border-r border-white/5">
            {(isImage || isPDF || isTextFile) && (
              <div className="mb-6 rounded-lg overflow-hidden border border-white/10 bg-[#18181B] min-h-[300px] flex items-center justify-center">
                {loadingUrl ? (
                  <Spinner className="animate-spin text-purple-500" size={32} />
                ) : signedUrl ? (
                  <>
                    {isImage && (
                      <img
                        src={signedUrl}
                        alt={resource.title}
                        className="max-w-full max-h-[500px] object-contain"
                      />
                    )}
                    {isPDF && (
                      <iframe
                        src={`${signedUrl}#toolbar=0`}
                        className="w-full h-[500px]"
                        title={resource.title}
                      />
                    )}
                    {isTextFile && textContent !== null && (
                      <pre className="w-full h-[500px] overflow-auto p-4 text-sm text-zinc-300 font-mono whitespace-pre-wrap wrap-break bg-[#0d0d0e]">
                        {textContent}
                      </pre>
                    )}
                  </>
                ) : (
                  <div className="text-zinc-500 text-sm">
                    Preview unavailable
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-zinc-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
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
        </div>

        <div className="p-6 border-t border-white/5 bg-[#121214] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-colors border border-red-500/20"
              title="Delete Resource"
            >
              <Trash size={16} />
            </button>
            <a
              href={signedUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              download={!resource.url}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#18181B] hover:bg-[#202022] text-zinc-200 rounded-xl transition-colors text-sm font-medium border border-white/5",
                !signedUrl && "opacity-50 pointer-events-none",
              )}
            >
              {resource.url ? (
                <>
                  Open Site <ExternalLink size={16} />
                </>
              ) : (
                <>
                  Download File <FileText size={16} />
                </>
              )}
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
                <Spinner size={16} className="animate-spin" />
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

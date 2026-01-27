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
import { useToast } from "../../../../shared/context/ToastContext";

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

const tagColors = [
  "text-blue-400 bg-blue-400/20 border-blue-400/30",
  "text-green-400 bg-green-400/20 border-green-400/30",
  "text-purple-400 bg-purple-400/20 border-purple-400/30",
  "text-yellow-400 bg-yellow-400/20 border-yellow-400/30",
  "text-pink-400 bg-pink-400/20 border-pink-400/30",
  "text-indigo-400 bg-indigo-400/20 border-indigo-400/30",
  "text-cyan-400 bg-cyan-400/20 border-cyan-400/30",
  "text-orange-400 bg-orange-400/20 border-orange-400/30",
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % tagColors.length;
  return tagColors[index];
};

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { activeSession } = useSessionContext();
  const { deleteResource } = useResourceMutations();
  const { confirm } = useModal();
  const { toast } = useToast();
  const activeSessionId = activeSession?.sessionId;
  const [isAdding, setIsAdding] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);

  const handleDelete = async () => {
    if (
      !resource ||
      !(await confirm(
        "Delete Resource",
        "Are you sure you want to delete this resource?",
      ))
    )
      return;

    try {
      await deleteResource.mutateAsync(resource.id);
      onClose();
      toast("success", "Resource deleted successfully");
    } catch (error) {
      console.error("Failed to delete resource", error);
      toast("error", "Failed to delete resource. Please try again.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-6 border-b border-border bg-card">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-muted text-primary ring-1 ring-border h-fit">
              <TypeIcon size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground leading-tight">
                {resource.title}
              </h2>
              <a
                href={signedUrl || resource.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
              >
                {resource.source_domain || "Resource File"}
                {resource.url && <ExternalLink size={12} />}
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar border-r border-border">
            {(isImage || isPDF || isTextFile) && (
              <div className="mb-6 rounded-lg overflow-hidden border border-border bg-muted/50 min-h-[300px] flex items-center justify-center">
                {loadingUrl ? (
                  <Spinner className="animate-spin text-primary" size={32} />
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
                      <pre className="w-full h-[500px] overflow-auto p-4 text-sm text-foreground font-mono whitespace-pre-wrap wrap-break bg-card">
                        {textContent}
                      </pre>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    Preview unavailable
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <div className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1.5">
                  <Target size={12} /> Difficulty
                </div>
                <div className="text-sm font-medium text-foreground capitalize">
                  {resource.difficulty || "—"}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <div className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1.5">
                  <Clock size={12} /> Time
                </div>
                <div className="text-sm font-medium text-foreground">
                  {resource.estimated_time_minutes
                    ? `${resource.estimated_time_minutes} min`
                    : "—"}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <div className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1.5">
                  <Calendar size={12} /> Added
                </div>
                <div className="text-sm font-medium text-foreground">
                  {new Date(resource.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Summary
              </h3>
              <p className="text-foreground leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                {resource.summary || resource.notes || "No summary provided."}
              </p>
            </div>

            {resource.tags && resource.tags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Tag size={14} /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border font-medium",
                        getTagColor(tag),
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive/80 rounded-xl transition-colors border border-destructive/20"
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
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-colors text-sm font-medium border border-border",
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
                "btn",
                activeSessionId
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "btn-primary",
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

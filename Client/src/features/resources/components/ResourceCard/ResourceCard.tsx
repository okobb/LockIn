import React from "react";
import { type Resource } from "../../types";
import {
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  Globe,
  Book,
  Star,
  Clock,
  Loader2,
  Check,
} from "lucide-react";
import { useResourceMutations } from "../../hooks/useResources";
import { cn } from "../../../../lib/utils";

interface ResourceCardProps {
  resource: Resource;
  onClick?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const typeIcons = {
  article: BookOpen,
  video: Video,
  document: FileText,
  image: ImageIcon,
  website: Globe,
  documentation: Book,
};

const difficultyColors = {
  beginner: "text-green-400 bg-green-400/10 border-green-400/20",
  intermediate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  advanced: "text-red-400 bg-red-400/10 border-red-400/20",
};

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onClick,
  selected,
  onToggleSelect,
}) => {
  const { toggleFavorite, markAsRead, isTogglingFavorite, isMarkingAsRead } =
    useResourceMutations();
  const TypeIcon = typeIcons[resource.type] || Globe;
  const isProcessing = resource._isProcessing;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing || isTogglingFavorite) return;
    toggleFavorite.mutate(resource.id);
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing || isMarkingAsRead) return;
    markAsRead.mutate({ id: resource.id, isRead: !resource.is_read });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onToggleSelect && (e.ctrlKey || e.metaKey || selected)) {
      e.preventDefault();
      onToggleSelect();
      return;
    }

    if (onClick && !isProcessing) {
      e.preventDefault();
      onClick();
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.();
  };

  return (
    <a
      href={
        isProcessing ? undefined : resource.url || resource.file_path || "#"
      }
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex flex-col p-4 rounded-xl border transition-all duration-300 backdrop-blur-sm select-none",
        selected
          ? "bg-primary/10 border-primary/50"
          : "bg-card/50 border-border hover:bg-card hover:border-border/80",
        isProcessing && "opacity-75 cursor-wait",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {onToggleSelect && (
            <div
              onClick={handleSelect}
              className={cn(
                "w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors mr-1",
                selected
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/50 hover:border-muted-foreground bg-transparent",
              )}
            >
              {selected && (
                <Check size={12} className="text-primary-foreground" />
              )}
            </div>
          )}
          <div className="p-2 rounded-lg bg-muted text-primary ring-1 ring-border">
            <TypeIcon size={16} />
          </div>
          {resource.difficulty && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                difficultyColors[
                  resource.difficulty.toLowerCase() as keyof typeof difficultyColors
                ],
              )}
            >
              {resource.difficulty}
            </span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border text-primary bg-primary/10 border-primary/20">
              <Loader2 size={10} className="animate-spin" />
              Processing
            </span>
          )}
        </div>
        <button
          onClick={handleFavorite}
          className={cn(
            "p-1.5 rounded-full transition-colors hover:bg-accent",
            isTogglingFavorite && "opacity-50 cursor-not-allowed",
            resource.is_favorite
              ? "text-yellow-400"
              : "text-muted-foreground hover:text-yellow-400",
          )}
          disabled={isTogglingFavorite}
        >
          <Star
            size={16}
            fill={resource.is_favorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {resource.title}
      </h3>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2.5em]">
        {resource.summary || resource.notes || "No description provided."}
      </p>

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          {resource.source_domain && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
              <img
                src={`https://www.google.com/s2/favicons?domain=${resource.source_domain}`}
                alt=""
                className="w-3 h-3 opacity-50 grayscale"
              />
              {resource.source_domain}
            </div>
          )}
          {resource.estimated_time_minutes && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock size={10} />
              {resource.estimated_time_minutes}m
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRead}
            className={cn(
              "w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
              isMarkingAsRead &&
                "opacity-50 cursor-not-allowed ring-muted-foreground/10",
              resource.is_read && !isMarkingAsRead
                ? "bg-emerald-500 ring-emerald-500/20"
                : "bg-muted-foreground/50 ring-muted-foreground/20 hover:bg-primary",
            )}
            disabled={isMarkingAsRead}
            title={resource.is_read ? "Mark as unread" : "Mark as read"}
          />
        </div>
      </div>
    </a>
  );
};

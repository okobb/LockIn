import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type ResourceFilters } from "../../types";
import { useResources, useResourceMutations } from "../../hooks/useResources";
import { ResourceCard } from "../../components/ResourceCard/ResourceCard";
import { ResourceCardSkeleton } from "../../components/ResourceCard/ResourceCardSkeleton";
import { Plus, Search, Loader2, BookOpen, X, Play, Trash } from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { AddResourceModal } from "../../components/AddResourceModal/AddResourceModal";
import { ResourceDetailModal } from "../../components/ResourceDetailModal/ResourceDetailModal";
import { type Resource } from "../../types";
import { useSessionContext } from "../../../focus/context/SessionContext";
import { useModal } from "../../../../shared/context/ModalContext";

export const ResourceHub: React.FC = () => {
  const navigate = useNavigate();
  const { open, confirm } = useModal();
  const [filters, setFilters] = useState<ResourceFilters>({
    status: "all",
    type: "all",
    difficulty: "all",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<number>>(
    new Set(),
  );

  // Debounced search
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useResources({
    ...filters,
    search: debouncedSearch,
  });
  const { addToSession, deleteResource } = useResourceMutations();
  const { activeSession } = useSessionContext();
  const resources = data?.data || [];

  const handleBulkDelete = async () => {
    if (selectedResourceIds.size === 0) return;

    if (
      !(await confirm(
        "Delete Resources",
        `Are you sure you want to delete ${selectedResourceIds.size} resources? This action cannot be undone.`,
      ))
    ) {
      return;
    }

    let successCount = 0;
    try {
      await Promise.all(
        Array.from(selectedResourceIds).map(async (id) => {
          await deleteResource.mutateAsync(id);
          successCount++;
        }),
      );

      setSelectedResourceIds(new Set());
      open({
        type: "success",
        title: "Resources Deleted",
        message: `Successfully deleted ${successCount} resources.`,
      });
    } catch (error) {
      console.error("Failed to delete resources", error);
      open({
        type: "error",
        title: "Error",
        message: "Failed to delete some resources.",
      });
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedResourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStartSessionWithResources = () => {
    if (selectedResourceIds.size === 0) return;

    // Construct tabs from selected resources
    const selectedResources = resources.filter((r) =>
      selectedResourceIds.has(r.id),
    );

    const initialTabs = selectedResources
      .map((r) => {
        const resourceUrl =
          r.url ||
          (r.file_path
            ? `${window.location.origin}/storage/${r.file_path}`
            : "");

        if (!resourceUrl) return null;

        return {
          title: r.title,
          url: resourceUrl,
        };
      })
      .filter((t): t is { title: string; url: string } => t !== null);

    if (initialTabs.length === 0) {
      open({
        type: "error",
        title: "No Valid Resources",
        message: "None of the selected resources have valid URLs.",
      });
      return;
    }

    // Navigate to context save page in start mode
    navigate("/context-save?mode=start", {
      state: {
        initialTabs,
      },
    });

    // Clear selection
    setSelectedResourceIds(new Set());
  };

  const [isAddingToSession, setIsAddingToSession] = useState(false);
  const handleBulkAddToSession = async () => {
    if (!activeSession?.sessionId || selectedResourceIds.size === 0) return;

    setIsAddingToSession(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const selectedResources = resources.filter((r) =>
        selectedResourceIds.has(r.id),
      );

      await Promise.all(
        selectedResources.map(async (r) => {
          const resourceUrl =
            r.url ||
            (r.file_path
              ? `${window.location.origin}/storage/${r.file_path}`
              : "");

          if (!resourceUrl) {
            failCount++;
            return;
          }

          try {
            await addToSession.mutateAsync({
              sessionId: activeSession.sessionId!,
              title: r.title,
              url: resourceUrl,
            });
            successCount++;
          } catch (e) {
            failCount++;
          }
        }),
      );

      setSelectedResourceIds(new Set());

      if (successCount > 0) {
        open({
          type: "info",
          title: "Resources Added",
          message: `Successfully added ${successCount} resource${
            successCount > 1 ? "s" : ""
          } to your active session context.${
            failCount > 0 ? ` (${failCount} failed)` : ""
          }`,
        });
      } else if (failCount > 0) {
        open({
          type: "error",
          title: "Failed to Add",
          message:
            "Could not add selected resources. They might be missing URLs.",
        });
      }
    } catch (error) {
      console.error("Failed to add resources to session", error);
      open({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred while adding resources.",
      });
    } finally {
      setIsAddingToSession(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={`flex-1 h-full overflow-y-auto transition-all duration-300 ${
          isSidebarCollapsed ? "pl-[70px]" : "pl-[260px]"
        }`}
      >
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Resource Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your learning materials
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedResourceIds.size > 0 && (
                <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-sm text-muted-foreground">
                    {selectedResourceIds.size} selected
                  </span>
                  <button
                    onClick={handleStartSessionWithResources}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-medium border border-border disabled:opacity-50 transition-colors mr-2 cursor-pointer"
                  >
                    <Play size={12} />
                    Start Session
                  </button>
                  <button
                    onClick={handleBulkAddToSession}
                    disabled={!activeSession || isAddingToSession}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium border border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAddingToSession ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    Add to Active Context
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="p-1.5 hover:bg-accent hover:text-red-500 rounded-lg text-muted-foreground transition-colors mr-1"
                    title="Delete selected"
                  >
                    <Trash size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedResourceIds(new Set())}
                    className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear selection"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus size={18} />
                <span>Add Resource</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 px-8 space-y-8 pb-10">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <select
              value={filters.type as string}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value as any }))
              }
              className="bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all cursor-pointer min-w-[150px]"
            >
              <option value="all">All Types</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="website">Website</option>
            </select>

            <select
              value={(filters.difficulty as string) || "all"}
              onChange={(e) =>
                setFilters((f) => ({ ...f, difficulty: e.target.value as any }))
              }
              className="bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all cursor-pointer min-w-[150px]"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ResourceCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onClick={() => setSelectedResource(resource)}
                  selected={selectedResourceIds.has(resource.id)}
                  onToggleSelect={() => toggleSelection(resource.id)}
                />
              ))}
              {resources.length === 0 && (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                  <div className="bg-secondary/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                    <BookOpen size={24} className="opacity-50" />
                  </div>
                  <p>No resources found.</p>
                  <button
                    onClick={() =>
                      setFilters({
                        type: "all",
                        status: "all",
                        difficulty: "all",
                      })
                    }
                    className="text-primary text-sm mt-2 hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <AddResourceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
        <ResourceDetailModal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          resource={selectedResource}
        />
      </main>
    </div>
  );
};

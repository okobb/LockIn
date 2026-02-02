import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimisticMutation } from "../../../shared/hooks/useOptimisticMutation";
import { resourceApi } from "../api/resourceApi";
import type {
  CreateResourceRequest,
  ResourceFilters,
  Resource,
} from "../types";

export const useResources = (filters: ResourceFilters) => {
  return useQuery({
    queryKey: ["resources", filters],
    queryFn: () => resourceApi.list(filters),

    // Poll every 5 seconds while processing
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (!data?.data?.data) return false;

      const hasProcessing = data.data.data.some(
        (r: Resource & { _isProcessing?: boolean }) => {
          if (r.id < 0 || r._isProcessing) return true;

          // Check for recently created URL resources without summary
          if (r.url && !r.summary) {
            const createdAt = new Date(r.created_at).getTime();
            const now = Date.now();
            const thirtySecondsAgo = now - 30000;
            if (createdAt > thirtySecondsAgo) return true;
          }

          return false;
        },
      );

      return hasProcessing ? 5000 : false;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useResourceMutations = () => {
  const queryClient = useQueryClient();

  const createResource = useOptimisticMutation({
    mutationFn: (data: CreateResourceRequest) => resourceApi.create(data),
    queryKey: ["resources"],
    updateFn: (old: any, newResource: CreateResourceRequest) => {
      if (!old?.data?.data) return old;

      // Create optimistic resource with temporary ID
      const optimisticResource: Resource = {
        id: -Date.now(),
        type: newResource.type || "article",
        title:
          newResource.title ||
          newResource.url ||
          newResource.file?.name ||
          "Loading...",
        url: newResource.url || null,
        file_path: null,
        thumbnail_url: null,
        summary: null,
        notes: newResource.notes || null,
        tags: newResource.tags || [],
        difficulty: newResource.difficulty || null,
        estimated_time_minutes: null,
        is_read: false,
        is_favorite: false,
        is_archived: false,
        source_domain: newResource.url
          ? new URL(newResource.url).hostname.replace("www.", "")
          : null,
        focus_session_id: newResource.focus_session_id || null,
        created_at: new Date().toISOString(),
        _isProcessing: true,
      } as Resource & { _isProcessing?: boolean };

      return {
        ...old,
        data: {
          ...old.data,
          data: [optimisticResource, ...old.data.data],
        },
      };
    },
  });

  const updateResource = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Resource> }) =>
      resourceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const deleteResource = useOptimisticMutation({
    mutationFn: (id: number) => resourceApi.delete(id),
    queryKey: ["resources"],
    updateFn: (old: any, id: number) => {
      if (!old?.data?.data) return old;
      return {
        ...old,
        data: {
          ...old.data,
          data: old.data.data.filter((r: Resource) => r.id !== id),
        },
      };
    },
  });

  const toggleFavorite = useOptimisticMutation({
    mutationFn: (id: number) => resourceApi.toggleFavorite(id),
    queryKey: ["resources"],
    updateFn: (old: any, id: number) => {
      if (!old?.data?.data) return old;
      return {
        ...old,
        data: {
          ...old.data,
          data: old.data.data.map((r: Resource) =>
            r.id === id ? { ...r, is_favorite: !r.is_favorite } : r,
          ),
        },
      };
    },
  });

  const markAsRead = useOptimisticMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      resourceApi.markAsRead(id, isRead),
    queryKey: ["resources"],
    updateFn: (old: any, { id, isRead }: { id: number; isRead: boolean }) => {
      if (!old?.data?.data) return old;
      return {
        ...old,
        data: {
          ...old.data,
          data: old.data.data.map((r: Resource) =>
            r.id === id ? { ...r, is_read: isRead } : r,
          ),
        },
      };
    },
  });

  const addToSession = useMutation({
    mutationFn: ({
      sessionId,
      title,
      url,
    }: {
      sessionId: number;
      title: string;
      url: string;
    }) => resourceApi.addToSession(sessionId, title, url),
  });

  return {
    createResource,
    updateResource,
    deleteResource,
    toggleFavorite,
    markAsRead,
    addToSession,
    isCreating: createResource.isPending,
    isUpdating: updateResource.isPending,
    isDeleting: deleteResource.isPending,
    isTogglingFavorite: toggleFavorite.isPending,
    isMarkingAsRead: markAsRead.isPending,
    isAddingToSession: addToSession.isPending,
  };
};

export const useResourceSuggestions = (focusSessionId?: number) => {
  return useQuery({
    queryKey: ["resource-suggestions", focusSessionId],
    queryFn: () => resourceApi.getSuggestions(focusSessionId),
    enabled: !!focusSessionId,
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
      const data = query.state.data;
      if (!data?.data) return false;

      const hasProcessing = data.data.some(
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

  const createResource = useMutation({
    mutationFn: (data: CreateResourceRequest) => resourceApi.create(data),

    onMutate: async (newResource) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["resources"] });

      // Snapshot current cache
      const previousResources = queryClient.getQueriesData({
        queryKey: ["resources"],
      });

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

      // Optimistically update all matching resource queries
      queryClient.setQueriesData(
        { queryKey: ["resources"] },
        (old: { data: Resource[] } | undefined) => {
          if (!old) return { data: [optimisticResource] };
          return { data: [optimisticResource, ...old.data] };
        },
      );

      return { previousResources };
    },

    // On error, rollback to the previous state
    onError: (_err, _newResource, context) => {
      if (context?.previousResources) {
        context.previousResources.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    // Always refetch after error or success to get real data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const updateResource = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Resource> }) =>
      resourceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const deleteResource = useMutation({
    mutationFn: (id: number) => resourceApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["resources"] });
      const previousResources = queryClient.getQueryData(["resources"]);

      queryClient.setQueriesData(
        { queryKey: ["resources"] },
        (old: { data: Resource[] } | undefined) => {
          if (!old) return old;
          return {
            data: old.data.filter((r) => r.id !== id),
          };
        },
      );

      return { previousResources };
    },
    onError: (_err, _id, context) => {
      if (context?.previousResources) {
        queryClient.setQueryData(["resources"], context.previousResources);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: (id: number) => resourceApi.toggleFavorite(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["resources"] });
      const previousResources = queryClient.getQueryData(["resources"]);

      queryClient.setQueriesData(
        { queryKey: ["resources"] },
        (old: { data: Resource[] } | undefined) => {
          if (!old) return old;
          return {
            data: old.data.map((r) =>
              r.id === id ? { ...r, is_favorite: !r.is_favorite } : r,
            ),
          };
        },
      );

      return { previousResources };
    },
    onError: (_err, _id, context) => {
      if (context?.previousResources) {
        queryClient.setQueryData(["resources"], context.previousResources);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      resourceApi.markAsRead(id, isRead),
    onMutate: async ({ id, isRead }) => {
      await queryClient.cancelQueries({ queryKey: ["resources"] });
      const previousResources = queryClient.getQueryData(["resources"]);

      queryClient.setQueriesData(
        { queryKey: ["resources"] },
        (old: { data: Resource[] } | undefined) => {
          if (!old) return old;
          return {
            data: old.data.map((r) =>
              r.id === id ? { ...r, is_read: isRead } : r,
            ),
          };
        },
      );

      return { previousResources };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousResources) {
        queryClient.setQueryData(["resources"], context.previousResources);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
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

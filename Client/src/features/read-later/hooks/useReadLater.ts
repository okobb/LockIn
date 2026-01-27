import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readLater, type AddReadLaterData } from "../api/readLater";

export const useReadLater = () => {
  const queryClient = useQueryClient();


  const queueQuery = useQuery({
    queryKey: ["read-later", "queue"],
    queryFn: readLater.getQueue,
    select: (response) => response.data,
  });

  const suggestionsQuery = useQuery({
    queryKey: ["read-later", "suggestions"],
    queryFn: readLater.getSuggestions,
    select: (response) => response.data,
  });

  const addMutation = useMutation({
    mutationFn: (data: AddReadLaterData) => readLater.addToQueue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["read-later", "queue"] });
      queryClient.invalidateQueries({
        queryKey: ["read-later", "suggestions"],
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => readLater.removeFromQueue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["read-later", "queue"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => readLater.completeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["read-later", "queue"] });
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => readLater.startItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["read-later", "queue"] });
      queryClient.invalidateQueries({
        queryKey: ["read-later", "suggestions"],
      });
    },
  });

  return {
    queue: queueQuery.data ?? [],
    suggestions: suggestionsQuery.data ?? [],
    isLoadingQueue: queueQuery.isLoading,
    isLoadingSuggestions: suggestionsQuery.isLoading,
    addToQueue: addMutation.mutate,
    removeFromQueue: removeMutation.mutate,
    markCompleted: completeMutation.mutate,
    startItem: startMutation.mutate,
    isAdding: addMutation.isPending,
    isStarting: startMutation.isPending,
  };
};

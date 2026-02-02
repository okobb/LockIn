import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";

interface OptimisticMutationOptions<TData, TVariables, TContext> extends Omit<
  UseMutationOptions<TData, Error, TVariables, TContext>,
  "onMutate" | "onError" | "onSettled"
> {
  queryKey: QueryKey;
  updateFn: (oldData: any, variables: TVariables) => any;
  invalidateQueryKey?: QueryKey;
}

export function useOptimisticMutation<TData, TVariables>(
  options: OptimisticMutationOptions<
    TData,
    TVariables,
    { previousData: [QueryKey, any][] }
  >,
) {
  const queryClient = useQueryClient();
  const { queryKey, updateFn, mutationFn, invalidateQueryKey, ...rest } =
    options;

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueriesData({ queryKey });
      queryClient.setQueriesData({ queryKey }, (old: any) =>
        updateFn(old, variables),
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: invalidateQueryKey || queryKey,
      });
    },
    ...rest,
  });
}

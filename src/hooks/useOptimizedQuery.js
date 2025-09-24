import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { debounce } from '@/utils/performance';

// Optimized query hook with caching and pagination
export const useOptimizedQuery = (
  queryKey,
  queryFn,
  options = {}
) => {
  const {
    enablePagination = false,
    pageSize = 20,
    enableSearch = false,
    searchDebounceMs = 300,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000, // 1 minute
    ...queryOptions
  } = options;

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setDebouncedSearchTerm(term);
      setPage(1); // Reset to first page on search
    }, searchDebounceMs),
    [searchDebounceMs]
  );

  // Update debounced search term when search term changes
  useEffect(() => {
    if (enableSearch) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch, enableSearch]);

  // Build query key with pagination and search
  const finalQueryKey = useMemo(() => {
    const key = [...queryKey];
    if (enablePagination) key.push('page', page, 'pageSize', pageSize);
    if (enableSearch && debouncedSearchTerm) key.push('search', debouncedSearchTerm);
    return key;
  }, [queryKey, enablePagination, page, pageSize, enableSearch, debouncedSearchTerm]);

  // Enhanced query function
  const enhancedQueryFn = useCallback(async (context) => {
    const params = {
      page: enablePagination ? page : undefined,
      pageSize: enablePagination ? pageSize : undefined,
      search: enableSearch ? debouncedSearchTerm : undefined,
      ...context
    };
    
    return queryFn(params);
  }, [queryFn, enablePagination, page, pageSize, enableSearch, debouncedSearchTerm]);

  // Use the query
  const queryResult = useQuery({
    queryKey: finalQueryKey,
    queryFn: enhancedQueryFn,
    cacheTime,
    staleTime,
    keepPreviousData: true, // Keep previous data while loading new page
    ...queryOptions
  });

  // Pagination helpers
  const goToPage = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  // Search helpers
  const updateSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  return {
    ...queryResult,
    
    // Pagination state and helpers
    page,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    
    // Search state and helpers
    searchTerm,
    debouncedSearchTerm,
    updateSearch,
    clearSearch,
    
    // Computed values
    hasNextPage: queryResult.data?.hasMore || false,
    hasPrevPage: page > 1,
    totalPages: queryResult.data?.totalPages || 0,
    totalItems: queryResult.data?.total || 0,
    
    // Data helpers
    items: queryResult.data?.items || queryResult.data || [],
    isEmpty: (!queryResult.data?.items || queryResult.data.items.length === 0) && 
             (!queryResult.data || (Array.isArray(queryResult.data) && queryResult.data.length === 0))
  };
};

// Optimized mutation hook with optimistic updates
export const useOptimizedMutation = (
  mutationFn,
  options = {}
) => {
  const queryClient = useQueryClient();
  const {
    optimisticUpdate = null,
    invalidateQueries = [],
    onSuccessInvalidate = true,
    ...mutationOptions
  } = options;

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (optimisticUpdate) {
        // Cancel outgoing refetches
        await Promise.all(
          invalidateQueries.map(key => 
            queryClient.cancelQueries({ queryKey: key })
          )
        );

        // Snapshot previous values
        const previousData = {};
        invalidateQueries.forEach(key => {
          previousData[key.join('.')] = queryClient.getQueryData(key);
        });

        // Optimistically update
        if (typeof optimisticUpdate === 'function') {
          optimisticUpdate(variables, queryClient);
        }

        return { previousData };
      }
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([keyStr, data]) => {
          const key = keyStr.split('.');
          queryClient.setQueryData(key, data);
        });
      }
      
      mutationOptions.onError?.(err, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (onSuccessInvalidate) {
        // Invalidate related queries
        invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      
      mutationOptions.onSuccess?.(data, variables, context);
    },
    ...mutationOptions
  });
};

// Prefetch helper
export const usePrefetch = () => {
  const queryClient = useQueryClient();
  
  return useCallback((queryKey, queryFn, options = {}) => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 30 * 1000, // 30 seconds
      ...options
    });
  }, [queryClient]);
};
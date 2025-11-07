import { QueryClient } from '@tanstack/react-query';

/**
 * Shared Query Client instance for React Query.
 * Tweaked defaults balance UX and network load.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // keep data fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // garbage collect unused queries after 30 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Response && error.status >= 400 && error.status < 500) {
          return false; // don't retry obvious client errors
        }
        return failureCount < 2;
      },
    },
  },
});

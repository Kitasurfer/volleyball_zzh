/**
 * Hook for rate limiting and retry logic
 */
import { useState, useCallback, useRef } from 'react';

interface UseRateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface UseRateLimiterReturn {
  canMakeRequest: () => boolean;
  recordRequest: () => void;
  isRateLimited: boolean;
  remainingRequests: number;
  retryCount: number;
  incrementRetry: () => number;
  resetRetry: () => void;
  shouldRetry: () => boolean;
  getRetryDelay: () => number;
}

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

export function useRateLimiter(options: UseRateLimiterOptions = {}): UseRateLimiterReturn {
  const {
    maxRequests = DEFAULT_MAX_REQUESTS,
    windowMs = DEFAULT_WINDOW_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  } = options;

  const requestTimestamps = useRef<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const cleanOldRequests = useCallback(() => {
    const now = Date.now();
    requestTimestamps.current = requestTimestamps.current.filter(
      (timestamp) => now - timestamp < windowMs
    );
  }, [windowMs]);

  const canMakeRequest = useCallback((): boolean => {
    cleanOldRequests();
    const canRequest = requestTimestamps.current.length < maxRequests;
    setIsRateLimited(!canRequest);
    return canRequest;
  }, [cleanOldRequests, maxRequests]);

  const recordRequest = useCallback(() => {
    requestTimestamps.current.push(Date.now());
    cleanOldRequests();
  }, [cleanOldRequests]);

  const remainingRequests = maxRequests - requestTimestamps.current.length;

  const incrementRetry = useCallback((): number => {
    const newCount = retryCount + 1;
    setRetryCount(newCount);
    return newCount;
  }, [retryCount]);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
  }, []);

  const shouldRetry = useCallback((): boolean => {
    return retryCount < maxRetries;
  }, [retryCount, maxRetries]);

  const getRetryDelay = useCallback((): number => {
    return retryDelayMs * Math.pow(2, retryCount);
  }, [retryDelayMs, retryCount]);

  return {
    canMakeRequest,
    recordRequest,
    isRateLimited,
    remainingRequests: Math.max(0, remainingRequests),
    retryCount,
    incrementRetry,
    resetRetry,
    shouldRetry,
    getRetryDelay,
  };
}

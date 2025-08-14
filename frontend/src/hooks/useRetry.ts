import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxAttemptsReached?: (error: Error) => void;
}

interface UseRetryReturn<T> {
  execute: (fn: () => Promise<T>) => Promise<T>;
  isRetrying: boolean;
  attemptCount: number;
  lastError: Error | null;
  reset: () => void;
}

export const useRetry = <T = any>(options: RetryOptions = {}): UseRetryReturn<T> => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    onMaxAttemptsReached
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
    return Math.min(delay, maxDelay);
  }, [baseDelay, backoffFactor, maxDelay]);

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T> => {
    setIsRetrying(true);
    setLastError(null);
    
    let lastAttemptError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setAttemptCount(attempt);

      try {
        const result = await fn();
        setIsRetrying(false);
        setAttemptCount(0);
        setLastError(null);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastAttemptError = err;
        setLastError(err);

        if (attempt < maxAttempts) {
          // Call retry callback
          if (onRetry) {
            onRetry(attempt, err);
          }

          // Wait before retrying with exponential backoff
          const delay = calculateDelay(attempt);
          await sleep(delay);
        }
      }
    }

    // All attempts failed
    setIsRetrying(false);
    
    if (lastAttemptError && onMaxAttemptsReached) {
      onMaxAttemptsReached(lastAttemptError);
    }

    throw lastAttemptError;
  }, [maxAttempts, calculateDelay, sleep, onRetry, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setAttemptCount(0);
    setLastError(null);
  }, []);

  return {
    execute,
    isRetrying,
    attemptCount,
    lastError,
    reset
  };
};

// Utility function to determine if an error is retryable
export const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  
  // Network errors are usually retryable
  if (message.includes('network') || 
      message.includes('fetch') || 
      message.includes('connection') ||
      message.includes('timeout')) {
    return true;
  }

  // Server errors (5xx) are usually retryable
  if (message.includes('500') || 
      message.includes('502') || 
      message.includes('503') || 
      message.includes('504')) {
    return true;
  }

  // Rate limiting might be retryable with backoff
  if (message.includes('429') || message.includes('rate limit')) {
    return true;
  }

  return false;
};

// Hook for API calls with automatic retry
export const useApiWithRetry = <T = any>(options: RetryOptions = {}) => {
  const retry = useRetry<T>({
    ...options,
    onRetry: (attempt, error) => {
      console.log(`API call failed (attempt ${attempt}):`, error.message);
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    }
  });

  const apiCall = useCallback(async (
    url: string, 
    requestOptions: RequestInit = {}
  ): Promise<T> => {
    return retry.execute(async () => {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        
        // Add response details to error for better debugging
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        
        throw error;
      }
      
      return response.json();
    });
  }, [retry]);

  return {
    ...retry,
    apiCall
  };
};
import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  shouldStop?: (data: T) => boolean;
}

interface UsePollingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePolling<T>({
  fetcher,
  interval = 3000,
  enabled = true,
  onSuccess,
  shouldStop,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (stoppedRef.current) return;

    try {
      setError(null);
      const result = await fetcher();
      setData(result);
      setLoading(false);

      if (onSuccess) {
        onSuccess(result);
      }

      if (shouldStop && shouldStop(result)) {
        stoppedRef.current = true;
        return;
      }
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }, [fetcher, onSuccess, shouldStop]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    stoppedRef.current = false;

    // 立即执行一次
    fetchData();

    // 设置轮询
    const poll = () => {
      if (stoppedRef.current) return;
      timerRef.current = setTimeout(async () => {
        await fetchData();
        poll();
      }, interval);
    };

    poll();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      stoppedRef.current = true;
    };
  }, [enabled, interval, fetchData]);

  return { data, loading, error, refetch };
}

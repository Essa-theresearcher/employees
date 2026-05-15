import { useEffect, useState } from 'react';
import { apiGet } from './api';

export type EventPhase = {
  portalOpen: boolean;
  checkInClosed: boolean;
  teamsPublished: boolean;
  teamCount: number;
};

export function useEventPhase(pollMs = 20_000): {
  phase: EventPhase | null;
  loading: boolean;
} {
  const [phase, setPhase] = useState<EventPhase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiGet<{ success: boolean; data: EventPhase }>('/event');
        if (!cancelled) {
          setPhase(res.data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPhase(null);
          setLoading(false);
        }
      }
    }

    void load();
    const handle = window.setInterval(() => void load(), pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [pollMs]);

  return { phase, loading };
}

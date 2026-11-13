import { useEffect, useMemo, useState } from 'react';
import { getAppMode, getSavedFirebaseConfig } from '../services/firebase';
import {
  createDemoRepository,
  createFirebaseRepository,
  type GameRepository,
  type GameSnapshot,
} from '../services/gameRepository';

export interface UseGameDataResult {
  repo: GameRepository;
  snapshot: GameSnapshot | null;
  loading: boolean;
  error: string | null;
  mode: 'firebase' | 'demo';
}

export function useGameData(autoInitAdminToken?: string): UseGameDataResult {
  const mode = getAppMode();
  const hasFb = Boolean(getSavedFirebaseConfig());
  const effectiveMode: 'firebase' | 'demo' =
    mode === 'firebase' && hasFb ? 'firebase' : 'demo';

  const repo = useMemo(
    () =>
      effectiveMode === 'firebase'
        ? createFirebaseRepository()
        : createDemoRepository(),
    [effectiveMode],
  );

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        if (autoInitAdminToken !== undefined) {
          await repo.ensureInitialized(autoInitAdminToken || undefined);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize game database.',
          );
          setLoading(false);
        }
        return;
      }

      if (!active) return;

      const unsub = repo.subscribe(
        (next) => {
          if (!active) return;
          setSnapshot(next);
          setLoading(false);
        },
        (err) => {
          if (!active) return;
          setError(err.message);
          setLoading(false);
        },
      );

      return unsub;
    };

    let cleanup: (() => void) | undefined;
    start().then((unsub) => {
      if (active) cleanup = unsub;
      else unsub?.();
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, [repo, autoInitAdminToken]);

  return { repo, snapshot, loading, error, mode: effectiveMode };
}

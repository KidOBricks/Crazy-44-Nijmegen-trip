import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { GameStatus } from '../types/game';

interface CountdownTimerProps {
  status: GameStatus;
  endsAt: number | null;
}

function formatDuration(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function CountdownTimer({ status, endsAt }: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'active' || !endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status, endsAt]);

  if (status === 'setup') {
    return (
      <span className="timer-pill">
        <Clock size={15} />
        Not Started
      </span>
    );
  }

  if (status === 'ended') {
    return (
      <span className="timer-pill">
        <Clock size={15} />
        Game Ended
      </span>
    );
  }

  if (!endsAt) {
    return (
      <span className="timer-pill">
        <Clock size={15} />
        Live
      </span>
    );
  }

  const remaining = endsAt - now;
  const isUrgent = remaining <= 15 * 60 * 1000;

  return (
    <span className={`timer-pill ${isUrgent ? 'urgent' : ''}`}>
      <Clock size={15} />
      {remaining <= 0 ? "Time's Up!" : formatDuration(remaining)}
    </span>
  );
}

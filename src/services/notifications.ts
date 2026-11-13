export function playNotificationChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.16, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + startOffset + duration,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    playTone(659.25, 0, 0.16);
    playTone(880, 0.12, 0.24);
  } catch {
    // Ignore autoplay restrictions before user interaction
  }

  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([120, 60, 120]);
    }
  } catch {
    // Ignore unsupported environments
  }
}

export function showBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch {
      // Ignore mobile Safari Notification constructor restrictions
    }
  }
}

export async function requestBrowserNotifications(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export async function sendNtfyPush(
  topic: string,
  title: string,
  message: string,
): Promise<void> {
  const trimmed = topic.trim();
  if (!trimmed) return;
  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(trimmed)}`, {
      method: 'POST',
      headers: {
        Title: title,
        Priority: 'high',
        Tags: 'tada,camera',
      },
      body: message,
    });
  } catch {
    // Best-effort push; never block submission flow
  }
}

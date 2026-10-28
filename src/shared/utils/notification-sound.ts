/**
 * Sovereign Notification Sound Utility
 * Plays the notification sound (/sounds/notification.mp3) with Web Audio API synthesizer
 * fallback for environments where media playback is restricted or file format unsupported.
 * Includes throttling to prevent overlapping audio when multiple events arrive simultaneously.
 */

let lastSoundPlayedAt = 0;

export function playNotificationSound(throttleMs: number = 1000): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastSoundPlayedAt < throttleMs) return;
  lastSoundPlayedAt = now;

  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        playWebAudioChime();
      });
    }
  } catch {
    playWebAudioChime();
  }

  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Best-effort vibration
  }
}

function playWebAudioChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Non-fatal if Web Audio context is not supported or blocked
  }
}

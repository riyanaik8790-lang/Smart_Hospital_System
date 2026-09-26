import { useCallback, useEffect, useRef } from 'react';

// The AudioContext is unlocked by a real user gesture, then reused for a short,
// low-volume two-note notification chime.
export const useNotificationChime = () => {
  const contextRef = useRef(null);
  const unlockedRef = useRef(false);
  const lastPlayedAtRef = useRef(0);

  const getContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    contextRef.current = new AudioContextClass();
    return contextRef.current;
  }, []);

  useEffect(() => {
    const removeUnlockListeners = () => {
      document.removeEventListener('pointerdown', unlockAudio, true);
      document.removeEventListener('keydown', unlockAudio, true);
      document.removeEventListener('touchstart', unlockAudio, true);
    };

    const unlockAudio = () => {
      const context = getContext();
      if (!context) return;
      const markUnlocked = () => {
        if (context.state !== 'running') return;
        unlockedRef.current = true;
        removeUnlockListeners();
      };

      if (context.state === 'running') {
        markUnlocked();
        return;
      }
      context.resume().then(markUnlocked).catch(() => {});
    };

    document.addEventListener('pointerdown', unlockAudio, true);
    document.addEventListener('keydown', unlockAudio, true);
    document.addEventListener('touchstart', unlockAudio, true);
    return () => {
      removeUnlockListeners();
      contextRef.current?.close().catch(() => {});
    };
  }, [getContext]);

  return useCallback(() => {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    if (!soundEnabled) return;

    const context = contextRef.current || getContext();
    if (!context) return;

    const playChime = () => {
      const now = Date.now();
      if (context.state !== 'running' || now - lastPlayedAtRef.current < 750) return;

      lastPlayedAtRef.current = now;
      const start = context.currentTime;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.045, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
      gain.connect(context.destination);

      [659.25, 880].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start + (index * 0.1));
        oscillator.connect(gain);
        oscillator.start(start + (index * 0.1));
        oscillator.stop(start + 0.45);
      });
    };

    if (context.state === 'running') {
      unlockedRef.current = true;
      playChime();
    } else {
      context.resume().then(() => {
        unlockedRef.current = true;
        playChime();
      }).catch(() => {});
    }
  }, [getContext]);
};

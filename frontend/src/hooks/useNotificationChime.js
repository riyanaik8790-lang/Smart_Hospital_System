import { useCallback, useEffect, useRef } from 'react';

// AudioContext must be created from a user gesture. The app uses a short,
// low-volume two-note chime instead of an audio file so there is no asset to
// fetch and no browser autoplay violation.
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
    const unlockAudio = () => {
      const context = getContext();
      if (!context) return;
      context.resume().then(() => { unlockedRef.current = true; }).catch(() => {});
    };

    document.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      document.removeEventListener('pointerdown', unlockAudio, true);
      document.removeEventListener('keydown', unlockAudio);
      contextRef.current?.close().catch(() => {});
    };
  }, [getContext]);

  return useCallback(() => {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    if (!soundEnabled) return;

    const context = contextRef.current;
    const now = Date.now();
    if (!unlockedRef.current || !context || context.state !== 'running' || now - lastPlayedAtRef.current < 750) return;

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
  }, []);
};

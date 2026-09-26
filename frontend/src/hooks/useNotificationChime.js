import { useCallback, useEffect, useRef } from 'react';

const createNotificationTone = () => {
  const sampleRate = 8000;
  const durationSeconds = 0.32;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + sampleCount);
  const view = new DataView(buffer);
  const writeText = (offset, value) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeText(36, 'data');
  view.setUint32(40, sampleCount, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const frequency = time < 0.16 ? 659.25 : 880;
    const envelope = Math.max(0, 1 - (time / durationSeconds));
    const sample = Math.sin(2 * Math.PI * frequency * time) * envelope * 0.18;
    view.setUint8(44 + index, 128 + Math.round(sample * 127));
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

// Uses a preloaded HTML5 audio element so the same chime works for both the
// profile-toggle demo and notification alerts without a server-hosted asset.
export const useNotificationChime = () => {
  const audioRef = useRef(null);
  const lastPlayedAtRef = useRef(0);

  useEffect(() => {
    const source = createNotificationTone();
    const audio = new Audio(source);
    audio.preload = 'auto';
    audio.volume = 0.45;
    audio.load();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
      URL.revokeObjectURL(source);
    };
  }, []);

  return useCallback(() => {
    if (localStorage.getItem('soundEnabled') === 'false') return;

    const audio = audioRef.current;
    const now = Date.now();
    if (!audio || now - lastPlayedAtRef.current < 750) return;

    try {
      audio.currentTime = 0;
      const playback = audio.play();
      lastPlayedAtRef.current = now;
      playback?.catch((error) => {
        // Some browsers require a user interaction before playing audio.
        console.warn('Notification sound was blocked by the browser.', error);
      });
    } catch (error) {
      console.warn('Unable to play notification sound.', error);
    }
  }, []);
};

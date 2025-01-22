import { useRef, useEffect, useCallback } from "react";

export const useSound = (freq: number, volume: number) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const start = useCallback(() => {
    audioContextRef.current = new AudioContext();
    oscillatorRef.current = audioContextRef.current.createOscillator();
    gainNodeRef.current = audioContextRef.current.createGain();

    oscillatorRef.current.frequency.value = 442;
    oscillatorRef.current.connect(gainNodeRef.current);

    gainNodeRef.current.connect(audioContextRef.current.destination);

    const now = audioContextRef.current.currentTime;
    gainNodeRef.current.gain.setValueAtTime(0, now);
    gainNodeRef.current.gain.linearRampToValueAtTime(1, now + 0.1);

    oscillatorRef.current.start();
  }, []);

  const stop = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    if (oscillatorRef.current && gainNodeRef.current) {
      const now = audioContextRef.current!.currentTime;
      oscillatorRef.current.frequency.setValueAtTime(
        oscillatorRef.current.frequency.value,
        now
      );
      oscillatorRef.current.frequency.linearRampToValueAtTime(freq, now + 0.01);
      gainNodeRef.current.gain.setValueAtTime(
        gainNodeRef.current.gain.value,
        now
      );
      gainNodeRef.current.gain.linearRampToValueAtTime(volume, now + 0.01);
    }
  }, [freq, volume]);

  useEffect(() => {
    return stop;
  }, [stop]);

  return { start, stop };
};

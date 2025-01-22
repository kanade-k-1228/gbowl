import { useEffect } from 'react';

export const useSound = (value: number, soundUrl: string) => {
  useEffect(() => {
    const audio = new Audio(soundUrl);
    audio.play();
  }, [value, soundUrl]);
};

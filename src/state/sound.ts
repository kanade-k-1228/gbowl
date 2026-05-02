import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { bowlState } from "./bowl";

export const soundToggleState = atom(false);

export const soundVolumeState = atomWithStorage("gbowl.sound.volume", 10);

export const soundFreqBaseState = atomWithStorage("gbowl.sound.freqBase", 442);
export const soundFreqRangeState = atomWithStorage(
  "gbowl.sound.freqRange",
  600
);

const ballMagState = atom<number>((get) => {
  const ball = get(bowlState);
  return Math.min(1, Math.hypot(ball.x, ball.y));
});

export const soundFreqState = atom<number>((get) => {
  const mag = get(ballMagState);
  return get(soundFreqBaseState) + mag * get(soundFreqRangeState);
});

export const soundVolumeOutputState = atom<number>((get) => {
  return get(soundVolumeState) * get(ballMagState);
});

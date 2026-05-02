import { atom } from "jotai";
import { bowlState } from "./bowl";

export const soundToggleState = atom(false);

export const soundVolumeState = atom(10);

export const soundFreqBaseState = atom(442);
export const soundFreqRangeState = atom(600);

export const soundFreqState = atom<number>((get) => {
  const ball = get(bowlState);
  const mag = Math.min(1, Math.hypot(ball.x, ball.y));
  return get(soundFreqBaseState) + mag * get(soundFreqRangeState);
});

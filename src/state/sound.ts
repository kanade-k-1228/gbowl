import { atom } from "jotai";
import { bowlState } from "./bowl";

export const soundToggleState = atom(false);

export const soundVolumeState = atom(10);

// Map ball displacement magnitude (0..1) to frequency.
// Center → 442 Hz, rim → 442 + FREQ_RANGE Hz.
const FREQ_BASE = 442;
const FREQ_RANGE = 600;

export const soundFreqState = atom<number>((get) => {
  const ball = get(bowlState);
  const mag = Math.min(1, Math.hypot(ball.x, ball.y));
  return FREQ_BASE + mag * FREQ_RANGE;
});

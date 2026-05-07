import { atom, type Getter, type Setter } from "jotai";
import type { DeviceMotion } from "../type/type";
import { matrixState } from "./frame";

export const SERIES_WINDOW = 50;

// Time series in vehicle frame: ax = forward, ay = lateral, yawRate = around up.
export const carAccSeriesState = atom<{ ax: number[]; ay: number[] }>({
  ax: [],
  ay: [],
});

export const yawRateSeriesState = atom<number[]>([]);

export const stepRecordSeries = (
  get: Getter,
  set: Setter,
  motion: DeviceMotion
) => {
  const M = get(matrixState);
  // matrix rows: [right, forward, up]. ax = forward, ay = right.
  const a = motion.acceleration;
  const ax = M[1][0] * a.x + M[1][1] * a.y + M[1][2] * a.z;
  const ay = M[0][0] * a.x + M[0][1] * a.y + M[0][2] * a.z;

  const r = motion.rotationRate;
  const yawRate = M[2][0] * r.alpha + M[2][1] * r.beta + M[2][2] * r.gamma;

  const acc = get(carAccSeriesState);
  set(carAccSeriesState, {
    ax: [...acc.ax, ax].slice(-SERIES_WINDOW),
    ay: [...acc.ay, ay].slice(-SERIES_WINDOW),
  });
  const yaw = get(yawRateSeriesState);
  set(yawRateSeriesState, [...yaw, yawRate].slice(-SERIES_WINDOW));
};

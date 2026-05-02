import { atom, type Getter, type Setter } from "jotai";
import type { DeviceMotion } from "../type/type";
import { stepBowlSimulation } from "./bowl";
import { matrixState, stepCalibrationFromImu } from "./fusion";

const deviceMotionRaw = atom<DeviceMotion>({
  acceleration: { x: 0, y: 0, z: 0 },
  accelerationIncludingGravity: { x: 0, y: 0, z: 0 },
  rotationRate: { alpha: 0, beta: 0, gamma: 0 },
  interval: 0,
});

// motion.interval is unreliable across browsers (sometimes 0, sometimes in
// seconds instead of ms). Use the real elapsed time between events.
let lastEventTime = 0;

export const deviceMotionState = atom(
  (get) => get(deviceMotionRaw),
  (get, set, motion: DeviceMotion) => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const dtMs = lastEventTime > 0 ? now - lastEventTime : 16;
    lastEventTime = now;
    const m: DeviceMotion = { ...motion, interval: dtMs };

    set(deviceMotionRaw, m);
    stepCalibrationFromImu(get, set, m);
    stepBowlSimulation(get, set, m);
    stepRecordSeries(get, set, m);
  }
);

export const SERIES_WINDOW = 50;

// Time series in vehicle frame: ax = forward, ay = lateral, yawRate = around up.
export const carAccSeriesState = atom<{ ax: number[]; ay: number[] }>({
  ax: [],
  ay: [],
});

export const yawRateSeriesState = atom<number[]>([]);

const stepRecordSeries = (get: Getter, set: Setter, motion: DeviceMotion) => {
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

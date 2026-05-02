import { atom, type Getter, type Setter } from "jotai";
import type { DeviceMotion } from "../type/type";
import { stepBowlSimulation } from "./bowl";
import { stepCalibrationFromImu } from "./fusion";

const deviceMotionRaw = atom<DeviceMotion>({
  acceleration: { x: 0, y: 0, z: 0 },
  accelerationIncludingGravity: { x: 0, y: 0, z: 0 },
  rotationRate: { alpha: 0, beta: 0, gamma: 0 },
  interval: 0,
});

export const deviceMotionState = atom(
  (get) => get(deviceMotionRaw),
  (get, set, motion: DeviceMotion) => {
    set(deviceMotionRaw, motion);
    stepCalibrationFromImu(get, set, motion);
    stepBowlSimulation(get, set, motion);
    stepRecordSeries(get, set, motion);
  }
);

export const SERIES_WINDOW = 50;

export const accSeriesState = atom<{ x: number[]; y: number[]; z: number[] }>({
  x: [],
  y: [],
  z: [],
});

export const gyroSeriesState = atom<{
  alpha: number[];
  beta: number[];
  gamma: number[];
}>({ alpha: [], beta: [], gamma: [] });

const stepRecordSeries = (get: Getter, set: Setter, motion: DeviceMotion) => {
  const acc = get(accSeriesState);
  set(accSeriesState, {
    x: [...acc.x, motion.acceleration.x].slice(-SERIES_WINDOW),
    y: [...acc.y, motion.acceleration.y].slice(-SERIES_WINDOW),
    z: [...acc.z, motion.acceleration.z].slice(-SERIES_WINDOW),
  });
  const gyro = get(gyroSeriesState);
  set(gyroSeriesState, {
    alpha: [...gyro.alpha, motion.rotationRate.alpha].slice(-SERIES_WINDOW),
    beta: [...gyro.beta, motion.rotationRate.beta].slice(-SERIES_WINDOW),
    gamma: [...gyro.gamma, motion.rotationRate.gamma].slice(-SERIES_WINDOW),
  });
};

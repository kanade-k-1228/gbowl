import { atom } from "jotai";
import type { DeviceMotion, FusedState, Geolocation } from "../type/type";

export const deviceMotionState = atom<DeviceMotion>({
  acceleration: { x: 0, y: 0, z: 0 },
  accelerationIncludingGravity: { x: 0, y: 0, z: 0 },
  rotationRate: { alpha: 0, beta: 0, gamma: 0 },
  interval: 0,
});

export const matrixState = atom<number[][]>([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]);

const transform = (
  acc: [number, number, number],
  matrix: number[][]
): [number, number, number] => {
  const [x, y, z] = acc;
  return [
    matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
    matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
    matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z,
  ];
};

export const carState = atom<[number, number, number]>((get) => {
  const devicemotion = get(deviceMotionState);
  const matrix = get(matrixState);
  return transform(
    [
      devicemotion.acceleration.x,
      devicemotion.acceleration.y,
      devicemotion.acceleration.z,
    ],
    matrix
  );
});

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

export const geolocationState = atom<Geolocation | null>(null);

export const fusedState = atom<FusedState>({
  heading: 0,
  speed: 0,
  position: null,
  accuracy: Infinity,
  hasGps: false,
});

export const soundFreqState = atom<number>((get) => {
  const dm = get(deviceMotionState);
  return 442 + dm.acceleration.x * 100;
});

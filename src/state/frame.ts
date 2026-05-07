import { atom } from "jotai";
import { forwardDevState, gravityDevState } from "./calibration";
import { deviceMotionState } from "./motion";

type V3 = [number, number, number];
type M3 = [V3, V3, V3];

const identity = (): M3 => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

// Rows are car axes [right, forward, up] expressed in device frame.
// matrix · v_device = v_car.
export const matrixState = atom<M3>((get) => {
  const g = get(gravityDevState);
  const fw = get(forwardDevState);
  const gN = Math.hypot(g[0], g[1], g[2]);
  if (gN < 1) return identity();
  const u: V3 = [g[0] / gN, g[1] / gN, g[2] / gN];

  const fDotU = fw[0] * u[0] + fw[1] * u[1] + fw[2] * u[2];
  const fOrtho: V3 = [
    fw[0] - fDotU * u[0],
    fw[1] - fDotU * u[1],
    fw[2] - fDotU * u[2],
  ];
  const fn = Math.hypot(fOrtho[0], fOrtho[1], fOrtho[2]);
  if (fn < 1e-6) return identity();
  const f: V3 = [fOrtho[0] / fn, fOrtho[1] / fn, fOrtho[2] / fn];

  const r: V3 = [
    f[1] * u[2] - f[2] * u[1],
    f[2] * u[0] - f[0] * u[2],
    f[0] * u[1] - f[1] * u[0],
  ];
  return [
    [r[0], r[1], r[2]],
    [f[0], f[1], f[2]],
    [u[0], u[1], u[2]],
  ];
});

export const carState = atom<V3>((get) => {
  const dm = get(deviceMotionState);
  const M = get(matrixState);
  const x = dm.acceleration.x;
  const y = dm.acceleration.y;
  const z = dm.acceleration.z;
  return [
    M[0][0] * x + M[0][1] * y + M[0][2] * z,
    M[1][0] * x + M[1][1] * y + M[1][2] * z,
    M[2][0] * x + M[2][1] * y + M[2][2] * z,
  ];
});

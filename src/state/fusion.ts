import { atom, type Getter, type Setter } from "jotai";
import type { DeviceMotion } from "../type/type";
import { deviceMotionState } from "./sensor";

type V3 = [number, number, number];
type M3 = [V3, V3, V3];

// Long-term Kalman-like estimator for the forward axis. With no GPS we cannot
// resolve the +/- sign; we just track the dominant axis of horizontal
// acceleration via EMA covariance + 1 power-iteration step per frame.
const FORWARD_TAU = 60; // s

// gravity in device frame, taken instantaneously from accIG − acc.
// (DeviceMotionEvent: accelerationIncludingGravity = acceleration + gravity.)
const gravityDevState = atom<V3>([0, 0, 9.8]);

// 3x3 EMA covariance of horizontal acceleration (device frame).
const horizCovState = atom<M3>([
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
]);

// Forward unit vector in device frame.
const forwardDevState = atom<V3>([0, 1, 0]);

export const stepCalibrationFromImu = (
  get: Getter,
  set: Setter,
  m: DeviceMotion
) => {
  const dt = m.interval / 1000;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

  // 1. Gravity = accelerationIncludingGravity − acceleration (instantaneous).
  const gx = m.accelerationIncludingGravity.x - m.acceleration.x;
  const gy = m.accelerationIncludingGravity.y - m.acceleration.y;
  const gz = m.accelerationIncludingGravity.z - m.acceleration.z;
  const gN = Math.hypot(gx, gy, gz);
  if (gN < 1) return;
  set(gravityDevState, [gx, gy, gz]);
  const u: V3 = [gx / gN, gy / gN, gz / gN];

  // 2. Horizontal accel: gravity-removed accel projected onto plane ⊥ u.
  const a = m.acceleration;
  const aDotU = a.x * u[0] + a.y * u[1] + a.z * u[2];
  const v: V3 = [a.x - aDotU * u[0], a.y - aDotU * u[1], a.z - aDotU * u[2]];

  // 3. EMA update of covariance C ← (1-α) C + α v vᵀ.
  const C = get(horizCovState);
  const alpha = Math.min(1, dt / FORWARD_TAU);
  const C00 = C[0][0] + alpha * (v[0] * v[0] - C[0][0]);
  const C01 = C[0][1] + alpha * (v[0] * v[1] - C[0][1]);
  const C02 = C[0][2] + alpha * (v[0] * v[2] - C[0][2]);
  const C11 = C[1][1] + alpha * (v[1] * v[1] - C[1][1]);
  const C12 = C[1][2] + alpha * (v[1] * v[2] - C[1][2]);
  const C22 = C[2][2] + alpha * (v[2] * v[2] - C[2][2]);
  const newC: M3 = [
    [C00, C01, C02],
    [C01, C11, C12],
    [C02, C12, C22],
  ];
  set(horizCovState, newC);

  // 4. One power-iteration step toward the leading eigenvector of C, then
  //    project onto the horizontal plane and renormalize. This is the recursive
  //    long-term forward-axis estimate.
  const f = get(forwardDevState);
  const Cf: V3 = [
    C00 * f[0] + C01 * f[1] + C02 * f[2],
    C01 * f[0] + C11 * f[1] + C12 * f[2],
    C02 * f[0] + C12 * f[1] + C22 * f[2],
  ];
  const CfDotU = Cf[0] * u[0] + Cf[1] * u[1] + Cf[2] * u[2];
  const Cfh: V3 = [
    Cf[0] - CfDotU * u[0],
    Cf[1] - CfDotU * u[1],
    Cf[2] - CfDotU * u[2],
  ];
  const cn = Math.hypot(Cfh[0], Cfh[1], Cfh[2]);
  if (cn < 1e-6) return;
  // Keep sign continuous to avoid 180° flips between frames.
  const sign = Cfh[0] * f[0] + Cfh[1] * f[1] + Cfh[2] * f[2] >= 0 ? 1 : -1;
  set(forwardDevState, [
    (sign * Cfh[0]) / cn,
    (sign * Cfh[1]) / cn,
    (sign * Cfh[2]) / cn,
  ]);
};

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

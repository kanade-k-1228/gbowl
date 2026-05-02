import { atom, type Getter, type Setter } from "jotai";
import type { DeviceMotion } from "../type/type";
import { deviceMotionState } from "./sensor";

type V3 = [number, number, number];
type M3 = [V3, V3, V3];

// Long-term estimator for the forward axis. With no GPS we cannot resolve the
// +/- sign; we just track the dominant axis of horizontal acceleration via EMA
// covariance + closed-form 2×2 eigendecomposition in the horizontal plane.
const FORWARD_TAU = 60; // s

// gravity in device frame, taken instantaneously from accIG − acc.
// (DeviceMotionEvent: accelerationIncludingGravity = acceleration + gravity.)
export const gravityDevState = atom<V3>([0, 0, 9.8]);

// 3x3 EMA covariance of horizontal acceleration (device frame).
const horizCovState = atom<M3>([
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
]);

// Forward unit vector in device frame.
export const forwardDevState = atom<V3>([0, 1, 0]);

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

  // 4. Leading eigenvector of C in the horizontal plane (⊥ u). Build an
  //    orthonormal basis (e1, e2) of that plane, project C into 2D, and solve
  //    the 2×2 eigenproblem in closed form. Avoids the power-iteration failure
  //    mode where the previous f happens to be orthogonal to the leading
  //    eigenvector (e.g., vertical phone mount with car's forward axis along
  //    device Z — there f stays stuck at the initial guess).
  const aux: V3 = Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1raw: V3 = [
    u[1] * aux[2] - u[2] * aux[1],
    u[2] * aux[0] - u[0] * aux[2],
    u[0] * aux[1] - u[1] * aux[0],
  ];
  const e1n = Math.hypot(e1raw[0], e1raw[1], e1raw[2]);
  if (e1n < 1e-6) return;
  const e1: V3 = [e1raw[0] / e1n, e1raw[1] / e1n, e1raw[2] / e1n];
  const e2: V3 = [
    u[1] * e1[2] - u[2] * e1[1],
    u[2] * e1[0] - u[0] * e1[2],
    u[0] * e1[1] - u[1] * e1[0],
  ];

  const Ce1: V3 = [
    C00 * e1[0] + C01 * e1[1] + C02 * e1[2],
    C01 * e1[0] + C11 * e1[1] + C12 * e1[2],
    C02 * e1[0] + C12 * e1[1] + C22 * e1[2],
  ];
  const Ce2: V3 = [
    C00 * e2[0] + C01 * e2[1] + C02 * e2[2],
    C01 * e2[0] + C11 * e2[1] + C12 * e2[2],
    C02 * e2[0] + C12 * e2[1] + C22 * e2[2],
  ];
  const A = e1[0] * Ce1[0] + e1[1] * Ce1[1] + e1[2] * Ce1[2];
  const B = e1[0] * Ce2[0] + e1[1] * Ce2[1] + e1[2] * Ce2[2];
  const D = e2[0] * Ce2[0] + e2[1] * Ce2[1] + e2[2] * Ce2[2];

  if (A + D < 1e-9) return; // No horizontal accel signal yet.

  const trace = A + D;
  const disc = Math.sqrt((A - D) * (A - D) + 4 * B * B);
  const lambda = (trace + disc) / 2;
  let v1: number;
  let v2: number;
  if (Math.abs(B) > 1e-9) {
    v1 = lambda - D;
    v2 = B;
  } else {
    v1 = A >= D ? 1 : 0;
    v2 = A >= D ? 0 : 1;
  }
  const vn = Math.hypot(v1, v2);
  v1 /= vn;
  v2 /= vn;

  let nfx = v1 * e1[0] + v2 * e2[0];
  let nfy = v1 * e1[1] + v2 * e2[1];
  let nfz = v1 * e1[2] + v2 * e2[2];

  // Keep sign continuous with previous estimate to avoid 180° flips.
  const f = get(forwardDevState);
  if (nfx * f[0] + nfy * f[1] + nfz * f[2] < 0) {
    nfx = -nfx;
    nfy = -nfy;
    nfz = -nfz;
  }
  set(forwardDevState, [nfx, nfy, nfz]);
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

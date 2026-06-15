import { atom, type Getter, type Setter } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { DeviceMotion, M3, V3 } from "../type/type";
import { gpsMotionState } from "./gps";
import { deviceMotionState } from "./motion";
import {
  deviceOrientationState,
  orientationGravityState,
  orientationMatrixState,
} from "./orientation";

// device frame における重力ベクトルと前方軸。動的キャリブが毎フレーム EMA 更新し、
// localStorage に保存する。次回起動時は前回値が復元され、収束まで引き継ぐ。
// forward デフォルト [0,1,0] = 縦持ちで画面上端が車の前方。
export const gravityDevState = atomWithStorage<V3>(
  "gbowl.calibration.gravity",
  [0, 0, 9.8]
);
export const forwardDevState = atomWithStorage<V3>(
  "gbowl.calibration.forward",
  [0, 1, 0]
);

// 動的キャリブの調整パラメータ (Settings のスライダーで露出)。
export const upTauState = atomWithStorage("gbowl.estimation.upTau", 0.5);
export const fwdTauState = atomWithStorage("gbowl.estimation.fwdTau", 8);
export const speedMinState = atomWithStorage("gbowl.estimation.speedMin", 5);

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

// 曲線中は遠心力が forward 推定をバイアスさせるので、ヨーレートが大きいフレームは
// forward 更新をスキップする。
const YAW_GATE = 8; // deg/s
const GRAVITY_TAU_FALLBACK = 2; // s, DeviceOrientation 非対応時の重力 EMA

const lerp3 = (a: V3, b: V3, t: number): V3 => [
  a[0] + t * (b[0] - a[0]),
  a[1] + t * (b[1] - a[1]),
  a[2] + t * (b[2] - a[2]),
];

const normalize = (v: V3): V3 | null => {
  const n = Math.hypot(v[0], v[1], v[2]);
  return n > 1e-6 ? [v[0] / n, v[1] / n, v[2] / n] : null;
};

// 毎 motion イベントで呼ばれ、DeviceOrientation/GPS から up/forward を動的補正する。
// matrixState 経由で bowl/series がこの結果を読むので、他 step より先に呼ぶ。
export const stepEstimateFrame = (
  get: Getter,
  set: Setter,
  m: DeviceMotion
) => {
  const dt = m.interval / 1000;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

  // --- up (gravity) 動的更新 ---
  const prevG = get(gravityDevState);
  const gOri = get(orientationGravityState);
  if (gOri) {
    // DeviceOrientation の融合済み重力。速い時定数で追従。
    const aUp = Math.min(1, dt / get(upTauState));
    set(gravityDevState, lerp3(prevG, gOri, aUp));
  } else {
    // フォールバック: accIG - acc を上向き重力として EMA (時定数 2s 固定)。
    const gx = m.accelerationIncludingGravity.x - m.acceleration.x;
    const gy = m.accelerationIncludingGravity.y - m.acceleration.y;
    const gz = m.accelerationIncludingGravity.z - m.acceleration.z;
    if (Math.hypot(gx, gy, gz) >= 1) {
      const aUp = Math.min(1, dt / GRAVITY_TAU_FALLBACK);
      set(gravityDevState, lerp3(prevG, [gx, gy, gz], aUp));
    }
  }

  // --- forward 動的更新 (絶対方位 + 高速 + 直進時のみ) ---
  const R = get(orientationMatrixState);
  const o = get(deviceOrientationState);
  const gps = get(gpsMotionState);
  const hasAbsolute =
    o.headingSource === "ios-compass" || o.headingSource === "android-absolute";
  if (
    !R ||
    !hasAbsolute ||
    !gps ||
    gps.speed === null ||
    gps.speed < get(speedMinState) ||
    gps.heading === null ||
    !Number.isFinite(gps.heading)
  ) {
    return;
  }

  // 直進ゲート: up 軸まわりのヨーレート (matrixState は up 更新済み)。
  const M = get(matrixState);
  const r = m.rotationRate;
  const yaw = M[2][0] * r.alpha + M[2][1] * r.beta + M[2][2] * r.gamma;
  if (Math.abs(yaw) >= YAW_GATE) return;

  // world 水平の車前方 [sin h, cos h, 0] を device frame へ: fwd = Rᵀ·worldFwd。
  const h = (gps.heading * Math.PI) / 180;
  const sh = Math.sin(h);
  const ch = Math.cos(h);
  const fwd = normalize([
    R[0][0] * sh + R[1][0] * ch,
    R[0][1] * sh + R[1][1] * ch,
    R[0][2] * sh + R[1][2] * ch,
  ]);
  if (!fwd) return;

  const aFwd = Math.min(1, dt / get(fwdTauState));
  const blended = normalize(lerp3(get(forwardDevState), fwd, aFwd));
  if (blended) set(forwardDevState, blended);
};

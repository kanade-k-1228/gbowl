import { atom, type Getter, type Setter } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { DeviceMotion } from "../type/type";

type V3 = [number, number, number];
type Vec2 = [number, number];

// device frame における重力ベクトルと前方軸。どちらもキャリブモード完了時に
// 確定され localStorage に保存される。次回起動時はそれが復元されるので、
// 再キャリブするまで前回値を引き継ぐ。
export const gravityDevState = atomWithStorage<V3>(
  "gbowl.calibration.gravity",
  [0, 0, 9.8]
);
export const forwardDevState = atomWithStorage<V3>(
  "gbowl.calibration.forward",
  [0, 1, 0]
);

// キャリブレーションモードかどうか。true の間だけ GPS と IMU 経路を集めて
// 経路マッチングが走り、確定したら自動的に false に戻る。
export const calibrationModeState = atom(false);

// キャリブ中に EMA で平均した重力ベクトル(デバイス座標系)。完了時に
// gravityDevState へ書き込まれて確定する。
const calibGravityState = atom<V3 | null>(null);

// IMU 水平面の正規直交基底 (e1, e2)。キャリブ中の重力 EMA から派生。
type Basis = { e1: V3; e2: V3 };
const calibBasisState = atom<Basis | null>(null);

// IMU 経路 (basis 平面での 2D 速度と位置)。dt 毎に積分。
const calibImuVelState = atom<Vec2>([0, 0]);
const calibImuPosState = atom<Vec2>([0, 0]);

type Sample = { t: number; imu: Vec2; gps: Vec2 };
export const calibrationSamplesState = atom<Sample[]>([]);

// GPS 原点 (基準)。最初の fix で固定し、以降は ENU (m) に変換。
const calibGpsOriginState = atom<{ lat: number; lng: number } | null>(null);

export type CalibrationFit = {
  theta: number;
  scale: number;
  r2: number;
  forward: V3 | null;
};
export const calibrationFitState = atom<CalibrationFit>({
  theta: 0,
  scale: 0,
  r2: 0,
  forward: null,
});

// 自動終了の閾値とサンプル数の上限。
const FIT_R2_THRESHOLD = 0.7;
const MIN_SAMPLES = 15;
const MAX_SAMPLES = 200;
const VEL_DECAY_TAU = 15; // 速度ドリフト抑制 (s)
const GRAVITY_TAU = 2; // 重力 EMA 時定数 (s)

export const startCalibrationAction = atom(null, (_get, set) => {
  set(calibrationModeState, true);
  set(calibGravityState, null);
  set(calibBasisState, null);
  set(calibImuVelState, [0, 0]);
  set(calibImuPosState, [0, 0]);
  set(calibrationSamplesState, []);
  set(calibGpsOriginState, null);
  set(calibrationFitState, { theta: 0, scale: 0, r2: 0, forward: null });
});

export const stopCalibrationAction = atom(null, (_get, set) => {
  set(calibrationModeState, false);
});

const buildBasis = (g: V3): Basis | null => {
  const gN = Math.hypot(g[0], g[1], g[2]);
  if (gN < 1) return null;
  const u: V3 = [g[0] / gN, g[1] / gN, g[2] / gN];
  const aux: V3 = Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1raw: V3 = [
    u[1] * aux[2] - u[2] * aux[1],
    u[2] * aux[0] - u[0] * aux[2],
    u[0] * aux[1] - u[1] * aux[0],
  ];
  const e1n = Math.hypot(e1raw[0], e1raw[1], e1raw[2]);
  if (e1n < 1e-6) return null;
  const e1: V3 = [e1raw[0] / e1n, e1raw[1] / e1n, e1raw[2] / e1n];
  const e2: V3 = [
    u[1] * e1[2] - u[2] * e1[1],
    u[2] * e1[0] - u[0] * e1[2],
    u[0] * e1[1] - u[1] * e1[0],
  ];
  return { e1, e2 };
};

// キャリブモード中だけ呼ばれる: 重力を EMA で平均しつつ、線形加速度を
// 水平面に射影して 2D 経路を積分する。
export const stepCalibrationImu = (
  get: Getter,
  set: Setter,
  m: DeviceMotion
) => {
  if (!get(calibrationModeState)) return;
  const dt = m.interval / 1000;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

  // 瞬時重力 g_inst = accIG − acc。EMA で平均して安定化させる。
  const gix = m.accelerationIncludingGravity.x - m.acceleration.x;
  const giy = m.accelerationIncludingGravity.y - m.acceleration.y;
  const giz = m.accelerationIncludingGravity.z - m.acceleration.z;
  if (Math.hypot(gix, giy, giz) < 1) return;
  const prevG = get(calibGravityState);
  const aG = Math.min(1, dt / GRAVITY_TAU);
  const g: V3 = prevG
    ? [
        prevG[0] + aG * (gix - prevG[0]),
        prevG[1] + aG * (giy - prevG[1]),
        prevG[2] + aG * (giz - prevG[2]),
      ]
    : [gix, giy, giz];
  set(calibGravityState, g);

  let basis = get(calibBasisState);
  if (!basis) {
    basis = buildBasis(g);
    if (!basis) return;
    set(calibBasisState, basis);
    return;
  }

  const gN = Math.hypot(g[0], g[1], g[2]);
  const u: V3 = [g[0] / gN, g[1] / gN, g[2] / gN];

  const a = m.acceleration;
  const aDotU = a.x * u[0] + a.y * u[1] + a.z * u[2];
  const ax = a.x - aDotU * u[0];
  const ay = a.y - aDotU * u[1];
  const az = a.z - aDotU * u[2];
  const a1 = ax * basis.e1[0] + ay * basis.e1[1] + az * basis.e1[2];
  const a2 = ax * basis.e2[0] + ay * basis.e2[1] + az * basis.e2[2];

  const decay = Math.exp(-dt / VEL_DECAY_TAU);
  const vel = get(calibImuVelState);
  const newV: Vec2 = [(vel[0] + a1 * dt) * decay, (vel[1] + a2 * dt) * decay];
  set(calibImuVelState, newV);
  const pos = get(calibImuPosState);
  set(calibImuPosState, [pos[0] + newV[0] * dt, pos[1] + newV[1] * dt]);
};

// GPS の 1 サンプル取り込み。ENU(m) に変換 → IMU 経路と対にして保存
// → 経路マッチング → 一致率が閾値を超えたら回転行列を確定して終了。
export const ingestGpsSample = atom(
  null,
  (get, set, p: { lat: number; lng: number; t: number; accuracy: number }) => {
    if (!get(calibrationModeState)) return;
    let origin = get(calibGpsOriginState);
    if (!origin) {
      origin = { lat: p.lat, lng: p.lng };
      set(calibGpsOriginState, origin);
    }
    const latRad = (origin.lat * Math.PI) / 180;
    const east = (p.lng - origin.lng) * 111320 * Math.cos(latRad);
    const north = (p.lat - origin.lat) * 111320;
    const imu = get(calibImuPosState);
    const sample: Sample = {
      t: p.t,
      imu: [imu[0], imu[1]],
      gps: [east, north],
    };
    const samples = [...get(calibrationSamplesState), sample].slice(
      -MAX_SAMPLES
    );
    set(calibrationSamplesState, samples);
    if (samples.length < MIN_SAMPLES) return;

    const fit = computeFit(samples);
    const basis = get(calibBasisState);
    const forward = basis ? estimateForward(samples, fit.theta, basis) : null;
    set(calibrationFitState, { ...fit, forward });

    if (fit.r2 >= FIT_R2_THRESHOLD && forward) {
      const g = get(calibGravityState);
      if (g) set(gravityDevState, g);
      set(forwardDevState, forward);
      set(calibrationModeState, false);
    }
  }
);

// 2D Procrustes: imu 点群 → gps 点群 への最適回転 θ + 等方スケールを求める。
const computeFit = (samples: Sample[]) => {
  const n = samples.length;
  let cIx = 0;
  let cIy = 0;
  let cGx = 0;
  let cGy = 0;
  for (const s of samples) {
    cIx += s.imu[0];
    cIy += s.imu[1];
    cGx += s.gps[0];
    cGy += s.gps[1];
  }
  cIx /= n;
  cIy /= n;
  cGx /= n;
  cGy /= n;
  let h11 = 0;
  let h12 = 0;
  let h21 = 0;
  let h22 = 0;
  let ssI = 0;
  let ssG = 0;
  for (const sm of samples) {
    const ix = sm.imu[0] - cIx;
    const iy = sm.imu[1] - cIy;
    const gx = sm.gps[0] - cGx;
    const gy = sm.gps[1] - cGy;
    h11 += ix * gx;
    h12 += ix * gy;
    h21 += iy * gx;
    h22 += iy * gy;
    ssI += ix * ix + iy * iy;
    ssG += gx * gx + gy * gy;
  }
  const theta = Math.atan2(h12 - h21, h11 + h22);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const scale = (c * (h11 + h22) + s * (h12 - h21)) / Math.max(ssI, 1e-9);
  let ssRes = 0;
  for (const sm of samples) {
    const ix = sm.imu[0] - cIx;
    const iy = sm.imu[1] - cIy;
    const gx = sm.gps[0] - cGx;
    const gy = sm.gps[1] - cGy;
    const px = scale * (c * ix - s * iy);
    const py = scale * (s * ix + c * iy);
    ssRes += (px - gx) ** 2 + (py - gy) ** 2;
  }
  const r2 = 1 - ssRes / Math.max(ssG, 1e-9);
  return { theta, scale, r2 };
};

// 直近サンプルの GPS 進行方向ベクトルを imu 平面に逆回転で戻し、basis で
// device frame の 3D 単位ベクトルに持ち上げて「車の前方軸」とする。
const estimateForward = (
  samples: Sample[],
  theta: number,
  basis: Basis
): V3 | null => {
  const n = samples.length;
  if (n < 2) return null;
  const last = samples[n - 1];
  const prev = samples[Math.max(0, n - 5)];
  const dx = last.gps[0] - prev.gps[0];
  const dy = last.gps[1] - prev.gps[1];
  const dN = Math.hypot(dx, dy);
  if (dN < 1) return null;
  const c = Math.cos(-theta);
  const s = Math.sin(-theta);
  const i1 = (c * dx - s * dy) / dN;
  const i2 = (s * dx + c * dy) / dN;
  return [
    i1 * basis.e1[0] + i2 * basis.e2[0],
    i1 * basis.e1[1] + i2 * basis.e2[1],
    i1 * basis.e1[2] + i2 * basis.e2[2],
  ];
};

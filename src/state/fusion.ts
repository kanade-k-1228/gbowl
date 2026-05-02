import { atom, type Getter, type Setter } from "jotai";
import type { DeviceMotion, FusedState, Geolocation } from "../type/type";
import { deviceMotionState } from "./sensor";

type V3 = [number, number, number];

// ============================================================
// Tunables
// ============================================================

const GRAVITY_TAU = 5; // s
const HORIZ_ACCEL_TAU = 1; // s
const ALPHA_FORWARD = 0.1;
const MIN_GPS_ACCEL = 0.5; // m/s²
const MIN_HORIZ_ACCEL = 0.3; // m/s²

const ALPHA_HEADING = 0.1;
const ALPHA_SPEED = 0.3;
const GPS_HEADING_MIN_SPEED = 1.5; // m/s

const DEG2RAD = Math.PI / 180;

// ============================================================
// Calibration: continuous estimation of gravity (up) + forward
// ============================================================

const gravityDevState = atom<V3>([0, 0, 9.8]);
const horizAccelLpState = atom<V3>([0, 0, 0]);
const forwardDevState = atom<V3>([0, 1, 0]);
const lastGpsForCalibState = atom<{
  speed: number;
  timestamp: number;
} | null>(null);

export const stepCalibrationFromImu = (
  get: Getter,
  set: Setter,
  motion: DeviceMotion
) => {
  const dt = motion.interval / 1000;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

  // Gravity LPF
  const g = get(gravityDevState);
  const ag = motion.accelerationIncludingGravity;
  const aG = Math.min(1, dt / GRAVITY_TAU);
  const newG: V3 = [
    g[0] + aG * (ag.x - g[0]),
    g[1] + aG * (ag.y - g[1]),
    g[2] + aG * (ag.z - g[2]),
  ];
  set(gravityDevState, newG);

  const gN = Math.hypot(newG[0], newG[1], newG[2]);
  if (gN < 1) return;
  const u: V3 = [newG[0] / gN, newG[1] / gN, newG[2] / gN];

  // Horizontal accel (gravity-removed → projected onto plane ⊥ up) LPF
  const a = motion.acceleration;
  const aDotU = a.x * u[0] + a.y * u[1] + a.z * u[2];
  const aH: V3 = [a.x - aDotU * u[0], a.y - aDotU * u[1], a.z - aDotU * u[2]];
  const h = get(horizAccelLpState);
  const aHa = Math.min(1, dt / HORIZ_ACCEL_TAU);
  set(horizAccelLpState, [
    h[0] + aHa * (aH[0] - h[0]),
    h[1] + aHa * (aH[1] - h[1]),
    h[2] + aHa * (aH[2] - h[2]),
  ]);
};

export const stepCalibrationFromGps = (
  get: Getter,
  set: Setter,
  geo: Geolocation
) => {
  if (geo.speed == null) return;
  const last = get(lastGpsForCalibState);
  set(lastGpsForCalibState, { speed: geo.speed, timestamp: geo.timestamp });
  if (!last) return;

  const dt = (geo.timestamp - last.timestamp) / 1000;
  if (dt <= 0 || dt > 5) return;

  const dv = geo.speed - last.speed;
  if (Math.abs(dv / dt) < MIN_GPS_ACCEL) return;

  const h = get(horizAccelLpState);
  const hN = Math.hypot(h[0], h[1], h[2]);
  if (hN < MIN_HORIZ_ACCEL) return;

  const sign = Math.sign(dv);
  const observed: V3 = [
    (sign * h[0]) / hN,
    (sign * h[1]) / hN,
    (sign * h[2]) / hN,
  ];

  const f = get(forwardDevState);
  set(forwardDevState, [
    f[0] + ALPHA_FORWARD * (observed[0] - f[0]),
    f[1] + ALPHA_FORWARD * (observed[1] - f[1]),
    f[2] + ALPHA_FORWARD * (observed[2] - f[2]),
  ]);
};

// matrixState: derived from gravity + forward (Gram-Schmidt orthonormalization)
// Rows are car axes expressed in device frame: [right, forward, up].
// matrix · v_device = v_car.
export const matrixState = atom<number[][]>((get) => {
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

const identity = (): number[][] => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

// carState: gravity-removed accel transformed into car frame.
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

// ============================================================
// Filter: complementary heading + speed
// ============================================================

const filterInternal = atom<{ heading: number; speed: number }>({
  heading: 0,
  speed: 0,
});
const lastGpsForFilterState = atom<number | null>(null);

const fusedRaw = atom<FusedState>({
  heading: 0,
  speed: 0,
  position: null,
  accuracy: Number.POSITIVE_INFINITY,
  hasGps: false,
});
export const fusedState = atom<FusedState>((get) => get(fusedRaw));

const wrapPi = (a: number) => {
  let x = a % (2 * Math.PI);
  if (x > Math.PI) x -= 2 * Math.PI;
  if (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

// Sign convention notes:
// - heading: rad, 0=north, +CW (matches GPS course).
// - rotationRate.alpha is yaw rate around device z; flip sign so right turn = +Δheading.
// - car frame: x=right, y=forward, z=up. Forward acceleration is car[1].
export const stepFilterPredict = (
  get: Getter,
  set: Setter,
  motion: DeviceMotion
) => {
  const dt = motion.interval / 1000;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

  const M = get(matrixState);
  const a = motion.acceleration;
  const fwdAccel = M[1][0] * a.x + M[1][1] * a.y + M[1][2] * a.z;

  const yawRate = -motion.rotationRate.alpha * DEG2RAD;
  const s = get(filterInternal);
  const heading = wrapPi(s.heading + yawRate * dt);
  const speed = s.speed + fwdAccel * dt;
  set(filterInternal, { heading, speed });

  const prev = get(fusedRaw);
  set(fusedRaw, { ...prev, heading, speed });
};

export const stepFilterCorrect = (
  get: Getter,
  set: Setter,
  geo: Geolocation
) => {
  const lastTs = get(lastGpsForFilterState);
  if (geo.timestamp === lastTs) return;
  set(lastGpsForFilterState, geo.timestamp);

  const s = get(filterInternal);
  let { heading, speed } = s;

  if (geo.speed != null && geo.speed >= 0) {
    speed = (1 - ALPHA_SPEED) * speed + ALPHA_SPEED * geo.speed;
  }
  if (
    geo.heading != null &&
    Number.isFinite(geo.heading) &&
    Math.abs(speed) > GPS_HEADING_MIN_SPEED
  ) {
    const gpsHead = geo.heading * DEG2RAD;
    const diff = wrapPi(gpsHead - heading);
    heading = wrapPi(heading + ALPHA_HEADING * diff);
  }
  set(filterInternal, { heading, speed });
  set(fusedRaw, {
    heading,
    speed,
    position: { latitude: geo.latitude, longitude: geo.longitude },
    accuracy: geo.accuracy,
    hasGps: true,
  });
};

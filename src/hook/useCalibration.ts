import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  deviceMotionState,
  geolocationState,
  matrixState,
} from "../state/state";

// Time constants for the low-pass filters.
const GRAVITY_TAU = 5; // s — gravity direction settles slowly to reject motion
const HORIZ_ACCEL_TAU = 1; // s — horizontal accel buffer for forward inference

// Forward EMA weight applied per qualifying GPS sample.
const ALPHA_FORWARD = 0.1;

// Thresholds for accepting a forward observation.
const MIN_GPS_ACCEL = 0.5; // m/s² — below this the GPS speed delta is noise
const MIN_HORIZ_ACCEL = 0.3; // m/s² — and the IMU must agree there's motion

type V3 = [number, number, number];

const norm = (v: V3) => Math.hypot(v[0], v[1], v[2]);
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// Build a device→car rotation matrix from estimated up & forward directions
// (both expressed in device frame). matrix · v_device = v_car.
// Rows are car axes expressed in device frame: [right, forward, up].
const buildMatrix = (up: V3, forward: V3): number[][] => {
  // Re-orthogonalize forward against up
  const fDotU = dot(forward, up);
  const fOrtho: V3 = [
    forward[0] - fDotU * up[0],
    forward[1] - fDotU * up[1],
    forward[2] - fDotU * up[2],
  ];
  const fn = norm(fOrtho);
  if (fn < 1e-6) {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
  }
  const f: V3 = [fOrtho[0] / fn, fOrtho[1] / fn, fOrtho[2] / fn];
  // right = forward × up gives a right-handed {right, forward, up} basis.
  const r = cross(f, up);
  return [
    [r[0], r[1], r[2]],
    [f[0], f[1], f[2]],
    [up[0], up[1], up[2]],
  ];
};

export const useCalibration = (enabled = true) => {
  const motion = useAtomValue(deviceMotionState);
  const geo = useAtomValue(geolocationState);
  const setMatrix = useSetAtom(matrixState);

  // Calibration state lives in refs so we don't re-render on every update.
  const gravityRef = useRef<V3>([0, 0, 9.8]);
  const horizAccelRef = useRef<V3>([0, 0, 0]);
  const forwardRef = useRef<V3>([0, 1, 0]);
  const lastGpsRef = useRef<{ speed: number; timestamp: number } | null>(null);

  // Per IMU frame: update gravity LPF, horizontal-accel LPF, rebuild matrix.
  useEffect(() => {
    if (!enabled) return;
    const dt = motion.interval / 1000;
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

    const ag = motion.accelerationIncludingGravity;
    const a = motion.acceleration;

    const aG = Math.min(1, dt / GRAVITY_TAU);
    const g = gravityRef.current;
    g[0] += aG * (ag.x - g[0]);
    g[1] += aG * (ag.y - g[1]);
    g[2] += aG * (ag.z - g[2]);

    const gN = norm(g);
    if (gN < 1) return;
    const u: V3 = [g[0] / gN, g[1] / gN, g[2] / gN];

    // Project gravity-removed accel onto the horizontal plane.
    const aVec: V3 = [a.x, a.y, a.z];
    const aDotU = dot(aVec, u);
    const aH: V3 = [
      aVec[0] - aDotU * u[0],
      aVec[1] - aDotU * u[1],
      aVec[2] - aDotU * u[2],
    ];

    const aHa = Math.min(1, dt / HORIZ_ACCEL_TAU);
    const h = horizAccelRef.current;
    h[0] += aHa * (aH[0] - h[0]);
    h[1] += aHa * (aH[1] - h[1]);
    h[2] += aHa * (aH[2] - h[2]);

    setMatrix(buildMatrix(u, forwardRef.current));
  }, [motion, enabled, setMatrix]);

  // Per GPS update: if the speed change confirms a longitudinal event,
  // use the buffered horizontal accel direction (signed by accel/decel) as
  // a forward observation and EMA-blend it into the forward estimate.
  useEffect(() => {
    if (!enabled) return;
    if (!geo || geo.speed == null) return;

    const last = lastGpsRef.current;
    lastGpsRef.current = { speed: geo.speed, timestamp: geo.timestamp };
    if (!last) return;

    const dt = (geo.timestamp - last.timestamp) / 1000;
    if (dt <= 0 || dt > 5) return;

    const dv = geo.speed - last.speed;
    if (Math.abs(dv / dt) < MIN_GPS_ACCEL) return;

    const h = horizAccelRef.current;
    const hN = norm(h);
    if (hN < MIN_HORIZ_ACCEL) return;

    // Decel → horizontal accel points opposite of motion, so flip.
    const sign = Math.sign(dv);
    const observed: V3 = [
      (sign * h[0]) / hN,
      (sign * h[1]) / hN,
      (sign * h[2]) / hN,
    ];

    const f = forwardRef.current;
    f[0] += ALPHA_FORWARD * (observed[0] - f[0]);
    f[1] += ALPHA_FORWARD * (observed[1] - f[1]);
    f[2] += ALPHA_FORWARD * (observed[2] - f[2]);
  }, [geo, enabled]);
};

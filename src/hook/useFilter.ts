import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  carState,
  deviceMotionState,
  fusedState,
  geolocationState,
} from "../state/state";

const DEG2RAD = Math.PI / 180;

// Complementary filter weights applied per GPS update.
// Closer to 0 = trust IMU more (smooth, drifts); closer to 1 = trust GPS more (jumpy, drift-free).
const ALPHA_HEADING = 0.1;
const ALPHA_SPEED = 0.3;

// Below this speed GPS course is dominated by noise, so we skip the heading correction.
const GPS_HEADING_MIN_SPEED = 1.5; // m/s

// Convention:
// - Vehicle yaw is around the vertical (z) axis. After calibration (matrixState),
//   the device frame is aligned with the car frame; rotationRate.alpha is then
//   approximately the yaw rate. Sign chosen so that a right turn (clockwise from
//   above) increases heading, matching GPS course (0=N, +CW).
// - Car frame: x = right, y = forward, z = up. Forward acceleration is carState[1].
// Flip the signs below if your calibration produces the opposite axes.
const yawRateFromGyro = (alphaDegPerSec: number) => -alphaDegPerSec * DEG2RAD;
const forwardAccel = (car: readonly [number, number, number]) => car[1];

const wrapPi = (a: number) => {
  let x = a % (2 * Math.PI);
  if (x > Math.PI) x -= 2 * Math.PI;
  if (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

export const useFilter = () => {
  const motion = useAtomValue(deviceMotionState);
  const car = useAtomValue(carState);
  const geo = useAtomValue(geolocationState);
  const setFused = useSetAtom(fusedState);

  const stateRef = useRef({ heading: 0, speed: 0 });
  const lastGpsTsRef = useRef<number | null>(null);

  // IMU prediction (runs on every devicemotion update).
  useEffect(() => {
    const dt = motion.interval / 1000;
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

    const s = stateRef.current;
    s.heading = wrapPi(
      s.heading + yawRateFromGyro(motion.rotationRate.alpha) * dt
    );
    s.speed = s.speed + forwardAccel(car) * dt;

    setFused((prev) => ({
      ...prev,
      heading: s.heading,
      speed: s.speed,
    }));
  }, [motion, car, setFused]);

  // GPS correction (runs only when a new fix arrives).
  useEffect(() => {
    if (!geo) return;
    if (geo.timestamp === lastGpsTsRef.current) return;
    lastGpsTsRef.current = geo.timestamp;

    const s = stateRef.current;

    if (geo.speed != null && geo.speed >= 0) {
      s.speed = (1 - ALPHA_SPEED) * s.speed + ALPHA_SPEED * geo.speed;
    }

    if (
      geo.heading != null &&
      Number.isFinite(geo.heading) &&
      Math.abs(s.speed) > GPS_HEADING_MIN_SPEED
    ) {
      const gpsHeadingRad = geo.heading * DEG2RAD;
      const diff = wrapPi(gpsHeadingRad - s.heading);
      s.heading = wrapPi(s.heading + ALPHA_HEADING * diff);
    }

    setFused({
      heading: s.heading,
      speed: s.speed,
      position: { latitude: geo.latitude, longitude: geo.longitude },
      accuracy: geo.accuracy,
      hasGps: true,
    });
  }, [geo, setFused]);
};

import { atom, type Getter, type Setter } from "jotai";
import type { DeviceMotion } from "../type/type";
import { matrixState } from "./fusion";

// ============================================================
// Bowl simulation
//
// A ball sits in a paraboloid bowl mounted on the car. As the car
// accelerates, the ball experiences a pseudo-force opposite to the
// acceleration (inertia), gets restored toward center by gravity along
// the bowl's slope, and is damped by rolling friction.
//
// Equations (per axis, small-angle approximation):
//   d²u/dt² = -ω² u  -  2ζω du/dt  -  a_car · ω²/g
//
// Where u ∈ [-1, 1] is normalized to bowl radius. Tuned so a sustained
// 1g lateral acceleration parks the ball on the rim.
// ============================================================

const OMEGA = 10; // rad/s — natural frequency (bowl steepness)
const ZETA = 0.7; // damping ratio (≈ critical for snappy response)
const G = 9.8; // m/s²

const OMEGA_SQ = OMEGA * OMEGA;
const DAMPING = 2 * ZETA * OMEGA;
const ACCEL_FACTOR = OMEGA_SQ / G;

type Vec2 = { x: number; y: number };

const ballPosState = atom<Vec2>({ x: 0, y: 0 });
const ballVelState = atom<Vec2>({ x: 0, y: 0 });

// Public read-only ball position in bowl-fraction units (-1..1).
export const bowlState = atom<Vec2>((get) => get(ballPosState));

export const stepBowlSimulation = (
  get: Getter,
  set: Setter,
  motion: DeviceMotion
) => {
  const dt = motion.interval / 1000;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

  // Acceleration in car frame (x=right, y=forward).
  const M = get(matrixState);
  const a = motion.acceleration;
  const ax = M[0][0] * a.x + M[0][1] * a.y + M[0][2] * a.z;
  const ay = M[1][0] * a.x + M[1][1] * a.y + M[1][2] * a.z;

  const pos = get(ballPosState);
  const vel = get(ballVelState);

  const accBallX = -OMEGA_SQ * pos.x - DAMPING * vel.x - ax * ACCEL_FACTOR;
  const accBallY = -OMEGA_SQ * pos.y - DAMPING * vel.y - ay * ACCEL_FACTOR;

  // Semi-implicit Euler.
  let newVx = vel.x + accBallX * dt;
  let newVy = vel.y + accBallY * dt;
  let newPx = pos.x + newVx * dt;
  let newPy = pos.y + newVy * dt;

  // Rim constraint: clamp to unit circle and kill the outward radial velocity.
  const r = Math.hypot(newPx, newPy);
  if (r > 1) {
    newPx /= r;
    newPy /= r;
    const nx = newPx;
    const ny = newPy;
    const radialV = newVx * nx + newVy * ny;
    if (radialV > 0) {
      newVx -= radialV * nx;
      newVy -= radialV * ny;
    }
  }

  set(ballPosState, { x: newPx, y: newPy });
  set(ballVelState, { x: newVx, y: newVy });
};

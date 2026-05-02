import { atom, type Getter, type Setter } from "jotai";
import type { DeviceMotion } from "../type/type";
import { matrixState } from "./fusion";

// ============================================================
// Bowl simulation — equivalent to a 2nd-order LPF on -a_car.
//
//   d²u/dt² = -ω² u  -  2ζω du/dt  -  a_car · ω²/g
//
// Output u is unbounded; saturation/clamping is the view's concern.
// ============================================================

const OMEGA = 10; // rad/s — natural frequency
const ZETA = 1.4; // damping ratio (overdamped — no overshoot, slower return)
const G = 9.8; // m/s²

const OMEGA_SQ = OMEGA * OMEGA;
const DAMPING = 2 * ZETA * OMEGA;
const ACCEL_FACTOR = OMEGA_SQ / G;

type Vec2 = { x: number; y: number };

const ballPosState = atom<Vec2>({ x: 0, y: 0 });
const ballVelState = atom<Vec2>({ x: 0, y: 0 });

export const bowlState = atom<Vec2>((get) => get(ballPosState));

export const stepBowlSimulation = (
  get: Getter,
  set: Setter,
  motion: DeviceMotion
) => {
  const dt = motion.interval / 1000;
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.5) return;

  const M = get(matrixState);
  const a = motion.acceleration;
  const ax = M[0][0] * a.x + M[0][1] * a.y + M[0][2] * a.z;
  const ay = M[1][0] * a.x + M[1][1] * a.y + M[1][2] * a.z;

  const pos = get(ballPosState);
  const vel = get(ballVelState);

  const accBallX = -OMEGA_SQ * pos.x - DAMPING * vel.x - ax * ACCEL_FACTOR;
  const accBallY = -OMEGA_SQ * pos.y - DAMPING * vel.y - ay * ACCEL_FACTOR;

  const newVx = vel.x + accBallX * dt;
  const newVy = vel.y + accBallY * dt;
  const newPx = pos.x + newVx * dt;
  const newPy = pos.y + newVy * dt;

  set(ballPosState, { x: newPx, y: newPy });
  set(ballVelState, { x: newVx, y: newVy });
};

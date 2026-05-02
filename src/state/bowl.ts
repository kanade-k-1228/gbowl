import { atom, type Getter, type Setter } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { DeviceMotion } from "../type/type";
import { matrixState } from "./fusion";

// ============================================================
// Bowl simulation — equivalent to a 2nd-order LPF on -a_car.
//
//   d²u/dt² = -ω² u  -  2ζω du/dt  -  a_car · ω²/g
//
// Output u is unbounded; saturation is the view's concern.
// ============================================================

const G = 9.8;

// Tunable from the Settings dialog.
// "Stiffness" is the natural angular frequency ω (rad/s) — higher = ball snaps
// back faster. "Damping" is ζ (dimensionless) — higher = less oscillation.
export const bowlStiffnessState = atomWithStorage("gbowl.bowl.stiffness", 10);
export const bowlDampingState = atomWithStorage("gbowl.bowl.damping", 0.9);

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

  const omega = get(bowlStiffnessState);
  const zeta = get(bowlDampingState);
  const omegaSq = omega * omega;
  const damping = 2 * zeta * omega;
  const accelFactor = omegaSq / G;

  const M = get(matrixState);
  const a = motion.acceleration;
  const ax = M[0][0] * a.x + M[0][1] * a.y + M[0][2] * a.z;
  const ay = M[1][0] * a.x + M[1][1] * a.y + M[1][2] * a.z;

  const pos = get(ballPosState);
  const vel = get(ballVelState);

  const accBallX = -omegaSq * pos.x - damping * vel.x - ax * accelFactor;
  const accBallY = -omegaSq * pos.y - damping * vel.y - ay * accelFactor;

  const newVx = vel.x + accBallX * dt;
  const newVy = vel.y + accBallY * dt;
  const newPx = pos.x + newVx * dt;
  const newPy = pos.y + newVy * dt;

  set(ballPosState, { x: newPx, y: newPy });
  set(ballVelState, { x: newVx, y: newVy });
};

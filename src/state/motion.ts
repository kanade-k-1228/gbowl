import { atom } from "jotai";
import type { DeviceMotion } from "../type/type";

const deviceMotionRaw = atom<DeviceMotion>({
  acceleration: { x: 0, y: 0, z: 0 },
  accelerationIncludingGravity: { x: 0, y: 0, z: 0 },
  rotationRate: { alpha: 0, beta: 0, gamma: 0 },
  interval: 0,
});

// motion.interval は browser ごとに不安定 (0 や秒単位のことがある) なので、
// イベント間の経過時間を自前で測る。0 は「まだ計測していない」の意。
const lastEventTimeState = atom(0);

// 入力ハブ。書き込み時は dt を補正して raw に格納するだけの副作用なし atom。
// 連鎖する step (calibration / bowl / series) はフック層 (useDeviceMotion) で
// store API 経由でまとめて呼ぶことで、state 層の依存を DAG に保つ。
export const deviceMotionState = atom(
  (get) => get(deviceMotionRaw),
  (get, set, motion: DeviceMotion) => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const last = get(lastEventTimeState);
    const dtMs = last > 0 ? now - last : 16;
    set(lastEventTimeState, now);
    set(deviceMotionRaw, { ...motion, interval: dtMs });
  }
);

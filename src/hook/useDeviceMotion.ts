import { useStore } from "jotai";
import { useEffect } from "react";
import { stepBowlSimulation } from "../state/bowl";
import { stepEstimateFrame } from "../state/frame";
import { deviceMotionState } from "../state/motion";
import { stepRecordSeries } from "../state/series";

// devicemotion イベントを購読して入力ハブ deviceMotionState に流し込み、その後で
// 各 step を順に走らせる。stepEstimateFrame が up/forward を更新して matrixState を
// 最新化してから bowl/series が読むので、最初に呼ぶ。state 層は引数で motion を
// 受け取るだけなので、フック層がオーケストレータとなる。
export const useDeviceMotion = () => {
  const store = useStore();

  useEffect(() => {
    const handler = (e: DeviceMotionEvent) => {
      store.set(deviceMotionState, {
        acceleration: {
          x: e.acceleration?.x ?? 0,
          y: e.acceleration?.y ?? 0,
          z: e.acceleration?.z ?? 0,
        },
        accelerationIncludingGravity: {
          x: e.accelerationIncludingGravity?.x ?? 0,
          y: e.accelerationIncludingGravity?.y ?? 0,
          z: e.accelerationIncludingGravity?.z ?? 0,
        },
        rotationRate: {
          alpha: e.rotationRate?.alpha ?? 0,
          beta: e.rotationRate?.beta ?? 0,
          gamma: e.rotationRate?.gamma ?? 0,
        },
        interval: e.interval,
      });
      const m = store.get(deviceMotionState);
      stepEstimateFrame(store.get, store.set, m);
      stepBowlSimulation(store.get, store.set, m);
      stepRecordSeries(store.get, store.set, m);
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [store]);
};

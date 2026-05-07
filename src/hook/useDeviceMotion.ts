import { useStore } from "jotai";
import { useEffect } from "react";
import { stepBowlSimulation } from "../state/bowl";
import { stepCalibrationImu } from "../state/calibration";
import { deviceMotionState } from "../state/motion";
import { stepRecordSeries } from "../state/series";

// devicemotion イベントを購読して入力ハブ deviceMotionState に流し込み、
// その後で各 step (calibration / bowl / series) を順に走らせる。state 層は
// 引数で motion を受け取るだけなので、フック層がオーケストレータとなる。
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
      stepCalibrationImu(store.get, store.set, m);
      stepBowlSimulation(store.get, store.set, m);
      stepRecordSeries(store.get, store.set, m);
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [store]);
};

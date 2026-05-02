import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  accSeriesState,
  deviceMotionState,
  gyroSeriesState,
  SERIES_WINDOW,
} from "../state/state";

export const useMotionRecorder = (windowSize = SERIES_WINDOW) => {
  const device = useAtomValue(deviceMotionState);
  const setAcc = useSetAtom(accSeriesState);
  const setGyro = useSetAtom(gyroSeriesState);

  useEffect(() => {
    setAcc((prev) => ({
      x: [...prev.x, device.acceleration.x].slice(-windowSize),
      y: [...prev.y, device.acceleration.y].slice(-windowSize),
      z: [...prev.z, device.acceleration.z].slice(-windowSize),
    }));
    setGyro((prev) => ({
      alpha: [...prev.alpha, device.rotationRate.alpha].slice(-windowSize),
      beta: [...prev.beta, device.rotationRate.beta].slice(-windowSize),
      gamma: [...prev.gamma, device.rotationRate.gamma].slice(-windowSize),
    }));
  }, [device, setAcc, setGyro, windowSize]);
};

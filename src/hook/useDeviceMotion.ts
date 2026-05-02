import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { deviceMotionState } from "../state/sensor";

export const useDeviceMotion = () => {
  const setMotion = useSetAtom(deviceMotionState);

  useEffect(() => {
    const handler = (e: DeviceMotionEvent) => {
      setMotion({
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
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [setMotion]);

  // iOS Safari requires DeviceMotionEvent.requestPermission() from a user
  // gesture. Grab the first one anywhere on the page and request silently.
  useEffect(() => {
    if (
      typeof DeviceMotionEvent === "undefined" ||
      !("requestPermission" in DeviceMotionEvent)
    )
      return;
    const onGesture = () => {
      // biome-ignore lint/suspicious/noExplicitAny: vendor-specific iOS API
      (DeviceMotionEvent as any).requestPermission().catch(() => {});
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onGesture);
  }, []);
};

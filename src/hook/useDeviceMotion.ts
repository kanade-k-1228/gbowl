import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { deviceMotionState } from "../state/state";

export const useDeviceMotion = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const setDeviceMotion = useSetAtom(deviceMotionState);

  const requestPermission = useCallback(async () => {
    const motion = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<"granted" | "denied" | "default">;
    };
    if (typeof motion === "undefined" || !motion.requestPermission) {
      setPermissionGranted(true);
      return;
    }
    try {
      const response = await motion.requestPermission();
      if (response === "granted") {
        setPermissionGranted(true);
      } else {
        console.warn("DeviceMotion permission not granted");
      }
    } catch (error) {
      console.error("DeviceMotion permission request error:", error);
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      setDeviceMotion({
        acceleration: {
          x: event.acceleration?.x ?? 0,
          y: event.acceleration?.y ?? 0,
          z: event.acceleration?.z ?? 0,
        },
        accelerationIncludingGravity: {
          x: event.accelerationIncludingGravity?.x ?? 0,
          y: event.accelerationIncludingGravity?.y ?? 0,
          z: event.accelerationIncludingGravity?.z ?? 0,
        },
        rotationRate: {
          alpha: event.rotationRate?.alpha ?? 0,
          beta: event.rotationRate?.beta ?? 0,
          gamma: event.rotationRate?.gamma ?? 0,
        },
        interval: event.interval,
      });
    };

    window.addEventListener("devicemotion", handleDeviceMotion);
    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
  }, [permissionGranted, setDeviceMotion]);

  return { permissionGranted, requestPermission };
};

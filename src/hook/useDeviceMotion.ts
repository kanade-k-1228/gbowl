import { useState, useEffect, useCallback } from "react";

type Acceleration = {
  x: number;
  y: number;
  z: number;
};

type RotationRate = {
  alpha: number;
  beta: number;
  gamma: number;
};

export const useDeviceMotion = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [acceleration, setAcceleration] = useState<Acceleration>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [accelerationIncludingGravity, setAccelerationIncludingGravity] =
    useState<Acceleration>({ x: 0, y: 0, z: 0 });
  const [rotationRate, setRotationRate] = useState<RotationRate>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [interval, setIntervalValue] = useState<number>(0);

  const requestPermission = useCallback(async () => {
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      "requestPermission" in DeviceMotionEvent
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === "granted") {
          setPermissionGranted(true);
        } else {
          console.warn("DeviceMotion permission not granted");
        }
      } catch (error) {
        console.error("DeviceMotion permission request error:", error);
      }
    } else {
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (event.acceleration) {
        setAcceleration({
          x: event.acceleration.x ?? 0,
          y: event.acceleration.y ?? 0,
          z: event.acceleration.z ?? 0,
        });
      }
      if (event.accelerationIncludingGravity) {
        setAccelerationIncludingGravity({
          x: event.accelerationIncludingGravity.x ?? 0,
          y: event.accelerationIncludingGravity.y ?? 0,
          z: event.accelerationIncludingGravity.z ?? 0,
        });
      }
      if (event.rotationRate) {
        setRotationRate({
          alpha: event.rotationRate.alpha ?? 0,
          beta: event.rotationRate.beta ?? 0,
          gamma: event.rotationRate.gamma ?? 0,
        });
      }
      setIntervalValue(event.interval);
    };

    window.addEventListener("devicemotion", handleDeviceMotion);
    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
  }, [permissionGranted]);

  return {
    permissionGranted,
    requestPermission,
    acceleration,
    accelerationIncludingGravity,
    rotationRate,
    interval,
  };
};

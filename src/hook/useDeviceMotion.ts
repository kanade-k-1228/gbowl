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
  // gesture (click / touchend). pointerdown is not reliably accepted as
  // transient activation, so we listen on both click and touchend and
  // re-arm if the call rejects (e.g. denied) so a later tap can retry.
  useEffect(() => {
    type RequestFn = () => Promise<"granted" | "denied" | "default">;
    const Ctor = DeviceMotionEvent as unknown as {
      requestPermission?: RequestFn;
    };
    if (typeof Ctor.requestPermission !== "function") return;
    const request: RequestFn = Ctor.requestPermission.bind(Ctor);

    let pending = false;
    const cleanup = () => {
      window.removeEventListener("click", onGesture, true);
      window.removeEventListener("touchend", onGesture, true);
    };
    function onGesture() {
      if (pending) return;
      pending = true;
      request()
        .then((state) => {
          if (state === "granted") cleanup();
          else pending = false;
        })
        .catch((err) => {
          console.warn("[useDeviceMotion] requestPermission failed", err);
          pending = false;
        });
    }
    window.addEventListener("click", onGesture, true);
    window.addEventListener("touchend", onGesture, true);
    return cleanup;
  }, []);
};

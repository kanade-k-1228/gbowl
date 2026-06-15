import { useStore } from "jotai";
import { useEffect } from "react";
import { gpsMotionState } from "../state/gps";

// 常時 watchPosition して最新 GPS (heading/speed 含む) を gpsMotionState に流す。
// forward 軸の動的キャリブが進行方位を参照する。
export const useGeolocation = () => {
  const store = useStore();

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        store.set(gpsMotionState, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          t: pos.timestamp,
        });
      },
      (err) => {
        console.warn("[useGeolocation]", err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [store]);
};

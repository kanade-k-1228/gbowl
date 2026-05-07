import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { calibrationModeState, ingestGpsSample } from "../state/calibration";

// キャリブレーションモードの間だけ watchPosition を起動して、
// 取得した fix を ingestGpsSample に流し込む。
export const useGeolocation = () => {
  const calibrating = useAtomValue(calibrationModeState);
  const ingest = useSetAtom(ingestGpsSample);

  useEffect(() => {
    if (!calibrating) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        ingest({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          t: pos.timestamp,
        });
      },
      (err) => {
        console.warn("[useGeolocation]", err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [calibrating, ingest]);
};

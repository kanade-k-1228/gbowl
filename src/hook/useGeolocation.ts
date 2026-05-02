import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { geolocationState } from "../state/state";

export const useGeolocation = () => {
  const setGeo = useSetAtom(geolocationState);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation API is not available");
      return;
    }
    setPermissionGranted(true);
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGeo({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [permissionGranted, setGeo]);

  return { permissionGranted, requestPermission, error };
};

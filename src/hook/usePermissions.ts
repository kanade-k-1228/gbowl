import { useEffect } from "react";

// アプリ起動直後の最初の click / touchend で、DeviceMotion / DeviceOrientation /
// Geolocation の許可をまとめてユーザーに求める。iOS Safari の
// DeviceMotionEvent / DeviceOrientationEvent の requestPermission は user gesture
// が必要なので、同じ gesture に乗せて 1 回で済ませる。
export const usePermissions = () => {
  useEffect(() => onFirstGesture(requestMotion), []);
  useEffect(() => onFirstGesture(requestOrientation), []);
  useEffect(() => onFirstGesture(requestGeo), []);
};

// gesture を 1 回だけ拾って request を呼ぶ。request が "保留 (default)" を返したら
// リスナーは外さず次の gesture で再試行する。
const onFirstGesture = (request: () => Promise<boolean>) => {
  let pending = false;
  const handler = () => {
    if (pending) return;
    pending = true;
    request().then((done) => {
      if (done) cleanup();
      else pending = false;
    });
  };
  const cleanup = () => {
    window.removeEventListener("click", handler, true);
    window.removeEventListener("touchend", handler, true);
  };
  window.addEventListener("click", handler, true);
  window.addEventListener("touchend", handler, true);
  return cleanup;
};

type RequestFn = () => Promise<"granted" | "denied" | "default">;

const requestMotion = async (): Promise<boolean> => {
  const Ctor = DeviceMotionEvent as unknown as {
    requestPermission?: RequestFn;
  };
  if (typeof Ctor.requestPermission !== "function") return true;
  try {
    const state = await Ctor.requestPermission.call(DeviceMotionEvent);
    return state !== "default";
  } catch (err) {
    console.warn("[usePermissions] DeviceMotion", err);
    return false;
  }
};

const requestOrientation = async (): Promise<boolean> => {
  const Ctor = DeviceOrientationEvent as unknown as {
    requestPermission?: RequestFn;
  };
  if (typeof Ctor.requestPermission !== "function") return true;
  try {
    const state = await Ctor.requestPermission.call(DeviceOrientationEvent);
    return state !== "default";
  } catch (err) {
    console.warn("[usePermissions] DeviceOrientation", err);
    return false;
  }
};

const requestGeo = (): Promise<boolean> => {
  if (!navigator.geolocation) return Promise.resolve(true);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      (err) => {
        // 拒否でもタイムアウトでも諦める (true でリスナー解除)。再試行ループにしない。
        console.warn("[usePermissions] Geolocation", err);
        resolve(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: Number.POSITIVE_INFINITY,
      }
    );
  });
};

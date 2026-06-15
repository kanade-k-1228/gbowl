import { useStore } from "jotai";
import { useEffect } from "react";
import { deviceOrientationState } from "../state/orientation";
import type { HeadingSource } from "../type/type";

// deviceorientation / deviceorientationabsolute を購読し、絶対方位 (north 基準の
// alpha) の OS 差異を吸収して deviceOrientationState に書き込むだけの入力ハブ。
// step は駆動しない (motion 側オーケストレータが最新値を pull する)。
export const useDeviceOrientation = () => {
  const store = useStore();

  useEffect(() => {
    let hasAbsolute = false;

    const write = (
      e: DeviceOrientationEvent,
      source: HeadingSource,
      compassHeading: number | null,
      compassAccuracy: number | null
    ) => {
      // iOS の alpha は任意基準なので使わず、webkitCompassHeading (磁北・時計回り)
      // から alpha を絶対化する (符号反転)。他は e.alpha をそのまま使う。
      const alpha =
        source === "ios-compass" && compassHeading !== null
          ? (360 - compassHeading + 360) % 360
          : e.alpha;
      store.set(deviceOrientationState, {
        alpha,
        beta: e.beta,
        gamma: e.gamma,
        absolute: source === "ios-compass" || source === "android-absolute",
        compassHeading,
        compassAccuracy,
        headingSource: source,
      });
    };

    const onAbsolute = (e: DeviceOrientationEvent) => {
      hasAbsolute = true;
      write(e, "android-absolute", null, null);
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      // absolute イベントが供給される端末では相対 deviceorientation は無視。
      if (hasAbsolute) return;
      const heading = e.webkitCompassHeading;
      if (typeof heading === "number" && Number.isFinite(heading)) {
        const acc = e.webkitCompassAccuracy;
        write(e, "ios-compass", heading, typeof acc === "number" ? acc : null);
      } else if (e.absolute) {
        write(e, "android-absolute", null, null);
      } else {
        write(e, "relative", null, null);
      }
    };

    window.addEventListener("deviceorientationabsolute", onAbsolute, true);
    window.addEventListener("deviceorientation", onOrientation, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onAbsolute, true);
      window.removeEventListener("deviceorientation", onOrientation, true);
    };
  }, [store]);
};

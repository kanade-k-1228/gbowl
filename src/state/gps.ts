import { atom } from "jotai";
import type { GpsSample } from "../type/type";

// 最新の GPS fix (heading/speed 含む)。useGeolocation が常時更新し、
// forward 軸の動的キャリブが進行方位を参照する。
export const gpsMotionState = atom<GpsSample | null>(null);

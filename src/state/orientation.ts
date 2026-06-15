import { atom } from "jotai";
import type { DeviceOrientation, HeadingSource, M3, V3 } from "../type/type";

const deviceOrientationRaw = atom<DeviceOrientation>({
  alpha: null,
  beta: null,
  gamma: null,
  absolute: false,
  compassHeading: null,
  compassAccuracy: null,
  headingSource: "none",
});

// 入力ハブ。useDeviceOrientation が書き込むだけの副作用なし atom。
export const deviceOrientationState = atom(
  (get) => get(deviceOrientationRaw),
  (_get, set, o: DeviceOrientation) => set(deviceOrientationRaw, o)
);

const DEG = Math.PI / 180;

// device→world(ENU) 回転行列 R = Rz(α)·Rx(β)·Ry(γ)。v_world = R·v_device。
// W3C Device Orientation の Z-X'-Y'' intrinsic 規約。alpha/beta/gamma が揃わ
// なければ null (DeviceOrientation 非対応 / 未受信)。
export const orientationMatrixState = atom<M3 | null>((get) => {
  const o = get(deviceOrientationState);
  if (o.alpha === null || o.beta === null || o.gamma === null) return null;
  const a = o.alpha * DEG;
  const b = o.beta * DEG;
  const g = o.gamma * DEG;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cb = Math.cos(b);
  const sb = Math.sin(b);
  const cg = Math.cos(g);
  const sg = Math.sin(g);
  return [
    [ca * cg - sa * sb * sg, -cb * sa, ca * sg + cg * sa * sb],
    [cg * sa + ca * sb * sg, ca * cb, sa * sg - ca * cg * sb],
    [-cb * sg, sb, cb * cg],
  ];
});

// DeviceOrientation 由来の重力 (up 方向・スケール 9.8) を device frame で。
// = 9.8 · (R 第3行)。平置き(α=β=γ=0)で [0,0,9.8] となり既存 gravityDevState と
// 互換。up は alpha(方位)に依存しないので絶対方位が無くても高精度に効く。
export const orientationGravityState = atom<V3 | null>((get) => {
  const R = get(orientationMatrixState);
  if (!R) return null;
  return [9.8 * R[2][0], 9.8 * R[2][1], 9.8 * R[2][2]];
});

// 診断用 (ヘッダー表示)。
export interface OrientationStatus {
  available: boolean; // R が得られているか (up が高精度)
  headingSource: HeadingSource; // forward 動的更新の可否
  compassAccuracy: number | null;
}

export const orientationStatusState = atom<OrientationStatus>((get) => {
  const o = get(deviceOrientationState);
  return {
    available: get(orientationMatrixState) !== null,
    headingSource: o.headingSource,
    compassAccuracy: o.compassAccuracy,
  };
});

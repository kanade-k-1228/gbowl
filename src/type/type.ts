export interface DeviceMotion {
  acceleration: { x: number; y: number; z: number };
  accelerationIncludingGravity: { x: number; y: number; z: number };
  rotationRate: { alpha: number; beta: number; gamma: number };
  interval: number;
}

// 3D ベクトルと 3x3 行列。device/car 座標系の変換で共有する。
export type V3 = [number, number, number];
export type M3 = [V3, V3, V3];

// 絶対方位 (true/magnetic north 基準の alpha) がどこから来たか。
// forward の動的キャリブは絶対方位ソースのときだけ有効化する。
export type HeadingSource =
  | "ios-compass" // iOS: webkitCompassHeading から alpha を絶対化
  | "android-absolute" // Android: deviceorientationabsolute の alpha
  | "relative" // alpha が任意基準 (forward 動的更新は不可)
  | "none"; // まだイベントを受け取っていない

export interface DeviceOrientation {
  alpha: number | null; // deg, 可能なら絶対化済み
  beta: number | null; // deg
  gamma: number | null; // deg
  absolute: boolean; // alpha が north 基準か
  compassHeading: number | null; // iOS webkitCompassHeading (deg) or null
  compassAccuracy: number | null; // iOS webkitCompassAccuracy (deg) or null
  headingSource: HeadingSource;
}

export interface GpsSample {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null; // m/s, 静止時 null
  heading: number | null; // deg, 北基準時計回り, 移動中のみ
  t: number;
}

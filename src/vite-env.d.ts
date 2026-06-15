/// <reference types="vite/client" />

// TS 標準 lib に無いイベント・プロパティを補う。
interface WindowEventMap {
  deviceorientationabsolute: DeviceOrientationEvent;
}

interface DeviceOrientationEvent {
  readonly webkitCompassHeading?: number;
  readonly webkitCompassAccuracy?: number;
}

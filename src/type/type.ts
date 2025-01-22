export type DeviceMotion = {
  acceleration: { x: number; y: number; z: number };
  accelerationIncludingGravity: { x: number; y: number; z: number };
  rotationRate: { alpha: number; beta: number; gamma: number };
  interval: number;
};

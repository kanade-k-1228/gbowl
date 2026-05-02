export type DeviceMotion = {
  acceleration: { x: number; y: number; z: number };
  accelerationIncludingGravity: { x: number; y: number; z: number };
  rotationRate: { alpha: number; beta: number; gamma: number };
  interval: number;
};

export type Geolocation = {
  latitude: number;
  longitude: number;
  accuracy: number; // m
  speed: number | null; // m/s
  heading: number | null; // deg, 0=true north, clockwise
  timestamp: number; // ms
};

export type FusedState = {
  heading: number; // rad, 0=north, clockwise (vehicle yaw in world frame)
  speed: number; // m/s, signed forward velocity
  position: { latitude: number; longitude: number } | null;
  accuracy: number; // m
  hasGps: boolean;
};

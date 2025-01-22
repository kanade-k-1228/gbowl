import { FC } from "react";
import { useDeviceMotion } from "../hook/useDeviceMotion";

export const App: FC = () => {
  const {
    permissionGranted,
    requestPermission,
    acceleration,
    accelerationIncludingGravity,
    rotationRate,
    interval,
  } = useDeviceMotion();

  return (
    <div>
      <h1>Device Motion Example</h1>
      {!permissionGranted && (
        <button onClick={requestPermission}>許可をリクエスト</button>
      )}
      <p>
        <strong>Acceleration:</strong> x: {acceleration.x}, y: {acceleration.y},
        z: {acceleration.z}
      </p>
      <p>
        <strong>Acceleration (Gravity):</strong> x:{" "}
        {accelerationIncludingGravity.x}, y: {accelerationIncludingGravity.y},
        z: {accelerationIncludingGravity.z}
      </p>
      <p>
        <strong>Rotation Rate:</strong> alpha: {rotationRate.alpha}, beta:{" "}
        {rotationRate.beta}, gamma: {rotationRate.gamma}
      </p>
      <p>
        <strong>Interval:</strong> {interval} ms
      </p>
    </div>
  );
};

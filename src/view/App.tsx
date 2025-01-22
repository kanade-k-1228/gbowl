import { FC, useEffect, useState } from "react";
import { useDeviceMotion } from "../hook/useDeviceMotion";
import { Plot } from "./Plot/Plot";
import { Bowl } from "./Bowl/Bowl";
import "./App.css";

export const App: FC = () => {
  const {
    permissionGranted,
    requestPermission,
    acceleration,
    accelerationIncludingGravity,
    rotationRate,
    interval,
  } = useDeviceMotion();

  const [acc, setAcc] = useState<{ x: number[]; y: number[]; z: number[] }>({
    x: [],
    y: [],
    z: [],
  });
  const [gyro, setGyro] = useState<{
    alpha: number[];
    beta: number[];
    gamma: number[];
  }>({ alpha: [], beta: [], gamma: [] });

  useEffect(() => {
    setAcc((prev) => ({
      x: [...prev.x, acceleration.x].slice(-50),
      y: [...prev.y, acceleration.y].slice(-50),
      z: [...prev.z, acceleration.z].slice(-50),
    }));
    setGyro((prev) => ({
      alpha: [...prev.alpha, rotationRate.alpha].slice(-50),
      beta: [...prev.beta, rotationRate.beta].slice(-50),
      gamma: [...prev.gamma, rotationRate.gamma].slice(-50),
    }));
  }, [acceleration, rotationRate]);

  return (
    <div>
      <h1>Device Motion</h1>
      {!permissionGranted && <button onClick={requestPermission}>Start</button>}
      <div className="grid-container">
      <div className="grid-header">
        <div></div>
        <div>x</div>
        <div>y</div>
        <div>z</div>
        <div>abs</div>
      </div>
      <div className="grid-body">
        <div className="grid-row">
          <div><strong>Acc</strong></div>
          <div>{acceleration.x.toFixed(2)}</div>
          <div>{acceleration.y.toFixed(2)}</div>
          <div>{acceleration.z.toFixed(2)}</div>
          <div>{Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2).toFixed(2)}</div>
        </div>
        <div className="grid-row">
          <div><strong>Acc (Gravity)</strong></div>
          <div>{accelerationIncludingGravity.x.toFixed(2)}</div>
          <div>{accelerationIncludingGravity.y.toFixed(2)}</div>
          <div>{accelerationIncludingGravity.z.toFixed(2)}</div>
          <div>{Math.sqrt(accelerationIncludingGravity.x ** 2 + accelerationIncludingGravity.y ** 2 + accelerationIncludingGravity.z ** 2).toFixed(2)}</div>
        </div>
        <div className="grid-row">
          <div><strong>Rotation Rate</strong></div>
          <div>{rotationRate.alpha.toFixed(2)}</div>
          <div>{rotationRate.beta.toFixed(2)}</div>
          <div>{rotationRate.gamma.toFixed(2)}</div>
          <div>{Math.sqrt(rotationRate.alpha ** 2 + rotationRate.beta ** 2 + rotationRate.gamma ** 2).toFixed(2)}</div>
        </div>
      </div>
    </div>
      <p>
        <strong>Interval:</strong> {interval} ms
      </p>
      <Plot acc={acc} gyro={gyro} />
      <Bowl acc={acceleration} />
    </div>
  );
};

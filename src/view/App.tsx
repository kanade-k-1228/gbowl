import { FC, useEffect, useState } from "react";
import { useDeviceMotion } from "../hook/useDeviceMotion";
import { Plot } from "./Plot/Plot";
import { Bowl } from "./Bowl/Bowl";

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
      <table>
        <thead>
          <tr>
            <th></th>
            <th>x</th>
            <th>y</th>
            <th>z</th>
            <th>abs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Acc</strong>
            </td>
            <td>{acceleration.x.toFixed(2)}</td>
            <td>{acceleration.y.toFixed(2)}</td>
            <td>{acceleration.z.toFixed(2)}</td>
            <td>
              {Math.sqrt(
                acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
              ).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Acc (Gravity)</strong>
            </td>
            <td>{accelerationIncludingGravity.x.toFixed(2)}</td>
            <td>{accelerationIncludingGravity.y.toFixed(2)}</td>
            <td>{accelerationIncludingGravity.z.toFixed(2)}</td>
            <td>
              {Math.sqrt(
                accelerationIncludingGravity.x ** 2 +
                  accelerationIncludingGravity.y ** 2 +
                  accelerationIncludingGravity.z ** 2
              ).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Rotation Rate</strong>
            </td>
            <td>{rotationRate.alpha.toFixed(2)}</td>
            <td>{rotationRate.beta.toFixed(2)}</td>
            <td>{rotationRate.gamma.toFixed(2)}</td>
            <td>
              {Math.sqrt(
                rotationRate.alpha ** 2 +
                  rotationRate.beta ** 2 +
                  rotationRate.gamma ** 2
              ).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Interval:</strong> {interval} ms
      </p>
      <Plot acc={acc} gyro={gyro} />
      <Bowl acc={acceleration} />
    </div>
  );
};

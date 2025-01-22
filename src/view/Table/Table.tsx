import { FC } from "react";
import style from "./Table.module.css";
import { DeviceMotion } from "../../type/type";

export const Table: FC<{ device: DeviceMotion }> = ({ device }) => {
  return (
    <div className={style.container}>
      <div className={style.row}>
        <div>{(1 / device.interval).toFixed(2)}</div>
        <div>x</div>
        <div>y</div>
        <div>z</div>
        <div>abs</div>
      </div>
      <div className={style.row}>
        <div>
          <strong>Acc</strong>
        </div>
        <div>{device.acceleration.x.toFixed(2)}</div>
        <div>{device.acceleration.y.toFixed(2)}</div>
        <div>{device.acceleration.z.toFixed(2)}</div>
        <div>
          {Math.sqrt(
            device.acceleration.x ** 2 +
              device.acceleration.y ** 2 +
              device.acceleration.z ** 2
          ).toFixed(2)}
        </div>
      </div>
      <div className={style.row}>
        <div>
          <strong>A+G</strong>
        </div>
        <div>{device.accelerationIncludingGravity.x.toFixed(2)}</div>
        <div>{device.accelerationIncludingGravity.y.toFixed(2)}</div>
        <div>{device.accelerationIncludingGravity.z.toFixed(2)}</div>
        <div>
          {Math.sqrt(
            device.accelerationIncludingGravity.x ** 2 +
              device.accelerationIncludingGravity.y ** 2 +
              device.accelerationIncludingGravity.z ** 2
          ).toFixed(2)}
        </div>
      </div>
      <div className={style.row}>
        <div>
          <strong>Rot</strong>
        </div>
        <div>{device.rotationRate.alpha.toFixed(2)}</div>
        <div>{device.rotationRate.beta.toFixed(2)}</div>
        <div>{device.rotationRate.gamma.toFixed(2)}</div>
        <div>
          {Math.sqrt(
            device.rotationRate.alpha ** 2 +
              device.rotationRate.beta ** 2 +
              device.rotationRate.gamma ** 2
          ).toFixed(2)}
        </div>
      </div>
    </div>
  );
};

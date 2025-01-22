import { FC, useEffect, useState } from "react";
import { useDeviceMotion } from "../hook/useDeviceMotion";
import { Plot } from "./Plot/Plot";
import { Bowl } from "./Bowl/Bowl";
import { Table } from "./Table/Table";
import style from "./App.module.css";
import { useSound } from "../hook/useSound";

export const App: FC = () => {
  const {
    requestPermission,
    acceleration,
    accelerationIncludingGravity,
    rotationRate,
    interval,
  } = useDeviceMotion();

  const { start: startSound, stop: stopSound } = useSound(
    442 + acceleration.x * 100,
    10
  );

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
    <div className={style.app}>
      <div className={style.headder}>
        <div className={style.title}>Accel Sound</div>
        <button
          className={style.button}
          onClick={() => {
            requestPermission();
            startSound();
          }}
        >
          {">"}
        </button>
        <button
          className={style.button}
          onClick={() => {
            stopSound();
          }}
        >
          {"||"}
        </button>
      </div>
      <Table
        device={{
          acceleration,
          accelerationIncludingGravity,
          rotationRate,
          interval,
        }}
      />
      <Plot acc={acc} gyro={gyro} />
      <Bowl acc={acceleration} />
      <div></div>
      <div className={style.footer}>
        <button>Calib</button>
        <button>Save</button>
      </div>
    </div>
  );
};

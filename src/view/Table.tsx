import { useAtomValue } from "jotai";
import type { FC } from "react";
import { deviceMotionState } from "../state/sensor";

const fmt = (n: number) => {
  const s = n.toFixed(2);
  return n >= 0 ? `+${s}` : s;
};

const Row: FC<{
  label: string;
  values: [number, number, number];
  abs: number;
  unit: string;
}> = ({ label, values, abs, unit }) => (
  <>
    <div className="flex items-center">
      <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-bold text-[10px] text-neutral-300 uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="num text-right text-neutral-300 text-xs">
      {fmt(values[0])}
    </div>
    <div className="num text-right text-neutral-300 text-xs">
      {fmt(values[1])}
    </div>
    <div className="num text-right text-neutral-300 text-xs">
      {fmt(values[2])}
    </div>
    <div className="num text-right font-semibold text-neutral-100 text-xs">
      {abs.toFixed(2)}
      <span className="ml-1 font-normal text-[9px] text-neutral-500">
        {unit}
      </span>
    </div>
  </>
);

export const Table: FC = () => {
  const device = useAtomValue(deviceMotionState);
  const accAbs = Math.hypot(
    device.acceleration.x,
    device.acceleration.y,
    device.acceleration.z
  );
  const accGAbs = Math.hypot(
    device.accelerationIncludingGravity.x,
    device.accelerationIncludingGravity.y,
    device.accelerationIncludingGravity.z
  );
  const rotAbs = Math.hypot(
    device.rotationRate.alpha,
    device.rotationRate.beta,
    device.rotationRate.gamma
  );

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] items-center gap-x-3 gap-y-1.5">
      <div />
      <div className="num text-right text-[9px] text-neutral-500 uppercase tracking-widest">
        x
      </div>
      <div className="num text-right text-[9px] text-neutral-500 uppercase tracking-widest">
        y
      </div>
      <div className="num text-right text-[9px] text-neutral-500 uppercase tracking-widest">
        z
      </div>
      <div className="num text-right text-[9px] text-neutral-500 uppercase tracking-widest">
        |·|
      </div>

      <Row
        label="Acc"
        values={[
          device.acceleration.x,
          device.acceleration.y,
          device.acceleration.z,
        ]}
        abs={accAbs}
        unit="G"
      />
      <Row
        label="A+G"
        values={[
          device.accelerationIncludingGravity.x,
          device.accelerationIncludingGravity.y,
          device.accelerationIncludingGravity.z,
        ]}
        abs={accGAbs}
        unit="G"
      />
      <Row
        label="Rot"
        values={[
          device.rotationRate.alpha,
          device.rotationRate.beta,
          device.rotationRate.gamma,
        ]}
        abs={rotAbs}
        unit="°/s"
      />
    </div>
  );
};

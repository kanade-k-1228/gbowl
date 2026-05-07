import { useAtomValue, useSetAtom } from "jotai";
import { X } from "lucide-react";
import { type FC, useMemo } from "react";
import {
  calibrationFitState,
  calibrationModeState,
  calibrationSamplesState,
  stopCalibrationAction,
} from "../state/calibration";
import { Modal } from "./Modal";

export const Calibration: FC = () => {
  const open = useAtomValue(calibrationModeState);
  const samples = useAtomValue(calibrationSamplesState);
  const fit = useAtomValue(calibrationFitState);
  const stop = useSetAtom(stopCalibrationAction);

  const view = useMemo(
    () => buildView(samples, fit.theta, fit.scale),
    [samples, fit.theta, fit.scale]
  );

  return (
    <Modal open={open} onClose={stop} label="Calibration">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-lg">Calibration</h2>
        <button
          type="button"
          onClick={() => stop()}
          aria-label="Cancel"
          className="text-neutral-400 transition hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-xl bg-black/40 p-2 ring-1 ring-white/5">
        {view ? (
          <svg
            viewBox={`0 0 ${view.w} ${view.h}`}
            className="aspect-square w-full"
            aria-label="Calibration paths"
          >
            <title>Calibration paths</title>
            <path
              d={view.gpsPath}
              fill="none"
              stroke="rgb(74 222 128)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={view.imuPath}
              fill="none"
              stroke="rgb(56 189 248)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <div className="flex aspect-square items-center justify-center text-neutral-500 text-sm">
            Waiting for GPS & IMU ...
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Fit R²" value={fit.r2.toFixed(2)} />
        <Stat label="#" value={String(samples.length)} />
      </div>

      <div className="mt-3 flex items-center gap-3 text-neutral-400 text-xs">
        <Legend color="rgb(56 189 248)" label="IMU" />
        <Legend color="rgb(74 222 128)" label="GPS" />
      </div>
    </Modal>
  );
};

type Sample = { imu: [number, number]; gps: [number, number] };

const buildView = (samples: Sample[], theta: number, scale: number) => {
  if (samples.length < 2 || !Number.isFinite(scale) || scale <= 0) return null;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const imuProj: [number, number][] = samples.map((sm) => {
    const ix = sm.imu[0];
    const iy = sm.imu[1];
    return [scale * (c * ix - s * iy), scale * (s * ix + c * iy)];
  });
  const gps: [number, number][] = samples.map((sm) => sm.gps);
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (const [x, y] of [...imuProj, ...gps]) {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  const dx = xMax - xMin;
  const dy = yMax - yMin;
  const span = Math.max(dx, dy, 1);
  const cx = (xMin + xMax) / 2;
  const cy = (yMin + yMax) / 2;
  const half = span * 0.6;
  const bx0 = cx - half;
  const bx1 = cx + half;
  const by0 = cy - half;
  const by1 = cy + half;
  const w = 280;
  const h = 280;
  const sx = (x: number) => ((x - bx0) / (bx1 - bx0)) * w;
  const sy = (y: number) => h - ((y - by0) / (by1 - by0)) * h;
  const toPath = (pts: [number, number][]) =>
    pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`
      )
      .join("");
  return { w, h, gpsPath: toPath(gps), imuPath: toPath(imuProj) };
};

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
    <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
      {label}
    </div>
    <div className="num font-mono font-semibold text-base">{value}</div>
  </div>
);

const Legend: FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <span className="h-1 w-3 rounded" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </div>
);

import { useAtom, useAtomValue } from "jotai";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { FC } from "react";
import { useDeviceMotion } from "../hook/useDeviceMotion";
import { useGeolocation } from "../hook/useGeolocation";
import { useSound } from "../hook/useSound";
import { deviceMotionState } from "../state/sensor";
import { soundToggleState } from "../state/sound";
import { Bowl } from "./Bowl/Bowl";
import { Plot } from "./Plot/Plot";
import { Table } from "./Table/Table";

export const App: FC = () => {
  useDeviceMotion();
  useGeolocation();
  const { start, stop } = useSound();
  const device = useAtomValue(deviceMotionState);
  const [running, setRunning] = useAtom(soundToggleState);

  const hz = device.interval ? 1 / device.interval : 0;
  const accMag = Math.hypot(
    device.acceleration.x,
    device.acceleration.y,
    device.acceleration.z
  );

  const onToggle = () => {
    if (running) {
      stop();
      setRunning(false);
    } else {
      start();
      setRunning(true);
    }
  };

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] bg-bg text-neutral-100">
      <header className="flex items-center justify-between gap-3 border-white/5 border-b bg-bg-elevated/40 backdrop-blur pl-[max(env(safe-area-inset-left),1.25rem)] pr-[max(env(safe-area-inset-right),1.25rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div className="flex items-baseline gap-3">
          <span className="bg-gradient-to-br from-accent via-cyan-200 to-cyan-400 bg-clip-text font-display font-extrabold text-2xl text-transparent tracking-tight">
            G-MONI
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                running ? "animate-pulse bg-accent" : "bg-neutral-600"
              }`}
            />
            <span className="num text-[11px] text-neutral-400 uppercase tracking-wider">
              {hz > 0 ? `${hz.toFixed(0)} Hz` : "idle"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Calibrate"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-neutral-300 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={running ? "Stop" : "Start"}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
              running
                ? "bg-accent-danger text-white shadow-glow-warm"
                : "bg-accent text-bg shadow-glow"
            }`}
          >
            {running ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 translate-x-[1px]" fill="currentColor" />
            )}
          </button>
        </div>
      </header>

      <main className="grid grid-rows-[1fr_auto_minmax(120px,28%)] gap-3 overflow-hidden pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pl-[max(env(safe-area-inset-left),0.75rem)] pr-[max(env(safe-area-inset-right),0.75rem)]">
        <section className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-bg-elevated to-bg-panel ring-1 ring-white/5">
          <Bowl />
          <div className="pointer-events-none absolute top-4 right-4 flex flex-col items-end gap-0.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
              |a|
            </span>
            <span className="num font-bold text-2xl text-neutral-100">
              {accMag.toFixed(2)}
              <span className="ml-1 font-normal text-neutral-500 text-sm">
                G
              </span>
            </span>
          </div>
        </section>

        <section className="rounded-2xl bg-bg-elevated/70 p-3 ring-1 ring-white/5">
          <Table />
        </section>

        <section className="overflow-hidden rounded-2xl bg-bg-elevated/70 p-2 ring-1 ring-white/5">
          <Plot />
        </section>
      </main>
    </div>
  );
};

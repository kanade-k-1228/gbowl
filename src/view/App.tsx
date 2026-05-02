import { useAtomValue } from "jotai";
import { Pause, Play, RotateCcw, Save } from "lucide-react";
import { type FC, useState } from "react";
import { useDeviceMotion } from "../hook/useDeviceMotion";
import { useMotionRecorder } from "../hook/useMotionRecorder";
import { useSound } from "../hook/useSound";
import { deviceMotionState } from "../state/state";
import { Bowl } from "./Bowl/Bowl";
import { Plot } from "./Plot/Plot";
import { Table } from "./Table/Table";

export const App: FC = () => {
  const { requestPermission } = useDeviceMotion();
  const device = useAtomValue(deviceMotionState);
  useMotionRecorder();
  const { start, stop } = useSound(10);
  const [running, setRunning] = useState(false);

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
      requestPermission();
      start();
      setRunning(true);
    }
  };

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr_auto] bg-bg text-neutral-100">
      <header className="flex items-center justify-between gap-3 border-white/5 border-b bg-bg-elevated/40 px-5 py-3 backdrop-blur">
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
      </header>

      <main className="grid grid-rows-[1fr_auto_minmax(120px,28%)] gap-3 overflow-hidden p-3">
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

      <footer className="grid grid-cols-2 gap-2 border-white/5 border-t bg-bg-elevated/40 px-3 py-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3 text-neutral-200 ring-1 ring-white/5 transition hover:bg-white/[0.08] active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4 text-accent" />
          <span className="font-medium text-sm">Calibrate</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3 text-neutral-200 ring-1 ring-white/5 transition hover:bg-white/[0.08] active:scale-[0.98]"
        >
          <Save className="h-4 w-4 text-accent" />
          <span className="font-medium text-sm">Save</span>
        </button>
      </footer>
    </div>
  );
};

import clsx from "clsx";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Crosshair, Pause, Play, Settings as SettingsIcon } from "lucide-react";
import type { FC } from "react";
import { useDeviceMotion } from "../hook/useDeviceMotion";
import { useGeolocation } from "../hook/useGeolocation";
import { usePermissions } from "../hook/usePermissions";
import { useSound } from "../hook/useSound";
import {
  calibrationModeState,
  startCalibrationAction,
  stopCalibrationAction,
} from "../state/calibration";
import { deviceMotionState } from "../state/motion";
import { soundToggleState } from "../state/sound";
import { settingsOpenState } from "../state/ui";
import { Bowl } from "./Bowl";
import { Calibration } from "./Calibration";
import { Plot } from "./Plot";
import { Settings } from "./Settings";

export const App: FC = () => {
  usePermissions();
  useDeviceMotion();
  useGeolocation();
  const { start, stop } = useSound();
  const device = useAtomValue(deviceMotionState);
  const [running, setRunning] = useAtom(soundToggleState);
  const setSettingsOpen = useSetAtom(settingsOpenState);
  const calibrating = useAtomValue(calibrationModeState);
  const startCalibration = useSetAtom(startCalibrationAction);
  const stopCalibration = useSetAtom(stopCalibrationAction);

  const hz = device.interval ? 1000 / device.interval : 0;

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
            G-Monitor
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full",
                hz > 0 ? "animate-pulse bg-accent" : "bg-neutral-600"
              )}
            />
            <span className="num text-[11px] text-neutral-400 uppercase tracking-wider">
              {hz > 0 ? `${hz.toFixed(0)} Hz` : "idle"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              calibrating ? stopCalibration() : startCalibration()
            }
            aria-label={calibrating ? "Stop calibration" : "Calibrate"}
            aria-pressed={calibrating}
            className={clsx(
              "flex h-11 w-11 items-center justify-center rounded-full ring-1 transition active:scale-95",
              calibrating
                ? "bg-accent text-bg shadow-glow ring-accent/40"
                : "bg-white/5 text-neutral-300 ring-white/10 hover:bg-white/10"
            )}
          >
            <Crosshair className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-neutral-300 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={running ? "Stop" : "Start"}
            className={clsx(
              "flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
              running
                ? "bg-accent-danger text-white shadow-glow-warm"
                : "bg-accent text-bg shadow-glow"
            )}
          >
            {running ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 translate-x-[1px]" fill="currentColor" />
            )}
          </button>
        </div>
      </header>

      <main className="grid grid-rows-[1fr_minmax(120px,28%)] gap-3 overflow-hidden pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pl-[max(env(safe-area-inset-left),0.75rem)] pr-[max(env(safe-area-inset-right),0.75rem)]">
        <section className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-bg-elevated to-bg-panel ring-1 ring-white/5">
          <Bowl />
        </section>

        <section className="overflow-hidden rounded-2xl bg-bg-elevated/70 p-2 ring-1 ring-white/5">
          <Plot />
        </section>
      </main>
      <Settings />
      <Calibration />
    </div>
  );
};

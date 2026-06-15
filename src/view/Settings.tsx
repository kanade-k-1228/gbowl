import { useAtom, useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import { RotateCcw, X } from "lucide-react";
import type { FC, ReactNode } from "react";
import { bowlDampingState, bowlStiffnessState } from "../state/bowl";
import { fwdTauState, speedMinState, upTauState } from "../state/frame";
import {
  soundFreqBaseState,
  soundFreqRangeState,
  soundVolumeState,
} from "../state/sound";
import { settingsOpenState } from "../state/ui";
import { Modal } from "./Modal";

export const Settings: FC = () => {
  const [open, setOpen] = useAtom(settingsOpenState);
  const close = () => setOpen(false);

  return (
    <Modal open={open} onClose={close} label="Settings">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-lg">Settings</h2>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="text-neutral-400 transition hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <Section title="Bowl">
        <BowlStiffnessSlider />
        <BowlDampingSlider />
      </Section>

      <Section title="Estimation">
        <UpTauSlider />
        <FwdTauSlider />
        <SpeedMinSlider />
      </Section>

      <Section title="Sound">
        <VolumeSlider />
        <FreqBaseSlider />
        <FreqRangeSlider />
      </Section>

      <ResetButton />
    </Modal>
  );
};

const ResetButton: FC = () => {
  const resetStiffness = useSetAtom(bowlStiffnessState);
  const resetDamping = useSetAtom(bowlDampingState);
  const resetUpTau = useSetAtom(upTauState);
  const resetFwdTau = useSetAtom(fwdTauState);
  const resetSpeedMin = useSetAtom(speedMinState);
  const resetVolume = useSetAtom(soundVolumeState);
  const resetFreqBase = useSetAtom(soundFreqBaseState);
  const resetFreqRange = useSetAtom(soundFreqRangeState);
  return (
    <button
      type="button"
      onClick={() => {
        resetStiffness(RESET);
        resetDamping(RESET);
        resetUpTau(RESET);
        resetFwdTau(RESET);
        resetSpeedMin(RESET);
        resetVolume(RESET);
        resetFreqBase(RESET);
        resetFreqRange(RESET);
      }}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3 text-neutral-300 ring-1 ring-white/5 transition hover:bg-white/[0.08] active:scale-[0.98]"
    >
      <RotateCcw className="h-4 w-4" />
      <span className="font-medium text-sm">Reset to defaults</span>
    </button>
  );
};

const Section: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-5 last:mb-0">
    <h3 className="mb-2 text-[10px] text-neutral-500 uppercase tracking-widest">
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const formatValue = (v: number): string => {
  const abs = Math.abs(v);
  if (abs === 0) return "0";
  if (abs < 0.01) return v.toExponential(2);
  if (abs < 1) return v.toFixed(3);
  if (abs < 100) return v.toFixed(2);
  return v.toFixed(1);
};

const Slider: FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit, onChange }) => (
  <label className="block">
    <div className="mb-1 flex items-baseline justify-between text-neutral-300 text-xs">
      <span>{label}</span>
      <span className="num font-mono text-neutral-100">
        {formatValue(value)}
        {unit ? <span className="ml-1 text-neutral-500">{unit}</span> : null}
      </span>
    </div>
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-accent"
    />
  </label>
);

const BowlStiffnessSlider: FC = () => {
  const [v, setV] = useAtom(bowlStiffnessState);
  return (
    <Slider
      label="Stiffness"
      value={v}
      min={0}
      max={100}
      step={1}
      onChange={setV}
    />
  );
};

const BowlDampingSlider: FC = () => {
  const [v, setV] = useAtom(bowlDampingState);
  return (
    <Slider
      label="Damping"
      value={v}
      min={0}
      max={10}
      step={0.1}
      onChange={setV}
    />
  );
};

const UpTauSlider: FC = () => {
  const [v, setV] = useAtom(upTauState);
  return (
    <Slider
      label="Up response"
      value={v}
      min={0.1}
      max={3}
      step={0.1}
      unit="s"
      onChange={setV}
    />
  );
};

const FwdTauSlider: FC = () => {
  const [v, setV] = useAtom(fwdTauState);
  return (
    <Slider
      label="Forward response"
      value={v}
      min={1}
      max={30}
      step={1}
      unit="s"
      onChange={setV}
    />
  );
};

const SpeedMinSlider: FC = () => {
  const [v, setV] = useAtom(speedMinState);
  return (
    <Slider
      label="Min speed"
      value={v}
      min={0}
      max={20}
      step={1}
      unit="m/s"
      onChange={setV}
    />
  );
};

const VolumeSlider: FC = () => {
  const [v, setV] = useAtom(soundVolumeState);
  return (
    <Slider
      label="Volume"
      value={v}
      min={0}
      max={20}
      step={0.5}
      onChange={setV}
    />
  );
};

const FreqBaseSlider: FC = () => {
  const [v, setV] = useAtom(soundFreqBaseState);
  return (
    <Slider
      label="Pitch base"
      value={v}
      min={100}
      max={1000}
      step={10}
      unit="Hz"
      onChange={setV}
    />
  );
};

const FreqRangeSlider: FC = () => {
  const [v, setV] = useAtom(soundFreqRangeState);
  return (
    <Slider
      label="Pitch range"
      value={v}
      min={0}
      max={2000}
      step={50}
      unit="Hz"
      onChange={setV}
    />
  );
};

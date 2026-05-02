import { useAtom, useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import { RotateCcw, X } from "lucide-react";
import { type FC, type ReactNode, useEffect, useRef } from "react";
import { bowlDampingState, bowlStiffnessState } from "../state/bowl";
import {
  soundFreqBaseState,
  soundFreqRangeState,
  soundVolumeState,
} from "../state/sound";
import { settingsOpenState } from "../state/ui";

export const Settings: FC = () => {
  const [open, setOpen] = useAtom(settingsOpenState);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: ESC is handled by native <dialog>.
    <dialog
      ref={ref}
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === ref.current) setOpen(false);
      }}
      className="w-full max-w-md rounded-2xl bg-bg-elevated p-6 text-neutral-100 ring-1 ring-white/10 backdrop:bg-black/60 backdrop:backdrop-blur"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-lg">Settings</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
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

      <Section title="Sound">
        <VolumeSlider />
        <FreqBaseSlider />
        <FreqRangeSlider />
      </Section>

      <ResetButton />
    </dialog>
  );
};

const ResetButton: FC = () => {
  const resetStiffness = useSetAtom(bowlStiffnessState);
  const resetDamping = useSetAtom(bowlDampingState);
  const resetVolume = useSetAtom(soundVolumeState);
  const resetFreqBase = useSetAtom(soundFreqBaseState);
  const resetFreqRange = useSetAtom(soundFreqRangeState);
  return (
    <button
      type="button"
      onClick={() => {
        resetStiffness(RESET);
        resetDamping(RESET);
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

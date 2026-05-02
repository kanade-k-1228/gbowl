import { useAtom } from "jotai";
import { X } from "lucide-react";
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
    </dialog>
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
  scale?: "linear" | "log";
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit, scale = "linear", onChange }) => {
  const isLog = scale === "log";
  const sliderMin = isLog ? Math.log(min) : min;
  const sliderMax = isLog ? Math.log(max) : max;
  const sliderValue = isLog ? Math.log(value) : value;
  const sliderStep = isLog ? (sliderMax - sliderMin) / 200 : step;

  return (
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
        value={sliderValue}
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        onChange={(e) => {
          const raw = Number(e.target.value);
          onChange(isLog ? Math.exp(raw) : raw);
        }}
        className="w-full accent-accent"
      />
    </label>
  );
};

const BowlStiffnessSlider: FC = () => {
  const [v, setV] = useAtom(bowlStiffnessState);
  return (
    <Slider
      label="Stiffness"
      value={v}
      min={0.001}
      max={100}
      step={0.001}
      scale="log"
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
      min={0.0001}
      max={10}
      step={0.0001}
      scale="log"
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

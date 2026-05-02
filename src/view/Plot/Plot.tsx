import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js";
import { useAtomValue } from "jotai";
import type { FC } from "react";
import { Line } from "react-chartjs-2";
import { accSeriesState, gyroSeriesState } from "../../state/state";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const SERIES = [
  { key: "x" as const, label: "Ax", color: "#f43f5e", source: "acc" as const },
  { key: "y" as const, label: "Ay", color: "#22c55e", source: "acc" as const },
  { key: "z" as const, label: "Az", color: "#3b82f6", source: "acc" as const },
  {
    key: "alpha" as const,
    label: "α",
    color: "#a78bfa",
    source: "gyro" as const,
  },
  {
    key: "beta" as const,
    label: "β",
    color: "#fb923c",
    source: "gyro" as const,
  },
  {
    key: "gamma" as const,
    label: "γ",
    color: "#22d3ee",
    source: "gyro" as const,
  },
];

export const Plot: FC = () => {
  const acc = useAtomValue(accSeriesState);
  const gyro = useAtomValue(gyroSeriesState);

  const datasets = SERIES.map((s) => ({
    label: s.label,
    data:
      s.source === "acc"
        ? acc[s.key as "x" | "y" | "z"]
        : gyro[s.key as "alpha" | "beta" | "gamma"],
    borderColor: s.color,
    backgroundColor: s.color,
    borderWidth: 1.2,
    pointRadius: 0,
    tension: 0.25,
  }));

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex items-center gap-2 px-1">
        {SERIES.map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="num text-[10px] text-neutral-400">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <Line
          data={{ labels: Array(50).fill(""), datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                display: false,
                grid: { display: false },
              },
              y: {
                min: -2,
                max: 2,
                grid: { color: "rgba(255,255,255,0.04)" },
                ticks: {
                  color: "rgba(255,255,255,0.3)",
                  font: { size: 9, family: "ui-monospace, monospace" },
                },
                border: { display: false },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

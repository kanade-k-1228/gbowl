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
import {
  carAccSeriesState,
  SERIES_WINDOW,
  yawRateSeriesState,
} from "../state/sensor";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const LEGEND = [
  { label: "Ax", color: "#22c55e", unit: "m/s²" },
  { label: "Ay", color: "#22d3ee", unit: "m/s²" },
  { label: "Yaw", color: "#fb923c", unit: "°/s" },
];

export const Plot: FC = () => {
  const acc = useAtomValue(carAccSeriesState);
  const yaw = useAtomValue(yawRateSeriesState);

  const datasets = [
    {
      label: "Ax",
      data: acc.ax,
      borderColor: "#22c55e",
      borderWidth: 1.2,
      pointRadius: 0,
      tension: 0.25,
      yAxisID: "y",
    },
    {
      label: "Ay",
      data: acc.ay,
      borderColor: "#22d3ee",
      borderWidth: 1.2,
      pointRadius: 0,
      tension: 0.25,
      yAxisID: "y",
    },
    {
      label: "Yaw",
      data: yaw,
      borderColor: "#fb923c",
      borderWidth: 1.2,
      pointRadius: 0,
      tension: 0.25,
      yAxisID: "y1",
    },
  ];

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex items-center gap-3 px-1">
        {LEGEND.map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="num text-[10px] text-neutral-400">
              {s.label}
              <span className="ml-1 text-neutral-600">{s.unit}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <Line
          data={{ labels: Array(SERIES_WINDOW).fill(""), datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { display: false, grid: { display: false } },
              y: {
                position: "left",
                min: -10,
                max: 10,
                grid: { color: "rgba(255,255,255,0.04)" },
                ticks: {
                  color: "rgba(255,255,255,0.3)",
                  font: { size: 9, family: "ui-monospace, monospace" },
                },
                border: { display: false },
              },
              y1: {
                position: "right",
                min: -180,
                max: 180,
                grid: { display: false },
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

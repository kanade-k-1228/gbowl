import { FC } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export const Plot: FC<{
  acc: { x: number[]; y: number[]; z: number[] };
  gyro: { alpha: number[]; beta: number[]; gamma: number[] };
}> = ({ acc, gyro }) => {
  const data = {
    labels: Array(50).fill(""), // ラベルは空の配列で埋める
    datasets: [
      { label: "Ax", data: acc.x, borderColor: "red", borderWidth: 1 },
      { label: "Ay", data: acc.y, borderColor: "green", borderWidth: 1 },
      { label: "Az", data: acc.z, borderColor: "blue", borderWidth: 1 },
      { label: "Yaw", data: gyro.alpha, borderColor: "purple", borderWidth: 1 },
      {
        label: "Pitch",
        data: gyro.beta,
        borderColor: "orange",
        borderWidth: 1,
      },
      { label: "Roll", data: gyro.gamma, borderColor: "cyan", borderWidth: 1 },
    ],
  };

  return (
    <div style={{ width: "100%" }}>
      <Line
        data={data}
        options={{
          responsive: true,
          animation: false,
          scales: { y: { beginAtZero: true, min: -50, max: 50 } },
        }}
      />
    </div>
  );
};

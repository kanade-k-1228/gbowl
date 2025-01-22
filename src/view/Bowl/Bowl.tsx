import { FC } from "react";
import { Scatter } from "react-chartjs-2";

export const Bowl: FC<{ acc: { x: number; y: number; z: number } }> = ({
  acc,
}) => {
  const data = {
    datasets: [
      {
        label: "Acceleration",
        data: [{ x: acc.x, y: acc.y }],
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
      },
    ],
  };

  return (
    <Scatter
      data={data}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Acceleration Scatter Plot",
          },
        },
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            title: {
              display: true,
              text: "X Axis",
            },
          },
          y: {
            title: {
              display: true,
              text: "Y Axis",
            },
          },
        },
      }}
    />
  );
};

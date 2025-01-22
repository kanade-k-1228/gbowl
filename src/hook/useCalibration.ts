import { useState } from "react";

const transform = (
  acc: [number, number, number],
  matrix: number[][]
): [number, number, number] => {
  const [x, y, z] = acc;
  return [
    matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
    matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
    matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z,
  ];
};

export const useCalibration = () => {
  const [matrix, setMatrix] = useState<number[][]>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);
  return {
    matrix,
    setMatrix,
    transform: (acc: [number, number, number]) => transform(acc, matrix),
  };
};

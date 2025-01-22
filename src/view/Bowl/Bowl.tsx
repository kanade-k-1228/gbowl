import { FC } from "react";

export const Bowl: FC<{ acc: { x: number; y: number; z: number } }> = ({
  acc,
}) => {
  const scale = 100;
  return (
    <svg width="100" height="100" viewBox="-100 -100 200 200">
      <circle cx={acc.x * scale} cy={acc.y * scale} r="5" fill="blue" />
      <circle cx="0" cy="0" r="25" stroke="gray" fill="none" />
      <circle cx="0" cy="0" r="50" stroke="gray" fill="none" />
      <circle cx="0" cy="0" r="75" stroke="gray" fill="none" />
      <circle cx="0" cy="0" r="100" stroke="gray" fill="none" />
    </svg>
  );
};

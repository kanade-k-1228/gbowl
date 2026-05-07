import { useAtomValue } from "jotai";
import type { FC } from "react";
import { bowlState } from "../state/bowl";
import { matrixState } from "../state/frame";

const RINGS = [0.25, 0.5, 0.75, 1.0];
const R = 100;

export const Bowl: FC = () => {
  const ball = useAtomValue(bowlState);
  const M = useAtomValue(matrixState);
  const x = ball.x * R;
  const y = ball.y * R;
  const mag = Math.min(1, Math.hypot(ball.x, ball.y));
  const dotColor = mag < 0.4 ? "#22d3ee" : mag < 0.75 ? "#f59e0b" : "#f43f5e";

  // matrixState rows are [right, forward, up] expressed in device frame
  // (orthonormal). Project each onto the screen plane: device +x → SVG +x,
  // device +y → SVG -y (SVG y is flipped). Z component is dropped.
  const right = M[0];
  const forward = M[1];
  const up = M[2];
  const rx = right[0] * R;
  const ry = -right[1] * R;
  const fx = forward[0] * R;
  const fy = -forward[1] * R;
  const ux = up[0] * R;
  const uy = -up[1] * R;

  return (
    <svg
      viewBox="-118 -118 236 236"
      className="h-full w-full max-h-[min(80vw,560px)] max-w-[min(80vw,560px)]"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="G force bowl"
    >
      <title>G force bowl</title>
      <defs>
        <radialGradient id="bowlBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1c23" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </radialGradient>
        <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={dotColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={dotColor} stopOpacity="0" />
        </radialGradient>
        <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      <circle cx="0" cy="0" r="105" fill="url(#bowlBg)" />

      {RINGS.map((r) => (
        <g key={r}>
          <circle
            cx="0"
            cy="0"
            r={r * 100}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            fill="none"
          />
          <text
            x={r * 100 + 4}
            y="3"
            fill="rgba(255,255,255,0.25)"
            fontSize="7"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {r.toFixed(2)}G
          </text>
        </g>
      ))}

      <line
        x1="-100"
        y1="0"
        x2="100"
        y2="0"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />
      <line
        x1="0"
        y1="-100"
        x2="0"
        y2="100"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />

      <line
        x1="0"
        y1="0"
        x2={rx}
        y2={ry}
        stroke="#f43f5e"
        strokeOpacity="0.7"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="0"
        x2={fx}
        y2={fy}
        stroke="#22d3ee"
        strokeOpacity="0.7"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="0"
        x2={ux}
        y2={uy}
        stroke="#fbbf24"
        strokeOpacity="0.7"
        strokeWidth="0.5"
        strokeLinecap="round"
      />

      <circle cx={x} cy={y} r="20" fill="url(#dotGlow)" />
      <circle
        cx={x}
        cy={y}
        r="6"
        fill={dotColor}
        filter="url(#dotShadow)"
        opacity="0.5"
      />
      <circle cx={x} cy={y} r="5" fill={dotColor} />
      <circle cx={x} cy={y} r="2" fill="white" />
    </svg>
  );
};

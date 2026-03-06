"use client";

interface SmokeProps {
  delayOffset?: number;
}

export default function Smoke({ delayOffset = 0 }: SmokeProps) {
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none" style={{ mixBlendMode: "multiply" }}>
      <div
        className="absolute rounded-full"
        style={{
          width: "22px",
          height: "22px",
          background: "rgba(180, 175, 170, 0.9)",
          filter: "blur(6px)",
          animation: `smoke-rise 4.5s ease-out infinite ${delayOffset}s`,
          left: "0px",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "18px",
          height: "18px",
          background: "rgba(180, 175, 170, 0.8)",
          filter: "blur(7px)",
          animation: `smoke-rise-2 5.5s ease-out infinite ${delayOffset + 1}s`,
          left: "8px",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "20px",
          height: "20px",
          background: "rgba(180, 175, 170, 0.75)",
          filter: "blur(6px)",
          animation: `smoke-rise-3 6s ease-out infinite ${delayOffset + 2}s`,
          left: "-7px",
        }}
      />
    </div>
  );
}

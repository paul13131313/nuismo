"use client";

export default function Smoke() {
  return (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none">
      <div
        className="absolute rounded-full"
        style={{
          width: "8px",
          height: "8px",
          background: "rgba(220, 220, 220, 0.5)",
          filter: "blur(5px)",
          animation: "smoke-rise 5s ease-out infinite",
          left: "0px",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "6px",
          height: "6px",
          background: "rgba(220, 220, 220, 0.4)",
          filter: "blur(6px)",
          animation: "smoke-rise-2 6s ease-out infinite 1.2s",
          left: "5px",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "7px",
          height: "7px",
          background: "rgba(220, 220, 220, 0.35)",
          filter: "blur(4px)",
          animation: "smoke-rise-3 7s ease-out infinite 2.5s",
          left: "-4px",
        }}
      />
    </div>
  );
}
